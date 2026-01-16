import { describe, expect, it } from "vitest"
import {
	dedupeReleases,
	formatPeriodLabel,
	generateTestPeriod,
	getISOWeek,
	type DigestRelease,
} from "@/trigger/digest/shared"

describe("getISOWeek", () => {
	it("returns correct ISO week for standard date", () => {
		// January 16, 2026 is a Friday in week 3
		expect(getISOWeek(new Date("2026-01-16T12:00:00Z"))).toBe("2026-W03")
	})

	it("returns week 01 for Jan 1 when it falls mid-week", () => {
		// Jan 1, 2026 is Thursday - still week 01 of 2026
		expect(getISOWeek(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01")
	})

	it("returns previous year week when Jan 1 belongs to week 52/53", () => {
		// Jan 1, 2023 is Sunday - belongs to week 52 of 2022
		expect(getISOWeek(new Date("2023-01-01T12:00:00Z"))).toBe("2022-W52")
	})

	it("handles week 53 edge case", () => {
		// Dec 31, 2020 is Thursday - week 53 of 2020
		expect(getISOWeek(new Date("2020-12-31T12:00:00Z"))).toBe("2020-W53")
	})

	it("handles year boundary at end of December", () => {
		// Dec 28, 2026 is Monday - week 53 of 2026
		const result = getISOWeek(new Date("2026-12-28T12:00:00Z"))
		expect(result).toMatch(/^202[67]-W(53|01)$/)
	})

	it("pads week number with leading zero", () => {
		// Week 1 should be W01, not W1
		expect(getISOWeek(new Date("2026-01-05T12:00:00Z"))).toMatch(/-W0[1-9]$/)
	})
})

describe("dedupeReleases", () => {
	const makeRelease = (toolSlug: string, version: string): DigestRelease => ({
		toolName: toolSlug,
		toolSlug,
		toolLogo: "",
		vendor: "Test",
		version,
		releaseDate: "2026-01-16",
		headline: `Release ${version}`,
		changeCount: 1,
		features: 1,
		bugfixes: 0,
		improvements: 0,
		breaking: 0,
	})

	it("keeps only the first release per tool", () => {
		const releases = [
			makeRelease("cursor", "2.0"),
			makeRelease("claude-code", "2.1"),
			makeRelease("cursor", "1.9"),
			makeRelease("cursor", "1.8"),
		]

		const result = dedupeReleases(releases)

		expect(result).toHaveLength(2)
		expect(result.find((r) => r.toolSlug === "cursor")?.version).toBe("2.0")
		expect(result.find((r) => r.toolSlug === "claude-code")?.version).toBe(
			"2.1",
		)
	})

	it("returns empty array for empty input", () => {
		expect(dedupeReleases([])).toEqual([])
	})

	it("returns all releases when each is from different tool", () => {
		const releases = [
			makeRelease("cursor", "1.0"),
			makeRelease("claude-code", "2.0"),
			makeRelease("windsurf", "3.0"),
		]

		const result = dedupeReleases(releases)

		expect(result).toHaveLength(3)
	})

	it("preserves order of first occurrence", () => {
		const releases = [
			makeRelease("a-tool", "1.0"),
			makeRelease("b-tool", "1.0"),
			makeRelease("a-tool", "0.9"),
		]

		const result = dedupeReleases(releases)

		expect(result[0].toolSlug).toBe("a-tool")
		expect(result[1].toolSlug).toBe("b-tool")
	})
})

describe("formatPeriodLabel", () => {
	it("formats date range within same month", () => {
		const start = new Date("2026-01-09T00:00:00Z")
		const end = new Date("2026-01-16T00:00:00Z")

		expect(formatPeriodLabel(start, end)).toBe("Jan 9 - Jan 16, 2026")
	})

	it("formats date range across months", () => {
		const start = new Date("2026-01-30T00:00:00Z")
		const end = new Date("2026-02-06T00:00:00Z")

		expect(formatPeriodLabel(start, end)).toBe("Jan 30 - Feb 6, 2026")
	})

	it("formats date range across years", () => {
		const start = new Date("2025-12-28T00:00:00Z")
		const end = new Date("2026-01-04T00:00:00Z")

		// Year should come from end date
		expect(formatPeriodLabel(start, end)).toBe("Dec 28 - Jan 4, 2026")
	})
})

describe("generateTestPeriod", () => {
	it("starts with TEST- prefix", () => {
		const period = generateTestPeriod()
		expect(period).toMatch(/^TEST-/)
	})

	it("contains timestamp", () => {
		const before = Date.now()
		const period = generateTestPeriod()
		const after = Date.now()

		// Extract timestamp from format: TEST-{timestamp}-{random}
		const parts = period.split("-")
		const timestamp = Number.parseInt(parts[1], 10)

		expect(timestamp).toBeGreaterThanOrEqual(before)
		expect(timestamp).toBeLessThanOrEqual(after)
	})

	it("generates unique values on consecutive calls", () => {
		const periods = new Set<string>()
		for (let i = 0; i < 100; i++) {
			periods.add(generateTestPeriod())
		}
		expect(periods.size).toBe(100)
	})

	it("has consistent format: TEST-{timestamp}-{random8chars}", () => {
		const period = generateTestPeriod()
		expect(period).toMatch(/^TEST-\d+-[a-z0-9]{1,8}$/)
	})
})
