import {
	ArrowUpRight,
	ChevronRight,
	Package,
	TriangleAlert,
} from 'lucide-react'
import { motion } from 'motion/react'
import {
	planHoverId,
	priceTier,
	useCompareHover,
} from '@/components/compare/hover-context'
import { Card } from '@/components/ui/card'
import type {
	ApiValueEstimate,
	ToolPlan,
	ToolPlanGroup,
} from '@/data/tool-plans'
import {
	getProviderLabel,
	getProviderLogo,
	groupModelsByProvider,
	type ModelProvider,
} from '@/lib/model-providers'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface PlansCardProps {
	group: ToolPlanGroup
}

export function PlansCard({ group }: PlansCardProps) {
	const logo = getToolLogo(group.slug)
	const isGeminiCli = group.slug === 'gemini-cli'
	const bestPlanName = computeBestPlanName(group)
	const maxValue = getGroupMaxValue(group)

	return (
		<motion.div
			whileHover={{ y: -2 }}
			transition={{ type: 'spring', stiffness: 320, damping: 26 }}
			className="h-full"
		>
			<Card
				className={cn(
					'group relative h-full overflow-hidden border-border/60 bg-card/40',
					'backdrop-blur-sm transition-colors duration-500 ease-out',
					'hover:border-foreground/30 hover:bg-card/70 hover:shadow-lg hover:shadow-black/40',
				)}
			>
				<div
					className={cn(
						'absolute top-0 left-0 right-0 h-px',
						'bg-gradient-to-r from-transparent via-foreground/60 to-transparent',
						'opacity-0 transition-opacity duration-500 group-hover:opacity-100',
					)}
				/>

				<div className="flex h-full flex-col gap-4 px-5 py-5">
					<header className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0">
							<div className="shrink-0">
								{logo ? (
									<div
										className={cn(
											'flex size-9 items-center justify-center rounded p-1.5 transition-all duration-500',
											'[&>svg]:h-full [&>svg]:w-full',
											isMonochromeLogo(group.slug) &&
												!isGeminiCli &&
												'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
											getLogoHoverClasses(group.slug),
										)}
									>
										{logo}
									</div>
								) : (
									<div className="flex size-9 items-center justify-center rounded bg-secondary/50">
										<Package className="size-4 text-muted-foreground" />
									</div>
								)}
							</div>
							<div className="min-w-0">
								<h3 className="truncate font-mono text-sm font-bold tracking-tight">
									{group.name}
								</h3>
								<span className="block truncate font-mono text-[11px] text-muted-foreground">
									{group.vendor}
								</span>
							</div>
						</div>
						<div className="flex shrink-0 flex-col items-end gap-1">
							<span
								className={cn(
									'rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
									group.bucket === 'official'
										? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400/90'
										: 'border-border/60 bg-secondary/40 text-muted-foreground',
								)}
							>
								{group.bucket}
							</span>
							{group.deprecated && <DeprecationBadge info={group.deprecated} />}
						</div>
					</header>

					<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
						{group.tagline}
					</p>

					<HeroStrip group={group} maxValue={maxValue} />

					<section className="flex flex-col gap-1.5">
						<SectionLabel>Plans · API value</SectionLabel>
						<ul className="-mx-2 flex flex-col gap-0.5">
							{group.plans.map((plan) => (
								<CompactPlanRow
									key={plan.name}
									plan={plan}
									groupSlug={group.slug}
									isBest={plan.name === bestPlanName}
									tokenEfficiency={group.tokenEfficiency ?? 1}
									maxValue={maxValue}
								/>
							))}
						</ul>
						{group.tokenEfficiency && group.tokenEfficiency > 1 && (
							<EfficiencyNote
								name={group.name}
								factor={group.tokenEfficiency}
							/>
						)}
					</section>

					<div className="flex flex-col gap-0.5 border-t border-border/50 pt-2">
						<ModelsDisclosure models={group.models} slug={group.slug} />
						{group.gotchas && group.gotchas.length > 0 && (
							<GotchasDisclosure gotchas={group.gotchas} />
						)}
					</div>

					<footer className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3 font-mono text-[10px] text-muted-foreground">
						<a
							href={group.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								'inline-flex items-center gap-1.5 truncate transition-colors',
								'hover:text-foreground [&>svg]:transition-transform',
								'hover:[&>svg]:translate-x-0.5 hover:[&>svg]:-translate-y-0.5',
							)}
						>
							<span className="truncate">{formatHost(group.sourceUrl)}</span>
							<ArrowUpRight className="size-3 shrink-0" />
						</a>
						<div className="flex items-center gap-3 whitespace-nowrap">
							{typeof group.uptime90d === 'number' ? (
								<UptimeIndicator pct={group.uptime90d} />
							) : (
								<span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
									<span className="relative flex size-1.5">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50" />
										<span className="relative inline-flex size-1.5 rounded-full bg-emerald-500/80" />
									</span>
									{group.lastVerified}
								</span>
							)}
							{typeof group.uptime90d === 'number' && (
								<span className="text-muted-foreground/50 tabular-nums">
									{group.lastVerified}
								</span>
							)}
						</div>
					</footer>
				</div>
			</Card>
		</motion.div>
	)
}

