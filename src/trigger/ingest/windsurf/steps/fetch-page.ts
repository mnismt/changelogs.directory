import { logger } from '@trigger.dev/sdk'
import { deleteCachedRelease, readCachedRelease } from '../cache'
import { resolveSourceConfig } from '../config'
import type {
	CachedWindsurfRelease,
	FetchResult,
	IngestionContext,
} from '../types'

export async function fetchPageStep(
	ctx: IngestionContext,
): Promise<FetchResult> {
	logger.info('Phase 2: Fetch Windsurf changelog page')

	const config = resolveSourceConfig(ctx.tool.sourceConfig)
	const cacheEntry = await resolveActiveCache(ctx)
	const initialScan = !cacheEntry

	const pageUrl = buildPageUrl(ctx.tool.sourceUrl, config)
	logger.info('Fetching Windsurf changelog', { pageUrl })

	const response = await fetch(pageUrl, {
		headers: {
			Accept: 'text/html,application/xhtml+xml',
			'Cache-Control': 'no-cache',
			'User-Agent':
				'ChangelogsDirectoryBot/1.0 (+https://changelogs.directory)',
		},
	})

	if (!response.ok) {
		throw new Error(
			`Failed to fetch Windsurf changelog page: ${pageUrl} (status ${response.status})`,
		)
	}

	const html = await response.text()
	return {
		page: { url: pageUrl, html },
		cachedSlug: cacheEntry?.slug ?? null,
		cacheEntry: cacheEntry ?? null,
		initialScan,
	}
}

async function resolveActiveCache(
	ctx: IngestionContext,
): Promise<CachedWindsurfRelease | null> {
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

	const cachedVersion = `windsurf-${cacheEntry.slug}`
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
