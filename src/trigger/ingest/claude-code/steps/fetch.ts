import { logger } from '@trigger.dev/sdk'
import type { FetchResult, IngestionContext } from '../types'

/**
 * Phase 2: Fetch
 * - Fetch changelog from GitHub
 * - Validate response
 */
export async function fetchStep(ctx: IngestionContext): Promise<FetchResult> {
	logger.info('Phase 2: Fetch', {
		url: ctx.tool.sourceUrl,
	})

	const response = await fetch(ctx.tool.sourceUrl, {
		headers: {
			'User-Agent': 'Changelogs.directory Bot',
			Accept: 'text/plain',
		},
	})

	if (!response.ok) {
		throw new Error(
			`Failed to fetch changelog: ${response.status} ${response.statusText}`,
		)
	}

	const markdown = await response.text()

	logger.info('Changelog fetched', {
		sizeBytes: markdown.length,
		etag: response.headers.get('etag'),
	})

	return {
		markdown,
		etag: response.headers.get('etag'),
	}
}
