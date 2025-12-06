import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getToolLogoSVG } from '@/lib/og-utils'

/**
 * Animated Landing Page for Windsurf Release (Cinematic Video Version)
 * GET /windsurf-banner-animated
 *
 * Cinematic "Boot & Deploy" Choreography
 */
export const Route = createFileRoute('/new-tool-banner-animated')({
	component: WindsurfBannerAnimated,
})

function WindsurfBannerAnimated() {
	const windsurfLogo = getToolLogoSVG('windsurf', 140)
	const [step, setStep] = useState(0)

	// Choreography Timeline
	useEffect(() => {
		const timeline = [
			{ time: 500, step: 1 }, // Grid start
			{ time: 1500, step: 2 }, // Logo reveal
			{ time: 2500, step: 3 }, // Title slide
			{ time: 3200, step: 4 }, // Badge expand
			{ time: 4000, step: 5 }, // Terminal expand
			{ time: 5000, step: 6 }, // Typing start
			{ time: 7000, step: 7 }, // Deployment sequence start
			{ time: 9500, step: 8 }, // Deployment complete
			{ time: 10000, step: 9 }, // Stats reveal
			{ time: 11500, step: 10 }, // Last line ready
		]

		timeline.forEach(({ time, step: s }) => {
			setTimeout(() => setStep((prev) => Math.max(prev, s)), time)
		})
	}, [])

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-[#050505] font-sans selection:bg-white/20 flex items-center justify-center">
			{/* Ambient Noise Texture */}
			<div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay z-50">
				<div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
			</div>

			{/* Background Grid - Panning */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: step >= 1 ? 0.05 : 0 }}
				transition={{ duration: 2 }}
				className="absolute inset-0 pointer-events-none"
			>
				<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
				<motion.div
					animate={{ x: [-20, -50], y: [-20, -50] }}
					transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
					className="absolute inset-0 w-[200%] h-[200%]"
					style={{
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
						backgroundSize: '40px 40px',
						opacity: 0.1,
					}}
				/>
			</motion.div>

			{/* Main Content Container - 16:9 Ratio Target */}
			<div className="relative z-10 w-[1400px] flex flex-col gap-10 transform scale-90">
				{/* 1. Header Section */}
				<div className="flex items-center gap-12 pl-12 h-40">
					{/* Logo */}
					<motion.div
						initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
						animate={
							step >= 2 ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : {}
						}
						transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
						className="relative group shrink-0"
					>
						<div className="absolute inset-0 bg-white/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
						<div className="relative flex items-center justify-center w-40 h-40 bg-zinc-900/40 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl">
							<motion.div
								animate={{
									filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
								}}
								transition={{
									duration: 4,
									repeat: Infinity,
									ease: 'easeInOut',
								}}
								className="grayscale opacity-90"
							>
								{windsurfLogo}
							</motion.div>
						</div>
					</motion.div>

					{/* Title Text */}
					<div className="flex flex-col gap-4 overflow-hidden pt-2">
						<div className="flex items-baseline gap-6">
							<motion.h1
								initial={{ y: 100, opacity: 0 }}
								animate={step >= 3 ? { y: 0, opacity: 1 } : {}}
								transition={{ duration: 0.8, ease: 'easeOut' }}
								className="text-9xl font-black text-white tracking-tighter leading-none"
							>
								Windsurf
							</motion.h1>

							{/* Badge: Now Available */}
							<AnimatePresence>
								{step >= 10 && (
									<motion.div
										initial={{ opacity: 0, x: -20, scale: 0.9 }}
										animate={{ opacity: 1, x: 0, scale: 1 }}
										transition={{ duration: 0.5, ease: 'backOut' }}
										className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/20"
									>
										<span className="relative flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
										</span>
										<span className="text-sm font-medium text-lime-400 uppercase tracking-widest">
											Now Available
										</span>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Subtitle */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={step >= 3 ? { opacity: 1 } : {}}
							transition={{ delay: 0.4, duration: 0.8 }}
							className="flex items-center gap-6 text-3xl font-light text-zinc-500 pl-2"
						>
							<span className="text-white font-medium">v1.1 Public Beta</span>
							<span className="text-zinc-700">|</span>
							<span className="font-mono">Cognition</span>
						</motion.div>
					</div>
				</div>

				{/* 2. Terminal Dashboard */}
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={step >= 5 ? { height: 500, opacity: 1 } : {}}
					transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
					className="w-full overflow-hidden bg-black/80 border border-white/10 rounded-xl backdrop-blur-xl shadow-2xl relative"
				>
					{/* Terminal Header */}
					<div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
						<div className="flex gap-2">
							<div className="w-3 h-3 rounded-full bg-zinc-700" />
							<div className="w-3 h-3 rounded-full bg-zinc-700" />
							<div className="w-3 h-3 rounded-full bg-zinc-700" />
						</div>
						<div className="flex-1 text-center font-mono text-sm text-zinc-600">
							~/windsurf/changelog — zsh
						</div>
					</div>

					{/* Terminal Content */}
					<div className="p-10 pb-2 flex flex-col font-mono relative">
						{/* Command Line */}
						<div className="flex items-center gap-4 text-3xl mb-12">
							<span className="text-lime-500">➜</span>
							<span className="text-blue-500">~</span>
							<div className="flex text-zinc-300">
								{step >= 6 && (
									<Typewriter text="git diff --stat v1.0.0...v1.1.0" />
								)}
							</div>
						</div>

						{/* Main Output Area */}
						<div className="relative min-h-[160px] flex flex-col justify-start">
							<AnimatePresence mode="wait">
								{/* Deployment Progress */}
								{step >= 7 && step < 9 && (
									<motion.div
										key="deployment"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
										className="flex flex-col gap-8 max-w-2xl"
									>
										<div className="flex flex-col gap-3">
											<div className="flex justify-between text-zinc-500 text-sm tracking-widest font-bold uppercase">
												<span>Verifying asset checksums...</span>
												<span className="text-emerald-500">DONE</span>
											</div>
											<ProgressBar duration={2000} color="bg-emerald-500" />
										</div>
										<div className="flex flex-col gap-3">
											<div className="flex justify-between text-zinc-500 text-sm tracking-widest font-bold uppercase">
												<span>Syncing changelog metadata...</span>
												<span className="text-blue-500 animate-pulse">
													SYNCING
												</span>
											</div>
											<ProgressBar
												duration={2500}
												delay={500}
												color="bg-blue-500"
											/>
										</div>
									</motion.div>
								)}

								{/* Stats Config - Positioned Higher */}
								{step >= 9 && (
									<motion.div
										key="stats"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.6, ease: 'backOut' }}
										className="flex flex-col gap-2 -mt-4"
									>
										<div className="grid grid-cols-3 gap-6 w-full">
											<StatCard
												label="ADDITIONS"
												color="text-emerald-400"
												end={1689}
												suffix="+"
											/>
											<StatCard
												label="DELETIONS"
												color="text-rose-400"
												end={6}
												prefix="-"
											/>
											<StatCard
												label="FILES CHANGED"
												color="text-white"
												end={27}
											/>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Footer: Ready At - Refined Position */}
						<div className="mt-8 border-t border-white/10 pt-6">
							<AnimatePresence>
								{step >= 10 && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex flex-col gap-4"
									>
										<div className="flex items-center justify-between w-full">
											<div className="flex items-center gap-4 text-xl">
												<div className="flex items-center gap-3 text-zinc-500 font-light whitespace-nowrap">
													<div className="relative flex h-3 w-3 shrink-0">
														<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
														<span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
													</div>
													<ScrambleText text="Ready at" speed={40} />
												</div>
												<motion.div
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: 0.8, duration: 0.5 }}
													className="font-medium text-white group flex items-center gap-1.5 whitespace-nowrap"
												>
													<span className="text-zinc-600 select-none">
														https://
													</span>
													<span className="text-white border-b-2 border-emerald-500/50 pb-0.5 group-hover:border-emerald-500 transition-colors cursor-pointer">
														changelogs.directory/tools/windsurf
													</span>
													<motion.span
														initial={{ opacity: 0, scale: 0 }}
														animate={{ opacity: 1, scale: 1 }}
														transition={{ delay: 1.5 }}
														className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
													>
														⏎
													</motion.span>
												</motion.div>
											</div>

											{/* Meta Info */}
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ delay: 1.2 }}
												className="flex gap-6 text-xs font-mono text-zinc-600 shrink-0"
											>
												<span>BLOCK: 14M+</span>
												<span>HASH: 8f2a...9c1</span>
												<span>TIME: 44ms</span>
											</motion.div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	)
}

