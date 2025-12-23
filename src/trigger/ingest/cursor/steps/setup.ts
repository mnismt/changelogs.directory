import { logger } from '@trigger.dev/sdk'
import type { PrismaClient } from '@/generated/prisma/client'
import type { IngestionContext } from '../types'

export async function setupStep(
	prisma: PrismaClient,
	toolSlug: string,
	startTime: number,
): Promise<
	Omit<IngestionContext, 'forceFullRescan'> | { skipped: true; reason: string }
> {
	logger.info('Phase 1: Setup', { toolSlug })

	const tool = await prisma.tool.findUnique({
		where: { slug: toolSlug },
	})

	if (!tool) {
		throw new Error(`Tool with slug "${toolSlug}" not found`)
	}

	if (!tool.isActive) {
		logger.info('Tool inactive, skipping ingestion', { toolSlug })
		return { skipped: true, reason: 'tool_inactive' }
	}

	const fetchLog = await prisma.fetchLog.create({
		data: {
			toolId: tool.id,
			status: 'IN_PROGRESS',
			sourceUrl: tool.sourceUrl,
		},
	})

	logger.info('FetchLog created', { fetchLogId: fetchLog.id })

	return {
		prisma,
		toolSlug,
		tool,
		fetchLog,
		startTime,
	}
}
