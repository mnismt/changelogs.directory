// Terminal-inspired email design system
// Matches changelogs.directory's "dev-vibe" aesthetic

export const colors = {
	// Backgrounds
	bgPrimary: '#0A0A0A',
	bgSecondary: '#111111',
	bgTertiary: '#1A1A1A',
	bgCard: '#0D0D0D',
	bgGlass: 'rgba(255, 255, 255, 0.03)',

	// Text
	textPrimary: '#FFFFFF',
	textSecondary: '#A1A1A1',
	textMuted: '#666666',
	textDim: '#444444',

	// Accents
	accentGreen: '#22C55E',
	accentGreenGlow: 'rgba(34, 197, 94, 0.3)',
	accentYellow: '#EAB308',
	accentRed: '#EF4444',
	accentCyan: '#06B6D4',
	accentOrange: '#F97316',

	// Borders
	borderSubtle: 'rgba(255, 255, 255, 0.08)',
	borderLight: 'rgba(255, 255, 255, 0.12)',
}

export const fonts = {
	mono: "'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
	sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

// Base styles for all emails
export const baseStyles = {
	body: {
		backgroundColor: colors.bgPrimary,
		fontFamily: fonts.sans,
		margin: '0',
		padding: '0',
	},
	container: {
		backgroundColor: colors.bgPrimary,
		margin: '0 auto',
		padding: '40px 20px',
		maxWidth: '600px',
	},
	// Terminal window wrapper
	terminalWindow: {
		backgroundColor: colors.bgSecondary,
		borderRadius: '12px',
		border: `1px solid ${colors.borderSubtle}`,
		overflow: 'hidden',
	},
	terminalHeader: {
		backgroundColor: colors.bgTertiary,
		padding: '12px 16px',
		borderBottom: `1px solid ${colors.borderSubtle}`,
		display: 'flex',
		alignItems: 'center',
	},
	terminalDot: {
		width: '12px',
		height: '12px',
		borderRadius: '50%',
		display: 'inline-block',
		marginRight: '8px',
	},
	terminalBody: {
		padding: '24px',
	},
	// Typography
	heading: {
		color: colors.textPrimary,
		fontFamily: fonts.mono,
		fontSize: '24px',
		fontWeight: '600',
		margin: '0 0 8px 0',
		letterSpacing: '-0.02em',
	},
	subheading: {
		color: colors.textSecondary,
		fontFamily: fonts.mono,
		fontSize: '14px',
		fontWeight: '400',
		margin: '0 0 24px 0',
		letterSpacing: '0.02em',
	},
	paragraph: {
		color: colors.textSecondary,
		fontFamily: fonts.sans,
		fontSize: '15px',
		lineHeight: '24px',
		margin: '0 0 16px 0',
	},
	code: {
		fontFamily: fonts.mono,
		fontSize: '13px',
		backgroundColor: colors.bgTertiary,
		padding: '2px 6px',
		borderRadius: '4px',
		color: colors.accentCyan,
	},
	// Buttons
	buttonPrimary: {
		backgroundColor: colors.textPrimary,
		color: colors.bgPrimary,
		fontFamily: fonts.mono,
		fontSize: '13px',
		fontWeight: '500',
		padding: '12px 24px',
		borderRadius: '6px',
		textDecoration: 'none',
		display: 'inline-block',
		letterSpacing: '0.02em',
	},
	buttonSecondary: {
		backgroundColor: 'transparent',
		color: colors.textPrimary,
		fontFamily: fonts.mono,
		fontSize: '13px',
		fontWeight: '500',
		padding: '11px 23px',
		borderRadius: '6px',
		textDecoration: 'none',
		display: 'inline-block',
		border: `1px solid ${colors.borderLight}`,
		letterSpacing: '0.02em',
	},
	// Dividers
	divider: {
		borderTop: `1px solid ${colors.borderSubtle}`,
		margin: '24px 0',
	},
	// Footer
	footer: {
		color: colors.textMuted,
		fontFamily: fonts.mono,
		fontSize: '12px',
		textAlign: 'center' as const,
		marginTop: '32px',
	},
	footerLink: {
		color: colors.textSecondary,
		textDecoration: 'underline',
	},
}

// Status indicator styles
export const statusStyles = {
	ready: {
		container: {
			display: 'inline-flex',
			alignItems: 'center',
			gap: '8px',
			padding: '6px 12px',
			backgroundColor: 'rgba(34, 197, 94, 0.1)',
			borderRadius: '4px',
			border: `1px solid rgba(34, 197, 94, 0.2)`,
		},
		dot: {
			width: '8px',
			height: '8px',
			borderRadius: '50%',
			backgroundColor: colors.accentGreen,
			boxShadow: `0 0 8px ${colors.accentGreenGlow}`,
		},
		text: {
			fontFamily: fonts.mono,
			fontSize: '11px',
			fontWeight: '500',
			color: colors.accentGreen,
			letterSpacing: '0.05em',
			textTransform: 'uppercase' as const,
		},
	},
	breaking: {
		container: {
			display: 'inline-flex',
			alignItems: 'center',
			gap: '8px',
			padding: '6px 12px',
			backgroundColor: 'rgba(239, 68, 68, 0.1)',
			borderRadius: '4px',
			border: `1px solid rgba(239, 68, 68, 0.2)`,
		},
		dot: {
			width: '8px',
			height: '8px',
			borderRadius: '50%',
			backgroundColor: colors.accentRed,
		},
		text: {
			fontFamily: fonts.mono,
			fontSize: '11px',
			fontWeight: '500',
			color: colors.accentRed,
			letterSpacing: '0.05em',
			textTransform: 'uppercase' as const,
		},
	},
}

// Release card styles
export const releaseCardStyles = {
	card: {
		backgroundColor: colors.bgCard,
		border: `1px solid ${colors.borderSubtle}`,
		borderRadius: '8px',
		padding: '20px',
		marginBottom: '12px',
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		marginBottom: '12px',
	},
	version: {
		fontFamily: fonts.mono,
		fontSize: '16px',
		fontWeight: '600',
		color: colors.textPrimary,
		margin: '0',
	},
	date: {
		fontFamily: fonts.mono,
		fontSize: '12px',
		color: colors.textMuted,
		marginLeft: '12px',
	},
	headline: {
		fontFamily: fonts.sans,
		fontSize: '14px',
		color: colors.textSecondary,
		lineHeight: '20px',
		margin: '0 0 12px 0',
	},
	badge: {
		fontFamily: fonts.mono,
		fontSize: '10px',
		fontWeight: '500',
		padding: '4px 8px',
		borderRadius: '4px',
		letterSpacing: '0.05em',
		textTransform: 'uppercase' as const,
		display: 'inline-block',
		marginRight: '8px',
	},
	featureBadge: {
		backgroundColor: 'rgba(34, 197, 94, 0.15)',
		color: colors.accentGreen,
		border: `1px solid rgba(34, 197, 94, 0.3)`,
	},
	bugfixBadge: {
		backgroundColor: 'rgba(6, 182, 212, 0.15)',
		color: colors.accentCyan,
		border: `1px solid rgba(6, 182, 212, 0.3)`,
	},
	breakingBadge: {
		backgroundColor: 'rgba(239, 68, 68, 0.15)',
		color: colors.accentRed,
		border: `1px solid rgba(239, 68, 68, 0.3)`,
	},
	improvementBadge: {
		backgroundColor: 'rgba(249, 115, 22, 0.15)',
		color: colors.accentOrange,
		border: `1px solid rgba(249, 115, 22, 0.3)`,
	},
}

// Tool branding
export const toolStyles = {
	logo: {
		width: '32px',
		height: '32px',
		borderRadius: '6px',
		marginRight: '12px',
	},
	name: {
		fontFamily: fonts.mono,
		fontSize: '14px',
		fontWeight: '600',
		color: colors.textPrimary,
	},
	vendor: {
		fontFamily: fonts.mono,
		fontSize: '11px',
		color: colors.textMuted,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
	},
}
