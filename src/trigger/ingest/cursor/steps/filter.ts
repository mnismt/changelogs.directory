import { logger } from '@trigger.dev/sdk'
import type { FilterResult, IngestionContext, ParseResult } from '../types'

export async function filterStep(
	ctx: IngestionContext,
	parseResult: ParseResult,
): Promise<FilterResult> {
	logger.info('Phase 4: Filter unchanged releases', {
		totalReleases: parseResult.releases.length,
	})

	if (parseResult.releases.length === 0) {
		return {
			releases: [],
			releasesSkipped: 0,
		}
	}

	const versions = parseResult.releases.map((r) => r.version)
	const existingReleases = await ctx.prisma.release.findMany({
		where: {
			toolId: ctx.tool.id,
			version: { in: versions },
		},
		select: {
			version: true,
			contentHash: true,
		},
	})

	const existingMap = new Map(
		existingReleases.map((release) => [release.version, release.contentHash]),
	)

	const releasesToEnrich = parseResult.releases.filter((release) => {
		const existingHash = existingMap.get(release.version)
		if (!existingHash) {
			return true
		}
		return existingHash !== release.contentHash
	})

	const releasesSkipped = parseResult.releases.length - releasesToEnrich.length

	logger.info('Filtering complete', {
		releasesToEnrich: releasesToEnrich.length,
		releasesSkipped,
	})

	return {
		releases: releasesToEnrich,
		releasesSkipped,
	}
}
