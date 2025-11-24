import { registerOTel } from '@vercel/otel'
import type { TelemetrySettings } from 'ai'
import { BraintrustExporter } from 'braintrust'

let braintrustTelemetryReady: boolean | undefined

/**
 * Registers the Braintrust OTEL exporter once for the process.
 * Returns true when telemetry is ready to accept spans.
 */
export function ensureBraintrustTelemetry(): boolean {
	if (braintrustTelemetryReady !== undefined) {
		return braintrustTelemetryReady
	}

	const apiKey = process.env.BRAINTRUST_API_KEY
	const projectName = process.env.PROJECT_NAME || 'changelogs-directory'

	if (!apiKey) {
		console.warn(
			'Braintrust telemetry disabled: BRAINTRUST_API_KEY is not set.',
		)
		braintrustTelemetryReady = false
		return braintrustTelemetryReady
	}

	try {
		registerOTel({
			serviceName: projectName,
			traceExporter: new BraintrustExporter({
				parent: `project_name:${projectName}`,
				filterAISpans: true,
			}) as any,
		})
		braintrustTelemetryReady = true
	} catch (error) {
		console.error('Failed to register Braintrust telemetry exporter', error)
		braintrustTelemetryReady = false
	}

	return braintrustTelemetryReady
}

/**
 * Builds telemetry settings for AI SDK calls with Braintrust metadata.
 */
export function buildBraintrustTelemetry(
	metadata: Record<string, any | undefined>,
): TelemetrySettings | undefined {
	if (!ensureBraintrustTelemetry()) {
		return undefined
	}

	const cleanedMetadata = Object.fromEntries(
		Object.entries(metadata).filter(
			([, value]) => value !== undefined && value !== null,
		),
	) as Record<string, any>

	return {
		isEnabled: true,
		metadata: Object.keys(cleanedMetadata).length ? cleanedMetadata : undefined,
	}
}
