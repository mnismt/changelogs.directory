import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DigestStatus } from '@/generated/prisma/client'
import { createMockPrisma, resetMockPrisma } from 'tests/helpers/prisma-mock'
import { createMockEmailProvider } from 'tests/helpers/email-mock'
import {
	createMockRelease,
	createMockSubscriber,
} from 'tests/fixtures/digest'

// Mock dependencies - must be hoisted before module imports
const mockPrisma = createMockPrisma()
const mockEmailProvider = createMockEmailProvider()

// Mock getWeeklyReleases and getActiveSubscribers to return processed DigestRelease format
const mockGetWeeklyReleases = vi.fn()
const mockGetActiveSubscribers = vi.fn()

vi.mock('@prisma/adapter-pg', () => ({
	PrismaPg: vi.fn(() => ({})),
}))

vi.mock('@/generated/prisma/client', () => ({
	PrismaClient: vi.fn(() => mockPrisma),
	DigestStatus: {
		IN_PROGRESS: 'IN_PROGRESS',
		COMPLETED: 'COMPLETED',
		FAILED: 'FAILED',
		PARTIAL: 'PARTIAL',
		SKIPPED: 'SKIPPED',
	},
}))

vi.mock('@/trigger/digest/shared', async (importOriginal) => {
	const original = await importOriginal<typeof import('@/trigger/digest/shared')>()
	return {
		...original,
		prisma: mockPrisma,
		getWeeklyReleases: mockGetWeeklyReleases,
		getActiveSubscribers: mockGetActiveSubscribers,
	}
})

vi.mock('@/lib/email', () => ({
	createEmailProvider: vi.fn(() => mockEmailProvider.provider),
}))

vi.mock('@react-email/components', () => ({
	render: vi.fn().mockResolvedValue('<html>Email Content</html>'),
}))

vi.mock('@/lib/email/templates/release-digest', () => ({
	ReleaseDigestEmail: vi.fn(() => null),
}))

vi.mock('@trigger.dev/sdk', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
	task: vi.fn((config) => config),
	schedules: {
		task: vi.fn((config) => config),
	},
}))

