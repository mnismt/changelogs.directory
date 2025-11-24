import { logger } from '@trigger.dev/sdk'
import { parseCursorChangelog } from '@/lib/parsers/cursor-changelog'
import { resolveSourceConfig } from '../config'
import type { FetchResult, IngestionContext, ParseResult } from '../types'

export function parseStep(
	ctx: IngestionContext,
	fetchResult: FetchResult,
): ParseResult {
	logger.info('Phase 3: Parse Cursor changelog pages', {
		pagesFetched: fetchResult.pages.length,
	})

	const config = resolveSourceConfig(ctx.tool.sourceConfig)
	const releases: ParseResult['releases'] = []
	let newestRelease: ParseResult['newestRelease'] = null
	let encounteredCached = false

	for (const page of fetchResult.pages) {
		const parsed = parseCursorChangelog(page.html, {
			baseUrl: config.baseUrl,
			articleSelector: config.articleSelector,
			bodySelector: config.bodySelector,
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
		}

		if (encounteredCached) {
			break
		}
	}

	logger.info('Parsing complete', {
		releasesParsed: releases.length,
	})

	return {
		releases,
		newestRelease,
	}
}

function extractSlugFromVersion(version: string): string {
	return version.replace(/^cursor-/, '')
}
