import { logger } from '@trigger.dev/sdk'
import type { PrismaClient } from '@/generated/prisma/client'
import type { IngestionContext } from '../types'

/**
 * Phase 1: Setup
 * - Load tool from database
 * - Validate tool is active
 * - Create FetchLog with IN_PROGRESS status
 */
export async function setupStep(
	prisma: PrismaClient,
	toolSlug: string,
	startTime: number,
	forceFullRescan?: boolean,
): Promise<IngestionContext | { skipped: true; reason: string }> {
	logger.info('Phase 1: Setup', { toolSlug })

	// Load Tool record from database
	const tool = await prisma.tool.findUnique({
		where: { slug: toolSlug },
	})

	if (!tool) {
		throw new Error(`Tool with slug "${toolSlug}" not found in database`)
	}

	if (!tool.isActive) {
		logger.info('Tool is inactive, skipping ingestion', { toolSlug })
		return { skipped: true, reason: 'tool_inactive' }
	}

	logger.info('Tool loaded', {
		toolId: tool.id,
		name: tool.name,
		sourceUrl: tool.sourceUrl,
	})

	// Create FetchLog with IN_PROGRESS status
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
		forceFullRescan,
	}
}
