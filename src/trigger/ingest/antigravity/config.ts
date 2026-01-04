import type { AntigravitySourceConfig } from './types'

const DEFAULT_CONFIG: Required<AntigravitySourceConfig> = {
	baseUrl: 'https://antigravity.google',
	startPath: '/changelog',
	maxReleasesPerRun: 100,
}

export function resolveSourceConfig(
	rawConfig: unknown,
): Required<AntigravitySourceConfig> {
	const parsed = (rawConfig ?? {}) as AntigravitySourceConfig

	return {
		baseUrl: parsed.baseUrl ?? DEFAULT_CONFIG.baseUrl,
		startPath: parsed.startPath ?? DEFAULT_CONFIG.startPath,
		maxReleasesPerRun:
			parsed.maxReleasesPerRun ?? DEFAULT_CONFIG.maxReleasesPerRun,
	}
}
