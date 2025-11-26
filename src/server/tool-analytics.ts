import { createServerFn } from '@tanstack/react-start'
import { getPrisma } from './db'

// Tool Comparison - Release velocity by actual release date
export const getToolReleaseVelocity = createServerFn({
	method: 'GET',
}).handler(async () => {
	const prisma = await getPrisma()

	// Get last 8 weeks of data
	const eightWeeksAgo = new Date()
	eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

	const tools = await prisma.tool.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
			releases: {
				where: {
					releaseDate: { gte: eightWeeksAgo },
				},
				select: {
					releaseDate: true,
				},
				orderBy: { releaseDate: 'asc' },
			},
		},
	})

	// Group releases by week for each tool
	return tools.map((tool) => {
		const weeklyData: Record<string, number> = {}

		for (const release of tool.releases) {
			if (!release.releaseDate) continue

			const weekStart = new Date(release.releaseDate)
			weekStart.setDate(weekStart.getDate() - weekStart.getDay())
			const weekKey = weekStart.toISOString().split('T')[0]
			weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1
		}

		const weeks = Object.entries(weeklyData).map(([week, count]) => ({
			week,
			count,
		}))

		return {
			toolId: tool.id,
			toolName: tool.name,
			toolSlug: tool.slug,
			weeks,
			totalReleases: tool.releases.length,
		}
	})
})

// Tool Comparison - Change type distribution per tool
export const getToolChangeProfiles = createServerFn({
	method: 'GET',
}).handler(async () => {
	const prisma = await getPrisma()

	const tools = await prisma.tool.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
			releases: {
				select: {
					changes: {
						select: {
							type: true,
						},
					},
				},
			},
		},
	})

	return tools.map((tool) => {
		const typeCount: Record<string, number> = {}

		for (const release of tool.releases) {
			for (const change of release.changes) {
				typeCount[change.type] = (typeCount[change.type] || 0) + 1
			}
		}

		return {
			toolId: tool.id,
			toolName: tool.name,
			toolSlug: tool.slug,
			feature: typeCount.FEATURE || 0,
			bugfix: typeCount.BUGFIX || 0,
			improvement: typeCount.IMPROVEMENT || 0,
			breaking: typeCount.BREAKING || 0,
			security: typeCount.SECURITY || 0,
			deprecation: typeCount.DEPRECATION || 0,
			performance: typeCount.PERFORMANCE || 0,
			documentation: typeCount.DOCUMENTATION || 0,
			other: typeCount.OTHER || 0,
		}
	})
})

// Tool Comparison - Quality metrics
export const getToolQualityMetrics = createServerFn({
	method: 'GET',
}).handler(async () => {
	const prisma = await getPrisma()

	const tools = await prisma.tool.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
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
	})

	return tools.map((tool) => {
		let totalChanges = 0
		let breakingCount = 0
		let securityCount = 0
		let deprecationCount = 0

		for (const release of tool.releases) {
			totalChanges += release._count.changes
			for (const change of release.changes) {
				if (change.isBreaking) breakingCount++
				if (change.isSecurity) securityCount++
				if (change.isDeprecation) deprecationCount++
			}
		}

		const releaseCount = tool._count.releases

		return {
			toolId: tool.id,
			toolName: tool.name,
			toolSlug: tool.slug,
			avgChangesPerRelease:
				releaseCount > 0 ? Number((totalChanges / releaseCount).toFixed(1)) : 0,
			breakingChangeRatio:
				totalChanges > 0
					? Number(((breakingCount / totalChanges) * 100).toFixed(1))
					: 0,
			securityFixRatio:
				totalChanges > 0
					? Number(((securityCount / totalChanges) * 100).toFixed(1))
					: 0,
			deprecationRatio:
				totalChanges > 0
					? Number(((deprecationCount / totalChanges) * 100).toFixed(1))
					: 0,
		}
	})
})