/**
 * The card's hero: answers "what's the best deal here?" in one glance. Leads
 * with the best-value plan — its price, the shared-scale value bar, and the
 * headline "get ~$X · Nx" — so the eye lands on one loud green instead of seven
 * quiet ones. Falls back to the cheapest entry point when no plan is
 * subsidy-rankable (e.g. BYOK / free-only tools).
 */
function HeroStrip({
	group,
	maxValue,
}: {
	group: ToolPlanGroup
	maxValue: number
}) {
	const eff = group.tokenEfficiency ?? 1
	const bestName = computeBestPlanName(group)
	const best = group.plans.find((p) => p.name === bestName)

	if (
		!best ||
		!best.apiValueUSD ||
		typeof best.priceUSD !== 'number' ||
		best.priceUSD <= 0
	) {
		const entry =
			group.plans.find((p) => p.priceUSD === 0) ??
			group.plans.find((p) => typeof p.priceUSD === 'number') ??
			group.plans[0]
		return (
			<div className="rounded-lg border border-border/50 bg-secondary/20 px-3.5 py-2.5">
				<SectionLabel>Starts at</SectionLabel>
				<div className="mt-1 flex items-baseline gap-2">
					<span className="font-mono text-base font-bold text-foreground">
						{entry ? formatPrice(entry) : '—'}
					</span>
					{entry && (
						<span className="truncate font-mono text-xs text-muted-foreground">
							{entry.name}
						</span>
					)}
				</div>
			</div>
		)
	}

	const { headlineValue, headlineRatio, tone } = getHeadlineValue(
		best.apiValueUSD,
		best.priceUSD,
		eff,
	)

	return (
		<div className="group/plan rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3.5 py-2.5">
			<SectionLabel className="text-emerald-400/80">Best value</SectionLabel>
			<div className="mt-1 flex items-baseline gap-1.5">
				<span className="truncate font-mono text-sm font-bold text-foreground">
					{best.name}
				</span>
				<span className="select-none text-muted-foreground/40">·</span>
				<span className="shrink-0 font-mono text-sm font-bold text-foreground tabular-nums">
					{formatPrice(best)}
				</span>
			</div>
			<div className="mt-2">
				<ValueBar
					price={best.priceUSD}
					value={best.apiValueUSD}
					tone={tone}
					size="lg"
					maxValue={maxValue}
					tokenEfficiency={eff}
				/>
			</div>
			<div className="mt-1.5 flex items-baseline gap-1.5 font-mono text-[11px] tabular-nums">
				<span className="text-muted-foreground/60">get</span>
				<span className={cn('font-semibold', subsidyValueClass[tone])}>
					~{formatMoney(headlineValue)}
				</span>
				<span className="text-muted-foreground/45">
					· {headlineRatio}× value
				</span>
			</div>
			{best.subsidyNote && (
				<p className="mt-1 flex gap-1 text-[10px] italic leading-snug text-emerald-400/70">
					<span className="select-none opacity-70">↳</span>
					<span>{best.subsidyNote}</span>
				</p>
			)}
		</div>
	)
}

/**
 * One-line plan row for the desktop card: name · price · mini value bar · ratio.
 * Drops the redundant "pay → get" prose (the bar already encodes it) and tucks
 * quota/notes into the row tooltip, so a 5-plan card stays calm. Keeps the
 * shared hover-context best/peer/dim cross-highlighting.
 */
