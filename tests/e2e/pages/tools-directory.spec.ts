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
		// We only seed 2 tools in the E2E snapshot (codex, cursor)
		await expect(toolCards).toHaveCount(2);
	});

	test("tool cards render correctly with logos", async ({ page }) => {
		const seededSlugs = ["codex", "cursor"];

		for (const slug of seededSlugs) {
			const card = page.locator(`[data-testid="tool-card-${slug}"]`);
			await expect(card).toBeVisible();

			const logo = card.locator("img").first();
			await expect(logo).toBeVisible();
		}
	});

	test("background image appears on hover", async ({ page }) => {
		const firstSlug = "codex";
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
		const firstSlug = "codex";
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
