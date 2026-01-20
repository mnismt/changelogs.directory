import { Link } from '@tanstack/react-router'
import { ArrowRight, Terminal } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/date-utils'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface HeroReleaseProps {
	toolSlug: string
	toolName: string
	vendor: string | null
	version: string
	formattedVersion?: string
	releaseDate: Date | string | null
	headline: string | null
	summary: string | null
	changeCount: number
	changesByType: Record<string, number>
	hasBreaking: boolean
	hasSecurity: boolean
	hasDeprecation: boolean
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
			delayChildren: 0.1,
		},
	},
}

const itemVariants = {
	hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
	visible: {
		opacity: 1,
		y: 0,
		filter: 'blur(0px)',
		transition: {
			duration: 0.6,
			ease: [0.2, 0.65, 0.3, 0.9] as const, // Custom ease-out-cubic-ish
		},
	},
}

export function HeroRelease({
	toolSlug,
	toolName,
	vendor,
	version,
	formattedVersion,
	releaseDate,
	headline,
	changeCount,
	changesByType,
}: HeroReleaseProps) {
	const logo = getToolLogo(toolSlug)
	const isGeminiCli = toolSlug === 'gemini-cli'
	const [isHovered, setIsHovered] = useState(false)

	// Animation state
	const [typedCommand, setTypedCommand] = useState('')
	const [showOutput, setShowOutput] = useState(false)
	const [isTypingDone, setIsTypingDone] = useState(false)

	const fullCommand = `view release --tool=${toolSlug} --version=${formattedVersion || version}`

	useEffect(() => {
		let currentIndex = 0
		const typingSpeed = 35 // ms per char
		const startDelay = 1200 // Wait for card to slide in

		const startTimeout = setTimeout(() => {
			const interval = setInterval(() => {
				if (currentIndex <= fullCommand.length) {
					setTypedCommand(fullCommand.slice(0, currentIndex))
					currentIndex++
				} else {
					clearInterval(interval)
					setIsTypingDone(true)
					// Delay before showing output
					setTimeout(() => {
						setShowOutput(true)
					}, 300)
				}
			}, typingSpeed)

			return () => clearInterval(interval)
		}, startDelay)

		return () => clearTimeout(startTimeout)
	}, [fullCommand])

	return (
		<Card
			className="relative group overflow-hidden border-border/40 bg-[#09090b] shadow-2xl transition-all duration-500 ease-in-out hover:border-border/60 hover:shadow-accent/5"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* macOS-like window controls - Darker/Subtler */}
			<div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
						<span className="size-2.5 rounded-full bg-[#ff5f56]" />
						<span className="size-2.5 rounded-full bg-[#ffbd2e]" />
						<span className="size-2.5 rounded-full bg-[#27c93f]" />
					</div>
					<div className="ml-4 flex items-center gap-2 text-xs font-mono text-muted-foreground/40">
						<span>changelogs — -zsh — 80x24</span>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="relative z-10 p-6 sm:p-8 font-mono text-left">
				{/* Command Prompt Simulation */}
				<div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
					<span className="text-green-500 font-bold">➜</span>
					<span className="text-blue-400 font-bold">~</span>
					<span className="text-foreground/90">
						{typedCommand}
						{!isTypingDone && (
							<span className="animate-pulse inline-block w-2 h-4 bg-foreground/50 align-middle ml-1" />
						)}
					</span>
				</div>

				{/* Output Area */}
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={
						showOutput
							? { height: 'auto', opacity: 1 }
							: { height: 0, opacity: 0 }
					}
					transition={{
						duration: 0.8,
						ease: [0.2, 0.65, 0.3, 0.9] as const,
					}}
					className="overflow-hidden"
				>
					{showOutput && (
						<motion.div
							className="pl-2 ml-1 pb-2"
							variants={containerVariants}
							initial="hidden"
							animate="visible"
						>
							<div className="flex items-start gap-6 mb-8">
								{/* Logo */}
								<motion.div
									variants={itemVariants}
									className="shrink-0 hidden sm:block pt-1"
								>
									{logo ? (
										<div
											className={cn(
												'flex size-14 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:transition-all duration-700',
												!isHovered && isGeminiCli && 'grayscale brightness-110',
												!isGeminiCli &&
													(isMonochromeLogo(toolSlug) || !isHovered) &&
													'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
												getLogoHoverClasses(toolSlug),
											)}
										>
											{logo}
										</div>
									) : (
										<div className="flex size-14 items-center justify-center text-muted-foreground">
											<Terminal className="h-8 w-8" />
										</div>
									)}
								</motion.div>

								<div className="flex-1 min-w-0">
									<motion.div
										variants={itemVariants}
										className="flex flex-wrap items-baseline gap-3 mb-2"
									>
										<h2 className="text-xl font-bold tracking-tight text-foreground">
											{toolName}
										</h2>
										{vendor && (
											<span className="text-xs text-muted-foreground/60 uppercase tracking-widest">
												{vendor}
											</span>
										)}
									</motion.div>

									<motion.div
										variants={itemVariants}
										className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground/80 mb-6"
									>
										<span className="font-semibold text-foreground">
											{formattedVersion || version}
										</span>
										<span className="text-muted-foreground/30">•</span>
										{releaseDate ? (
											<time dateTime={releaseDate.toString()}>
												{formatDate(releaseDate)}
											</time>
										) : (
											<span>Pending</span>
										)}
									</motion.div>

									{/* Summary/Headline */}
									{headline && (
										<motion.p
											variants={itemVariants}
											className="text-base text-foreground/90 leading-relaxed mb-6 border-l-2 border-white/10 pl-4"
										>
											{headline}
										</motion.p>
									)}

									{/* Stats - Text based */}
									<motion.div
										variants={itemVariants}
										className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground/60 bg-white/[0.02] p-3 rounded border border-white/5"
									>
										<div className="flex items-center gap-2">
											<span className="text-foreground">{changeCount}</span>
											<span>files changed</span>
										</div>
										{Object.entries(changesByType).length > 0 && (
											<>
												<span className="text-white/10">|</span>
												<div className="flex gap-4">
													{Object.entries(changesByType)
														.sort(([, a], [, b]) => b - a)
														.map(([type, count]) => (
															<span key={type}>
																<span className="text-foreground">{count}</span>{' '}
																{type.toLowerCase()}
															</span>
														))}
												</div>
											</>
										)}
									</motion.div>
								</div>
							</div>

							{/* CTA - Prompt style */}
							<motion.div
								variants={itemVariants}
								className="mt-8 pt-6 border-t border-white/5 flex items-center justify-end"
							>
								<Link
									to="/tools/$slug/releases/$version"
									params={{ slug: toolSlug, version }}
									className="group/btn inline-flex items-center gap-3 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
								>
									<span>Read full changelog</span>
									<ArrowRight className="size-4 transition-transform duration-700 ease-out group-hover:translate-x-1 group-hover/btn:rotate-180" />
								</Link>
							</motion.div>
						</motion.div>
					)}
				</motion.div>
			</div>
		</Card>
	)
}
