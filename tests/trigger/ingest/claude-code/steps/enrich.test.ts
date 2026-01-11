import { describe, expect, it, vi, beforeEach } from 'vitest'
import { enrichStep } from '@/trigger/ingest/claude-code/steps/enrich'
import { createMockParsedRelease } from 'tests/helpers/fixtures'
import type { FilterResult } from '@/trigger/ingest/claude-code/types'
import type { IngestionContext } from '@/trigger/ingest/claude-code/types'

vi.mock('@/lib/enrichment/llm', () => ({
	enrichReleaseWithLLM: vi.fn(),
}))

vi.mock('@/lib/llm', () => ({
	llm: { provider: 'test' },
}))

describe('enrichStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const mockCtx = {
		prisma: {
			release: {
				findFirst: vi.fn().mockResolvedValue(null),
			},
		},
		toolSlug: 'claude-code',
		tool: { id: 'tool-id' },
		fetchLog: { id: 'fetch-log-id' },
		startTime: Date.now(),
	} as unknown as IngestionContext

	it('should call LLM enrichment for each release', async () => {
		const { enrichReleaseWithLLM } = await import('@/lib/enrichment/llm')
		const enrichedRelease1 = createMockParsedRelease({
			version: '2.0.31',
			summary: 'Enriched summary 1',
		})
		const enrichedRelease2 = createMockParsedRelease({
			version: '2.0.30',
			summary: 'Enriched summary 2',
		})

		vi.mocked(enrichReleaseWithLLM)
			.mockResolvedValueOnce({
				release: enrichedRelease1,
				success: true,
				modelUsed: null,
				circuitBreakerTriggered: false,
			})
			.mockResolvedValueOnce({
				release: enrichedRelease2,
				success: true,
				modelUsed: null,
				circuitBreakerTriggered: false,
			})

		const filterResult: FilterResult = {
			releases: [
				createMockParsedRelease({ version: '2.0.31' }),
				createMockParsedRelease({ version: '2.0.30' }),
			],
			releasesSkipped: 0,
		}

		const result = await enrichStep(mockCtx, filterResult)

		expect(enrichReleaseWithLLM).toHaveBeenCalledTimes(2)
		expect(result.enrichedReleases).toHaveLength(2)
		expect(result.enrichedReleases[0].summary).toBe('Enriched summary 1')
		expect(result.enrichedReleases[1].summary).toBe('Enriched summary 2')
	})

	it('should fall back to original when LLM unavailable', async () => {
		const { enrichReleaseWithLLM } = await import('@/lib/enrichment/llm')
		const originalRelease = createMockParsedRelease({
			version: '2.0.31',
			summary: 'Original summary',
		})

		vi.mocked(enrichReleaseWithLLM).mockResolvedValue({
			release: originalRelease,
			success: false,
			modelUsed: null,
			circuitBreakerTriggered: false,
		})

		const filterResult: FilterResult = {
			releases: [originalRelease],
			releasesSkipped: 0,
		}

		const result = await enrichStep(mockCtx, filterResult)

		expect(result.enrichedReleases).toHaveLength(1)
		expect(result.enrichedReleases[0]).toEqual(originalRelease)
	})

	it('should handle LLM errors gracefully', async () => {
		const { enrichReleaseWithLLM } = await import('@/lib/enrichment/llm')
		const originalRelease = createMockParsedRelease({
			version: '2.0.31',
		})

		vi.mocked(enrichReleaseWithLLM).mockRejectedValue(new Error('LLM error'))

		const filterResult: FilterResult = {
			releases: [originalRelease],
			releasesSkipped: 0,
		}

		await expect(enrichStep(mockCtx, filterResult)).rejects.toThrow(
			'LLM error',
		)
	})

	it('should handle empty releases array', async () => {
		const filterResult: FilterResult = {
			releases: [],
			releasesSkipped: 5,
		}

		const result = await enrichStep(mockCtx, filterResult)

		expect(result.enrichedReleases).toHaveLength(0)
	})

	it('should process releases in parallel', async () => {
		const { enrichReleaseWithLLM } = await import('@/lib/enrichment/llm')
		const releases = Array.from({ length: 5 }, (_, i) =>
			createMockParsedRelease({ version: `2.0.${30 + i}` }),
		)

		vi.mocked(enrichReleaseWithLLM).mockImplementation(async (release) => ({
			release,
			success: true,
			modelUsed: null,
			circuitBreakerTriggered: false,
		}))

		const filterResult: FilterResult = {
			releases,
			releasesSkipped: 0,
		}

		const startTime = Date.now()
		await enrichStep(mockCtx, filterResult)
		const duration = Date.now() - startTime

		expect(enrichReleaseWithLLM).toHaveBeenCalledTimes(5)
		expect(duration).toBeLessThan(1000)
	})
})

