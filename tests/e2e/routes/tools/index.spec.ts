import { expect, test } from "@playwright/test";
import { TOOL_SLUGS } from "@/lib/tool-registry";

test.describe("Tools Directory Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/tools");
	});

	test("page loads with heading and stats", async ({ page }) => {
		await expect(page.getByRole("heading", { name: /tools/i })).toBeVisible();
		await expect(page.getByText("Total Tools")).toBeVisible();
		await expect(page.getByText("Total Releases")).toBeVisible();
	});

	test("all tool cards are displayed", async ({ page }) => {
		const toolCards = page.locator('[data-testid="tool-card"]');
		// E2E snapshot now includes all registered tools
		await expect(toolCards).toHaveCount(TOOL_SLUGS.length);
	});

	test("tool cards render correctly with logos", async ({ page }) => {
		// Test a representative sample of tools for rendering
		const sampleSlugs = TOOL_SLUGS.slice(0, 3);

		for (const slug of sampleSlugs) {
			const card = page.locator(`[data-testid="tool-card-${slug}"]`);
			await expect(card).toBeVisible();

			const logo = card.locator("img").first();
			await expect(logo).toBeVisible();
		}
	});

	test("background image appears on hover", async ({ page }) => {
		const firstSlug = TOOL_SLUGS[0];
		const card = page.locator(`[data-testid="tool-card-${firstSlug}"]`);

		await card.hover();

		const backgroundImage = page.locator(
			`[data-testid="tool-card-bg-${firstSlug}"]`,
		);
		await expect(backgroundImage).toBeVisible();
	});

	test("clicking a tool card navigates to tool detail page", async ({
		page,
	}) => {
		const firstSlug = TOOL_SLUGS[0];
		const cardLink = page.locator(`a[href="/tools/${firstSlug}"]`);

		await cardLink.click();

		// Match path only so this can be removed if default query param goes away.
		await expect(page).toHaveURL(new RegExp(`/tools/${firstSlug}(\\?.*)?$`));
	});

	test("page has correct OG meta tags", async ({ page }) => {
		const ogImage = page.locator('meta[property="og:image"]');
		await expect(ogImage).toHaveAttribute("content", /\/og\/tools/);
	});
});
