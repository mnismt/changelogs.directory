import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import { getPrisma } from '@/server/db'

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

export const Route = createFileRoute('/api/waitlist')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json()
					const validatedData = inputValidator.parse(body)

					const prisma = getPrisma()

					try {
						const existingEmail = await prisma.waitlist.findUnique({
							where: { email: validatedData.email },
						})

						if (existingEmail) {
							return json(
								{ success: false, message: 'Email already registered' },
								{ status: 400 },
							)
						}

						await prisma.waitlist.create({
							data: {
								email: validatedData.email,
							},
						})

						return json({
							success: true,
							message: 'Successfully added to waitlist!',
						})
					} finally {
						await prisma.$disconnect()
					}
				} catch (error: unknown) {
					if (error instanceof z.ZodError) {
						const firstError = error.issues[0]
						return json(
							{
								success: false,
								message: firstError?.message || 'Invalid email address',
							},
							{ status: 400 },
						)
					}

					console.error('Database error:', error)
					return json(
						{ success: false, message: 'Failed to save email' },
						{ status: 500 },
					)
				}
			},
		},
	},
})
