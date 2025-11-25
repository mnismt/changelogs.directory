import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SparklesCore } from '@/components/ui/sparkles'
import { formatDate } from '@/lib/date-utils'

interface ReleaseHeroProps {
	toolSlug: string
	toolName: string
	version: string
	releaseDate: Date | string | null
	changeCount: number
	logo: React.ReactNode
}

export function ReleaseHero({
	toolSlug,
	toolName,
	version,
	releaseDate,
	changeCount,
	logo,
}: ReleaseHeroProps) {
	const [systemStatus, setSystemStatus] = useState<'BOOTING' | 'READY'>(
		'BOOTING',
	)

	useEffect(() => {
		const timer = setTimeout(() => {
			setSystemStatus('READY')
		}, 2000)
		return () => clearTimeout(timer)
	}, [])

	const formattedDate = formatDate(releaseDate, 'MMMM d, yyyy')

	return (
		<div className="relative mb-16">
			{/* Sparkles Background */}
			<div className="absolute inset-x-0 -top-20 -bottom-20 opacity-20 pointer-events-none">
				<SparklesCore
					background="transparent"
					minSize={0.4}
					maxSize={1}
					particleDensity={30}
					className="h-full w-full"
					particleColor="#FFFFFF"
				/>
			</div>

			<motion.div
				initial="hidden"
				animate="visible"
				variants={{
					hidden: { opacity: 0 },
					visible: {
						opacity: 1,
						transition: {
							staggerChildren: 0.1,
							delayChildren: 0.2,
						},
					},
				}}
				className="relative z-10 space-y-8"
			>
				{/* Breadcrumbs */}
				<motion.div
					variants={{
						hidden: { opacity: 0, y: -10 },
						visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
					}}
					className="flex items-center gap-2 font-mono text-sm text-muted-foreground/60"
				>
					<Link to="/" className="hover:text-foreground transition-colors">
						~
					</Link>
					<span>/</span>
					<Link to="/tools" className="hover:text-foreground transition-colors">
						tools
					</Link>
					<span>/</span>
					<Link
						to="/tools/$slug"
						params={{ slug: toolSlug }}
						className="hover:text-foreground transition-colors"
					>
						{toolSlug}
					</Link>
					<span>/</span>
					<span className="text-foreground">{version}</span>
				</motion.div>

				{/* Title & Logo */}
				<div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
					<motion.div
						variants={{
							hidden: { opacity: 0, scale: 0.8, rotate: -10 },
							visible: {
								opacity: 1,
								scale: 1,
								rotate: 0,
								transition: { type: 'spring', stiffness: 100, damping: 15 },
							},
						}}
						className="relative group"
					>
						<div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-white/0 rounded-xl opacity-50 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
						<div className="relative flex size-16 md:size-20 items-center justify-center rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
							<div className="size-10 md:size-12 text-foreground [&>svg]:size-full [&>svg]:fill-foreground">
								{logo}
							</div>
						</div>
					</motion.div>

					<div className="space-y-2">
						<motion.div
							variants={{
								hidden: { opacity: 0, x: -20 },
								visible: {
									opacity: 1,
									x: 0,
									transition: { duration: 0.5 },
								},
							}}
							className="flex items-baseline gap-4"
						>
							<h1 className="font-mono text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
								{version}
							</h1>
							<span className="text-xl text-muted-foreground font-mono">
								{toolName}
							</span>
						</motion.div>
					</div>
				</div>

				{/* System Stats */}
				<motion.div
					variants={{
						hidden: { opacity: 0, width: '0%' },
						visible: {
							opacity: 1,
							width: '100%',
							transition: { duration: 0.8, ease: 'circOut' },
						},
					}}
					className="flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-xs text-muted-foreground border-y border-white/5 py-4 bg-white/[0.02] overflow-hidden whitespace-nowrap"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8 }}
						className="flex items-center gap-8 w-full"
					>
						{/* Status Indicator */}
						<div className="flex items-center gap-2 min-w-[140px]">
							<AnimatePresence mode="wait">
								{systemStatus === 'BOOTING' ? (
									<motion.div
										key="booting"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.5 }}
										className="flex items-center gap-2"
									>
										<span className="size-1.5 rounded-full bg-yellow-500/80 animate-pulse" />
										<span className="tracking-wider text-yellow-500/80">
											ANALYZING...
										</span>
									</motion.div>
								) : (
									<motion.div
										key="ready"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.5 }}
										className="flex items-center gap-2"
									>
										<span className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
										<span className="tracking-wider text-foreground">
											STATUS: DEPLOYED
										</span>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-muted-foreground/40">RELEASE_DATE:</span>
							<span className="text-foreground">{formattedDate}</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-muted-foreground/40">CHANGES:</span>
							<span className="text-foreground">{changeCount}</span>
						</div>
					</motion.div>
				</motion.div>
			</motion.div>
		</div>
	)
}