function CompactPlanRow({
	plan,
	groupSlug,
	isBest,
	tokenEfficiency,
	maxValue,
}: {
	plan: ToolPlan
	groupSlug: string
	isBest: boolean
	tokenEfficiency: number
	maxValue: number
}) {
	const { hoveredId, hoveredTier, setHovered } = useCompareHover()
	const id = planHoverId(groupSlug, plan.name)
	const tier = priceTier(plan.priceUSD)
	const anyHovered = hoveredId !== null
	const isHovered = hoveredId === id
	const isPeer =
		anyHovered &&
		!isHovered &&
		hoveredTier !== null &&
		tier !== null &&
		tier === hoveredTier
	const showBestHighlight = anyHovered && !isHovered && isBest
	const showPeerHighlight = anyHovered && !isHovered && isPeer && !isBest
	const isDimmed = anyHovered && !isHovered && !isBest && !isPeer

	const hasValue =
		!!plan.apiValueUSD && typeof plan.priceUSD === 'number' && plan.priceUSD > 0
	const headline =
		hasValue && plan.apiValueUSD && typeof plan.priceUSD === 'number'
			? getHeadlineValue(plan.apiValueUSD, plan.priceUSD, tokenEfficiency)
			: null

	const priceLabel =
		plan.priceUSD === 'custom'
			? 'Custom'
			: plan.priceUSD === 0
				? 'Free'
				: `$${plan.priceUSD}`
	const detail = plan.quota || plan.notes

	return (
		<li
			onMouseEnter={() => setHovered(id, tier)}
			onMouseLeave={() => setHovered(null)}
			title={detail || undefined}
			className={cn(
				'group/plan relative flex items-center gap-2 rounded-md px-2 py-1.5',
				'transition-all duration-300 ease-out',
				!isDimmed && 'hover:bg-secondary/40',
				isDimmed && 'opacity-30 blur-[0.4px] saturate-50',
				isHovered && 'bg-secondary/40 ring-1 ring-foreground/15',
				showPeerHighlight && 'bg-foreground/[0.025] ring-1 ring-foreground/15',
				showBestHighlight && 'bg-emerald-500/[0.05] ring-1 ring-emerald-400/30',
			)}
		>
			<span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-foreground/95">
				<span className="truncate">{plan.name}</span>
				{isBest && (
					<span
						className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1 py-[0.5px] font-mono text-[7px] uppercase tracking-wider text-emerald-300/95"
						title="Best deal in this card"
					>
						best
					</span>
				)}
			</span>
			<span
				className={cn(
					'w-12 shrink-0 text-right font-mono text-xs tabular-nums',
					plan.priceUSD === 0
						? 'text-emerald-400/90'
						: plan.priceUSD === 'custom'
							? 'text-foreground/70'
							: 'text-foreground',
				)}
			>
				{priceLabel}
			</span>
			<div className="w-14 shrink-0">
				{hasValue &&
				plan.apiValueUSD &&
				typeof plan.priceUSD === 'number' &&
				headline ? (
					<ValueBar
						price={plan.priceUSD}
						value={plan.apiValueUSD}
						tone={headline.tone}
						size="sm"
						maxValue={maxValue}
						tokenEfficiency={tokenEfficiency}
					/>
				) : null}
			</div>
			<span className="w-8 shrink-0 text-right font-mono text-[10px] text-muted-foreground/70 tabular-nums">
				{headline ? `${headline.headlineRatio}×` : ''}
			</span>
		</li>
	)
}

/** Shared chevron summary for the two card footers' disclosures. */
const disclosureSummaryClass = cn(
	'flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5',
	'text-[11px] transition-colors hover:bg-secondary/40',
	'[&::-webkit-details-marker]:hidden',
)

/**
 * Models collapse into a single glanceable line: the provider logos stay
 * visible (so you can tell at a glance which model families a tool runs),
 * while the full per-provider model names live one click away.
 */
function ModelsDisclosure({
	models,
	slug,
}: {
	models: string[]
	slug: string
}) {
	const providerGroups = groupModelsByProvider(models, slug)

	return (
		<details className="group/disc">
			<summary className={disclosureSummaryClass}>
				<ChevronRight className="size-3 shrink-0 text-muted-foreground/60 transition-transform group-open/disc:rotate-90" />
				<span className="flex items-center gap-1">
					{providerGroups.map((pg) => (
						<span
							key={pg.provider}
							className="flex size-3.5 items-center justify-center [&>svg]:size-full"
							role="img"
							title={getProviderLabel(pg.provider)}
							aria-label={getProviderLabel(pg.provider)}
						>
							{getProviderLogo(pg.provider) ?? (
								<span className="size-1 rounded-full bg-muted-foreground/50" />
							)}
						</span>
					))}
				</span>
				<span className="font-mono uppercase tracking-wider text-muted-foreground">
					{models.length} models
				</span>
			</summary>
			<div className="mt-1 flex flex-col gap-1.5 px-2 pb-1">
				{providerGroups.map((pg) => (
					<ModelRow key={pg.provider} group={pg} />
				))}
			</div>
		</details>
	)
}

