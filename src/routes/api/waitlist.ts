import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getErrorMessage } from '@/lib/errors'
import { subscribeToWaitlist } from '@/server/waitlist'

export const Route = createFileRoute('/api/waitlist')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json()
					const result = await subscribeToWaitlist({ data: body })
					return json(result)
				} catch (error) {
					const message = getErrorMessage(error)
					const status = message === 'Failed to save email' ? 500 : 400

					return json({ success: false, message }, { status })
				}
			},
		},
	},
})
