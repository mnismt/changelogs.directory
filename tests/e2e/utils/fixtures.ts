import { test as base } from "@playwright/test"

/**
 * Custom Playwright fixtures for common setup.
 */
export const test = base.extend({
	// Add custom fixtures here if needed
})

export { expect } from "@playwright/test"
