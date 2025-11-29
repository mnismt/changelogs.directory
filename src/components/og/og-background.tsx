/**
 * OG Background Component
 * Provides subtle texture/grid for OG images
 */
export function OGBackground() {
	return (
		<div
			style={{
				display: 'flex',
				position: 'absolute',
				inset: 0,
				backgroundImage: `
					linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
					linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
				`,
				backgroundSize: '50px 50px',
				opacity: 0.5,
			}}
		/>
	)
}
