import { createHash } from 'node:crypto'
import type { ChangeType, ImpactLevel } from '@prisma/client'

/**
 * Parsed representation of a single change entry within a release
 */
export interface ParsedChange {
	type: ChangeType
	title: string
	description?: string
	platform?: string
	component?: string
	isBreaking: boolean
	isSecurity: boolean
	isDeprecation: boolean
	impact?: ImpactLevel
	links?: Array<{ url: string; text: string; type: string }>
	order: number
}

/**
 * Parsed representation of a single release/version
 */
export interface ParsedRelease {
	version: string
	versionSort: string
	releaseDate?: Date
	title?: string
	summary?: string
	rawContent: string
	contentHash: string
	changes: ParsedChange[]
}

/**
 * Parses a CHANGELOG.md file and extracts RAW structured release data
 * Does NOT perform LLM classification - returns unclassified data
 * Use enrichReleaseWithLLM() to add intelligent classification and summaries
 * @param markdown The changelog markdown content
 * @param versionDates Optional map of version strings to release dates (from Git history)
 */
export function parseChangelogMd(
	markdown: string,
	versionDates?: Map<string, Date>,
): ParsedRelease[] {
	const releases: ParsedRelease[] = []

	// Split changelog by version headers (## 2.0.31, ## 1.5.0-beta.1, etc.)
	const versionHeaderRegex = /^##\s+(\d+\.\d+\.\d+[^\s]*)/gm

	const versionMatches: Array<{ version: string; index: number }> = Array.from(
		markdown.matchAll(versionHeaderRegex),
		(match) => ({
			version: match[1],
			index: match.index ?? 0,
		}),
	)

	// Process each version section
	for (let i = 0; i < versionMatches.length; i++) {
		const current = versionMatches[i]
		const next = versionMatches[i + 1]

		// Extract the raw content for this version
		const startIndex = current.index
		const endIndex = next ? next.index : markdown.length
		const rawContent = markdown.substring(startIndex, endIndex).trim()

		// Extract release date from multiple sources (priority order):
		// 1. Header line (e.g., "## 2.0.31 - 2024-01-15")
		// 2. Git commit history (versionDates map)
		// 3. undefined (no date available)
		const headerLine = rawContent.split('\n')[0]
		const dateMatch = headerLine.match(
			/\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4}/,
		)
		let releaseDate = dateMatch ? parseDate(dateMatch[0]) : undefined

		// Fallback to Git commit date if no date in header
		if (!releaseDate && versionDates) {
			releaseDate = versionDates.get(current.version)
		}

		// Parse changes from bullet points (extraction only, no classification)
		const changes = parseChanges(rawContent)

		// Generate version sort key
		const versionSort = generateVersionSort(current.version)

		// Compute content hash for change detection
		const contentHash = createHash('sha256').update(rawContent).digest('hex')

		// Generate basic summary (simple truncation - will be replaced by LLM later)
		const summary = generateSummary(rawContent)

		releases.push({
			version: current.version,
			versionSort,
			releaseDate,
			title: undefined, // Could extract from header if format includes title
			summary,
			rawContent,
			contentHash,
			changes,
		})
	}

	return releases
}

/**
 * Parses bullet points from a version section (extraction only)
 * Uses basic keyword classification - will be enhanced by LLM later
 */
function parseChanges(rawContent: string): ParsedChange[] {
	const changes: ParsedChange[] = []

	// Extract lines that start with bullet points (-, *, +)
	const lines = rawContent.split('\n')
	let order = 0

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		// Match bullet points
		if (line.match(/^[-*+]\s+/)) {
			const content = line.replace(/^[-*+]\s+/, '').trim()

			// Skip if empty
			if (!content) continue

			// Extract platform prefix (e.g., "Windows:", "macOS:", "VSCode:")
			const platform = extractPlatform(content)

			// Extract component if present (e.g., "[Core]", "[API]")
			const component = extractComponent(content)

			// Clean title by removing platform and component prefixes
			const title = content
				.replace(/^(Windows|macOS|Linux|VSCode|IDE|CLI):\s*/i, '')
				.replace(/^\[[^\]]+\]\s*/, '')
				.trim()

			// Extract markdown links
			const links = extractLinks(title)

			// Detect flags using keyword detection
			const isBreaking = detectBreaking(title)
			const isSecurity = detectSecurity(title)
			const isDeprecation = detectDeprecation(title)

			// Check for multi-line description (indented continuation lines)
			let description: string | undefined
			if (i + 1 < lines.length) {
				const nextLine = lines[i + 1]
				if (nextLine.match(/^\s{2,}/)) {
					description = nextLine.trim()
				}
			}

			// Use basic keyword classification (will be enhanced by LLM later)
			const type = classifyChangeType(
				title,
				isBreaking,
				isSecurity,
				isDeprecation,
			)
			const impact = assessImpact(type, isBreaking)

			changes.push({
				type,
				title,
				description,
				platform,
				component,
				isBreaking,
				isSecurity,
				isDeprecation,
				impact,
				links: links.length > 0 ? links : undefined,
				order: order++,
			})
		}
	}

	return changes
}

/**
 * Extracts platform from change text (Windows:, macOS:, etc.)
 */
function extractPlatform(text: string): string | undefined {
	const match = text.match(/^(Windows|macOS|Linux|VSCode|IDE|CLI):/i)
	return match ? match[1].toLowerCase() : undefined
}

