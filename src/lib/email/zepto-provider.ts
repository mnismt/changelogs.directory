import { SendMailClient } from 'zeptomail'
import type { EmailParams, EmailProvider, EmailResult } from './types'

export class ZeptoMailProvider implements EmailProvider {
	private client: SendMailClient

	constructor(apiKey: string) {
		this.client = new SendMailClient({
			url: 'api.zeptomail.com/',
			token: apiKey,
		})
	}

	async sendEmail(params: EmailParams): Promise<EmailResult> {
		try {
			await this.client.sendMail({
				from: {
					address: params.from.email,
					name: params.from.name,
				},
				to: [
					{
						email_address: {
							address: params.to,
							name: '',
						},
					},
				],
				subject: params.subject,
				htmlbody: params.html,
				textbody: params.text || '',
			})

			return { success: true }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error'
			return { success: false, error: message }
		}
	}
}
