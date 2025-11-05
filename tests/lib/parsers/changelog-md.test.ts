import { describe, expect, it } from 'vitest'
import {
	generateVersionSort,
	parseChangelogMd,
} from '@/lib/parsers/changelog-md'
import { loadChangelogFixture } from 'tests/helpers/fixtures'

describe('parseChangelogMd', () => {
	it('should parse basic changelog with multiple versions', () => {
		const markdown = `# Changelog

## 2.0.31
- Feature one
- Feature two

## 2.0.30
- Bug fix one
`

		const releases = parseChangelogMd(markdown)

		expect(releases).toHaveLength(2)
		expect(releases[0].version).toBe('2.0.31')
		expect(releases[1].version).toBe('2.0.30')
	})

	it('should extract version numbers correctly', () => {
		const markdown = `## 2.0.31
- Change one

## 1.5.0-beta.1
- Change two
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].version).toBe('2.0.31')
		expect(releases[1].version).toBe('1.5.0-beta.1')
	})

	it('should parse bullet points into changes', () => {
		const markdown = `## 2.0.31
- First change
- Second change
- Third change
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].changes).toHaveLength(3)
		expect(releases[0].changes[0].title).toBe('First change')
		expect(releases[0].changes[1].title).toBe('Second change')
		expect(releases[0].changes[2].title).toBe('Third change')
	})

	// Platform and component extraction removed - now handled by LLM enrichment
	// These fields are intentionally left undefined in the parser

	it('should detect breaking flags', () => {
		const markdown = `## 2.0.31
- BREAKING: Removed deprecated API
- Fixed a bug
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].changes[0].isBreaking).toBe(true)
		expect(releases[0].changes[1].isBreaking).toBe(false)
	})

	it('should detect security flags', () => {
		const markdown = `## 2.0.31
- Security: Fixed vulnerability
- Regular change
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].changes[0].isSecurity).toBe(true)
		expect(releases[0].changes[1].isSecurity).toBe(false)
	})

	it('should detect deprecation flags', () => {
		const markdown = `## 2.0.31
- Deprecated old API
- New feature
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].changes[0].isDeprecation).toBe(true)
		expect(releases[0].changes[1].isDeprecation).toBe(false)
	})

	it('should compute contentHash correctly', () => {
		const markdown = `## 2.0.31
- Change one
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].contentHash).toBeTruthy()
		expect(typeof releases[0].contentHash).toBe('string')
		expect(releases[0].contentHash.length).toBe(64) // SHA256 hex length
	})

	it('should preserve change order', () => {
		const markdown = `## 2.0.31
- First
- Second
- Third
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].changes[0].order).toBe(0)
		expect(releases[0].changes[1].order).toBe(1)
		expect(releases[0].changes[2].order).toBe(2)
	})

	it('should handle empty changelog', () => {
		const releases = parseChangelogMd('')

		expect(releases).toHaveLength(0)
	})

	it('should handle changelog with no versions', () => {
		const markdown = `# Changelog

No releases yet.
`

		const releases = parseChangelogMd(markdown)

		expect(releases).toHaveLength(0)
	})

	it('should parse real changelog fixture', () => {
		const markdown = loadChangelogFixture()

		const releases = parseChangelogMd(markdown)

		expect(releases.length).toBeGreaterThan(0)
		expect(releases[0].version).toBe('2.0.31')
		expect(releases[0].changes.length).toBeGreaterThan(0)
	})

	it('should use version dates from Git history as fallback', () => {
		const markdown = `## 2.0.31
- Feature one

## 2.0.30
- Bug fix
`

		const versionDates = new Map<string, Date>([
			['2.0.31', new Date('2024-01-15')],
			['2.0.30', new Date('2024-01-10')],
		])

		const releases = parseChangelogMd(markdown, versionDates)

		expect(releases[0].releaseDate).toEqual(new Date('2024-01-15'))
		expect(releases[1].releaseDate).toEqual(new Date('2024-01-10'))
	})

	it('should prioritize header dates over version dates', () => {
		const markdown = `## 2.0.31 - 2024-01-20
- Feature one

## 2.0.30
- Bug fix
`

		const versionDates = new Map<string, Date>([
			['2.0.31', new Date('2024-01-15')],
			['2.0.30', new Date('2024-01-10')],
		])

		const releases = parseChangelogMd(markdown, versionDates)

		// Header date takes precedence for 2.0.31
		expect(releases[0].releaseDate).toEqual(new Date('2024-01-20'))
		// Fallback to version dates for 2.0.30
		expect(releases[1].releaseDate).toEqual(new Date('2024-01-10'))
	})

	it('should handle missing version dates gracefully', () => {
		const markdown = `## 2.0.31
- Feature one
`

		const versionDates = new Map<string, Date>()

		const releases = parseChangelogMd(markdown, versionDates)

		expect(releases[0].releaseDate).toBeUndefined()
	})

	it('should work without version dates parameter', () => {
		const markdown = `## 2.0.31
- Feature one
`

		const releases = parseChangelogMd(markdown)

		expect(releases[0].releaseDate).toBeUndefined()
	})
})

describe('generateVersionSort', () => {
	it('should generate sort key for stable version', () => {
		expect(generateVersionSort('2.0.31')).toBe('002000031-z')
		expect(generateVersionSort('1.5.0')).toBe('001005000-z')
	})

	it('should generate sort key for pre-release version', () => {
		expect(generateVersionSort('2.0.31-beta.1')).toBe('002000031-a-beta.1')
		expect(generateVersionSort('1.5.0-alpha.2')).toBe('001005000-a-alpha.2')
	})

	it('should handle non-semver versions', () => {
		const result = generateVersionSort('v1.0')
		expect(typeof result).toBe('string')
		expect(result.length).toBeGreaterThan(0)
	})

	it('should sort pre-releases before stable', () => {
		const stable = generateVersionSort('2.0.31')
		const prerelease = generateVersionSort('2.0.31-beta.1')

		expect(prerelease < stable).toBe(true)
	})

	it('should sort versions correctly', () => {
		const v1 = generateVersionSort('1.0.0')
		const v2 = generateVersionSort('2.0.0')
		const v15 = generateVersionSort('1.5.0')

		expect(v1 < v15).toBe(true)
		expect(v15 < v2).toBe(true)
	})
})