/**
 * Extracts component from change text ([Core], [API], etc.)
 */
function extractComponent(text: string): string | undefined {
	const match = text.match(/^\[([^\]]+)\]/)
	return match ? match[1] : undefined
}

/**
 * Extracts markdown links from text
 */
function extractLinks(
	text: string,
): Array<{ url: string; text: string; type: string }> {
	const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

	const links = Array.from(text.matchAll(linkRegex), (match) => {
		const linkText = match[1]
		const url = match[2]

		// Classify link type
		let type = 'other'
		if (url.includes('/issues/')) type = 'issue'
		else if (url.includes('/pull/')) type = 'pr'
		else if (url.includes('/docs/') || url.includes('documentation'))
			type = 'docs'

		return {
			url,
			text: linkText,
			type,
		}
	})

	return links
}

/**
 * Detects if a change is breaking
 */
function detectBreaking(text: string): boolean {
	const lowerText = text.toLowerCase()
	return (
		lowerText.includes('breaking') ||
		lowerText.includes('breaking change') ||
		lowerText.includes('removed') ||
		lowerText.includes('deprecated and removed')
	)
}

/**
 * Detects if a change is security-related
 */
function detectSecurity(text: string): boolean {
	const lowerText = text.toLowerCase()
	return (
		lowerText.includes('security') ||
		lowerText.includes('vulnerability') ||
		lowerText.includes('cve-') ||
		lowerText.includes('exploit')
	)
}

/**
 * Detects if a change is a deprecation
 */
function detectDeprecation(text: string): boolean {
	const lowerText = text.toLowerCase()
	return (
		lowerText.includes('deprecated') ||
		lowerText.includes('deprecation') ||
		lowerText.includes('will be removed')
	)
}

/**
 * Classifies the type of change based on keywords
 */
function classifyChangeType(
	text: string,
	isBreaking: boolean,
	isSecurity: boolean,
	isDeprecation: boolean,
): ChangeType {
	// Priority: breaking > security > deprecation
	if (isBreaking) return 'BREAKING'
	if (isSecurity) return 'SECURITY'
	if (isDeprecation) return 'DEPRECATION'

	const lowerText = text.toLowerCase()

	// Feature keywords
	if (
		lowerText.match(/^(added|add|new|introduce|implement|support for)/i) ||
		lowerText.includes('new feature')
	) {
		return 'FEATURE'
	}

	// Bugfix keywords
	if (
		lowerText.match(/^(fixed|fix|resolve|correct|repair)/i) ||
		lowerText.includes('bug fix')
	) {
		return 'BUGFIX'
	}

	// Improvement keywords
	if (
		lowerText.match(
			/^(improved|improve|enhanced|enhance|updated|update|optimized|optimize)/i,
		)
	) {
		return 'IMPROVEMENT'
	}

	// Performance keywords
	if (
		lowerText.includes('performance') ||
		lowerText.includes('faster') ||
		lowerText.includes('speed')
	) {
		return 'PERFORMANCE'
	}

	// Documentation keywords
	if (
		lowerText.includes('documentation') ||
		lowerText.includes('docs') ||
		lowerText.match(/^(document|documented)/i)
	) {
		return 'DOCUMENTATION'
	}

	// Default to OTHER
	return 'OTHER'
}

/**
 * Assesses the impact level of a change
 */
function assessImpact(type: ChangeType, isBreaking: boolean): ImpactLevel {
	if (isBreaking) return 'MAJOR'
	if (type === 'FEATURE') return 'MINOR'
	if (type === 'BUGFIX') return 'PATCH'
	if (type === 'SECURITY') return 'PATCH'
	return 'PATCH' // Default
}

/**
 * Generates a sortable version key for semantic versioning
 * Handles pre-release versions correctly (e.g., 1.5.0-beta.1 < 1.5.0)
 */
export function generateVersionSort(version: string): string {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/)

	if (!match) {
		// Fallback for non-semver versions
		return version.padStart(20, '0')
	}

	const [_, major, minor, patch, suffix] = match

	// Create base: pad each part to 3 digits
	const base = `${major.padStart(3, '0')}${minor.padStart(3, '0')}${patch.padStart(3, '0')}`

	// Stable versions (no suffix) get 'z' prefix to sort AFTER pre-releases
	if (!suffix) {
		return `${base}-z`
	}

	// Pre-release versions get 'a' prefix to sort BEFORE stable
	return `${base}-a${suffix}`
}

/**
 * Generates a summary from the raw content (first 200 chars)
 */
function generateSummary(rawContent: string): string | undefined {
	// Remove header line
	const lines = rawContent.split('\n').slice(1)

	// Join and get first 200 chars
	const content = lines.join(' ').trim()

	if (!content) return undefined

	return content.length > 200 ? `${content.substring(0, 200)}...` : content
}

/**
 * Parses a date string into a Date object
 * Supports formats: YYYY-MM-DD, DD Month YYYY
 */
function parseDate(dateStr: string): Date | undefined {
	try {
		// Try ISO format first (YYYY-MM-DD)
		if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
			return new Date(dateStr)
		}

		// Try parsing as general date string
		const parsed = new Date(dateStr)
		if (!Number.isNaN(parsed.getTime())) {
			return parsed
		}

		return undefined
	} catch {
		return undefined
	}
}
