import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',
	plugins: [adminClient(), tanstackStartCookies()],
})
