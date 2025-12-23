import { PrismaPg } from '@prisma/adapter-pg'
import { logger, schedules, task } from '@trigger.dev/sdk'
import { PrismaClient } from '@/generated/prisma/client'
import { enrichStep } from './steps/enrich'
import { fetchPageStep } from './steps/fetch-page'
import { filterStep } from './steps/filter'
import { finalizeStep, handleFailure } from './steps/finalize'
import { parseStep } from './steps/parse'
import { setupStep } from './steps/setup'
import { upsertStep } from './steps/upsert'
import type { IngestionContext } from './types'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export const ingestWindsurf = task({
	id: 'ingest-windsurf',
	queue: {
		concurrencyLimit: 1,
	},
	maxDuration: 1200,
	run: async (
		payload: { toolSlug?: string; forceFullRescan?: boolean } = {},
	) => {
		const toolSlug = payload.toolSlug || 'windsurf'
		const forceFullRescan = payload.forceFullRescan ?? false
		const startTime = Date.now()
		let ctx: IngestionContext | null = null

		logger.info('Starting Windsurf changelog ingestion', { toolSlug })

		try {
			const setupResult = await setupStep(prisma, toolSlug, startTime)
			if ('skipped' in setupResult) {
				return setupResult
			}

			ctx = { ...setupResult, forceFullRescan }

			const fetchResult = await fetchPageStep(ctx)
			const parseResult = parseStep(ctx, fetchResult)
			const filterResult = await filterStep(ctx, parseResult)
			const enrichResult = await enrichStep(ctx, filterResult)
			const upsertResult = await upsertStep(ctx, enrichResult)

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
			if (ctx) {
				try {
					await handleFailure(ctx, error)
				} catch (logError) {
					logger.error('Failed to update FetchLog after error', {
						error: logError,
					})
				}
			} else {
				logger.error('Windsurf ingestion failed before setup completed', {
					error,
				})
			}

			throw error
		}
	},
})

export const ingestWindsurfSchedule = schedules.task({
	id: 'ingest-windsurf-schedule',
	cron: '0 */6 * * *',
	run: async () => {
		await ingestWindsurf.trigger({})
	},
})
