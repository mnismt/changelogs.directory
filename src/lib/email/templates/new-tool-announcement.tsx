import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'
import type { CSSProperties } from 'react'
import { baseStyles, colors, fonts, statusStyles } from './styles'

export interface NewToolAnnouncementEmailProps {
	toolName?: string
	toolSlug?: string
	toolLogo?: string
	vendor?: string
	description?: string
}

export function NewToolAnnouncementEmail({
	toolName = 'OpenCode',
	toolSlug = 'opencode',
	toolLogo,
	vendor = 'SST',
	description = 'The open source AI coding agent with free models and multi-provider support',
}: NewToolAnnouncementEmailProps) {
	const previewText = `> NEW_TOOL: ${toolName} by ${vendor} is now on changelogs.directory`
	const toolUrl = `https://changelogs.directory/tools/${toolSlug}`
	const logoUrl =
		toolLogo || `https://changelogs.directory/images/tools/${toolSlug}.png`

	return (
		<Html>
			<Head>
				<style>
					{`
						@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

						@keyframes pulse {
							0%, 100% { opacity: 1; }
							50% { opacity: 0.5; }
						}
					`}
				</style>
			</Head>
			<Preview>{previewText}</Preview>
			<Body style={baseStyles.body}>
				<Container style={baseStyles.container}>
					{/* Header */}
					<Section style={headerStyle}>
						<Text style={logoTextStyle}>
							<span style={logoPromptStyle}>&gt;_</span> changelogs.directory
						</Text>
					</Section>

					{/* Terminal Window */}
					<Section style={baseStyles.terminalWindow}>
						{/* Terminal Header with dots */}
						<Section style={terminalHeaderStyle}>
							<span
								style={{
									...baseStyles.terminalDot,
									backgroundColor: '#FF5F56',
								}}
							/>
							<span
								style={{
									...baseStyles.terminalDot,
									backgroundColor: '#FFBD2E',
								}}
							/>
							<span
								style={{
									...baseStyles.terminalDot,
									backgroundColor: '#27CA40',
								}}
							/>
							<Text style={terminalTitleStyle}>
								changelogs — new-tool — 80x24
							</Text>
						</Section>

						{/* Terminal Body */}
						<Section style={baseStyles.terminalBody}>
							{/* System Output */}
							<Section style={systemOutputStyle}>
								<Text style={commandLineStyle}>
									<span style={promptStyle}>~ %</span> changelogs --add-tool{' '}
									<span style={toolNameHighlightStyle}>{toolSlug}</span>
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Scanning repository...
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Indexing releases...
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Tool added to directory.
								</Text>
							</Section>

							<Hr style={terminalDividerStyle} />

							{/* Status Indicator */}
							<Section style={statusContainerStyle}>
								<table
									cellPadding="0"
									cellSpacing="0"
									style={{ margin: '0 auto' }}
								>
									<tr>
										<td style={statusStyles.ready.container}>
											<span style={statusStyles.ready.text}>
												NEW TOOL DETECTED
											</span>
										</td>
									</tr>
								</table>
							</Section>

							<Hr style={terminalDividerStyle} />

							{/* Tool Info Card with Background */}
							<Section style={toolCardContainerStyle}>
								{/* Background Image */}
								<Img
									src={logoUrl}
									alt=""
									width="600"
									height="300"
									style={toolCardBackgroundStyle}
								/>
								{/* Overlay */}
								<div style={toolCardOverlayStyle} />
								{/* Content */}
								<Section style={toolCardContentStyle}>
									<Text style={toolVendorStyle}>{vendor}</Text>
									<Heading style={toolNameStyle}>{toolName}</Heading>
									<Text style={toolDescriptionStyle}>{description}</Text>
								</Section>
							</Section>

							{/* CTA */}
							<Section style={ctaContainerStyle}>
								<Link href={toolUrl} style={primaryButtonStyle}>
									[ EXPLORE_NOW ]
								</Link>
							</Section>

							{/* Teaser */}
							<Text style={teaserStyle}>
								Track every release. Never miss an update.
							</Text>

							{/* Signature */}
							<Text style={signatureStyle}>
								— Built by{' '}
								<Link href="https://x.com/leodoan_" style={signatureLinkStyle}>
									@leodoan_
								</Link>
							</Text>
						</Section>
					</Section>

					{/* Footer */}
					<Section style={footerContainerStyle}>
						<Text style={footerTextStyle}>
							changelogs.directory • The developer's hub for CLI releases
						</Text>
						<Text style={footerLinksStyle}>
							<Link href="https://changelogs.directory" style={footerLinkStyle}>
								Browse Tools
							</Link>
							<span style={footerDividerStyle}>/</span>
							<Link
								href="https://changelogs.directory/tools"
								style={footerLinkStyle}
							>
								Latest Releases
							</Link>
						</Text>
						<Text style={unsubscribeStyle}>
							Don't want these emails?{' '}
							<Link
								href="https://changelogs.directory/unsubscribe"
								style={unsubscribeLinkStyle}
							>
								Unsubscribe
							</Link>
						</Text>
					</Section>

					{/* Hidden content to prevent Gmail clipping */}
					<Section
						style={
							{
								display: 'none',
								opacity: 0,
								fontSize: '0px',
								lineHeight: '0px',
								maxHeight: '0px',
								msoHide: 'all',
							} as CSSProperties
						}
					>
						{new Date().toISOString()} - {Math.random()}
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

// Custom styles for this template
const headerStyle = {
	textAlign: 'center' as const,
	marginBottom: '24px',
}

const logoTextStyle = {
	fontFamily: fonts.mono,
	fontSize: '16px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0',
}

const logoPromptStyle = {
	color: colors.accentGreen,
}

const terminalHeaderStyle = {
	backgroundColor: colors.bgTertiary,
	padding: '14px 16px',
	borderBottom: `1px solid ${colors.borderSubtle}`,
}

const terminalTitleStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textMuted,
	margin: '0',
	marginLeft: '12px',
	display: 'inline',
}

const systemOutputStyle = {
	marginBottom: '0',
}

const commandLineStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	color: colors.textPrimary,
	margin: '0 0 16px 0',
	lineHeight: '20px',
}

