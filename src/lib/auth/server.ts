import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getPrisma } from '../../server/db'

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',
	database: prismaAdapter(getPrisma(), {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [admin(), tanstackStartCookies()],
	trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:5173'],
})
