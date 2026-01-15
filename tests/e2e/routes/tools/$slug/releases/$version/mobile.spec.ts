import { expect, test } from "@playwright/test";
import { goToReleaseDetail } from "../../../../../utils/release-helpers";

test.describe("Release Detail Page - Mobile", () => {
	test.describe("Mobile Version Picker", () => {
		test("FAB opens version picker on mobile", async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });
			await goToReleaseDetail(page);

			// Dismiss announcement banner if visible (it can intercept clicks)
			const dismissButton = page.locator('button:has-text("Dismiss")');
			if (await dismissButton.isVisible({ timeout: 1000 }).catch(() => false)) {
				await dismissButton.click();
				await page.waitForTimeout(300);
			}

			const fab = page.locator('button[aria-label="Open version picker"]');
			await expect(fab).toBeVisible({ timeout: 5000 });
			await fab.click({ force: true });

			await expect(
				page.locator('[data-testid="version-picker-sheet"]'),
			).toBeVisible();
		});
	});
});
