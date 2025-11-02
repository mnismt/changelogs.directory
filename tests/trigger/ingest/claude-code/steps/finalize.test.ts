import { describe, expect, it, vi } from 'vitest'
import { finalizeStep, handleFailure } from '@/trigger/ingest/claude-code/steps/finalize'
import { createMockPrisma } from 'tests/helpers/prisma-mock'
import {
	createMockTool,
	createMockFetchLog,
	createMockParsedRelease,
} from 'tests/helpers/fixtures'
import type {
	IngestionContext,
	FetchResult,
	ParseResult,
	FilterResult,
	UpsertResult,
} from '@/trigger/ingest/claude-code/types'

describe('finalizeStep', () => {
	const mockContext: IngestionContext = {
		prisma: createMockPrisma() as any,
		toolSlug: 'claude-code',
		tool: createMockTool(),
		fetchLog: createMockFetchLog(),
		startTime: Date.now() - 5000,
	}

	it('should update Tool.lastFetchedAt', async () => {
		mockContext.prisma.tool.update = vi.fn().mockResolvedValue(mockContext.tool)
		mockContext.prisma.fetchLog.update = vi.fn().mockResolvedValue(mockContext.fetchLog)

		const fetchResult: FetchResult = {
			markdown: 'test',
			etag: 'W/"test-etag"',
		}

		const parseResult: ParseResult = {
			releases: [createMockParsedRelease()],
		}

		const filterResult: FilterResult = {
			releases: [createMockParsedRelease()],
			releasesSkipped: 0,
		}

		const upsertResult: UpsertResult = {
			releasesNew: 1,
			releasesUpdated: 0,
			changesCreated: 5,
		}

		await finalizeStep(mockContext, fetchResult, parseResult, filterResult, upsertResult)

		expect(mockContext.prisma.tool.update).toHaveBeenCalledWith({
			where: { id: mockContext.tool.id },
			data: { lastFetchedAt: expect.any(Date) },
		})
	})

	it('should update FetchLog with SUCCESS status and metrics', async () => {
		mockContext.prisma.tool.update = vi.fn().mockResolvedValue(mockContext.tool)
		mockContext.prisma.fetchLog.update = vi.fn().mockResolvedValue(mockContext.fetchLog)

		const fetchResult: FetchResult = {
			markdown: 'test',
			etag: 'W/"test-etag"',
		}

		const parseResult: ParseResult = {
			releases: [createMockParsedRelease()],
		}

		const filterResult: FilterResult = {
			releases: [createMockParsedRelease()],
			releasesSkipped: 2,
		}

		const upsertResult: UpsertResult = {
			releasesNew: 3,
			releasesUpdated: 1,
			changesCreated: 10,
		}

		await finalizeStep(mockContext, fetchResult, parseResult, filterResult, upsertResult)

		expect(mockContext.prisma.fetchLog.update).toHaveBeenCalledWith({
			where: { id: mockContext.fetchLog.id },
			data: {
				status: 'SUCCESS',
				completedAt: expect.any(Date),
				duration: expect.any(Number),
				releasesFound: 1,
				releasesNew: 3,
				releasesUpdated: 1,
				changesCreated: 10,
				sourceEtag: 'W/"test-etag"',
			},
		})
	})

	it('should calculate duration correctly', async () => {
		const startTime = Date.now() - 5000
		const context: IngestionContext = {
			...mockContext,
			startTime,
		}

		mockContext.prisma.tool.update = vi.fn().mockResolvedValue(mockContext.tool)
		mockContext.prisma.fetchLog.update = vi.fn().mockResolvedValue(mockContext.fetchLog)

		const fetchResult: FetchResult = {
			markdown: 'test',
			etag: null,
		}

		const parseResult: ParseResult = {
			releases: [],
		}

		const filterResult: FilterResult = {
			releases: [],
			releasesSkipped: 0,
		}

		const upsertResult: UpsertResult = {
			releasesNew: 0,
			releasesUpdated: 0,
			changesCreated: 0,
		}

		await finalizeStep(context, fetchResult, parseResult, filterResult, upsertResult)

		const updateCall = vi.mocked(mockContext.prisma.fetchLog.update).mock.calls[0][0]
		expect(updateCall.data.duration).toBeGreaterThanOrEqual(5000)
		expect(updateCall.data.duration).toBeLessThan(6000)
	})
})

describe('handleFailure', () => {
	const mockContext: IngestionContext = {
		prisma: createMockPrisma() as any,
		toolSlug: 'claude-code',
		tool: createMockTool(),
		fetchLog: createMockFetchLog(),
		startTime: Date.now() - 5000,
	}

	it('should update FetchLog with FAILED status', async () => {
		mockContext.prisma.fetchLog.update = vi.fn().mockResolvedValue(mockContext.fetchLog)

		const error = new Error('Test error')

		await handleFailure(mockContext, error)

		expect(mockContext.prisma.fetchLog.update).toHaveBeenCalledWith({
			where: { id: mockContext.fetchLog.id },
			data: {
				status: 'FAILED',
				completedAt: expect.any(Date),
				duration: expect.any(Number),
				error: 'Test error',
				errorStack: expect.stringContaining('Error: Test error'),
			},
		})
	})

	it('should handle non-Error objects', async () => {
		mockContext.prisma.fetchLog.update = vi.fn().mockResolvedValue(mockContext.fetchLog)

		const error = 'String error'

		await handleFailure(mockContext, error)

		expect(mockContext.prisma.fetchLog.update).toHaveBeenCalledWith({
			where: { id: mockContext.fetchLog.id },
			data: {
				status: 'FAILED',
				completedAt: expect.any(Date),
				duration: expect.any(Number),
				error: 'String error',
				errorStack: undefined,
			},
		})
	})

	it('should calculate duration correctly', async () => {
		const startTime = Date.now() - 3000
		const context: IngestionContext = {
			...mockContext,
			startTime,
		}

		mockContext.prisma.fetchLog.update = vi.fn().mockResolvedValue(mockContext.fetchLog)

		const error = new Error('Test error')

		await handleFailure(context, error)

		const updateCall = vi.mocked(mockContext.prisma.fetchLog.update).mock.calls[0][0]
		expect(updateCall.data.duration).toBeGreaterThanOrEqual(3000)
		expect(updateCall.data.duration).toBeLessThan(4000)
	})
})

