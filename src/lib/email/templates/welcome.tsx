import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'
import { baseStyles, colors, fonts, statusStyles } from './styles'

export interface WelcomeEmailProps {
	email?: string
}

export function WelcomeEmail({
	email = 'developer@example.com',
}: WelcomeEmailProps) {
	const previewText = '> SYSTEM_INIT: Welcome to changelogs.directory'

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
							<Text style={terminalTitleStyle}>changelogs — -zsh — 80x24</Text>
						</Section>

						{/* Terminal Body */}
						<Section style={baseStyles.terminalBody}>
							{/* Boot Sequence Animation */}
							<Section style={bootSequenceStyle}>
								<Text style={commandLineStyle}>
									<span style={promptStyle}>~ %</span> subscribe --email=
									<span style={emailHighlightStyle}>{email}</span>
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Initializing
									subscription...
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Validating email
									address...
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Adding to notification
									queue...
								</Text>
								<Text style={outputLineStyle}>
									<span style={dimTextStyle}>[</span>
									<span style={successTextStyle}>✓</span>
									<span style={dimTextStyle}>]</span> Subscription complete.
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
												SUBSCRIPTION: ACTIVE
											</span>
										</td>
									</tr>
								</table>
							</Section>

							<Hr style={terminalDividerStyle} />

							{/* Welcome Message */}
							<Heading style={welcomeHeadingStyle}>
								Welcome to the Directory
							</Heading>
							<Text style={welcomeSubheadingStyle}>
								{'// Your changelog intel hub is now active'}
							</Text>

							<Text style={bodyTextStyle}>
								You're now subscribed to receive curated updates from the
								developer tools you care about. No noise, no spam — just the
								changes that matter.
							</Text>

							{/* What You'll Get Section */}
							<Section style={featureBoxStyle}>
								<Text style={featureHeaderStyle}>
									$ cat ~/.config/notifications
								</Text>
								<table
									cellPadding="0"
									cellSpacing="0"
									style={{ width: '100%' }}
								>
									<tr>
										<td style={featureItemStyle}>
											<span style={bulletStyle}>→</span>
											<span style={featureLabelStyle}>NEW_TOOLS</span>
											<span style={featureDescStyle}>
												Fresh additions to the directory
											</span>
										</td>
									</tr>
									<tr>
										<td style={featureItemStyle}>
											<span style={bulletStyle}>→</span>
											<span style={featureLabelStyle}>MAJOR_RELEASES</span>
											<span style={featureDescStyle}>
												Significant version updates
											</span>
										</td>
									</tr>
									<tr>
										<td style={featureItemStyle}>
											<span style={bulletStyle}>→</span>
											<span style={featureLabelStyle}>BREAKING_CHANGES</span>
											<span style={featureDescStyle}>
												Critical migration alerts
											</span>
										</td>
									</tr>
								</table>
							</Section>

							{/* CTA */}
							<Section style={ctaContainerStyle}>
								<Link
									href="https://changelogs.directory"
									style={primaryButtonStyle}
								>
									[ OPEN_DIRECTORY ]
								</Link>
							</Section>

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
				</Container>
			</Body>
		</Html>
	)
}

// Custom styles for this template
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

const bootSequenceStyle = {
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

const emailHighlightStyle = {
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

const welcomeHeadingStyle = {
	fontFamily: fonts.mono,
	fontSize: '28px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0 0 8px 0',
	letterSpacing: '-0.02em',
	textAlign: 'center' as const,
}

const welcomeSubheadingStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	color: colors.textMuted,
	margin: '0 0 24px 0',
	textAlign: 'center' as const,
}

const bodyTextStyle = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	color: colors.textSecondary,
	lineHeight: '24px',
	margin: '0 0 24px 0',
	textAlign: 'center' as const,
}

const featureBoxStyle = {
	backgroundColor: colors.bgTertiary,
	borderRadius: '8px',
	padding: '20px',
	marginBottom: '24px',
	border: `1px solid ${colors.borderSubtle}`,
}

const featureHeaderStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textMuted,
	margin: '0 0 16px 0',
}

const featureItemStyle = {
	padding: '8px 0',
	borderBottom: `1px solid ${colors.borderSubtle}`,
}

const bulletStyle = {
	fontFamily: fonts.mono,
	color: colors.accentGreen,
	marginRight: '8px',
}

const featureLabelStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	fontWeight: '500',
	color: colors.textPrimary,
	marginRight: '12px',
	letterSpacing: '0.02em',
}

const featureDescStyle = {
	fontFamily: fonts.sans,
	fontSize: '13px',
	color: colors.textMuted,
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

export default WelcomeEmail
