import { describe, expect, it } from 'vitest'
import {
	dedupeReleases,
	formatPeriodLabel,
	generateTestPeriod,
	getISOWeek,
	type DigestRelease,
} from '@/trigger/digest/shared'

describe('getISOWeek', () => {
	it('should return correct ISO week for Jan 17, 2026 (Saturday)', () => {
		// Jan 17, 2026 is a Saturday in week 3
		expect(getISOWeek(new Date('2026-01-17'))).toBe('2026-W03')
	})

	it('should return correct ISO week for Jan 1, 2026 (Thursday)', () => {
		// Jan 1, 2026 is a Thursday in week 1
		expect(getISOWeek(new Date('2026-01-01'))).toBe('2026-W01')
	})

	it('should handle year boundary - Dec 31, 2025', () => {
		// Dec 31, 2025 is a Wednesday - still in week 1 of 2026 per ISO 8601
		expect(getISOWeek(new Date('2025-12-31'))).toBe('2026-W01')
	})

	it('should handle Dec 28, 2025 (last week of 2025)', () => {
		// Dec 28, 2025 is a Sunday - should be week 52 of 2025
		expect(getISOWeek(new Date('2025-12-28'))).toBe('2025-W52')
	})

	it('should return correct ISO week for Monday', () => {
		// Jan 12, 2026 is a Monday - week 3
		expect(getISOWeek(new Date('2026-01-12'))).toBe('2026-W03')
	})
})

describe('dedupeReleases', () => {
	const createRelease = (
		toolSlug: string,
		version: string,
	): DigestRelease => ({
		toolName: toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1),
		toolSlug,
		toolLogo: `https://changelogs.directory/images/logos/${toolSlug}.png`,
		vendor: 'Test Vendor',
		version,
		releaseDate: 'Jan 15, 2026',
		headline: 'Test release',
		changeCount: 5,
		features: 2,
		bugfixes: 2,
		improvements: 1,
		breaking: 0,
	})

	it('should keep only the first (latest) release per tool', () => {
		const releases = [
			createRelease('cursor', '0.46'),
			createRelease('cursor', '0.45'), // Should be removed
			createRelease('claude-code', '1.0'),
		]
		const result = dedupeReleases(releases)

		expect(result).toHaveLength(2)
		expect(result.find((r) => r.toolSlug === 'cursor')?.version).toBe('0.46')
		expect(result.find((r) => r.toolSlug === 'claude-code')?.version).toBe(
			'1.0',
		)
	})

	it('should return empty array for empty input', () => {
		expect(dedupeReleases([])).toEqual([])
	})

	it('should preserve order of first occurrence', () => {
		const releases = [
			createRelease('cursor', '0.46'),
			createRelease('vscode', '1.97'),
			createRelease('cursor', '0.45'),
			createRelease('claude-code', '1.0'),
			createRelease('vscode', '1.96'),
		]
		const result = dedupeReleases(releases)

		expect(result).toHaveLength(3)
		expect(result[0].toolSlug).toBe('cursor')
		expect(result[1].toolSlug).toBe('vscode')
		expect(result[2].toolSlug).toBe('claude-code')
	})

	it('should handle single release per tool', () => {
		const releases = [
			createRelease('cursor', '0.46'),
			createRelease('claude-code', '1.0'),
			createRelease('vscode', '1.97'),
		]
		const result = dedupeReleases(releases)

		expect(result).toHaveLength(3)
	})
})

describe('formatPeriodLabel', () => {
	it('should format date range correctly within same year', () => {
		const start = new Date('2026-01-10')
		const end = new Date('2026-01-17')
		expect(formatPeriodLabel(start, end)).toBe('Jan 10 - Jan 17, 2026')
	})

	it('should format date range correctly across months', () => {
		const start = new Date('2026-01-28')
		const end = new Date('2026-02-04')
		expect(formatPeriodLabel(start, end)).toBe('Jan 28 - Feb 4, 2026')
	})

	it('should format date range correctly across years', () => {
		const start = new Date('2025-12-28')
		const end = new Date('2026-01-04')
		expect(formatPeriodLabel(start, end)).toBe('Dec 28 - Jan 4, 2026')
	})
})

describe('generateTestPeriod', () => {
	it('should generate unique period strings', () => {
		const p1 = generateTestPeriod()
		const p2 = generateTestPeriod()
		expect(p1).not.toBe(p2)
	})

	it('should start with TEST- prefix', () => {
		const period = generateTestPeriod()
		expect(period).toMatch(/^TEST-/)
	})

	it('should contain timestamp and random string', () => {
		const period = generateTestPeriod()
		// Format: TEST-{timestamp}-{random}
		expect(period).toMatch(/^TEST-\d+-[a-z0-9]+$/)
	})
})
