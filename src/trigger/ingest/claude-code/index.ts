import { PrismaClient } from '@prisma/client'
import { logger, schedules, task } from '@trigger.dev/sdk'
import { enrichStep } from './steps/enrich'
import { fetchStep } from './steps/fetch'
import { filterStep } from './steps/filter'
import { finalizeStep, handleFailure } from './steps/finalize'
import { parseStep } from './steps/parse'
import { setupStep } from './steps/setup'
import { upsertStep } from './steps/upsert'

const prisma = new PrismaClient()

/**
 * Ingestion task for Claude Code changelog
 * Runs every 6 hours to fetch and parse the latest CHANGELOG.md from GitHub
 */
export const ingestClaudeCode = task({
	id: 'ingest-claude-code',
	queue: {
		concurrencyLimit: 1, // Prevent duplicate jobs
	},
	maxDuration: 300, // 5 minutes max
	run: async (payload: { toolSlug?: string } = {}) => {
		const toolSlug = payload.toolSlug || 'claude-code'
		const startTime = Date.now()

		logger.info('Starting Claude Code changelog ingestion', { toolSlug })

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
			// Phase 2: Fetch
			// ============================================================================
			const fetchResult = await fetchStep(ctx)

			// ============================================================================
			// Phase 3: Parse
			// ============================================================================
			const parseResult = parseStep(fetchResult)

			parseResult.releases = parseResult.releases.slice(0, 7)

			// ============================================================================
			// Phase 4: Filter unchanged releases
			// ============================================================================
			const filterResult = await filterStep(ctx, parseResult)

			// ============================================================================
			// Phase 5: Enrich with LLM
			// ============================================================================
			const enrichResult = await enrichStep(filterResult)

			// ============================================================================
			// Phase 6: Upsert
			// ============================================================================
			const upsertResult = await upsertStep(ctx, enrichResult)

			// ============================================================================
			// Phase 7: Finalize
			// ============================================================================
			await finalizeStep(
				ctx,
				fetchResult,
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
			// This is a best-effort attempt - if setup failed, ctx won't exist
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
export const ingestClaudeCodeSchedule = schedules.task({
	id: 'ingest-claude-code-schedule',
	cron: '0 */6 * * *',
	run: async () => {
		await ingestClaudeCode.trigger({})
	},
})
