import { createHash } from 'node:crypto'
import type { ChangeType, ImpactLevel } from '@prisma/client'
import {
	classifyChangeType,
	detectBreaking,
	detectDeprecation,
	detectSecurity,
	extractLinks,
	generateVersionSort,
} from './changelog-md-utils'

// Re-export utilities for tests
export { generateVersionSort }

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
	media?: Array<{ type: 'video' | 'image'; url: string; alt?: string }>
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
	headline: string
	summary?: string
	rawContent: string
	contentHash: string
	changes: ParsedChange[]
	// Optional metadata for source-agnostic pipelines
	isPrerelease?: boolean
	sourceUrl?: string
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
		const headline = generateHeadline(summary, rawContent, current.version)

		releases.push({
			version: current.version,
			versionSort,
			releaseDate,
			title: undefined, // Could extract from header if format includes title
			headline,
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
 * Simplified: extracts bullets and lets LLM handle classification
 * Keeps keyword-based fallbacks for when LLM is unavailable
 */
function parseChanges(rawContent: string): ParsedChange[] {
	const changes: ParsedChange[] = []
	const lines = rawContent.split('\n')
	let order = 0
	let inCodeBlock = false

	for (const rawLine of lines) {
		const line = rawLine.trim()

		// Track fenced code blocks to avoid false-positive bullets
		if (line.startsWith('```')) {
			inCodeBlock = !inCodeBlock
			continue
		}
		if (inCodeBlock) continue

		// Match top-level bullets (- or *)
		if (!/^[-*]\s+/.test(line)) continue

		const content = line.replace(/^[-*]\s+/, '').trim()
		if (!content) continue

		// Extract markdown links
		const links = extractLinks(content)

		// Lightweight keyword fallback; LLM will override when available
		const isBreaking = detectBreaking(content)
		const isSecurity = detectSecurity(content)
		const isDeprecation = detectDeprecation(content)
		const type = classifyChangeType(
			content,
			isBreaking,
			isSecurity,
			isDeprecation,
		)

		changes.push({
			type,
			title: content,
			description: undefined,
			platform: undefined,
			component: undefined,
			isBreaking,
			isSecurity,
			isDeprecation,
			impact: undefined, // Set by LLM enrichment
			links: links.length > 0 ? links : undefined,
			order: order++,
		})
	}

	return changes
}

/**
 * Generates a concise summary from release body (first 200 chars)
 */
function generateSummary(rawContent: string): string | undefined {
	if (!rawContent || rawContent.trim() === '') return undefined

	// Remove markdown headers and bullet markers
	const cleaned = rawContent
		.replace(/^##\s+.*/gm, '')
		.replace(/^[-*+]\s+/gm, '')
		.trim()

	if (!cleaned) return undefined

	return cleaned.length > 200 ? `${cleaned.substring(0, 200)}...` : cleaned
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

/**
 * Generates a short headline (<=120 chars) from summary or raw content
 */
function generateHeadline(
	summary: string | undefined,
	rawContent: string,
	version: string,
): string {
	const fallbackText = summary
		? summary.trim()
		: rawContent
				.replace(/^##\s+.*/gm, '')
				.replace(/^[-*+]\s+/gm, '')
				.trim()

	if (!fallbackText) {
		return `Updates for ${version}`
	}

	const normalized = fallbackText.replace(/\s+/g, ' ').trim()
	const sentenceMatch = normalized.match(/.*?[.!?](\s|$)/)
	const sentence = (sentenceMatch ? sentenceMatch[0] : normalized).trim()
	const target = sentence || normalized || `Updates for ${version}`

	return target.length > 120 ? `${target.slice(0, 117)}...` : target
}
