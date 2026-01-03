import { render } from '@react-email/components'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createEmailProvider } from '@/lib/email'
import { NewToolAnnouncementEmail } from '@/lib/email/templates/new-tool-announcement'
import { ReleaseDigestEmail } from '@/lib/email/templates/release-digest'
import { ToolReleaseUpdateEmail } from '@/lib/email/templates/tool-release-update'
import { WelcomeEmail } from '@/lib/email/templates/welcome'

const emailProvider = createEmailProvider()

const TestEmailSchema = z.object({
	template: z.enum([
		'welcome',
		'tool-release-update',
		'release-digest',
		'new-tool-announcement',
	]),
	to: z.string().email(),
	data: z.record(z.string(), z.any()).optional(),
})

export const sendTestEmail = createServerFn({ method: 'POST' })
	.inputValidator(TestEmailSchema)
	.handler(async ({ data }) => {
		const { template, to, data: templateData } = data

		try {
			let html = ''
			let subject = ''

			if (template === 'welcome') {
				html = await render(WelcomeEmail({ email: to }))
				subject = 'Welcome to changelogs.directory'
			} else if (template === 'tool-release-update') {
				const { toolName, version } = templateData || {}
				html = await render(ToolReleaseUpdateEmail(templateData || {}))
				subject =
					toolName && version
						? `[changelogs.directory] ${toolName} ${version} is available`
						: '[changelogs.directory] New Release Available'
			} else if (template === 'release-digest') {
				html = await render(ReleaseDigestEmail(templateData || {}))
				subject = '[changelogs.directory] - Weekly Release Digest'
			} else if (template === 'new-tool-announcement') {
				const { toolName } = templateData || {}
				html = await render(
					NewToolAnnouncementEmail({
						toolName: (toolName as string) || 'OpenCode',
						toolSlug: (templateData?.toolSlug as string) || 'opencode',
						vendor: (templateData?.vendor as string) || 'SST',
						description:
							(templateData?.description as string) ||
							'The open source AI coding agent with free models and multi-provider support',
					}),
				)
				subject = `[changelogs.directory] New Tool: ${(toolName as string) || 'OpenCode'} is now available`
			}

			if (!html) {
				throw new Error(`Template ${template} not implemented`)
			}

			await emailProvider.sendEmail({
				from: {
					email: 'system@changelogs.directory', // Default sender
					name: 'Changelogs Directory',
				},
				to,
				subject,
				html,
			})

			return { success: true }
		} catch (error) {
			console.error('Failed to send test email:', error)
			return { success: false, error: String(error) }
		}
	})
