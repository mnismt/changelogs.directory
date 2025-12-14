import { createHash } from 'node:crypto'
import { type HTMLElement, parse } from 'node-html-parser'
import type { ParsedChange, ParsedRelease } from './changelog-md'

export interface CursorParserOptions {
	baseUrl?: string
	articleSelector?: string
	bodySelector?: string
}

const DEFAULT_OPTIONS: Required<CursorParserOptions> = {
	baseUrl: 'https://cursor.com',
	articleSelector: '#main.section.section--longform article',
	bodySelector: '.prose',
}

/**
 * Parse Cursor changelog HTML into normalized release objects.
 * Preserves rich HTML (images, videos) in rawContent while extracting
 * individual change candidates from headings/lists.
 */
export function parseCursorChangelog(
	html: string,
	options?: CursorParserOptions,
): ParsedRelease[] {
	if (!html || html.trim() === '') {
		return []
	}

	const config = { ...DEFAULT_OPTIONS, ...options }
	const root = parse(html)
	const articles = root.querySelectorAll(config.articleSelector)
	const releases: ParsedRelease[] = []

	for (const article of articles) {
		const release = transformArticle(article as HTMLElement, config)
		if (release) {
			releases.push(release)
		}
	}

	return releases
}

function transformArticle(
	article: HTMLElement,
	config: Required<CursorParserOptions>,
): ParsedRelease | null {
	normalizeUrls(article, config.baseUrl)

	const title =
		article.querySelector('h2')?.text.trim() ||
		article.querySelector('h3')?.text.trim()
	const permalink =
		article
			.querySelector('h2 a[href^="/changelog"], h2 a[href^="https"]')
			?.getAttribute('href') ||
		article.querySelector('a[href^="/changelog/"]')?.getAttribute('href')

	const slug = extractSlug(permalink, config.baseUrl)
	const sourceUrl = permalink
		? toAbsoluteUrl(permalink, config.baseUrl)
		: `${config.baseUrl}/changelog`

	if (!slug) {
		console.warn(
			`[cursor-parser] Skipping release without valid slug: "${title}" at ${sourceUrl}`,
		)
		return null
	}

	const timeNode = article.querySelector('time')
	const releaseDate = parseDate(
		timeNode?.getAttribute('datetime') || timeNode?.text.trim(),
	)

	const body =
		(article.querySelector(config.bodySelector) as HTMLElement | null) ||
		article

	const bodyHtml = body.toString().trim()
	const rawContent = article.toString().trim()
	const changes = extractChanges(body)

	if (changes.length === 0) {
		const fallbackText = getNodeText(body).trim()
		if (fallbackText) {
			changes.push(createChangeCandidate(fallbackText, 0))
		} else {
			return null
		}
	}

	const contentHash = createHash('sha256')
		.update(title ?? '')
		.update(bodyHtml)
		.digest('hex')
	const version = `cursor-${slug}`
	const textContent = getNodeText(body)
	const summary = generateSummary(textContent)
	const headline = generateHeadline(summary, textContent, version)

	return {
		version,
		versionSort: generateVersionSort(releaseDate, slug),
		releaseDate,
		title: title || `Cursor update ${slug}`.trim(),
		headline,
		summary,
		rawContent,
		contentHash,
		changes,
		sourceUrl,
	}
}

function extractChanges(body: HTMLElement): ParsedChange[] {
	const headingSelectors = ['h3', 'h4']
	const headings = body.querySelectorAll(headingSelectors.join(', '))
	const changes: ParsedChange[] = []

	if (headings.length > 0) {
		let order = 0
		for (const heading of headings) {
			const title = heading.text.trim()
			if (!title) continue

			const { description, media } = collectDescriptionUntilNextHeading(
				heading as HTMLElement,
				headingSelectors,
			)

			changes.push(createChangeCandidate(title, order++, description, media))
		}

		return changes
	}

	// Fallback: use list items if no headings present
	const listItems = body.querySelectorAll('li')
	if (listItems.length > 0) {
		let order = 0
		for (const li of listItems) {
			const text = getNodeText(li).trim()
			if (!text) continue
			changes.push(createChangeCandidate(text, order++))
		}
		return changes
	}

	return []
}

function createChangeCandidate(
	title: string,
	order: number,
	description?: string,
	media?: Array<{ type: 'video' | 'image'; url: string; alt?: string }>,
): ParsedChange {
	return {
		type: 'OTHER',
		title,
		description,
		platform: undefined,
		component: undefined,
		isBreaking: false,
		isSecurity: false,
		isDeprecation: false,
		impact: undefined,
		links: undefined,
		media: media && media.length > 0 ? media : undefined,
		order,
	}
}

