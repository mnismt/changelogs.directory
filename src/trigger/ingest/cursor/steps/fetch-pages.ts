import { logger } from '@trigger.dev/sdk'
import { parseCursorChangelog } from '@/lib/parsers/cursor-changelog'
import { readCachedRelease } from '../cache'
import { resolveSourceConfig } from '../config'
import type { FetchResult, IngestionContext } from '../types'

export async function fetchPagesStep(
	ctx: IngestionContext,
): Promise<FetchResult> {
	logger.info('Phase 2: Fetch Cursor changelog pages')

	const config = resolveSourceConfig(ctx.tool.sourceConfig)
	const cacheEntry = await readCachedRelease(ctx.toolSlug)
	const maxPages = cacheEntry ? config.maxPagesPerRun : config.initialPageCount

	const pages: FetchResult['pages'] = []
	let pageNumber = 1
	let stop = false

	while (pageNumber <= maxPages && !stop) {
		const pageUrl = buildPageUrl(ctx.tool.sourceUrl, pageNumber)
		logger.info('Fetching changelog page', { pageNumber, pageUrl })

		const response = await fetch(pageUrl, {
			headers: {
				Accept: 'text/html,application/xhtml+xml',
				'Cache-Control': 'no-cache',
				'User-Agent':
					'ChangelogsDirectoryBot/1.0 (+https://changelogs.directory)',
			},
		})

		if (response.status === 404) {
			logger.info('Reached end of available changelog pages', { pageNumber })
			break
		}

		if (!response.ok) {
			throw new Error(
				`Failed to fetch Cursor changelog page: ${pageUrl} (status ${response.status})`,
			)
		}

		const html = await response.text()
		pages.push({ url: pageUrl, pageNumber, html })

		if (cacheEntry?.slug) {
			const parsed = parseCursorChangelog(html, {
				baseUrl: config.baseUrl,
				articleSelector: config.articleSelector,
				bodySelector: config.bodySelector,
			})
			const slugsOnPage = parsed.map((r) => r.version.replace(/^cursor-/, ''))

			if (slugsOnPage.includes(cacheEntry.slug)) {
				logger.info('Encountered cached slug, stopping pagination', {
					cachedSlug: cacheEntry.slug,
					pageNumber,
					articlesOnPage: slugsOnPage.length,
				})
				stop = true
			} else {
				pageNumber++
			}
		} else {
			pageNumber++
		}
	}

	return {
		pages,
		cachedSlug: cacheEntry?.slug ?? null,
		cacheEntry: cacheEntry ?? null,
		initialScan: !cacheEntry,
	}
}

function buildPageUrl(baseUrl: string, pageNumber: number): string {
	const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	if (pageNumber <= 1) {
		return normalized
	}
	return `${normalized}/page/${pageNumber}`
}