/**
 * Gotchas collapse to a calm "N things to know" line — the fine print is there
 * for those who want it, but it no longer dominates the card by default.
 */
function GotchasDisclosure({ gotchas }: { gotchas: string[] }) {
	return (
		<details className="group/disc">
			<summary className={disclosureSummaryClass}>
				<ChevronRight className="size-3 shrink-0 text-amber-500/60 transition-transform group-open/disc:rotate-90" />
				<span className="font-mono uppercase tracking-wider text-amber-500/80">
					{gotchas.length} things to know
				</span>
			</summary>
			<ul className="mt-1 flex flex-col gap-1 border-l-2 border-amber-500/30 px-3 py-1 text-[11px] leading-relaxed text-muted-foreground">
				{gotchas.map((g) => (
					<li key={g} className="flex gap-1.5">
						<span className="select-none text-amber-500/60">›</span>
						<span>{g}</span>
					</li>
				))}
			</ul>
		</details>
	)
}

const SUNSET_MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
]

/** Format an ISO date (YYYY-MM-DD) to a compact "Jun 18" — timezone-safe. */
export function formatSunset(iso: string): string {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
	if (!m) return iso
	const month = SUNSET_MONTHS[Number(m[2]) - 1] ?? ''
	return `${month} ${Number(m[3])}`
}

/**
 * Calm amber pill flagging a tool that's being sunset. Warns without alarming —
 * the successor and date live in the tooltip so the row stays glanceable. When
 * an announcement URL is present (and `interactive`), it becomes a link to the
 * official transition post; `interactive={false}` keeps it a plain span inside
 * tap-target buttons, where nesting an anchor would be invalid markup.
 */
export function DeprecationBadge({
	info,
	size = 'sm',
	className,
	interactive = true,
}: {
	info: { sunsetDate: string; successor?: string; announcementUrl?: string }
	size?: 'sm' | 'lg'
	className?: string
	interactive?: boolean
}) {
	const when = formatSunset(info.sunsetDate)
	const title = info.successor
		? `Sunsets ${when} — moving to ${info.successor}`
		: `Sunsets ${when}`
	const isLink = interactive && !!info.announcementUrl

	const baseClass = cn(
		'inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10',
		'font-mono uppercase tracking-wider text-amber-300/90',
		size === 'lg' ? 'px-2 py-0.5 text-[10px]' : 'px-1.5 py-[1px] text-[9px]',
		isLink &&
			'cursor-pointer transition-colors hover:bg-amber-500/20 hover:text-amber-200',
		className,
	)
	const iconClass = size === 'lg' ? 'size-3' : 'size-2.5'

	if (isLink) {
		return (
			<a
				href={info.announcementUrl}
				target="_blank"
				rel="noopener noreferrer"
				title={`${title} — read the announcement`}
				className={baseClass}
			>
				<TriangleAlert className={iconClass} />
				Sunsets {when}
				<ArrowUpRight className={iconClass} />
			</a>
		)
	}

	return (
		<span title={title} className={baseClass}>
			<TriangleAlert className={iconClass} />
			Sunsets {when}
		</span>
	)
}

export function SectionLabel({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<span
			className={cn(
				'font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground',
				className,
			)}
		>
			{children}
		</span>
	)
}

export function ValueLegend() {
	return (
		<span
			className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground/60"
			title="Read left to right: white is what you pay. The green is the pay-as-you-go API spend you'd otherwise rack up — light green for typical use, bold green stretching further the heavier you go."
		>
			<span className="inline-flex items-center gap-1">
				<span className="size-1.5 rounded-sm bg-foreground/70" />
				you pay
			</span>
			<span className="inline-flex items-center gap-1">
				<span className="size-1.5 rounded-sm bg-emerald-400/30" />
				typical use
			</span>
			<span className="inline-flex items-center gap-1">
				<span className="size-1.5 rounded-sm bg-emerald-400/60" />
				heavy use
			</span>
		</span>
	)
}