// --- Components ---

function Typewriter({ text }: { text: string }) {
	const [displayText, setDisplayText] = useState('')

	useEffect(() => {
		let i = 0
		const timer = setInterval(() => {
			if (i < text.length) {
				setDisplayText(text.slice(0, i + 1))
				i++
			} else {
				clearInterval(timer)
			}
		}, 50)
		return () => clearInterval(timer)
	}, [text])

	return (
		<span className="text-zinc-100 border-r-4 border-lime-500 animate-pulse pr-1">
			{displayText}
		</span>
	)
}

function ScrambleText({
	text,
	delay = 0,
	speed = 50,
}: {
	text: string
	delay?: number
	speed?: number
}) {
	const [displayText, setDisplayText] = useState('')
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'

	useEffect(() => {
		let iteration = 0
		let timer: NodeJS.Timeout | null = null

		const startScramble = () => {
			timer = setInterval(() => {
				setDisplayText(
					text
						.split('')
						.map((_, index) => {
							if (index < iteration) return text[index]
							return chars[Math.floor(Math.random() * chars.length)]
						})
						.join(''),
				)

				if (iteration >= text.length) {
					clearInterval(timer!)
				}

				iteration += 1 / 3
			}, speed)
		}

		const delayTimer = setTimeout(startScramble, delay)

		return () => {
			if (timer) clearInterval(timer)
			clearTimeout(delayTimer)
		}
	}, [text, delay, speed])

	return <span>{displayText}</span>
}

