import { describe, expect, it, vi } from 'vitest'
import { upsertStep } from '@/trigger/ingest/claude-code/steps/upsert'
import { createMockPrisma } from 'tests/helpers/prisma-mock'
import {
	createMockTool,
	createMockFetchLog,
	createMockParsedRelease,
	createMockRelease,
} from 'tests/helpers/fixtures'
import type { IngestionContext, EnrichResult } from '@/trigger/ingest/claude-code/types'

describe('upsertStep', () => {
	const mockContext: IngestionContext = {
		prisma: createMockPrisma() as any,
		toolSlug: 'claude-code',
		tool: createMockTool(),
		fetchLog: createMockFetchLog(),
		startTime: Date.now(),
	}

	it('should create new release with changes', async () => {
		const enrichedRelease = createMockParsedRelease({
			version: '2.0.31',
			changes: [
				{
					type: 'FEATURE',
					title: 'New feature',
					order: 0,
					isBreaking: false,
					isSecurity: false,
					isDeprecation: false,
				},
			],
		})

		mockContext.prisma.release.findUnique = vi.fn().mockResolvedValue(null)
		mockContext.prisma.release.create = vi.fn().mockResolvedValue({
			id: 'new-release-id',
		} as any)

		const enrichResult: EnrichResult = {
			enrichedReleases: [enrichedRelease],
		}

		const result = await upsertStep(mockContext, enrichResult)

		expect(mockContext.prisma.release.create).toHaveBeenCalled()
		expect(result.releasesNew).toBe(1)
		expect(result.releasesUpdated).toBe(0)
		expect(result.changesCreated).toBe(1)
	})

	it('should update existing release when contentHash changes', async () => {
		const existingRelease = createMockRelease({
			version: '2.0.31',
			contentHash: 'old-hash',
		})

		const enrichedRelease = createMockParsedRelease({
			version: '2.0.31',
			contentHash: 'new-hash',
			changes: [
				{
					type: 'BUGFIX',
					title: 'Fixed bug',
					order: 0,
					isBreaking: false,
					isSecurity: false,
					isDeprecation: false,
				},
			],
		})

		mockContext.prisma.release.findUnique = vi
			.fn()
			.mockResolvedValue(existingRelease as any)
		mockContext.prisma.change.deleteMany = vi.fn().mockResolvedValue({ count: 0 })
		mockContext.prisma.release.update = vi.fn().mockResolvedValue(existingRelease as any)

		const enrichResult: EnrichResult = {
			enrichedReleases: [enrichedRelease],
		}

		const result = await upsertStep(mockContext, enrichResult)

		expect(mockContext.prisma.change.deleteMany).toHaveBeenCalledWith({
			where: { releaseId: existingRelease.id },
		})
		expect(mockContext.prisma.release.update).toHaveBeenCalled()
		expect(result.releasesNew).toBe(0)
		expect(result.releasesUpdated).toBe(1)
		expect(result.changesCreated).toBe(1)
	})

	it('should delete old changes before updating', async () => {
		const existingRelease = createMockRelease({
			version: '2.0.31',
			contentHash: 'old-hash',
		})

		const enrichedRelease = createMockParsedRelease({
			version: '2.0.31',
			contentHash: 'new-hash',
			changes: [
				{
					type: 'FEATURE',
					title: 'New feature',
					order: 0,
					isBreaking: false,
					isSecurity: false,
					isDeprecation: false,
				},
			],
		})

		mockContext.prisma.release.findUnique = vi
			.fn()
			.mockResolvedValue(existingRelease as any)
		mockContext.prisma.change.deleteMany = vi.fn().mockResolvedValue({ count: 3 })
		mockContext.prisma.release.update = vi.fn().mockResolvedValue(existingRelease as any)

		const enrichResult: EnrichResult = {
			enrichedReleases: [enrichedRelease],
		}

		await upsertStep(mockContext, enrichResult)

		expect(mockContext.prisma.change.deleteMany).toHaveBeenCalledBefore(
			mockContext.prisma.release.update as any,
		)
	})

	it('should skip unchanged releases', async () => {
		const existingRelease = createMockRelease({
			version: '2.0.31',
			contentHash: 'same-hash',
		})

		const enrichedRelease = createMockParsedRelease({
			version: '2.0.31',
			contentHash: 'same-hash',
		})

		vi.clearAllMocks()
		mockContext.prisma.release.findUnique = vi
			.fn()
			.mockResolvedValue(existingRelease as any)
		mockContext.prisma.release.update = vi.fn()
		mockContext.prisma.release.create = vi.fn()

		const enrichResult: EnrichResult = {
			enrichedReleases: [enrichedRelease],
		}

		const result = await upsertStep(mockContext, enrichResult)

		expect(mockContext.prisma.release.findUnique).toHaveBeenCalled()
		expect(mockContext.prisma.release.update).not.toHaveBeenCalled()
		expect(mockContext.prisma.release.create).not.toHaveBeenCalled()
		expect(result.releasesNew).toBe(0)
		expect(result.releasesUpdated).toBe(0)
		expect(result.changesCreated).toBe(0)
	})

	it('should return correct counts for multiple releases', async () => {
		const existingRelease = createMockRelease({
			version: '2.0.31',
			contentHash: 'old-hash',
		})

		const enrichedReleases = [
			createMockParsedRelease({
				version: '2.0.31',
				contentHash: 'new-hash',
				changes: [{ type: 'FEATURE', title: 'Feature', order: 0, isBreaking: false, isSecurity: false, isDeprecation: false }],
			}),
			createMockParsedRelease({
				version: '2.0.30',
				contentHash: 'new-hash-2',
				changes: [
					{ type: 'BUGFIX', title: 'Fix 1', order: 0, isBreaking: false, isSecurity: false, isDeprecation: false },
					{ type: 'BUGFIX', title: 'Fix 2', order: 1, isBreaking: false, isSecurity: false, isDeprecation: false },
				],
			}),
		]

		mockContext.prisma.release.findUnique = vi
			.fn()
			.mockResolvedValueOnce(existingRelease as any)
			.mockResolvedValueOnce(null)
		mockContext.prisma.change.deleteMany = vi.fn().mockResolvedValue({ count: 0 })
		mockContext.prisma.release.update = vi.fn().mockResolvedValue(existingRelease as any)
		mockContext.prisma.release.create = vi.fn().mockResolvedValue({ id: 'new-id' } as any)

		const enrichResult: EnrichResult = {
			enrichedReleases,
		}

		const result = await upsertStep(mockContext, enrichResult)

		expect(result.releasesNew).toBe(1)
		expect(result.releasesUpdated).toBe(1)
		expect(result.changesCreated).toBe(3)
	})
})

