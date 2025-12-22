import type { CursorSourceConfig } from './types'

const DEFAULT_CONFIG: Required<CursorSourceConfig> = {
	baseUrl: 'https://cursor.com',
	startPath: '/changelog',
	articleSelector: 'main#main.section.section--longform article',
	bodySelector: '.prose',
	maxPagesPerRun: 6,
	initialPageCount: 40,
}

export function resolveSourceConfig(
	rawConfig: unknown,
): Required<CursorSourceConfig> {
	const parsed = (rawConfig ?? {}) as CursorSourceConfig

	return {
		baseUrl: parsed.baseUrl ?? DEFAULT_CONFIG.baseUrl,
		startPath: parsed.startPath ?? DEFAULT_CONFIG.startPath,
		articleSelector: parsed.articleSelector ?? DEFAULT_CONFIG.articleSelector,
		bodySelector: parsed.bodySelector ?? DEFAULT_CONFIG.bodySelector,
		maxPagesPerRun: parsed.maxPagesPerRun ?? DEFAULT_CONFIG.maxPagesPerRun,
		initialPageCount:
			parsed.initialPageCount ?? DEFAULT_CONFIG.initialPageCount,
	}
}
