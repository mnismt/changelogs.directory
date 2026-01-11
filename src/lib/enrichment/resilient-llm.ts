import { generateObject, type LanguageModel, type TelemetrySettings } from 'ai'
import type { z } from 'zod'
import { getModelsWithFallback, hasAvailableModels } from '@/lib/llm/models'
import type { CircuitBreaker } from './circuit-breaker'

/**
 * Result of a resilient LLM call with fallback support.
 */
export interface ResilientLLMResult<T> {
	/** Whether the call succeeded */
	success: boolean
	/** The generated data (if successful) */
	data?: T
	/** Which model was used for the successful call */
	modelUsed?: string
	/** Error if all models failed */
	error?: Error
	/** Whether circuit breaker was triggered */
	circuitBreakerTriggered?: boolean
}

/**
 * Logger interface compatible with Trigger.dev logger.
 */
export interface LLMLogger {
	debug: (message: string, meta?: Record<string, unknown>) => void
	info: (message: string, meta?: Record<string, unknown>) => void
	warn: (message: string, meta?: Record<string, unknown>) => void
	error: (message: string, meta?: Record<string, unknown>) => void
}

/**
 * Default console logger (used when Trigger.dev logger not available).
 */
export const defaultLogger: LLMLogger = {
	debug: (msg, meta) => console.debug(msg, meta),
	info: (msg, meta) => console.info(msg, meta),
	warn: (msg, meta) => console.warn(msg, meta),
	error: (msg, meta) => console.error(msg, meta),
}

/**
 * Try calling generateObject with a specific model.
 * Internal helper - handles the actual API call.
 */
async function tryGenerateWithModel(
	model: LanguageModel,
	// biome-ignore lint/suspicious/noExplicitAny: AI SDK requires flexible schema type
	schema: z.ZodObject<any>,
	prompt: string,
	maxRetries: number,
	temperature: number,
	telemetry?: TelemetrySettings,
): Promise<unknown> {
	const result = await generateObject({
		model,
		schema,
		prompt,
		temperature,
		maxRetries,
		...(telemetry ? { experimental_telemetry: telemetry } : {}),
	})

	return result.object
}

/**
 * Options for generateObjectWithFallback.
 */
export interface GenerateWithFallbackOptions {
	/** Temperature for generation (default: 0.3) */
	temperature?: number
	/** Telemetry settings for AI SDK (use buildBraintrustTelemetry) */
	telemetry?: TelemetrySettings
	/** Circuit breaker instance for failure tracking */
	circuitBreaker?: CircuitBreaker
	/** Logger instance (defaults to console) */
	logger?: LLMLogger
}

/**
 * Generates a structured object with automatic retry and model fallback.
 *
 * Strategy:
 * 1. Check circuit breaker - skip if open
 * 2. Try primary model with built-in AI SDK retries (exponential backoff)
 * 3. If primary fails after all retries, try fallback model
 * 4. If all models fail, return error result
 *
 * @param schema - Zod schema for structured output
 * @param prompt - The prompt to send to the LLM
 * @param options - Optional configuration
 * @returns Result with success status, data, and metadata
 *
 * @example
 * ```ts
 * const result = await generateObjectWithFallback(
 *   releaseEnrichmentSchema,
 *   prompt,
 *   { circuitBreaker, logger }
 * )
 * if (result.success) {
 *   // result.data is the parsed object
 * }
 * ```
 */
export async function generateObjectWithFallback<T>(
	// biome-ignore lint/suspicious/noExplicitAny: AI SDK requires flexible schema type
	schema: z.ZodObject<any>,
	prompt: string,
	options?: GenerateWithFallbackOptions,
): Promise<ResilientLLMResult<T>> {
	const logger = options?.logger ?? defaultLogger
	const circuitBreaker = options?.circuitBreaker
	const temperature = options?.temperature ?? 0.3

	// Check circuit breaker first
	if (circuitBreaker?.shouldSkip()) {
		logger.warn('Circuit breaker open, skipping LLM call', {
			stats: circuitBreaker.getStats(),
		})
		return {
			success: false,
			error: new Error('Circuit breaker open - too many consecutive failures'),
			circuitBreakerTriggered: true,
		}
	}

	// Check if any models are available
	if (!hasAvailableModels()) {
		logger.warn('No LLM models available (GEMINI_API_KEY not set)')
		return {
			success: false,
			error: new Error('No LLM models available'),
		}
	}

	const models = getModelsWithFallback()
	if (models.length === 0) {
		logger.warn('All models failed to initialize')
		return {
			success: false,
			error: new Error('All models failed to initialize'),
		}
	}

	let lastError: Error | undefined

	// Try each model in the fallback chain
	for (let i = 0; i < models.length; i++) {
		const { model, config } = models[i]
		const isLastModel = i === models.length - 1

		try {
			logger.debug(`Attempting LLM call with ${config.id}`, {
				maxRetries: config.maxRetries,
				priority: config.priority,
				isFallback: i > 0,
			})

			const data = await tryGenerateWithModel(
				model,
				schema,
				prompt,
				config.maxRetries,
				temperature,
				options?.telemetry,
			)

			// Success! Record and return
			circuitBreaker?.recordSuccess()

			logger.debug(`LLM call succeeded with ${config.id}`, {
				modelUsed: config.id,
				wasFallback: i > 0,
			})

			return {
				success: true,
				data: data as T,
				modelUsed: config.id,
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))

			logger.warn(
				`Model ${config.id} failed after ${config.maxRetries} retries`,
				{
					error: lastError.message,
					willTryFallback: !isLastModel,
					remainingModels: models.length - i - 1,
				},
			)
		}
	}

	// All models failed
	circuitBreaker?.recordFailure()

	logger.error('All LLM models exhausted', {
		modelsAttempted: models.map((m) => m.config.id),
		lastError: lastError?.message,
	})

	return {
		success: false,
		error: lastError ?? new Error('All models failed'),
	}
}
