/**
 * CTA Button Component for OG Images
 * Renders a terminal-style call-to-action "$ click --to-read changelog →"
 */
export function CTAButton() {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				padding: '12px 20px',
				background: 'rgba(255, 255, 255, 0.03)',
				border: '1px solid rgba(255, 255, 255, 0.08)',
				borderRadius: '6px',
				fontFamily: 'Fira Code',
				fontSize: '14px',
				color: '#666666',
			}}
		>
			<span style={{ color: '#888888' }}>$</span>
			<span style={{ color: '#999999' }}>click</span>
			<span style={{ color: '#555555' }}>--to-read</span>
			<span style={{ color: '#777777' }}>changelog</span>
			<div
				style={{
					display: 'flex',
					marginLeft: 'auto',
					color: '#444444',
					fontSize: '16px',
				}}
			>
				→
			</div>
		</div>
	)
}
