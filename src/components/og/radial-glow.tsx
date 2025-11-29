/**
 * Radial Glow Effect Component for OG Images
 * Creates a centered radial gradient glow effect
 */
export function RadialGlow() {
	return (
		<div
			style={{
				display: 'flex',
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				width: '800px',
				height: '800px',
				background:
					'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
			}}
		/>
	)
}