export function ModelRow({
	group,
	dense = true,
}: {
	group: { provider: ModelProvider; models: string[] }
	dense?: boolean
}) {
	const logo = getProviderLogo(group.provider)
	const label = getProviderLabel(group.provider)

	return (
		<div
			className={cn(
				'flex items-start gap-2 leading-relaxed',
				dense ? 'text-[11px]' : 'text-[13px]',
			)}
		>
			<div
				className={cn(
					'mt-0.5 flex size-4 shrink-0 items-center justify-center',
					'transition-transform duration-300 group-hover:scale-110',
					'[&>svg]:size-full',
				)}
				role="img"
				title={label}
				aria-label={label}
			>
				{logo ?? (
					<span className="size-1.5 rounded-full bg-muted-foreground/50" />
				)}
			</div>
			<span className="text-foreground/85">{group.models.join(' · ')}</span>
		</div>
	)
}

export function PlanRow({
	plan,
	groupSlug,
	isBest,
	tokenEfficiency,
	maxValue,
	forceBest = false,
	dense = true,
}: {
	plan: ToolPlan
	groupSlug: string
	isBest: boolean
	tokenEfficiency: number
	/** The tool's biggest "get" value ($) — shared bar scale so rows compare. */
	maxValue: number
	forceBest?: boolean
	dense?: boolean
}) {
	const detail = plan.quota || plan.notes
	const showSubsidy =
		!!plan.apiValueUSD && typeof plan.priceUSD === 'number' && plan.priceUSD > 0

	const { hoveredId, hoveredTier, setHovered } = useCompareHover()
	const id = planHoverId(groupSlug, plan.name)
	const tier = priceTier(plan.priceUSD)
	const anyHovered = hoveredId !== null
	const isHovered = hoveredId === id
	const isPeer =
		anyHovered &&
		!isHovered &&
		hoveredTier !== null &&
		tier !== null &&
		tier === hoveredTier
	// forceBest = touch/mobile context: emerald best ring/badge always shown,
	// and dim/peer/blur synthetic-hover states are never applied.
	const showBestHighlight = forceBest || (anyHovered && !isHovered && isBest)
	const showPeerHighlight =
		!forceBest && anyHovered && !isHovered && isPeer && !isBest
	const isDimmed = !forceBest && anyHovered && !isHovered && !isBest && !isPeer

	const hoverHandlers = forceBest
		? {}
		: {
				onMouseEnter: () => setHovered(id, tier),
				onMouseLeave: () => setHovered(null),
			}

	return (
		<li
			{...hoverHandlers}
			className={cn(
				'group/plan relative flex flex-col gap-1.5 rounded-md px-2 py-2',
				'transition-all duration-300 ease-out',
				!isDimmed && !forceBest && 'hover:bg-secondary/40',
				isDimmed && 'opacity-30 blur-[0.4px] saturate-50',
				isHovered && 'bg-secondary/40 ring-1 ring-foreground/15',
				showPeerHighlight && 'bg-foreground/[0.025] ring-1 ring-foreground/15',
				showBestHighlight &&
					'bg-emerald-500/[0.05] ring-1 ring-emerald-400/30 shadow-[0_0_18px_-6px_rgb(16_185_129/0.4)]',
			)}
		>
			<div className="flex items-baseline justify-between gap-3">
				<span
					className={cn(
						'truncate font-medium text-foreground/95',
						'inline-flex items-center gap-1.5',
						dense ? 'text-xs' : 'text-sm',
					)}
				>
					{plan.name}
					{showBestHighlight && (
						<span
							className={cn(
								'rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-[1px]',
								'font-mono text-[8px] uppercase tracking-wider text-emerald-300/95',
							)}
							title="Best deal in this card"
						>
							best
						</span>
					)}
					{showPeerHighlight && (
						<span
							className={cn(
								'rounded-full border border-foreground/20 bg-foreground/5 px-1.5 py-[1px]',
								'font-mono text-[8px] uppercase tracking-wider text-foreground/70',
							)}
							title="Similar price tier"
						>
							peer
						</span>
					)}
				</span>
				<span
					className={cn(
						'shrink-0 whitespace-nowrap font-mono tabular-nums transition-colors',
						dense ? 'text-xs' : 'text-sm',
						plan.priceUSD === 0
							? 'text-emerald-400/90'
							: plan.priceUSD === 'custom'
								? 'text-foreground/70'
								: 'text-foreground group-hover/plan:text-foreground',
					)}
				>
					{formatPrice(plan)}
				</span>
			</div>

			{showSubsidy && plan.apiValueUSD && typeof plan.priceUSD === 'number' && (
				<SubsidyVisualization
					price={plan.priceUSD}
					value={plan.apiValueUSD}
					note={plan.subsidyNote}
					tokenEfficiency={tokenEfficiency}
					maxValue={maxValue}
					dense={dense}
				/>
			)}

			{detail && (
				<span
					className={cn(
						'leading-snug',
						dense
							? 'text-[10px] text-muted-foreground/80'
							: 'text-[12px] text-muted-foreground',
					)}
				>
					{detail}
				</span>
			)}
		</li>
	)
}

