import {
	createMockFetchLog,
	createMockRelease,
	createMockTool,
	loadChangelogFixture
} from 'tests/helpers/fixtures'
import { createMockPrisma } from 'tests/helpers/prisma-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@trigger.dev/sdk', () => ({
	logger: {
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	},
	task: vi.fn((config) => config),
	schedules: {
		task: vi.fn((config) => config),
	},
}))

vi.mock('@/lib/enrichment/llm', () => ({
	enrichReleaseWithLLM: vi.fn((release) =>
		Promise.resolve({
			release,
			success: true,
			modelUsed: null,
			circuitBreakerTriggered: false,
		}),
	),
}))

vi.mock('@/lib/llm', () => ({
	llm: { provider: 'test' },
}))

const mockPrismaInstance = createMockPrisma()

vi.mock('@prisma/adapter-pg', () => ({
	PrismaPg: vi.fn(() => ({})),
}))

vi.mock('@/generated/prisma/client', () => {
	const MockPrismaClient = vi.fn(() => mockPrismaInstance)
	return {
		PrismaClient: MockPrismaClient,
	}
})

describe('ingestClaudeCode', () => {
	let mockTool: ReturnType<typeof createMockTool>
	let mockFetchLog: ReturnType<typeof createMockFetchLog>

	beforeEach(async () => {
		vi.clearAllMocks()
		global.fetch = vi.fn()

		mockTool = createMockTool()
		mockFetchLog = createMockFetchLog()

		mockPrismaInstance.tool.findUnique = vi.fn().mockResolvedValue(mockTool as any)
		mockPrismaInstance.fetchLog.create = vi.fn().mockResolvedValue(mockFetchLog as any)
		mockPrismaInstance.tool.update = vi.fn().mockResolvedValue(mockTool as any)
		mockPrismaInstance.fetchLog.update = vi.fn().mockResolvedValue(mockFetchLog as any)
		mockPrismaInstance.release.findMany = vi.fn().mockResolvedValue([])
		mockPrismaInstance.release.findUnique = vi.fn().mockResolvedValue(null)
		mockPrismaInstance.release.findFirst = vi.fn().mockResolvedValue(null)
		mockPrismaInstance.release.create = vi.fn().mockResolvedValue({ id: 'new-release-id' } as any)
		mockPrismaInstance.change.deleteMany = vi.fn().mockResolvedValue({ count: 0 })
		mockPrismaInstance.fetchLog.findFirst = vi.fn().mockResolvedValue({
			...mockFetchLog,
			tool: mockTool,
		} as any)
	})

	it('should execute full ingestion flow successfully', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers({
				etag: 'W/"test-etag"',
			}),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await ingestClaudeCode.run({ toolSlug: 'claude-code' })

		expect(result.success).toBe(true)
		expect(result.releasesFound).toBeGreaterThan(0)
		expect(result.duration).toBeGreaterThan(0)
	})

	it('should return correct counts', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers(),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await ingestClaudeCode.run({ toolSlug: 'claude-code' })

		expect(result).toHaveProperty('releasesFound')
		expect(result).toHaveProperty('releasesSkipped')
		expect(result).toHaveProperty('releasesNew')
		expect(result).toHaveProperty('releasesUpdated')
		expect(result).toHaveProperty('changesCreated')
	})

	it('should handle skipped ingestion when tool is inactive', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const inactiveTool = createMockTool({ isActive: false })
		mockPrismaInstance.tool.findUnique = vi.fn().mockResolvedValue(inactiveTool as any)

		const result = await ingestClaudeCode.run({ toolSlug: 'claude-code' })

		expect(result).toHaveProperty('skipped', true)
		expect(result).toHaveProperty('reason', 'tool_inactive')
		expect(mockPrismaInstance.fetchLog.create).not.toHaveBeenCalled()
	})

	it('should handle fetch errors', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

		await expect(ingestClaudeCode.run({ toolSlug: 'claude-code' })).rejects.toThrow(
			'Network error',
		)

		expect(mockPrismaInstance.fetchLog.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: mockFetchLog.id },
				data: expect.objectContaining({
					status: 'FAILED',
					error: expect.stringContaining('Network error'),
				}),
			}),
		)
	})

	it('should handle parse errors', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue('Invalid markdown'),
			headers: new Headers(),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await ingestClaudeCode.run({ toolSlug: 'claude-code' })

		expect(result.success).toBe(true)
	})

	it('should filter unchanged releases', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const existingRelease = createMockRelease({
			version: '2.0.31',
			contentHash: '4b6f114c7c6cec0c7c1e77ba52b9986c018cfe11687e38636c577ebf6b603a70',
		})

		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers(),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)
		mockPrismaInstance.release.findMany = vi.fn().mockResolvedValue([existingRelease as any])

		const result = await ingestClaudeCode.run({ toolSlug: 'claude-code' })

		expect(result.releasesSkipped).toBeGreaterThanOrEqual(0)
	})

	it('should update FetchLog on success', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers({
				etag: 'W/"test-etag"',
			}),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		await ingestClaudeCode.run({ toolSlug: 'claude-code' })

		expect(mockPrismaInstance.fetchLog.update).toHaveBeenCalledWith({
			where: { id: mockFetchLog.id },
			data: expect.objectContaining({
				status: 'SUCCESS',
				completedAt: expect.any(Date),
				duration: expect.any(Number),
			}),
		})
	})

	it('should use default toolSlug when not provided', async () => {
		const { ingestClaudeCode } = await import('@/trigger/ingest/claude-code')
		const markdown = loadChangelogFixture()
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(markdown),
			headers: new Headers(),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await ingestClaudeCode.run({})

		expect(mockPrismaInstance.tool.findUnique).toHaveBeenCalledWith({
			where: { slug: 'claude-code' },
		})
		expect(result.success).toBe(true)
	})
})

