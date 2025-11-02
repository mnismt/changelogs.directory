import { describe, expect, it } from 'vitest'
import { parseStep } from '@/trigger/ingest/claude-code/steps/parse'
import { loadChangelogFixture } from 'tests/helpers/fixtures'
import type { FetchResult } from '@/trigger/ingest/claude-code/types'

describe('parseStep', () => {
	it('should convert markdown to ParsedRelease array', () => {
		const markdown = `## 2.0.31
- Feature one
- Feature two

## 2.0.30
- Bug fix
`

		const fetchResult: FetchResult = {
			markdown,
			etag: null,
		}

		const result = parseStep(fetchResult)

		expect(result.releases).toHaveLength(2)
		expect(result.releases[0].version).toBe('2.0.31')
		expect(result.releases[1].version).toBe('2.0.30')
	})

	it('should preserve change order', () => {
		const markdown = `## 2.0.31
- First change
- Second change
- Third change
`

		const fetchResult: FetchResult = {
			markdown,
			etag: null,
		}

		const result = parseStep(fetchResult)

		expect(result.releases[0].changes[0].order).toBe(0)
		expect(result.releases[0].changes[1].order).toBe(1)
		expect(result.releases[0].changes[2].order).toBe(2)
	})

	it('should compute contentHash correctly', () => {
		const markdown = `## 2.0.31
- Change one
`

		const fetchResult: FetchResult = {
			markdown,
			etag: null,
		}

		const result = parseStep(fetchResult)

		expect(result.releases[0].contentHash).toBeTruthy()
		expect(typeof result.releases[0].contentHash).toBe('string')
		expect(result.releases[0].contentHash.length).toBe(64) // SHA256 hex length
	})

	it('should parse real changelog fixture', () => {
		const markdown = loadChangelogFixture()

		const fetchResult: FetchResult = {
			markdown,
			etag: 'W/"test-etag"',
		}

		const result = parseStep(fetchResult)

		expect(result.releases.length).toBeGreaterThan(0)
		expect(result.releases[0].version).toBe('2.0.31')
		expect(result.releases[0].changes.length).toBeGreaterThan(0)
		expect(result.releases[0].contentHash).toBeTruthy()
	})

	it('should handle empty markdown', () => {
		const fetchResult: FetchResult = {
			markdown: '',
			etag: null,
		}

		const result = parseStep(fetchResult)

		expect(result.releases).toHaveLength(0)
	})

	it('should handle markdown with no versions', () => {
		const fetchResult: FetchResult = {
			markdown: '# Changelog\n\nNo releases yet.',
			etag: null,
		}

		const result = parseStep(fetchResult)

		expect(result.releases).toHaveLength(0)
	})
})

