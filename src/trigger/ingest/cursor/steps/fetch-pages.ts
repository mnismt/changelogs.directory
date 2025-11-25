import { logger } from '@trigger.dev/sdk'
import { parseCursorChangelog } from '@/lib/parsers/cursor-changelog'
import { deleteCachedRelease, readCachedRelease } from '../cache'
import { resolveSourceConfig } from '../config'
import type {
	CachedCursorRelease,
	FetchResult,
	IngestionContext,
} from '../types'

export async function fetchPagesStep(
	ctx: IngestionContext,
): Promise<FetchResult> {
	logger.info('Phase 2: Fetch Cursor changelog pages')

	const config = resolveSourceConfig(ctx.tool.sourceConfig)
	const cacheEntry = await resolveActiveCache(ctx)
	const initialScan = !cacheEntry

	const firstPass = await fetchPagesWithCache(ctx, config, cacheEntry)

	if (cacheEntry && !firstPass.cachedSlugSeen) {
		logger.info(
			'Cached slug not found within page limit, treating cache as stale',
			{
				cachedSlug: cacheEntry.slug,
				pagesFetched: firstPass.pages.length,
			},
		)

		await deleteCachedRelease(ctx.toolSlug)

		const rescan = await fetchPagesWithCache(ctx, config, null)

		return {
			pages: rescan.pages,
			cachedSlug: null,
			cacheEntry: null,
			initialScan: true,
		}
	}

	return {
		pages: firstPass.pages,
		cachedSlug: cacheEntry?.slug ?? null,
		cacheEntry: cacheEntry ?? null,
		initialScan,
	}
}

async function resolveActiveCache(
	ctx: IngestionContext,
): Promise<CachedCursorRelease | null> {
	if (ctx.forceFullRescan) {
		logger.info('Force full rescan requested, bypassing cache')
		return null
	}

	const cacheEntry = await readCachedRelease(ctx.toolSlug)
	if (!cacheEntry) {
		return null
	}

	const releaseCount = await ctx.prisma.release.count({
		where: { toolId: ctx.tool.id },
	})

	if (releaseCount === 0) {
		logger.info(
			'No releases found in DB, clearing cache and running full scan',
			{
				cachedSlug: cacheEntry.slug,
			},
		)
		await deleteCachedRelease(ctx.toolSlug)
		return null
	}

	const cachedVersion = `cursor-${cacheEntry.slug}`
	const cachedRelease = await ctx.prisma.release.findFirst({
		where: { toolId: ctx.tool.id, version: cachedVersion },
		select: { id: true },
	})

	if (!cachedRelease) {
		logger.info('Cached release missing from DB, treating cache as stale', {
			cachedSlug: cacheEntry.slug,
		})
		await deleteCachedRelease(ctx.toolSlug)
		return null
	}

	return cacheEntry
}

async function fetchPagesWithCache(
	ctx: IngestionContext,
	config: ReturnType<typeof resolveSourceConfig>,
	cacheEntry: CachedCursorRelease | null,
): Promise<{ pages: FetchResult['pages']; cachedSlugSeen: boolean }> {
	const useCache = Boolean(cacheEntry?.slug)
	const maxPages = useCache ? config.maxPagesPerRun : config.initialPageCount

	const pages: FetchResult['pages'] = []
	let pageNumber = 1
	let stop = false
	let cachedSlugSeen = false

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

		if (useCache && cacheEntry?.slug) {
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
				cachedSlugSeen = true
				stop = true
			}
		}

		if (!stop) {
			pageNumber++
		}
	}

	return {
		pages,
		cachedSlugSeen,
	}
}

function buildPageUrl(baseUrl: string, pageNumber: number): string {
	const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	if (pageNumber <= 1) {
		return normalized
	}
	return `${normalized}/page/${pageNumber}`
}
