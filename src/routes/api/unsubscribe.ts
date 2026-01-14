import { createFileRoute, redirect } from '@tanstack/react-router'
import { processUnsubscribe } from '@/server/digest'

/**
 * API endpoint for one-click unsubscribe.
 * Supports both GET (redirect) and POST (List-Unsubscribe header).
 */

export const Route = createFileRoute('/api/unsubscribe')({
	server: {
		handlers: {
			// GET: Process unsubscribe and redirect to confirmation page
			GET: async ({ request }) => {
				const url = new URL(request.url)
				const token = url.searchParams.get('token')

				if (!token) {
					return new Response('Missing token parameter', { status: 400 })
				}

				// Perform unsubscribe via server function
				await processUnsubscribe({ data: { token } })

				// Redirect to confirmation page
				throw redirect({
					to: '/unsubscribe',
					search: { token },
				})
			},

			// POST: For List-Unsubscribe-Post header (one-click)
			POST: async ({ request }) => {
				const url = new URL(request.url)
				const token = url.searchParams.get('token')

				if (!token) {
					return new Response(
						JSON.stringify({ error: 'Missing token parameter' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}

				const result = await processUnsubscribe({ data: { token } })

				if (!result.found) {
					return new Response(JSON.stringify({ error: 'Invalid token' }), {
						status: 404,
						headers: { 'Content-Type': 'application/json' },
					})
				}

				return new Response(
					JSON.stringify({
						success: true,
						message: result.alreadyUnsubscribed
							? 'Already unsubscribed'
							: 'Successfully unsubscribed',
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					},
				)
			},
		},
	},
})
