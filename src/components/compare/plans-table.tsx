import { ArrowUpRight, ChevronRight, Info, Package } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import {
	computeBestPlanName,
	DeprecationBadge,
	EfficiencyNote,
	formatHost,
	formatMoney,
	formatPrice,
	getGroupMaxValue,
	getHeadlineValue,
	ModelRow,
	PlanRow,
	SectionLabel,
	subsidyValueClass,
	UptimeIndicator,
	ValueBar,
	ValueLegend,
} from '@/components/compare/plans-card'
import type { ToolPlanGroup } from '@/data/tool-plans'
import {
	getProviderLabel,
	getProviderLogo,
	groupModelsByProvider,
} from '@/lib/model-providers'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface PlansTableProps {
	official: ToolPlanGroup[]
	harness: ToolPlanGroup[]
}

const COLS = 6

/**
 * The compare-as-matrix view: one row per tool, every column aligned so values
 * stack vertically for true cross-tool reading — the thing the card grid can't
 * do. Crucially, every value bar shares ONE global dollar scale (the biggest
 * "get" across all tools), so a $4.5k bar really is longer than a $1.2k one.
 * Click any row to expand its full plans / models / gotchas inline — the depth
 * of the Cards view, without leaving the matrix.
 */
export function PlansTable({ official, harness }: PlansTableProps) {
	const all = [...official, ...harness]
	const globalMax = Math.max(...all.map(getGroupMaxValue), 1)

	// Multi-open accordion: a Set of expanded slugs lets users open several rows
	// at once to read their plans/models side by side — the point of the table.
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const toggle = (slug: string) =>
		setExpanded((prev) => {
			const next = new Set(prev)
			if (next.has(slug)) next.delete(slug)
			else next.add(slug)
			return next
		})

	return (
		<motion.div
			initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
			animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
			className="overflow-hidden rounded-xl border border-border/60 bg-card/30 backdrop-blur-sm"
		>
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b border-border/60">
						<Th className="text-left">Tool</Th>
						<Th className="text-left">Models</Th>
						<Th className="text-left">Best plan</Th>
						<Th className="text-right">Price</Th>
						<Th className="text-left">API value</Th>
						<Th className="text-right">Status</Th>
					</tr>
				</thead>
				<tbody>
					<BucketHeader
						title="Official providers"
						description="CLIs from the model vendor — Anthropic, OpenAI, Google."
					/>
					{official.map((g, i) => (
						<ToolTableRow
							key={g.slug}
							group={g}
							globalMax={globalMax}
							index={i}
							isExpanded={expanded.has(g.slug)}
							onToggle={() => toggle(g.slug)}
						/>
					))}
					<BucketHeader
						title="Harnesses"
						description="IDEs and agents that route to multiple model providers."
					/>
					{harness.map((g, i) => (
						<ToolTableRow
							key={g.slug}
							group={g}
							globalMax={globalMax}
							index={official.length + i}
							isExpanded={expanded.has(g.slug)}
							onToggle={() => toggle(g.slug)}
						/>
					))}
				</tbody>
			</table>
		</motion.div>
	)
}

function Th({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<th
			className={cn(
				'px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70',
				className,
			)}
		>
			{children}
		</th>
	)
}

