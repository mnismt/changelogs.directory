import { getRedisClient } from '@/lib/redis'
import type { CachedCursorRelease } from './types'

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export function getCacheKey(toolSlug: string): string {
	return ['cursor', 'latest-release', toolSlug].join(':')
}

export async function readCachedRelease(
	toolSlug: string,
): Promise<CachedCursorRelease | null> {
	const redis = getRedisClient()
	if (!redis) {
		return null
	}

	const cached = await redis.get<CachedCursorRelease>(getCacheKey(toolSlug))
	return cached ?? null
}

export async function writeCachedRelease(
	toolSlug: string,
	release: CachedCursorRelease,
): Promise<void> {
	const redis = getRedisClient()
	if (!redis) {
		return
	}

	if (!release.slug) return

	await redis.set(getCacheKey(toolSlug), release, {
		ex: CACHE_TTL_SECONDS,
	})
}

export async function deleteCachedRelease(toolSlug: string): Promise<void> {
	const redis = getRedisClient()
	if (!redis) return

	await redis.del(getCacheKey(toolSlug))
}
