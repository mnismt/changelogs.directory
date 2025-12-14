import { describe, expect, it } from 'vitest'
import { parseStep } from '@/trigger/ingest/cursor/steps/parse'
import type { FetchResult, IngestionContext } from '@/trigger/ingest/cursor/types'
import { createMockFetchLog, createMockTool, loadCursorChangelogFixture } from 'tests/helpers/fixtures'

describe('parseStep', () => {
	const html = loadCursorChangelogFixture()
	const ctx: IngestionContext = {
		prisma: {} as any,
		toolSlug: 'cursor',
		tool: createMockTool({
			slug: 'cursor',
			sourceType: 'CUSTOM_API',
			sourceUrl: 'https://cursor.com/changelog',
			sourceConfig: {
				maxPagesPerRun: 2,
				initialPageCount: 3,
			},
		}),
		fetchLog: createMockFetchLog(),
		startTime: Date.now(),
		forceFullRescan: false,
	}

	it('returns releases until cached slug and keeps cached release for change detection', () => {
		const fetchResult: FetchResult = {
			pages: [{ url: 'https://cursor.com/changelog', pageNumber: 1, html }],
			cachedSlug: '2-0',
			cacheEntry: { slug: '2-0' },
			initialScan: false,
		}

		const result = parseStep(ctx, fetchResult)

		expect(result.releases).toHaveLength(2)
		expect(result.releases[0].version).toBe('cursor-2-1')
		expect(result.releases[1].version).toBe('cursor-2-0')
		expect(result.newestRelease?.slug).toBe('2-1')
		expect(result.newestRelease?.contentHash).toBeDefined()
	})

	it('parses all releases when no cache entry exists', () => {
		const fetchResult: FetchResult = {
			pages: [{ url: 'https://cursor.com/changelog', pageNumber: 1, html }],
			cachedSlug: null,
			cacheEntry: null,
			initialScan: true,
		}

		const result = parseStep(ctx, fetchResult)

		expect(result.releases).toHaveLength(2)
	})
})
