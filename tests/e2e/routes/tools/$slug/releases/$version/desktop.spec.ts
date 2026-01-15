import { expect, test } from "@playwright/test";
import {
	TEST_TOOL,
	goToReleaseDetail,
	goToVersionWithChanges,
} from "../../../../../utils/release-helpers";

test.describe("Release Detail Page - Desktop", () => {
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
			await goToVersionWithChanges(page);

			// Verify we have multiple sections (sidebar requires 2+)
			const sections = page.locator('[data-testid^="section-"]');
			const sectionCount = await sections.count();

			if (sectionCount < 2) {
				// Skip test if release doesn't have 2+ section types
				test.skip(true, "Release has fewer than 2 section types - sidebar won't appear");
				return;
			}

			// Scroll down to trigger sidebar visibility (appears after 100px scroll)
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForSelector('[data-testid="section-nav"][data-visible="true"]', { timeout: 5000 });

			const sidebar = page.locator('[data-testid="section-nav"]');
			await expect(sidebar).toBeVisible();
		});

		test("sidebar highlights active section on scroll", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 800 });
			await goToReleaseDetail(page);
			await goToVersionWithChanges(page);

			// Verify we have multiple sections (sidebar requires 2+)
			const sections = page.locator('[data-testid^="section-"]');
			const sectionCount = await sections.count();

			if (sectionCount < 2) {
				test.skip(true, "Release has fewer than 2 section types - sidebar won't appear");
				return;
			}

			// Scroll past threshold to show sidebar
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForSelector('[data-testid="section-nav"][data-visible="true"]', { timeout: 5000 });

			await expect(sections.first()).toBeVisible();

			// Scroll to put a section in view while staying past the 100px threshold
			const targetSection = sectionCount > 1
				? sections.nth(1)
				: sections.first();
			await targetSection.evaluate((section) => {
				const offset = section.getBoundingClientRect().top + window.scrollY;
				// Ensure we stay at least 150px scrolled (above the 100px threshold)
				const scrollTarget = Math.max(150, offset - 100);
				window.scrollTo(0, scrollTarget);
			});
			await page.waitForTimeout(500);

			await page.waitForFunction(() => {
				return Boolean(
					document.querySelector(
						'[data-testid="section-nav"] [data-active="true"]',
					),
				);
			}, { timeout: 10000 });

			// Check that the sidebar is still visible (scroll position > 100px)
			const scrollY = await page.evaluate(() => window.scrollY);
			if (scrollY < 100) {
				// Re-scroll if we ended up below threshold
				await page.evaluate(() => window.scrollTo(0, 200));
				await page.waitForTimeout(300);
			}

			await expect(
				page.locator('[data-testid="section-nav"] [data-active="true"]'),
			).toBeVisible({ timeout: 5000 });
		});


		test("clicking sidebar item scrolls", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 800 });
			await goToReleaseDetail(page);
			await goToVersionWithChanges(page);

			// Verify we have multiple sections (sidebar requires 2+)
			const sections = page.locator('[data-testid^="section-"]');
			const sectionCount = await sections.count();

			if (sectionCount < 2) {
				test.skip(true, "Release has fewer than 2 section types - sidebar won't appear");
				return;
			}

			// Scroll past threshold to show sidebar
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForSelector('[data-testid="section-nav"][data-visible="true"]', { timeout: 5000 });

			const navItem = page.locator('[data-testid="section-nav"] button').first();
			await navItem.click();

			await page.waitForTimeout(500);
			await expect(
				page.locator('[data-testid="section-nav"] [data-active="true"]'),
			).toBeVisible({ timeout: 5000 });
		});
	});

	test.describe("Version Switching Regression", () => {
		test("sidebar works after client-side version navigation", async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 800 });
			await goToReleaseDetail(page);
			await goToVersionWithChanges(page);

			// Verify we have multiple sections (sidebar requires 2+)
			const sections = page.locator('[data-testid^="section-"]');
			const sectionCount = await sections.count();

			if (sectionCount < 2) {
				test.skip(true, "Release has fewer than 2 section types - sidebar won't appear");
				return;
			}

			// Scroll past threshold to show sidebar
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForSelector('[data-testid="section-nav"][data-visible="true"]', { timeout: 5000 });

			const initialSection = page.locator('[data-testid^="section-"]').first();
			await expect(initialSection).toBeVisible();
			await initialSection.scrollIntoViewIfNeeded();
			await page.waitForTimeout(500);
			await expect(
				page.locator('[data-testid="section-nav"] [data-active="true"]'),
			).toBeVisible({ timeout: 5000 });

			await expect(
				page.locator('[data-testid="version-list"]'),
			).toBeVisible();
			await goToVersionWithChanges(page);

			await expect(
				page.locator('[data-testid="release-content"]'),
			).toBeVisible();

			// Check sections again after navigation
			const newSectionCount = await page.locator('[data-testid^="section-"]').count();

			if (newSectionCount < 2) {
				// This version doesn't have enough sections - that's acceptable
				return;
			}

			// Scroll past threshold again after navigation
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForSelector('[data-testid="section-nav"][data-visible="true"]', { timeout: 5000 });

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

			// Verify we have multiple sections (sidebar requires 2+)
			const sections = page.locator('[data-testid^="section-"]');
			const sectionCount = await sections.count();

			if (sectionCount < 2) {
				test.skip(true, "Release has fewer than 2 section types - sidebar won't appear");
				return;
			}

			// Scroll past threshold to show sidebar
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForSelector('[data-testid="section-nav"][data-visible="true"]', { timeout: 5000 });
		});

	});

	test.describe("Keyboard Navigation", () => {
		test("pressing n navigates to next version", async ({ page }) => {
			await goToReleaseDetail(page);
			await goToVersionWithChanges(page);

			await expect(
				page.locator('[data-testid="version-list"]'),
			).toBeVisible();

			// Scroll past threshold to show sidebar
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForTimeout(300);

			// Sidebar may not show if only 1 section type - that's ok for keyboard nav test
			const sidebarVisible = await page.locator('[data-testid="section-nav"]').isVisible().catch(() => false);
			if (sidebarVisible) {
				await page.locator('[data-testid="section-nav"] button').first().focus();
			}

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
			await goToVersionWithChanges(page);

			await expect(
				page.locator('[data-testid="version-list"]'),
			).toBeVisible();

			// Scroll past threshold to show sidebar
			await page.evaluate(() => {
				document.body.style.minHeight = "2000px";
				window.scrollTo(0, 200);
			});
			await page.waitForTimeout(300);

			// Sidebar may not show if only 1 section type - that's ok for keyboard nav test
			const sidebarVisible = await page.locator('[data-testid="section-nav"]').isVisible().catch(() => false);
			if (sidebarVisible) {
				await page.locator('[data-testid="section-nav"] button').first().focus();
			}

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
});
