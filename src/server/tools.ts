import { createServerFn } from '@tanstack/react-start'
import { subDays, subMonths, subYears } from 'date-fns'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'
import { captureServerException } from '@/integrations/sentry/server'
import { formatVersionForDisplay } from '@/lib/version-formatter'
import { getPrisma } from './db'

// Input schemas
const toolSlugSchema = z.object({
	slug: z.string().min(1, 'Tool slug is required'),
})

const releaseParamsSchema = z.object({
	toolSlug: z.string().min(1, 'Tool slug is required'),
	version: z.string().min(1, 'Version is required'),
})

const paginatedReleasesSchema = z.object({
	slug: z.string().min(1, 'Tool slug is required'),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
	datePreset: z.enum(['7d', '30d', '3mo', '6mo', '1y', 'all']).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	includePrereleases: z.boolean().default(true),
})

const latestReleasesSchema = z.object({
	limit: z.number().int().min(1).max(100).default(12),
	offset: z.number().int().min(0).default(0),
	changeTypes: z
		.array(
			z.enum([
				'FEATURE',
				'BUGFIX',
				'IMPROVEMENT',
				'BREAKING',
				'SECURITY',
				'DEPRECATION',
				'PERFORMANCE',
				'DOCUMENTATION',
				'OTHER',
			]),
		)
		.optional(),
	toolSlugs: z.array(z.string().min(1)).optional(),
	includePrereleases: z.boolean().default(true),
})

const getDateRange = (preset?: string) => {
	if (!preset || preset === 'all') {
		return {}
	}

	const now = new Date()
	switch (preset) {
		case '7d':
			return { startDate: subDays(now, 7) }
		case '30d':
			return { startDate: subDays(now, 30) }
		case '3mo':
			return { startDate: subMonths(now, 3) }
		case '6mo':
			return { startDate: subMonths(now, 6) }
		case '1y':
			return { startDate: subYears(now, 1) }
		default:
			return {}
	}
}

/**
 * Get tool metadata (without releases)
 * Used for tool header display
 */
export const getToolMetadata = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = toolSlugSchema.safeParse(data)
		if (!result.success) {
			const message = result.error.issues[0]?.message || 'Invalid tool slug'
			throw new Error(message)
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			const tool = await prisma.tool.findUnique({
				where: { slug: data.slug },
				select: {
					id: true,
					name: true,
					slug: true,
					vendor: true,
					description: true,
					homepage: true,
					repositoryUrl: true,
					lastFetchedAt: true,
					tags: true,
					_count: {
						select: { releases: true },
					},
				},
			})

			if (!tool) {
				throw new Error('Tool not found')
			}

			// Get latest and first release for header stats
			const latestRelease = await prisma.release.findFirst({
				where: { toolId: tool.id },
				orderBy: { releaseDate: 'desc' },
				select: { version: true, releaseDate: true },
			})

			const firstRelease = await prisma.release.findFirst({
				where: { toolId: tool.id },
				orderBy: { releaseDate: 'asc' },
				select: { version: true, releaseDate: true },
			})

			return {
				...tool,
				latestVersion: latestRelease?.version || null,
				formattedLatestVersion: latestRelease?.version
					? formatVersionForDisplay(latestRelease.version, tool.slug)
					: null,
				latestReleaseDate: latestRelease?.releaseDate || null,
				firstVersion: firstRelease?.version || null,
				formattedFirstVersion: firstRelease?.version
					? formatVersionForDisplay(firstRelease.version, tool.slug)
					: null,
				firstReleaseDate: firstRelease?.releaseDate || null,
			}
		} catch (error: unknown) {
			console.error('Error fetching tool metadata:', error)
			if (error instanceof Error) {
				if (error.message === 'Tool not found') {
					throw error
				}
				console.error('Database error fetching tool metadata:', error)
			}
			captureServerException(error)
			throw new Error('Failed to fetch tool metadata')
		}
	})

/**
 * Get paginated releases for a tool with change-type aggregation
 * Used for infinite scroll on tool overview page
 */
