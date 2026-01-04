import type { FetchLog, PrismaClient, Tool } from '@/generated/prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

export interface AntigravitySourceConfig {
	baseUrl?: string
	startPath?: string
	maxReleasesPerRun?: number
}

export interface CachedAntigravityRelease {
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
	page: {
		url: string
		html: string
	}
	cachedSlug: string | null
	cacheEntry: CachedAntigravityRelease | null
	initialScan: boolean
}

export interface ParseResult {
	releases: ParsedRelease[]
	newestRelease: CachedAntigravityRelease | null
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
