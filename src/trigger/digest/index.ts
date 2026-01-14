import { PrismaPg } from '@prisma/adapter-pg'
import { render } from '@react-email/components'
import { logger, schedules, task } from '@trigger.dev/sdk'
import { DigestStatus, PrismaClient } from '@/generated/prisma/client'
import { createEmailProvider } from '@/lib/email'
import type { ReleaseDigestEmailProps } from '@/lib/email/templates/release-digest'
import { ReleaseDigestEmail } from '@/lib/email/templates/release-digest'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 100
const BASE_URL = process.env.BASE_URL || 'https://changelogs.directory'

/**
 * Get the ISO week string for a date (e.g., "2026-W02")
 */
function getISOWeek(date: Date): string {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	)
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	const weekNum = Math.ceil(
		((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
	)
	return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

/**
 * Get releases from the past week for the digest email.
 */
async function getWeeklyReleases(since: Date) {
	const releases = await prisma.release.findMany({
		where: {
			releaseDate: { gte: since },
			isPrerelease: false,
		},
		include: {
			tool: {
				select: {
					slug: true,
					name: true,
					vendor: true,
					logoUrl: true,
				},
			},
			changes: {
				select: {
					type: true,
					isBreaking: true,
				},
			},
		},
		orderBy: [{ releaseDate: 'desc' }, { tool: { name: 'asc' } }],
	})

	return releases.map((release) => {
		const changeCounts = release.changes.reduce(
			(acc, change) => {
				if (change.type === 'FEATURE') acc.features++
				else if (change.type === 'BUGFIX') acc.bugfixes++
				else if (change.type === 'IMPROVEMENT') acc.improvements++
				if (change.isBreaking) acc.breaking++
				return acc
			},
			{ features: 0, bugfixes: 0, improvements: 0, breaking: 0 },
		)

		return {
			toolName: release.tool.name,
			toolSlug: release.tool.slug,
			toolLogo: `https://changelogs.directory/images/tools/${release.tool.slug}.png`,
			vendor: release.tool.vendor,
			version: release.version,
			releaseDate: release.releaseDate
				? new Intl.DateTimeFormat('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					}).format(release.releaseDate)
				: 'Unknown',
			headline: release.headline,
			changeCount: release.changes.length,
			...changeCounts,
		}
	})
}

/**
 * Get active subscribers who haven't received this period's digest.
 */
async function getActiveSubscribers(periodStart: Date) {
	return prisma.waitlist.findMany({
		where: {
			isUnsubscribed: false,
			isTest: false,
			OR: [
				{ lastDigestSentAt: null },
				{ lastDigestSentAt: { lt: periodStart } },
			],
		},
		select: {
			id: true,
			email: true,
			unsubscribeToken: true,
		},
		orderBy: { createdAt: 'asc' },
	})
}

/**
 * Send a single digest email.
 */
async function sendDigestEmail(
	subscriber: { id: string; email: string; unsubscribeToken: string },
	emailContent: ReleaseDigestEmailProps,
	period: string,
): Promise<{ success: boolean; error?: string }> {
	const emailProvider = createEmailProvider()

	// CAN-SPAM compliant one-click unsubscribe
	const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${subscriber.unsubscribeToken}`

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
			subject: `> DIGEST: ${emailContent.totalReleases} releases from ${emailContent.totalTools} tools — ${period}`,
			html,
			text,
			headers: {
				'List-Unsubscribe': `<${unsubscribeUrl}>`,
				'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
			},
		})

		if (result.success) {
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
 */
export const sendWeeklyDigest = task({
	id: 'send-weekly-digest',
	queue: {
		concurrencyLimit: 1,
	},
	maxDuration: 600, // 10 minutes max
	run: async (payload: { force?: boolean } = {}) => {
		const now = new Date()
		const period = getISOWeek(now)
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

		logger.info('Starting weekly digest', { period, since: weekAgo })

		// Check for existing digest this period (idempotency)
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

		// Get releases from the past week
		const releases = await getWeeklyReleases(weekAgo)

		if (releases.length === 0) {
			logger.info('No releases this week, skipping digest')

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

		// Get active subscribers
		const subscribers = await getActiveSubscribers(weekAgo)

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

		// Create or update digest log
		const digestLog = await prisma.digestLog.upsert({
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
		})

		// Dedupe: keep only latest release per tool (already sorted by date desc)
		const latestPerTool = new Map<string, (typeof releases)[0]>()
		for (const release of releases) {
			if (!latestPerTool.has(release.toolSlug)) {
				latestPerTool.set(release.toolSlug, release)
			}
		}
		const dedupedReleases = Array.from(latestPerTool.values())

		// Prepare email content (same for all subscribers)
		const emailContent: ReleaseDigestEmailProps = {
			period: 'This Week',
			releases: dedupedReleases.slice(0, 10), // Top 10 tools (latest release each)
			totalReleases: releases.length,
			totalTools: uniqueTools.size,
		}

		// Send in batches
		let emailsSent = 0
		let emailsFailed = 0

		for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
			const batch = subscribers.slice(i, i + BATCH_SIZE)

			const results = await Promise.allSettled(
				batch.map((sub) => sendDigestEmail(sub, emailContent, period)),
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

			// Delay between batches to avoid rate limiting
			if (i + BATCH_SIZE < subscribers.length) {
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
			},
		})

		// Alert on high failure rate (> 10%)
		const failureRate = emailsFailed / subscribers.length
		if (failureRate > 0.1) {
			logger.warn('High digest failure rate detected', {
				period,
				failureRate: `${(failureRate * 100).toFixed(1)}%`,
				emailsFailed,
				emailsSent,
			})
			// Sentry alerting is handled by Trigger.dev's error tracking
			// For custom alerts, integrate with Sentry SDK in production
		}

		// Alert on complete failure
		if (finalStatus === DigestStatus.FAILED) {
			logger.error('Weekly digest completely failed', {
				period,
				subscribersTotal: subscribers.length,
			})
		}

		logger.info('Weekly digest complete', {
			period,
			status: finalStatus,
			emailsSent,
			emailsFailed,
			releases: releases.length,
		})

		return {
			success: true,
			period,
			status: finalStatus,
			emailsSent,
			emailsFailed,
			releasesIncluded: releases.length,
			toolsIncluded: uniqueTools.size,
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
