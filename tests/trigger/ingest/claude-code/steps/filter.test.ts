import { describe, expect, it, vi } from 'vitest'
import { filterStep } from '@/trigger/ingest/claude-code/steps/filter'
import { createMockPrisma } from 'tests/helpers/prisma-mock'
import { createMockTool, createMockFetchLog, createMockParsedRelease } from 'tests/helpers/fixtures'
import type { IngestionContext, ParseResult } from '@/trigger/ingest/claude-code/types'

describe('filterStep', () => {
	const mockContext: IngestionContext = {
		prisma: createMockPrisma() as any,
		toolSlug: 'claude-code',
		tool: createMockTool(),
		fetchLog: createMockFetchLog(),
		startTime: Date.now(),
	}

	it('should filter out releases with matching contentHash', async () => {
		const existingRelease = {
			version: '2.0.31',
			contentHash: 'existing-hash',
		}

		const parseResult: ParseResult = {
			releases: [
				createMockParsedRelease({
					version: '2.0.31',
					contentHash: 'existing-hash',
				}),
				createMockParsedRelease({
					version: '2.0.30',
					contentHash: 'new-hash',
				}),
			],
		}

		mockContext.prisma.release.findMany = vi.fn().mockResolvedValue([
			existingRelease,
		])

		const result = await filterStep(mockContext, parseResult)

		expect(result.releases).toHaveLength(1)
		expect(result.releases[0].version).toBe('2.0.30')
		expect(result.releasesSkipped).toBe(1)
	})

	it('should keep new releases', async () => {
		const parseResult: ParseResult = {
			releases: [
				createMockParsedRelease({
					version: '2.0.31',
					contentHash: 'new-hash-1',
				}),
				createMockParsedRelease({
					version: '2.0.30',
					contentHash: 'new-hash-2',
				}),
			],
		}

		mockContext.prisma.release.findMany = vi.fn().mockResolvedValue([])

		const result = await filterStep(mockContext, parseResult)

		expect(result.releases).toHaveLength(2)
		expect(result.releasesSkipped).toBe(0)
	})

	it('should keep releases with changed contentHash', async () => {
		const existingRelease = {
			version: '2.0.31',
			contentHash: 'old-hash',
		}

		const parseResult: ParseResult = {
			releases: [
				createMockParsedRelease({
					version: '2.0.31',
					contentHash: 'new-hash',
				}),
			],
		}

		mockContext.prisma.release.findMany = vi.fn().mockResolvedValue([
			existingRelease,
		])

		const result = await filterStep(mockContext, parseResult)

		expect(result.releases).toHaveLength(1)
		expect(result.releases[0].version).toBe('2.0.31')
		expect(result.releasesSkipped).toBe(0)
	})

	it('should return correct skipped count', async () => {
		const existingRelease = {
			version: '2.0.31',
			contentHash: 'matching-hash',
		}

		const parseResult: ParseResult = {
			releases: [
				createMockParsedRelease({
					version: '2.0.31',
					contentHash: 'matching-hash',
				}),
				createMockParsedRelease({
					version: '2.0.30',
					contentHash: 'new-hash',
				}),
				createMockParsedRelease({
					version: '2.0.29',
					contentHash: 'another-new-hash',
				}),
			],
		}

		mockContext.prisma.release.findMany = vi.fn().mockResolvedValue([
			existingRelease,
		])

		const result = await filterStep(mockContext, parseResult)

		expect(result.releases).toHaveLength(2)
		expect(result.releasesSkipped).toBe(1)
	})

	it('should handle empty releases array', async () => {
		const parseResult: ParseResult = {
			releases: [],
		}

		const result = await filterStep(mockContext, parseResult)

		expect(result.releases).toHaveLength(0)
		expect(result.releasesSkipped).toBe(0)
	})

	it('should query existing releases by version', async () => {
		const parseResult: ParseResult = {
			releases: [
				createMockParsedRelease({ version: '2.0.31' }),
				createMockParsedRelease({ version: '2.0.30' }),
			],
		}

		mockContext.prisma.release.findMany = vi.fn().mockResolvedValue([])

		await filterStep(mockContext, parseResult)

		expect(mockContext.prisma.release.findMany).toHaveBeenCalledWith({
			where: {
				toolId: mockContext.tool.id,
				version: { in: ['2.0.31', '2.0.30'] },
			},
			select: {
				version: true,
				contentHash: true,
			},
		})
	})
})

