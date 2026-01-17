import { render } from '@react-email/components'
import { logger, schedules, task } from '@trigger.dev/sdk'
import { DigestStatus } from '@/generated/prisma/client'
import { createEmailProvider } from '@/lib/email'
import type { ReleaseDigestEmailProps } from '@/lib/email/templates/release-digest'
import { ReleaseDigestEmail } from '@/lib/email/templates/release-digest'
import {
	BASE_URL,
	dedupeReleases,
	formatPeriodLabel,
	generateTestPeriod,
	getActiveSubscribers,
	getISOWeek,
	getWeeklyReleases,
	prisma,
} from './shared'

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 100

interface DigestPayload {
	force?: boolean
	/** When true, sends a test digest to a single email address */
	test?: {
		email: string
	}
}

/**
 * Send a single digest email.
 */
async function sendDigestEmail(
	subscriber: { id: string; email: string; unsubscribeToken: string },
	emailContent: ReleaseDigestEmailProps,
	period: string,
	{
		skipLastDigestUpdate,
		weekNumber,
	}: { skipLastDigestUpdate?: boolean; weekNumber?: number } = {},
): Promise<{ success: boolean; error?: string }> {
	const emailProvider = createEmailProvider()

	// CAN-SPAM compliant one-click unsubscribe
	const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${subscriber.unsubscribeToken}`

	// Format subject line: "Changelogs Weekly #3 · Jan 10-17, 2026"
	const subject = weekNumber
		? `Changelogs Weekly #${weekNumber} · ${period}`
		: `Changelogs Weekly · ${period}`

	try {
		const html = await render(ReleaseDigestEmail(emailContent))
		const text = await render(ReleaseDigestEmail(emailContent), {
			plainText: true,
		})

		const result = await emailProvider.sendEmail({
			from: {
				email: 'digest@changelogs.directory',
				name: 'Changelogs Directory',
			},
			to: subscriber.email,
			subject,
			html,
			text,
			headers: {
				'List-Unsubscribe': `<${unsubscribeUrl}>`,
				'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
			},
		})

		if (result.success && !skipLastDigestUpdate) {
			await prisma.waitlist.update({
				where: { id: subscriber.id },
				data: { lastDigestSentAt: new Date() },
			})
		}

		return result
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'
		return { success: false, error: errorMessage }
	}
}

/**
 * Weekly digest task - sends curated release summaries to subscribers.
 *
 * Modes:
 * - Production: Sends to all active subscribers, uses ISO week period
 * - Test: Sends to a single email, uses unique test period, marks as isTest
 */
