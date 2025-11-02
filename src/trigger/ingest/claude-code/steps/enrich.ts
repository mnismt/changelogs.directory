import { logger } from '@trigger.dev/sdk'
import { enrichReleaseWithLLM } from '@/lib/enrichment/llm'
import type { EnrichResult, ParseResult } from '../types'

/**
 * Phase 3.5: Enrich with LLM
 * - Classify changes using LLM (batched per release)
 * - Generate concise summaries
 * - Falls back to keyword classification if LLM unavailable
 */
export async function enrichStep(
	parseResult: ParseResult,
): Promise<EnrichResult> {
	logger.info('Phase 3.5: Enrich with LLM', {
		totalReleases: parseResult.releases.length,
	})

	// Enrich each release with LLM (one batch call per release)
	const enrichedReleases = []

	for (const rawRelease of parseResult.releases) {
		const enriched = await enrichReleaseWithLLM(rawRelease)
		enrichedReleases.push(enriched)

		logger.debug('Release enriched', {
			version: enriched.version,
			changes: enriched.changes.length,
		})
	}

	logger.info('LLM enrichment completed', {
		releasesEnriched: enrichedReleases.length,
	})

	return {
		enrichedReleases,
	}
}
