import { logger } from '@trigger.dev/sdk'
import { fetchRenderedPage } from '../browser'
import { deleteCachedRelease, readCachedRelease } from '../cache'
import { resolveSourceConfig } from '../config'
import type {
	CachedAntigravityRelease,
	FetchResult,
	IngestionContext,
} from '../types'

export async function fetchPageStep(
	ctx: IngestionContext,
): Promise<FetchResult> {
	logger.info('Phase 2: Fetch Antigravity changelog page')

	const config = resolveSourceConfig(ctx.tool.sourceConfig)
	const cacheEntry = await resolveActiveCache(ctx)
	const initialScan = !cacheEntry

	const pageUrl = buildPageUrl(ctx.tool.sourceUrl, config)
	logger.info('Fetching Antigravity changelog with Playwright', { pageUrl })

	const html = await fetchRenderedPage(pageUrl, {
		waitForSelector: '.grid-body.grid-container',
		waitForTimeout: 5000,
	})

	return {
		page: { url: pageUrl, html },
		cachedSlug: cacheEntry?.slug ?? null,
		cacheEntry: cacheEntry ?? null,
		initialScan,
	}
}

async function resolveActiveCache(
	ctx: IngestionContext,
): Promise<CachedAntigravityRelease | null> {
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

	const cachedVersion = `antigravity-${cacheEntry.slug}`
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

function buildPageUrl(
	sourceUrl: string | null,
	config: ReturnType<typeof resolveSourceConfig>,
): string {
	if (sourceUrl) return sourceUrl
	const normalizedBase = config.baseUrl.endsWith('/')
		? config.baseUrl.slice(0, -1)
		: config.baseUrl
	const normalizedPath = config.startPath.startsWith('/')
		? config.startPath
		: `/${config.startPath}`
	return `${normalizedBase}${normalizedPath}`
}
