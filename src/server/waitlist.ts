import { render } from '@react-email/components'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createEmailProvider } from '@/lib/email'
import { WelcomeEmail } from '@/lib/email/templates'
import { getPrisma } from './db'

// Popular email providers whitelist
const ALLOWED_EMAIL_DOMAINS = [
	// Major providers
	'gmail.com',
	'yahoo.com',
	'outlook.com',
	'hotmail.com',
	'live.com',
	'icloud.com',
	'me.com',
	'mac.com',
	'aol.com',
	'protonmail.com',
	'proton.me',
	'tutanota.com',
	'hey.com',
	'fastmail.com',
	'zoho.com',
	'yandex.com',
	'mail.com',
	'gmx.com',
	// Regional providers
	'qq.com',
	'163.com',
	'126.com',
	'sina.com',
	'sohu.com',
	'naver.com',
	'daum.net',
	'hanmail.net',
	'yahoo.co.jp',
	'mail.ru',
	// Business/Education (common)
	'outlook.office365.com',
	'edu',
] as const

const waitlistSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email('Please enter a valid email address')
		.refine(
			(email) => {
				const domain = email.split('@')[1]

				// Check if domain matches allowed list
				// Also check if email ends with .edu for educational institutions
				return ALLOWED_EMAIL_DOMAINS.some((allowedDomain) => {
					if (allowedDomain === 'edu') {
						return domain?.endsWith('.edu')
					}
					return domain === allowedDomain
				})
			},
			{
				message:
					'Please use an email from a recognized provider (Gmail, Outlook, Yahoo, etc.)',
			},
		),
})

export const subscribeToWaitlist = createServerFn({ method: 'POST' })
	.inputValidator((data) => {
		const result = waitlistSchema.safeParse(data)
		if (!result.success) {
			const message = result.error.issues[0]?.message || 'Invalid email address'
			throw new Error(message)
		}

		return result.data
	})
	.handler(async ({ data }) => {
		const prisma = getPrisma()

		try {
			const existingEmail = await prisma.waitlist.findUnique({
				where: { email: data.email },
			})

			if (existingEmail) {
				throw new Error('Email already registered')
			}

			await prisma.waitlist.create({
				data: {
					email: data.email,
				},
			})

			// Send welcome email (non-critical: log errors but don't fail the subscription)
			try {
				const emailProvider = createEmailProvider()
				const html = await render(WelcomeEmail({ email: data.email }))
				const text = await render(WelcomeEmail({ email: data.email }), {
					plainText: true,
				})

				const result = await emailProvider.sendEmail({
					from: {
						email: 'noreply@changelogs.directory',
						name: 'Changelogs Directory',
					},
					to: data.email,
					subject: '> SYSTEM_INIT: Welcome to changelogs.directory',
					html,
					text,
				})
				if (!result.success) {
					console.error('Failed to send welcome email:', result.error)
				}
			} catch (emailError) {
				console.error('Email provider error:', emailError)
			}

			return {
				success: true,
				message: 'Successfully added to waitlist!',
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message === 'Email already registered') {
					throw error
				}
				console.error('Database error:', error)
			}
			throw new Error('Failed to save email')
		} finally {
			await prisma.$disconnect()
		}
	})
