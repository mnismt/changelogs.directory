interface ImportMetaEnv {
	readonly VITE_SENTRY_DSN?: string
	readonly VITE_SENTRY_ENVIRONMENT?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare namespace NodeJS {
	interface ProcessEnv {
		EMAIL_PROVIDER?: 'resend' | 'zeptomail'
		RESEND_API_KEY?: string
		ZEPTOMAIL_API_KEY?: string
	}
}
