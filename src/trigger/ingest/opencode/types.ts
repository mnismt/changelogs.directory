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
}

/**
 * Result from upsert step
 */
export interface UpsertResult {
	releasesNew: number
	releasesUpdated: number
	changesCreated: number
}
