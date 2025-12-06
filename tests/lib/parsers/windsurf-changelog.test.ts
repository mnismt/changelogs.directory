import { describe, expect, it } from 'vitest'
import { parseWindsurfChangelog } from '@/lib/parsers/windsurf-changelog'
import { loadWindsurfChangelogFixture } from 'tests/helpers/fixtures'

describe('parseWindsurfChangelog', () => {
	it('parses multiple releases with dates and anchors', () => {
		const html = loadWindsurfChangelogFixture()
		const releases = parseWindsurfChangelog(html)

		expect(releases).toHaveLength(2)

		const latest = releases[0]
		expect(latest.version).toBe('windsurf-1.12.39')
		expect(latest.releaseDate?.toISOString()).toBe('2025-12-04T00:00:00.000Z')
		expect(latest.sourceUrl).toBe('https://windsurf.com/changelog#1.12.39')
		expect(latest.rawContent).toContain('GPT-5.1-Codex Max')
		expect(latest.changes[0].title).toBe('What changed')
		expect(latest.changes[0].description).toContain(
			'New Codex model tiers with free low tier promo.',
		)
		expect(latest.contentHash).toBeDefined()

		const previous = releases[1]
		expect(previous.version).toBe('windsurf-1.12.37')
		expect(previous.releaseDate?.toISOString()).toBe('2025-12-02T00:00:00.000Z')
		expect(previous.changes).toHaveLength(1)
		expect(previous.changes[0].title).toBe('Patch Fixes and Improvements')
		expect(previous.changes[0].description).toContain(
			'General bug fixes and improvements.',
		)
	})

	it('returns empty array when HTML is missing', () => {
		expect(parseWindsurfChangelog('')).toEqual([])
		expect(parseWindsurfChangelog('   ')).toEqual([])
	})

	it('handles single-heading releases without subheadings', () => {
		const html = `
			<div id="1.12.36" class="relative flex scroll-mt-10 flex-col">
				<div class="prose w-full max-w-none">
					<h1 id="claude-opus-45">Claude Opus 4.5</h1>
					<p>You can now use Claude Opus 4.5 in Windsurf!</p>
					<p>
						Opus 4.5 is the most capable model in Windsurf yet and is now available
						at Sonnet pricing for a limited time (2x credits compared to 20x for Opus 4.1).
					</p>
					<p>This model is available to all paid Windsurf subscribers.</p>
				</div>
			</div>
		`

		const releases = parseWindsurfChangelog(html, {
			baseUrl: 'https://windsurf.com',
			startPath: '/changelog',
		})

		expect(releases).toHaveLength(1)
		const change = releases[0].changes[0]
		expect(change.title).toBe('Claude Opus 4.5')
		expect(change.description).toContain('You can now use Claude Opus 4.5')
		expect(change.description).toContain(
			'Opus 4.5 is the most capable model in Windsurf yet',
		)
		expect(change.description).toContain('This model is available')
		// Ensure paragraph breaks are preserved
		expect(change.description).toContain('\n\nOpus 4.5 is the most capable model')
	})
})
