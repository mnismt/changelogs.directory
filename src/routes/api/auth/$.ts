import { createFileRoute } from '@tanstack/react-router'
import { getServerAuth } from '@/lib/auth/get-server-auth'

const handleAuthRequest = async (request: Request) => {
	const auth = await getServerAuth()
	return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
	server: {
		handlers: {
			GET: ({ request }) => {
				return handleAuthRequest(request)
			},
			POST: ({ request }) => {
				return handleAuthRequest(request)
			},
		},
	},
})
