import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getServerAuth } from '@/lib/auth/get-server-auth'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
	async () => {
		const headers = getRequestHeaders()
		const auth = await getServerAuth()
		const session = await auth.api.getSession({
			headers,
		})

		return session
	},
)
