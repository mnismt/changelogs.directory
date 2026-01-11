import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TOOL_SLUGS } from "@/lib/tool-registry";

/**
 * Validates that prisma/seed.ts stays in sync with TOOL_REGISTRY.
 * This prevents tools from being added to one place but not the other.
 */
describe("Database Sync Validation", () => {
	const seedPath = resolve(process.cwd(), "prisma/seed.ts");
	const seedContent = readFileSync(seedPath, "utf-8");

	// Extract all slugs from seed.ts using the pattern: where: { slug: "tool-name" }
	const slugPattern = /where:\s*{\s*slug:\s*["']([a-z0-9-]+)["']\s*}/g;
	const seedSlugs: string[] = [];
	let match: RegExpExecArray | null;
	while ((match = slugPattern.exec(seedContent)) !== null) {
		seedSlugs.push(match[1]);
	}

	// Count prisma.tool.upsert calls
	const upsertPattern = /prisma\.tool\.upsert\(/g;
	const upsertCount = (seedContent.match(upsertPattern) || []).length;

	it("should extract slugs from seed.ts", () => {
		expect(seedSlugs.length).toBeGreaterThan(0);
		expect(seedSlugs).toContain("claude-code");
	});

	it("should have every TOOL_REGISTRY slug in seed.ts", () => {
		const missingSlugs = TOOL_SLUGS.filter((slug) => !seedSlugs.includes(slug));
		expect(missingSlugs, `Missing from seed.ts: ${missingSlugs.join(", ")}`).toEqual([]);
	});

	it("should have every seed.ts slug in TOOL_REGISTRY", () => {
		const extraSlugs = seedSlugs.filter((slug) => !TOOL_SLUGS.includes(slug));
		expect(extraSlugs, `Extra in seed.ts: ${extraSlugs.join(", ")}`).toEqual([]);
	});

	it("should have matching tool counts", () => {
		expect(upsertCount, "Upsert count should match registry count").toBe(TOOL_SLUGS.length);
		expect(seedSlugs.length, "Seed slugs count should match registry count").toBe(TOOL_SLUGS.length);
	});

	it("should have valid slug format for all slugs", () => {
		const validSlugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

		for (const slug of TOOL_SLUGS) {
			expect(slug, `Invalid registry slug format: ${slug}`).toMatch(validSlugPattern);
		}

		for (const slug of seedSlugs) {
			expect(slug, `Invalid seed slug format: ${slug}`).toMatch(validSlugPattern);
		}
	});

	it("should have exactly 7 tools", () => {
		const expectedTools = ["claude-code", "codex", "cursor", "windsurf", "opencode", "antigravity", "gemini-cli"];
		expect(TOOL_SLUGS.sort()).toEqual(expectedTools.sort());
		expect(seedSlugs.sort()).toEqual(expectedTools.sort());
	});
});
