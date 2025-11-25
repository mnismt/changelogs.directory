import { beforeEach, describe, expect, it, vi } from 'vitest'
import { finalizeStep } from '@/trigger/ingest/cursor/steps/finalize'
import { writeCachedRelease } from '@/trigger/ingest/cursor/cache'
import type {
	FetchResult,
	FilterResult,
	IngestionContext,
	ParseResult,
	UpsertResult,
} from '@/trigger/ingest/cursor/types'
import { createMockFetchLog, createMockTool } from 'tests/helpers/fixtures'

vi.mock('@/trigger/ingest/cursor/cache', () => ({
	writeCachedRelease: vi.fn(),
	readCachedRelease: vi.fn(),
}))

describe('finalizeStep', () => {
	let ctx: IngestionContext
	let prismaMock: any

	beforeEach(() => {
		prismaMock = {
			tool: { update: vi.fn().mockResolvedValue(null) },
			fetchLog: { update: vi.fn().mockResolvedValue(null) },
		}

		ctx = {
			prisma: prismaMock,
			toolSlug: 'cursor',
			tool: createMockTool({ slug: 'cursor' }),
			fetchLog: createMockFetchLog(),
			startTime: Date.now(),
			forceFullRescan: false,
		}

		vi.clearAllMocks()
	})

	it('persists cache metadata for the newest release', async () => {
		const fetchResult: FetchResult = {
			pages: [],
			cachedSlug: null,
			cacheEntry: null,
			initialScan: true,
		}

		const parseResult: ParseResult = {
			releases: [],
			newestRelease: {
				slug: '2-1',
				contentHash: 'hash',
				releaseDate: '2025-11-21T10:00:00.000Z',
			},
		}

		const filterResult: FilterResult = { releases: [], releasesSkipped: 0 }
		const upsertResult: UpsertResult = {
			releasesNew: 0,
			releasesUpdated: 0,
			changesCreated: 0,
		}

		await finalizeStep(ctx, fetchResult, parseResult, filterResult, upsertResult)

		expect(prismaMock.tool.update).toHaveBeenCalled()
		expect(prismaMock.fetchLog.update).toHaveBeenCalled()
		expect(writeCachedRelease).toHaveBeenCalledWith(
			'cursor',
			parseResult.newestRelease,
		)
	})
})
