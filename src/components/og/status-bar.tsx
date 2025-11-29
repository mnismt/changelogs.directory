/**
 * Status Bar Component for OG Images
 * Renders the bottom status bar with breadcrumb and right indicator
 */
interface StatusBarProps {
	/** Breadcrumb path segments (e.g., ['changelogs.directory', 'tools', 'claude-code']) */
	breadcrumbs: string[]
	/** Right indicator text (e.g., 'Live Release Feed', 'Release Details') */
	indicator: string
}

export function StatusBar({ breadcrumbs, indicator }: StatusBarProps) {
	return (
		<div
			style={{
				height: '32px',
				backgroundColor: '#1A1A1A',
				borderTop: '1px solid #333333',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0 16px',
				fontSize: '13px',
				color: '#666666',
				fontWeight: 500,
				fontFamily: 'Fira Code',
			}}
		>
			{/* Left: Breadcrumb */}
			<div style={{ display: 'flex', gap: '20px' }}>
				{breadcrumbs.map((crumb, index) => (
					<div key={crumb} style={{ display: 'flex', gap: '20px' }}>
						{index > 0 && <span style={{ color: '#444444' }}>/</span>}
						<span style={{ color: '#888888' }}>{crumb}</span>
					</div>
				))}
			</div>

			{/* Right: Indicator */}
			<div
				style={{
					display: 'flex',
					gap: '8px',
					alignItems: 'center',
					color: '#555555',
				}}
			>
				<span>●</span>
				<span style={{ fontSize: '12px', fontFamily: 'Inter' }}>
					{indicator}
				</span>
			</div>
		</div>
	)
}
