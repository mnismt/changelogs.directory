import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import { ensureBraintrustTelemetry } from './telemetry'

// Initialize LLM only if API key is available
function initializeLLM(): LanguageModel | null {
	const apiKey = process.env.GEMINI_API_KEY || ''

	if (!apiKey) {
		console.warn(
			'GEMINI_API_KEY environment variable is not set. LLM features will fall back to keyword-based classification.',
		)
		return null
	}

	ensureBraintrustTelemetry()

	try {
		const google = createGoogleGenerativeAI({
			apiKey,
		})

		return google('gemini-2.5-flash-lite')
	} catch (error) {
		console.error('Failed to initialize LLM:', error)
		return null
	}
}

export const llm = initializeLLM()
