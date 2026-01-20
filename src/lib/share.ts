import type { Change, ChangeType } from '@/generated/prisma/client'

const TYPE_EMOJIS: Record<ChangeType, string> = {
	FEATURE: '✨',
	BUGFIX: '🐛',
	IMPROVEMENT: '🚀',
	BREAKING: '⚠️',
	SECURITY: '🔒',
	PERFORMANCE: '⚡',
	DEPRECATION: '🌅',
	DOCUMENTATION: '📚',
	OTHER: '📦',
}

const TYPE_LABELS: Record<ChangeType, string> = {
	FEATURE: 'feature',
	BUGFIX: 'bugfix',
	IMPROVEMENT: 'improvement',
	BREAKING: 'breaking',
	SECURITY: 'security',
	PERFORMANCE: 'perf',
	DEPRECATION: 'deprecated',
	DOCUMENTATION: 'docs',
	OTHER: 'other',
}

const TYPE_HEADERS: Record<ChangeType, string> = {
	FEATURE: '✨ New Features',
	BUGFIX: '🐛 Bug Fixes',
	IMPROVEMENT: '🚀 Improvements',
	BREAKING: '⚠️ Breaking Changes',
	SECURITY: '🔒 Security Updates',
	PERFORMANCE: '⚡ Performance',
	DEPRECATION: '🌅 Deprecated',
	DOCUMENTATION: '📚 Documentation',
	OTHER: '📦 Other Changes',
}

/**
 * Generate the canonical share URL for a release
 */
export function generateShareUrl(slug: string, version: string): string {
	const baseUrl =
		typeof window !== 'undefined'
			? window.location.origin
			: import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'
	return `${baseUrl}/tools/${slug}/releases/${version}`
}

/**
 * Group changes by their type and count them
 */
export function countChangesByType(
	changes: Change[],
): Partial<Record<ChangeType, number>> {
	const counts: Partial<Record<ChangeType, number>> = {}

	for (const change of changes) {
		counts[change.type] = (counts[change.type] || 0) + 1
	}

	return counts
}

/**
 * Generate a simple tweet text with just the tool name and version
 */
export function generateSimpleTweet(
	toolName: string,
	formattedVersion: string,
	url: string,
): string {
	return `${toolName.toLowerCase()} ${formattedVersion.toLowerCase()} changelog

${url}`
}

/**
 * Generate a terminal-style tweet with change counts
 *
 * Format:
 * $ changelog cursor v0.50
 * > ✨ 3 features
 * > 🐛 5 bugfixes
 *
 * full changelogs 👇
 */
export function generateTerminalTweet(
	toolName: string,
	formattedVersion: string,
	changes: Change[],
	url: string,
): string {
	const counts = countChangesByType(changes)
	const lines = [
		`$ changelog ${toolName.toLowerCase()} ${formattedVersion.toLowerCase()}`,
	]

	// Priority order for display
	const priorityOrder: ChangeType[] = [
		'BREAKING',
		'SECURITY',
		'FEATURE',
		'IMPROVEMENT',
		'PERFORMANCE',
		'BUGFIX',
		'DEPRECATION',
		'DOCUMENTATION',
		'OTHER',
	]

	// Add counts for each type (max 4 lines to fit tweet limit)
	let lineCount = 0
	for (const type of priorityOrder) {
		const count = counts[type]
		if (count && count > 0 && lineCount < 4) {
			const emoji = TYPE_EMOJIS[type]
			const label = TYPE_LABELS[type]
			const plural = count > 1 ? 's' : ''
			lines.push(`> ${emoji} ${count} ${label}${plural}`)
			lineCount++
		}
	}

	lines.push('')
	lines.push('full changelogs 👇')
	lines.push(url)

	return lines.join('\n')
}

/**
 * Group changes by type for markdown generation
 */
function groupChangesByType(
	changes: Change[],
): Partial<Record<ChangeType, Change[]>> {
	const grouped: Partial<Record<ChangeType, Change[]>> = {}

	for (const change of changes) {
		if (!grouped[change.type]) {
			grouped[change.type] = []
		}
		grouped[change.type]?.push(change)
	}

	return grouped
}

/**
 * Generate markdown changelog for copying
 */
export function generateMarkdown(
	toolName: string,
	formattedVersion: string,
	changes: Change[],
	url: string,
): string {
	const lines = [`# ${toolName} ${formattedVersion} Changelog`, '']

	const grouped = groupChangesByType(changes)

	// Priority order for display
	const priorityOrder: ChangeType[] = [
		'BREAKING',
		'SECURITY',
		'FEATURE',
		'IMPROVEMENT',
		'PERFORMANCE',
		'BUGFIX',
		'DEPRECATION',
		'DOCUMENTATION',
		'OTHER',
	]

	for (const type of priorityOrder) {
		const items = grouped[type]
		if (!items || items.length === 0) continue

		lines.push(`## ${TYPE_HEADERS[type]}`)
		lines.push('')

		for (const change of items) {
			lines.push(`- ${change.title}`)
			if (change.description) {
				// Indent description
				const desc = change.description
					.split('\n')
					.map((line) => `  ${line}`)
					.join('\n')
				lines.push(desc)
			}
		}
		lines.push('')
	}

	lines.push('---')
	lines.push(`[View full changelog](${url})`)

	return lines.join('\n')
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text)
			return true
		}

		// Fallback for older browsers
		const textArea = document.createElement('textarea')
		textArea.value = text
		textArea.style.position = 'fixed'
		textArea.style.left = '-999999px'
		textArea.style.top = '-999999px'
		document.body.appendChild(textArea)
		textArea.focus()
		textArea.select()

		const successful = document.execCommand('copy')
		document.body.removeChild(textArea)

		return successful
	} catch {
		return false
	}
}

/**
 * Open Twitter/X share intent with pre-filled text
 */
export function openTwitterShare(text: string): void {
	const encoded = encodeURIComponent(text)
	const url = `https://twitter.com/intent/tweet?text=${encoded}`
	window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420')
}
