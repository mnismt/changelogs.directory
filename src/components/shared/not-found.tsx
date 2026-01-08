import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useId, useState } from 'react'

import { EncryptedText } from '@/components/ui/encrypted-text'
import { GlitchText } from '@/components/ui/glitch-text'
import { ScanlineOverlay } from '@/components/ui/scanline-overlay'
import { SparklesCore } from '@/components/ui/sparkles'
import { TerminalWindow } from '@/components/ui/terminal-window'

export function NotFound() {
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const [step, setStep] = useState(0)
	const sparklesId = useId()

	// Animation sequence
	useEffect(() => {
		const timeouts = [
			setTimeout(() => setStep(1), 100), // Encrypted 404
			setTimeout(() => setStep(2), 600), // Terminal appears
			setTimeout(() => setStep(3), 800), // Commands typing
			setTimeout(() => setStep(4), 1600), // Suggestions
		]
		return () => timeouts.forEach(clearTimeout)
	}, [])

	return (
		<div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden px-4">
			{/* Background Effects */}
			<div className="absolute inset-0 z-0">
				<SparklesCore
					id={sparklesId}
					background="transparent"
					minSize={0.6}
					maxSize={1.4}
					particleDensity={50}
					className="h-full w-full"
					particleColor="#EF4444" // Red-500
				/>
			</div>
			<ScanlineOverlay className="z-10 opacity-[0.03]" />

			<div className="relative z-20 flex w-full max-w-3xl flex-col items-center gap-8">
				{/* Glitched 404 Display */}
				<div className="relative">
					<h1 className="select-none font-mono text-8xl font-bold tracking-tighter text-foreground sm:text-9xl">
						{step >= 1 ? (
							<GlitchText intensity="medium" frequency={3000}>
								404
							</GlitchText>
						) : (
							<span className="opacity-0">404</span>
						)}
					</h1>
					{step >= 1 && (
						<div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
							<EncryptedText
								text="PATH_NOT_FOUND"
								className="font-mono text-sm tracking-[0.2em] text-red-500/80"
								revealDelayMs={50}
							/>
						</div>
					)}
				</div>

				{/* Terminal Window */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={step >= 2 ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
					className="w-full max-w-xl"
				>
					<TerminalWindow title="zsh — 80x24" className="w-full shadow-2xl">
						<div className="flex flex-col gap-4">
							{/* Failed Command */}
							<div className="space-y-1">
								<div className="flex gap-2 text-muted-foreground/60">
									<span className="text-green-500/80">➜</span>
									<span>~</span>
									<span className="text-foreground/80">
										{step >= 3 && (
											<TypewriterText text={`cd ${pathname}`} delay={0} />
										)}
									</span>
								</div>
								{step >= 3 && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.8 }}
										className="text-red-400/90"
									>
										zsh: no such file or directory: {pathname}
									</motion.div>
								)}
							</div>

							{/* Suggestions */}
							{step >= 4 && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.5 }}
									className="space-y-1 border-t border-white/5 pt-4"
								>
									<div className="mb-2 flex gap-2 text-muted-foreground/60">
										<span className="text-green-500/80">➜</span>
										<span>~</span>
										<span className="text-foreground/80">
											ls -la --suggestions
										</span>
									</div>

									<div className="grid gap-1 pl-4">
										<SuggestionLink to="/" label="/" desc="home_directory" />
										<SuggestionLink
											to="/tools"
											label="/tools"
											desc="all_tools"
										/>
										<SuggestionLink
											to="/compare"
											label="/compare"
											desc="diff_view"
										/>
										<SuggestionLink
											to="/analytics"
											label="/analytics"
											desc="system_stats"
										/>
									</div>
								</motion.div>
							)}

							{/* Blinking Cursor */}
							<div className="mt-2 flex gap-2 text-muted-foreground/60">
								<span className="text-green-500/80">➜</span>
								<span>~</span>
								<motion.span
									animate={{ opacity: [0, 1, 0] }}
									transition={{ duration: 0.8, repeat: Infinity }}
									className="block h-4 w-2 bg-muted-foreground/60"
								/>
							</div>
						</div>
					</TerminalWindow>
				</motion.div>

				{/* Home Action (Mobile/Quick Access) */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={step >= 4 ? { opacity: 1 } : {}}
					transition={{ delay: 0.5 }}
					className="flex flex-col items-center gap-2"
				>
					<p className="font-mono text-xs text-muted-foreground/40">
						[Press Enter to return home]
					</p>
				</motion.div>
			</div>

			{/* Keyboard Listener */}
			<KeyboardHome />
		</div>
	)
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
	const [displayed, setDisplayed] = useState('')

	useEffect(() => {
		const startTimeout = setTimeout(() => {
			let i = 0
			const interval = setInterval(() => {
				setDisplayed(text.substring(0, i + 1))
				i++
				if (i === text.length) clearInterval(interval)
			}, 30) // Typing speed
			return () => clearInterval(interval)
		}, delay)

		return () => clearTimeout(startTimeout)
	}, [text, delay])

	return <span>{displayed}</span>
}

function SuggestionLink({
	to,
	label,
	desc,
}: {
	to: string
	label: string
	desc: string
}) {
	return (
		<Link
			to={to}
			className="group flex items-center gap-4 text-sm transition-colors hover:bg-white/5"
		>
			<span className="w-24 font-mono text-blue-400 group-hover:text-blue-300 group-hover:underline">
				{label}
			</span>
			<span className="font-mono text-muted-foreground/50 group-hover:text-muted-foreground/70">
				{desc}
			</span>
			<span className="ml-auto hidden font-mono text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100 sm:block">
				r-x
			</span>
		</Link>
	)
}

function KeyboardHome() {
	const router = useRouter()
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				router.navigate({ to: '/' })
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [router])
	return null
}
