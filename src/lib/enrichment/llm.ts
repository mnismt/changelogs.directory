import { z } from 'zod'
import type { ChangeType, ImpactLevel } from '@/generated/prisma/client'
import { hasAvailableModels } from '@/lib/llm/models'
import { buildBraintrustTelemetry } from '@/lib/llm/telemetry'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'
import type { CircuitBreaker } from './circuit-breaker'
import {
	generateObjectWithFallback,
	type LLMLogger,
	type ResilientLLMResult,
} from './resilient-llm'

/**
 * LLM-based enrichment for changelog releases
 * Source-agnostic: works with any ParsedRelease regardless of origin
 * (markdown, GitHub releases, RSS, API, etc.)
 *
 * Now with resilient retry + model fallback support.
 */

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Zod schema for a single classified change
 */
const classifiedChangeSchema = z.object({
	order: z.number().describe('The order/index of this change (0-based)'),
	type: z
		.enum([
			'FEATURE',
			'BUGFIX',
			'IMPROVEMENT',
			'BREAKING',
			'SECURITY',
			'DEPRECATION',
			'PERFORMANCE',
			'DOCUMENTATION',
			'OTHER',
		])
		.describe('The type of change'),
	impact: z.enum(['MAJOR', 'MINOR', 'PATCH']).describe('Impact level'),
	isBreaking: z.boolean().describe('Whether this breaks compatibility'),
	isSecurity: z.boolean().describe('Whether this is security-related'),
	isDeprecation: z.boolean().describe('Whether this deprecates functionality'),
})

/**
 * Zod schema for batch release enrichment
 * Processes all changes + summary in ONE LLM call
 */
const releaseEnrichmentSchema = z.object({
	headline: z
		.string()
		.max(140)
		.describe('Single sentence (<=120 chars) card headline'),
	summary: z
		.string()
		.max(400)
		.describe('Concise 1-2 sentence summary for detail view'),
	keyHighlights: z.array(z.string()).max(3).describe('Up to 3 key highlights'),
	changes: z
		.array(classifiedChangeSchema)
		.describe('Classified changes with order preserved'),
})

type ReleaseEnrichment = z.infer<typeof releaseEnrichmentSchema>

// ============================================================================
// Types
// ============================================================================

interface PreviousReleaseContext {
	version: string
	headline?: string | null
	summary?: string | null
}

export interface EnrichReleaseOptions {
	previousRelease?: PreviousReleaseContext
	telemetry?: {
		toolSlug?: string
		runId?: string
		source?: string
	}
	/** Circuit breaker for tracking consecutive failures */
	circuitBreaker?: CircuitBreaker
	/** Logger instance (defaults to console) */
	logger?: LLMLogger
}

export interface EnrichReleaseResult {
	release: ParsedRelease
	success: boolean
	modelUsed: string | null
	circuitBreakerTriggered: boolean
}

// ============================================================================
// Enrichment Function
// ============================================================================

/**
 * Enriches a release with LLM-based classification and summary.
 *
 * Features:
 * - Processes ALL changes + summary in ONE batch LLM call for efficiency
 * - Automatic retry with exponential backoff (AI SDK built-in)
 * - Model fallback chain (gemini-2.5-flash-lite → gemini-2.5-flash)
 * - Circuit breaker to prevent hammering failed API
 * - Falls back to keyword-based classification if all else fails
 * - Source-agnostic: works with any ParsedRelease
 *
 * @param release - Raw parsed release from any source
 * @param options - Configuration options including circuit breaker
 * @returns Enriched release with LLM classifications and enrichment metadata
 */
