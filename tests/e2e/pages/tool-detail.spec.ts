import { expect, test } from "@playwright/test";
import { TOOL_SLUGS } from "@/lib/tool-registry";

// Test first 2 tools to keep test time reasonable
const TOOLS_TO_TEST = TOOL_SLUGS.slice(0, 2);

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

	test("navigate to release detail", async ({ page }) => {
		const slug = TOOLS_TO_TEST[0];
		await page.goto(`/tools/${slug}`);

		const releaseLink = page
			.getByRole("link", { name: /Version .* released/i })
			.first();
		await expect(releaseLink).toBeVisible();

		await releaseLink.click();

		await expect(page).toHaveURL(/\/tools\/.*\/releases\/.*/);
	});
});
