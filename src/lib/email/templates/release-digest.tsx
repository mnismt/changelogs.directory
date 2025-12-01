import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from '@react-email/components'
import { baseStyles, colors, fonts, releaseCardStyles } from './styles'

interface ReleaseItem {
	toolName: string
	toolSlug: string
	toolLogo?: string
	vendor: string
	version: string
	releaseDate: string
	headline: string
	changeCount: number
	features: number
	bugfixes: number
	breaking: number
	improvements: number
}

export interface ReleaseDigestEmailProps {
	period?: string
	releases?: ReleaseItem[]
	totalReleases?: number
	totalTools?: number
}

const defaultReleases: ReleaseItem[] = [
	{
		toolName: 'Claude Code',
		toolSlug: 'claude-code',
		toolLogo: 'https://changelogs.directory/images/tools/claude-code.png',
		vendor: 'Anthropic',
		version: 'v2.0.50',
		releaseDate: 'Nov 22, 2025',
		headline:
			'Fixes MCP tool nested reference calls, silences noisy upgrade errors, and improves warning clarity.',
		changeCount: 4,
		features: 0,
		bugfixes: 1,
		breaking: 0,
		improvements: 3,
	},
	{
		toolName: 'Cursor',
		toolSlug: 'cursor',
		toolLogo: 'https://changelogs.directory/images/tools/cursor.png',
		vendor: 'Anysphere',
		version: 'v2.1',
		releaseDate: 'Nov 22, 2025',
		headline:
			'Enhances Plan Mode with interactive UI, adds AI Code Reviews, and introduces instant grep.',
		changeCount: 3,
		features: 1,
		bugfixes: 0,
		breaking: 0,
		improvements: 1,
	},
	{
		toolName: 'Codex',
		toolSlug: 'codex',
		toolLogo: 'https://changelogs.directory/images/tools/codex.png',
		vendor: 'OpenAI',
		version: 'v0.1.2504181605',
		releaseDate: 'Nov 20, 2025',
		headline:
			'Adds support for custom system prompts and improves context window handling.',
		changeCount: 5,
		features: 2,
		bugfixes: 1,
		breaking: 0,
		improvements: 2,
	},
]

export function ReleaseDigestEmail({
	period = 'This Week',
	releases = defaultReleases,
	totalReleases = 12,
	totalTools = 3,
}: ReleaseDigestEmailProps) {
	const previewText = `> ${totalReleases} new releases from ${totalTools} tools — ${period}`

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
							<Text style={terminalTitleStyle}>
								digest — weekly — {period.toLowerCase()}
							</Text>
						</Section>

						{/* Terminal Body */}
						<Section style={baseStyles.terminalBody}>
							{/* Command */}
							<Text style={commandStyle}>
								<span style={promptStyle}>~ %</span> view releases --period="
								{period.toLowerCase()}"
							</Text>

							{/* Stats Bar */}
							<Section style={statsBarStyle}>
								<Row>
									<Column style={statItemStyle}>
										<Text style={statLabelStyle}>RELEASES</Text>
										<Text style={statValueStyle}>{totalReleases}</Text>
									</Column>
									<Column style={statDividerStyle}>
										<Text style={statDividerTextStyle}>|</Text>
									</Column>
									<Column style={statItemStyle}>
										<Text style={statLabelStyle}>TOOLS</Text>
										<Text style={statValueStyle}>{totalTools}</Text>
									</Column>
									<Column style={statDividerStyle}>
										<Text style={statDividerTextStyle}>|</Text>
									</Column>
									<Column style={statItemStyle}>
										<Text style={statLabelStyle}>PERIOD</Text>
										<Text style={statValueStyle}>{period.toUpperCase()}</Text>
									</Column>
								</Row>
							</Section>

							<Hr style={dividerStyle} />

							{/* Digest Title */}
							<Heading style={digestTitleStyle}>Release Digest</Heading>
							<Text style={digestSubtitleStyle}>
								{'// Curated changelog updates from your tracked tools'}
							</Text>

							{/* Release Cards */}
							<Section style={releasesContainerStyle}>
								{releases.map((release) => (
									<Section
										key={`${release.toolSlug}-${release.version}`}
										style={releaseCardStyle}
									>
										{/* Tool Header */}
										<Row style={toolHeaderStyle}>
											<Column style={toolLogoColumnStyle}>
												{release.toolLogo && (
													<Img
														src={release.toolLogo}
														alt={release.toolName}
														width="36"
														height="36"
														style={toolLogoStyle}
													/>
												)}
											</Column>
											<Column style={toolInfoColumnStyle}>
												<Text style={toolNameStyle}>{release.toolName}</Text>
												<Text style={toolVendorStyle}>{release.vendor}</Text>
											</Column>
											<Column style={versionColumnStyle}>
												<Text style={versionStyle}>{release.version}</Text>
												<Text style={releaseDateStyle}>
													{release.releaseDate}
												</Text>
											</Column>
										</Row>

										{/* Headline */}
										<Text style={headlineStyle}>
											<span style={headlinePrefixStyle}>$</span>{' '}
											{release.headline}
										</Text>

										{/* Change Badges */}
										<Row style={badgesRowStyle}>
											<Column>
												<Text style={badgesTextStyle}>
													<span style={changeCountStyle}>
														{release.changeCount} changes
													</span>
													{release.features > 0 && (
														<span
															style={{ ...badgeStyle, ...featureBadgeStyle }}
														>
															{release.features} feature
															{release.features > 1 ? 's' : ''}
														</span>
													)}
													{release.bugfixes > 0 && (
														<span
															style={{ ...badgeStyle, ...bugfixBadgeStyle }}
														>
															{release.bugfixes} fix
															{release.bugfixes > 1 ? 'es' : ''}
														</span>
													)}
													{release.improvements > 0 && (
														<span
															style={{
																...badgeStyle,
																...improvementBadgeStyle,
															}}
														>
															{release.improvements} improvement
															{release.improvements > 1 ? 's' : ''}
														</span>
													)}
													{release.breaking > 0 && (
														<span
															style={{ ...badgeStyle, ...breakingBadgeStyle }}
														>
															{release.breaking} breaking
														</span>
													)}
												</Text>
											</Column>
										</Row>

										{/* View Link */}
										<Link
											href={`https://changelogs.directory/tools/${release.toolSlug}/releases/${release.version}`}
											style={viewLinkStyle}
										>
											Read full changelog →
										</Link>
									</Section>
								))}
							</Section>

							<Hr style={dividerStyle} />

							{/* CTA */}
							<Section style={ctaContainerStyle}>
								<Link
									href="https://changelogs.directory"
									style={primaryButtonStyle}
								>
									[ VIEW_ALL_RELEASES ]
								</Link>
							</Section>

							{/* Output Line */}
							<Text style={outputStyle}>
								<span style={dimStyle}>{'//'}</span> End of digest. Stay
								updated.
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
	margin: '0 0 20px 0',
}

