import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { type ReactNode, useState } from 'react'
import { CompareMobile } from '@/components/compare/compare-mobile'
import {
	type CompareView,
	CompareViewToggle,
} from '@/components/compare/compare-view-toggle'
import { CompareHoverProvider } from '@/components/compare/hover-context'
import { getHeadlineValue, PlansCard } from '@/components/compare/plans-card'
import { PlansTable } from '@/components/compare/plans-table'
import { CompareValueChart } from '@/components/compare/value-chart'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SparklesCore } from '@/components/ui/sparkles'
import { TOOL_PLANS } from '@/data/tool-plans'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/compare')({
	component: ComparePage,
})

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

/** Timezone-safe "2026-05-29" → "May 29, 2026". Empty string if unparseable. */
function formatVerifiedDate(iso: string) {
	const [y, m, d] = iso.split('-')
	const month = MONTHS[Number(m) - 1]
	return month ? `${month} ${Number(d)}, ${y}` : ''
}

function ComparePage() {
	const official = TOOL_PLANS.filter((g) => g.bucket === 'official')
	const harnesses = TOOL_PLANS.filter((g) => g.bucket === 'harness')
	const [view, setView] = useState<CompareView>('cards')

	// Freshness + scope, derived from the data so the hero can never go stale.
	const toolCount = TOOL_PLANS.length
	const verified = formatVerifiedDate(
		TOOL_PLANS.reduce(
			(latest, g) => (g.lastVerified > latest ? g.lastVerified : latest),
			'',
		),
	)
	let paidPlans = 0
	let bestReturn = 0
	for (const g of TOOL_PLANS) {
		const eff = g.tokenEfficiency ?? 1
		for (const p of g.plans) {
			if (typeof p.priceUSD !== 'number' || p.priceUSD <= 0 || !p.apiValueUSD)
				continue
			paidPlans++
			const { headlineRatio } = getHeadlineValue(p.apiValueUSD, p.priceUSD, eff)
			if (headlineRatio > bestReturn) bestReturn = headlineRatio
		}
	}

	return (
		<CompareHoverProvider>
			<div className="relative min-h-[calc(100vh-14rem)] px-4 pt-24 pb-16 [padding-bottom:calc(7rem+env(safe-area-inset-bottom))] sm:pt-28 sm:[padding-bottom:calc(7rem+env(safe-area-inset-bottom))] md:[padding-bottom:5rem]">
				<div className="mx-auto max-w-7xl">
					{/* Hero — starfield + eyebrow + stat cards, matching the home/tools heroes. */}
					<div className="relative mb-20 sm:mb-24">
						<div className="pointer-events-none absolute inset-x-0 -top-28 -bottom-16 opacity-30">
							<SparklesCore
								background="transparent"
								minSize={0.4}
								maxSize={1}
								particleDensity={70}
								className="h-full w-full"
								particleColor="#FFFFFF"
							/>
						</div>

						<motion.div
							initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
							animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
							transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
							className="relative z-10 flex flex-col items-center text-center"
						>
							{verified && (
								<span className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 backdrop-blur-sm">
									<span className="relative flex size-1.5">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
										<span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
									</span>
									Verified {verified}
								</span>
							)}
							<h1 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
								What your AI coding plan is really worth
							</h1>
							<p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
								Every paid tier and free option across {toolCount} tools —
								priced by what each dollar actually buys back.
							</p>

							<div className="mt-12 grid w-full max-w-3xl grid-cols-3 gap-3 sm:gap-6">
								<StatCard label="Tools tracked" accent="foreground">
									<AnimatedNumber
										value={toolCount}
										className="font-mono text-2xl font-bold text-foreground sm:text-3xl"
									/>
								</StatCard>
								<StatCard label="Paid plans priced" accent="sky">
									<AnimatedNumber
										value={paidPlans}
										className="font-mono text-2xl font-bold text-foreground sm:text-3xl"
									/>
								</StatCard>
								<StatCard label="Best return" accent="emerald">
									<span className="flex items-baseline font-mono text-2xl font-bold text-emerald-300 sm:text-3xl">
										<AnimatedNumber value={bestReturn} />
										<span className="text-emerald-400/80">×</span>
									</span>
								</StatCard>
							</div>
						</motion.div>
					</div>

					{/* Desktop: value chart hero, then card grid or alignable table (>= md). */}
					<div className="hidden md:block">
						<CompareValueChart groups={[...official, ...harnesses]} />

						<div className="mb-8 flex justify-center">
							<CompareViewToggle value={view} onChange={setView} />
						</div>

						{view === 'cards' ? (
							<>
								<Section
									title="Official providers"
									description="CLIs from the model vendor — Anthropic, OpenAI, Google."
									groups={official}
									indexOffset={0}
								/>

								<div className="h-14" />

								<Section
									title="Harnesses"
									description="IDEs and agents that route to multiple model providers."
									groups={harnesses}
									indexOffset={official.length}
								/>
							</>
						) : (
							<PlansTable official={official} harness={harnesses} />
						)}
					</div>

					{/* Mobile: native row list + drill-down bottom sheet (< md). */}
					<CompareMobile official={official} harness={harnesses} />
				</div>
			</div>
		</CompareHoverProvider>
	)
}

/** Hero stat tile, mirroring the tools-directory stat cards (calm card + hover glow). */
const STAT_ACCENT = {
	foreground: 'hover:border-foreground/30 from-foreground/5',
	sky: 'hover:border-sky-500/30 from-sky-500/5',
	emerald: 'hover:border-emerald-500/30 from-emerald-500/5',
} as const

function StatCard({
	label,
	accent,
	children,
}: {
	label: string
	accent: keyof typeof STAT_ACCENT
	children: ReactNode
}) {
	const a = STAT_ACCENT[accent]
	return (
		<div
			className={cn(
				'group relative overflow-hidden rounded-xl border border-border/40 bg-card/20 px-3 py-4 backdrop-blur-sm transition-colors duration-500',
				a.split(' ')[0],
			)}
		>
			<div
				className={cn(
					'absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100',
					a.split(' ')[1],
				)}
			/>
			<div className="relative flex flex-col items-center justify-center gap-1.5">
				{children}
				<span className="text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70 sm:text-[10px]">
					{label}
				</span>
			</div>
		</div>
	)
}

function Section({
	title,
	description,
	groups,
	indexOffset,
}: {
	title: string
	description: string
	groups: typeof TOOL_PLANS
	indexOffset: number
}) {
	return (
		<section>
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
				className="mb-6 flex flex-col gap-1"
			>
				<h2 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
					{title}
				</h2>
				<p className="text-sm text-muted-foreground">{description}</p>
			</motion.div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{groups.map((group, i) => (
					<motion.div
						key={group.slug}
						initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
						animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
						transition={{
							duration: 0.5,
							delay: 0.15 + (indexOffset + i) * 0.06,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<PlansCard group={group} />
					</motion.div>
				))}
			</div>
		</section>
	)
}
