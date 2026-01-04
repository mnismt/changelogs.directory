import { describe, expect, it } from 'vitest'
import { parseAntigravityChangelog } from '@/lib/parsers/antigravity-changelog'
import { loadAntigravityChangelogFixture } from 'tests/helpers/fixtures'

describe('parseAntigravityChangelog', () => {
	it('parses multiple releases from the fixture', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		expect(releases).toHaveLength(8)
	})

	it('extracts version and date correctly', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		const latest = releases[0]
		expect(latest.version).toBe('antigravity-1.13.3')
		expect(latest.releaseDate?.toISOString()).toBe('2025-12-19T00:00:00.000Z')

		const second = releases[1]
		expect(second.version).toBe('antigravity-1.12.4')
		expect(second.releaseDate?.toISOString()).toBe('2025-12-17T00:00:00.000Z')
	})

	it('extracts title from h3.heading-7', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		expect(releases[0].title).toBe('Google Workspace Support')
		expect(releases[1].title).toBe('Gemini 3 Flash')
		expect(releases[2].title).toBe('Secure Mode and Security Fixes')
		expect(releases[3].title).toBe('Google One Support')
	})

	it('extracts summary from div.changes > p', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		expect(releases[0].summary).toContain(
			'Higher, more frequently refreshed rate limits for Google Workspace AI Ultra for Business subscribers.',
		)
		expect(releases[1].summary).toContain(
			'Support for Gemini 3 Flash in Antigravity.',
		)
	})

	it('maps categories correctly: Improvements → IMPROVEMENT', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// First release has 1 Improvement
		const firstRelease = releases[0]
		const improvements = firstRelease.changes.filter(
			(c) => c.type === 'IMPROVEMENT',
		)
		expect(improvements).toHaveLength(1)
		expect(improvements[0].title).toContain(
			'Higher, more frequently refreshed rate limits',
		)
	})

	it('maps categories correctly: Fixes → BUGFIX', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// Third release (1.11.17 - Secure Mode) has 1 Fix
		const thirdRelease = releases[2]
		const bugfixes = thirdRelease.changes.filter((c) => c.type === 'BUGFIX')
		expect(bugfixes).toHaveLength(1)
		expect(bugfixes[0].title).toBe('Various security fixes.')
	})

	it('maps categories correctly: Patches → BUGFIX', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// Second release (1.12.4 - Gemini 3 Flash) has 1 Patch
		const secondRelease = releases[1]
		const patches = secondRelease.changes.filter((c) => c.type === 'BUGFIX')
		expect(patches).toHaveLength(1)
		expect(patches[0].title).toContain('Switched default browser use model')
		expect(patches[0].title).toContain('Gemini 3')
	})

	it('handles empty categories (0 items)', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// First release has Fixes (0) and Patches (0)
		const firstRelease = releases[0]
		const bugfixes = firstRelease.changes.filter((c) => c.type === 'BUGFIX')
		const patches = firstRelease.changes.filter((c) => c.type === 'BUGFIX')
		expect(bugfixes).toHaveLength(0)
		expect(patches).toHaveLength(0)

		// Total changes should be 1 (only the improvement)
		expect(firstRelease.changes).toHaveLength(1)
	})

	it('generates correct contentHash', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		for (const release of releases) {
			expect(release.contentHash).toBeDefined()
			expect(release.contentHash).toHaveLength(64) // SHA-256 hex string
		}

		// Different releases should have different hashes
		expect(releases[0].contentHash).not.toBe(releases[1].contentHash)
	})

	it('generates correct versionSort based on releaseDate', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// versionSort should be ISO date strings for releases with dates
		expect(releases[0].versionSort).toBe('2025-12-19T00:00:00.000Z')
		expect(releases[1].versionSort).toBe('2025-12-17T00:00:00.000Z')

		// Earlier releases should have earlier versionSort
		expect(releases[0].versionSort > releases[1].versionSort).toBe(true)
	})

	it('generates correct sourceUrl', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		expect(releases[0].sourceUrl).toBe(
			'https://antigravity.google/changelog#1.13.3',
		)
		expect(releases[1].sourceUrl).toBe(
			'https://antigravity.google/changelog#1.12.4',
		)
	})

	it('returns empty array for empty/whitespace HTML', () => {
		expect(parseAntigravityChangelog('')).toEqual([])
		expect(parseAntigravityChangelog('   ')).toEqual([])
		expect(parseAntigravityChangelog('\n\t')).toEqual([])
	})

	it('returns empty array for HTML without grid-body', () => {
		const html = '<div><p>No changelog here</p></div>'
		expect(parseAntigravityChangelog(html)).toEqual([])
	})

	it('assigns correct order to changes within a release', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// Second release has 3 improvements + 1 patch = 4 changes
		const secondRelease = releases[1]
		expect(secondRelease.changes.length).toBe(4)

		// Check order is sequential
		for (let i = 0; i < secondRelease.changes.length; i++) {
			expect(secondRelease.changes[i].order).toBe(i)
		}
	})

	it('parses release with multiple change types correctly', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// Release 1.11.5 (Nano Banana Pro) has 1 improvement, 1 fix, 1 patch (now mapped to bugfix)
		const nanoBananaRelease = releases[5]
		expect(nanoBananaRelease.title).toBe('Nano Banana Pro')

		const improvements = nanoBananaRelease.changes.filter(
			(c) => c.type === 'IMPROVEMENT',
		)
		const bugfixes = nanoBananaRelease.changes.filter(
			(c) => c.type === 'BUGFIX',
		)

		expect(improvements).toHaveLength(1)
		// 2 bugfixes: 1 original fix + 1 patch (now mapped to BUGFIX)
		expect(bugfixes).toHaveLength(2)
		expect(nanoBananaRelease.changes).toHaveLength(3)
	})

	it('generates headline from summary text', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html)

		// Headlines should be present and reasonable
		expect(releases[0].headline).toBeDefined()
		expect(releases[0].headline.length).toBeGreaterThan(0)
		expect(releases[0].headline.length).toBeLessThanOrEqual(120)
	})

	it('uses custom baseUrl and startPath options', () => {
		const html = loadAntigravityChangelogFixture()
		const releases = parseAntigravityChangelog(html, {
			baseUrl: 'https://custom.example.com',
			startPath: '/releases',
		})

		expect(releases[0].sourceUrl).toBe(
			'https://custom.example.com/releases#1.13.3',
		)
	})
})
