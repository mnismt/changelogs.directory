import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
	testDir: "./tests/e2e/pages",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI
		? [["github"], ["html"]]
		: [["html"], ["list"]],

	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	webServer: {
		command: "pnpm dev",
		url: "http://localhost:5173",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
		stdout: "pipe",
		stderr: "pipe",
	},
})
