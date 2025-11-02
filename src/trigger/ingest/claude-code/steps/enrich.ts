import { logger } from '@trigger.dev/sdk'
import { enrichReleaseWithLLM } from '@/lib/enrichment/llm'
import type { EnrichResult, FilterResult } from '../types'

/**
 * Phase 5: Enrich with LLM
 * - Classify changes using LLM (batched per release)
 * - Generate concise summaries
 * - Falls back to keyword classification if LLM unavailable
 */
export async function enrichStep(
	filterResult: FilterResult,
): Promise<EnrichResult> {
	logger.info('Phase 5: Enrich with LLM', {
		totalReleases: filterResult.releases.length,
	})

	if (filterResult.releases.length === 0) {
		logger.info('No releases to enrich (all unchanged)')
		return {
			enrichedReleases: [],
		}
	}

	// Enrich all releases in parallel (one batch call per release)
	const enrichedReleases = await Promise.all(
		filterResult.releases.map(async (rawRelease) => {
			const enriched = await enrichReleaseWithLLM(rawRelease)
			logger.debug('Release enriched', {
				version: enriched.version,
				changes: enriched.changes.length,
			})
			return enriched
		}),
	)

	logger.info('LLM enrichment completed', {
		releasesEnriched: enrichedReleases.length,
	})

	return {
		enrichedReleases,
	}
}
