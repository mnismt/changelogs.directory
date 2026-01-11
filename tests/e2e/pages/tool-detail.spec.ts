import { expect, test } from "@playwright/test";
import { TOOL_SLUGS } from "@/lib/tool-registry";

// Test only seeded tools
const TOOLS_TO_TEST = ["codex", "cursor"];

test.describe("Tool Detail Page", () => {
	for (const slug of TOOLS_TO_TEST) {
		test(`tool page loads for ${slug}`, async ({ page }) => {
			await page.goto(`/tools/${slug}`);

			const heading = page.locator("h1");
			await expect(heading).toBeVisible();

			const logo = page.locator('[data-testid="tool-logo"]');
			await expect(logo).toBeVisible();
		});

		test(`has og:image meta tag for ${slug}`, async ({ page }) => {
			await page.goto(`/tools/${slug}`);

			const ogImage = page.locator('meta[property="og:image"]');
			await expect(ogImage).toHaveCount(1);

			const content = await ogImage.getAttribute("content");
			expect(content).toContain(`/og/tools/${slug}`);
		});
	}

	test("pagination and infinite scroll works for codex", async ({ page }) => {
		// Use codex as we know it has 60 releases in the snapshot
		await page.goto("/tools/codex");

		const releaseCards = page.locator('[data-testid="release-card"]');
		
		// Initial load should be 20
		await expect(releaseCards).toHaveCount(20);

		// Scroll to bottom
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Wait for more to load (should be > 20)
		await expect(releaseCards).not.toHaveCount(20, { timeout: 10000 });
		const count = await releaseCards.count();
		expect(count).toBeGreaterThan(20);
	});

	test("navigate to release detail", async ({ page }) => {
		const slug = "codex";
		await page.goto(`/tools/${slug}`);

		const releaseLink = page
			.getByRole("link", { name: /Version .* released/i })
			.first();
		await expect(releaseLink).toBeVisible();

		await releaseLink.click();

		await expect(page).toHaveURL(/\/tools\/.*\/releases\/.*/);
	});
});
