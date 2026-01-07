import { createFileRoute } from '@tanstack/react-router'
import { captureServerException } from '@/integrations/sentry/server'
import { getServerAuth } from '@/lib/auth/get-server-auth'

const handleAuthRequest = async (request: Request) => {
	try {
		const auth = await getServerAuth()
		return auth.handler(request)
	} catch (error) {
		console.error('[Auth API Error]', {
			url: request.url,
			method: request.method,
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
		})
		captureServerException(error)
		throw error
	}
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
