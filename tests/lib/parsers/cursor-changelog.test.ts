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
		expect(previous.changes[0].title).toBe(
			'Instant results for agent grep commands.',
		)
	})

	it('parses non-version slugs like enterprise-dec-2025', () => {
		const html = `
			<main id="main" class="section section--longform">
				<div class="container">
					<article>
						<h1><a href="/changelog/enterprise-dec-2025">Enterprise Insights, Billing Groups, Service Accounts</a></h1>
						<p><time datetime="2025-12-18T00:00:00Z">Dec 18, 2025</time></p>
						<div class="prose">
							<h3>Conversation insights</h3>
							<p>Cursor can now analyze the code and context in each agent session.</p>
							<h3>Billing groups</h3>
							<p>Cursor now supports billing groups for fine-grained visibility.</p>
						</div>
					</article>
					<article>
						<h1><a href="/changelog/2-2">Debug Mode and Plan Mode Improvements</a></h1>
						<p><time datetime="2025-12-10T00:00:00Z">Dec 10, 2025</time></p>
						<div class="prose">
							<h3>Debug Mode</h3>
							<p>Debug Mode helps you reproduce and fix the most tricky bugs.</p>
						</div>
					</article>
				</div>
			</main>
		`

		const releases = parseCursorChangelog(html)
		expect(releases).toHaveLength(2)

		const enterprise = releases[0]
		expect(enterprise.version).toBe('cursor-enterprise-dec-2025')
		expect(enterprise.releaseDate?.toISOString()).toBe(
			'2025-12-18T00:00:00.000Z',
		)
		expect(enterprise.changes).toHaveLength(2)
		expect(enterprise.changes[0].title).toBe('Conversation insights')
		expect(enterprise.changes[1].title).toBe('Billing groups')

		const version22 = releases[1]
		expect(version22.version).toBe('cursor-2-2')
		expect(version22.changes[0].title).toBe('Debug Mode')
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
		expect(releases[0].changes[0].title).toContain(
			'Minor stability improvements',
		)
	})

	describe('slug validation', () => {
		it.each([
			['2-2', 'cursor-2-2'],
			['1-7', 'cursor-1-7'],
			['0-25-0-nightly', 'cursor-0-25-0-nightly'],
			['enterprise-dec-2025', 'cursor-enterprise-dec-2025'],
			['claude-support', 'cursor-claude-support'],
			['ai-review', 'cursor-ai-review'],
			['v1', 'cursor-v1'],
		])('accepts valid slug "%s" -> version "%s"', (slug, expectedVersion) => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/${slug}">Release ${slug}</a></h1>
						<div class="prose"><p>Content</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].version).toBe(expectedVersion)
		})

		it('rejects slugs with parentheses like UI elements', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/Patches (11)">Invalid Release</a></h1>
						<div class="prose"><p>Content</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(0)
		})

		it('handles anchor fragments by extracting the path segment', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-5#conversation-insights">Release with Anchor</a></h1>
						<div class="prose"><p>Content</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].version).toBe('cursor-2-5')
		})
	})

	describe('HTML format variations', () => {
		it('extracts title from h1 tag (new format)', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-3">New H1 Format Title</a></h1>
						<time datetime="2025-12-20T00:00:00Z">Dec 20, 2025</time>
						<div class="prose"><p>Content here</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].title).toBe('New H1 Format Title')
			expect(releases[0].version).toBe('cursor-2-3')
		})

		it('extracts title from h2 tag (old format)', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h2><a href="/changelog/1-9">Old H2 Format Title</a></h2>
						<time datetime="2025-10-15T00:00:00Z">Oct 15, 2025</time>
						<div class="prose"><p>Content here</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].title).toBe('Old H2 Format Title')
			expect(releases[0].version).toBe('cursor-1-9')
		})

		it('does not extract permalink from h3 tag (only h1/h2 supported)', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h3><a href="/changelog/1-0">Fallback H3 Title</a></h3>
						<time datetime="2025-09-01T00:00:00Z">Sep 1, 2025</time>
						<div class="prose"><p>Content here</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(0)
		})

		it('handles mixed h1 and h2 formats in same page', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/3-0">Newer Release with H1</a></h1>
						<time datetime="2025-12-25T00:00:00Z">Dec 25, 2025</time>
						<div class="prose"><p>New content</p></div>
					</article>
					<article>
						<h2><a href="/changelog/2-9">Older Release with H2</a></h2>
						<time datetime="2025-12-20T00:00:00Z">Dec 20, 2025</time>
						<div class="prose"><p>Old content</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(2)
			expect(releases[0].title).toBe('Newer Release with H1')
			expect(releases[0].version).toBe('cursor-3-0')
			expect(releases[1].title).toBe('Older Release with H2')
			expect(releases[1].version).toBe('cursor-2-9')
		})
	})

	describe('duplicate article prevention', () => {
		it('only matches articles within main tag, not hidden hydration divs', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-5">Real Release</a></h1>
						<time datetime="2025-12-22T00:00:00Z">Dec 22, 2025</time>
						<div class="prose"><p>Real content</p></div>
					</article>
				</main>
				<!-- React hydration div that mirrors content -->
				<div hidden id="S:4">
					<article>
						<h1><a href="/changelog/2-5">Real Release</a></h1>
						<time datetime="2025-12-22T00:00:00Z">Dec 22, 2025</time>
						<div class="prose"><p>Real content</p></div>
					</article>
				</div>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].version).toBe('cursor-2-5')
		})

		it('ignores articles in non-main elements with similar classes', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-6">Main Content Release</a></h1>
						<time datetime="2025-12-23T00:00:00Z">Dec 23, 2025</time>
						<div class="prose"><p>Main content</p></div>
					</article>
				</main>
				<div id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-6">Duplicate in Div</a></h1>
						<div class="prose"><p>Duplicate content</p></div>
					</article>
				</div>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].title).toBe('Main Content Release')
		})
	})

	describe('edge cases', () => {
		it('cleans arrow icons from accordion button text', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-3">Bug Fixes</a></h1>
						<div class="prose">
							<h3>Stability (7)↓↑</h3>
							<p>Various stability improvements.</p>
							<h3>Agents (15)↓↑</h3>
							<p>Agent-related fixes.</p>
						</div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases[0].changes[0].title).toBe('Stability (7)')
			expect(releases[0].changes[1].title).toBe('Agents (15)')
		})

		it('returns empty array for empty HTML', () => {
			expect(parseCursorChangelog('')).toHaveLength(0)
			expect(parseCursorChangelog('   ')).toHaveLength(0)
		})

		it('returns empty array when no articles found', () => {
			const html = `
				<main id="main" class="section section--longform">
					<div class="container">
						<p>No articles here</p>
					</div>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(0)
		})

		it('skips articles without valid permalink', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1>Title Without Link</h1>
						<div class="prose"><p>No permalink</p></div>
					</article>
					<article>
						<h1><a href="/changelog/valid-release">Valid Release</a></h1>
						<div class="prose"><p>Has permalink</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].version).toBe('cursor-valid-release')
		})

		it('handles articles with only list items (no headings)', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/1-8">Patch Release</a></h1>
						<time datetime="2025-11-05T00:00:00Z">Nov 5, 2025</time>
						<div class="prose">
							<ul>
								<li>Fixed a memory leak in the agent runtime</li>
								<li>Improved startup performance</li>
								<li>Updated dependencies</li>
							</ul>
						</div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].changes).toHaveLength(3)
			expect(releases[0].changes[0].title).toBe(
				'Fixed a memory leak in the agent runtime',
			)
			expect(releases[0].changes[1].title).toBe('Improved startup performance')
			expect(releases[0].changes[2].title).toBe('Updated dependencies')
		})

		it('normalizes relative URLs to absolute', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-4">Media Test</a></h1>
						<div class="prose">
							<h3>Feature with Image</h3>
							<figure>
								<img src="/images/feature.png" alt="Feature screenshot" />
							</figure>
						</div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].rawContent).toContain(
				'src="https://cursor.com/images/feature.png"',
			)
			expect(releases[0].changes[0].media?.[0].url).toBe(
				'https://cursor.com/images/feature.png',
			)
		})

		it('generates correct sourceUrl from permalink', () => {
			const html = `
				<main id="main" class="section section--longform">
					<article>
						<h1><a href="/changelog/2-7">Source URL Test</a></h1>
						<div class="prose"><p>Content</p></div>
					</article>
				</main>
			`
			const releases = parseCursorChangelog(html)
			expect(releases).toHaveLength(1)
			expect(releases[0].sourceUrl).toBe('https://cursor.com/changelog/2-7')
		})
	})
})

