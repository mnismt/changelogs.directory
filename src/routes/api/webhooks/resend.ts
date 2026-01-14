import { createFileRoute } from '@tanstack/react-router'
import {
	handleBounceEvent,
	handleComplaintEvent,
	handleDeliveredEvent,
} from '@/server/digest'

/**
 * Webhook handler for Resend delivery events.
 * Tracks bounces, complaints, and delivery status.
 *
 * Resend event types:
 * - email.sent
 * - email.delivered
 * - email.bounced
 * - email.complained
 * - email.opened
 * - email.clicked
 *
 * @see https://resend.com/docs/dashboard/webhooks/introduction
 */

interface ResendWebhookPayload {
	type: string
	created_at: string
	data: {
		email_id: string
		from: string
		to: string[]
		subject: string
		created_at: string
	}
}

async function handleWebhook(request: Request): Promise<Response> {
	// Verify webhook signature (optional but recommended)
	const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
	if (webhookSecret) {
		const signature = request.headers.get('svix-signature')
		if (!signature) {
			console.warn('[Resend Webhook] Missing signature header')
			return new Response('Missing signature', { status: 401 })
		}
		// TODO: Implement svix signature verification when library is added
		// For now, we proceed without verification if secret is set
	}

	let payload: ResendWebhookPayload
	try {
		payload = await request.json()
	} catch {
		return new Response('Invalid JSON', { status: 400 })
	}

	const { type, data } = payload

	console.log(`[Resend Webhook] Received event: ${type}`, {
		to: data.to,
		subject: data.subject,
	})

	try {
		switch (type) {
			case 'email.bounced': {
				await handleBounceEvent({
					data: { emails: data.to, subject: data.subject },
				})
				console.log(
					`[Resend Webhook] Recorded bounce for ${data.to.join(', ')}`,
				)
				break
			}

			case 'email.complained': {
				await handleComplaintEvent({ data: { emails: data.to } })
				console.log(
					`[Resend Webhook] Auto-unsubscribed ${data.to.join(', ')} due to spam complaint`,
				)
				break
			}

			case 'email.delivered': {
				await handleDeliveredEvent({
					data: { emails: data.to, subject: data.subject },
				})
				break
			}

			default:
				// Ignore other events (sent, opened, clicked)
				break
		}

		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('[Resend Webhook] Error processing event:', error)
		return new Response('Internal error', { status: 500 })
	}
}

export const Route = createFileRoute('/api/webhooks/resend')({
	server: {
		handlers: {
			POST: ({ request }) => handleWebhook(request),
		},
	},
})
