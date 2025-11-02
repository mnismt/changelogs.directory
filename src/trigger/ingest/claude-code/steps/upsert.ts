import { logger } from '@trigger.dev/sdk'
import type { EnrichResult, IngestionContext, UpsertResult } from '../types'

/**
 * Phase 6: Upsert Releases & Changes
 * - Check if release exists (by toolId + version)
 * - If exists and content changed: update release + recreate changes
 * - If new: create release with changes
 * - If unchanged: skip
 */
export async function upsertStep(
	ctx: IngestionContext,
	enrichResult: EnrichResult,
): Promise<UpsertResult> {
	logger.info('Phase 6: Upsert releases and changes')

	let releasesNew = 0
	let releasesUpdated = 0
	let changesCreated = 0

	for (const parsedRelease of enrichResult.enrichedReleases) {
		// Check if release exists
		const existingRelease = await ctx.prisma.release.findUnique({
			where: {
				toolId_version: {
					toolId: ctx.tool.id,
					version: parsedRelease.version,
				},
			},
		})

		if (existingRelease) {
			// Check if content has changed
			if (existingRelease.contentHash === parsedRelease.contentHash) {
				// No changes, skip
				logger.debug('Release unchanged, skipping', {
					version: parsedRelease.version,
				})
				continue
			}

			// Content changed - update release and re-create changes
			logger.info('Release content changed, updating', {
				version: parsedRelease.version,
				oldHash: existingRelease.contentHash,
				newHash: parsedRelease.contentHash,
			})

			// Delete old changes
			await ctx.prisma.change.deleteMany({
				where: { releaseId: existingRelease.id },
			})

			// Update release
			await ctx.prisma.release.update({
				where: { id: existingRelease.id },
				data: {
					versionSort: parsedRelease.versionSort,
					releaseDate: parsedRelease.releaseDate,
					sourceUrl: `${ctx.tool.repositoryUrl}/blob/main/CHANGELOG.md#${parsedRelease.version.replace(/\./g, '')}`,
					rawContent: parsedRelease.rawContent,
					contentHash: parsedRelease.contentHash,
					title: parsedRelease.title,
					summary: parsedRelease.summary,
					tags: parsedRelease.tags,
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
							order: change.order,
						})),
					},
				},
			})

			releasesUpdated++
			changesCreated += parsedRelease.changes.length
		} else {
			// New release - create it with changes
			logger.info('Creating new release', {
				version: parsedRelease.version,
			})

			await ctx.prisma.release.create({
				data: {
					toolId: ctx.tool.id,
					version: parsedRelease.version,
					versionSort: parsedRelease.versionSort,
					releaseDate: parsedRelease.releaseDate,
					sourceUrl: `${ctx.tool.repositoryUrl}/blob/main/CHANGELOG.md#${parsedRelease.version.replace(/\./g, '')}`,
					rawContent: parsedRelease.rawContent,
					contentHash: parsedRelease.contentHash,
					title: parsedRelease.title,
					summary: parsedRelease.summary,
					tags: parsedRelease.tags,
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
							order: change.order,
						})),
					},
				},
			})

			releasesNew++
			changesCreated += parsedRelease.changes.length
		}
	}

	logger.info('Upsert completed', {
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
