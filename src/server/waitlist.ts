import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getPrisma } from './db'

const emailValidator = z
	.object({
		email: z.email(),
	})
	.refine(
		(data) => {
			const email = data.email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			return emailRegex.test(email)
		},
		{
			message: 'Invalid email format',
		},
	)
	.transform((data) => {
		return { email: data.email.toLowerCase().trim() }
	})

export const subscribeToWaitlist = createServerFn({ method: 'POST' })
	.inputValidator(emailValidator)
	.handler(async ({ data }) => {
		try {
			// Get Prisma client with driver adapter
			const prisma = getPrisma()

			// Check if email already exists
			const existingEmail = await prisma.waitlist.findUnique({
				where: { email: data.email },
			})

			if (existingEmail) {
				throw new Error('Email already registered')
			}

			// Insert email into database
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
				// Re-throw known errors (like "Email already registered")
				if (error.message === 'Email already registered') {
					throw error
				}
				console.error('Database error:', error)
			}
			throw new Error('Failed to save email')
		}
	})
