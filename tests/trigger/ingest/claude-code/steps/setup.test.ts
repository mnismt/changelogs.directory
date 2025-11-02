import { describe, expect, it, vi } from 'vitest'
import { setupStep } from '@/trigger/ingest/claude-code/steps/setup'
import { createMockPrisma } from 'tests/helpers/prisma-mock'
import { createMockTool, createMockFetchLog } from 'tests/helpers/fixtures'

describe('setupStep', () => {
	it('should load tool from database', async () => {
		const mockPrisma = createMockPrisma()
		const mockTool = createMockTool()
		const mockFetchLog = createMockFetchLog()

		mockPrisma.tool.findUnique.mockResolvedValue(mockTool as any)
		mockPrisma.fetchLog.create.mockResolvedValue(mockFetchLog as any)

		const result = await setupStep(mockPrisma as any, 'claude-code', Date.now())

		expect(mockPrisma.tool.findUnique).toHaveBeenCalledWith({
			where: { slug: 'claude-code' },
		})
		expect(result).not.toHaveProperty('skipped')
		expect((result as any).tool).toEqual(mockTool)
		expect((result as any).fetchLog).toEqual(mockFetchLog)
	})

	it('should return skipped when tool is inactive', async () => {
		const mockPrisma = createMockPrisma()
		const mockTool = createMockTool({ isActive: false })

		mockPrisma.tool.findUnique.mockResolvedValue(mockTool as any)

		const result = await setupStep(mockPrisma as any, 'claude-code', Date.now())

		expect(result).toHaveProperty('skipped')
		expect((result as any).skipped).toBe(true)
		expect((result as any).reason).toBe('tool_inactive')
		expect(mockPrisma.fetchLog.create).not.toHaveBeenCalled()
	})

	it('should throw error when tool not found', async () => {
		const mockPrisma = createMockPrisma()

		mockPrisma.tool.findUnique.mockResolvedValue(null)

		await expect(
			setupStep(mockPrisma as any, 'nonexistent', Date.now()),
		).rejects.toThrow('Tool with slug "nonexistent" not found in database')
	})

	it('should create FetchLog with IN_PROGRESS status', async () => {
		const mockPrisma = createMockPrisma()
		const mockTool = createMockTool()
		const mockFetchLog = createMockFetchLog({ status: 'IN_PROGRESS' })

		mockPrisma.tool.findUnique.mockResolvedValue(mockTool as any)
		mockPrisma.fetchLog.create.mockResolvedValue(mockFetchLog as any)

		await setupStep(mockPrisma as any, 'claude-code', Date.now())

		expect(mockPrisma.fetchLog.create).toHaveBeenCalledWith({
			data: {
				toolId: mockTool.id,
				status: 'IN_PROGRESS',
				sourceUrl: mockTool.sourceUrl,
			},
		})
	})

	it('should return context with all required fields', async () => {
		const mockPrisma = createMockPrisma()
		const mockTool = createMockTool()
		const mockFetchLog = createMockFetchLog()
		const startTime = Date.now()

		mockPrisma.tool.findUnique.mockResolvedValue(mockTool as any)
		mockPrisma.fetchLog.create.mockResolvedValue(mockFetchLog as any)

		const result = await setupStep(mockPrisma as any, 'claude-code', startTime)

		expect(result).toHaveProperty('prisma')
		expect(result).toHaveProperty('toolSlug', 'claude-code')
		expect(result).toHaveProperty('tool')
		expect(result).toHaveProperty('fetchLog')
		expect(result).toHaveProperty('startTime', startTime)
	})
})

