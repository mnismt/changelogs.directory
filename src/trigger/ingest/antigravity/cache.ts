import { getRedisClient } from '@/lib/redis'
import type { CachedAntigravityRelease } from './types'

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getCacheNamespace(): string {
	const namespace =
		process.env.CACHE_NAMESPACE || process.env.NODE_ENV || 'prod'
	return namespace.replace(/[^a-zA-Z0-9-_]/g, '-')
}

export function getCacheKey(toolSlug: string): string {
	const namespace = getCacheNamespace()
	return ['antigravity', namespace, 'latest-release', toolSlug].join(':')
}

export async function readCachedRelease(
	toolSlug: string,
): Promise<CachedAntigravityRelease | null> {
	const redis = getRedisClient()
	if (!redis) {
		return null
	}

	const cached = await redis.get<CachedAntigravityRelease>(
		getCacheKey(toolSlug),
	)
	return cached ?? null
}

export async function writeCachedRelease(
	toolSlug: string,
	release: CachedAntigravityRelease,
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
