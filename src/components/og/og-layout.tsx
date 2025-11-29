import type { ReactNode } from 'react'
import { OGBackground } from './og-background'
import { RadialGlow } from './radial-glow'
import { StatusBar } from './status-bar'
import { TerminalChrome } from './terminal-chrome'

/**
 * Base Layout Component for OG Images
 * Provides consistent structure: Background, Terminal Chrome, Content Area, Status Bar
 */
interface OGLayoutProps {
	/** Terminal window title (e.g., "~/tools/claude-code") */
	title: string
	/** Breadcrumb path for status bar */
	breadcrumbs: string[]
	/** Right indicator text for status bar */
	indicator: string
	/** Main content to render in the center */
	children: ReactNode
}

export function OGLayout({
	title,
	breadcrumbs,
	indicator,
	children,
}: OGLayoutProps) {
	return (
		<div
			style={{
				height: '100%',
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#0A0A0A',
				position: 'relative',
				fontFamily: 'Fira Code',
			}}
		>
			{/* Background Effects */}
			<OGBackground />
			<RadialGlow />

			{/* Terminal Chrome */}
			<TerminalChrome title={title} />

			{/* Main Content Area */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					padding: '32px 48px',
					flex: 1,
					position: 'relative',
				}}
			>
				{children}
			</div>

			{/* Status Bar */}
			<StatusBar breadcrumbs={breadcrumbs} indicator={indicator} />
		</div>
	)
}
