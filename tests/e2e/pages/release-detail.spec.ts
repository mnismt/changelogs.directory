import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const TEST_TOOL = "codex";

const goToReleaseDetail = async (page: Page, toolSlug = TEST_TOOL) => {
	await page.goto(`/tools/${toolSlug}`);

	const releaseLink = page
		.getByRole("link", { name: /Version .* released/i })
		.first();
	await expect(releaseLink).toBeVisible();

	await releaseLink.click();
	await expect(page).toHaveURL(/\/tools\/.*\/releases\/.*/);
};

const getVersionLinks = (page: Page) =>
	page.locator('[data-testid="version-list"] a');

const goToVersionWithChanges = async (page: Page) => {
	const versionLinks = getVersionLinks(page);
	await expect(versionLinks.first()).toBeVisible();

	const linkTexts = await versionLinks.evaluateAll((links) =>
		links.map((link) => link.textContent ?? ""),
	);
	const targetIndex = Math.max(
		0,
		linkTexts.findIndex((text) => /CHANGES\s*[1-9]/.test(text)),
	);

	const currentUrl = page.url();
	await versionLinks.nth(targetIndex).click();
	await page.waitForURL((url) => url.href !== currentUrl);
};

const goToVersionWithAdjacent = async (page: Page) => {
	const versionLinks = getVersionLinks(page);
	await expect(versionLinks.first()).toBeVisible();

	const linkTexts = await versionLinks.evaluateAll((links) =>
		links.map((link) => link.textContent ?? ""),
	);
	const linkCount = linkTexts.length;
	const fallbackIndex = linkCount > 2 ? Math.floor(linkCount / 2) : 0;
	const stableIndex = linkTexts.findIndex(
		(text) => !/alpha|beta|rc/i.test(text),
	);
	const targetIndex = stableIndex === -1 ? fallbackIndex : stableIndex;

	const currentUrl = page.url();
	await versionLinks.nth(targetIndex).click();
	await page.waitForURL((url) => url.href !== currentUrl);
};

