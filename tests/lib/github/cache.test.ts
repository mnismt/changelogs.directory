import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCacheKey, getCachedCommitDetail } from '@/lib/github/cache'
import * as redisModule from '@/lib/redis'
import type { GitHubCommitDetail } from '@/lib/github/api'

// Mock the Redis module
vi.mock('@/lib/redis', () => ({
	getRedisClient: vi.fn(),
}))

// Mock trigger.dev logger
vi.mock('@trigger.dev/sdk', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
	},
}))

describe('getCacheKey', () => {
	it('should generate correct cache key format', () => {
		const key = getCacheKey('anthropics', 'claude-code', 'abc123')
		expect(key).toBe('github:commit:anthropics:claude-code:abc123')
	})

	it('should generate unique keys for different repos', () => {
		const key1 = getCacheKey('anthropics', 'claude-code', 'abc123')
		const key2 = getCacheKey('openai', 'gpt-4', 'abc123')
		expect(key1).not.toBe(key2)
	})

	it('should generate unique keys for different commits', () => {
		const key1 = getCacheKey('anthropics', 'claude-code', 'abc123')
		const key2 = getCacheKey('anthropics', 'claude-code', 'def456')
		expect(key1).not.toBe(key2)
	})
})

describe('getCachedCommitDetail', () => {
	const mockCommitDetail: GitHubCommitDetail = {
		sha: 'abc123def456',
		commit: {
			author: {
				date: '2024-01-15T10:30:00Z',
			},
		},
		files: [
			{
				filename: 'CHANGELOG.md',
				patch: '+## 2.0.33\n+- New feature',
			},
		],
	}

	const mockFetchFn = vi.fn().mockResolvedValue(mockCommitDetail)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return cached data on cache hit', async () => {
		const mockRedis = {
			get: vi.fn().mockResolvedValue(mockCommitDetail),
			setex: vi.fn(),
		}
		vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as any)

		const result = await getCachedCommitDetail(
			'anthropics',
			'claude-code',
			'abc123',
			mockFetchFn,
		)

		expect(result).toEqual(mockCommitDetail)
		expect(mockRedis.get).toHaveBeenCalledWith(
			'github:commit:anthropics:claude-code:abc123',
		)
		expect(mockFetchFn).not.toHaveBeenCalled()
		expect(mockRedis.setex).not.toHaveBeenCalled()
	})

	it('should fetch and cache on cache miss', async () => {
		const mockRedis = {
			get: vi.fn().mockResolvedValue(null), // Cache miss
			setex: vi.fn().mockResolvedValue('OK'),
		}
		vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as any)

		const result = await getCachedCommitDetail(
			'anthropics',
			'claude-code',
			'abc123',
			mockFetchFn,
		)

		expect(result).toEqual(mockCommitDetail)
		expect(mockRedis.get).toHaveBeenCalledWith(
			'github:commit:anthropics:claude-code:abc123',
		)
		expect(mockFetchFn).toHaveBeenCalledOnce()
		expect(mockRedis.setex).toHaveBeenCalledWith(
			'github:commit:anthropics:claude-code:abc123',
			60 * 60 * 24 * 90, // 90 days TTL
			JSON.stringify(mockCommitDetail),
		)
	})

	it('should gracefully degrade when Redis is unavailable', async () => {
		vi.mocked(redisModule.getRedisClient).mockReturnValue(null)

		const result = await getCachedCommitDetail(
			'anthropics',
			'claude-code',
			'abc123',
			mockFetchFn,
		)

		expect(result).toEqual(mockCommitDetail)
		expect(mockFetchFn).toHaveBeenCalledOnce()
	})

	it('should continue on Redis get error', async () => {
		const mockRedis = {
			get: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
			setex: vi.fn().mockResolvedValue('OK'),
		}
		vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as any)

		const result = await getCachedCommitDetail(
			'anthropics',
			'claude-code',
			'abc123',
			mockFetchFn,
		)

		expect(result).toEqual(mockCommitDetail)
		expect(mockFetchFn).toHaveBeenCalledOnce()
		expect(mockRedis.setex).toHaveBeenCalled()
	})

	it('should continue on Redis setex error (non-blocking)', async () => {
		const mockRedis = {
			get: vi.fn().mockResolvedValue(null),
			setex: vi.fn().mockRejectedValue(new Error('Redis write failed')),
		}
		vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as any)

		const result = await getCachedCommitDetail(
			'anthropics',
			'claude-code',
			'abc123',
			mockFetchFn,
		)

		expect(result).toEqual(mockCommitDetail)
		expect(mockFetchFn).toHaveBeenCalledOnce()
		// Should not throw - gracefully continues
	})

	it('should propagate fetch function errors', async () => {
		const mockRedis = {
			get: vi.fn().mockResolvedValue(null),
			setex: vi.fn(),
		}
		vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as any)

		const errorFetchFn = vi
			.fn()
			.mockRejectedValue(new Error('GitHub API error'))

		await expect(
			getCachedCommitDetail(
				'anthropics',
				'claude-code',
				'abc123',
				errorFetchFn,
			),
		).rejects.toThrow('GitHub API error')
	})
})
