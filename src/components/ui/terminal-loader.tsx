import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

const TERMINAL_LOGS = [
	'INITIALIZING_SYSTEM...',
	'CONNECTING_TO_MAINFRAME...',
	'DECRYPTING_CHANGELOG_DATA...',
	'ANALYZING_DIFFS...',
	'RENDERING_VISUALS...',
]

export function TerminalLoader() {
	const [logs, setLogs] = useState<string[]>([])
	const [progress, setProgress] = useState(0)

	// Simulate log stream
	useEffect(() => {
		let currentIndex = 0
		const interval = setInterval(() => {
			if (currentIndex < TERMINAL_LOGS.length) {
				setLogs((prev) => [...prev, TERMINAL_LOGS[currentIndex]])
				currentIndex++
			} else {
				clearInterval(interval)
			}
		}, 150)

		return () => clearInterval(interval)
	}, [])

	// Simulate progress bar
	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval)
					return 100
				}
				return prev + Math.floor(Math.random() * 15)
			})
		}, 100)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className="flex h-[60vh] w-full flex-col items-center justify-center font-mono text-sm">
			<div className="w-full max-w-md space-y-6 rounded-lg border border-white/10 bg-black/40 p-8 backdrop-blur-md">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-white/10 pb-4">
					<div className="flex gap-2">
						<div className="h-3 w-3 rounded-full bg-red-500/50" />
						<div className="h-3 w-3 rounded-full bg-yellow-500/50" />
						<div className="h-3 w-3 rounded-full bg-green-500/50" />
					</div>
					<div className="text-xs text-muted-foreground">SYSTEM_BOOT</div>
				</div>

				{/* Logs */}
				<div className="h-32 space-y-2 overflow-hidden font-mono text-xs text-green-500/80">
					{logs.map((log, i) => (
						<motion.div
							key={i}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.2 }}
						>
							{`> ${log}`}
						</motion.div>
					))}
					<motion.div
						animate={{ opacity: [0, 1, 0] }}
						transition={{ duration: 0.8, repeat: Infinity }}
						className="inline-block h-4 w-2 bg-green-500"
					/>
				</div>

				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>LOADING_MODULES</span>
						<span>{Math.min(100, progress)}%</span>
					</div>
					<div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
						<motion.div
							className="h-full bg-green-500"
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
						/>
					</div>
				</div>

				{/* Hex Dump Decoration */}
				<div className="grid grid-cols-8 gap-1 text-[10px] text-white/10 opacity-50">
					{Array.from({ length: 16 }).map((_, i) => (
						<motion.span
							key={i}
							initial={{ opacity: 0 }}
							animate={{ opacity: [0.2, 0.5, 0.2] }}
							transition={{
								duration: 2,
								repeat: Infinity,
								delay: i * 0.1,
							}}
						>
							{Math.floor(Math.random() * 255)
								.toString(16)
								.padStart(2, '0')
								.toUpperCase()}
						</motion.span>
					))}
				</div>
			</div>
		</div>
	)
}
