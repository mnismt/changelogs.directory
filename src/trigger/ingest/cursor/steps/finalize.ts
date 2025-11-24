import { logger } from '@trigger.dev/sdk'
import { writeCachedRelease } from '../cache'
import type {
	FetchResult,
	FilterResult,
	IngestionContext,
	ParseResult,
	UpsertResult,
} from '../types'

export async function finalizeStep(
	ctx: IngestionContext,
	fetchResult: FetchResult,
	parseResult: ParseResult,
	filterResult: FilterResult,
	upsertResult: UpsertResult,
): Promise<void> {
	logger.info('Phase 7: Finalize Cursor ingestion')

	const duration = Date.now() - ctx.startTime

	await ctx.prisma.tool.update({
		where: { id: ctx.tool.id },
		data: { lastFetchedAt: new Date() },
	})

	await ctx.prisma.fetchLog.update({
		where: { id: ctx.fetchLog.id },
		data: {
			status: 'SUCCESS',
			completedAt: new Date(),
			duration,
			releasesFound: parseResult.releases.length,
			releasesNew: upsertResult.releasesNew,
			releasesUpdated: upsertResult.releasesUpdated,
			changesCreated: upsertResult.changesCreated,
		},
	})

	if (parseResult.newestRelease?.slug) {
		await writeCachedRelease(ctx.toolSlug, parseResult.newestRelease)
	}

	logger.info('Cursor ingestion completed', {
		duration,
		pagesFetched: fetchResult.pages.length,
		initialScan: fetchResult.initialScan,
		releasesFound: parseResult.releases.length,
		releasesSkipped: filterResult.releasesSkipped,
		releasesNew: upsertResult.releasesNew,
		releasesUpdated: upsertResult.releasesUpdated,
	})
}

export async function handleFailure(
	ctx: IngestionContext,
	error: unknown,
): Promise<void> {
	const duration = Date.now() - ctx.startTime
	const errorMessage = error instanceof Error ? error.message : String(error)
	const errorStack = error instanceof Error ? error.stack : undefined

	logger.error('Cursor ingestion failed', { error: errorMessage })

	await ctx.prisma.fetchLog.update({
		where: { id: ctx.fetchLog.id },
		data: {
			status: 'FAILED',
			completedAt: new Date(),
			duration,
			error: errorMessage,
			errorStack,
		},
	})
}
