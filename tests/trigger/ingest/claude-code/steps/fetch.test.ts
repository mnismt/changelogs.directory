import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchStep } from '@/trigger/ingest/claude-code/steps/fetch'
import { createMockTool, createMockFetchLog, loadChangelogFixture } from 'tests/helpers/fixtures'
import type { IngestionContext } from '@/trigger/ingest/claude-code/types'

describe('fetchStep', () => {
	const mockContext: IngestionContext = {
		prisma: {} as any,
		toolSlug: 'claude-code',
		tool: createMockTool(),
		fetchLog: createMockFetchLog(),
		startTime: Date.now(),
	}

	beforeEach(() => {
		vi.restoreAllMocks()
		global.fetch = vi.fn()
	})

	it('should fetch changelog from sourceUrl', async () => {
		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers({
				etag: 'W/"test-etag"',
			}),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await fetchStep(mockContext)

		expect(global.fetch).toHaveBeenCalledWith(mockContext.tool.sourceUrl, {
			headers: {
				'User-Agent': 'Changelogs.directory Bot',
				Accept: 'text/plain',
			},
		})
		expect(result.markdown).toBe(markdown)
	})

	it('should extract ETag header', async () => {
		const markdown = loadChangelogFixture()
		const etag = 'W/"test-etag-123"'
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers({
				etag,
			}),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await fetchStep(mockContext)

		expect(result.etag).toBe(etag)
	})

	it('should handle missing ETag header', async () => {
		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers(),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await fetchStep(mockContext)

		expect(result.etag).toBeNull()
	})

	it('should throw error on non-OK response', async () => {
		const mockResponse = {
			ok: false,
			status: 404,
			statusText: 'Not Found',
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		await expect(fetchStep(mockContext)).rejects.toThrow(
			'Failed to fetch changelog: 404 Not Found',
		)
	})

	it('should handle network errors', async () => {
		const networkError = new Error('Network error')
		vi.mocked(global.fetch).mockRejectedValue(networkError)

		await expect(fetchStep(mockContext)).rejects.toThrow('Network error')
	})

	it('should return markdown and etag', async () => {
		const markdown = loadChangelogFixture()
		const etag = 'W/"test-etag"'
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers({ etag }),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await fetchStep(mockContext)

		expect(result).toHaveProperty('markdown')
		expect(result).toHaveProperty('etag')
		expect(result.markdown).toBe(markdown)
		expect(result.etag).toBe(etag)
	})
})

