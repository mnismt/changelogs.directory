import { Resend } from 'resend'
import type { EmailParams, EmailProvider, EmailResult } from './types'

export class ResendProvider implements EmailProvider {
	private client: Resend

	constructor(apiKey: string) {
		this.client = new Resend(apiKey)
	}

	async sendEmail(params: EmailParams): Promise<EmailResult> {
		try {
			const { error } = await this.client.emails.send({
				from: `${params.from.name} <${params.from.email}>`,
				to: params.to,
				replyTo: params.replyTo,
				subject: params.subject,
				html: params.html,
				text: params.text,
				headers: params.headers,
			})

			if (error) {
				return { success: false, error: error.message }
			}

			return { success: true }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error'
			return { success: false, error: message }
		}
	}
}
