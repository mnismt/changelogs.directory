import { createServerFn } from '@tanstack/react-start'
import { getPrisma } from './db'

// Ingestion Overview - Recent FetchLogs with all metrics
export const getIngestionOverview = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		const recentLogs = await prisma.fetchLog.findMany({
			orderBy: { startedAt: 'desc' },
			take: 20,
			include: {
				tool: {
					select: {
						name: true,
						slug: true,
					},
				},
			},
		})

		return recentLogs
	},
)

// Ingestion Stats - Success/failure rates and averages
export const getIngestionStats = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		// Get stats for last 7 days
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

		const [statusCounts, avgDuration, totalJobs] = await Promise.all([
			prisma.fetchLog.groupBy({
				by: ['status'],
				_count: true,
				where: {
					startedAt: { gte: sevenDaysAgo },
				},
			}),
			prisma.fetchLog.aggregate({
				_avg: { duration: true },
				where: {
					status: 'SUCCESS',
					startedAt: { gte: sevenDaysAgo },
				},
			}),
			prisma.fetchLog.count({
				where: {
					startedAt: { gte: sevenDaysAgo },
				},
			}),
		])

		const successCount =
			statusCounts.find((s) => s.status === 'SUCCESS')?._count || 0
		const failedCount =
			statusCounts.find((s) => s.status === 'FAILED')?._count || 0
		const successRate =
			totalJobs > 0 ? Math.round((successCount / totalJobs) * 100) : 0

		return {
			successRate,
			avgDuration: avgDuration._avg.duration || 0,
			totalJobs,
			successCount,
			failedCount,
		}
	},
)

// Recent Errors - Failed jobs with error messages
export const getRecentErrors = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		const errors = await prisma.fetchLog.findMany({
			where: {
				status: 'FAILED',
			},
			orderBy: { startedAt: 'desc' },
			take: 10,
			include: {
				tool: {
					select: {
						name: true,
						slug: true,
					},
				},
			},
		})

		return errors
	},
)

// Tools Overview - All tools with release/change counts
export const getToolsOverview = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		const tools = await prisma.tool.findMany({
			orderBy: { name: 'asc' },
			include: {
				_count: {
					select: {
						releases: true,
					},
				},
				releases: {
					select: {
						_count: {
							select: {
								changes: true,
							},
						},
					},
				},
				fetchLogs: {
					orderBy: { startedAt: 'desc' },
					take: 1,
					select: {
						status: true,
						startedAt: true,
						completedAt: true,
					},
				},
			},
		})

		return tools.map((tool) => ({
			id: tool.id,
			name: tool.name,
			slug: tool.slug,
			isActive: tool.isActive,
			lastFetchedAt: tool.lastFetchedAt,
			releaseCount: tool._count.releases,
			changeCount: tool.releases.reduce((sum, r) => sum + r._count.changes, 0),
			lastFetchStatus: tool.fetchLogs[0]?.status || null,
			lastFetchStartedAt: tool.fetchLogs[0]?.startedAt || null,
		}))
	},
)

// Change Type Distribution
export const getChangeTypeDistribution = createServerFn({
	method: 'GET',
}).handler(async () => {
	const prisma = await getPrisma()

	const distribution = await prisma.change.groupBy({
		by: ['type'],
		_count: true,
		orderBy: {
			_count: {
				type: 'desc',
			},
		},
	})

	return distribution.map((d) => ({
		type: d.type,
		count: d._count,
	}))
})

// Content Summary - Total releases, changes, and flag counts
export const getContentSummary = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		const [
			totalReleases,
			totalChanges,
			totalTools,
			breakingCount,
			securityCount,
			deprecationCount,
		] = await Promise.all([
			prisma.release.count(),
			prisma.change.count(),
			prisma.tool.count({ where: { isActive: true } }),
			prisma.change.count({ where: { isBreaking: true } }),
			prisma.change.count({ where: { isSecurity: true } }),
			prisma.change.count({ where: { isDeprecation: true } }),
		])

		return {
			totalReleases,
			totalChanges,
			totalTools,
			breakingCount,
			securityCount,
			deprecationCount,
		}
	},
)

// Waitlist Stats
export const getWaitlistStats = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		const [totalCount, recentSignups] = await Promise.all([
			prisma.waitlist.count(),
			prisma.waitlist.findMany({
				orderBy: { createdAt: 'desc' },
				take: 10,
				select: {
					id: true,
					email: true,
					createdAt: true,
				},
			}),
		])

		// Mask emails for privacy
		const maskedSignups = recentSignups.map((signup) => {
			const [local, domain] = signup.email.split('@')
			const maskedLocal =
				local.length > 2
					? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
					: local
			return {
				...signup,
				email: `${maskedLocal}@${domain}`,
			}
		})

		return {
			totalCount,
			recentSignups: maskedSignups,
		}
	},
)

// Waitlist Daily Signups - Signups per day over last 30 days
export const getWaitlistDailySignups = createServerFn({
	method: 'GET',
}).handler(async () => {
	const prisma = await getPrisma()

	const thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
	thirtyDaysAgo.setHours(0, 0, 0, 0)

	const signups = await prisma.waitlist.findMany({
		where: {
			createdAt: { gte: thirtyDaysAgo },
		},
		select: {
			createdAt: true,
		},
		orderBy: { createdAt: 'asc' },
	})

	// Group by day
	const dailyData: Record<string, number> = {}

	// Initialize all days in the range with 0
	for (let i = 0; i < 30; i++) {
		const date = new Date(thirtyDaysAgo)
		date.setDate(date.getDate() + i)
		const dayKey = date.toISOString().split('T')[0]
		dailyData[dayKey] = 0
	}

	// Count signups per day
	for (const signup of signups) {
		const dayKey = new Date(signup.createdAt).toISOString().split('T')[0]
		dailyData[dayKey] = (dailyData[dayKey] || 0) + 1
	}

	return Object.entries(dailyData)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, count]) => ({
			date,
			count,
		}))
})

// Release Trends - Releases per week over last 8 weeks
export const getReleaseTrends = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = await getPrisma()

		const eightWeeksAgo = new Date()
		eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

		const releases = await prisma.release.findMany({
			where: {
				publishedAt: { gte: eightWeeksAgo },
			},
			select: {
				publishedAt: true,
			},
			orderBy: { publishedAt: 'asc' },
		})

		// Group by week
		const weeklyData: Record<string, number> = {}
		for (const release of releases) {
			const weekStart = new Date(release.publishedAt)
			weekStart.setDate(weekStart.getDate() - weekStart.getDay())
			const weekKey = weekStart.toISOString().split('T')[0]
			weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1
		}

		return Object.entries(weeklyData).map(([week, count]) => ({
			week,
			count,
		}))
	},
)
