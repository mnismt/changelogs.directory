import { createHash } from 'node:crypto'
import type { ParsedChange, ParsedRelease } from './changelog-md'
import {
	classifyChangeType,
	detectBreaking,
	detectDeprecation,
	detectSecurity,
	extractLinks,
	generateVersionSort,
} from './changelog-md-utils'

/**
 * GitHub Release API response structure
 */
export interface GitHubRelease {
	tag_name: string
	name: string
	body: string
	prerelease: boolean
	draft: boolean
	published_at: string
	html_url: string
}

/**
 * Configuration for parsing GitHub releases
 */
export interface GitHubReleaseParserConfig {
	/** Version prefix to strip (e.g., "rust-v" from "rust-v0.55.0") */
	versionPrefix?: string
	/** Whether to include draft releases */
	includeDrafts?: boolean
	/** Whether to include pre-releases */
	includePreReleases?: boolean
	/** Repository URL for constructing source links */
	repositoryUrl?: string
}

/**
 * Parses GitHub Releases API data into normalized ParsedRelease format
 * @param releases Array of GitHub releases from API
 * @param config Parser configuration
 * @returns Array of parsed releases
 */
export function parseGitHubReleases(
	releases: GitHubRelease[],
	config?: GitHubReleaseParserConfig,
): ParsedRelease[] {
	const parsedReleases: ParsedRelease[] = []

	for (const release of releases) {
		// Filter drafts
		if (release.draft && !config?.includeDrafts) {
			continue
		}

		// Filter pre-releases
		if (release.prerelease && !config?.includePreReleases) {
			continue
		}

		// Extract version (strip prefix if configured)
		let version = release.name || release.tag_name
		if (config?.versionPrefix && version.startsWith(config.versionPrefix)) {
			version = version.substring(config.versionPrefix.length)
		}

		// Also strip from tag_name if needed
		if (
			config?.versionPrefix &&
			release.tag_name.startsWith(config.versionPrefix)
		) {
			version =
				release.name || release.tag_name.substring(config.versionPrefix.length)
		}

		// Parse release date from published_at
		const releaseDate = new Date(release.published_at)

		// Parse body into changes
		const changes = parseReleaseBody(release.body, config?.repositoryUrl)

		// Generate version sort key with pre-release handling
		const versionSort = generateVersionSortWithPreRelease(
			version,
			release.prerelease,
		)

		// Compute content hash
		const contentHash = createHash('sha256').update(release.body).digest('hex')

		// Generate summary + headline
		const summary = generateSummary(release.body)
		const headline = generateHeadline(summary, release.body, version)

		parsedReleases.push({
			version,
			versionSort,
			releaseDate,
			title: release.name || undefined,
			headline,
			summary,
			rawContent: release.body,
			contentHash,
			changes,
			isPrerelease: release.prerelease,
			sourceUrl: release.html_url,
		})
	}

	return parsedReleases
}

/**
 * Parses GitHub release body markdown into changes
 * Simplified: extracts bullets and lets LLM handle classification
 * Keeps keyword-based fallbacks for when LLM is unavailable
 */
function parseReleaseBody(
	body: string,
	repositoryUrl?: string,
): ParsedChange[] {
	if (!body || body.trim() === '') return []

	const changes: ParsedChange[] = []
	let order = 0
	let inCodeBlock = false

	for (const rawLine of body.split('\n')) {
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

		// Extract PR/issue references
		const prMatch = content.match(/#(\d+)/)
		let links: Array<{ url: string; text: string; type: string }> | undefined

		if (prMatch && repositoryUrl) {
			const prNumber = prMatch[1]
			links = [
				{
					url: `${repositoryUrl}/pull/${prNumber}`,
					text: `#${prNumber}`,
					type: 'pr',
				},
			]
		}

		// Extract additional markdown links
		const markdownLinks = extractLinks(content)
		if (markdownLinks.length > 0) {
			links = links ? [...links, ...markdownLinks] : markdownLinks
		}

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
			links,
			order: order++,
		})
	}

	return changes
}

/**
 * Enhanced version sort that properly handles pre-release alpha/beta/rc numbers
 * Examples:
 * - 0.54.0-alpha.1 → 000054000-a001
 * - 0.54.0-alpha.2 → 000054000-a002
 * - 0.54.0 → 000054000-z
 */
function generateVersionSortWithPreRelease(
	version: string,
	isPreRelease: boolean,
): string {
	// Match version with optional pre-release suffix
	// Examples: 0.54.0, 0.54.0-alpha.1, 1.2.3-beta.2, 2.0.0-rc.1
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+)\.(\d+))?$/)

	if (!match) {
		// Fallback: use original generateVersionSort for non-matching formats
		return generateVersionSort(version)
	}

	const [_, major, minor, patch, preType, preNum] = match
	const base = `${major.padStart(3, '0')}${minor.padStart(3, '0')}${patch.padStart(3, '0')}`

	// Stable releases (no pre-release)
	if (!isPreRelease) {
		return `${base}-z` // Sort AFTER all pre-releases
	}

	// Pre-releases (alpha, beta, rc)
	const preTypeOrder: Record<string, string> = {
		alpha: 'a',
		beta: 'b',
		rc: 'c',
	}

	const typePrefix = preTypeOrder[preType || 'alpha'] || 'a'
	const preNumber = (preNum || '0').padStart(3, '0')

	return `${base}-${typePrefix}${preNumber}`
}

/**
 * Generates a concise summary from release body (first 200 chars)
 */
function generateSummary(body: string): string | undefined {
	if (!body || body.trim() === '') return undefined

	// Remove markdown headers
	const cleaned = body
		.replace(/^##\s+.*/gm, '')
		.replace(/^-\s+/gm, '')
		.trim()

	if (!cleaned) return undefined

	return cleaned.length > 200 ? `${cleaned.substring(0, 200)}...` : cleaned
}

function generateHeadline(
	summary: string | undefined,
	body: string,
	version: string,
): string {
	const fallbackText = summary
		? summary.trim()
		: body
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
