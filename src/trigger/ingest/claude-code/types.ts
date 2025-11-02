import type { FetchLog, PrismaClient, Tool } from '@prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

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
	markdown: string
	etag: string | null
}

/**
 * Result from parse step
 */
export interface ParseResult {
	releases: ParsedRelease[]
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
