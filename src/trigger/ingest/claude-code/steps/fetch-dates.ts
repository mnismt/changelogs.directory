import { logger } from '@trigger.dev/sdk'
import { buildVersionDateMapping } from '@/lib/github/api'
import type { FetchDatesResult, IngestionContext } from '../types'

/**
 * Phase 2.5: Fetch Release Dates from Git History
 * - Analyzes Git commit history to extract version-to-date mappings
 * - Uses GitHub API to fetch commits and patches
 * - Gracefully degrades if GitHub API fails
 */
export async function fetchDatesStep(
	ctx: IngestionContext,
): Promise<FetchDatesResult> {
	logger.info('Phase 2.5: Fetch Release Dates from Git History')

	try {
		// Extract changelog file path from sourceUrl
		// Example: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
		// -> Extract "CHANGELOG.md"
		const urlParts = ctx.tool.sourceUrl.split('/')
		const filePath = urlParts[urlParts.length - 1]

		logger.info('Extracting release dates from Git history', {
			sourceUrl: ctx.tool.sourceUrl,
			filePath,
		})

		// Get GitHub token from environment if available
		const token = process.env.GITHUB_TOKEN

		if (!token) {
			logger.warn(
				'GITHUB_TOKEN not set - using unauthenticated requests (60/hour limit)',
			)
		}

		// Build version-to-date mapping from Git history
		const versionDates = await buildVersionDateMapping(
			ctx.tool.sourceUrl,
			filePath,
			token,
		)

		logger.info('Release dates fetched', {
			versionsWithDates: versionDates.size,
		})

		return { versionDates }
	} catch (error) {
		// If date fetching fails, continue without dates (graceful degradation)
		logger.error('Failed to fetch release dates from Git history', {
			error: error instanceof Error ? error.message : String(error),
		})

		return { versionDates: new Map() }
	}
}
