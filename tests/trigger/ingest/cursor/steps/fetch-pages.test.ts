import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPagesStep } from '@/trigger/ingest/cursor/steps/fetch-pages'
import { deleteCachedRelease, readCachedRelease } from '@/trigger/ingest/cursor/cache'
import type { IngestionContext } from '@/trigger/ingest/cursor/types'
import { createMockFetchLog, createMockTool, loadCursorChangelogFixture } from 'tests/helpers/fixtures'

vi.mock('@/trigger/ingest/cursor/cache', () => ({
	readCachedRelease: vi.fn(),
	deleteCachedRelease: vi.fn(),
	writeCachedRelease: vi.fn(),
}))

describe('fetchPagesStep', () => {
	const html = loadCursorChangelogFixture()
	let ctx: IngestionContext

	beforeEach(() => {
		vi.restoreAllMocks()

		const release = {
			count: vi.fn(),
			findFirst: vi.fn(),
		}

		ctx = {
			prisma: {
				release,
			} as any,
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

		release.count.mockResolvedValue(2)
		release.findFirst.mockResolvedValue({ id: 'release-1' })

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

	it('treats cache as stale when database is empty and runs full scan', async () => {
		vi.mocked(readCachedRelease).mockResolvedValue({
			slug: '2-0-91',
		})

		vi.mocked(ctx.prisma.release.count).mockResolvedValue(0)

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

		expect(deleteCachedRelease).toHaveBeenCalledTimes(1)
		expect(result.cachedSlug).toBeNull()
		expect(result.initialScan).toBe(true)
		expect(global.fetch).toHaveBeenCalledTimes(2)
	})

	it('falls back to full scan when cached slug is not seen within the page limit', async () => {
		vi.mocked(readCachedRelease).mockResolvedValue({
			slug: '2-0-92',
		})

		vi.mocked(global.fetch)
			// First pass with cache (maxPagesPerRun = 2)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				text: vi.fn().mockResolvedValue(html),
			} as any)
			.mockResolvedValueOnce({
				ok: false,
				status: 404,
			} as any)
			// Rescan with initialPageCount (3)
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

		expect(deleteCachedRelease).toHaveBeenCalledTimes(1)
		expect(result.initialScan).toBe(true)
		expect(result.cachedSlug).toBeNull()
		expect(global.fetch).toHaveBeenCalledTimes(4)
	})
})
