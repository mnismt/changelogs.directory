import { logger } from '@trigger.dev/sdk'
import type { FilterResult, IngestionContext, ParseResult } from '../types'

/**
 * Phase 4: Filter unchanged releases
 * - Batch query existing releases from database
 * - Filter out releases with matching contentHash
 * - Only return releases that need enrichment (new or changed)
 */
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

	if (ctx.forceFullRescan) {
		logger.info('Force full rescan enabled - skipping filter', {
			totalReleases: parseResult.releases.length,
		})
		return {
			releases: parseResult.releases,
			releasesSkipped: 0,
		}
	}

	// Batch query existing releases for this tool
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

	// Create map for quick lookup
	const existingMap = new Map(
		existingReleases.map((r) => [r.version, r.contentHash]),
	)

	// Filter releases: keep only new ones or ones with changed contentHash
	const releasesToEnrich = parseResult.releases.filter((release) => {
		const existingHash = existingMap.get(release.version)

		// New release (not in database)
		if (!existingHash) {
			return true
		}

		// Changed release (different contentHash)
		if (existingHash !== release.contentHash) {
			return true
		}

		// Unchanged release - skip
		return false
	})

	const releasesSkipped = parseResult.releases.length - releasesToEnrich.length

	logger.info('Filtering completed', {
		releasesToEnrich: releasesToEnrich.length,
		releasesSkipped,
		totalReleases: parseResult.releases.length,
	})

	return {
		releases: releasesToEnrich,
		releasesSkipped,
	}
}