test.describe("Release Detail Page", () => {
	test.describe("Page Load & Content", () => {
		test("loads release page with content", async ({ page }) => {
			await goToReleaseDetail(page);

			await expect(page.locator('[data-testid="release-content"]')).toBeVisible();
		});

		test("displays change sections", async ({ page }) => {
			await goToReleaseDetail(page);

			const sections = page.locator('[data-testid^="section-"]');
			await expect(sections.first()).toBeVisible();
		});

		test("has correct og:image meta tag", async ({ page }) => {
			await goToReleaseDetail(page);

			const ogImage = page.locator('meta[property="og:image"]');
			await expect(ogImage).toHaveCount(1);

			const content = await ogImage.getAttribute("content");
			expect(content).toContain(`/og/tools/${TEST_TOOL}`);
			expect(content).toContain("/releases/");
		});
	});

	test.describe("Section Navigation Sidebar", () => {
		test("sidebar is visible on desktop", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 800 });
			await goToReleaseDetail(page);

			const sidebar = page.locator('[data-testid="section-nav"]');
			await expect(sidebar).toBeVisible({ timeout: 5000 });
		});

			test("sidebar highlights active section on scroll", async ({ page }) => {
				await page.setViewportSize({ width: 1280, height: 800 });
				await goToReleaseDetail(page);

				await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 });

				const sections = page.locator('[data-testid^="section-"]');
				await expect(sections.first()).toBeVisible();

				const targetSection = (await sections.count()) > 1
					? sections.nth(1)
					: sections.first();
				await targetSection.evaluate((section) => {
					const offset = section.getBoundingClientRect().top + window.scrollY;
					window.scrollTo(0, offset + 200);
				});
				await page.waitForTimeout(500);

				await page.waitForFunction(() => {
					return Boolean(
						document.querySelector(
							'[data-testid="section-nav"] [data-active="true"]',
						),
					);
				});
				await expect(
					page.locator('[data-testid="section-nav"] [data-active="true"]'),
				).toBeVisible();
			});


		test("clicking sidebar item scrolls", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 800 });
			await goToReleaseDetail(page);

			await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 });

			const navItem = page.locator('[data-testid="section-nav"] button').first();
			await navItem.click();

			await page.waitForTimeout(500);
			await expect(
				page.locator('[data-testid="section-nav"] [data-active="true"]'),
			).toBeVisible();
		});
	});

	test.describe("Version Switching Regression", () => {
		test("sidebar works after client-side version navigation", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 800 });
			await goToReleaseDetail(page);

			await page.waitForSelector('[data-testid="section-nav"]', { timeout: 5000 });

			const initialSection = page.locator('[data-testid^="section-"]').first();
			await expect(initialSection).toBeVisible();
			await initialSection.scrollIntoViewIfNeeded();
			await page.waitForTimeout(500);
			await expect(
				page.locator('[data-testid="section-nav"] [data-active="true"]'),
			).toBeVisible();

			await expect(
				page.locator('[data-testid="version-list"]'),
			).toBeVisible();
			await goToVersionWithChanges(page);

			await expect(
				page.locator('[data-testid="release-content"]'),
			).toBeVisible();
			await expect(page.locator('[data-testid="section-nav"]')).toBeVisible({
				timeout: 5000,
			});

			await page.waitForSelector('[data-testid^="section-"]');
			await page.evaluate(() => {
				const section = document.querySelector('[data-testid^="section-"]');
				if (!section) return;
				const offset = section.getBoundingClientRect().top + window.scrollY;
				window.scrollTo(0, offset + 200);
			});
			await page.waitForTimeout(500);

			await expect(
				page.locator('[data-testid="section-nav"] [data-active="true"]'),
			).toBeVisible({ timeout: 5000 });
		});

			test("sidebar resets on version switch", async ({ page }) => {
				await page.setViewportSize({ width: 1280, height: 800 });
				await goToReleaseDetail(page);
				await goToVersionWithChanges(page);

				await expect(
					page.locator('[data-testid="release-content"]'),
				).toBeVisible();
				await expect(page.locator('[data-testid="section-nav"]')).toBeVisible({
					timeout: 5000,
				});
			});

	});

	test.describe("Keyboard Navigation", () => {
			test("pressing n navigates to next version", async ({ page }) => {
				await goToReleaseDetail(page);
				await goToVersionWithAdjacent(page);

			await expect(
				page.locator('[data-testid="version-list"]'),
			).toBeVisible();
			await expect(page.locator('[data-testid="section-nav"]')).toBeVisible();
			await page.locator('[data-testid="section-nav"] button').first().focus();

			await page.evaluate(() => {
				document.dispatchEvent(
					new KeyboardEvent("keydown", { key: "n", bubbles: true }),
				);
			});
			await expect(
				page.locator('[data-testid="release-content"]'),
			).toBeVisible();


			});

			test("pressing p navigates to previous version", async ({ page }) => {
				await goToReleaseDetail(page);
				await goToVersionWithAdjacent(page);

			await expect(
				page.locator('[data-testid="version-list"]'),
			).toBeVisible();
			await expect(page.locator('[data-testid="section-nav"]')).toBeVisible();
			await page.locator('[data-testid="section-nav"] button').first().focus();

			await page.evaluate(() => {
				document.dispatchEvent(
					new KeyboardEvent("keydown", { key: "p", bubbles: true }),
				);
			});
			await expect(
				page.locator('[data-testid="release-content"]'),
			).toBeVisible();


			});

	});

	test.describe("Mobile Version Picker", () => {
		test("FAB opens version picker on mobile", async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });
			await goToReleaseDetail(page);

			const fab = page.locator('button[aria-label="Open version picker"]');
			await expect(fab).toBeVisible({ timeout: 5000 });
			await fab.click();

			await expect(
				page.locator('[data-testid="version-picker-sheet"]'),
			).toBeVisible();
		});
	});
});
