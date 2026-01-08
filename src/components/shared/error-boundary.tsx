import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { GlitchText } from '@/components/ui/glitch-text'
import { ScanlineOverlay } from '@/components/ui/scanline-overlay'
import { TerminalWindow } from '@/components/ui/terminal-window'

interface ErrorBoundaryProps {
	title?: string
	message?: string
	detail?: string
	onRetry?: () => void
	onGoHome?: () => void
	homeLabel?: string
	retryLabel?: string
}

export function ErrorBoundaryCard({
	title = 'Something went wrong',
	message = 'An unexpected error occurred while loading this view.',
	detail,
	onRetry,
	onGoHome,
	homeLabel = 'Go home',
	retryLabel = 'Try again',
}: ErrorBoundaryProps) {
	const [step, setStep] = useState(0)
	const [showDetails, setShowDetails] = useState(false)

	useEffect(() => {
		// Entrance sequence
		const timeouts = [
			setTimeout(() => setStep(1), 100), // Icon pulse
			setTimeout(() => setStep(2), 300), // Header decrypt
			setTimeout(() => setStep(3), 500), // Message type
			setTimeout(() => setStep(4), 800), // Hex stream
			setTimeout(() => setStep(5), 1000), // Buttons
		]
		return () => timeouts.forEach(clearTimeout)
	}, [])

	return (
		<div className="relative flex w-full max-w-3xl flex-col items-center justify-center">
			{/* Scanlines inside the error container area */}
			<div className="absolute -inset-10 z-0 overflow-hidden rounded-3xl opacity-50">
				<ScanlineOverlay opacity={0.05} />
			</div>

			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="relative z-10 w-full"
			>
				<TerminalWindow
					title={title}
					className="w-full border-red-500/20 bg-black/60 shadow-2xl"
					headerClassName="bg-red-950/10 border-red-500/20"
				>
					<div className="flex flex-col gap-8 p-2 sm:p-4">
						{/* Header Section */}
						<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
							{/* Warning Icon */}
							<motion.div
								initial={{ scale: 0, rotate: -45 }}
								animate={
									step >= 1
										? { scale: 1, rotate: 0 }
										: { scale: 0, rotate: -45 }
								}
								className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20"
							>
								<AlertTriangle className="h-8 w-8 text-red-500" />
								{step >= 1 && (
									<motion.div
										className="absolute inset-0 rounded-xl bg-red-500/20"
										animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
										transition={{ duration: 2, repeat: Infinity }}
									/>
								)}
							</motion.div>

							<div className="space-y-1">
								<h2 className="font-mono text-xl font-bold tracking-tight text-red-500">
									{step >= 2 ? (
										<GlitchText intensity="low" className="text-red-500">
											SYSTEM_FAULT
										</GlitchText>
									) : (
										<span className="opacity-0">SYSTEM_FAULT</span>
									)}
								</h2>
								<div className="font-mono text-sm text-muted-foreground">
									{step >= 2 && (
										<EncryptedText
											text={`Error Code: 0x${Math.floor(Math.random() * 1000000)
												.toString(16)
												.toUpperCase()}`}
											className="text-xs tracking-wider opacity-70"
										/>
									)}
								</div>
								<p className="max-w-md text-sm text-foreground/80">
									{step >= 3 ? (
										message
									) : (
										<span className="opacity-0">{message}</span>
									)}
								</p>
							</div>
						</div>

						{/* Hex Dump Decoration (Mobile Hidden) */}
						{step >= 4 && (
							<div className="relative hidden h-24 overflow-hidden rounded border border-white/5 bg-black/40 p-3 font-mono text-[10px] text-muted-foreground/30 sm:block">
								<HexDump />
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
							</div>
						)}

						{/* Technical Details (Collapsible) */}
						{detail && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-left"
							>
								<button
									type="button"
									className="group flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
									onClick={() => setShowDetails((prev) => !prev)}
								>
									<span className="text-red-500/50 group-hover:text-red-500">
										{showDetails ? '[-]' : '[+]'}
									</span>
									{showDetails ? 'Hide stack trace' : 'View stack trace'}
								</button>
								{showDetails && (
									<motion.pre
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: 'auto', opacity: 1 }}
										className="mt-2 overflow-x-auto rounded border border-red-500/10 bg-red-950/5 p-4 text-xs text-red-200/70"
									>
										{detail}
									</motion.pre>
								)}
							</motion.div>
						)}

						{/* Actions */}
						{step >= 5 && (
							<div className="flex flex-col justify-end gap-3 border-t border-white/5 pt-4 sm:flex-row">
								<Button
									variant="ghost"
									className="gap-2 font-mono text-xs hover:bg-white/5 hover:text-foreground"
									onClick={onGoHome}
								>
									<Home className="h-3 w-3" />
									{homeLabel}
								</Button>

								{onRetry && (
									<Button
										onClick={onRetry}
										className="gap-2 border-red-500/20 bg-red-500/10 font-mono text-xs text-red-500 hover:bg-red-500/20 hover:text-red-400"
									>
										<RotateCcw className="h-3 w-3" />
										{retryLabel}
									</Button>
								)}
							</div>
						)}
					</div>
				</TerminalWindow>
			</motion.div>
		</div>
	)
}

function HexDump() {
	const [lines, setLines] = useState<string[]>([])

	useEffect(() => {
		const generateLine = () => {
			const addr = Math.floor(Math.random() * 65535)
				.toString(16)
				.padStart(4, '0')
			const bytes = Array.from({ length: 16 })
				.map(() =>
					Math.floor(Math.random() * 255)
						.toString(16)
						.padStart(2, '0'),
				)
				.join(' ')
			return `0x${addr}: ${bytes}`
		}

		// Initial fill
		setLines(Array.from({ length: 8 }).map(generateLine))

		const interval = setInterval(() => {
			setLines((prev) => {
				// Ensure we have unique keys by using timestamp + index if needed,
				// but for simple text display, string content + index is okay if we generate unique content.
				// However, React needs stable keys.
				// Let's change the state to be objects with IDs.
				const newLine = generateLine()
				// Just shift lines for effect
				return [...prev.slice(1), newLine]
			})
		}, 100)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className="space-y-1">
			{lines.map((line, i) => (
				<div key={`${i}-${line.substring(0, 6)}`}>{line}</div>
			))}
		</div>
	)
}