export const getToolReleasesPaginated = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = paginatedReleasesSchema.safeParse(data)
		if (!result.success) {
			const message =
				result.error.issues[0]?.message || 'Invalid pagination parameters'
			throw new Error(message)
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			// Verify tool exists
			const tool = await prisma.tool.findUnique({
				where: { slug: data.slug },
				select: { id: true, slug: true },
			})

			if (!tool) {
				throw new Error('Tool not found')
			}

			// Build date range filter
			const dateFilter: { gte?: Date; lte?: Date } = {}

			if (data.datePreset) {
				const presetRange = getDateRange(data.datePreset)
				if (presetRange.startDate) {
					dateFilter.gte = presetRange.startDate
				}
			} else if (data.startDate || data.endDate) {
				if (data.startDate) {
					dateFilter.gte = new Date(data.startDate)
				}
				if (data.endDate) {
					const endDate = new Date(data.endDate)
					endDate.setHours(23, 59, 59, 999)
					dateFilter.lte = endDate
				}
			}

			// Build where clause
			const whereClause: {
				toolId: string
				releaseDate?: { gte?: Date; lte?: Date }
				isPrerelease?: boolean
			} = {
				toolId: tool.id,
			}

			if (!data.includePrereleases) {
				whereClause.isPrerelease = false
			}

			if (dateFilter.gte || dateFilter.lte) {
				whereClause.releaseDate = dateFilter
			}

			// Get total count for pagination metadata
			const totalCount = await prisma.release.count({
				where: whereClause,
			})

			// Fetch paginated releases
			const releases = await prisma.release.findMany({
				where: whereClause,
				orderBy: { releaseDate: 'desc' },
				skip: data.offset,
				take: data.limit,
				include: {
					_count: {
						select: { changes: true },
					},
				},
			})

			// Fetch change counts grouped by type for fetched releases
			const releaseIds = releases.map((r) => r.id)
			const changesByTypeRaw = await prisma.change.groupBy({
				by: ['releaseId', 'type'],
				where: {
					releaseId: { in: releaseIds },
				},
				_count: { id: true },
			})

			// Transform into a map: releaseId -> { type: count }
			const changesByTypeMap = new Map<string, Record<string, number>>()
			for (const item of changesByTypeRaw) {
				if (!changesByTypeMap.has(item.releaseId)) {
					changesByTypeMap.set(item.releaseId, {})
				}
				const typeCounts = changesByTypeMap.get(item.releaseId)
				if (typeCounts) {
					typeCounts[item.type] = item._count.id
				}
			}

			// Attach changesByType to each release
			const releasesWithTypes = releases.map((release) => ({
				...release,
				formattedVersion: formatVersionForDisplay(release.version, tool.slug),
				changesByType: changesByTypeMap.get(release.id) || {},
			}))

			return {
				releases: releasesWithTypes,
				pagination: {
					offset: data.offset,
					limit: data.limit,
					totalCount,
					hasMore: data.offset + releases.length < totalCount,
				},
			}
		} catch (error: unknown) {
			console.error('Error fetching paginated releases:', error)
			if (error instanceof Error) {
				if (error.message === 'Tool not found') {
					throw error
				}
				console.error('Database error fetching paginated releases:', error)
			}
			captureServerException(error)
			throw new Error('Failed to fetch paginated releases')
		}
	})

/**
 * Get release with all changes (grouped by type)
 * Used for release detail page
 */
export const getReleaseWithChanges = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = releaseParamsSchema.safeParse(data)
		if (!result.success) {
			const message = result.error.issues[0]?.message || 'Invalid parameters'
			throw new Error(message)
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			const release = await prisma.release.findFirst({
				where: {
					tool: { slug: data.toolSlug },
					version: data.version,
				},
				include: {
					tool: true,
					changes: {
						orderBy: { order: 'asc' }, // Preserve original order
					},
				},
			})

			if (!release) {
				throw new Error('Release not found')
			}

			return {
				...release,
				formattedVersion: formatVersionForDisplay(
					release.version,
					release.tool.slug,
				),
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message === 'Release not found') {
					throw error
				}
				console.error('Database error fetching release:', error)
			}
			captureServerException(error)
			throw new Error('Failed to fetch release data')
		}
	})

/**
 * Get adjacent versions (prev/next) for navigation
 */
