import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateObject } from 'ai'
import { enrichReleaseWithLLM } from '@/lib/enrichment/llm'
import { createMockParsedRelease } from 'tests/helpers/fixtures'

vi.mock('@/lib/llm', () => ({
	llm: { provider: 'test-model' },
}))

vi.mock('ai', () => ({
	generateObject: vi.fn(),
}))

describe('enrichReleaseWithLLM', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('passes previous release context into the prompt', async () => {
		const release = createMockParsedRelease({
			version: '2.0.50',
			rawContent: '## 2.0.50\n- Added ctrl-y undo\n- Fixed crash',
		})
		vi.mocked(generateObject).mockResolvedValue({
			object: {
				headline: 'Short headline',
				summary: 'Short summary.',
				keyHighlights: [],
				changes: release.changes.map((change) => ({
					order: change.order,
					type: change.type,
					impact: change.impact ?? 'PATCH',
					isBreaking: change.isBreaking,
					isSecurity: change.isSecurity,
					isDeprecation: change.isDeprecation,
				})),
			},
		} as any)

		await enrichReleaseWithLLM(release, {
			previousRelease: {
				version: '2.0.49',
				headline: 'Ctrl-Y undo shortcut',
				summary: 'Added readline-style ctrl-y to paste deleted text.',
			},
		})

		const prompt = vi.mocked(generateObject).mock.calls[0][0]?.prompt
		expect(prompt).toContain(
			'Previous Version Context: Version 2.0.49: Ctrl-Y undo shortcut — Added readline-style ctrl-y to paste deleted text.',
		)
	})

	it('includes tone rules and examples in the prompt', async () => {
		const release = createMockParsedRelease({
			version: '0.55.0',
			rawContent: '## 0.55.0\n- Fix Linux startup',
		})
		vi.mocked(generateObject).mockResolvedValue({
			object: {
				headline: 'Linux startup fixed',
				summary: 'Fixes Linux startup issues.',
				keyHighlights: [],
				changes: release.changes.map((change) => ({
					order: change.order,
					type: change.type,
					impact: change.impact ?? 'PATCH',
					isBreaking: change.isBreaking,
					isSecurity: change.isSecurity,
					isDeprecation: change.isDeprecation,
				})),
			},
		} as any)

		await enrichReleaseWithLLM(release)

		const prompt = vi.mocked(generateObject).mock.calls[0][0]?.prompt
		expect(prompt).toContain('Max 1 short headline (<=120 characters)')
		expect(prompt).toContain('Bad headline: "This release introduces several improvements')
		expect(prompt).toContain('Good summary: "Adds Ctrl-Y to restore deleted text')
	})

	it('applies headline and preserves change order based on classification order field', async () => {
		const baseChange = createMockParsedRelease().changes[0]
		const release = createMockParsedRelease({
			changes: [
				{
					...baseChange,
					order: 0,
					title: 'First change',
				},
				{
					...baseChange,
					order: 1,
					title: 'Second change',
				},
			],
		})
		vi.mocked(generateObject).mockResolvedValue({
			object: {
				headline: 'Short card line',
				summary: 'A concise summary.',
				keyHighlights: [],
				changes: [
					{
						order: 1,
						type: 'BUGFIX',
						impact: 'PATCH',
						isBreaking: false,
						isSecurity: false,
						isDeprecation: false,
					},
					{
						order: 0,
						type: 'FEATURE',
						impact: 'MINOR',
						isBreaking: false,
						isSecurity: false,
						isDeprecation: false,
					},
				],
			},
		} as any)

		const enriched = await enrichReleaseWithLLM(release)

		expect(enriched.headline).toBe('Short card line')
		expect(enriched.summary).toBe('A concise summary.')
		expect(enriched.changes[0].order).toBe(0)
		expect(enriched.changes[0].type).toBe('FEATURE')
		expect(enriched.changes[1].order).toBe(1)
		expect(enriched.changes[1].type).toBe('BUGFIX')
	})
})

