import { createHash } from 'node:crypto'
import { type HTMLElement, parse } from 'node-html-parser'
import type { ChangeType } from '@/generated/prisma/client'
import type { ParsedChange, ParsedRelease } from './changelog-md'

export interface AntigravityParserOptions {
	baseUrl?: string
	startPath?: string
}

const DEFAULT_OPTIONS: Required<AntigravityParserOptions> = {
	baseUrl: 'https://antigravity.google',
	startPath: '/changelog',
}

/**
 * Parse Antigravity changelog HTML into normalized release objects.
 * Each release is a sibling pair: div.version + div.description
 * in a grid-body container.
 */
export function parseAntigravityChangelog(
	html: string,
	options?: AntigravityParserOptions,
): ParsedRelease[] {
	if (!html || html.trim() === '') {
		return []
	}

	const config = { ...DEFAULT_OPTIONS, ...options }
	const root = parse(html)
	const releases: ParsedRelease[] = []

	// Find the grid body containing all releases
	const gridBody = root.querySelector('.grid-body.grid-container')

	if (!gridBody) {
		return []
	}

	// Get all version divs
	const versionDivs = gridBody.querySelectorAll('div.version')

	for (const versionDiv of versionDivs) {
		// Get the adjacent description div (next sibling)
		const descriptionDiv = versionDiv.nextElementSibling as HTMLElement | null
		if (!descriptionDiv || !descriptionDiv.classList?.contains('description')) {
			continue
		}

		const release = transformRelease(
			versionDiv as HTMLElement,
			descriptionDiv,
			config,
		)
		if (release) {
			releases.push(release)
		}
	}

	return releases
}

function transformRelease(
	versionDiv: HTMLElement,
	descriptionDiv: HTMLElement,
	config: Required<AntigravityParserOptions>,
): ParsedRelease | null {
	normalizeUrls(descriptionDiv, config.baseUrl)

	// Extract version and date from: "1.13.3<br/>Dec 19, 2025"
	const versionBody = versionDiv.querySelector('p.body')
	if (!versionBody) return null

	const versionHtml = versionBody.innerHTML
	const { version, releaseDate } = parseVersionAndDate(versionHtml)
	if (!version) return null

	// Extract title from h3
	const titleEl = descriptionDiv.querySelector('h3')
	const title = titleEl?.text.trim() || `Antigravity ${version}`

	// Extract summary from div.changes > p
	const changesDiv = descriptionDiv.querySelector('div.changes')
	const summaryText = changesDiv?.text.trim() || ''

	// Extract categorized changes from details elements
	const expandableItems = descriptionDiv.querySelector('.expandable-items')
	const changes = expandableItems
		? extractChanges(expandableItems as HTMLElement)
		: []

	// If no changes extracted, create one from the summary
	if (changes.length === 0 && summaryText) {
		changes.push({
			type: 'OTHER',
			title:
				summaryText.length > 200
					? `${summaryText.slice(0, 197)}...`
					: summaryText,
			description: undefined,
			platform: undefined,
			component: undefined,
			isBreaking: false,
			isSecurity: false,
			isDeprecation: false,
			impact: undefined,
			links: undefined,
			media: undefined,
			order: 0,
		})
	}

	// Generate content hash for change detection
	const rawContent = descriptionDiv.toString()
	const contentHash = createHash('sha256')
		.update(title ?? '')
		.update(rawContent)
		.digest('hex')

	const headline = generateHeadline(summaryText, title, version)
	const summary = generateSummary(summaryText)
	const sourceUrl = buildSourceUrl(config.baseUrl, config.startPath, version)
	const versionSort = generateVersionSort(releaseDate, version)

	return {
		version: `antigravity-${version}`,
		versionSort,
		releaseDate,
		title,
		headline,
		summary,
		rawContent,
		contentHash,
		changes,
		sourceUrl,
	}
}