export const getAdjacentVersions = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = releaseParamsSchema.safeParse(data)
		if (!result.success) {
			const message = result.error.issues[0]?.message || 'Invalid parameters'
			throw new Error(message)
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			// Get current release
			const currentRelease = await prisma.release.findFirst({
				where: {
					tool: { slug: data.toolSlug },
					version: data.version,
				},
				select: { versionSort: true },
			})

			if (!currentRelease) {
				return {
					prev: null,
					next: null,
					formattedPrev: null,
					formattedNext: null,
				}
			}

			// Get next version (higher versionSort)
			const next = await prisma.release.findFirst({
				where: {
					tool: { slug: data.toolSlug },
					versionSort: { gt: currentRelease.versionSort },
				},
				orderBy: { versionSort: 'asc' },
				select: { version: true },
			})

			// Get prev version (lower versionSort)
			const prev = await prisma.release.findFirst({
				where: {
					tool: { slug: data.toolSlug },
					versionSort: { lt: currentRelease.versionSort },
				},
				orderBy: { versionSort: 'desc' },
				select: { version: true },
			})

			return {
				next: next?.version || null,
				formattedNext: next?.version
					? formatVersionForDisplay(next.version, data.toolSlug)
					: null,
				prev: prev?.version || null,
				formattedPrev: prev?.version
					? formatVersionForDisplay(prev.version, data.toolSlug)
					: null,
			}
		} catch (error: unknown) {
			console.error('Error fetching adjacent versions:', error)
			captureServerException(error)
			return {
				prev: null,
				next: null,
				formattedPrev: null,
				formattedNext: null,
			}
		}
	})

/**
 * Get all versions for dropdown/list
 */
export const getAllVersions = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = toolSlugSchema.safeParse(data)
		if (!result.success) {
			const message = result.error.issues[0]?.message || 'Invalid tool slug'
			throw new Error(message)
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			const versions = await prisma.release.findMany({
				where: { tool: { slug: data.slug } },
				orderBy: { releaseDate: 'desc' },
				select: {
					id: true,
					version: true,
					releaseDate: true,
					_count: {
						select: { changes: true },
					},
				},
			})

			// Fetch change counts grouped by type for all releases
			const releaseIds = versions.map((v) => v.id)
			const changesByTypeRaw = await prisma.change.groupBy({
				by: ['releaseId', 'type'],
				where: {
					releaseId: { in: releaseIds },
				},
				_count: { id: true },
			})

			// Transform into a map: releaseId -> { type: count }
			const changesByTypeMap = new Map<string, Record<string, number>>()
			for (const item of changesByTypeRaw) {
				if (!changesByTypeMap.has(item.releaseId)) {
					changesByTypeMap.set(item.releaseId, {})
				}
				const typeCounts = changesByTypeMap.get(item.releaseId)
				if (typeCounts) {
					typeCounts[item.type] = item._count.id
				}
			}

			// Attach changesByType to each version
			const versionsWithTypes = versions.map((version) => ({
				version: version.version,
				formattedVersion: formatVersionForDisplay(version.version, data.slug),
				releaseDate: version.releaseDate,
				_count: version._count,
				changesByType: changesByTypeMap.get(version.id) || {},
			}))

			return versionsWithTypes
		} catch (error: unknown) {
			console.error('Error fetching versions:', error)
			captureServerException(error)
			throw new Error('Failed to fetch versions')
		}
	})

/**
 * Get latest releases across all tools
 * Used for homepage feed
 */
