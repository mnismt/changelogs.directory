import { logger } from '@trigger.dev/sdk'

/**
 * GitHub API response types
 */
export interface GitHubCommit {
	sha: string
	commit: {
		author: {
			date: string
		}
		message: string
	}
}

export interface GitHubCommitDetail {
	sha: string
	commit: {
		author: {
			date: string
		}
	}
	files?: Array<{
		filename: string
		patch?: string
	}>
}

/**
 * Parsed repository information from GitHub URL
 */
export interface RepoInfo {
	owner: string
	name: string
}

/**
 * Parse a GitHub repository URL to extract owner and repo name
 * @param url GitHub repository URL (supports multiple formats)
 * @returns Parsed repository info or null if invalid
 */
export function parseGitHubRepoUrl(url: string): RepoInfo | null {
	try {
		// Match patterns like:
		// - https://github.com/owner/repo/...
		// - https://raw.githubusercontent.com/owner/repo/...
		const match = url.match(/github(?:usercontent)?\.com\/([^/]+)\/([^/]+)/)
		if (!match) return null

		const [, owner, name] = match
		return { owner, name: name.replace(/\.git$/, '') }
	} catch {
		return null
	}
}

/**
 * Fetch commit history for a specific file from GitHub API
 * @param repoUrl GitHub repository URL
 * @param filePath Path to the file within the repository
 * @param token Optional GitHub token for higher rate limits
 * @returns Array of commits that modified the file
 */
export async function fetchCommitHistory(
	repoUrl: string,
	filePath: string,
	token?: string,
): Promise<GitHubCommit[]> {
	const repo = parseGitHubRepoUrl(repoUrl)
	if (!repo) {
		throw new Error(`Invalid GitHub URL: ${repoUrl}`)
	}

	const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/commits?path=${filePath}&per_page=100`

	logger.info('Fetching commit history from GitHub', { url, repo, filePath })

	const headers: Record<string, string> = {
		'User-Agent': 'Changelogs.directory Bot',
		Accept: 'application/vnd.github.v3+json',
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	const response = await fetch(url, { headers })

	if (!response.ok) {
		throw new Error(
			`GitHub API error: ${response.status} ${response.statusText}`,
		)
	}

	const commits = (await response.json()) as GitHubCommit[]

	logger.info('Fetched commit history', {
		count: commits.length,
		rateLimit: response.headers.get('x-ratelimit-remaining'),
	})

	return commits
}

/**
 * Fetch detailed commit information including patches
 * @param repoUrl GitHub repository URL
 * @param sha Commit SHA
 * @param token Optional GitHub token for higher rate limits
 * @returns Detailed commit information with file patches
 */
export async function fetchCommitDetail(
	repoUrl: string,
	sha: string,
	token?: string,
): Promise<GitHubCommitDetail> {
	const repo = parseGitHubRepoUrl(repoUrl)
	if (!repo) {
		throw new Error(`Invalid GitHub URL: ${repoUrl}`)
	}

	const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/commits/${sha}`

	const headers: Record<string, string> = {
		'User-Agent': 'Changelogs.directory Bot',
		Accept: 'application/vnd.github.v3+json',
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	const response = await fetch(url, { headers })

	if (!response.ok) {
		throw new Error(
			`GitHub API error: ${response.status} ${response.statusText}`,
		)
	}

	return (await response.json()) as GitHubCommitDetail
}

/**
 * Extract version numbers from a commit patch
 * Looks for patterns like "+## 2.0.33" in CHANGELOG.md diffs
 * @param patch Git diff patch content
 * @returns Array of version strings found in the patch
 */
export function extractVersionsFromPatch(patch: string): string[] {
	const versions: string[] = []

	// Match lines starting with "+" followed by markdown headers with version numbers
	// Examples: "+## 2.0.33", "+## 1.5.0-beta.1"
	const versionRegex = /^\+##\s+(\d+\.\d+\.\d+[^\s]*)/gm

	let match: RegExpExecArray | null
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
	while ((match = versionRegex.exec(patch)) !== null) {
		versions.push(match[1])
	}

	return versions
}

/**
 * Build a mapping of version numbers to release dates by analyzing Git commit history
 * @param repoUrl GitHub repository URL
 * @param filePath Path to the changelog file (e.g., "CHANGELOG.md")
 * @param token Optional GitHub token for higher rate limits
 * @returns Map of version strings to Date objects
 */
export async function buildVersionDateMapping(
	repoUrl: string,
	filePath: string,
	token?: string,
): Promise<Map<string, Date>> {
	const versionDates = new Map<string, Date>()

	try {
		// Fetch commit history for the changelog file
		const commits = await fetchCommitHistory(repoUrl, filePath, token)

		logger.info('Building version-to-date mapping', {
			totalCommits: commits.length,
		})

		// Process commits in chronological order (oldest first)
		// This ensures we capture the first occurrence of each version
		for (const commit of commits.reverse()) {
			try {
				// Fetch detailed commit with patch
				const detail = await fetchCommitDetail(repoUrl, commit.sha, token)

				// Find the changelog file in the commit
				const changelogFile = detail.files?.find((f) =>
					f.filename.includes(filePath),
				)

				if (!changelogFile?.patch) continue

				// Extract version numbers from the patch
				const versions = extractVersionsFromPatch(changelogFile.patch)

				// Map each version to this commit's date
				const commitDate = new Date(detail.commit.author.date)
				for (const version of versions) {
					// Only set the date if we haven't seen this version before
					// (keeps the earliest/first occurrence)
					if (!versionDates.has(version)) {
						versionDates.set(version, commitDate)
						logger.info('Mapped version to date', {
							version,
							date: commitDate.toISOString(),
							commit: commit.sha.substring(0, 7),
						})
					}
				}
			} catch (error) {
				// Log but don't fail the entire mapping if one commit fails
				logger.warn('Failed to process commit', {
					sha: commit.sha,
					error: error instanceof Error ? error.message : String(error),
				})
			}
		}

		logger.info('Version-to-date mapping complete', {
			versionsFound: versionDates.size,
		})

		return versionDates
	} catch (error) {
		// If GitHub API fails entirely, return empty map (graceful degradation)
		logger.error('Failed to build version-date mapping', {
			error: error instanceof Error ? error.message : String(error),
		})
		return new Map()
	}
}