function collectDescriptionUntilNextHeading(
	start: HTMLElement,
	headingTags: string[],
): {
	description: string | undefined
	media: Array<{ type: 'video' | 'image'; url: string; alt?: string }>
} {
	const descriptionParts: string[] = []
	const media: Array<{ type: 'video' | 'image'; url: string; alt?: string }> =
		[]
	let node: HTMLElement | null = start.nextElementSibling as HTMLElement | null

	while (node) {
		const tag = node.tagName?.toLowerCase()
		if (tag && headingTags.includes(tag)) {
			break
		}

		if (tag === 'figure') {
			const mediaFragments: string[] = []
			const video = node.querySelector('video')
			const img = node.querySelector('img')
			if (video) {
				const src = video.getAttribute('src')
				if (src) {
					media.push({ type: 'video', url: src })
					mediaFragments.push(`Video: ${src}`)
				}
			}
			if (img) {
				const src = img.getAttribute('src')
				const alt = img.getAttribute('alt')
				if (src) {
					media.push({
						type: 'image',
						url: src,
						alt: alt || undefined,
					})
					mediaFragments.push(alt ? `![${alt}](${src})` : src)
				}
			}
			if (mediaFragments.length > 0) {
				descriptionParts.push(mediaFragments.join('\n'))
			}
		} else {
			const text = getNodeText(node).trim()
			if (text) {
				descriptionParts.push(text)
			}
		}

		node = node.nextElementSibling as HTMLElement | null
	}

	return {
		description:
			descriptionParts.length > 0 ? descriptionParts.join('\n\n') : undefined,
		media,
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

	const srcsetNodes = element.querySelectorAll('[srcset]')
	for (const node of srcsetNodes) {
		const srcset = node.getAttribute('srcset')
		if (!srcset) continue
		const normalized = srcset
			.split(',')
			.map((entry) => {
				const [url, descriptor] = entry.trim().split(/\s+/)
				return [toAbsoluteUrl(url, baseUrl), descriptor]
					.filter(Boolean)
					.join(' ')
			})
			.join(', ')
		node.setAttribute('srcset', normalized)
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

/**
 * Valid Cursor changelog slugs follow the pattern: major-minor (e.g., "2-2", "1-7")
 * This regex ensures we only accept properly formatted version slugs.
 */
const VALID_CURSOR_SLUG_PATTERN = /^\d+-\d+$/

function extractSlug(
	href: string | undefined | null,
	baseUrl: string,
): string | null {
	if (!href) return null

	try {
		const absolute = new URL(href, baseUrl)
		const parts = absolute.pathname.split('/').filter(Boolean)
		const slug = parts.pop() || null

		if (slug && VALID_CURSOR_SLUG_PATTERN.test(slug)) {
			return slug
		}

		return null
	} catch {
		return null
	}
}

function parseDate(value?: string | null): Date | undefined {
	if (!value) return undefined

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return undefined
	}

	return date
}

function generateSummary(text: string | undefined): string | undefined {
	if (!text) return undefined

	const cleaned = text.replace(/\s+/g, ' ').trim()
	if (!cleaned) return undefined

	return cleaned.length > 280 ? `${cleaned.slice(0, 280)}...` : cleaned
}

function generateVersionSort(
	releaseDate: Date | undefined,
	slug: string,
): string {
	if (releaseDate) {
		return releaseDate.toISOString()
	}

	return `slug-${slug}`
}

function generateHeadline(
	summary: string | undefined,
	text: string,
	version: string,
): string {
	const fallbackText = summary
		? summary.trim()
		: text.replace(/\s+/g, ' ').trim()

	if (!fallbackText) {
		return `Updates for ${version}`
	}

	const sentenceMatch = fallbackText.match(/.*?[.!?](\s|$)/)
	const sentence = (sentenceMatch ? sentenceMatch[0] : fallbackText).trim()
	const target = sentence || fallbackText || `Updates for ${version}`

	return target.length > 120 ? `${target.slice(0, 117)}...` : target
}

function getNodeText(node: HTMLElement | null | undefined): string {
	if (!node) return ''

	const withInnerText = node as HTMLElement & { innerText?: string }
	if (typeof withInnerText.innerText === 'string') {
		return withInnerText.innerText
	}

	return node.text ?? ''
}
