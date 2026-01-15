import { type Page, expect } from "@playwright/test";

export const TEST_TOOL = "codex";

export const getVersionLinks = (page: Page) =>
	page.locator('[data-testid="version-list"] a');

export const goToReleaseDetail = async (page: Page, toolSlug = TEST_TOOL) => {
	await page.goto(`/tools/${toolSlug}`);

	const releaseLink = page
		.getByRole("link", { name: /Version .* released/i })
		.first();
	await expect(releaseLink).toBeVisible();

	await releaseLink.click();
	await expect(page).toHaveURL(/\/tools\/.*\/releases\/.*/);
};

export const goToVersionWithChanges = async (page: Page) => {
	const versionLinks = getVersionLinks(page);
	await expect(versionLinks.first()).toBeVisible();

	const linkTexts = await versionLinks.evaluateAll((links) =>
		links.map((link) => link.textContent ?? ""),
	);

	// Find a version with many changes (likely to have multiple section types)
	// Look for versions with 2+ digit change counts first (10+)
	let targetIndex = linkTexts.findIndex((text) => {
		const match = text.match(/CHANGES\s+(\d+)/);
		return match && Number.parseInt(match[1], 10) >= 10;
	});

	if (targetIndex === -1) {
		// Fallback to any version with at least 2 changes
		targetIndex = linkTexts.findIndex((text) => {
			const match = text.match(/CHANGES\s+(\d+)/);
			return match && Number.parseInt(match[1], 10) >= 2;
		});
	}

	if (targetIndex === -1) {
		// Last fallback - any version with changes
		targetIndex = Math.max(
			0,
			linkTexts.findIndex((text) => /CHANGES\s+[1-9]/.test(text)),
		);
	}

	const currentUrl = page.url();
	await versionLinks.nth(targetIndex).click();
	await page.waitForURL((url) => url.href !== currentUrl);

	// Wait for release content to load
	await page.waitForSelector('[data-testid="release-content"]', { timeout: 5000 });
};
