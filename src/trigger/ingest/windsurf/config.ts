import type { WindsurfSourceConfig } from './types'

const DEFAULT_CONFIG: Required<WindsurfSourceConfig> = {
	baseUrl: 'https://windsurf.com',
	startPath: '/changelog',
	releaseSelector: 'div[id][class*="scroll-mt-10"]',
	bodySelector: '.prose',
	maxReleasesPerRun: 200,
}

export function resolveSourceConfig(
	rawConfig: unknown,
): Required<WindsurfSourceConfig> {
	const parsed = (rawConfig ?? {}) as WindsurfSourceConfig

	return {
		baseUrl: parsed.baseUrl ?? DEFAULT_CONFIG.baseUrl,
		startPath: parsed.startPath ?? DEFAULT_CONFIG.startPath,
		releaseSelector: parsed.releaseSelector ?? DEFAULT_CONFIG.releaseSelector,
		bodySelector: parsed.bodySelector ?? DEFAULT_CONFIG.bodySelector,
		maxReleasesPerRun:
			parsed.maxReleasesPerRun ?? DEFAULT_CONFIG.maxReleasesPerRun,
	}
}
