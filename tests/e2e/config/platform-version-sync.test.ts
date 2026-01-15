import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { parsePlatformChangelog } from "@/lib/parsers/platform-changelog";

describe("Platform Version Sync", () => {
	const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
	let changelog: ReturnType<typeof parsePlatformChangelog>;

	beforeAll(() => {
		try {
			const content = fs.readFileSync(changelogPath, "utf-8");
			changelog = parsePlatformChangelog(content);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to read or parse CHANGELOG.md at ${changelogPath}: ${message}`,
			);
		}
	});

	it("should have a valid latest version", () => {
		expect(changelog.latestVersion).toBeDefined();
		// Simple semver regex check: vX.Y.Z or X.Y.Z
		expect(changelog.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it("should have at least one release", () => {
		expect(changelog.releases.length).toBeGreaterThan(0);
	});

	it("latest version should match the first release version", () => {
		expect(changelog.latestVersion).toBe(changelog.releases[0].version);
	});
});
