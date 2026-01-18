export interface EmailParams {
	from: {
		email: string
		name: string
	}
	to: string
	subject: string
	html: string
	text?: string
	replyTo?: string
	headers?: Record<string, string>
}

export interface EmailResult {
	success: boolean
	error?: string
}

export interface EmailProvider {
	sendEmail(params: EmailParams): Promise<EmailResult>
}
