import type { ChangeType, ImpactLevel } from '@prisma/client'
import { generateObject } from 'ai'
import { z } from 'zod'
import { llm } from '@/lib/llm'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

/**
 * LLM-based enrichment for changelog releases
 * Source-agnostic: works with any ParsedRelease regardless of origin
 * (markdown, GitHub releases, RSS, API, etc.)
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

// ============================================================================
// Enrichment Function
// ============================================================================

/**
 * Enriches a release with LLM-based classification and summary
 *
 * Features:
 * - Processes ALL changes + summary in ONE batch LLM call for efficiency
 * - Falls back to keyword-based classification if LLM unavailable or fails
 * - Source-agnostic: works with any ParsedRelease
 *
 * @param release - Raw parsed release from any source
 * @returns Enriched release with LLM classifications and summary
 */
interface PreviousReleaseContext {
	version: string
	headline?: string | null
	summary?: string | null
}

export async function enrichReleaseWithLLM(
	release: ParsedRelease,
	options?: { previousRelease?: PreviousReleaseContext },
): Promise<ParsedRelease> {
	// Check if LLM is available
	if (!llm) {
		console.warn(
			`LLM not available for ${release.version}, keeping keyword-based classification`,
		)
		return release
	}

	try {
		// Build changes list for prompt
		const changesText = release.changes
			.map(
				(c, i) =>
					`${i}. "${c.title}"${c.description ? ` - ${c.description}` : ''}`,
			)
			.join('\n')

		const previousContext = formatPreviousRelease(options?.previousRelease)

		// Build comprehensive prompt for batch processing
		const prompt = `You are analyzing a software release changelog. Please classify ALL changes and generate a summary.

Version: ${release.version}
Release Date: ${release.releaseDate?.toISOString().split('T')[0] || 'N/A'}
Previous Version Context: ${previousContext.description}

Full Release Notes:
${release.rawContent.substring(0, 2000)}

Changes to classify (by index):
${changesText}

Tone + style rules:
- Audience is other engineers. Be specific, concrete, and honest.
- Max 1 short headline (120 characters or less) plus a 1-2 sentence summary.
- Professional but casual. No marketing fluff, no "overall", "enhances", or vague praise.
- Highlight what changed compared to the previous version, not how great the product is.
- If a change fixes or reverts something from the previous release, mention it directly.
- Avoid dark humor or sarcasm.
- Use active voice.

Examples:
- Bad headline: "This release introduces several improvements and bug fixes that enhance overall stability."
- Good headline: "Fixes Linux startup after 0.54.x and calms codex_delegate noise."
- Bad summary: "This version significantly enhances usability and stability for all users."
- Good summary: "Adds Ctrl-Y to restore deleted edits, clarifies usage-limit warnings, and fixes the subagent permission slip."

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

		const result = await generateObject({
			model: llm,
			schema: releaseEnrichmentSchema,
			prompt,
			temperature: 0.3,
		})

		// Apply LLM classifications to changes
		const enrichedChanges = release.changes.map((change) => {
			// Find matching classification by order
			const classification = result.object.changes.find(
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
			...release,
			headline: result.object.headline,
			summary: result.object.summary,
			changes: enrichedChanges,
		}
	} catch (error) {
		console.warn(
			`LLM enrichment failed for ${release.version}, keeping keyword-based classification`,
			error,
		)
		return release
	}
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
