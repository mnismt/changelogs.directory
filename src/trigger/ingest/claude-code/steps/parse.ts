import { logger } from '@trigger.dev/sdk'
import { parseChangelogMd } from '@/lib/parsers/changelog-md'
import type { FetchDatesResult, FetchResult, ParseResult } from '../types'

/**
 * Phase 3: Parse
 * - Extract raw structured data from markdown
 * - No LLM classification (fast, synchronous)
 * - Accepts optional version dates from Git history
 */
export function parseStep(
	fetchResult: FetchResult,
	fetchDatesResult?: FetchDatesResult,
): ParseResult {
	logger.info('Phase 3: Parse (extraction)', {
		hasVersionDates: !!fetchDatesResult?.versionDates.size,
		versionDatesCount: fetchDatesResult?.versionDates.size ?? 0,
	})

	const releases = parseChangelogMd(
		fetchResult.markdown,
		fetchDatesResult?.versionDates,
	)

	logger.info('Changelog parsed', {
		releasesFound: releases.length,
	})

	return {
		releases,
	}
}