describe('sendWeeklyDigest task', () => {
	beforeAll(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-01-17T09:00:00Z'))
	})

	afterAll(() => {
		vi.useRealTimers()
	})

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks()
		resetMockPrisma(mockPrisma)
		mockEmailProvider.reset()
		mockGetWeeklyReleases.mockReset()
		mockGetActiveSubscribers.mockReset()
	})

	describe('idempotency', () => {
		it('should skip if digest already COMPLETED for this period', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			mockPrisma.digestLog.findUnique.mockResolvedValue({
				period: '2026-W03',
				status: 'COMPLETED',
			})

			const result = (await sendWeeklyDigest.run({})) as any
			expect(result).toMatchObject({ skipped: true, reason: 'already_sent' })
			expect(mockGetWeeklyReleases).not.toHaveBeenCalled()
		})

		it('should proceed with force=true even if already completed', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			mockPrisma.digestLog.findUnique.mockResolvedValue({
				period: '2026-W03',
				status: 'COMPLETED',
			})
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockGetActiveSubscribers.mockResolvedValue([createMockSubscriber()])
			mockPrisma.digestLog.upsert.mockResolvedValue({ id: 'log_1' })

			await sendWeeklyDigest.run({ force: true })
			expect(mockGetWeeklyReleases).toHaveBeenCalled()
		})
	})

	describe('zero state handling', () => {
		it('should skip when no releases this week', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			mockPrisma.digestLog.findUnique.mockResolvedValue(null)
			mockGetWeeklyReleases.mockResolvedValue([])

			const result = (await sendWeeklyDigest.run({})) as any
			expect(result).toMatchObject({ skipped: true, reason: 'no_releases' })
			expect(mockPrisma.digestLog.upsert).toHaveBeenCalledWith(
				expect.objectContaining({
					update: expect.objectContaining({ status: DigestStatus.SKIPPED }),
				}),
			)
		})

		it('should skip when no active subscribers', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			mockPrisma.digestLog.findUnique.mockResolvedValue(null)
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockGetActiveSubscribers.mockResolvedValue([])

			const result = (await sendWeeklyDigest.run({})) as any
			expect(result).toMatchObject({ skipped: true, reason: 'no_subscribers' })
		})
	})

	describe('batching and execution', () => {
		it('should process subscribers and update digest log', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			const subscribers = [
				createMockSubscriber({ id: 'sub_1', email: 'user1@test.com' }),
				createMockSubscriber({ id: 'sub_2', email: 'user2@test.com' }),
			]
			mockPrisma.digestLog.findUnique.mockResolvedValue(null)
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockGetActiveSubscribers.mockResolvedValue(subscribers)
			mockPrisma.digestLog.upsert.mockResolvedValue({ id: 'log_1' })

			const result = (await sendWeeklyDigest.run({})) as any

			expect(result.success).toBe(true)
			expect(result.emailsSent).toBe(2)
			expect(mockEmailProvider.mockSendEmail).toHaveBeenCalledTimes(2)
			expect(mockPrisma.digestLog.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'log_1' },
					data: expect.objectContaining({ status: DigestStatus.COMPLETED }),
				}),
			)
		})

		it('should handle partial failures', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			const subscribers = [
				createMockSubscriber({ id: 'sub_1', email: 'user1@test.com' }),
				createMockSubscriber({ id: 'sub_2', email: 'user2@test.com' }),
			]
			mockPrisma.digestLog.findUnique.mockResolvedValue(null)
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockGetActiveSubscribers.mockResolvedValue(subscribers)
			mockPrisma.digestLog.upsert.mockResolvedValue({ id: 'log_1' })

			mockEmailProvider.mockSendEmail
				.mockResolvedValueOnce({ success: true })
				.mockResolvedValueOnce({ success: false, error: 'Provider Error' })

			const result = (await sendWeeklyDigest.run({})) as any

			expect(result.status).toBe(DigestStatus.PARTIAL)
			expect(result.emailsSent).toBe(1)
			expect(result.emailsFailed).toBe(1)
		})

		it('should set status to FAILED when all emails fail', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			const subscribers = [
				createMockSubscriber({ id: 'sub_1', email: 'user1@test.com' }),
			]
			mockPrisma.digestLog.findUnique.mockResolvedValue(null)
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockGetActiveSubscribers.mockResolvedValue(subscribers)
			mockPrisma.digestLog.upsert.mockResolvedValue({ id: 'log_1' })

			mockEmailProvider.failAll('Email service down')

			const result = (await sendWeeklyDigest.run({})) as any

			expect(result.success).toBe(false)
			expect(result.status).toBe(DigestStatus.FAILED)
			expect(result.emailsFailed).toBe(1)
		})
	})

	describe('test mode', () => {
		it('should send test digest to specific email', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			const testEmail = 'tester@example.com'
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockPrisma.waitlist.findUnique.mockResolvedValue(null) // Not an existing sub
			mockPrisma.digestLog.create.mockResolvedValue({ id: 'test_log' })

			const result = (await sendWeeklyDigest.run({
				test: { email: testEmail },
			})) as any

			expect(result.isTest).toBe(true)
			expect(mockEmailProvider.mockSendEmail).toHaveBeenCalledWith(
				expect.objectContaining({ to: testEmail }),
			)
			// Should not update lastDigestSentAt in test mode
			expect(mockPrisma.waitlist.update).not.toHaveBeenCalled()
		})

		it('should use existing subscriber token if email exists', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			const existingSubscriber = createMockSubscriber({
				id: 'existing_sub',
				email: 'existing@test.com',
				unsubscribeToken: 'real-token-123',
			})
			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockPrisma.waitlist.findUnique.mockResolvedValue(existingSubscriber)
			mockPrisma.digestLog.create.mockResolvedValue({ id: 'test_log' })

			const result = (await sendWeeklyDigest.run({
				test: { email: 'existing@test.com' },
			})) as any

			expect(result.isTest).toBe(true)
			expect(mockEmailProvider.mockSendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: 'existing@test.com',
					headers: expect.objectContaining({
						'List-Unsubscribe': expect.stringContaining('real-token-123'),
					}),
				}),
			)
		})

		it('should create test digest log with isTest=true', async () => {
			const { sendWeeklyDigest } = await import('@/trigger/digest')

			mockGetWeeklyReleases.mockResolvedValue([createMockRelease()])
			mockPrisma.waitlist.findUnique.mockResolvedValue(null)
			mockPrisma.digestLog.create.mockResolvedValue({ id: 'test_log' })

			await sendWeeklyDigest.run({ test: { email: 'test@example.com' } })

			expect(mockPrisma.digestLog.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ isTest: true }),
				}),
			)
		})
	})
})
