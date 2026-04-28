import { createServerFn } from '@tanstack/react-start'
import { subDays } from 'date-fns'
import { z } from 'zod'
import { getPrisma } from './db'

const compareStatsSchema = z.object({
	toolSlugs: z.array(z.string()),
})

export interface VelocityStats {
	toolSlug: string
	totalReleases: number
	lastReleaseDate: string | null
	releasesLast30Days: number
	avgReleasesPerMonth: number // Calculated over last 90 days
	changesLast30Days: {
		features: number
		fixes: number
		breaking: number
		other: number
	}
}

export const getCompareStats = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = compareStatsSchema.safeParse(data)
		if (!result.success) {
			throw new Error('Invalid parameters')
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()
		const now = new Date()
		const thirtyDaysAgo = subDays(now, 30)
		const ninetyDaysAgo = subDays(now, 90)

		try {
			// Get tools to ensure we have IDs
			const tools = await prisma.tool.findMany({
				where: { slug: { in: data.toolSlugs } },
				select: { id: true, slug: true },
			})

			const statsPromises = tools.map(async (tool) => {
				// 1. Total releases & Last release date
				const totalReleases = await prisma.release.count({
					where: { toolId: tool.id },
				})

				const lastRelease = await prisma.release.findFirst({
					where: { toolId: tool.id },
					orderBy: { releaseDate: 'desc' },
					select: { releaseDate: true },
				})

				// 2. Velocity (Releases over last 90 days / 3)
				const releasesLast90Days = await prisma.release.count({
					where: {
						toolId: tool.id,
						releaseDate: { gte: ninetyDaysAgo },
					},
				})
				const avgReleasesPerMonth =
					Math.round((releasesLast90Days / 3) * 10) / 10

				// 3. Activity last 30 days
				const releasesLast30 = await prisma.release.findMany({
					where: {
						toolId: tool.id,
						releaseDate: { gte: thirtyDaysAgo },
					},
					include: { changes: { select: { type: true, isBreaking: true } } },
				})

				const releasesLast30Count = releasesLast30.length

				// 4. Change breakdown last 30 days
				let features = 0
				let fixes = 0
				let breaking = 0
				let other = 0

				for (const release of releasesLast30) {
					for (const change of release.changes) {
						if (change.isBreaking) breaking++

						if (change.type === 'FEATURE') features++
						else if (change.type === 'BUGFIX') fixes++
						else other++
					}
				}

				return {
					toolSlug: tool.slug,
					totalReleases,
					lastReleaseDate: lastRelease?.releaseDate?.toISOString() ?? null,
					releasesLast30Days: releasesLast30Count,
					avgReleasesPerMonth,
					changesLast30Days: {
						features,
						fixes,
						breaking,
						other,
					},
				} satisfies VelocityStats
			})

			const results = await Promise.all(statsPromises)
			return results
		} catch (error) {
			console.error('Error fetching compare stats:', error)
			throw new Error('Failed to fetch comparison statistics')
		}
	})
