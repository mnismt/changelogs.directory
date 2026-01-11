import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import { ensureBraintrustTelemetry } from './telemetry'

/**
 * Model configuration for the fallback chain.
 * Lower priority = higher precedence (tried first).
 */
export interface ModelConfig {
	/** Model identifier (e.g., 'gemini-2.5-flash-lite') */
	id: string
	/** Max retries for this model (AI SDK built-in exponential backoff) */
	maxRetries: number
	/** Priority order (1 = primary, 2 = fallback, etc.) */
	priority: number
}

/**
 * Ordered fallback chain for LLM enrichment.
 * Primary model is tried first with 3 retries.
 * Fallback model is tried if primary exhausts all retries.
 */
export const MODEL_FALLBACK_CHAIN: ModelConfig[] = [
	{ id: 'gemini-2.5-flash-lite', maxRetries: 3, priority: 1 },
	{ id: 'gemini-2.5-flash', maxRetries: 2, priority: 2 },
]

/**
 * Creates a language model instance for the given model ID.
 * Returns null if GEMINI_API_KEY is not set.
 */
export function createModel(modelId: string): LanguageModel | null {
	const apiKey = process.env.GEMINI_API_KEY

	if (!apiKey) {
		return null
	}

	ensureBraintrustTelemetry()

	try {
		const google = createGoogleGenerativeAI({ apiKey })
		return google(modelId)
	} catch (error) {
		console.error(`Failed to create model ${modelId}:`, error)
		return null
	}
}

/**
 * Returns all available models in the fallback chain.
 * Filters out models that failed to initialize.
 */
export function getModelsWithFallback(): Array<{
	model: LanguageModel
	config: ModelConfig
}> {
	return MODEL_FALLBACK_CHAIN.map((config) => {
		const model = createModel(config.id)
		return model ? { model, config } : null
	}).filter((m): m is NonNullable<typeof m> => m !== null)
}

/**
 * Checks if any LLM models are available.
 */
export function hasAvailableModels(): boolean {
	return Boolean(process.env.GEMINI_API_KEY)
}