export const sendWeeklyDigest = task({
	id: 'send-weekly-digest',
	queue: {
		concurrencyLimit: 1,
	},
	maxDuration: 600, // 10 minutes max
	run: async (payload: DigestPayload = {}) => {
		const isTest = !!payload.test
		const now = new Date()
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

		// Period: ISO week for production, unique string for tests
		const period = isTest ? generateTestPeriod() : getISOWeek(now)
		const periodLabel = formatPeriodLabel(weekAgo, now)

		// Extract week number from ISO week (e.g., "2026-W03" → 3)
		const weekNumber = isTest
			? undefined
			: Number.parseInt(period.split('-W')[1], 10)

		logger.info('Starting weekly digest', {
			period,
			since: weekAgo,
			isTest,
			testEmail: payload.test?.email,
		})

		// Check for existing digest this period (idempotency) - skip for tests
		if (!isTest) {
			const existingDigest = await prisma.digestLog.findUnique({
				where: { period },
			})

			if (
				existingDigest &&
				existingDigest.status === 'COMPLETED' &&
				!payload.force
			) {
				logger.info('Digest already sent for this period', { period })
				return { skipped: true, reason: 'already_sent', period }
			}
		}

		// Get releases from the past week
		const releases = await getWeeklyReleases(weekAgo)

		if (releases.length === 0) {
			logger.info('No releases this week, skipping digest')

			if (isTest) {
				// For tests, create a log entry noting the skip
				await prisma.digestLog.create({
					data: {
						period,
						isTest: true,
						status: DigestStatus.SKIPPED,
						completedAt: new Date(),
						subscribersTotal: 1,
						error: 'No releases in the last 7 days',
					},
				})
				return {
					success: false,
					skipped: true,
					reason: 'no_releases',
					period,
					message: 'No releases in the last 7 days to include in digest.',
				}
			}

			await prisma.digestLog.upsert({
				where: { period },
				create: {
					period,
					status: DigestStatus.SKIPPED,
					completedAt: new Date(),
				},
				update: {
					status: DigestStatus.SKIPPED,
					completedAt: new Date(),
				},
			})

			return { skipped: true, reason: 'no_releases', period }
		}

		// Get unique tools
		const uniqueTools = new Set(releases.map((r) => r.toolSlug))

		// Get subscribers - for test mode, create a virtual subscriber
		let subscribers: { id: string; email: string; unsubscribeToken: string }[]

		if (isTest) {
			// Check if test email is an existing subscriber (use their real unsubscribe token)
			const existingSubscriber = await prisma.waitlist.findUnique({
				where: { email: payload.test!.email },
				select: { id: true, email: true, unsubscribeToken: true },
			})

			subscribers = existingSubscriber
				? [existingSubscriber]
				: [
						{
							id: 'test',
							email: payload.test!.email,
							unsubscribeToken: 'preview',
						},
					]
		} else {
			subscribers = await getActiveSubscribers(weekAgo)

			if (subscribers.length === 0) {
				logger.info('No active subscribers, skipping digest')

				await prisma.digestLog.upsert({
					where: { period },
					create: {
						period,
						status: DigestStatus.SKIPPED,
						completedAt: new Date(),
						releasesIncluded: releases.length,
						toolsIncluded: uniqueTools.size,
					},
					update: {
						status: DigestStatus.SKIPPED,
						completedAt: new Date(),
						releasesIncluded: releases.length,
						toolsIncluded: uniqueTools.size,
					},
				})

				return { skipped: true, reason: 'no_subscribers', period }
			}
		}

		// Create or update digest log
		const digestLog = isTest
			? await prisma.digestLog.create({
					data: {
						period,
						isTest: true,
						status: DigestStatus.IN_PROGRESS,
						subscribersTotal: 1,
						releasesIncluded: releases.length,
						toolsIncluded: uniqueTools.size,
					},
				})
			: await prisma.digestLog.upsert({
					where: { period },
					create: {
						period,
						status: DigestStatus.IN_PROGRESS,
						subscribersTotal: subscribers.length,
						releasesIncluded: releases.length,
						toolsIncluded: uniqueTools.size,
					},
					update: {
						status: DigestStatus.IN_PROGRESS,
						subscribersTotal: subscribers.length,
						releasesIncluded: releases.length,
						toolsIncluded: uniqueTools.size,
						error: null,
					},
				})

		logger.info('Sending digest', {
			subscribers: subscribers.length,
			releases: releases.length,
			tools: uniqueTools.size,
			isTest,
		})

		// Dedupe: keep only latest release per tool
		const dedupedReleases = dedupeReleases(releases)

		// Prepare email content (same for all subscribers)
		const emailContent: ReleaseDigestEmailProps = {
			period: isTest ? periodLabel : 'This Week',
			releases: dedupedReleases.slice(0, 10), // Top 10 tools (latest release each)
			totalReleases: releases.length,
			totalTools: uniqueTools.size,
		}

		// Send in batches (or single email for test)
		let emailsSent = 0
		let emailsFailed = 0

		for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
			const batch = subscribers.slice(i, i + BATCH_SIZE)

			const results = await Promise.allSettled(
				batch.map((sub) =>
					sendDigestEmail(sub, emailContent, periodLabel, {
						// Don't update lastDigestSentAt for test emails
						skipLastDigestUpdate: isTest,
						weekNumber,
					}),
				),
			)

			for (const result of results) {
				if (result.status === 'fulfilled' && result.value.success) {
					emailsSent++
				} else {
					emailsFailed++
					const error =
						result.status === 'rejected' ? result.reason : result.value.error
					logger.warn('Failed to send digest email', { error })
				}
			}

			// Update progress
			await prisma.digestLog.update({
				where: { id: digestLog.id },
				data: { emailsSent, emailsFailed },
			})

			// Delay between batches to avoid rate limiting (skip for single test email)
			if (!isTest && i + BATCH_SIZE < subscribers.length) {
				await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
			}

			logger.info('Batch complete', {
				batch: Math.floor(i / BATCH_SIZE) + 1,
				totalBatches: Math.ceil(subscribers.length / BATCH_SIZE),
				sent: emailsSent,
				failed: emailsFailed,
			})
		}

		// Determine final status
		const finalStatus =
			emailsFailed === 0
				? DigestStatus.COMPLETED
				: emailsSent === 0
					? DigestStatus.FAILED
					: DigestStatus.PARTIAL

		// Finalize digest log
		await prisma.digestLog.update({
			where: { id: digestLog.id },
			data: {
				status: finalStatus,
				completedAt: new Date(),
				emailsSent,
				emailsFailed,
				error:
					emailsFailed > 0 && emailsSent === 0 ? 'All emails failed' : null,
			},
		})

		// Alert on high failure rate (> 10%) - skip for tests
		if (!isTest) {
			const failureRate = emailsFailed / subscribers.length
			if (failureRate > 0.1) {
				logger.warn('High digest failure rate detected', {
					period,
					failureRate: `${(failureRate * 100).toFixed(1)}%`,
					emailsFailed,
					emailsSent,
				})
			}
		}

		// Alert on complete failure
		if (finalStatus === DigestStatus.FAILED) {
			logger.error('Weekly digest completely failed', {
				period,
				subscribersTotal: subscribers.length,
				isTest,
			})
		}

		logger.info('Weekly digest complete', {
			period,
			status: finalStatus,
			emailsSent,
			emailsFailed,
			releases: releases.length,
			isTest,
		})

		return {
			success: finalStatus !== DigestStatus.FAILED,
			period,
			status: finalStatus,
			emailsSent,
			emailsFailed,
			releasesIncluded: releases.length,
			toolsIncluded: uniqueTools.size,
			isTest,
			...(isTest && { message: `Test digest sent to ${payload.test!.email}` }),
		}
	},
})

/**
 * Schedule: Run weekly digest every Monday at 9:00 AM UTC
 */
export const weeklyDigestSchedule = schedules.task({
	id: 'weekly-digest-schedule',
	cron: '0 9 * * 1', // Monday at 9:00 AM UTC
	run: async () => {
		await sendWeeklyDigest.trigger({})
	},
})
