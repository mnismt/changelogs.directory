import { describe, expect, it } from 'vitest'
import { parseStep } from '@/trigger/ingest/windsurf/steps/parse'
import type { FetchResult, IngestionContext } from '@/trigger/ingest/windsurf/types'
import {
	createMockFetchLog,
	createMockTool,
	loadWindsurfChangelogFixture,
} from 'tests/helpers/fixtures'

describe('parseStep (Windsurf)', () => {
	const html = loadWindsurfChangelogFixture()
	const ctx: IngestionContext = {
		prisma: {} as any,
		toolSlug: 'windsurf',
		tool: createMockTool({
			slug: 'windsurf',
			sourceType: 'CUSTOM_API',
			sourceUrl: 'https://windsurf.com/changelog',
			sourceConfig: {
				maxReleasesPerRun: 3,
			},
		}),
		fetchLog: createMockFetchLog(),
		startTime: Date.now(),
		forceFullRescan: false,
	}

	it('returns releases until cached slug and keeps cached release for change detection', () => {
		const fetchResult: FetchResult = {
			page: { url: 'https://windsurf.com/changelog', html },
			cachedSlug: '1.12.37',
			cacheEntry: { slug: '1.12.37' },
			initialScan: false,
		}

		const result = parseStep(ctx, fetchResult)

		expect(result.releases).toHaveLength(2)
		expect(result.releases[0].version).toBe('windsurf-1.12.39')
		expect(result.releases[1].version).toBe('windsurf-1.12.37')
		expect(result.newestRelease?.slug).toBe('1.12.39')
	})

	it('parses all releases when no cache entry exists', () => {
		const fetchResult: FetchResult = {
			page: { url: 'https://windsurf.com/changelog', html },
			cachedSlug: null,
			cacheEntry: null,
			initialScan: true,
		}

		const result = parseStep(ctx, fetchResult)

		expect(result.releases).toHaveLength(2)
	})
})