/**
 * Single source of truth for the headline subsidy math shared by the desktop
 * SubsidyVisualization and the mobile row/sheet. Keeping this in one place means
 * the glanceable row and the detail sheet never drift apart.
 */
export function getHeadlineValue(
	value: ApiValueEstimate,
	price: number,
	tokenEfficiency: number,
): { headlineValue: number; headlineRatio: number; tone: SubsidyTone } {
	const typicalMid = (value.typical[0] + value.typical[1]) / 2
	const heavyMid = (value.heavy[0] + value.heavy[1]) / 2
	const effTypMult = (typicalMid / price) * tokenEfficiency
	const effHeavyMult = (heavyMid / price) * tokenEfficiency
	const tone = getSubsidyTone(effTypMult, effHeavyMult)

	const headlineValue = heavyMid * tokenEfficiency
	const headlineRatio = Math.max(1, Math.round(headlineValue / price))

	return { headlineValue, headlineRatio, tone }
}

export const subsidyValueClass: Record<SubsidyTone, string> = {
	'at-cost': 'text-muted-foreground/85',
	subtle: 'text-foreground/85',
	good: 'text-emerald-300/90',
	great: 'text-emerald-300/95',
	incredible: 'text-emerald-200',
}

export function SubsidyVisualization({
	price,
	value,
	note,
	tokenEfficiency,
	maxValue,
	dense = true,
}: {
	price: number
	value: ApiValueEstimate
	note?: string
	tokenEfficiency: number
	maxValue: number
	dense?: boolean
}) {
	const { headlineValue, headlineRatio, tone } = getHeadlineValue(
		value,
		price,
		tokenEfficiency,
	)

	const typLow = value.typical[0] * tokenEfficiency
	const heavyHigh = value.heavy[1] * tokenEfficiency

	const isAtCost = tone === 'at-cost'
	// Full range lives in the bar's tooltip — the row states only the plain deal.
	const rangeTitle = `${formatMoney(typLow)} typical → ${formatMoney(heavyHigh)} heavy use`

	return (
		<div className="flex flex-col gap-1.5">
			<ValueBar
				price={price}
				value={value}
				tone={tone}
				size={dense ? 'sm' : 'lg'}
				maxValue={maxValue}
				tokenEfficiency={tokenEfficiency}
				title={rangeTitle}
			/>
			{/* The deal, stated plainly: pay X → get Y. The green "get" amount carries
			    the signal by intensity, so no shouting adjective lands on every row. */}
			<div
				className={cn(
					'flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-mono tabular-nums leading-snug',
					dense ? 'text-[11px]' : 'text-[13px]',
				)}
				title={rangeTitle}
			>
				<span className="text-muted-foreground/60">pay</span>
				<span className="font-semibold text-foreground/90">${price}</span>
				<span className="text-muted-foreground/40">→</span>
				<span className="text-muted-foreground/60">get</span>
				<span
					className={cn(
						'font-semibold',
						isAtCost ? 'text-muted-foreground/85' : subsidyValueClass[tone],
					)}
				>
					~{formatMoney(headlineValue)}
				</span>
				<span
					className={cn(
						'text-muted-foreground/45',
						dense ? 'text-[10px]' : 'text-[11px]',
					)}
				>
					· {headlineRatio}×
				</span>
			</div>
			{note && (
				<span
					className={cn(
						'flex gap-1 leading-snug',
						dense ? 'text-[10px]' : 'text-[12px]',
						tone === 'incredible' || tone === 'great'
							? 'text-emerald-400/75'
							: tone === 'at-cost'
								? 'text-muted-foreground/70'
								: 'text-amber-500/75',
					)}
				>
					<span className="select-none opacity-70">↳</span>
					<span className="italic">{note}</span>
				</span>
			)}
		</div>
	)
}

