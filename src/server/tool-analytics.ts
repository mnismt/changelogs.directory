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

	// Get basic tool info
	const tools = await prisma.tool.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
		},
	})

	// Use raw query to efficiently aggregate change types per tool
	const changeProfiles = (await prisma.$queryRaw`
		SELECT 
			t.id as "toolId",
			COUNT(CASE WHEN c.type = 'FEATURE' THEN 1 END)::int as feature,
			COUNT(CASE WHEN c.type = 'BUGFIX' THEN 1 END)::int as bugfix,
			COUNT(CASE WHEN c.type = 'IMPROVEMENT' THEN 1 END)::int as improvement,
			COUNT(CASE WHEN c.type = 'BREAKING' THEN 1 END)::int as breaking,
			COUNT(CASE WHEN c.type = 'SECURITY' THEN 1 END)::int as security,
			COUNT(CASE WHEN c.type = 'DEPRECATION' THEN 1 END)::int as deprecation,
			COUNT(CASE WHEN c.type = 'PERFORMANCE' THEN 1 END)::int as performance,
			COUNT(CASE WHEN c.type = 'DOCUMENTATION' THEN 1 END)::int as documentation,
			COUNT(CASE WHEN c.type = 'OTHER' THEN 1 END)::int as other
		FROM tool t
		LEFT JOIN release r ON r."toolId" = t.id
		LEFT JOIN change c ON c."releaseId" = r.id
		WHERE t."isActive" = true
		GROUP BY t.id
	`) as Array<{
		toolId: string
		feature: number
		bugfix: number
		improvement: number
		breaking: number
		security: number
		deprecation: number
		performance: number
		documentation: number
		other: number
	}>

	// Create lookup map
	const profileMap = new Map(changeProfiles.map((p) => [p.toolId, p]))

	return tools.map((tool) => {
		const profile = profileMap.get(tool.id) || {
			feature: 0,
			bugfix: 0,
			improvement: 0,
			breaking: 0,
			security: 0,
			deprecation: 0,
			performance: 0,
			documentation: 0,
			other: 0,
		}

		return {
			toolId: tool.id,
			toolName: tool.name,
			toolSlug: tool.slug,
			...profile,
		}
	})
})

// Tool Comparison - Quality metrics
export const getToolQualityMetrics = createServerFn({
	method: 'GET',
}).handler(async () => {
	const prisma = await getPrisma()

	// Get basic tool info with release count
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
		},
	})

	// Use raw query to efficiently calculate quality metrics per tool
	const qualityMetrics = (await prisma.$queryRaw`
		SELECT 
			t.id as "toolId",
			COUNT(c.id)::int as "totalChanges",
			COUNT(CASE WHEN c."isBreaking" THEN 1 END)::int as "breakingCount",
			COUNT(CASE WHEN c."isSecurity" THEN 1 END)::int as "securityCount",
			COUNT(CASE WHEN c."isDeprecation" THEN 1 END)::int as "deprecationCount"
		FROM tool t
		LEFT JOIN release r ON r."toolId" = t.id
		LEFT JOIN change c ON c."releaseId" = r.id
		WHERE t."isActive" = true
		GROUP BY t.id
	`) as Array<{
		toolId: string
		totalChanges: number
		breakingCount: number
		securityCount: number
		deprecationCount: number
	}>

	// Create lookup map
	const metricsMap = new Map(qualityMetrics.map((m) => [m.toolId, m]))

	return tools.map((tool) => {
		const metrics = metricsMap.get(tool.id) || {
			totalChanges: 0,
			breakingCount: 0,
			securityCount: 0,
			deprecationCount: 0,
		}

		const releaseCount = tool._count.releases
		const totalChanges = metrics.totalChanges

		return {
			toolId: tool.id,
			toolName: tool.name,
			toolSlug: tool.slug,
			avgChangesPerRelease:
				releaseCount > 0 ? Number((totalChanges / releaseCount).toFixed(1)) : 0,
			breakingChangeRatio:
				totalChanges > 0
					? Number(((metrics.breakingCount / totalChanges) * 100).toFixed(1))
					: 0,
			securityFixRatio:
				totalChanges > 0
					? Number(((metrics.securityCount / totalChanges) * 100).toFixed(1))
					: 0,
			deprecationRatio:
				totalChanges > 0
					? Number(((metrics.deprecationCount / totalChanges) * 100).toFixed(1))
					: 0,
		}
	})
})
