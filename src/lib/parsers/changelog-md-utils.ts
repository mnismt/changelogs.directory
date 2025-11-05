import type { ChangeType, ImpactLevel } from '@prisma/client'

/**
 * Shared utility functions for parsing changelogs
 * Used by both changelog-md and github-releases parsers
 */

/**
 * Extracts markdown links from text
 */
export function extractLinks(
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
export function detectBreaking(text: string): boolean {
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
export function detectSecurity(text: string): boolean {
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
export function detectDeprecation(text: string): boolean {
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
export function classifyChangeType(
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
export function assessImpact(
	type: ChangeType,
	isBreaking: boolean,
): ImpactLevel {
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
