// ═══════════════════════════════════════════════════════════════════
// Canonical Model Definitions
// ═══════════════════════════════════════════════════════════════════

export type ModelTier = 'frontier' | 'standard' | 'budget' | 'free'

export type ModelProvider =
	| 'Anthropic'
	| 'OpenAI'
	| 'Google'
	| 'Windsurf'
	| 'xAI'
	| 'DeepSeek'
	| 'Alibaba'
	| 'Zhipu'
	| 'Moonshot'
	| 'Minimax'
	| 'Other'

export type ModelCapability =
	| 'thinking'
	| 'vision'
	| 'code'
	| 'fast'
	| 'long-context'

export interface ModelDefinition {
	id: string
	name: string
	provider: ModelProvider
	tier: ModelTier
	contextWindow?: number
	capabilities?: ModelCapability[]
	note?: string
}

// ═══════════════════════════════════════════════════════════════════
// Model Registry
// ═══════════════════════════════════════════════════════════════════

export const MODELS: Record<string, ModelDefinition> = {
	// ─── Anthropic ───
	'claude-sonnet-4-5': {
		id: 'claude-sonnet-4-5',
		name: 'Claude Sonnet 4.5',
		provider: 'Anthropic',
		tier: 'frontier',
		contextWindow: 200000,
		capabilities: ['code', 'vision', 'thinking'],
		note: 'Best coding model in the world (2026)',
	},
	'claude-opus-4-5': {
		id: 'claude-opus-4-5',
		name: 'Claude Opus 4.5',
		provider: 'Anthropic',
		tier: 'frontier',
		contextWindow: 200000,
		capabilities: ['thinking', 'code', 'vision', 'long-context'],
		note: 'Maximum reasoning depth',
	},
	'claude-haiku-4-5': {
		id: 'claude-haiku-4-5',
		name: 'Claude Haiku 4.5',
		provider: 'Anthropic',
		tier: 'budget',
		contextWindow: 200000,
		capabilities: ['code', 'fast', 'thinking'],
		note: 'Near-frontier intelligence at low cost',
	},
	// Legacy Anthropic
	'claude-3-5-sonnet': {
		id: 'claude-3-5-sonnet',
		name: 'Claude 3.5 Sonnet',
		provider: 'Anthropic',
		tier: 'standard',
		contextWindow: 200000,
		capabilities: ['code', 'vision'],
	},

	// ─── OpenAI ───
	'gpt-5-2': {
		id: 'gpt-5-2',
		name: 'GPT-5.2',
		provider: 'OpenAI',
		tier: 'frontier',
		contextWindow: 128000,
		capabilities: ['thinking', 'code', 'vision'],
	},
	'gpt-5-2-codex': {
		id: 'gpt-5-2-codex',
		name: 'GPT-5.2 Codex',
		provider: 'OpenAI',
		tier: 'frontier',
		contextWindow: 400000,
		capabilities: ['code', 'vision', 'long-context'],
		note: 'Optimized for agentic coding loops',
	},
	'gpt-5-1-codex': {
		id: 'gpt-5-1-codex',
		name: 'GPT-5.1 Codex',
		provider: 'OpenAI',
		tier: 'standard',
		contextWindow: 400000,
		capabilities: ['code', 'long-context'],
	},
	'gpt-5-1-codex-mini': {
		id: 'gpt-5-1-codex-mini',
		name: 'GPT-5.1 Codex Mini',
		provider: 'OpenAI',
		tier: 'budget',
		contextWindow: 400000,
		capabilities: ['code', 'fast'],
	},
	// Legacy OpenAI
	'gpt-4o': {
		id: 'gpt-4o',
		name: 'GPT-4o',
		provider: 'OpenAI',
		tier: 'standard',
		contextWindow: 128000,
		capabilities: ['code', 'vision'],
	},

	// ─── Google ───
	'gemini-3-pro': {
		id: 'gemini-3-pro',
		name: 'Gemini 3 Pro',
		provider: 'Google',
		tier: 'frontier',
		contextWindow: 2000000,
		capabilities: ['code', 'vision', 'long-context'],
	},
	'gemini-3-flash': {
		id: 'gemini-3-flash',
		name: 'Gemini 3 Flash',
		provider: 'Google',
		tier: 'budget',
		contextWindow: 2000000,
		capabilities: ['code', 'fast', 'long-context'],
	},
	// Legacy Google
	'gemini-2-flash': {
		id: 'gemini-2-flash',
		name: 'Gemini 2.0 Flash',
		provider: 'Google',
		tier: 'budget',
		contextWindow: 1000000,
		capabilities: ['code', 'fast', 'long-context'],
	},

	// ─── xAI ───
	'grok-code': {
		id: 'grok-code',
		name: 'Grok Code',
		provider: 'xAI',
		tier: 'standard',
		contextWindow: 256000,
		capabilities: ['code', 'vision'],
	},
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

export function getModel(id: string): ModelDefinition | undefined {
	return MODELS[id]
}

export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
	return Object.values(MODELS).filter((m) => m.tier === tier)
}

export function getModelsByProvider(
	provider: ModelProvider,
): ModelDefinition[] {
	return Object.values(MODELS).filter((m) => m.provider === provider)
}

export function getFreeModels(): ModelDefinition[] {
	return getModelsByTier('free')
}
