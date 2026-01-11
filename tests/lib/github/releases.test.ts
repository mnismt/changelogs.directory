import { beforeEach, describe, expect, it, vi } from "vitest"
import { fetchGitHubReleases } from "@/lib/github/releases"
import type { GitHubRelease } from "@/lib/parsers/github-releases"
import * as cacheModule from "@/lib/github/cache"

vi.mock("@/lib/github/cache", () => ({
	getCachedReleases: vi.fn(),
	setCachedReleases: vi.fn(),
}))

vi.mock("@trigger.dev/sdk", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
	},
}))

describe("fetchGitHubReleases", () => {
	const releases: GitHubRelease[] = [
		{
			tag_name: "v1.0.0",
			name: "v1.0.0",
			body: "Initial release",
			prerelease: false,
			draft: false,
			published_at: "2025-01-01T00:00:00Z",
			html_url: "https://github.com/octo/repo/releases/tag/v1.0.0",
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()
		global.fetch = vi.fn()
	})

	it("skips cache lookup when bypassCache is true", async () => {
		const mockResponse = {
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue(releases),
			headers: new Headers({
				etag: "W/\"fresh-etag\"",
			}),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await fetchGitHubReleases(
			"https://github.com/octo/repo",
			"token",
			{
				bypassCache: true,
				includeDrafts: true,
				includePreReleases: true,
			},
		)

		expect(result).toEqual(releases)
		expect(cacheModule.getCachedReleases).not.toHaveBeenCalled()
		expect(cacheModule.setCachedReleases).toHaveBeenCalledWith(
			"octo",
			"repo",
			releases,
			"W/\"fresh-etag\"",
		)

		const [, options] = vi.mocked(global.fetch).mock.calls[0]
		expect((options?.headers as Record<string, string>)?.["If-None-Match"]).toBeUndefined()
	})

	it("returns cached releases on 304 responses", async () => {
		vi.mocked(cacheModule.getCachedReleases).mockResolvedValue({
			releases,
			etag: "W/\"cached-etag\"",
		})

		const mockResponse = {
			status: 304,
			headers: new Headers(),
		}

		vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

		const result = await fetchGitHubReleases("https://github.com/octo/repo", "token", {
			includeDrafts: true,
			includePreReleases: true,
		})

		expect(result).toEqual(releases)
		expect(cacheModule.setCachedReleases).not.toHaveBeenCalled()

		const [, options] = vi.mocked(global.fetch).mock.calls[0]
		expect((options?.headers as Record<string, string>)?.["If-None-Match"]).toBe(
			"W/\"cached-etag\"",
		)
	})
})
