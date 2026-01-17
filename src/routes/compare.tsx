import { createFileRoute, Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

export const Route = createFileRoute('/compare')({
	component: ComparePage,
})

function ComparePage() {
	return (
		<div className="relative flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-20 overflow-hidden">
			<BackgroundGrid />

			{/* Background Elements */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
				<motion.div
					initial={{ opacity: 0, x: -100 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 1.5, ease: 'easeOut' }}
					className="absolute top-20 left-[10%] font-mono text-[20vw] font-bold text-foreground/[0.03]"
				>
					{'//'}
				</motion.div>
				<motion.div
					initial={{ opacity: 0, x: 100 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
					className="absolute bottom-20 right-[10%] font-mono text-[25vw] font-bold text-foreground/[0.03]"
				>
					VS
				</motion.div>
			</div>

			<div className="relative z-10 mx-auto max-w-2xl text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-8 flex justify-center"
				>
					<SystemStatusBadge />
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className="mb-6 font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
				>
					Compare mode is <br className="hidden sm:block" />
					<span className="text-muted-foreground relative inline-block">
						still in the lab.
						<motion.span
							initial={{ width: '0%' }}
							animate={{ width: '100%' }}
							transition={{ duration: 1, delay: 0.8, ease: 'circOut' }}
							className="absolute bottom-0 left-0 h-[2px] bg-primary/20"
						/>
					</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="mx-auto mb-10 max-w-lg font-mono text-sm leading-relaxed text-muted-foreground sm:text-base"
				>
					We're cooking a split-screen diff viewer that lets you pit editor
					releases against one another, feature by feature. Think side-by-side
					commits with pricing badges that match your caffeine habit.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="mx-auto mb-12 flex max-w-md flex-wrap justify-center gap-3 font-mono text-xs uppercase text-muted-foreground/80"
				>
					<FeaturePill icon="<>" label="diff summaries" delay={0.4} />
					<FeaturePill icon="$" label="price compare" delay={0.5} />
					<FeaturePill icon="v" label="version matrix" delay={0.6} />
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="mx-auto max-w-xs"
				>
					<Link to="/subscribe">
						<HoverBorderGradient
							containerClassName="w-full"
							className="flex w-full items-center justify-center font-mono text-sm uppercase tracking-wider bg-background/50 backdrop-blur-sm"
						>
							Join the Waitlist
						</HoverBorderGradient>
					</Link>
					<p className="mt-4 font-mono text-[10px] text-muted-foreground/60">
						Ping us if you want early access to the private build.
					</p>
				</motion.div>
			</div>
		</div>
	)
}

function SystemStatusBadge() {
	const states = ['COMPILING...', 'LINKING...', 'OPTIMIZING...', 'PENDING']
	const [index, setIndex] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setIndex((prev) => (prev + 1) % states.length)
		}, 2000)
		return () => clearInterval(interval)
	}, [])

	return (
		<div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 backdrop-blur-sm">
			<span className="relative flex h-2 w-2">
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
				<span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
			</span>
			<div className="w-24 overflow-hidden">
				<AnimatePresence mode="wait">
					<motion.span
						key={states[index]}
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -10, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="block font-mono text-[10px] font-medium uppercase tracking-widest text-amber-500"
					>
						{states[index]}
					</motion.span>
				</AnimatePresence>
			</div>
		</div>
	)
}

function FeaturePill({
	icon,
	label,
	delay,
}: {
	icon: string
	label: string
	delay: number
}) {
	return (
		<motion.span
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3, delay }}
			whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
			whileTap={{ scale: 0.95 }}
			className="flex cursor-default items-center gap-2 rounded border border-border/40 bg-background/20 px-4 py-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background/40"
		>
			<span className="text-muted-foreground/70">{icon}</span>
			{label}
		</motion.span>
	)
}

function BackgroundGrid() {
	return (
		<div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px),
                           linear-gradient(to bottom, #888 1px, transparent 1px)`,
					backgroundSize: '40px 40px',
					maskImage:
						'radial-gradient(circle at center, black 40%, transparent 100%)',
				}}
			/>
		</div>
	)
}
