import { createFileRoute } from '@tanstack/react-router'
import { captureServerException } from '@/integrations/sentry/server'
import { isAuthorizedAdminApiRequest } from '@/lib/admin-api-key'
import { fetchAdminLatestReleasesForAllTools } from '@/server/admin-latest-releases'

const JSON_HEADERS = {
	'Content-Type': 'application/json',
	'Cache-Control': 'no-store',
} as const

export const Route = createFileRoute('/api/latest')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!isAuthorizedAdminApiRequest(request)) {
					return new Response(JSON.stringify({ error: 'Unauthorized' }), {
						status: 401,
						headers: JSON_HEADERS,
					})
				}

				try {
					const tools = await fetchAdminLatestReleasesForAllTools()
					const body = JSON.stringify({
						generatedAt: new Date().toISOString(),
						tools,
					})
					return new Response(body, {
						status: 200,
						headers: JSON_HEADERS,
					})
				} catch (error: unknown) {
					console.error('[GET /api/latest]', error)
					captureServerException(error)
					return new Response(
						JSON.stringify({ error: 'Failed to load latest releases' }),
						{
							status: 500,
							headers: JSON_HEADERS,
						},
					)
				}
			},
		},
	},
})
