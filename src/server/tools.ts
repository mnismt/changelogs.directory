import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
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
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
})

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
				latestReleaseDate: latestRelease?.releaseDate || null,
				firstVersion: firstRelease?.version || null,
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
				select: { id: true },
			})

			if (!tool) {
				throw new Error('Tool not found')
			}

			// Build date filter
			const dateFilter = {
				...(data.dateFrom && { gte: data.dateFrom }),
				...(data.dateTo && { lte: data.dateTo }),
			}

			// Build where clause
			const whereClause = {
				toolId: tool.id,
				...(Object.keys(dateFilter).length > 0 && {
					releaseDate: dateFilter,
				}),
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
			throw new Error('Failed to fetch paginated releases')
		}
	})

/**
 * Get tool with all releases (sorted by releaseDate)
 * Used for tool overview page
 * @deprecated Use getToolReleasesPaginated for better performance
 */
export const getToolWithReleases = createServerFn({ method: 'GET' })
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
				include: {
					releases: {
						orderBy: { releaseDate: 'desc' },
						include: {
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

			// Fetch change counts grouped by type for all releases
			const releaseIds = tool.releases.map((r) => r.id)
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
			const releasesWithTypes = tool.releases.map((release) => ({
				...release,
				changesByType: changesByTypeMap.get(release.id) || {},
			}))

			return {
				...tool,
				releases: releasesWithTypes,
			}
		} catch (error: unknown) {
			console.error('Error fetching tool:', error)
			if (error instanceof Error) {
				if (error.message === 'Tool not found') {
					throw error
				}
				console.error('Database error fetching tool:', error)
			}
			throw new Error('Failed to fetch tool data')
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

			return release
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message === 'Release not found') {
					throw error
				}
				console.error('Database error fetching release:', error)
			}
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
				return { prev: null, next: null }
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
				prev: prev?.version || null,
			}
		} catch (error: unknown) {
			console.error('Error fetching adjacent versions:', error)
			return { prev: null, next: null }
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
				releaseDate: version.releaseDate,
				_count: version._count,
				changesByType: changesByTypeMap.get(version.id) || {},
			}))

			return versionsWithTypes
		} catch (error: unknown) {
			console.error('Error fetching versions:', error)
			throw new Error('Failed to fetch versions')
		}
	})
