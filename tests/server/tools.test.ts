import { describe, expect, it } from "vitest"
import { buildLatestReleasesWhereClause } from "@/server/tools"

describe("buildLatestReleasesWhereClause", () => {
	describe("includePrereleases parameter", () => {
		it("should filter out prereleases when includePrereleases is false", () => {
			const whereClause = buildLatestReleasesWhereClause({
				includePrereleases: false,
			})

			expect(whereClause.isPrerelease).toBe(false)
		})

		it("should include prereleases when includePrereleases is true", () => {
			const whereClause = buildLatestReleasesWhereClause({
				includePrereleases: true,
			})

			expect(whereClause.isPrerelease).toBeUndefined()
		})

		it("should combine prerelease filter with changeTypes filter", () => {
			const whereClause = buildLatestReleasesWhereClause({
				changeTypes: ["FEATURE", "BUGFIX"],
				includePrereleases: false,
			})

			expect(whereClause.isPrerelease).toBe(false)
			expect(whereClause.changes).toEqual({
				some: {
					type: { in: ["FEATURE", "BUGFIX"] },
				},
			})
		})

		it("should combine prerelease filter with toolSlugs filter", () => {
			const whereClause = buildLatestReleasesWhereClause({
				toolSlugs: ["claude-code", "cursor"],
				includePrereleases: false,
			})

			expect(whereClause.isPrerelease).toBe(false)
			expect(whereClause.tool).toEqual({
				slug: { in: ["claude-code", "cursor"] },
			})
		})

		it("should handle all filters combined", () => {
			const whereClause = buildLatestReleasesWhereClause({
				changeTypes: ["FEATURE"],
				toolSlugs: ["claude-code"],
				includePrereleases: false,
			})

			expect(whereClause.isPrerelease).toBe(false)
			expect(whereClause.changes).toEqual({
				some: {
					type: { in: ["FEATURE"] },
				},
			})
			expect(whereClause.tool).toEqual({
				slug: { in: ["claude-code"] },
			})
		})
	})
})
