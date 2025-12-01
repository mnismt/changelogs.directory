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
import { baseStyles, colors, fonts } from './styles'

interface ChangelogItem {
	title: string
	description?: string
	type: 'feature' | 'fix' | 'improvement' | 'breaking'
}

export interface ToolReleaseUpdateEmailProps {
	toolName?: string
	toolSlug?: string
	toolLogo?: string
	vendor?: string
	version?: string
	releaseDate?: string
	changes?: ChangelogItem[]
	migrationGuideUrl?: string
}

const defaultChanges: ChangelogItem[] = [
	{
		title: 'Added support for custom system prompts',
		description:
			'You can now define custom system prompts in your configuration file.',
		type: 'feature',
	},
	{
		title: 'Improved context window handling',
		description:
			'The context window is now managed more efficiently, allowing for larger inputs.',
		type: 'improvement',
	},
	{
		title: 'Fixed crash on startup with specific configs',
		type: 'fix',
	},
]

export function ToolReleaseUpdateEmail({
	toolName = 'Claude Code',
	toolSlug = 'claude-code',
	toolLogo = 'https://changelogs.directory/images/tools/claude-code.png',
	vendor = 'Anthropic',
	version = 'v3.0.0',
	releaseDate = 'Nov 27, 2025',
	changes = defaultChanges,
}: ToolReleaseUpdateEmailProps) {
	const previewText = `🚀 New Release: ${toolName} ${version} is out now`

	const features = changes.filter((c) => c.type === 'feature')
	const improvements = changes.filter((c) => c.type === 'improvement')
	const fixes = changes.filter((c) => c.type === 'fix')
	const breaking = changes.filter((c) => c.type === 'breaking')

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
							<Text style={terminalTitleStyle}>
								release — {version} — latest
							</Text>
						</Section>

						{/* Terminal Body */}
						<Section style={baseStyles.terminalBody}>
							{/* System Output */}
							<Section style={systemOutputStyle}>
								<Text style={outputLineStyle}>
									<span style={timestampStyle}>
										[{new Date().toISOString().split('T')[0]}]
									</span>
									<span style={infoLevelStyle}> [INFO]</span> New release
									detected
								</Text>
								<Text style={outputLineStyle}>
									<span style={timestampStyle}>
										[{new Date().toISOString().split('T')[0]}]
									</span>
									<span style={infoLevelStyle}> [INFO]</span> Tool: {toolName}
								</Text>
								<Text style={outputLineStyle}>
									<span style={timestampStyle}>
										[{new Date().toISOString().split('T')[0]}]
									</span>
									<span style={infoLevelStyle}> [INFO]</span> Version: {version}
								</Text>
							</Section>

							<Hr style={dividerStyle} />

							{/* Tool Info Card */}
							<Section style={toolCardStyle}>
								<Row>
									<Column style={toolLogoColumnStyle}>
										{toolLogo && (
											<Img
												src={toolLogo}
												alt={toolName}
												width="48"
												height="48"
												style={toolLogoStyle}
											/>
										)}
									</Column>
									<Column style={toolInfoColumnStyle}>
										<Text style={toolNameStyle}>{toolName}</Text>
										<Text style={toolVendorStyle}>{vendor}</Text>
									</Column>
									<Column style={versionInfoColumnStyle}>
										<Text style={versionLabelStyle}>NEW VERSION</Text>
										<Text style={versionValueStyle}>{version}</Text>
										<Text style={releaseDateStyle}>{releaseDate}</Text>
									</Column>
								</Row>
							</Section>

							{/* Stats */}
							<Section style={statsStyle}>
								<Row>
									{features.length > 0 && (
										<Column style={statColumnStyle}>
											<Text style={statNumberStyle}>{features.length}</Text>
											<Text style={statLabelStyle}>Features</Text>
										</Column>
									)}
									{improvements.length > 0 && (
										<Column style={statColumnStyle}>
											<Text style={statNumberStyle}>{improvements.length}</Text>
											<Text style={statLabelStyle}>Improvements</Text>
										</Column>
									)}
									{fixes.length > 0 && (
										<Column style={statColumnStyle}>
											<Text style={statNumberStyle}>{fixes.length}</Text>
											<Text style={statLabelStyle}>Fixes</Text>
										</Column>
									)}
									{breaking.length > 0 && (
										<Column style={statColumnStyle}>
											<Text
												style={{ ...statNumberStyle, color: colors.accentRed }}
											>
												{breaking.length}
											</Text>
											<Text style={statLabelStyle}>Breaking</Text>
										</Column>
									)}
								</Row>
							</Section>

							<Hr style={dividerStyle} />

							{/* Changelog */}
							<Heading style={sectionHeadingStyle}>
								$ cat RELEASE_NOTES.md
							</Heading>

							<Section style={changesContainerStyle}>
								{changes.map((change, idx) => (
									<Section
										key={`change-${change.title.slice(0, 20)}-${idx}`}
										style={changeItemStyle}
									>
										{' '}
										<Row>
											<Column style={changeTypeColumnStyle}>
												<Text
													style={{
														...badgeStyle,
														...(change.type === 'feature'
															? featureBadgeStyle
															: change.type === 'fix'
																? fixBadgeStyle
																: change.type === 'breaking'
																	? breakingBadgeStyle
																	: improvementBadgeStyle),
													}}
												>
													{change.type.toUpperCase()}
												</Text>
											</Column>
											<Column>
												<Text style={changeTitleStyle}>{change.title}</Text>
												{change.description && (
													<Text style={changeDescriptionStyle}>
														{change.description}
													</Text>
												)}
											</Column>
										</Row>
									</Section>
								))}
							</Section>

							<Hr style={dividerStyle} />

							{/* Action */}
							<Section style={actionBoxStyle}>
								<Row style={actionButtonsStyle}>
									<Column style={buttonColumnStyle}>
										<Link
											href={`https://changelogs.directory/tools/${toolSlug}/releases/${version}`}
											style={primaryButtonStyle}
										>
											[ VIEW_FULL_CHANGELOG ]
										</Link>
									</Column>
								</Row>
							</Section>

							{/* Output */}
							<Text style={footerOutputStyle}>
								<span style={dimStyle}>{'//'}</span> Stay updated with the
								latest tools and versions.
							</Text>
						</Section>
					</Section>

					{/* Footer */}
					<Section style={footerContainerStyle}>
						<Text style={footerTextStyle}>
							changelogs.directory • Release updates
						</Text>
						<Text style={footerLinksStyle}>
							<Link
								href="https://changelogs.directory/preferences"
								style={footerLinkStyle}
							>
								Manage preferences
							</Link>
							<span style={footerDividerStyle}>•</span>
							<Link
								href="https://changelogs.directory/unsubscribe"
								style={footerLinkStyle}
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
	color: colors.accentCyan,
	margin: '0',
	marginLeft: '0', // Adjusted from 12px to 0 as dots are removed
	display: 'inline',
}

