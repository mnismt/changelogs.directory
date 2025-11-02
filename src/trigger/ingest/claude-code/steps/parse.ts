import { logger } from '@trigger.dev/sdk'
import { parseChangelogMd } from '@/lib/parsers/changelog-md'
import type { FetchResult, ParseResult } from '../types'

/**
 * Phase 3: Parse
 * - Extract raw structured data from markdown
 * - No LLM classification (fast, synchronous)
 */
export function parseStep(fetchResult: FetchResult): ParseResult {
	logger.info('Phase 3: Parse (extraction)')

	const releases = parseChangelogMd(fetchResult.markdown)

	logger.info('Changelog parsed', {
		releasesFound: releases.length,
	})

	return {
		releases,
	}
}
