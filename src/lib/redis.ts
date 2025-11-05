import { Redis } from '@upstash/redis'

/**
 * Singleton Redis client for caching
 */
let redis: Redis | null = null

/**
 * Get or create Redis client
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables
 */
export function getRedisClient(): Redis | null {
	// Upstash Redis.fromEnv() looks for UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
	if (
		!process.env.UPSTASH_REDIS_REST_URL ||
		!process.env.UPSTASH_REDIS_REST_TOKEN
	) {
		return null // Graceful degradation if Redis not configured
	}

	if (!redis) {
		redis = Redis.fromEnv() // Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
	}

	return redis
}
