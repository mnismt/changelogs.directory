import type { PrismaClient } from '@/generated/prisma'
import { vi } from 'vitest'

type MockPrismaClient = {
	[K in keyof PrismaClient]: PrismaClient[K] extends (...args: any[]) => any
		? ReturnType<PrismaClient[K]> extends Promise<any>
			? ReturnType<typeof vi.fn>
			: ReturnType<typeof vi.fn>
		: PrismaClient[K]
}

/**
 * Create a mock PrismaClient with common method implementations
 */
export function createMockPrisma(): MockPrismaClient {
	const mockTool = {
		findUnique: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	}

	const mockRelease = {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteMany: vi.fn(),
	}

	const mockChange = {
		findUnique: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		deleteMany: vi.fn(),
	}

	const mockFetchLog = {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	}

	return {
		tool: mockTool as any,
		release: mockRelease as any,
		change: mockChange as any,
		fetchLog: mockFetchLog as any,
	} as any
}

/**
 * Reset all mocks in a PrismaClient mock
 */
export function resetMockPrisma(mockPrisma: MockPrismaClient): void {
	Object.values(mockPrisma.tool).forEach((fn) => {
		if (typeof fn === 'function' && 'mockReset' in fn) {
			fn.mockReset()
		}
	})
	Object.values(mockPrisma.release).forEach((fn) => {
		if (typeof fn === 'function' && 'mockReset' in fn) {
			fn.mockReset()
		}
	})
	Object.values(mockPrisma.change).forEach((fn) => {
		if (typeof fn === 'function' && 'mockReset' in fn) {
			fn.mockReset()
		}
	})
	Object.values(mockPrisma.fetchLog).forEach((fn) => {
		if (typeof fn === 'function' && 'mockReset' in fn) {
			fn.mockReset()
		}
	})
}

