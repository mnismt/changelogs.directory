import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPagesStep } from '@/trigger/ingest/cursor/steps/fetch-pages'
import { readCachedRelease } from '@/trigger/ingest/cursor/cache'
import type { IngestionContext } from '@/trigger/ingest/cursor/types'
import { createMockFetchLog, createMockTool, loadCursorChangelogFixture } from 'tests/helpers/fixtures'

vi.mock('@/trigger/ingest/cursor/cache', () => ({
	readCachedRelease: vi.fn(),
	writeCachedRelease: vi.fn(),
}))

describe('fetchPagesStep', () => {
	const html = loadCursorChangelogFixture()
	let ctx: IngestionContext

	beforeEach(() => {
		ctx = {
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
		}

		vi.restoreAllMocks()
		global.fetch = vi.fn()
	})

	it('stops fetching once cached slug is encountered', async () => {
		vi.mocked(readCachedRelease).mockResolvedValue({
			slug: '2-0-91',
		})

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			status: 200,
			text: vi.fn().mockResolvedValue(html),
		} as any)

		const result = await fetchPagesStep(ctx)

		expect(global.fetch).toHaveBeenCalledTimes(1)
		expect(result.pages).toHaveLength(1)
		expect(result.cachedSlug).toBe('2-0-91')
	})

	it('performs initial scan until pagination ends', async () => {
		vi.mocked(readCachedRelease).mockResolvedValue(null)

		vi.mocked(global.fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(html),
			} as any)
			.mockResolvedValueOnce({
				ok: false,
				status: 404,
			} as any)

		const result = await fetchPagesStep(ctx)

		expect(global.fetch).toHaveBeenCalledTimes(2)
		expect(result.pages).toHaveLength(1)
		expect(result.initialScan).toBe(true)
	})
})

