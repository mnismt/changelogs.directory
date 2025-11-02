import { createVertex } from '@ai-sdk/google-vertex/edge'
import type { LanguageModel } from 'ai'

interface GoogleCredentials {
	type: string
	project_id: string
	private_key_id: string
	private_key: string
	client_email: string
	client_id: string
	auth_uri: string
	token_uri: string
	auth_provider_x509_cert_url: string
	client_x509_cert_url: string
	universe_domain?: string
}

// Initialize LLM only if credentials are available
function initializeLLM(): LanguageModel | null {
	const credentialsRaw = process.env.GOOGLE_VERTEX_CREDENTIALS || ''

	if (!credentialsRaw) {
		console.warn(
			'GOOGLE_VERTEX_CREDENTIALS environment variable is not set. LLM features will fall back to keyword-based classification.',
		)
		return null
	}

	try {
		const credentials = JSON.parse(credentialsRaw) as GoogleCredentials

		const vertex = createVertex({
			project: credentials.project_id,
			location: 'global',
			googleCredentials: {
				clientEmail: credentials.client_email,
				privateKey: credentials.private_key,
			},
		})

		return vertex('gemini-2.5-flash')
	} catch (error) {
		console.error('Failed to initialize LLM:', error)
		return null
	}
}

export const llm = initializeLLM()