function BucketHeader({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return (
		<tr className="border-b border-border/40 bg-secondary/20">
			<td colSpan={COLS} className="px-4 py-2.5">
				<div className="flex items-baseline gap-2.5">
					<span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground/90">
						{title}
					</span>
					<span className="truncate text-[11px] text-muted-foreground">
						{description}
					</span>
				</div>
			</td>
		</tr>
	)
}

function ToolTableRow({
	group,
	globalMax,
	index,
	isExpanded,
	onToggle,
}: {
	group: ToolPlanGroup
	globalMax: number
	index: number
	isExpanded: boolean
	onToggle: () => void
}) {
	const logo = getToolLogo(group.slug)
	const isGeminiCli = group.slug === 'gemini-cli'
	const eff = group.tokenEfficiency ?? 1
	const providerGroups = groupModelsByProvider(group.models, group.slug)

	const bestName = computeBestPlanName(group)
	const best = group.plans.find((p) => p.name === bestName)
	const hasValue =
		best?.apiValueUSD && typeof best.priceUSD === 'number' && best.priceUSD > 0
	const headline =
		hasValue && best?.apiValueUSD && typeof best.priceUSD === 'number'
			? getHeadlineValue(best.apiValueUSD, best.priceUSD, eff)
			: null

	return (
		<>
			<motion.tr
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.4,
					delay: 0.04 * index,
					ease: [0.22, 1, 0.36, 1],
				}}
				onClick={onToggle}
				aria-expanded={isExpanded}
				className={cn(
					'group cursor-pointer border-b border-border/40 transition-colors hover:bg-secondary/30',
					isExpanded && 'bg-secondary/40',
				)}
			>
				{/* Tool */}
				<td className="px-4 py-3 align-middle">
					<div className="flex items-center gap-2.5">
						<ChevronRight
							className={cn(
								'size-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:text-muted-foreground',
								isExpanded && 'rotate-90 text-muted-foreground',
							)}
						/>
						<a
							href={group.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="flex items-center gap-2.5"
							title={formatHost(group.sourceUrl)}
						>
							<span className="shrink-0">
								{logo ? (
									<span
										className={cn(
											'flex size-7 items-center justify-center rounded p-1 transition-all duration-500',
											'[&>svg]:h-full [&>svg]:w-full',
											isMonochromeLogo(group.slug) &&
												!isGeminiCli &&
												'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
											getLogoHoverClasses(group.slug),
										)}
									>
										{logo}
									</span>
								) : (
									<span className="flex size-7 items-center justify-center rounded bg-secondary/50">
										<Package className="size-3.5 text-muted-foreground" />
									</span>
								)}
							</span>
							<span className="flex min-w-0 flex-col">
								<span className="flex items-center gap-1 font-mono text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground">
									<span className="truncate">{group.name}</span>
									<ArrowUpRight className="size-3 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground/70" />
								</span>
								<span className="truncate font-mono text-[10px] text-muted-foreground">
									{group.vendor}
								</span>
							</span>
						</a>
					</div>
				</td>

				{/* Models */}
				<td className="px-4 py-3 align-middle">
					<div className="flex items-center gap-1.5">
						<span className="flex items-center gap-1">
							{providerGroups.map((pg) => (
								<span
									key={pg.provider}
									className="flex size-4 items-center justify-center [&>svg]:size-full"
									role="img"
									title={`${getProviderLabel(pg.provider)}: ${pg.models.join(', ')}`}
									aria-label={getProviderLabel(pg.provider)}
								>
									{getProviderLogo(pg.provider) ?? (
										<span className="size-1.5 rounded-full bg-muted-foreground/50" />
									)}
								</span>
							))}
						</span>
						<span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">
							{group.models.length}
						</span>
					</div>
				</td>

				{/* Best plan */}
				<td className="px-4 py-3 align-middle">
					{best ? (
						<span className="inline-flex items-center gap-1.5">
							<span className="text-xs font-medium text-foreground/95">
								{best.name}
							</span>
							{headline && (
								<span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1 py-[0.5px] font-mono text-[7px] uppercase tracking-wider text-emerald-300/95">
									best
								</span>
							)}
						</span>
					) : (
						<span className="text-xs text-muted-foreground/50">—</span>
					)}
				</td>

				{/* Price */}
				<td className="px-4 py-3 text-right align-middle">
					<span
						className={cn(
							'font-mono text-xs tabular-nums',
							best?.priceUSD === 0 ? 'text-emerald-400/90' : 'text-foreground',
						)}
					>
						{best ? formatPrice(best) : '—'}
					</span>
				</td>

				{/* API value */}
				<td className="px-4 py-3 align-middle">
					{headline &&
					best?.apiValueUSD &&
					typeof best.priceUSD === 'number' ? (
						<div className="group/plan flex w-40 max-w-full flex-col gap-1">
							<ValueBar
								price={best.priceUSD}
								value={best.apiValueUSD}
								tone={headline.tone}
								size="sm"
								maxValue={globalMax}
								tokenEfficiency={eff}
							/>
							<span className="flex items-baseline gap-1.5 font-mono text-[11px] tabular-nums">
								<span
									className={cn(
										'font-semibold',
										subsidyValueClass[headline.tone],
									)}
								>
									~{formatMoney(headline.headlineValue)}
								</span>
								<span className="text-muted-foreground/45">
									· {headline.headlineRatio}×
								</span>
							</span>
						</div>
					) : (
						<span className="text-xs text-muted-foreground/50">—</span>
					)}
				</td>

				{/* Status */}
				<td className="px-4 py-3 text-right align-middle">
					<div className="flex flex-col items-end gap-1">
						{group.deprecated ? (
							<DeprecationBadge info={group.deprecated} />
						) : typeof group.uptime90d === 'number' ? (
							<UptimeIndicator pct={group.uptime90d} />
						) : (
							<span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/80">
								<span className="relative flex size-1.5">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50" />
									<span className="relative inline-flex size-1.5 rounded-full bg-emerald-500/80" />
								</span>
								live
							</span>
						)}
						<span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums">
							{group.lastVerified}
						</span>
					</div>
				</td>
			</motion.tr>

			{/* Expandable detail — always mounted so the height tween runs both ways;
			    collapses to a zero-height, border-free row when closed. */}
			<tr className={cn(isExpanded ? 'border-b border-border/40' : 'border-0')}>
				<td colSpan={COLS} className="p-0">
					<motion.div
						initial={false}
						animate={{ height: isExpanded ? 'auto' : 0 }}
						transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
						className="overflow-hidden"
					>
						<ToolTableDetail group={group} />
					</motion.div>
				</td>
			</tr>
		</>
	)
}

