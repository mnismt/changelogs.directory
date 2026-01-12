import matter from 'gray-matter'

export interface PlatformImage {
	src: string
	width?: string
	alt?: string
}

export type ContentBlock =
	| { type: 'image'; data: PlatformImage }
	| { type: 'video'; data: { src: string; width?: string } }
	| { type: 'change'; data: string }

export interface PlatformRelease {
	version: string
	date: string
	title: string
	content: ContentBlock[]
	/** @deprecated Use content instead */
	images: PlatformImage[]
	/** @deprecated Use content instead */
	video?: string
	/** @deprecated Use content instead */
	videoWidth?: string
	/** @deprecated Use content instead */
	changes: string[]
}

export interface PlatformChangelog {
	title: string
	description: string
	releases: PlatformRelease[]
	latestVersion: string
}

/**
 * Parse the platform's own CHANGELOG.md with frontmatter support
 */
export function parsePlatformChangelog(content: string): PlatformChangelog {
	const { data: frontmatter, content: body } = matter(content)

	const releases: PlatformRelease[] = []

	// Match version headers: ## 0.4.0
	const versionRegex = /^## (\d+\.\d+\.\d+)/gm
	const sections = body.split(versionRegex).slice(1)

	for (let i = 0; i < sections.length; i += 2) {
		const version = sections[i]
		const sectionContent = sections[i + 1] || ''

		// Extract date and title: > **2026-01-06** — Tool Lanes Layout
		// Also supports ISO 8601 datetime: > **2026-01-07T10:30:00+07:00** — Title
		const metaMatch = sectionContent.match(
			/>\s*\*\*(\d{4}-\d{2}-\d{2}(?:T[\d:]+(?:[+-]\d{2}:\d{2}|Z)?)?)\*\*\s*—\s*(.+)/,
		)
		const date = metaMatch?.[1] || ''
		const title = metaMatch?.[2]?.trim() || ''

		// Parse content blocks in document order
		const contentBlocks: Array<{ index: number; block: ContentBlock }> = []

		// Match markdown images: ![alt](path)
		const mdImageMatches = sectionContent.matchAll(/!\[(.*?)\]\(([^)]+)\)/g)
		for (const mdMatch of mdImageMatches) {
			contentBlocks.push({
				index: mdMatch.index ?? 0,
				block: {
					type: 'image',
					data: {
						src: mdMatch[2],
						alt: mdMatch[1] || undefined,
					},
				},
			})
		}

		// Match HTML images: <img src="path" ... />
		const htmlImageMatches = sectionContent.matchAll(
			/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
		)
		for (const htmlMatch of htmlImageMatches) {
			const fullTag = htmlMatch[0]
			const src = htmlMatch[1]
			const widthMatch = fullTag.match(/width=["']([^"']+)["']/i)
			const altMatch = fullTag.match(/alt=["']([^"']+)["']/i)
			contentBlocks.push({
				index: htmlMatch.index ?? 0,
				block: {
					type: 'image',
					data: {
						src,
						width: widthMatch?.[1],
						alt: altMatch?.[1],
					},
				},
			})
		}

		// Match video: <video src="/path/to/video.mp4" ... />
		const htmlVideoMatches = sectionContent.matchAll(
			/<video\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/gi,
		)
		for (const videoMatch of htmlVideoMatches) {
			const fullTag = videoMatch[0]
			const src = videoMatch[1]
			const widthMatch = fullTag.match(/width=["']([^"']+)["']/i)
			contentBlocks.push({
				index: videoMatch.index ?? 0,
				block: {
					type: 'video',
					data: {
						src,
						width: widthMatch?.[1],
					},
				},
			})
		}

		// Match bullet points with their positions
		const bulletRegex = /^[-*]\s+(.+)$/gm
		const bulletMatches = sectionContent.matchAll(bulletRegex)
		for (const bulletMatch of bulletMatches) {
			contentBlocks.push({
				index: bulletMatch.index ?? 0,
				block: {
					type: 'change',
					data: bulletMatch[1].trim(),
				},
			})
		}

		// Sort by document order
		const content = contentBlocks
			.sort((a, b) => a.index - b.index)
			.map((c) => c.block)

		// Legacy fields for backward compatibility
		const images = content
			.filter((c): c is ContentBlock & { type: 'image' } => c.type === 'image')
			.map((c) => c.data)
		const changes = content
			.filter(
				(c): c is ContentBlock & { type: 'change' } => c.type === 'change',
			)
			.map((c) => c.data)
		const videoBlock = content.find(
			(c): c is ContentBlock & { type: 'video' } => c.type === 'video',
		)
		const video = videoBlock?.data.src
		const videoWidth = videoBlock?.data.width

		releases.push({
			version,
			date,
			title,
			content,
			images,
			video,
			videoWidth,
			changes,
		})
	}

	return {
		title: (frontmatter.title as string) || 'Changelog',
		description: (frontmatter.description as string) || '',
		releases,
		latestVersion: releases[0]?.version || '0.0.0',
	}
}
