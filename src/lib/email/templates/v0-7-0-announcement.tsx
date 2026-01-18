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
import { baseStyles, colors, fonts } from './styles'

export function V070AnnouncementEmail() {
	const previewText = 'Changelogs Weekly is Live — v0.7.0'

	return (
		<Html>
			<Head>
				<style>
					{`
						@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
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
						{/* Terminal Header */}
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
							<Text style={terminalTitleStyle}>announcement — v0.7.0</Text>
						</Section>

						{/* Terminal Body */}
						<Section style={baseStyles.terminalBody}>
							{/* Command */}
							<Text style={commandStyle}>
								<span style={promptStyle}>~ %</span> cat release-notes.md
							</Text>

							{/* Announcement Content */}
							<Heading style={titleStyle}>Changelogs Weekly</Heading>

							<Text style={dateStyle}>2026-01-18 — v0.7.0</Text>

							<Section style={imageContainerStyle}>
								<Img
									src="https://changelogs.directory/changelog-assets/v0.7.0.png"
									alt="Changelogs Weekly Email"
									width="100%"
									style={imageStyle}
								/>
							</Section>

							<Text style={descriptionStyle}>
								Changelogs weekly is live — a weekly inbox digest of recent
								releases.
							</Text>

							<Text style={descriptionStyle}>
								Stay up to date with the latest from your favorite developer
								tools without the noise. Tool-level tracking and customization
								coming soon.
							</Text>

							<Hr style={dividerStyle} />

							{/* CTA */}
							<Section style={ctaContainerStyle}>
								<Link
									href="https://changelogs.directory/changelog"
									style={primaryButtonStyle}
								>
									[ VIEW_FULL_CHANGELOG ]
								</Link>
							</Section>

							{/* Output Line */}
							<Text style={outputStyle}>
								<span style={dimStyle}>{'//'}</span> End of announcement.
							</Text>
						</Section>
					</Section>

					{/* Footer */}
					<Section style={footerContainerStyle}>
						<Text style={footerTextStyle}>
							changelogs.directory • The developer's hub for CLI releases
						</Text>
						<Text style={footerLinksStyle}>
							<Link
								href="https://changelogs.directory/tools"
								style={footerLinkStyle}
							>
								/tools
							</Link>
							<span style={footerDividerStyle}>/</span>
							<Link
								href="https://changelogs.directory/compare"
								style={footerLinkStyle}
							>
								/compare
							</Link>
							<span style={footerDividerStyle}>/</span>
							<Link
								href="https://changelogs.directory/analytics"
								style={footerLinkStyle}
							>
								/analytics
							</Link>
						</Text>
						<Text style={unsubscribeStyle}>
							<Link
								href="https://changelogs.directory/unsubscribe"
								style={unsubscribeLinkStyle}
							>
								Unsubscribe
							</Link>
							<span style={footerDividerStyle}>•</span>
							<Link
								href="https://changelogs.directory/preferences"
								style={unsubscribeLinkStyle}
							>
								Email preferences
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

// Styles
const headerStyle = {
	marginBottom: '24px',
	textAlign: 'center' as const,
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

const commandStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	color: colors.textPrimary,
	margin: '0 0 24px 0',
}

const promptStyle = {
	color: colors.accentGreen,
}

const titleStyle = {
	fontFamily: fonts.mono,
	fontSize: '24px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0 0 8px 0',
}

const dateStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	color: colors.textMuted,
	margin: '0 0 24px 0',
}

const imageContainerStyle = {
	marginBottom: '24px',
	borderRadius: '8px',
	overflow: 'hidden',
	border: `1px solid ${colors.borderSubtle}`,
}

const imageStyle = {
	display: 'block',
	width: '100%',
	maxWidth: '100%',
}

const descriptionStyle = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	lineHeight: '24px',
	color: colors.textSecondary,
	margin: '0 0 16px 0',
}

const dividerStyle = {
	borderTop: `1px dashed ${colors.borderSubtle}`,
	margin: '32px 0',
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

const outputStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textMuted,
	margin: '0',
	textAlign: 'center' as const,
}

const dimStyle = {
	color: colors.textDim,
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

export default V070AnnouncementEmail
