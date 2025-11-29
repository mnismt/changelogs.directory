import { ResendProvider } from './resend-provider'
import type { EmailProvider } from './types'
import { ZeptoMailProvider } from './zepto-provider'

export type EmailProviderType = 'resend' | 'zeptomail'

import { LoggingEmailProvider } from './logging-provider'

export function createEmailProvider(): EmailProvider {
	const provider = (process.env.EMAIL_PROVIDER || 'resend') as EmailProviderType

	let emailProvider: EmailProvider

	switch (provider) {
		case 'resend': {
			const apiKey = process.env.RESEND_API_KEY
			if (!apiKey) {
				throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend')
			}
			emailProvider = new ResendProvider(apiKey)
			break
		}
		case 'zeptomail': {
			const apiKey = process.env.ZEPTOMAIL_API_KEY
			if (!apiKey) {
				throw new Error(
					'ZEPTOMAIL_API_KEY is required when EMAIL_PROVIDER=zeptomail',
				)
			}
			emailProvider = new ZeptoMailProvider(apiKey)
			break
		}
		default:
			throw new Error(`Unknown email provider: ${provider}`)
	}

	return new LoggingEmailProvider(emailProvider, provider)
}

export * from './types'
