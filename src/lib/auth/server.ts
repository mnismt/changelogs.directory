import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getPrisma } from '../../server/db'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:5173'

console.log('[Better Auth] Initializing with baseURL:', baseURL)

export const auth = betterAuth({
	baseURL,
	database: prismaAdapter(getPrisma(), {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [admin(), tanstackStartCookies()],
	trustedOrigins: [baseURL],
	logger: {
		disabled: false,
		level: 'debug',
	},
	onAPIError: {
		onError: (error: unknown) => {
			console.error('[Better Auth API Error]', error)
		},
	},
})
