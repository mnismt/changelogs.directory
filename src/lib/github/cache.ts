import { logger } from '@trigger.dev/sdk'
import { getRedisClient } from '@/lib/redis'
import type { GitHubCommitDetail } from './api'

const CACHE_TTL = 60 * 60 * 24 * 90 // 90 days in seconds
const CACHE_PREFIX = 'github:commit'

/**
 * Generate cache key for commit detail
 * Format: github:commit:{owner}:{repo}:{sha}
 */
export function getCacheKey(owner: string, repo: string, sha: string): string {
	return `${CACHE_PREFIX}:${owner}:${repo}:${sha}`
}

/**
 * Fetch commit detail with Redis cache layer
 * - Checks Redis first (cache hit)
 * - Falls back to GitHub API (cache miss)
 * - Caches result for 90 days
 * - Gracefully degrades if Redis unavailable
 *
 * @param owner Repository owner (e.g., "anthropics")
 * @param repo Repository name (e.g., "claude-code")
 * @param sha Commit SHA (immutable identifier)
 * @param fetchFn Function to fetch from GitHub API (only called on cache miss)
 * @returns Commit detail from cache or GitHub API
 */
export async function getCachedCommitDetail(
	owner: string,
	repo: string,
	sha: string,
	fetchFn: () => Promise<GitHubCommitDetail>,
): Promise<GitHubCommitDetail> {
	const redis = getRedisClient()
	const cacheKey = getCacheKey(owner, repo, sha)

	if (!redis) {
		logger.log('Redis is not available, using GitHub API', { cacheKey })
	}

	// Try Redis first
	if (redis) {
		try {
			const cached = await redis.get<GitHubCommitDetail>(cacheKey)
			if (cached) {
				logger.info('Cache HIT', { sha: sha.substring(0, 7), cacheKey })
				return cached
			}
		} catch (error) {
			logger.warn('Redis get failed, using GitHub API', {
				error: error instanceof Error ? error.message : String(error),
				cacheKey,
			})
			// Continue to fetch from GitHub (graceful degradation)
		}
	}

	// Cache miss or Redis unavailable - fetch from GitHub
	logger.info('Cache MISS', { sha: sha.substring(0, 7), cacheKey })
	const data = await fetchFn()

	// Store in Redis for next time
	if (redis) {
		try {
			await redis.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL })
			logger.info('Cached commit detail', {
				sha: sha.substring(0, 7),
				ttl: CACHE_TTL,
			})
		} catch (error) {
			logger.warn('Redis set failed, continuing', {
				error: error instanceof Error ? error.message : String(error),
				cacheKey,
			})
			// Non-blocking - continue even if cache write fails
		}
	}

	return data
}
