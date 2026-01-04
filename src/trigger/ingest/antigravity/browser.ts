import { logger } from '@trigger.dev/sdk'
import { type Browser, chromium } from 'playwright'

/**
 * Fetches a page using Playwright, waiting for JavaScript to render.
 * Returns the fully-rendered HTML.
 */
export async function fetchRenderedPage(
	url: string,
	options: {
		waitForSelector?: string
		waitForTimeout?: number
	} = {},
): Promise<string> {
	const { waitForSelector, waitForTimeout = 3000 } = options

	let browser: Browser | null = null

	try {
		logger.info('Launching Playwright browser', { url })

		browser = await chromium.launch({
			headless: true,
		})

		const context = await browser.newContext({
			userAgent: 'ChangelogsDirectoryBot/1.0 (+https://changelogs.directory)',
		})

		const page = await context.newPage()

		// Navigate and wait for network to be idle
		await page.goto(url, {
			waitUntil: 'networkidle',
			timeout: 30000,
		})

		// Wait for specific selector if provided (e.g., the changelog container)
		if (waitForSelector) {
			logger.info('Waiting for selector', { selector: waitForSelector })
			try {
				await page.waitForSelector(waitForSelector, { timeout: 10000 })
			} catch {
				logger.warn('Selector not found, continuing with fallback timeout', {
					selector: waitForSelector,
				})
				await page.waitForTimeout(waitForTimeout)
			}
		} else {
			// Fallback: wait a bit for any remaining JS to execute
			await page.waitForTimeout(waitForTimeout)
		}

		// Extract the fully-rendered HTML
		const html = await page.content()

		logger.info('Page rendered successfully', {
			url,
			htmlLength: html.length,
		})

		await page.close()
		await context.close()

		return html
	} finally {
		if (browser) {
			await browser.close()
			logger.info('Browser closed')
		}
	}
}
