import { getEtagCacheKey, getReleasesCacheKey } from "@/lib/github/cache"
import { getRedisClient } from "@/lib/redis"

async function main() {
	const [owner, repo] = process.argv.slice(2)

	if (!owner || !repo) {
		console.error(
			"Usage: pnpm tsx scripts/clear-github-cache.ts <owner> <repo>",
		)
		process.exit(1)
	}

	const redis = getRedisClient()
	if (!redis) {
		console.error("Redis not configured")
		process.exit(1)
	}

	const releasesCacheKey = getReleasesCacheKey(owner, repo)
	const etagCacheKey = getEtagCacheKey(owner, repo)

	const [releasesExists, etagExists] = await Promise.all([
		redis.exists(releasesCacheKey),
		redis.exists(etagCacheKey),
	])

	console.log(
		`Releases cache: ${releasesCacheKey} (${releasesExists ? "EXISTS" : "NOT FOUND"})`,
	)
	console.log(
		`ETag cache: ${etagCacheKey} (${etagExists ? "EXISTS" : "NOT FOUND"})`,
	)

	if (!releasesExists && !etagExists) {
		console.log("✅ No cache to clear")
		return
	}

	await redis.del(releasesCacheKey, etagCacheKey)
	console.log("✅ Cache cleared! Next run will fetch fresh data from GitHub")
}

main().catch(console.error)