const promptStyle = {
	color: colors.accentGreen,
}

const toolNameHighlightStyle = {
	color: colors.accentCyan,
}

const outputLineStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textSecondary,
	margin: '0 0 6px 0',
	lineHeight: '18px',
}

const dimTextStyle = {
	color: colors.textMuted,
}

const successTextStyle = {
	color: colors.accentGreen,
}

const terminalDividerStyle = {
	borderTop: `1px dashed ${colors.borderSubtle}`,
	margin: '24px 0',
}

const statusContainerStyle = {
	textAlign: 'center' as const,
}

const toolCardContainerStyle = {
	position: 'relative' as const,
	borderRadius: '8px',
	marginBottom: '24px',
	border: `1px solid ${colors.borderSubtle}`,
	overflow: 'hidden',
}

const toolCardBackgroundStyle = {
	position: 'absolute' as const,
	top: '0',
	left: '0',
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
	filter: 'grayscale(100%)',
	opacity: '0.15',
}

const toolCardOverlayStyle = {
	position: 'absolute' as const,
	top: '0',
	left: '0',
	right: '0',
	bottom: '0',
	background: `linear-gradient(to top, ${colors.bgSecondary}, ${colors.bgSecondary}90, ${colors.bgSecondary}50)`,
}

const toolCardContentStyle = {
	position: 'relative' as const,
	padding: '32px 24px',
	textAlign: 'center' as const,
}

const toolVendorStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0 0 8px 0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.1em',
}

const toolNameStyle = {
	fontFamily: fonts.mono,
	fontSize: '32px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0 0 12px 0',
	letterSpacing: '-0.02em',
}

const toolDescriptionStyle = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	color: colors.textSecondary,
	lineHeight: '24px',
	margin: '0',
}

const ctaContainerStyle = {
	textAlign: 'center' as const,
	marginBottom: '24px',
}

const primaryButtonStyle = {
	backgroundColor: colors.textPrimary,
	color: colors.bgPrimary,
	fontFamily: fonts.mono,
	fontSize: '13px',
	fontWeight: '500',
	padding: '14px 28px',
	borderRadius: '6px',
	textDecoration: 'none',
	display: 'inline-block',
	letterSpacing: '0.02em',
}

const teaserStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	color: colors.textMuted,
	margin: '0 0 24px 0',
	textAlign: 'center' as const,
}

const signatureStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	color: colors.textMuted,
	margin: '0',
	textAlign: 'center' as const,
}

const signatureLinkStyle = {
	color: colors.textSecondary,
	textDecoration: 'none',
}

const footerContainerStyle = {
	marginTop: '32px',
	textAlign: 'center' as const,
}

const footerTextStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textMuted,
	margin: '0 0 12px 0',
}

const footerLinksStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	margin: '0 0 16px 0',
}

const footerLinkStyle = {
	color: colors.textSecondary,
	textDecoration: 'none',
}

const footerDividerStyle = {
	color: colors.textMuted,
	margin: '0 8px',
}

const unsubscribeStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textDim,
	margin: '0',
}

const unsubscribeLinkStyle = {
	color: colors.textMuted,
	textDecoration: 'underline',
}

export default NewToolAnnouncementEmail
