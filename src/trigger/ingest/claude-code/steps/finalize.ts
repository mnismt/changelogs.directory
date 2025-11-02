import { logger } from '@trigger.dev/sdk'
import type {
	FetchResult,
	IngestionContext,
	ParseResult,
	UpsertResult,
} from '../types'

/**
 * Phase 5: Finalize
 * - Update Tool.lastFetchedAt
 * - Update FetchLog with SUCCESS status and metrics
 */
export async function finalizeStep(
	ctx: IngestionContext,
	fetchResult: FetchResult,
	parseResult: ParseResult,
	upsertResult: UpsertResult,
): Promise<void> {
	logger.info('Phase 5: Finalize')

	const duration = Date.now() - ctx.startTime

	// Update Tool lastFetchedAt
	await ctx.prisma.tool.update({
		where: { id: ctx.tool.id },
		data: { lastFetchedAt: new Date() },
	})

	// Complete FetchLog
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
			sourceEtag: fetchResult.etag,
		},
	})

	logger.info('Ingestion completed successfully', {
		duration,
		releasesFound: parseResult.releases.length,
		releasesNew: upsertResult.releasesNew,
		releasesUpdated: upsertResult.releasesUpdated,
		changesCreated: upsertResult.changesCreated,
	})
}

/**
 * Handle ingestion failure
 * - Update FetchLog with FAILED status and error details
 */
export async function handleFailure(
	ctx: IngestionContext,
	error: unknown,
): Promise<void> {
	const duration = Date.now() - ctx.startTime
	const errorMessage = error instanceof Error ? error.message : String(error)
	const errorStack = error instanceof Error ? error.stack : undefined

	logger.error('Ingestion failed', {
		error: errorMessage,
		stack: errorStack,
	})

	// Update FetchLog with FAILED status
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
