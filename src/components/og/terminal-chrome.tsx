/**
 * Terminal Chrome Component for OG Images
 * Renders a macOS-style terminal title bar with traffic lights and path
 */
export function TerminalChrome({ title }: { title: string }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				height: '44px',
				backgroundColor: '#1A1A1A',
				borderBottom: '1px solid #2A2A2A',
				paddingLeft: '16px',
				paddingRight: '16px',
				justifyContent: 'space-between',
			}}
		>
			{/* macOS Traffic Lights */}
			<div style={{ display: 'flex', gap: '8px', width: '60px' }}>
				<div
					style={{
						width: '12px',
						height: '12px',
						borderRadius: '50%',
						backgroundColor: '#ff5f56',
					}}
				/>
				<div
					style={{
						width: '12px',
						height: '12px',
						borderRadius: '50%',
						backgroundColor: '#ffbd2e',
					}}
				/>
				<div
					style={{
						width: '12px',
						height: '12px',
						borderRadius: '50%',
						backgroundColor: '#27c93f',
					}}
				/>
			</div>

			{/* Title - centered */}
			<div
				style={{
					display: 'flex',
					textAlign: 'center',
					fontFamily: 'Fira Code',
					fontSize: '14px',
					color: '#888888',
				}}
			>
				{title}
			</div>

			{/* Branding - Right */}
			<div
				style={{
					display: 'flex',
					fontFamily: 'Fira Code',
					fontSize: '14px',
					color: '#444444',
					width: '60px',
					textAlign: 'right',
				}}
			>
				cd.dir
			</div>
		</div>
	)
}