function parseVersionAndDate(html: string): {
	version: string | null
	releaseDate: Date | undefined
} {
	// Split on <br>, <br/>, or <br />
	const parts = html.split(/<br\s*\/?>/i).map((p) => p.trim())

	const version = parts[0]?.replace(/[<>]/g, '') || null
	const dateStr = parts[1]?.replace(/<[^>]*>/g, '').trim()

	let releaseDate: Date | undefined
	if (dateStr) {
		// Parse dates like "Dec 19, 2025"
		const date = new Date(`${dateStr} UTC`)
		if (!Number.isNaN(date.getTime())) {
			releaseDate = date
		}
	}

	return { version, releaseDate }
}

function extractChanges(expandableItems: HTMLElement): ParsedChange[] {
	const changes: ParsedChange[] = []
	const details = expandableItems.querySelectorAll('details')
	let order = 0

	for (const detail of details) {
		const summary = detail.querySelector('summary')
		const summaryText = summary?.text.trim() || ''

		// Extract category from summary like "Improvements (1)"
		const categoryMatch = summaryText.match(/^(Improvements|Fixes|Patches)/i)
		if (!categoryMatch) continue

		const changeType = mapCategoryToChangeType(categoryMatch[1])

		// Get all list items
		const items = detail.querySelectorAll('li.caption')
		for (const item of items) {
			const text = item.text.trim()
			if (!text) continue

			changes.push({
				type: changeType,
				title: text,
				description: undefined,
				platform: undefined,
				component: undefined,
				isBreaking: false,
				isSecurity: changeType === 'SECURITY',
				isDeprecation: changeType === 'DEPRECATION',
				impact: undefined,
				links: undefined,
				media: undefined,
				order: order++,
			})
		}
	}

	return changes
}

function mapCategoryToChangeType(category: string): ChangeType {
	const normalized = category.toLowerCase()
	switch (normalized) {
		case 'improvements':
			return 'IMPROVEMENT'
		case 'fixes':
			return 'BUGFIX'
		case 'patches':
			return 'BUGFIX'
		default:
			return 'OTHER'
	}
}

function normalizeUrls(element: HTMLElement, baseUrl: string) {
	const linkNodes = element.querySelectorAll('a[href]')
	for (const node of linkNodes) {
		const href = node.getAttribute('href')
		if (href) {
			node.setAttribute('href', toAbsoluteUrl(href, baseUrl))
		}
	}

	const srcNodes = element.querySelectorAll('[src]')
	for (const node of srcNodes) {
		const src = node.getAttribute('src')
		if (src) {
			node.setAttribute('src', toAbsoluteUrl(src, baseUrl))
		}
	}
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
	if (!url) return baseUrl
	if (
		/^https?:/i.test(url) ||
		url.startsWith('data:') ||
		url.startsWith('mailto:')
	) {
		return url
	}

	try {
		return new URL(url, baseUrl).toString()
	} catch {
		return url
	}
}

function buildSourceUrl(baseUrl: string, startPath: string, version: string) {
	const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	const normalizedPath = startPath.startsWith('/') ? startPath : `/${startPath}`

	return `${normalizedBase}${normalizedPath}#${version}`
}

function generateSummary(text: string | undefined): string | undefined {
	if (!text) return undefined

	const cleaned = text.replace(/\s+/g, ' ').trim()
	if (!cleaned) return undefined

	return cleaned.length > 280 ? `${cleaned.slice(0, 280)}...` : cleaned
}

function generateVersionSort(
	releaseDate: Date | undefined,
	version: string,
): string {
	if (releaseDate) {
		return releaseDate.toISOString()
	}

	return `antigravity-${version}`
}

function generateHeadline(
	summary: string | undefined,
	title: string,
	version: string,
): string {
	const fallbackText = summary
		? summary.trim()
		: title.replace(/\s+/g, ' ').trim()

	if (!fallbackText) {
		return `Updates for Antigravity ${version}`
	}

	const sentenceMatch = fallbackText.match(/.*?[.!?](\s|$)/)
	const sentence = (sentenceMatch ? sentenceMatch[0] : fallbackText).trim()
	const target =
		sentence || fallbackText || `Updates for Antigravity ${version}`

	return target.length > 120 ? `${target.slice(0, 117)}...` : target
}
