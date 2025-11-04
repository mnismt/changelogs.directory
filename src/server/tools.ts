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

/**
 * Get tool with all releases (sorted by version)
 * Used for tool overview page
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
						orderBy: { versionSort: 'desc' },
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

			return tool
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
