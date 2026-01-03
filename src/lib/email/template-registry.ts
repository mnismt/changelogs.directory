import type { ReactElement } from 'react'
import {
	NewToolAnnouncementEmail,
	type NewToolAnnouncementEmailProps,
} from './templates/new-tool-announcement'
import {
	ReleaseDigestEmail,
	type ReleaseDigestEmailProps,
} from './templates/release-digest'
import {
	ToolReleaseUpdateEmail,
	type ToolReleaseUpdateEmailProps,
} from './templates/tool-release-update'
import { WelcomeEmail, type WelcomeEmailProps } from './templates/welcome'

export type TemplateId =
	| 'new-tool-announcement'
	| 'welcome'
	| 'release-digest'
	| 'tool-release-update'

export interface TemplateDefinition<TProps = Record<string, unknown>> {
	id: TemplateId
	name: string
	description: string
	category: 'announcement' | 'digest' | 'transactional'
	defaultSubject: (props: TProps) => string
	component: (props: TProps) => ReactElement
	defaultProps: TProps
}

export const EMAIL_TEMPLATES: Record<TemplateId, TemplateDefinition> = {
	'new-tool-announcement': {
		id: 'new-tool-announcement',
		name: 'New Tool Announcement',
		description: 'Announce a new tool added to the directory',
		category: 'announcement',
		defaultSubject: (props) =>
			`[changelogs.directory] ${(props as NewToolAnnouncementEmailProps).toolName || 'Tool'} is now available`,
		component: (props) =>
			NewToolAnnouncementEmail(props as NewToolAnnouncementEmailProps),
		defaultProps: {
			toolName: 'Tool Name',
			toolSlug: 'tool-slug',
			vendor: 'Vendor',
			description: 'Tool description',
		} as NewToolAnnouncementEmailProps,
	},
	welcome: {
		id: 'welcome',
		name: 'Welcome Email',
		description: 'Welcome new subscribers to the directory',
		category: 'transactional',
		defaultSubject: () =>
			'[changelogs.directory] Welcome to the Changelog Directory',
		component: (props) => WelcomeEmail(props as WelcomeEmailProps),
		defaultProps: {
			email: 'user@example.com',
		} as WelcomeEmailProps,
	},
	'release-digest': {
		id: 'release-digest',
		name: 'Release Digest',
		description: 'Weekly/periodic digest of tool releases',
		category: 'digest',
		defaultSubject: (props) =>
			`[changelogs.directory] Release Digest - ${(props as ReleaseDigestEmailProps).period || 'This Week'}`,
		component: (props) => ReleaseDigestEmail(props as ReleaseDigestEmailProps),
		defaultProps: {
			period: 'This Week',
			releases: [],
			totalReleases: 0,
			totalTools: 0,
		} as ReleaseDigestEmailProps,
	},
	'tool-release-update': {
		id: 'tool-release-update',
		name: 'Tool Release Update',
		description: 'Notify about a specific tool release',
		category: 'announcement',
		defaultSubject: (props) =>
			`[changelogs.directory] ${(props as ToolReleaseUpdateEmailProps).toolName || 'Tool'} ${(props as ToolReleaseUpdateEmailProps).version || ''} Released`,
		component: (props) =>
			ToolReleaseUpdateEmail(props as ToolReleaseUpdateEmailProps),
		defaultProps: {
			toolName: 'Tool Name',
			toolSlug: 'tool-slug',
			vendor: 'Vendor',
			version: 'v1.0.0',
			releaseDate: new Date().toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			}),
			changes: [],
		} as ToolReleaseUpdateEmailProps,
	},
}

export const TEMPLATE_LIST = Object.values(EMAIL_TEMPLATES)

export function getTemplate(id: TemplateId): TemplateDefinition {
	const template = EMAIL_TEMPLATES[id]
	if (!template) {
		throw new Error(`Template not found: ${id}`)
	}
	return template
}
