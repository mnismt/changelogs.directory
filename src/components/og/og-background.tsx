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
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
				backgroundImage: `
					linear-gradient(rgba(128, 128, 128, 0.05) 1px, transparent 1px),
					linear-gradient(90deg, rgba(128, 128, 128, 0.05) 1px, transparent 1px)
				`,
				backgroundSize: '24px 24px',
			}}
		/>
	)
}
