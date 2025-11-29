import type { ReactNode } from 'react'

/**
 * Logo Box Component for OG Images
 * Renders a glassmorphism box container for tool logos
 */
interface LogoBoxProps {
	children: ReactNode
}

export function LogoBox({ children }: LogoBoxProps) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: '200px',
				height: '200px',
				background:
					'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
				border: '1px solid rgba(255,255,255,0.1)',
				borderRadius: '24px',
				padding: '40px',
			}}
		>
			{children}
		</div>
	)
}
