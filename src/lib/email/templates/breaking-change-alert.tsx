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

interface BreakingChange {
	title: string
	description?: string
	impact?: 'high' | 'medium' | 'low'
}

export interface BreakingChangeAlertEmailProps {
	toolName?: string
	toolSlug?: string
	toolLogo?: string
	vendor?: string
	version?: string
	releaseDate?: string
	breakingChanges?: BreakingChange[]
	migrationGuideUrl?: string
}

const defaultBreakingChanges: BreakingChange[] = [
	{
		title: 'Removed deprecated --legacy-mode flag',
		description:
			'The --legacy-mode flag has been removed. Use --compatibility=v1 instead.',
		impact: 'high',
	},
	{
		title: 'Changed default output format from JSON to YAML',
		description:
			'Output format now defaults to YAML. Add --format=json to restore previous behavior.',
		impact: 'medium',
	},
	{
		title: 'Minimum Node.js version bumped to 20.x',
		description:
			'Node.js 18.x is no longer supported. Please upgrade to Node.js 20 or later.',
		impact: 'high',
	},
]

export function BreakingChangeAlertEmail({
	toolName = 'Claude Code',
	toolSlug = 'claude-code',
	toolLogo = 'https://changelogs.directory/images/tools/claude-code.png',
	vendor = 'Anthropic',
	version = 'v3.0.0',
	releaseDate = 'Nov 27, 2025',
	breakingChanges = defaultBreakingChanges,
	migrationGuideUrl = 'https://changelogs.directory/tools/claude-code/releases/v3.0.0#migration',
}: BreakingChangeAlertEmailProps) {
	const previewText = `⚠️ BREAKING: ${toolName} ${version} contains ${breakingChanges.length} breaking change${breakingChanges.length > 1 ? 's' : ''}`

	return (
		<Html>
			<Head>
				<style>
					{`
						@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
						
						@keyframes pulse {
							0%, 100% { opacity: 1; }
							50% { opacity: 0.6; }
						}
					`}
				</style>
			</Head>
			<Preview>{previewText}</Preview>
			<Body style={baseStyles.body}>
				<Container style={baseStyles.container}>
					{/* Alert Banner */}
					<Section style={alertBannerStyle}>
						<Row>
							<Column style={alertIconColumnStyle}>
								<Text style={alertIconStyle}>⚠</Text>
							</Column>
							<Column>
								<Text style={alertTextStyle}>BREAKING_CHANGE_DETECTED</Text>
								<Text style={alertSubtextStyle}>Action may be required</Text>
							</Column>
						</Row>
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
								alert — breaking-change — URGENT
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
									<span style={errorLevelStyle}> [WARN]</span> Breaking change
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

							{/* Breaking Changes Count */}
							<Section style={breakingCountStyle}>
								<Text style={breakingCountTextStyle}>
									<span style={breakingNumberStyle}>
										{breakingChanges.length}
									</span>
									<span style={breakingLabelStyle}>
										{' '}
										BREAKING CHANGE{breakingChanges.length > 1 ? 'S' : ''}{' '}
										DETECTED
									</span>
								</Text>
							</Section>

							<Hr style={dividerStyle} />

							{/* Breaking Changes List */}
							<Heading style={sectionHeadingStyle}>
								$ cat BREAKING_CHANGES.md
							</Heading>

							<Section style={changesContainerStyle}>
								{breakingChanges.map((change, idx) => (
									<Section
										key={`breaking-${change.title.slice(0, 20)}-${idx}`}
										style={changeItemStyle}
									>
										<Row style={changeHeaderStyle}>
											<Column style={changeIndexColumnStyle}>
												<Text style={changeIndexStyle}>#{idx + 1}</Text>
											</Column>
											<Column style={changeImpactColumnStyle}>
												{change.impact && (
													<Text
														style={{
															...impactBadgeStyle,
															...(change.impact === 'high'
																? impactHighStyle
																: change.impact === 'medium'
																	? impactMediumStyle
																	: impactLowStyle),
														}}
													>
														{change.impact.toUpperCase()}
													</Text>
												)}
											</Column>
										</Row>
										<Text style={changeTitleStyle}>
											<span style={breakingPrefixStyle}>!</span> {change.title}
										</Text>
										{change.description && (
											<Text style={changeDescriptionStyle}>
												{change.description}
											</Text>
										)}
									</Section>
								))}
							</Section>

							<Hr style={dividerStyle} />

							{/* Action Required */}
							<Section style={actionBoxStyle}>
								<Text style={actionHeaderStyle}>
									<span style={actionIconStyle}>→</span> ACTION_REQUIRED
								</Text>
								<Text style={actionTextStyle}>
									Review the breaking changes above before upgrading. Check your
									codebase for affected patterns and update accordingly.
								</Text>
								<Row style={actionButtonsStyle}>
									<Column style={buttonColumnStyle}>
										<Link
											href={`https://changelogs.directory/tools/${toolSlug}/releases/${version}`}
											style={primaryButtonStyle}
										>
											[ VIEW_FULL_CHANGELOG ]
										</Link>
									</Column>
									{migrationGuideUrl && (
										<Column style={buttonColumnStyle}>
											<Link
												href={migrationGuideUrl}
												style={secondaryButtonStyle}
											>
												[ MIGRATION_GUIDE ]
											</Link>
										</Column>
									)}
								</Row>
							</Section>

							{/* Output */}
							<Text style={footerOutputStyle}>
								<span style={dimStyle}>{'//'}</span> Stay ahead of breaking
								changes. Review before you upgrade.
							</Text>
						</Section>
					</Section>

					{/* Footer */}
					<Section style={footerContainerStyle}>
						<Text style={footerTextStyle}>
							changelogs.directory • Breaking change alerts
						</Text>
						<Text style={footerLinksStyle}>
							<Link
								href="https://changelogs.directory/preferences"
								style={footerLinkStyle}
							>
								Manage alert preferences
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
const alertBannerStyle = {
	backgroundColor: 'rgba(239, 68, 68, 0.15)',
	border: `1px solid rgba(239, 68, 68, 0.3)`,
	borderRadius: '8px',
	padding: '16px 20px',
	marginBottom: '20px',
}

const alertIconColumnStyle = {
	width: '48px',
	verticalAlign: 'middle' as const,
}

const alertIconStyle = {
	fontSize: '28px',
	margin: '0',
	lineHeight: '1',
}

const alertTextStyle = {
	fontFamily: fonts.mono,
	fontSize: '14px',
	fontWeight: '600',
	color: colors.accentRed,
	margin: '0 0 2px 0',
	letterSpacing: '0.02em',
}

const alertSubtextStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.textSecondary,
	margin: '0',
}

const terminalHeaderStyle = {
	backgroundColor: colors.bgTertiary,
	padding: '14px 16px',
	borderBottom: `1px solid ${colors.borderSubtle}`,
}

const terminalTitleStyle = {
	fontFamily: fonts.mono,
	fontSize: '12px',
	color: colors.accentYellow,
	margin: '0',
	marginLeft: '12px',
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

const errorLevelStyle = {
	color: colors.accentYellow,
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
	color: colors.accentRed,
	margin: '0 0 2px 0',
}

const releaseDateStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0',
}

const breakingCountStyle = {
	textAlign: 'center' as const,
	padding: '16px 0',
}

const breakingCountTextStyle = {
	margin: '0',
}

const breakingNumberStyle = {
	fontFamily: fonts.mono,
	fontSize: '36px',
	fontWeight: '700',
	color: colors.accentRed,
}

const breakingLabelStyle = {
	fontFamily: fonts.mono,
	fontSize: '14px',
	fontWeight: '500',
	color: colors.textSecondary,
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
	backgroundColor: colors.bgCard,
	border: `1px solid rgba(239, 68, 68, 0.2)`,
	borderLeft: `3px solid ${colors.accentRed}`,
	borderRadius: '6px',
	padding: '16px',
	marginBottom: '12px',
}

const changeHeaderStyle = {
	marginBottom: '8px',
}

const changeIndexColumnStyle = {
	width: '32px',
	verticalAlign: 'top' as const,
}

const changeIndexStyle = {
	fontFamily: fonts.mono,
	fontSize: '11px',
	color: colors.textMuted,
	margin: '0',
}

const changeImpactColumnStyle = {
	textAlign: 'right' as const,
	verticalAlign: 'top' as const,
}

const impactBadgeStyle = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	fontWeight: '500',
	padding: '3px 8px',
	borderRadius: '4px',
	margin: '0',
	display: 'inline-block',
	letterSpacing: '0.05em',
}

