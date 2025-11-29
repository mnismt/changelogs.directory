/**
 * Command Prompt Component for OG Images
 * Renders a terminal-style command line with cursor
 */
interface CommandPromptProps {
	command: string
}

export function CommandPrompt({ command }: CommandPromptProps) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				fontSize: '24px',
				color: '#AAAAAA',
				marginBottom: '48px',
			}}
		>
			<span style={{ color: '#CCCCCC' }}>&gt;</span>
			<span style={{ color: '#999999' }}>~</span>
			<span>{command}</span>
			<div
				style={{
					display: 'flex',
					width: '12px',
					height: '24px',
					backgroundColor: '#AAAAAA',
					opacity: 0.8,
				}}
			/>
		</div>
	)
}
