import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { UserRole } from '../lib/auth/types'
import { getSessionFn } from './auth'
import { getPrisma } from './db'

const adminMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) => {
	const session = await getSessionFn()
	if (!session?.user || session.user.role !== UserRole.ADMIN) {
		throw new Error('Unauthorized')
	}
	return next({ context: { session } })
})

export const updateTool = createServerFn({ method: 'POST' })
	.middleware([adminMiddleware])
	.inputValidator(
		z.object({
			id: z.string(),
			description: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()
		await prisma.tool.update({
			where: { id: data.id },
			data: {
				description: data.description,
			},
		})
		return { success: true }
	})

export const getWaitlistStats = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const now = new Date()
		const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

		const [totalCount, recentSignups, last24h, last7d] = await Promise.all([
			prisma.waitlist.count(),
			prisma.waitlist.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				select: { id: true, email: true, createdAt: true },
			}),
			prisma.waitlist.count({
				where: { createdAt: { gte: twentyFourHoursAgo } },
			}),
			prisma.waitlist.count({
				where: { createdAt: { gte: sevenDaysAgo } },
			}),
		])

		return {
			totalCount,
			recentSignups,
			last24h,
			last7d,
		}
	})

export const getWaitlistDailySignups = createServerFn({
	method: 'GET',
})
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		// Get signups for the last 30 days
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		// Group by day manually since Prisma groupBy with date truncation is tricky across DBs
		// or requires raw query. For simplicity/portability, we'll fetch and aggregate in JS
		// if the volume is low. But waitlist might be large.
		// Let's use a raw query for better performance or just fetch all and aggregate if MVP.
		// Given it's an MVP, let's try raw query for postgres.

		const dailySignups = (await prisma.$queryRaw`
			SELECT DATE(created_at) as date, COUNT(*)::int as count
			FROM waitlist
			WHERE created_at >= ${thirtyDaysAgo}
			GROUP BY DATE(created_at)
			ORDER BY DATE(created_at) ASC
		`) as Array<{ date: Date; count: number }>

		return dailySignups.map((item) => ({
			date: item.date.toISOString(),
			count: Number(item.count),
		}))
	})

export const getIngestionOverview = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const logs = await prisma.fetchLog.findMany({
			take: 10,
			orderBy: { startedAt: 'desc' },
			include: { tool: true },
		})
		return logs
	})

export const getIngestionStats = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

		const [totalJobs, successCount, failedCount, avgDurationAgg] =
			await Promise.all([
				prisma.fetchLog.count({
					where: { startedAt: { gte: sevenDaysAgo } },
				}),
				prisma.fetchLog.count({
					where: {
						startedAt: { gte: sevenDaysAgo },
						status: 'SUCCESS',
					},
				}),
				prisma.fetchLog.count({
					where: {
						startedAt: { gte: sevenDaysAgo },
						status: 'FAILED',
					},
				}),
				prisma.fetchLog.aggregate({
					where: {
						startedAt: { gte: sevenDaysAgo },
						status: 'SUCCESS',
					},
					_avg: { duration: true },
				}),
			])

		const successRate =
			totalJobs > 0 ? Math.round((successCount / totalJobs) * 100) : 0

		return {
			totalJobs,
			successCount,
			failedCount,
			successRate,
			avgDuration: avgDurationAgg._avg.duration || 0,
		}
	})

