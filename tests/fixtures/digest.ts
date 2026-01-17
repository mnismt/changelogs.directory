import type { DigestRelease } from '@/trigger/digest/shared'

/**
 * Create a mock subscriber for testing
 */
export function createMockSubscriber(
	overrides: Partial<{
		id: string
		email: string
		unsubscribeToken: string
		isUnsubscribed: boolean
		isTest: boolean
		lastDigestSentAt: Date | null
		createdAt: Date
	}> = {},
) {
	return {
		id: overrides.id ?? `sub-${Math.random().toString(36).slice(2, 10)}`,
		email: overrides.email ?? `user-${Date.now()}@example.com`,
		unsubscribeToken:
			overrides.unsubscribeToken ?? `token-${Math.random().toString(36).slice(2, 18)}`,
		isUnsubscribed: overrides.isUnsubscribed ?? false,
		isTest: overrides.isTest ?? false,
		lastDigestSentAt: overrides.lastDigestSentAt ?? null,
		createdAt: overrides.createdAt ?? new Date(),
	}
}

/**
 * Create multiple mock subscribers
 */
export function createMockSubscribers(
	count: number,
	overrides: Partial<ReturnType<typeof createMockSubscriber>> = {},
) {
	return Array.from({ length: count }, (_, i) =>
		createMockSubscriber({
			id: `sub-${i}`,
			email: `user${i}@example.com`,
			unsubscribeToken: `token-${i}`,
			...overrides,
		}),
	)
}

/**
 * Create a mock release for testing digest emails
 */
export function createMockRelease(
	overrides: Partial<DigestRelease> = {},
): DigestRelease {
	const toolSlug = overrides.toolSlug ?? 'cursor'
	return {
		toolName: overrides.toolName ?? 'Cursor',
		toolSlug,
		toolLogo: overrides.toolLogo ?? `https://changelogs.directory/images/logos/${toolSlug}.png`,
		vendor: overrides.vendor ?? 'Anysphere',
		version: overrides.version ?? '0.46.0',
		releaseDate: overrides.releaseDate ?? 'Jan 15, 2026',
		headline: overrides.headline ?? 'New AI features and performance improvements',
		changeCount: overrides.changeCount ?? 12,
		features: overrides.features ?? 3,
		bugfixes: overrides.bugfixes ?? 5,
		improvements: overrides.improvements ?? 4,
		breaking: overrides.breaking ?? 0,
	}
}

/**
 * Create multiple mock releases for different tools
 */
export function createMockReleases(count: number): DigestRelease[] {
	const tools = [
		{ name: 'Cursor', slug: 'cursor', vendor: 'Anysphere' },
		{ name: 'Claude Code', slug: 'claude-code', vendor: 'Anthropic' },
		{ name: 'VS Code', slug: 'vscode', vendor: 'Microsoft' },
		{ name: 'Windsurf', slug: 'windsurf', vendor: 'Codeium' },
		{ name: 'GitHub Copilot', slug: 'github-copilot', vendor: 'GitHub' },
	]

	return Array.from({ length: count }, (_, i) => {
		const tool = tools[i % tools.length]
		return createMockRelease({
			toolName: tool.name,
			toolSlug: tool.slug,
			vendor: tool.vendor,
			version: `1.${i}.0`,
		})
	})
}

/**
 * Create a mock digest log record
 */
export function createMockDigestLog(
	overrides: Partial<{
		id: string
		period: string
		status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'SKIPPED'
		isTest: boolean
		startedAt: Date
		completedAt: Date | null
		subscribersTotal: number
		emailsSent: number
		emailsFailed: number
		emailsBounced: number
		releasesIncluded: number
		toolsIncluded: number
		error: string | null
	}> = {},
) {
	return {
		id: overrides.id ?? `digest-${Math.random().toString(36).slice(2, 10)}`,
		period: overrides.period ?? '2026-W03',
		status: overrides.status ?? 'IN_PROGRESS',
		isTest: overrides.isTest ?? false,
		startedAt: overrides.startedAt ?? new Date(),
		completedAt: overrides.completedAt ?? null,
		subscribersTotal: overrides.subscribersTotal ?? 100,
		emailsSent: overrides.emailsSent ?? 0,
		emailsFailed: overrides.emailsFailed ?? 0,
		emailsBounced: overrides.emailsBounced ?? 0,
		releasesIncluded: overrides.releasesIncluded ?? 10,
		toolsIncluded: overrides.toolsIncluded ?? 5,
		error: overrides.error ?? null,
	}
}

/**
 * Create a mock email log record
 */
export function createMockEmailLog(
	overrides: Partial<{
		id: string
		to: string
		subject: string
		status: 'success' | 'bounced' | 'delivered' | 'failed'
		createdAt: Date
	}> = {},
) {
	return {
		id: overrides.id ?? `email-${Math.random().toString(36).slice(2, 10)}`,
		to: overrides.to ?? 'user@example.com',
		subject: overrides.subject ?? 'Changelogs Weekly #3 · Jan 10-17, 2026',
		status: overrides.status ?? 'success',
		createdAt: overrides.createdAt ?? new Date(),
	}
}
