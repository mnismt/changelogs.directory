import { describe, expect, it } from 'vitest'
import { parseCursorChangelog } from '@/lib/parsers/cursor-changelog'
import { loadCursorChangelogFixture } from 'tests/helpers/fixtures'

describe('parseCursorChangelog', () => {
	it('parses multiple releases and preserves media content', () => {
		const html = loadCursorChangelogFixture()
		const releases = parseCursorChangelog(html)

		expect(releases).toHaveLength(2)

		const latest = releases[0]
		expect(latest.version).toBe('cursor-2-1')
		expect(latest.releaseDate?.toISOString()).toBe('2025-11-21T10:00:00.000Z')
		expect(latest.changes).toHaveLength(2)
		expect(latest.changes[0].title).toBe('Plan Mode')
		expect(latest.changes[0].description).toContain(
			'https://cursor.com/images/plan.png',
		)
		expect(latest.rawContent).toContain(
			'src="https://cursor.com/images/plan.png"',
		)
		expect(latest.summary).toContain('clarifying questions inline')

		const previous = releases[1]
		expect(previous.version).toBe('cursor-2-0')
		expect(previous.changes).toHaveLength(2)
		expect(previous.changes[0].title).toBe('Instant results for agent grep commands.')
	})

	it('falls back to single change when no headings or lists exist', () => {
		const html = `
			<main id="main" class="section section--longform">
				<div class="container">
					<article>
						<h2><a href="/changelog/1-5">Minor Updates</a></h2>
						<p><a href="/changelog/1-5"><time datetime="2025-10-01T00:00:00Z">Oct 1, 2025</time></a></p>
						<div class="prose">
							<p>Minor stability improvements across the agent runtime.</p>
						</div>
					</article>
				</div>
			</main>
		`

		const releases = parseCursorChangelog(html)
		expect(releases).toHaveLength(1)
		expect(releases[0].version).toBe('cursor-1-5')
		expect(releases[0].changes).toHaveLength(1)
		expect(releases[0].changes[0].title).toContain('Minor stability improvements')
	})
})

