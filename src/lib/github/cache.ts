import { logger } from '@trigger.dev/sdk'
import { getRedisClient } from '@/lib/redis'
import type { GitHubRelease } from '../parsers/github-releases'
import type { GitHubCommitDetail } from './api'

const CACHE_TTL = 60 * 60 * 24 * 90 // 90 days in seconds
const COMMIT_CACHE_PREFIX = 'github:commit'
const RELEASE_CACHE_PREFIX = 'github:release'
const ETAG_CACHE_PREFIX = 'github:etag'

/**
 * Generate cache key for commit detail
 * Format: github:commit:{owner}:{repo}:{sha}
 */
export function getCommitCacheKey(
	owner: string,
	repo: string,
	sha: string,
): string {
	return `${COMMIT_CACHE_PREFIX}:${owner}:${repo}:${sha}`
}

/**
 * Generate cache key for releases list
 * Format: github:release:{owner}:{repo}:list
 */
export function getReleasesCacheKey(owner: string, repo: string): string {
	return `${RELEASE_CACHE_PREFIX}:${owner}:${repo}:list`
}

/**
 * Generate cache key for ETag
 * Format: github:etag:{owner}:{repo}:releases
 */
export function getEtagCacheKey(owner: string, repo: string): string {
	return `${ETAG_CACHE_PREFIX}:${owner}:${repo}:releases`
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
	const cacheKey = getCommitCacheKey(owner, repo, sha)

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

/**
 * Cached releases list result with ETag support
 */
export interface CachedReleasesResult {
	/** Cached releases (null if not in cache) */
	releases: GitHubRelease[] | null
	/** Cached ETag for conditional requests */
	etag: string | null
}

/**
 * Get cached releases list and ETag
 * @param owner Repository owner
 * @param repo Repository name
 * @returns Cached releases and ETag (both null if cache miss)
 */
export async function getCachedReleases(
	owner: string,
	repo: string,
): Promise<CachedReleasesResult> {
	const redis = getRedisClient()

	if (!redis) {
		return { releases: null, etag: null }
	}

	try {
		const releasesCacheKey = getReleasesCacheKey(owner, repo)
		const etagCacheKey = getEtagCacheKey(owner, repo)

		const [cachedReleases, cachedEtag] = await Promise.all([
			redis.get<GitHubRelease[]>(releasesCacheKey),
			redis.get<string>(etagCacheKey),
		])

		if (cachedReleases) {
			logger.info('Releases cache HIT', {
				owner,
				repo,
				count: cachedReleases.length,
				hasEtag: !!cachedEtag,
			})
			return { releases: cachedReleases, etag: cachedEtag || null }
		}

		logger.info('Releases cache MISS', { owner, repo })
		return { releases: null, etag: cachedEtag || null }
	} catch (error) {
		logger.warn('Redis get failed for releases', {
			error: error instanceof Error ? error.message : String(error),
			owner,
			repo,
		})
		return { releases: null, etag: null }
	}
}

/**
 * Strip unnecessary fields from GitHub release to reduce cache size
 * GitHub API returns ~50 fields per release, we only need 7
 */
function stripReleaseFields(release: GitHubRelease): GitHubRelease {
	return {
		tag_name: release.tag_name,
		name: release.name,
		body: release.body,
		prerelease: release.prerelease,
		draft: release.draft,
		published_at: release.published_at,
		html_url: release.html_url,
	}
}

/**
 * Cache releases list with ETag
 * - Strips unnecessary fields to reduce payload size (10MB Redis limit)
 * - Original GitHub API response can be 10+ MB with all metadata
 * - Stripped version keeps only 7 essential fields (~70% size reduction)
 * @param owner Repository owner
 * @param repo Repository name
 * @param releases Releases to cache
 * @param etag ETag from GitHub API response
 */
export async function setCachedReleases(
	owner: string,
	repo: string,
	releases: GitHubRelease[],
	etag: string | null,
): Promise<void> {
	const redis = getRedisClient()

	if (!redis) {
		return
	}

	try {
		const releasesCacheKey = getReleasesCacheKey(owner, repo)
		const etagCacheKey = getEtagCacheKey(owner, repo)

		// Strip unnecessary fields to reduce payload size
		const strippedReleases = releases.map(stripReleaseFields)
		const payload = JSON.stringify(strippedReleases)
		const sizeBytes = new TextEncoder().encode(payload).length
		const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2)

		// Upstash Redis limit: 10MB per request
		if (sizeBytes > 10 * 1024 * 1024) {
			logger.warn('Releases payload too large for Redis cache, skipping', {
				owner,
				repo,
				count: releases.length,
				sizeMB,
				limit: '10MB',
			})
			// Still cache ETag for conditional requests
			if (etag) {
				await redis.set(etagCacheKey, etag, { ex: CACHE_TTL })
			}
			return
		}

		await Promise.all([
			redis.set(releasesCacheKey, payload, { ex: CACHE_TTL }),
			etag
				? redis.set(etagCacheKey, etag, { ex: CACHE_TTL })
				: Promise.resolve(),
		])

		logger.info('Cached releases list', {
			owner,
			repo,
			count: releases.length,
			sizeMB,
			hasEtag: !!etag,
			ttl: CACHE_TTL,
		})
	} catch (error) {
		logger.warn('Redis set failed for releases', {
			error: error instanceof Error ? error.message : String(error),
			owner,
			repo,
		})
		// Non-blocking - continue even if cache write fails
	}
}