export function EfficiencyNote({
	name,
	factor,
}: {
	name: string
	factor: number
}) {
	return (
		<div
			className={cn(
				'mt-1 flex gap-2 rounded-md border border-sky-500/15 bg-sky-500/[0.04]',
				'px-2.5 py-1.5 text-[10.5px] leading-relaxed text-sky-200/80',
			)}
		>
			<span className="select-none text-sky-300/70">ⓘ</span>
			<span>
				<span className="font-semibold text-sky-100/90">
					Why the high values?
				</span>{' '}
				{name} uses ~{factor}× fewer tokens per task than other tools, so every
				$1 stretches further on the API.
			</span>
		</div>
	)
}

export type SubsidyTone = 'at-cost' | 'subtle' | 'good' | 'great' | 'incredible'

export function getSubsidyTone(
	typMult: number,
	heavyMult: number,
): SubsidyTone {
	const peak = Math.max(typMult, heavyMult)
	if (peak < 1.1) return 'at-cost'
	if (peak < 2.5) return 'subtle'
	if (peak < 6) return 'good'
	if (peak < 14) return 'great'
	return 'incredible'
}

export function ValueBar({
	price,
	value,
	tone,
	size = 'sm',
	maxValue,
	tokenEfficiency,
	title,
}: {
	price: number
	value: ApiValueEstimate
	tone: SubsidyTone
	size?: 'sm' | 'lg'
	maxValue: number
	tokenEfficiency: number
	title?: string
}) {
	// Length plots real dollars on a scale shared across the tool (denominator =
	// the tool's biggest "get" value), so the plan that returns the most usage
	// fills the bar and a $1.2k plan is a fraction of an $8k one — not equal.
	// White = the $ you pay; green = the $ value you get, on the same axis, so
	// the gap between them IS the subsidy. The old multiple-based scale made two
	// 40× plans equal regardless of absolute value, which was the bug.
	const typicalValue =
		((value.typical[0] + value.typical[1]) / 2) * tokenEfficiency
	const heavyValue = ((value.heavy[0] + value.heavy[1]) / 2) * tokenEfficiency
	// Small headroom keeps the best plan's ceiling dot off the clipped edge.
	const denom = Math.max(maxValue, price, 1) * 1.05
	const w = (v: number) => `${Math.min((v / denom) * 100, 100)}%`

	const pricePct = w(price)
	const typicalHighPct = w(typicalValue)
	const heavyHighPct = w(heavyValue)

	const isAtCost = tone === 'at-cost'

	return (
		<div
			title={title}
			className={cn(
				'relative w-full overflow-hidden rounded-full bg-secondary/30',
				size === 'lg' ? 'h-2.5' : 'h-1.5',
			)}
		>
			{/* typical use: lighter green, the everyday value (left of the stretch) */}
			{!isAtCost && (
				<motion.div
					initial={{ scaleX: 0, opacity: 0 }}
					animate={{ scaleX: 1, opacity: 1 }}
					transition={{
						duration: 0.7,
						ease: [0.22, 1, 0.36, 1],
						delay: 0.08,
					}}
					className="absolute inset-y-0 left-0 origin-left bg-emerald-400/30"
					style={{ width: typicalHighPct }}
				/>
			)}
			{/* heavy use: bold green, further right = the heavier you go, the stronger */}
			{!isAtCost && (
				<motion.div
					initial={{ scaleX: 0, opacity: 0 }}
					animate={{ scaleX: 1, opacity: 1 }}
					transition={{
						duration: 0.9,
						ease: [0.22, 1, 0.36, 1],
						delay: 0.15,
					}}
					className="absolute inset-y-0 origin-left bg-gradient-to-r from-emerald-400/60 to-emerald-400/50"
					style={{
						left: typicalHighPct,
						width: `calc(${heavyHighPct} - ${typicalHighPct})`,
					}}
				/>
			)}
			{/* price segment: solid foreground */}
			<motion.div
				initial={{ scaleX: 0 }}
				animate={{ scaleX: 1 }}
				transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className={cn(
					'absolute inset-y-0 left-0 origin-left rounded-l-full',
					isAtCost ? 'bg-foreground/50' : 'bg-foreground/75',
				)}
				style={{ width: pricePct }}
			/>
			{/* heavy ceiling marker */}
			{!isAtCost && (
				<motion.div
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.55, duration: 0.4 }}
					className={cn(
						'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-1 rounded-full',
						tone === 'incredible'
							? 'bg-emerald-200 shadow-[0_0_6px_rgb(16_185_129/0.7)]'
							: 'bg-emerald-300/80',
					)}
					style={{ left: heavyHighPct }}
				/>
			)}
			{/* shimmer on hover */}
			<div
				className={cn(
					'pointer-events-none absolute inset-0 -translate-x-full',
					'bg-gradient-to-r from-transparent via-foreground/20 to-transparent',
					'transition-transform duration-1000 ease-out',
					'group-hover/plan:translate-x-full',
				)}
			/>
		</div>
	)
}

