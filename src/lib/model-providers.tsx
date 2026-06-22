import type { ReactNode } from 'react'
import { ClaudeAI } from '@/components/logo/claude'
import { Cursor } from '@/components/logo/cursor'
import { GeminiCli } from '@/components/logo/gemini-cli'
import { OpenAI } from '@/components/logo/openai'
import { OpenCode } from '@/components/logo/opencode'
import { Windsurf } from '@/components/logo/windsurf'

export type ModelProvider =
	| 'claude'
	| 'openai'
	| 'gemini'
	| 'swe'
	| 'cursor'
	| 'opencode'
	| 'mixed'
	| 'other'

const PROVIDER_LABELS: Record<ModelProvider, string> = {
	claude: 'Anthropic',
	openai: 'OpenAI',
	gemini: 'Google',
	swe: 'Cognition',
	cursor: 'Cursor',
	opencode: 'OpenCode',
	mixed: 'Multi',
	other: 'Other',
}

/**
 * Map a model line to the provider whose logo represents it. Pass `toolSlug` so
 * a harness's own in-house models render with the tool's own mark (Cursor's
 * Composer, Opencode's Zen/Go tiers) instead of a blank dot. BYOK/multi routing
 * is matched before the frontier families, so an "BYOK (Claude, GPT, Gemini…)"
 * line reads as multi — not mistakenly as Claude.
 */
export function detectModelProvider(
	name: string,
	toolSlug?: string,
): ModelProvider {
	const s = name.toLowerCase()

	if (
		toolSlug === 'cursor' &&
		(s.includes('composer') || s.includes('in-house'))
	)
		return 'cursor'
	if (
		toolSlug === 'opencode' &&
		(s.startsWith('zen') || s.startsWith('go:') || s.includes('open-weight'))
	)
		return 'opencode'

	if (
		s.includes('byok') ||
		s.includes('any provider') ||
		s.includes('auto mode')
	)
		return 'mixed'

	if (s.includes('claude')) return 'claude'
	if (
		s.includes('gpt') ||
		s.includes('codex') ||
		s.includes('openai') ||
		s.includes('o1') ||
		s.includes('o3')
	)
		return 'openai'
	if (s.includes('gemini')) return 'gemini'
	if (s.startsWith('swe')) return 'swe'
	return 'other'
}

export function getProviderLogo(provider: ModelProvider): ReactNode | null {
	switch (provider) {
		case 'claude':
			return <ClaudeAI />
		case 'openai':
			return <OpenAI />
		case 'gemini':
			return <GeminiCli />
		case 'swe':
			return <Windsurf />
		case 'cursor':
			// Cursor's mark ships with no fill — tint it to the inherited text color.
			return <Cursor className="[&_path]:fill-foreground" />
		case 'opencode':
			return <OpenCode />
		default:
			return null
	}
}

export function getProviderLabel(provider: ModelProvider): string {
	return PROVIDER_LABELS[provider]
}

export type ProviderGroup = {
	provider: ModelProvider
	models: string[]
}

export function groupModelsByProvider(
	models: string[],
	toolSlug?: string,
): ProviderGroup[] {
	const order: ModelProvider[] = []
	const buckets = new Map<ModelProvider, string[]>()

	for (const m of models) {
		const p = detectModelProvider(m, toolSlug)
		if (!buckets.has(p)) {
			buckets.set(p, [])
			order.push(p)
		}
		buckets.get(p)?.push(m)
	}

	return order.map((p) => ({
		provider: p,
		models: buckets.get(p) ?? [],
	}))
}
