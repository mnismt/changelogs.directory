import { expect, test } from "@playwright/test"
import { TOOL_SLUGS } from "@/lib/tool-registry"

test.describe("OG Image Endpoints", () => {
	test("GET /og returns PNG", async ({ request }) => {
		const response = await request.get("/og")
		expect(response.status()).toBe(200)
		expect(response.headers()["content-type"]).toContain("image/png")

		const body = await response.body()
		expect(body.length).toBeGreaterThan(1024)
	})

	test("GET /og/tools returns PNG", async ({ request }) => {
		// Increase timeout for this test as it does heavy image generation
		const response = await request.get("/og/tools", { timeout: 10000 })
		expect(response.status()).toBe(200)
		expect(response.headers()["content-type"]).toContain("image/png")
	})

	test.describe("Tool OG Images", () => {
		for (const slug of TOOL_SLUGS) {
			test(`GET /og/tools/${slug} returns PNG`, async ({ request }) => {
				const response = await request.get(`/og/tools/${slug}`)
				expect(response.status()).toBe(200)
				expect(response.headers()["content-type"]).toContain("image/png")
			})
		}
	})

	test("OG image meta tag on /tools page is valid", async ({
		page,
		request,
	}) => {
		await page.goto("/tools")

		const ogImageMeta = page.locator('meta[property="og:image"]')
		const ogImageUrl = await ogImageMeta.getAttribute("content")

		expect(ogImageUrl).toBeTruthy()

		const response = await request.get(ogImageUrl!)
		expect(response.status()).toBe(200)
		expect(response.headers()["content-type"]).toContain("image/png")
	})
})
