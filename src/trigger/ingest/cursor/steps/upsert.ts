import { logger } from '@trigger.dev/sdk'
import type { EnrichResult, IngestionContext, UpsertResult } from '../types'

export async function upsertStep(
	ctx: IngestionContext,
	enrichResult: EnrichResult,
): Promise<UpsertResult> {
	logger.info('Phase 6: Upsert Cursor releases and changes')

	let releasesNew = 0
	let releasesUpdated = 0
	let changesCreated = 0

	for (const parsedRelease of enrichResult.enrichedReleases) {
		const existingRelease = await ctx.prisma.release.findUnique({
			where: {
				toolId_version: {
					toolId: ctx.tool.id,
					version: parsedRelease.version,
				},
			},
		})

		if (existingRelease) {
			if (existingRelease.contentHash === parsedRelease.contentHash) {
				logger.debug('Release unchanged, skipping', {
					version: parsedRelease.version,
				})
				continue
			}

			await ctx.prisma.change.deleteMany({
				where: { releaseId: existingRelease.id },
			})

			await ctx.prisma.release.update({
				where: { id: existingRelease.id },
				data: buildReleaseData(ctx, parsedRelease),
			})

			releasesUpdated++
			changesCreated += parsedRelease.changes.length
		} else {
			await ctx.prisma.release.create({
				data: {
					toolId: ctx.tool.id,
					version: parsedRelease.version,
					...buildReleaseData(ctx, parsedRelease),
				},
			})
			releasesNew++
			changesCreated += parsedRelease.changes.length
		}
	}

	logger.info('Upsert complete', {
		releasesNew,
		releasesUpdated,
		changesCreated,
	})

	return {
		releasesNew,
		releasesUpdated,
		changesCreated,
	}
}

function buildReleaseData(
	ctx: IngestionContext,
	parsedRelease: EnrichResult['enrichedReleases'][number],
) {
	return {
		versionSort: parsedRelease.versionSort,
		releaseDate: parsedRelease.releaseDate,
		isPrerelease: parsedRelease.isPrerelease ?? false,
		sourceUrl: parsedRelease.sourceUrl ?? ctx.tool.sourceUrl,
		rawContent: parsedRelease.rawContent,
		contentHash: parsedRelease.contentHash,
		title: parsedRelease.title,
		headline: parsedRelease.headline,
		summary: parsedRelease.summary,
		changes: {
			create: parsedRelease.changes.map((change) => ({
				type: change.type,
				title: change.title,
				description: change.description,
				platform: change.platform,
				component: change.component,
				isBreaking: change.isBreaking,
				isSecurity: change.isSecurity,
				isDeprecation: change.isDeprecation,
				impact: change.impact,
				links: change.links,
				media: change.media,
				order: change.order,
			})),
		},
	}
}
