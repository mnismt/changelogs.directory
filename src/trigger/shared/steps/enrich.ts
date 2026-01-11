import { logger } from '@trigger.dev/sdk'
import pLimit from 'p-limit'
import { CircuitBreaker } from '@/lib/enrichment/circuit-breaker'
import { enrichReleaseWithLLM } from '@/lib/enrichment/llm'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'
import type {
	EnrichmentStats,
	EnrichResult,
	FilterResult,
	IngestionContext,
} from '../types'

/**
 * Default concurrency limit for LLM calls.
 * Prevents rate limiting when processing large batches.
 */
const LLM_CONCURRENCY_LIMIT = 10

/**
 * Default circuit breaker threshold.
 * Opens after N consecutive failures.
 */
const CIRCUIT_BREAKER_THRESHOLD = 3

/**
 * Phase 5: Enrich with LLM
 *
 * Features:
 * - Controlled concurrency (p-limit) to prevent rate limiting
 * - Circuit breaker to stop hammering failed API
 * - Model fallback chain (primary → fallback)
 * - Automatic retry with exponential backoff (AI SDK built-in)
 * - Graceful degradation to keyword-based classification
 * - Detailed stats for observability
 */
export async function enrichStep(
	ctx: IngestionContext,
	filterResult: FilterResult,
	options?: {
		concurrencyLimit?: number
		circuitBreakerThreshold?: number
	},
): Promise<EnrichResult> {
	const concurrencyLimit = options?.concurrencyLimit ?? LLM_CONCURRENCY_LIMIT
	const circuitBreakerThreshold =
		options?.circuitBreakerThreshold ?? CIRCUIT_BREAKER_THRESHOLD

	logger.info('Phase 5: Enrich with LLM', {
		totalReleases: filterResult.releases.length,
		concurrencyLimit,
		circuitBreakerThreshold,
	})

	if (filterResult.releases.length === 0) {
		logger.info('No releases to enrich (all unchanged)')
		return {
			enrichedReleases: [],
			stats: {
				total: 0,
				succeeded: 0,
				failed: 0,
				circuitBreakerTriggered: 0,
				modelUsage: {},
			},
		}
	}

	// Create circuit breaker for this run
	const circuitBreaker = new CircuitBreaker({
		failureThreshold: circuitBreakerThreshold,
	})

	// Create concurrency limiter
	const limit = pLimit(concurrencyLimit)

	// Build fallback context for previous release lookup
	const fallbackContext = buildFallbackMap(filterResult.releases)

	// Track stats
	const stats: EnrichmentStats = {
		total: filterResult.releases.length,
		succeeded: 0,
		failed: 0,
		circuitBreakerTriggered: 0,
		modelUsage: {},
	}

	// Enrich with controlled concurrency
	const enrichedReleases = await Promise.all(
		filterResult.releases.map((rawRelease) =>
			limit(async () => {
				const previousRelease =
					(await findPreviousRelease(ctx, rawRelease)) ??
					buildParsedReleaseContext(fallbackContext.get(rawRelease.version))

				const result = await enrichReleaseWithLLM(rawRelease, {
					previousRelease: previousRelease ?? undefined,
					telemetry: {
						toolSlug: ctx.toolSlug,
						runId: ctx.fetchLog.id,
						source: `trigger.enrich.${ctx.toolSlug}`,
					},
					circuitBreaker,
					logger: {
						debug: (msg, meta) => logger.debug(msg, meta),
						info: (msg, meta) => logger.info(msg, meta),
						warn: (msg, meta) => logger.warn(msg, meta),
						error: (msg, meta) => logger.error(msg, meta),
					},
				})

				// Update stats
				if (result.success) {
					stats.succeeded++
					if (result.modelUsed) {
						stats.modelUsage[result.modelUsed] =
							(stats.modelUsage[result.modelUsed] ?? 0) + 1
					}
				} else {
					stats.failed++
					if (result.circuitBreakerTriggered) {
						stats.circuitBreakerTriggered++
					}
				}

				logger.debug('Release enriched', {
					version: result.release.version,
					changes: result.release.changes.length,
					success: result.success,
					modelUsed: result.modelUsed,
				})

				return result.release
			}),
		),
	)

	logger.info('LLM enrichment completed', {
		releasesEnriched: enrichedReleases.length,
		succeeded: stats.succeeded,
		failed: stats.failed,
		circuitBreakerTriggered: stats.circuitBreakerTriggered,
		circuitBreakerOpen: circuitBreaker.shouldSkip(),
		modelUsage: stats.modelUsage,
	})

	return {
		enrichedReleases,
		stats,
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

type PreviousReleaseSummary = {
	version: string
	headline?: string | null
	summary?: string | null
}

function buildFallbackMap(
	releases: ParsedRelease[],
): Map<string, ParsedRelease | undefined> {
	const sorted = [...releases].sort((a, b) =>
		a.versionSort.localeCompare(b.versionSort),
	)
	const map = new Map<string, ParsedRelease | undefined>()

	for (let i = 1; i < sorted.length; i++) {
		map.set(sorted[i].version, sorted[i - 1])
	}

	return map
}

async function findPreviousRelease(
	ctx: IngestionContext,
	release: ParsedRelease,
): Promise<PreviousReleaseSummary | undefined> {
	const previous = await ctx.prisma.release.findFirst({
		where: {
			toolId: ctx.tool.id,
			versionSort: { lt: release.versionSort },
		},
		orderBy: { versionSort: 'desc' },
	})

	if (!previous) {
		return undefined
	}

	return {
		version: previous.version,
		headline: previous.headline ?? null,
		summary: previous.summary,
	}
}

function buildParsedReleaseContext(
	release?: ParsedRelease,
): PreviousReleaseSummary | undefined {
	if (!release) return undefined
	return {
		version: release.version,
		headline: release.headline,
		summary: release.summary,
	}
}
