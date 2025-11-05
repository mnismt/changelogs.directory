import { Redis } from '@upstash/redis'

/**
 * Singleton Redis client for caching
 * Uses REDIS_URL environment variable (Upstash)
 */
let redis: Redis | null = null

/**
 * Get or create Redis client
 * Returns null if REDIS_URL is not configured (graceful degradation)
 */
export function getRedisClient(): Redis | null {
	if (!process.env.REDIS_URL) {
		return null // Graceful degradation if Redis not configured
	}

	if (!redis) {
		redis = Redis.fromEnv() // Uses REDIS_URL automatically
	}

	return redis
}
