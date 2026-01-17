import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { formatVersionForDisplay } from '@/lib/version-formatter'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })

export const BASE_URL = process.env.BASE_URL || 'https://changelogs.directory'

/**
 * Get the ISO week string for a date (e.g., "2026-W02")
 */
export function getISOWeek(date: Date): string {
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
 * Release data formatted for digest email.
 */
export interface DigestRelease {
	toolName: string
	toolSlug: string
	toolLogo: string
	vendor: string
	version: string
	releaseDate: string
	headline: string
	changeCount: number
	features: number
	bugfixes: number
	improvements: number
	breaking: number
}

/**
 * Get releases from the past week for the digest email.
 */
export async function getWeeklyReleases(since: Date): Promise<DigestRelease[]> {
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
}

/**
 * Get active subscribers who haven't received this period's digest.
 */
export async function getActiveSubscribers(periodStart: Date) {
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
 * Dedupe releases to keep only the latest release per tool.
 */
export function dedupeReleases(releases: DigestRelease[]): DigestRelease[] {
	const latestPerTool = new Map<string, DigestRelease>()
	for (const release of releases) {
		if (!latestPerTool.has(release.toolSlug)) {
			latestPerTool.set(release.toolSlug, release)
		}
	}
	return Array.from(latestPerTool.values())
}

/**
 * Format a period label for display (e.g., "Jan 9 - Jan 16, 2026")
 */
export function formatPeriodLabel(start: Date, end: Date): string {
	return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`
}

/**
 * Generate a unique period string for test digests.
 */
export function generateTestPeriod(): string {
	return `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