const promptStyle = {
	color: colors.accentGreen,
}

const statsBarStyle = {
	backgroundColor: colors.bgTertiary,
	borderRadius: '6px',
	padding: '16px',
	border: `1px solid ${colors.borderSubtle}`,
}

const statItemStyle = {
	textAlign: 'center' as const,
}

const statLabelStyle = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	color: colors.textMuted,
	margin: '0 0 4px 0',
	letterSpacing: '0.05em',
}

const statValueStyle = {
	fontFamily: fonts.mono,
	fontSize: '18px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0',
}

const statDividerStyle = {
	width: '1px',
	textAlign: 'center' as const,
}

const statDividerTextStyle = {
	fontFamily: fonts.mono,
	fontSize: '18px',
	color: colors.borderSubtle,
	margin: '0',
}

const dividerStyle = {
	borderTop: `1px dashed ${colors.borderSubtle}`,
	margin: '24px 0',
}

const digestTitleStyle = {
	fontFamily: fonts.mono,
	fontSize: '22px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0 0 4px 0',
	textAlign: 'center' as const,
}

const digestSubtitleStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textMuted,
	margin: '0 0 24px 0',
	textAlign: 'center' as const,
}

const releasesContainerStyle = {
	marginBottom: '8px',
}

const releaseCardStyle = {
	...releaseCardStyles.card,
	marginBottom: '16px',
}

const toolHeaderStyle = {
	marginBottom: '12px',
}

const toolLogoColumnStyle = {
	width: '48px',
	verticalAlign: 'top' as const,
}

const toolLogoStyle = {
	borderRadius: '8px',
	border: `1px solid ${colors.borderSubtle}`,
	objectFit: 'cover' as const,
}

const toolInfoColumnStyle = {
	verticalAlign: 'top' as const,
	paddingLeft: '4px',
}

const toolNameStyle = {
	fontFamily: fonts.mono,
	fontSize: '15px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0 0 2px 0',
}

const toolVendorStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.05em',
}

const versionColumnStyle = {
	textAlign: 'right' as const,
	verticalAlign: 'top' as const,
}

const versionStyle = {
	fontFamily: fonts.mono,
	fontSize: '14px',
	fontWeight: '500',
	color: colors.accentCyan,
	margin: '0 0 2px 0',
}

const releaseDateStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0',
}

const headlineStyle = {
	fontFamily: fonts.sans,
	fontSize: '14px',
	color: colors.textSecondary,
	lineHeight: '22px',
	margin: '0 0 12px 0',
}

const headlinePrefixStyle = {
	color: colors.accentGreen,
	fontFamily: fonts.mono,
}

const badgesRowStyle = {
	marginBottom: '12px',
}

const badgesTextStyle = {
	margin: '0',
	lineHeight: '24px',
}

const changeCountStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	marginRight: '12px',
}

const badgeStyle = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	fontWeight: '500',
	padding: '3px 8px',
	borderRadius: '4px',
	marginRight: '6px',
	letterSpacing: '0.02em',
}

const featureBadgeStyle = {
	backgroundColor: 'rgba(34, 197, 94, 0.15)',
	color: colors.accentGreen,
	border: `1px solid rgba(34, 197, 94, 0.25)`,
}

const bugfixBadgeStyle = {
	backgroundColor: 'rgba(6, 182, 212, 0.15)',
	color: colors.accentCyan,
	border: `1px solid rgba(6, 182, 212, 0.25)`,
}

const improvementBadgeStyle = {
	backgroundColor: 'rgba(249, 115, 22, 0.15)',
	color: colors.accentOrange,
	border: `1px solid rgba(249, 115, 22, 0.25)`,
}

const breakingBadgeStyle = {
	backgroundColor: 'rgba(239, 68, 68, 0.15)',
	color: colors.accentRed,
	border: `1px solid rgba(239, 68, 68, 0.25)`,
}

const viewLinkStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textSecondary,
	textDecoration: 'none',
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

export default ReleaseDigestEmail