export async function enrichReleaseWithLLM(
	release: ParsedRelease,
	options?: EnrichReleaseOptions,
): Promise<EnrichReleaseResult> {
	const logger = options?.logger ?? {
		debug: console.debug,
		info: console.info,
		warn: console.warn,
		error: console.error,
	}

	// Check if LLM is available
	if (!hasAvailableModels()) {
		logger.warn(
			`LLM not available for ${release.version}, keeping keyword-based classification`,
		)
		return {
			release,
			success: false,
			modelUsed: null,
			circuitBreakerTriggered: false,
		}
	}

	// Build prompt
	const prompt = buildEnrichmentPrompt(release, options?.previousRelease)

	// Build telemetry settings
	const telemetry = buildBraintrustTelemetry({
		toolSlug: options?.telemetry?.toolSlug,
		releaseVersion: release.version,
		ingestionRunId: options?.telemetry?.runId,
		source: options?.telemetry?.source ?? 'ingestion.enrich',
		previousVersion: options?.previousRelease?.version,
	})

	// Call LLM with retry and fallback
	const result: ResilientLLMResult<ReleaseEnrichment> =
		await generateObjectWithFallback<ReleaseEnrichment>(
			releaseEnrichmentSchema,
			prompt,
			{
				temperature: 0.3,
				telemetry,
				circuitBreaker: options?.circuitBreaker,
				logger,
			},
		)

	// Handle failure
	if (!result.success) {
		logger.warn(
			`LLM enrichment failed for ${release.version}, keeping keyword-based classification`,
			{
				error: result.error?.message,
				circuitBreakerTriggered: result.circuitBreakerTriggered,
			},
		)
		return {
			release,
			success: false,
			modelUsed: null,
			circuitBreakerTriggered: result.circuitBreakerTriggered ?? false,
		}
	}

	// Apply LLM classifications to changes
	const enrichedChanges = release.changes.map((change) => {
		// Find matching classification by order
		const classification = result.data?.changes.find(
			(c) => c.order === change.order,
		)

		if (classification) {
			return {
				...change,
				type: classification.type as ChangeType,
				impact: classification.impact as ImpactLevel,
				isBreaking: classification.isBreaking,
				isSecurity: classification.isSecurity,
				isDeprecation: classification.isDeprecation,
			}
		}

		// No classification found, keep original
		return change
	})

	// Return enriched release
	return {
		release: {
			...release,
			headline: result.data?.headline ?? release.headline,
			summary: result.data?.summary ?? release.summary,
			changes: enrichedChanges,
		},
		success: true,
		modelUsed: result.modelUsed ?? null,
		circuitBreakerTriggered: false,
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildEnrichmentPrompt(
	release: ParsedRelease,
	previousRelease?: PreviousReleaseContext,
): string {
	// Build changes list for prompt
	const changesText = release.changes
		.map(
			(c, i) =>
				`${i}. "${c.title}"${c.description ? ` - ${c.description}` : ''}`,
		)
		.join('\n')

	const previousContext = formatPreviousRelease(previousRelease)

	return `You are analyzing a software release changelog. Please classify ALL changes and generate a summary.

Version: ${release.version}
Release Date: ${release.releaseDate?.toISOString().split('T')[0] || 'N/A'}
Previous Version Context: ${previousContext.description}

Full Release Notes:
${release.rawContent.substring(0, 2000)}

Changes to classify (by index):
${changesText}

Tone + style rules:
- Audience is other engineers. Be specific, concrete, and honest.
- Max 1 short headline (<=120 characters) plus a 1-2 sentence summary.
- Professional but casual. No marketing fluff, no "overall", "enhances", or vague praise.
- Highlight what changed compared to the previous version, not how great the product is.
- If a change fixes or reverts something from the previous release, mention it directly.
- Avoid dark humor or sarcasm.
- Use active voice.

Examples:
- Bad headline: "This release introduces several improvements and bug fixes that enhance overall stability."
- Good headline: "Fixes Linux startup after 0.54.x and calms codex_delegate noise."
- Bad summary: "This version significantly enhances usability and stability for all users."
- Good summary: "Adds Ctrl-Y to restore deleted text, clarifies usage-limit warnings, and fixes the subagent permission slip."

For EACH change, classify based on:
- FEATURE: New functionality or capabilities
- BUGFIX: Fixes for defects or incorrect behavior
- IMPROVEMENT: Enhancements to existing features
- BREAKING: Changes that break backward compatibility
- SECURITY: Security fixes or vulnerability patches
- DEPRECATION: Marking features for future removal
- PERFORMANCE: Performance optimizations
- DOCUMENTATION: Documentation changes
- OTHER: Anything else

Impact levels:
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes, improvements, documentation

Also generate:
1. Headline: <=120 characters, specific, written for cards.
2. Summary: 1-2 sentences highlighting what is new or fixed versus ${previousContext.versionText}.
3. Up to 3 key highlights (optional).

Return the changes array with the SAME order/indices as provided.`
}

function formatPreviousRelease(previous?: PreviousReleaseContext): {
	description: string
	versionText: string
} {
	if (!previous) {
		return {
			description:
				'No previous version context available. Treat this as a net-new release.',
			versionText: 'the prior release',
		}
	}

	const summarySnippet = [previous.headline, previous.summary]
		.filter((value) => value && value.trim().length > 0)
		.join(' — ')
		.slice(0, 200)

	return {
		description: `Version ${previous.version}${
			summarySnippet ? `: ${summarySnippet}` : ''
		}`,
		versionText: `v${previous.version}`,
	}
}
