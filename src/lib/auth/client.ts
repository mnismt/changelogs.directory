import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
	baseURL:
		import.meta.env.VITE_BETTER_AUTH_URL ||
		(typeof window !== 'undefined'
			? window.location.origin
			: 'http://localhost:5173'),
	plugins: [adminClient()],
})