const systemOutputStyle = {
	marginBottom: '0',
}

const outputLineStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textSecondary,
	margin: '0 0 4px 0',
	lineHeight: '18px',
}

const timestampStyle = {
	color: colors.textMuted,
}

const infoLevelStyle = {
	color: colors.accentCyan,
}

const dividerStyle = {
	borderTop: `1px dashed ${colors.borderSubtle}`,
	margin: '20px 0',
}

const toolCardStyle = {
	backgroundColor: colors.bgTertiary,
	borderRadius: '8px',
	padding: '20px',
	border: `1px solid ${colors.borderSubtle}`,
}

const toolLogoColumnStyle = {
	width: '60px',
	verticalAlign: 'top' as const,
}

const toolLogoStyle = {
	borderRadius: '10px',
	border: `1px solid ${colors.borderSubtle}`,
}

const toolInfoColumnStyle = {
	verticalAlign: 'top' as const,
	paddingLeft: '4px',
}

const toolNameStyle = {
	fontFamily: fonts.mono,
	fontSize: '18px',
	fontWeight: '600',
	color: colors.textPrimary,
	margin: '0 0 4px 0',
}

const toolVendorStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textMuted,
	margin: '0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.05em',
}

const versionInfoColumnStyle = {
	textAlign: 'right' as const,
	verticalAlign: 'top' as const,
}

const versionLabelStyle = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	color: colors.textMuted,
	margin: '0 0 4px 0',
	letterSpacing: '0.05em',
}

const versionValueStyle = {
	fontFamily: fonts.mono,
	fontSize: '16px',
	fontWeight: '600',
	color: colors.accentCyan,
	margin: '0 0 2px 0',
}

const releaseDateStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0',
}

const statsStyle = {
	padding: '16px 0',
}

const statColumnStyle = {
	textAlign: 'center' as const,
}

const statNumberStyle = {
	fontFamily: fonts.mono,
	fontSize: '24px',
	fontWeight: '700',
	color: colors.textPrimary,
	margin: '0 0 4px 0',
}

const statLabelStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.05em',
}

const sectionHeadingStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	fontWeight: '400',
	color: colors.textMuted,
	margin: '0 0 16px 0',
}

const changesContainerStyle = {
	marginBottom: '8px',
}

const changeItemStyle = {
	marginBottom: '16px',
}

const changeTypeColumnStyle = {
	width: '100px',
	verticalAlign: 'top' as const,
}

const badgeStyle = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	fontWeight: '500',
	padding: '3px 8px',
	borderRadius: '4px',
	margin: '0',
	display: 'inline-block',
	letterSpacing: '0.05em',
}

const featureBadgeStyle = {
	backgroundColor: 'rgba(34, 197, 94, 0.15)',
	color: colors.accentGreen,
	border: `1px solid rgba(34, 197, 94, 0.25)`,
}

const fixBadgeStyle = {
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

const changeTitleStyle = {
	fontFamily: fonts.sans,
	fontSize: '14px',
	fontWeight: '500',
	color: colors.textPrimary,
	margin: '0 0 4px 0',
	lineHeight: '20px',
}

const changeDescriptionStyle = {
	fontFamily: fonts.sans,
	fontSize: '13px',
	color: colors.textSecondary,
	margin: '0',
	lineHeight: '20px',
}

const actionBoxStyle = {
	textAlign: 'center' as const,
	marginBottom: '20px',
}

const actionButtonsStyle = {
	marginTop: '0',
}

const buttonColumnStyle = {
	textAlign: 'center' as const,
}

const primaryButtonStyle = {
	backgroundColor: colors.textPrimary,
	color: colors.bgPrimary,
	fontFamily: fonts.mono,
	fontSize: '12px',
	fontWeight: '500',
	padding: '12px 20px',
	borderRadius: '6px',
	textDecoration: 'none',
	display: 'inline-block',
	letterSpacing: '0.02em',
}

const footerOutputStyle = {
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
	fontSize: '11px',
	margin: '0',
}

const footerLinkStyle = {
	color: colors.textSecondary,
	textDecoration: 'underline',
}

const footerDividerStyle = {
	color: colors.textMuted,
	margin: '0 8px',
}

export default ToolReleaseUpdateEmail
