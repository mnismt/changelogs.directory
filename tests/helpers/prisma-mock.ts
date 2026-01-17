import type { PrismaClient } from '@/generated/prisma/client'
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

	const mockWaitlist = {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
		delete: vi.fn(),
		count: vi.fn(),
	}

	const mockDigestLog = {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
		upsert: vi.fn(),
		delete: vi.fn(),
	}

	const mockEmailLog = {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
		delete: vi.fn(),
	}

	return {
		tool: mockTool as any,
		release: mockRelease as any,
		change: mockChange as any,
		fetchLog: mockFetchLog as any,
		waitlist: mockWaitlist as any,
		digestLog: mockDigestLog as any,
		emailLog: mockEmailLog as any,
	} as any
}

/**
 * Reset all mocks in a PrismaClient mock
 */
export function resetMockPrisma(mockPrisma: MockPrismaClient): void {
	const models = [
		'tool',
		'release',
		'change',
		'fetchLog',
		'waitlist',
		'digestLog',
		'emailLog',
	] as const

	for (const model of models) {
		const modelMock = mockPrisma[model as keyof typeof mockPrisma]
		if (modelMock && typeof modelMock === 'object') {
			Object.values(modelMock).forEach((fn) => {
				if (typeof fn === 'function' && 'mockReset' in fn) {
					;(fn as ReturnType<typeof vi.fn>).mockReset()
				}
			})
		}
	}
}

