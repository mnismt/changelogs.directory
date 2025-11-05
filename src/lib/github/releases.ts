import { logger } from '@trigger.dev/sdk'
import type { GitHubRelease } from '../parsers/github-releases'
import { parseGitHubRepoUrl } from './api'
import { getCachedReleases, setCachedReleases } from './cache'

/**
 * Options for fetching GitHub releases
 */
export interface FetchGitHubReleasesOptions {
	/** Whether to include draft releases */
	includeDrafts?: boolean
	/** Whether to include pre-releases */
	includePreReleases?: boolean
	/** Number of results per page (max 100) */
	perPage?: number
}

/**
 * Fetches releases from GitHub Releases API with pagination, caching, and ETag support
 * - Checks Redis cache first (90-day TTL)
 * - Uses ETag for conditional requests (304 Not Modified)
 * - Falls back to full fetch if cache miss
 * @param repoUrl GitHub repository URL
 * @param token Optional GitHub token for higher rate limits (5000/hour vs 60/hour)
 * @param options Fetch options
 * @returns Array of GitHub releases
 */
export async function fetchGitHubReleases(
	repoUrl: string,
	token?: string,
	options?: FetchGitHubReleasesOptions,
): Promise<GitHubRelease[]> {
	const repo = parseGitHubRepoUrl(repoUrl)
	if (!repo) {
		throw new Error(`Invalid GitHub URL: ${repoUrl}`)
	}

	// Check cache first
	const cached = await getCachedReleases(repo.owner, repo.name)

	if (cached.releases) {
		logger.info('Using cached releases', {
			owner: repo.owner,
			repo: repo.name,
			count: cached.releases.length,
		})
		return applyFilters(cached.releases, options)
	}

	// Cache miss - fetch from GitHub
	const headers: Record<string, string> = {
		'User-Agent': 'Changelogs.directory Bot',
		Accept: 'application/vnd.github.v3+json',
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	// Add ETag for conditional request (if we have it)
	if (cached.etag) {
		headers['If-None-Match'] = cached.etag
		logger.info('Using ETag for conditional request', {
			owner: repo.owner,
			repo: repo.name,
			etag: cached.etag,
		})
	}

	let allReleases: GitHubRelease[] = []
	let page = 1
	let newEtag: string | null = null
	const perPage = options?.perPage || 100

	logger.info('Fetching GitHub releases (with pagination)', {
		repo,
		perPage,
		hasEtag: !!cached.etag,
	})

	// Paginate through all releases
	while (true) {
		const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=${perPage}&page=${page}`

		const response = await fetch(url, { headers })

		// Handle 304 Not Modified (content hasn't changed)
		if (response.status === 304) {
			logger.info('GitHub API returned 304 Not Modified (content unchanged)', {
				owner: repo.owner,
				repo: repo.name,
			})
			// Return empty array - caller should handle this
			// (This shouldn't happen if we have cached.releases, but just in case)
			return []
		}

		if (!response.ok) {
			const errorBody = await response.text()
			throw new Error(
				`GitHub API error: ${response.status} ${response.statusText} - ${errorBody}`,
			)
		}

		// Capture ETag from first page
		if (page === 1) {
			newEtag = response.headers.get('etag')
		}

		const releases = (await response.json()) as GitHubRelease[]

		if (releases.length === 0) {
			// No more releases
			break
		}

		allReleases = [...allReleases, ...releases]

		logger.info('Fetched release page', {
			page,
			releasesInPage: releases.length,
			totalReleases: allReleases.length,
			rateLimit: response.headers.get('x-ratelimit-remaining'),
		})

		// If we got less than perPage releases, we've reached the end
		if (releases.length < perPage) {
			break
		}

		page++
	}

	logger.info('Fetched all releases from GitHub', {
		totalReleases: allReleases.length,
		totalPages: page,
		preReleases: allReleases.filter((r) => r.prerelease).length,
		drafts: allReleases.filter((r) => r.draft).length,
		etag: newEtag,
	})

	// Cache the results (before filtering)
	await setCachedReleases(repo.owner, repo.name, allReleases, newEtag)

	// Apply filters and return
	return applyFilters(allReleases, options)
}

/**
 * Apply draft and pre-release filters to releases
 */
function applyFilters(
	releases: GitHubRelease[],
	options?: FetchGitHubReleasesOptions,
): GitHubRelease[] {
	return releases.filter((r) => {
		if (r.draft && !options?.includeDrafts) return false
		if (r.prerelease && !options?.includePreReleases) return false
		return true
	})
}
