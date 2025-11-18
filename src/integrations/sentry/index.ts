import * as Sentry from '@sentry/react'

let isInitialized = false

export function initSentry() {
	if (isInitialized) {
		return
	}

	const dsn = import.meta.env.VITE_SENTRY_DSN
	if (!dsn) {
		return
	}

	Sentry.init({
		dsn,
		environment:
			import.meta.env.VITE_SENTRY_ENVIRONMENT ??
			import.meta.env.MODE ??
			(import.meta.env.DEV ? 'development' : 'production'),
		tracesSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: 0.05,
	})

	isInitialized = true
}

export function captureException(error: unknown) {
	if (!isInitialized) return
	Sentry.captureException(error)
}

export { Sentry }
