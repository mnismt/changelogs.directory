import { getPrisma } from '../../server/db'
import type { EmailParams, EmailProvider, EmailResult } from './types'

export class LoggingEmailProvider implements EmailProvider {
	constructor(
		private provider: EmailProvider,
		private providerName: string,
	) {}

	async sendEmail(params: EmailParams): Promise<EmailResult> {
		const result = await this.provider.sendEmail(params)
		const prisma = getPrisma()

		try {
			await prisma.emailLog.create({
				data: {
					to: params.to,
					subject: params.subject,
					status: result.success ? 'success' : 'failed',
					provider: this.providerName,
					error: result.error,
				},
			})
		} catch (error) {
			console.error('Failed to log email:', error)
			// Don't fail the email sending just because logging failed
		}

		return result
	}
}
