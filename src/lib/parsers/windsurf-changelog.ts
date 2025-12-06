import { createHash } from 'node:crypto'
import { type HTMLElement, parse } from 'node-html-parser'
import type { ParsedChange, ParsedRelease } from './changelog-md'

export interface WindsurfParserOptions {
	baseUrl?: string
	startPath?: string
	releaseSelector?: string
	bodySelector?: string
}

const DEFAULT_OPTIONS: Required<WindsurfParserOptions> = {
	baseUrl: 'https://windsurf.com',
	startPath: '/changelog',
	releaseSelector: 'div[id][class*="scroll-mt-10"]',
	bodySelector: '.prose',
}

/**
 * Parse Windsurf changelog HTML into normalized release objects.
 * Each release lives in a <div id="1.12.39" class="... scroll-mt-10 ...">
 * and contains an article with the actual prose content.
 */
export function parseWindsurfChangelog(
	html: string,
	options?: WindsurfParserOptions,
): ParsedRelease[] {
	if (!html || html.trim() === '') {
		return []
	}

	const config = { ...DEFAULT_OPTIONS, ...options }
	const root = parse(html)
	const releases: ParsedRelease[] = []

	const releaseNodes = root
		.querySelectorAll(config.releaseSelector)
		.filter((node) => {
			const id = node.getAttribute('id')?.trim()
			return Boolean(id && isVersionId(id))
		})

	for (const releaseNode of releaseNodes) {
		const parsed = transformRelease(releaseNode as HTMLElement, config)
		if (parsed) {
			releases.push(parsed)
		}
	}

	return releases
}

function transformRelease(
	node: HTMLElement,
	config: Required<WindsurfParserOptions>,
): ParsedRelease | null {
	normalizeUrls(node, config.baseUrl)

	const versionId = sanitizeSlug(node.getAttribute('id'))
	if (!versionId) return null

	const headerDateText =
		node.querySelector('time')?.getAttribute('datetime') ||
		node.querySelector('time')?.text.trim() ||
		node.querySelector('header .caption1')?.text.trim()
	const releaseDate = parseDate(headerDateText)

	const body =
		(node.querySelector(config.bodySelector) as HTMLElement | null) ||
		(node.querySelector('article') as HTMLElement | null) ||
		node

	const title =
		body.querySelector('h1, h2')?.text.trim() || `Windsurf ${versionId}`.trim()

	const rawContent = body.toString().trim()
	const textContent = extractParagraphText(body) || getNodeText(body)

	const changes = extractChanges(body)
	if (changes.length === 0) {
		const fallbackText = textContent.trim()
		if (!fallbackText) {
			return null
		}
		changes.push(
			createChangeCandidate(fallbackText, 0, undefined, undefined, title),
		)
	}

	const contentHash = createHash('sha256')
		.update(title ?? '')
		.update(rawContent)
		.digest('hex')
	const fingerprint = contentHash.slice(0, 12)
	const slug = versionId
	const version = slug ? `windsurf-${slug}` : `windsurf-${fingerprint}`
	const summary = generateSummary(textContent)
	const headline = generateHeadline(summary, textContent, version)
	const sourceUrl = buildSourceUrl(config.baseUrl, config.startPath, versionId)

	return {
		version,
		versionSort: generateVersionSort(releaseDate, slug, fingerprint),
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

function buildSourceUrl(baseUrl: string, startPath: string, anchor: string) {
	const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	const normalizedPath = startPath.startsWith('/') ? startPath : `/${startPath}`

	return `${normalizedBase}${normalizedPath}#${anchor}`
}

function isVersionId(id: string): boolean {
	return /^[vV]?\d+(\.\d+){1,3}$/.test(id.trim())
}

function sanitizeSlug(slug?: string | null): string | null {
	if (!slug) return null
	return slug.replace(/^v/i, '').replace(/[^\dA-Za-z.-]/g, '-')
}

function extractChanges(body: HTMLElement): ParsedChange[] {
	const primaryHeadings = ['h2', 'h3', 'h4']
	const headings =
		body.querySelectorAll(primaryHeadings.join(', ')).length > 0
			? body.querySelectorAll(primaryHeadings.join(', '))
			: body.querySelectorAll('h1')
	const changes: ParsedChange[] = []

	if (headings.length > 0) {
		let order = 0
		for (const heading of headings) {
			const title = heading.text.trim()
			if (!title) continue

			const { description, media } = collectDescriptionUntilNextHeading(
				heading as HTMLElement,
				primaryHeadings,
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
	fallbackTitle?: string,
): ParsedChange {
	return {
		type: 'OTHER',
		title: title || fallbackTitle || 'Update',
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
			const text = extractParagraphText(node) || getNodeText(node).trim()
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

function extractParagraphText(node: HTMLElement): string {
	const paragraphs = node.querySelectorAll('p')
	if (paragraphs.length === 0) {
		return ''
	}

	const parts = paragraphs.map((p) => getNodeText(p).trim()).filter(Boolean)
	return parts.join('\n\n')
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

function parseDate(value?: string | null): Date | undefined {
	if (!value) return undefined

	const normalized = value.trim()
	const dateValue =
		/[T ]\d{2}:\d{2}/.test(normalized) || /Z$/.test(normalized)
			? normalized
			: `${normalized} UTC`

	const date = new Date(dateValue)
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
	slug: string | null,
	fingerprint: string,
): string {
	if (releaseDate) {
		return releaseDate.toISOString()
	}

	return slug
		? `slug-${slug.replace(/[^\dA-Za-z.-]/g, '-')}`
		: `windsurf-${fingerprint}`
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