const impactHighStyle = {
	backgroundColor: 'rgba(239, 68, 68, 0.2)',
	color: colors.accentRed,
	border: `1px solid rgba(239, 68, 68, 0.3)`,
}

const impactMediumStyle = {
	backgroundColor: 'rgba(234, 179, 8, 0.2)',
	color: colors.accentYellow,
	border: `1px solid rgba(234, 179, 8, 0.3)`,
}

const impactLowStyle = {
	backgroundColor: 'rgba(6, 182, 212, 0.2)',
	color: colors.accentCyan,
	border: `1px solid rgba(6, 182, 212, 0.3)`,
}

const changeTitleStyle = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	fontWeight: '500',
	color: colors.textPrimary,
	margin: '0 0 8px 0',
	lineHeight: '22px',
}

const breakingPrefixStyle = {
	color: colors.accentRed,
	fontFamily: fonts.mono,
	fontWeight: '700',
}

const changeDescriptionStyle = {
	fontFamily: fonts.sans,
	fontSize: '13px',
	color: colors.textSecondary,
	margin: '0',
	lineHeight: '20px',
	paddingLeft: '16px',
	borderLeft: `2px solid ${colors.borderSubtle}`,
}

const actionBoxStyle = {
	backgroundColor: colors.bgTertiary,
	borderRadius: '8px',
	padding: '20px',
	border: `1px solid ${colors.borderSubtle}`,
	marginBottom: '20px',
}

const actionHeaderStyle = {
	fontFamily: fonts.mono,
	fontSize: '13px',
	fontWeight: '600',
	color: colors.accentYellow,
	margin: '0 0 12px 0',
	letterSpacing: '0.02em',
}

const actionIconStyle = {
	color: colors.accentGreen,
}

const actionTextStyle = {
	fontFamily: fonts.sans,
	fontSize: '14px',
	color: colors.textSecondary,
	margin: '0 0 16px 0',
	lineHeight: '22px',
}

const actionButtonsStyle = {
	marginTop: '0',
}

const buttonColumnStyle = {
	paddingRight: '12px',
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

const secondaryButtonStyle = {
	backgroundColor: 'transparent',
	color: colors.textPrimary,
	fontFamily: fonts.mono,
	fontSize: '12px',
	fontWeight: '500',
	padding: '11px 19px',
	borderRadius: '6px',
	textDecoration: 'none',
	display: 'inline-block',
	border: `1px solid ${colors.borderLight}`,
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

export default BreakingChangeAlertEmail
