import { expect, test } from "@playwright/test"

test.describe("OG Image Visuals", () => {
	// 1. Static Pages
	test("Homepage OG renders correctly", async ({ request }) => {
		const response = await request.get("/og")
		expect(response.status()).toBe(200)
		expect(await response.body()).toMatchSnapshot("home.png")
	})

	test("Tools Index OG renders correctly", async ({ request }) => {
		const response = await request.get("/og/tools")
		expect(response.status()).toBe(200)
		expect(await response.body()).toMatchSnapshot("tools-index.png")
	})

	// 2. Tool Pages - Test ALL tools
	const tools = [
		"claude-code",
		"codex",
		"cursor",
		"windsurf",
		"opencode",
		"antigravity",
		"gemini-cli",
	]

	for (const slug of tools) {
		test(`${slug} tool card renders correctly`, async ({ request }) => {
			const response = await request.get(`/og/tools/${slug}`)
			expect(response.status()).toBe(200)
			expect(await response.body()).toMatchSnapshot(`tool-${slug}.png`)
		})
	}

	// 3. Dynamic Release Page
	test("Release detail card renders correctly", async ({ request }) => {
		const toolSlug = "cursor"
		// Using a version from the e2e-db.snapshot.json.gz
		const version = "cursor-2-3"
		
		const response = await request.get(`/og/tools/${toolSlug}/releases/${version}`)
		
		// If 404, fail explicitly so we know to update the version
		expect(response.status(), `Release ${version} should exist`).toBe(200)
		expect(await response.body()).toMatchSnapshot(`release-${toolSlug}-${version}.png`)
	})
})
