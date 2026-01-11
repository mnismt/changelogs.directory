import type { FetchLog, PrismaClient, Tool } from '@/generated/prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'
import type { GitHubRelease } from '@/lib/parsers/github-releases'

/**
 * Context passed between ingestion steps
 */
export interface IngestionContext {
	prisma: PrismaClient
	toolSlug: string
	tool: Tool
	fetchLog: FetchLog
	startTime: number
	forceFullRescan?: boolean
}

/**
 * Result from fetch step
 */
export interface FetchResult {
	releases: GitHubRelease[]
	etag?: string | null
}

/**
 * Result from parse step
 */
export interface ParseResult {
	releases: ParsedRelease[]
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

/**
 * Result from upsert step
 */
export interface UpsertResult {
	releasesNew: number
	releasesUpdated: number
	changesCreated: number
}
