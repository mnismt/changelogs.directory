import { captureServerException } from '@/integrations/sentry/server'
import { formatVersionForDisplay } from '@/lib/version-formatter'
import { getPrisma } from '@/server/db'

export type AdminLatestReleaseEntry = {
	tool: {
		slug: string
		name: string
		vendor: string
		homepage: string
		repositoryUrl: string
		tags: string[]
	}
	latestRelease: {
		id: string
		version: string
		formattedVersion: string | null
		releaseDate: string | null
		publishedAt: string
		headline: string
		summary: string | null
		sourceUrl: string
		isPrerelease: boolean
	} | null
}

/**
 * Latest release per active tool (same ordering as tool pages: releaseDate desc, then versionSort desc).
 */
export async function fetchAdminLatestReleasesForAllTools(): Promise<
	AdminLatestReleaseEntry[]
> {
	const prisma = getPrisma()

	try {
		const tools = await prisma.tool.findMany({
			where: { isActive: true },
			orderBy: { slug: 'asc' },
			select: {
				id: true,
				slug: true,
				name: true,
				vendor: true,
				homepage: true,
				repositoryUrl: true,
				tags: true,
			},
		})

		const entries = await Promise.all(
			tools.map(async (tool) => {
				const latestRelease = await prisma.release.findFirst({
					where: { toolId: tool.id },
					orderBy: [{ releaseDate: 'desc' }, { versionSort: 'desc' }],
					select: {
						id: true,
						version: true,
						releaseDate: true,
						publishedAt: true,
						headline: true,
						summary: true,
						sourceUrl: true,
						isPrerelease: true,
					},
				})

				const base = {
					tool: {
						slug: tool.slug,
						name: tool.name,
						vendor: tool.vendor,
						homepage: tool.homepage,
						repositoryUrl: tool.repositoryUrl,
						tags: tool.tags,
					},
				}

				if (!latestRelease) {
					return {
						...base,
						latestRelease: null,
					}
				}

				return {
					...base,
					latestRelease: {
						id: latestRelease.id,
						version: latestRelease.version,
						formattedVersion: formatVersionForDisplay(
							latestRelease.version,
							tool.slug,
						),
						releaseDate: latestRelease.releaseDate?.toISOString() ?? null,
						publishedAt: latestRelease.publishedAt.toISOString(),
						headline: latestRelease.headline,
						summary: latestRelease.summary,
						sourceUrl: latestRelease.sourceUrl,
						isPrerelease: latestRelease.isPrerelease,
					},
				}
			}),
		)

		return entries
	} catch (error: unknown) {
		console.error('admin latest releases:', error)
		captureServerException(error)
		throw error
	}
}
