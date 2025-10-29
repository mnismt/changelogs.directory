import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
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

const inputValidator = z.object({
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
	.inputValidator(inputValidator)
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
