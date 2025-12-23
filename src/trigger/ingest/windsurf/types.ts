import type { FetchLog, PrismaClient, Tool } from '@/generated/prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

export interface WindsurfSourceConfig {
	baseUrl?: string
	startPath?: string
	releaseSelector?: string
	bodySelector?: string
	maxReleasesPerRun?: number
}

export interface CachedWindsurfRelease {
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
	cacheEntry: CachedWindsurfRelease | null
	initialScan: boolean
}

export interface ParseResult {
	releases: ParsedRelease[]
	newestRelease: CachedWindsurfRelease | null
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
