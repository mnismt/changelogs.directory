import { logger } from '@trigger.dev/sdk'
import { fetchGitHubReleases } from '@/lib/github/releases'
import type { FetchResult, IngestionContext } from '../types'

/**
 * Phase 2: Fetch
 * - Fetch releases from GitHub Releases API
 * - Handle pagination automatically
 * - Filter based on pre-release/draft configuration
 */
export async function fetchStep(ctx: IngestionContext): Promise<FetchResult> {
	logger.info('Phase 2: Fetch releases from GitHub Releases API', {
		repositoryUrl: ctx.tool.repositoryUrl,
	})

	const token = process.env.GITHUB_TOKEN

	if (!token) {
		logger.warn(
			'GITHUB_TOKEN not set - using unauthenticated requests (60/hour limit). Set GITHUB_TOKEN for 5000/hour limit.',
		)
	}

	const config = ctx.tool.sourceConfig as {
		versionPrefix?: string
		includePreReleases?: boolean
	} | null

	const releases = await fetchGitHubReleases(ctx.tool.repositoryUrl, token, {
		includeDrafts: false, // Never include drafts
		includePreReleases: config?.includePreReleases ?? true, // Default: include pre-releases
		bypassCache: ctx.forceFullRescan,
	})

	logger.info('Releases fetched', {
		totalReleases: releases.length,
		preReleases: releases.filter((r) => r.prerelease).length,
		stableReleases: releases.filter((r) => !r.prerelease).length,
	})

	return { releases }
}