function ProgressBar({
	duration,
	delay = 0,
	color,
}: {
	duration: number
	delay?: number
	color: string
}) {
	return (
		<div className="h-1 bg-zinc-800 rounded-full overflow-hidden w-full">
			<motion.div
				initial={{ width: 0 }}
				animate={{ width: '100%' }}
				transition={{
					duration: duration / 1000,
					delay: delay / 1000,
					ease: 'easeInOut',
				}}
				className={`h-full ${color}`}
			/>
		</div>
	)
}

function StatCard({
	label,
	color,
	end,
	prefix = '',
	suffix = '',
}: {
	label: string
	color: string
	end: number
	prefix?: string
	suffix?: string
}) {
	const [count, setCount] = useState(0)

	useEffect(() => {
		const duration = 1500
		const startTime = Date.now()

		const timer = setInterval(() => {
			const progress = Math.min((Date.now() - startTime) / duration, 1)
			const ease = 1 - (1 - progress) ** 3
			setCount(Math.floor(end * ease))

			if (progress === 1) clearInterval(timer)
		}, 16)

		return () => clearInterval(timer)
	}, [end])

	return (
		<div className="bg-[#0A0A0A] p-8 flex flex-col gap-2 rounded hover:bg-zinc-900/50 transition-colors border border-white/5">
			<span className="text-sm font-bold text-zinc-600 tracking-widest">
				{label}
			</span>
			<span className={`text-6xl font-bold font-mono ${color}`}>
				{prefix}
				{count.toLocaleString()}
				{suffix}
			</span>
		</div>
	)
}