export const getToolsOverview = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const tools = await prisma.tool.findMany({
			include: {
				_count: {
					select: {
						releases: true,
					},
				},
				fetchLogs: {
					take: 1,
					orderBy: { startedAt: 'desc' },
					select: { status: true, startedAt: true },
				},
				releases: {
					select: {
						changes: {
							select: {
								isBreaking: true,
								isSecurity: true,
								isDeprecation: true,
							},
						},
					},
				},
			},
			orderBy: { name: 'asc' },
		})

		return tools.map((tool) => {
			// Count all changes across all releases
			const allChanges = tool.releases.flatMap((r) => r.changes)
			const changeCount = allChanges.length
			const breakingCount = allChanges.filter((c) => c.isBreaking).length
			const securityCount = allChanges.filter((c) => c.isSecurity).length
			const deprecationCount = allChanges.filter((c) => c.isDeprecation).length

			return {
				id: tool.id,
				name: tool.name,
				slug: tool.slug,
				isActive: tool.isActive,
				lastFetchedAt: tool.lastFetchedAt,
				releaseCount: tool._count.releases,
				changeCount,
				breakingCount,
				securityCount,
				deprecationCount,
				lastFetchStatus: tool.fetchLogs[0]?.status || null,
				lastFetchStartedAt: tool.fetchLogs[0]?.startedAt || null,
			}
		})
	})

export const getChangeTypeDistribution = createServerFn({
	method: 'GET',
})
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const distribution = await prisma.change.groupBy({
			by: ['type'],
			_count: { id: true },
		})

		// Return as array of objects with type and count
		return distribution.map((item) => ({
			type: item.type,
			count: item._count.id,
		}))
	})

export const getContentSummary = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
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
			prisma.tool.count(),
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
	})

export const getReleaseTrends = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const eightWeeksAgo = new Date()
		eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

		// Use publishedAt instead of releaseDate since releaseDate is nullable
		// Use raw query for date truncation
		const trends = (await prisma.$queryRaw`
			SELECT DATE(published_at) as date, COUNT(*)::int as count
			FROM release
			WHERE published_at >= ${eightWeeksAgo}
			GROUP BY DATE(published_at)
			ORDER BY DATE(published_at) ASC
		`) as Array<{ date: Date; count: number }>

		// Handle empty data
		if (trends.length === 0) {
			return []
		}

		// Aggregate by week in JS
		const weeklyData: Record<string, number> = {}
		trends.forEach((item) => {
			const date = new Date(item.date)
			const weekStart = new Date(date)
			weekStart.setDate(date.getDate() - date.getDay())
			const weekKey = weekStart.toISOString().split('T')[0]
			weeklyData[weekKey] = (weeklyData[weekKey] || 0) + item.count
		})

		return Object.entries(weeklyData)
			.map(([week, count]) => ({
				week,
				count,
			}))
			.sort((a, b) => a.week.localeCompare(b.week))
	})

// Admin route server functions (to prevent client-side bundling of getPrisma)
export const getAdminDashboardStats = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const [userCount, toolCount, releaseCount] = await Promise.all([
			prisma.user.count(),
			prisma.tool.count(),
			prisma.release.count(),
		])
		return { userCount, toolCount, releaseCount }
	})

export const getAdminTools = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const tools = await prisma.tool.findMany({
			orderBy: { name: 'asc' },
		})
		return { tools }
	})

export const getAdminIngestionLogs = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const logs = await prisma.fetchLog.findMany({
			take: 20,
			orderBy: { startedAt: 'desc' },
			include: { tool: true },
		})
		return { logs }
	})

export const triggerToolIngestion = createServerFn({ method: 'POST' })
	.middleware([adminMiddleware])
	.inputValidator(
		z.object({
			toolSlug: z.string(),
			version: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const { ingestClaudeCode } = await import(
			'../trigger/ingest/claude-code/index'
		)

		await ingestClaudeCode.trigger({
			toolSlug: data.toolSlug,
			retryVersions: data.version ? [data.version] : undefined,
		})

		return { success: true }
	})

export const getAdminToolReleases = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.inputValidator(
		z.object({
			slug: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()
		const tool = await prisma.tool.findUnique({
			where: { slug: data.slug },
			include: {
				releases: {
					orderBy: { versionSort: 'desc' },
					select: {
						id: true,
						version: true,
						releaseDate: true,
						createdAt: true,
						updatedAt: true,
						contentHash: true,
						_count: {
							select: { changes: true },
						},
					},
				},
			},
		})

		if (!tool) {
			throw new Error('Tool not found')
		}

		return { tool }
	})
