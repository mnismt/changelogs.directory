import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPageStep } from '@/trigger/ingest/windsurf/steps/fetch-page'
import {
	deleteCachedRelease,
	readCachedRelease,
} from '@/trigger/ingest/windsurf/cache'
import type { IngestionContext } from '@/trigger/ingest/windsurf/types'
import {
	createMockFetchLog,
	createMockTool,
	loadWindsurfChangelogFixture,
} from 'tests/helpers/fixtures'

vi.mock('@/trigger/ingest/windsurf/cache', () => ({
	readCachedRelease: vi.fn(),
	deleteCachedRelease: vi.fn(),
	writeCachedRelease: vi.fn(),
}))

describe('fetchPageStep (Windsurf)', () => {
	const html = loadWindsurfChangelogFixture()
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
			toolSlug: 'windsurf',
			tool: createMockTool({
				slug: 'windsurf',
				sourceType: 'CUSTOM_API',
				sourceUrl: 'https://windsurf.com/changelog',
				sourceConfig: {
					maxReleasesPerRun: 2,
				},
			}),
			fetchLog: createMockFetchLog(),
			startTime: Date.now(),
			forceFullRescan: false,
		}

		release.count.mockResolvedValue(2)
		release.findFirst.mockResolvedValue({ id: 'release-1' })

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: vi.fn().mockResolvedValue(html),
		} as any)
	})

	it('returns cached slug when present', async () => {
		vi.mocked(readCachedRelease).mockResolvedValue({
			slug: '1.12.37',
		})

		const result = await fetchPageStep(ctx)

		expect(global.fetch).toHaveBeenCalledTimes(1)
		expect(result.cachedSlug).toBe('1.12.37')
		expect(result.initialScan).toBe(false)
	})

	it('clears stale cache when database is empty', async () => {
		vi.mocked(readCachedRelease).mockResolvedValue({
			slug: '1.12.37',
		})

		vi.mocked(ctx.prisma.release.count).mockResolvedValue(0)

		const result = await fetchPageStep(ctx)

		expect(deleteCachedRelease).toHaveBeenCalledTimes(1)
		expect(result.cachedSlug).toBeNull()
		expect(result.initialScan).toBe(true)
	})

	it('bypasses cache when forceFullRescan is true', async () => {
		ctx.forceFullRescan = true

		const result = await fetchPageStep(ctx)

		expect(readCachedRelease).not.toHaveBeenCalled()
		expect(result.cachedSlug).toBeNull()
		expect(result.initialScan).toBe(true)
	})
})
