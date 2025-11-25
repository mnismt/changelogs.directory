import type { FetchLog, PrismaClient, Tool } from '@prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

export interface CursorSourceConfig {
	baseUrl?: string
	startPath?: string
	articleSelector?: string
	bodySelector?: string
	maxPagesPerRun?: number
	initialPageCount?: number
}

export interface CachedCursorRelease {
	slug: string
	contentHash?: string
	releaseDate?: string
}

export interface IngestionContext {
	prisma: PrismaClient
	toolSlug: string
	tool: Tool
	fetchLog: FetchLog
	startTime: number
	forceFullRescan: boolean
}

export interface FetchResult {
	pages: Array<{
		url: string
		pageNumber: number
		html: string
	}>
	cachedSlug: string | null
	cacheEntry: CachedCursorRelease | null
	initialScan: boolean
}

export interface ParseResult {
	releases: ParsedRelease[]
	newestRelease: CachedCursorRelease | null
}

export interface FilterResult {
	releases: ParsedRelease[]
	releasesSkipped: number
}

export interface EnrichResult {
	enrichedReleases: ParsedRelease[]
}

export interface UpsertResult {
	releasesNew: number
	releasesUpdated: number
	changesCreated: number
}
