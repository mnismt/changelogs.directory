import { logger } from '@trigger.dev/sdk'
import { parseGitHubReleases } from '@/lib/parsers/github-releases'
import type { FetchResult, ParseResult } from '../types'

/**
 * Phase 3: Parse
 * - Parse GitHub releases into normalized format
 * - Extract version, changes, and metadata
 * - No LLM classification yet (happens in enrich step)
 */
export function parseStep(
	fetchResult: FetchResult,
	config?: {
		versionPrefix?: string
		repositoryUrl?: string
	},
): ParseResult {
	logger.info('Phase 3: Parse GitHub releases', {
		totalReleases: fetchResult.releases.length,
	})

	const releases = parseGitHubReleases(fetchResult.releases, {
		versionPrefix: config?.versionPrefix,
		includePreReleases: true, // Already filtered in fetch step
		includeDrafts: false,
		repositoryUrl: config?.repositoryUrl,
	})

	logger.info('Releases parsed', {
		releasesFound: releases.length,
		prereleases: releases.filter((r) => r.isPrerelease).length,
		stableReleases: releases.filter((r) => !r.isPrerelease).length,
		totalChanges: releases.reduce((sum, r) => sum + r.changes.length, 0),
	})

	return { releases }
}
