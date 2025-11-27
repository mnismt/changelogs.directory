import { ResendProvider } from './resend-provider'
import type { EmailProvider } from './types'
import { ZeptoMailProvider } from './zepto-provider'

export type EmailProviderType = 'resend' | 'zeptomail'

export function createEmailProvider(): EmailProvider {
	const provider = (process.env.EMAIL_PROVIDER || 'resend') as EmailProviderType

	switch (provider) {
		case 'resend': {
			const apiKey = process.env.RESEND_API_KEY
			if (!apiKey) {
				throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend')
			}
			return new ResendProvider(apiKey)
		}
		case 'zeptomail': {
			const apiKey = process.env.ZEPTOMAIL_API_KEY
			if (!apiKey) {
				throw new Error(
					'ZEPTOMAIL_API_KEY is required when EMAIL_PROVIDER=zeptomail',
				)
			}
			return new ZeptoMailProvider(apiKey)
		}
		default:
			throw new Error(`Unknown email provider: ${provider}`)
	}
}

export * from './types'