/**
 * The inline drill-down a table row expands into. Same sections as the mobile
 * detail sheet — models grouped by provider, every plan with its API-value bar,
 * and the "good to know" notes — laid out two-up to use the table's full width.
 */
function ToolTableDetail({ group }: { group: ToolPlanGroup }) {
	const providerGroups = groupModelsByProvider(group.models, group.slug)
	const bestPlanName = computeBestPlanName(group)
	const maxValue = getGroupMaxValue(group)
	const eff = group.tokenEfficiency ?? 1

	return (
		<div className="grid gap-x-8 gap-y-5 px-4 pt-1 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
			{/* Left: tagline, models, gotchas */}
			<div className="flex flex-col gap-4">
				<p className="text-[13px] leading-relaxed text-muted-foreground">
					{group.tagline}
				</p>

				<section className="flex flex-col gap-2">
					<SectionLabel>Models</SectionLabel>
					<div className="flex flex-col gap-1.5">
						{providerGroups.map((pg) => (
							<ModelRow key={pg.provider} group={pg} dense={false} />
						))}
					</div>
				</section>

				{group.gotchas && group.gotchas.length > 0 && (
					<section className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card/40 p-3.5">
						<div className="flex items-center gap-1.5">
							<Info className="size-3.5 shrink-0 text-muted-foreground" />
							<SectionLabel>Good to know</SectionLabel>
						</div>
						<ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-muted-foreground">
							{group.gotchas.map((g) => (
								<li key={g} className="flex gap-1.5">
									<span className="select-none text-muted-foreground/40">
										›
									</span>
									<span>{g}</span>
								</li>
							))}
						</ul>
					</section>
				)}
			</div>

			{/* Right: every plan with its value bar */}
			<section className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-2">
					<SectionLabel>Plans · API value</SectionLabel>
					<ValueLegend />
				</div>
				<ul className="-mx-2 flex flex-col gap-1">
					{group.plans.map((plan) => {
						const isBest = plan.name === bestPlanName
						return (
							<PlanRow
								key={plan.name}
								plan={plan}
								groupSlug={group.slug}
								isBest={isBest}
								forceBest={isBest}
								dense={false}
								tokenEfficiency={eff}
								maxValue={maxValue}
							/>
						)
					})}
				</ul>
				{group.tokenEfficiency && group.tokenEfficiency > 1 && (
					<EfficiencyNote name={group.name} factor={group.tokenEfficiency} />
				)}
			</section>
		</div>
	)
}
