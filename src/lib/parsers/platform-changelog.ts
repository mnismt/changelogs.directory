import matter from 'gray-matter'

export interface PlatformRelease {
	version: string
	date: string
	title: string
	image?: string
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
		const metaMatch = sectionContent.match(
			/>\s*\*\*(\d{4}-\d{2}-\d{2})\*\*\s*—\s*(.+)/,
		)
		const date = metaMatch?.[1] || ''
		const title = metaMatch?.[2]?.trim() || ''

		// Extract image: ![alt](/path/to/image.png)
		const imageMatch = sectionContent.match(/!\[.*?\]\(([^)]+)\)/)
		const image = imageMatch?.[1]

		// Extract bullet points
		const changes = sectionContent
			.split('\n')
			.filter((line) => /^[-*]\s+/.test(line))
			.map((line) => line.replace(/^[-*]\s+/, '').trim())

		releases.push({ version, date, title, image, changes })
	}

	return {
		title: (frontmatter.title as string) || 'Changelog',
		description: (frontmatter.description as string) || '',
		releases,
		latestVersion: releases[0]?.version || '0.0.0',
	}
}