export function formatMoney(n: number): string {
	if (n >= 1000) {
		const k = n / 1000
		if (k < 10) {
			const s = k.toFixed(1).replace(/\.0$/, '')
			return `$${s}k`
		}
		return `$${Math.round(k)}k`
	}
	return `$${Math.round(n)}`
}

export function formatPrice(plan: ToolPlan): string {
	if (plan.priceUSD === 'custom') return 'Custom'
	if (plan.priceUSD === 0) return 'Free'
	const suffix =
		plan.period === 'month' ? '/mo' : plan.period === 'year' ? '/yr' : ''
	return `$${plan.priceUSD}${suffix}`
}

export function formatHost(url: string): string {
	try {
		return new URL(url).host.replace(/^www\./, '')
	} catch {
		return url
	}
}

export function computeBestPlanName(group: ToolPlanGroup): string | null {
	if (group.bestPlan && group.plans.some((p) => p.name === group.bestPlan)) {
		return group.bestPlan
	}
	const eff = group.tokenEfficiency ?? 1
	let best: { name: string; score: number } | null = null
	for (const plan of group.plans) {
		if (typeof plan.priceUSD !== 'number' || plan.priceUSD <= 0) continue
		if (!plan.apiValueUSD) continue
		const score = (plan.apiValueUSD.heavy[1] / plan.priceUSD) * eff
		if (!best || score > best.score) best = { name: plan.name, score }
	}
	return best?.name ?? null
}

/**
 * The largest "get" value (heavy-mid × efficiency, in $) across the tool's
 * plans. This is the shared denominator for every ValueBar in the group, so
 * bar lengths plot real dollars on one axis: the plan that returns the most
 * usage value fills the bar, and a $1.2k plan is ~15% of an $8k one — not
 * equal. Mirrors the "get ~$Y" figure exactly so text and bar never disagree.
 */
export function getGroupMaxValue(group: ToolPlanGroup): number {
	const eff = group.tokenEfficiency ?? 1
	let max = 0
	for (const plan of group.plans) {
		if (typeof plan.priceUSD !== 'number' || plan.priceUSD <= 0) continue
		if (!plan.apiValueUSD) continue
		const heavyMid = (plan.apiValueUSD.heavy[0] + plan.apiValueUSD.heavy[1]) / 2
		const getValue = heavyMid * eff
		if (getValue > max) max = getValue
	}
	return max
}

export function UptimeIndicator({ pct }: { pct: number }) {
	const tone: 'green' | 'amber' | 'red' =
		pct >= 99.9 ? 'green' : pct >= 99 ? 'amber' : 'red'

	const ping: Record<typeof tone, string> = {
		green: 'bg-emerald-500/40',
		amber: 'bg-amber-500/40',
		red: 'bg-red-500/40',
	}
	const dot: Record<typeof tone, string> = {
		green: 'bg-emerald-400 shadow-[0_0_6px_rgb(16_185_129/0.7)]',
		amber: 'bg-amber-400 shadow-[0_0_6px_rgb(245_158_11/0.7)]',
		red: 'bg-red-400 shadow-[0_0_6px_rgb(239_68_68/0.7)]',
	}
	const text: Record<typeof tone, string> = {
		green: 'text-emerald-300/90',
		amber: 'text-amber-300/90',
		red: 'text-red-300/90',
	}

	const note =
		tone === 'amber'
			? ' (below industry-standard 99.9%)'
			: tone === 'red'
				? ' (poor reliability)'
				: ''

	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 tabular-nums',
				text[tone],
			)}
			title={`90-day uptime: ${pct}%${note}`}
		>
			<span className="relative flex size-1.5">
				<span
					className={cn(
						'absolute inline-flex h-full w-full animate-ping rounded-full',
						ping[tone],
					)}
				/>
				<span
					className={cn(
						'relative inline-flex size-1.5 rounded-full',
						dot[tone],
					)}
				/>
			</span>
			{pct}%
		</span>
	)
}