export const getLatestReleasesAcrossTools = createServerFn({ method: 'GET' })
	.inputValidator((data) => {
		const result = latestReleasesSchema.safeParse(data)
		if (!result.success) {
			const message =
				result.error.issues[0]?.message || 'Invalid pagination parameters'
			throw new Error(message)
		}
		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			// Build where clause for change type filtering
			const whereClause: Prisma.ReleaseWhereInput = {}

			if (data.changeTypes && data.changeTypes.length > 0) {
				// If filtering by change types, we need to find releases that have changes of those types
				whereClause.changes = {
					some: {
						type: { in: data.changeTypes },
					},
				}
			}

			if (data.toolSlugs && data.toolSlugs.length > 0) {
				whereClause.tool = {
					slug: { in: data.toolSlugs },
				}
			}

			if (!data.includePrereleases) {
				whereClause.isPrerelease = false
			}

			// Get total count for pagination metadata
			const totalCount = await prisma.release.count({
				where: whereClause,
			})

			// Fetch paginated releases across all tools
			// Optimize: Fetch changes in the same query to avoid N+1
			const releases = await prisma.release.findMany({
				where: whereClause,
				orderBy: { releaseDate: 'desc' },
				skip: data.offset,
				take: data.limit,
				select: {
					id: true,
					version: true,
					isPrerelease: true,
					releaseDate: true,
					headline: true,
					summary: true,
					tool: {
						select: {
							slug: true,
							name: true,
							vendor: true,
							tags: true,
						},
					},
					_count: {
						select: { changes: true },
					},
					// Include changes to aggregate in memory
					changes: {
						select: {
							type: true,
							isBreaking: true,
							isSecurity: true,
							isDeprecation: true,
						},
					},
				},
			})

			// Process releases in memory to calculate stats
			const releasesWithMetadata = releases.map((release) => {
				const changesByType: Record<string, number> = {}
				let hasBreaking = false
				let hasSecurity = false
				let hasDeprecation = false

				for (const change of release.changes) {
					// Count by type
					changesByType[change.type] = (changesByType[change.type] || 0) + 1

					// Check flags
					if (change.isBreaking) hasBreaking = true
					if (change.isSecurity) hasSecurity = true
					if (change.isDeprecation) hasDeprecation = true
				}

				// Remove changes array from the result to match the expected return type
				// (though we need to cast or omit it since it's in the select now)
				const { changes: _changes, ...releaseWithoutChanges } = release

				return {
					...releaseWithoutChanges,
					formattedVersion: formatVersionForDisplay(
						release.version,
						release.tool.slug,
					),
					changesByType,
					hasBreaking,
					hasSecurity,
					hasDeprecation,
					isPrerelease: release.isPrerelease,
				}
			})

			// Get count of tools matching the filter
			const matchingToolsRaw = await prisma.release.groupBy({
				by: ['toolId'],
				where: whereClause,
			})
			const matchingToolsCount = matchingToolsRaw.length

			return {
				releases: releasesWithMetadata,
				pagination: {
					offset: data.offset,
					limit: data.limit,
					totalCount,
					hasMore: data.offset + releases.length < totalCount,
					matchingToolsCount,
				},
			}
		} catch (error: unknown) {
			console.error('Error fetching latest releases across tools:', error)
			captureServerException(error)
			throw new Error('Failed to fetch latest releases')
		}
	})

/**
 * Get all active tools with their latest release info
 * Used for tools directory page
 */
export const getAllTools = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = getPrisma()

		try {
			// Fetch all active tools
			const tools = await prisma.tool.findMany({
				where: { isActive: true },
				orderBy: { name: 'asc' },
				select: {
					id: true,
					slug: true,
					name: true,
					vendor: true,
					description: true,
					homepage: true,
					repositoryUrl: true,
					tags: true,
					lastFetchedAt: true,
					_count: {
						select: { releases: true },
					},
				},
			})

			// Get latest release for each tool
			const toolsWithLatest = await Promise.all(
				tools.map(async (tool) => {
					const latestRelease = await prisma.release.findFirst({
						where: { toolId: tool.id },
						orderBy: { releaseDate: 'desc' },
						select: { version: true, releaseDate: true },
					})
					return {
						...tool,
						latestVersion: latestRelease?.version || null,
						formattedLatestVersion: latestRelease?.version
							? formatVersionForDisplay(latestRelease.version, tool.slug)
							: null,
						latestReleaseDate: latestRelease?.releaseDate || null,
					}
				}),
			)

			// Calculate stats
			const totalReleases = await prisma.release.count()

			return {
				tools: toolsWithLatest,
				stats: {
					totalTools: toolsWithLatest.length,
					totalReleases,
				},
			}
		} catch (error: unknown) {
			console.error('Error fetching all tools:', error)
			captureServerException(error)
			throw new Error('Failed to fetch tools')
		}
	},
)
