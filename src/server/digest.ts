import { render } from '@react-email/components'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createEmailProvider } from '@/lib/email'
import { ReleaseDigestEmail } from '@/lib/email/templates/release-digest'
import { formatVersionForDisplay } from '@/lib/version-formatter'
import { getPrisma } from './db'

interface ReleaseItem {
	toolName: string
	toolSlug: string
	toolLogo?: string
	vendor: string
	version: string
	releaseDate: string
	headline: string
	changeCount: number
	features: number
	bugfixes: number
	breaking: number
	improvements: number
}

/**
 * Fetch releases from the last 7 days and format for digest email.
 */
async function fetchWeeklyReleases(): Promise<{
	releases: ReleaseItem[]
	totalReleases: number
	totalTools: number
	periodLabel: string
}> {
	const prisma = getPrisma()

	const now = new Date()
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

	const releases = await prisma.release.findMany({
		where: {
			releaseDate: { gte: weekAgo },
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

	const toolSlugs = new Set(releases.map((r) => r.tool.slug))

	const formattedReleases = releases.map((release) => {
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
			toolLogo: `https://changelogs.directory/images/logos/${release.tool.slug}.png`,
			vendor: release.tool.vendor,
			version: formatVersionForDisplay(release.version, release.tool.slug),
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

	// Dedupe: keep only latest release per tool (already sorted by date desc)
	const latestPerTool = new Map<string, ReleaseItem>()
	for (const release of formattedReleases) {
		if (!latestPerTool.has(release.toolSlug)) {
			latestPerTool.set(release.toolSlug, release)
		}
	}
	const dedupedReleases = Array.from(latestPerTool.values())

	// Format period label (e.g., "Jan 7 - Jan 14, 2026")
	const periodLabel = `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(weekAgo)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(now)}`

	return {
		releases: dedupedReleases,
		totalReleases: releases.length,
		totalTools: toolSlugs.size,
		periodLabel,
	}
}

/**
 * Unsubscribe a user by their token.
 */
export const unsubscribeByToken = createServerFn({ method: 'POST' })
	.inputValidator((input: { token: string }) =>
		z.object({ token: z.string().min(1) }).parse(input),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		const subscriber = await prisma.waitlist.findUnique({
			where: { unsubscribeToken: data.token },
		})

		if (!subscriber) {
			return { success: false, message: 'Invalid unsubscribe link.' }
		}

		if (subscriber.isUnsubscribed) {
			return { success: true, message: 'Already unsubscribed.' }
		}

		await prisma.waitlist.update({
			where: { id: subscriber.id },
			data: { isUnsubscribed: true },
		})

		return { success: true, message: 'Successfully unsubscribed.' }
	})

/**
 * Get digest logs for admin dashboard.
 */
export const getDigestLogs = createServerFn({ method: 'GET' })
	.inputValidator((input: { limit?: number }) =>
		z.object({ limit: z.number().optional().default(20) }).parse(input),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		const logs = await prisma.digestLog.findMany({
			orderBy: { startedAt: 'desc' },
			take: data.limit,
		})

		return logs.map((log) => ({
			...log,
			deliveryRate:
				log.subscribersTotal > 0
					? ((log.emailsSent / log.subscribersTotal) * 100).toFixed(1)
					: '0',
			bounceRate:
				log.emailsSent > 0
					? ((log.emailsBounced / log.emailsSent) * 100).toFixed(1)
					: '0',
		}))
	})

/**
 * Get aggregate digest stats for admin dashboard.
 */
export const getDigestStats = createServerFn({ method: 'GET' }).handler(
	async () => {
		const prisma = getPrisma()

		const [totalSubscribers, unsubscribed, lastDigest] = await Promise.all([
			prisma.waitlist.count({ where: { isTest: false } }),
			prisma.waitlist.count({
				where: { isTest: false, isUnsubscribed: true },
			}),
			prisma.digestLog.findFirst({
				where: { status: 'COMPLETED' },
				orderBy: { startedAt: 'desc' },
			}),
		])

		return {
			totalSubscribers,
			activeSubscribers: totalSubscribers - unsubscribed,
			unsubscribed,
			lastDigest: lastDigest
				? {
						period: lastDigest.period,
						sentAt: lastDigest.completedAt,
						emailsSent: lastDigest.emailsSent,
					}
				: null,
		}
	},
)

/**
 * Process unsubscribe by token (for API endpoint).
 * Returns subscriber info if found and unsubscribed.
 */
export const processUnsubscribe = createServerFn({ method: 'POST' })
	.inputValidator((input: { token: string }) =>
		z.object({ token: z.string().min(1) }).parse(input),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		const subscriber = await prisma.waitlist.findUnique({
			where: { unsubscribeToken: data.token },
		})

		if (!subscriber) {
			return { found: false, alreadyUnsubscribed: false }
		}

		if (subscriber.isUnsubscribed) {
			return { found: true, alreadyUnsubscribed: true }
		}

		await prisma.waitlist.update({
			where: { id: subscriber.id },
			data: { isUnsubscribed: true },
		})

		return { found: true, alreadyUnsubscribed: false }
	})

/**
 * Handle Resend bounce webhook event.
 */
export const handleBounceEvent = createServerFn({ method: 'POST' })
	.inputValidator((input: { emails: string[]; subject: string }) =>
		z
			.object({
				emails: z.array(z.string()),
				subject: z.string(),
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		await prisma.emailLog.updateMany({
			where: {
				to: { in: data.emails },
				subject: data.subject,
			},
			data: {
				status: 'bounced',
			},
		})

		// Update DigestLog bounce count for the current week
		const now = new Date()
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

		await prisma.digestLog.updateMany({
			where: {
				startedAt: { gte: weekAgo },
				status: { in: ['COMPLETED', 'PARTIAL'] },
			},
			data: {
				emailsBounced: { increment: 1 },
			},
		})

		return { success: true }
	})

/**
 * Handle Resend complaint webhook event (spam report).
 */
export const handleComplaintEvent = createServerFn({ method: 'POST' })
	.inputValidator((input: { emails: string[] }) =>
		z.object({ emails: z.array(z.string()) }).parse(input),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		await prisma.waitlist.updateMany({
			where: {
				email: { in: data.emails },
			},
			data: {
				isUnsubscribed: true,
			},
		})

		return { success: true }
	})

/**
 * Handle Resend delivered webhook event.
 */
export const handleDeliveredEvent = createServerFn({ method: 'POST' })
	.inputValidator((input: { emails: string[]; subject: string }) =>
		z
			.object({
				emails: z.array(z.string()),
				subject: z.string(),
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		await prisma.emailLog.updateMany({
			where: {
				to: { in: data.emails },
				subject: data.subject,
				status: 'success',
			},
			data: {
				status: 'delivered',
			},
		})

		return { success: true }
	})

/**
 * Get digest preview data for admin UI.
 * Fetches releases from last 7 days and renders the email HTML.
 */
export const getDigestPreviewData = createServerFn({ method: 'GET' }).handler(
	async () => {
		const { releases, totalReleases, totalTools, periodLabel } =
			await fetchWeeklyReleases()

		// Render the email HTML for preview
		const htmlPreview = await render(
			ReleaseDigestEmail({
				period: periodLabel,
				releases: releases.slice(0, 10), // Limit to 10 for preview
				totalReleases,
				totalTools,
			}),
		)

		return {
			releases: releases.slice(0, 10),
			totalReleases,
			totalTools,
			periodLabel,
			htmlPreview,
			hasReleases: totalReleases > 0,
		}
	},
)

/**
 * Send a test digest email to a specified address.
 */
export const sendTestDigest = createServerFn({ method: 'POST' })
	.inputValidator((input: { email: string }) =>
		z.object({ email: z.string().email() }).parse(input),
	)
	.handler(async ({ data }) => {
		const { releases, totalReleases, totalTools, periodLabel } =
			await fetchWeeklyReleases()

		if (totalReleases === 0) {
			return {
				success: false,
				message: 'No releases in the last 7 days to include in digest.',
			}
		}

		const emailProvider = createEmailProvider()

		const html = await render(
			ReleaseDigestEmail({
				period: periodLabel,
				releases: releases.slice(0, 10),
				totalReleases,
				totalTools,
			}),
		)

		const subject = `[TEST] Weekly Digest: ${totalReleases} releases from ${totalTools} tools — ${periodLabel}`

		try {
			await emailProvider.sendEmail({
				from: {
					email: 'digest@changelogs.directory',
					name: 'changelogs.directory',
				},
				to: data.email,
				subject,
				html,
			})

			return {
				success: true,
				message: `Test digest sent to ${data.email}`,
			}
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error ? error.message : 'Failed to send email',
			}
		}
	})
