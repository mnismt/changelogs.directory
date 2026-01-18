import { render } from '@react-email/components'
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createEmailProvider } from '@/lib/email'
import {
	EMAIL_TEMPLATES,
	TEMPLATE_LIST,
	type TemplateId,
} from '@/lib/email/template-registry'
import { UserRole } from '../lib/auth/types'
import { getSessionFn } from './auth'
import { getPrisma } from './db'

const adminMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) => {
	const session = await getSessionFn()
	if (!session?.user || session.user.role !== UserRole.ADMIN) {
		throw new Error('Unauthorized')
	}
	return next({ context: { session } })
})

export const getWaitlistSubscribers = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		const prisma = getPrisma()
		const subscribers = await prisma.waitlist.findMany({
			where: { isTest: false },
			orderBy: { createdAt: 'desc' },
			select: { id: true, email: true, createdAt: true, isTest: true },
		})
		return { subscribers, total: subscribers.length }
	})

const GetToolBySlugSchema = z.object({
	slug: z.string().min(1),
})

export const getToolBySlug = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.inputValidator(GetToolBySlugSchema)
	.handler(async ({ data }) => {
		const prisma = getPrisma()
		const tool = await prisma.tool.findUnique({
			where: { slug: data.slug },
			select: { name: true, slug: true, vendor: true, description: true },
		})
		if (!tool) throw new Error('Tool not found')
		return tool
	})

export const getEmailTemplates = createServerFn({ method: 'GET' })
	.middleware([adminMiddleware])
	.handler(async () => {
		return TEMPLATE_LIST.map((t) => ({
			id: t.id,
			name: t.name,
			description: t.description,
			category: t.category,
		}))
	})

const RenderTemplatePreviewSchema = z.object({
	templateId: z.string().min(1),
	props: z.record(z.string(), z.any()).optional(),
})

export const renderTemplatePreview = createServerFn({ method: 'POST' })
	.middleware([adminMiddleware])
	.inputValidator(RenderTemplatePreviewSchema)
	.handler(async ({ data }) => {
		const template = EMAIL_TEMPLATES[data.templateId as TemplateId]
		if (!template) throw new Error('Template not found')

		const props = { ...template.defaultProps, ...data.props }
		const html = await render(template.component(props))
		const subject = template.defaultSubject(props)

		return { html, subject }
	})

const SendBroadcastSchema = z.object({
	recipientIds: z.array(z.string()).min(1, 'At least one recipient required'),
	templateId: z.string().min(1, 'Template required'),
	templateProps: z.record(z.string(), z.any()).optional(),
	customSubject: z.string().optional(),
	customFrom: z
		.object({
			email: z.string().email(),
			name: z.string(),
		})
		.optional(),
})

export const sendBroadcast = createServerFn({ method: 'POST' })
	.middleware([adminMiddleware])
	.inputValidator(SendBroadcastSchema)
	.handler(async ({ data }) => {
		const prisma = getPrisma()
		const emailProvider = createEmailProvider()

		const template = EMAIL_TEMPLATES[data.templateId as TemplateId]
		if (!template) throw new Error('Template not found')

		console.log(
			`[Broadcast] Starting broadcast to ${data.recipientIds.length} recipients using template: ${template.name}`,
		)

		const recipients = await prisma.waitlist.findMany({
			where: { id: { in: data.recipientIds } },
			select: { id: true, email: true },
		})
		console.log(`[Broadcast] Fetched ${recipients.length} recipients from DB`)

		const props = { ...template.defaultProps, ...data.templateProps }
		const html = await render(template.component(props))
		const subject = data.customSubject || template.defaultSubject(props)
		console.log(`[Broadcast] Email template rendered, subject: ${subject}`)

		const results = { success: 0, failed: 0, errors: [] as string[] }
		const DELAY_BETWEEN_EMAILS = 500 // 500ms = 2 emails/sec (Resend free tier limit)

		for (let i = 0; i < recipients.length; i++) {
			const recipient = recipients[i]
			console.log(
				`[Broadcast] Sending ${i + 1}/${recipients.length} to ${recipient.email}...`,
			)

			try {
				const result = await emailProvider.sendEmail({
					from: data.customFrom ?? {
						email: 'system@changelogs.directory',
						name: 'Changelogs Directory',
					},
					to: recipient.email,
					subject,
					html,
				})

				if (result.success) {
					results.success++
					console.log(`[Broadcast] ✓ Sent ${i + 1}/${recipients.length}`)
				} else {
					results.failed++
					results.errors.push(result.error || 'Unknown error')
					console.error(
						`[Broadcast] ✗ Failed ${i + 1}/${recipients.length}: ${result.error}`,
					)
				}
			} catch (error) {
				results.failed++
				const errorMsg = error instanceof Error ? error.message : String(error)
				results.errors.push(errorMsg)
				console.error(
					`[Broadcast] ✗ Exception ${i + 1}/${recipients.length}: ${errorMsg}`,
				)
			}

			// Wait before next email (except for last one)
			if (i < recipients.length - 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, DELAY_BETWEEN_EMAILS),
				)
			}
		}

		console.log(
			`[Broadcast] Complete: ${results.success}/${recipients.length} sent, ${results.failed} failed`,
		)
		return results
	})
