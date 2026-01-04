import { logger } from '@trigger.dev/sdk'
import { parseAntigravityChangelog } from '@/lib/parsers/antigravity-changelog'
import { resolveSourceConfig } from '../config'
import type { FetchResult, IngestionContext, ParseResult } from '../types'

export function parseStep(
	ctx: IngestionContext,
	fetchResult: FetchResult,
): ParseResult {
	logger.info('Phase 3: Parse Antigravity changelog page')

	const config = resolveSourceConfig(ctx.tool.sourceConfig)
	const releases: ParseResult['releases'] = []
	let newestRelease: ParseResult['newestRelease'] = null
	let encounteredCached = false

	const parsed = parseAntigravityChangelog(fetchResult.page.html, {
		baseUrl: config.baseUrl,
		startPath: config.startPath,
	})

	for (const release of parsed) {
		const slug = extractSlugFromVersion(release.version)

		if (!newestRelease) {
			newestRelease = {
				slug,
				contentHash: release.contentHash,
				releaseDate: release.releaseDate?.toISOString(),
			}
		}

		releases.push(release)

		if (fetchResult.cachedSlug && slug === fetchResult.cachedSlug) {
			encounteredCached = true
			logger.info('Reached cached release, stopping parse', {
				slug,
			})
			break
		}

		if (
			config.maxReleasesPerRun &&
			releases.length >= config.maxReleasesPerRun
		) {
			logger.info('Reached max releases per run limit, stopping parse', {
				limit: config.maxReleasesPerRun,
			})
			break
		}
	}

	logger.info('Parsing complete', {
		releasesParsed: releases.length,
		reachedCached: encounteredCached,
	})

	return {
		releases,
		newestRelease,
	}
}

function extractSlugFromVersion(version: string): string {
	return version.replace(/^antigravity-/, '')
}
