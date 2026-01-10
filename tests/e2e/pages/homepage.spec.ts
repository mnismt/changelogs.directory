import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("hero section is visible", async ({ page }) => {
		const heroSection = page.locator('[data-testid="hero-section"]');
		await expect(heroSection).toBeVisible();

		await expect(
			page.locator('[data-testid="hero-section"] h1'),
		).toBeVisible();
	});

	test("logo showcase carousel displays logos", async ({ page }) => {
		const logoShowcase = page.locator('[data-testid="logo-showcase"]');
		await expect(logoShowcase).toBeVisible();

		// Logos are rendered as inline SVGs, so assert on SVG count.
		const logos = logoShowcase.locator("svg");
		await expect(logos.first()).toBeVisible();
	});

	test("tool filter buttons work", async ({ page }) => {
		const filterButtons = page.locator('button[aria-label*="Filter by"]');
		await expect(filterButtons.first()).toBeVisible();

		const firstButton = filterButtons.first();
		await firstButton.click();

		// Verify button gets highlighted (has active/selected state)
		await expect(firstButton).toHaveAttribute("aria-pressed", "true");
	});

	test("search input is functional", async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Search"]');
		await expect(searchInput).toBeVisible();

		const searchText = "react";
		await searchInput.fill(searchText);

		await expect(searchInput).toHaveValue(searchText);
	});

	test("navigate to tools directory", async ({ page }) => {
		const allToolsLink = page.locator('a:has-text("All tools")');
		await expect(allToolsLink).toBeVisible();

		await allToolsLink.click();

		await expect(page).toHaveURL("/tools");
	});

	test("has correct meta tags", async ({ page }) => {
		const title = await page.title();
		expect(title).toContain("changelogs.directory");

		const ogImage = page.locator('meta[property="og:image"]');
		await expect(ogImage).toHaveCount(1);
	});
});
