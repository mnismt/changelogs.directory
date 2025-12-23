import { logger, schedules, task } from '@trigger.dev/sdk'
import { PrismaClient } from '@/generated/prisma'
import { enrichStep } from './steps/enrich'
import { fetchStep } from './steps/fetch'
import { filterStep } from './steps/filter'
import { finalizeStep, handleFailure } from './steps/finalize'
import { parseStep } from './steps/parse'
import { setupStep } from './steps/setup'
import { upsertStep } from './steps/upsert'

const prisma = new PrismaClient()

/**
 * Ingestion task for OpenAI Codex
 * Fetches releases from GitHub Releases API and ingests them
 * Runs every 6 hours
 */
export const ingestCodex = task({
	id: 'ingest-codex',
	queue: {
		concurrencyLimit: 1, // Prevent duplicate jobs
	},
	maxDuration: 300, // 5 minutes max
	run: async (payload: { toolSlug?: string } = {}) => {
		const toolSlug = payload.toolSlug || 'codex'
		const startTime = Date.now()

		logger.info('Starting Codex changelog ingestion', { toolSlug })

		try {
			// ============================================================================
			// Phase 1: Setup
			// ============================================================================
			const setupResult = await setupStep(prisma, toolSlug, startTime)

			// Handle skipped ingestion (inactive tool)
			if ('skipped' in setupResult) {
				return setupResult
			}

			const ctx = setupResult

			// ============================================================================
			// Phase 2: Fetch from GitHub Releases API
			// ============================================================================
			const fetchResult = await fetchStep(ctx)

			// ============================================================================
			// Phase 3: Parse
			// ============================================================================
			const config = ctx.tool.sourceConfig as {
				versionPrefix?: string
			} | null

			const parseResult = parseStep(fetchResult, {
				versionPrefix: config?.versionPrefix,
				repositoryUrl: ctx.tool.repositoryUrl,
			})

			// ============================================================================
			// Phase 4: Filter unchanged releases
			// ============================================================================
			const filterResult = await filterStep(ctx, parseResult)

			// ============================================================================
			// Phase 5: Enrich with LLM
			// ============================================================================
			const enrichResult = await enrichStep(ctx, filterResult)

			// ============================================================================
			// Phase 6: Upsert
			// ============================================================================
			const upsertResult = await upsertStep(ctx, enrichResult)

			// ============================================================================
			// Phase 7: Finalize
			// ============================================================================
			await finalizeStep(
				ctx,
				{ etag: null }, // GitHub Releases API doesn't return ETags like raw file fetches
				parseResult,
				filterResult,
				upsertResult,
			)

			return {
				success: true,
				duration: Date.now() - startTime,
				releasesFound: parseResult.releases.length,
				releasesSkipped: filterResult.releasesSkipped,
				releasesNew: upsertResult.releasesNew,
				releasesUpdated: upsertResult.releasesUpdated,
				changesCreated: upsertResult.changesCreated,
			}
		} catch (error) {
			// Try to update FetchLog with error if context exists
			try {
				const partialCtx = await prisma.fetchLog.findFirst({
					where: {
						startedAt: { gte: new Date(startTime) },
					},
					orderBy: { startedAt: 'desc' },
					include: { tool: true },
				})

				if (partialCtx?.tool) {
					await handleFailure(
						{
							prisma,
							toolSlug,
							tool: partialCtx.tool,
							fetchLog: partialCtx,
							startTime,
						},
						error,
					)
				}
			} catch (logError) {
				logger.error('Failed to update FetchLog', { error: logError })
			}

			// Re-throw for Trigger.dev retry logic
			throw error
		}
	},
})

/**
 * Schedule: Run ingestion every 6 hours
 * Runs at minute 0 of every 6th hour (00:00, 06:00, 12:00, 18:00 UTC)
 */
export const ingestCodexSchedule = schedules.task({
	id: 'ingest-codex-schedule',
	cron: '0 */6 * * *',
	run: async () => {
		await ingestCodex.trigger({})
	},
})
