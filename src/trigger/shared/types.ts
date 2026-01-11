import type { FetchLog, PrismaClient, Tool } from '@/generated/prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

/**
 * Shared context passed between ingestion steps
 */
export interface IngestionContext {
	prisma: PrismaClient
	toolSlug: string
	tool: Tool
	fetchLog: FetchLog
	startTime: number
}

/**
 * Result from filter step
 */
export interface FilterResult {
	releases: ParsedRelease[]
	releasesSkipped: number
}

/**
 * Result from enrich step
 */
export interface EnrichResult {
	enrichedReleases: ParsedRelease[]
	stats?: EnrichmentStats
}

/**
 * Stats from LLM enrichment
 */
export interface EnrichmentStats {
	total: number
	succeeded: number
	failed: number
	circuitBreakerTriggered: number
	modelUsage: Record<string, number>
}
