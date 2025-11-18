import * as SentryNode from '@sentry/node'

let serverInitialized = false

function initSentryServer() {
	if (serverInitialized) {
		return
	}

	const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN
	if (!dsn) {
		return
	}

	SentryNode.init({
		dsn,
		environment:
			process.env.SENTRY_ENVIRONMENT ||
			process.env.VITE_SENTRY_ENVIRONMENT ||
			process.env.NODE_ENV ||
			'development',
		tracesSampleRate: 0.1,
	})

	serverInitialized = true
}

export function captureServerException(error: unknown) {
	if (!serverInitialized) {
		initSentryServer()
	}

	if (!serverInitialized) {
		return
	}

	SentryNode.captureException(error)
}
