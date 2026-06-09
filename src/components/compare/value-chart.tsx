import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
	computeBestPlanName,
	formatMoney,
	getHeadlineValue,
	type SubsidyTone,
	subsidyValueClass,
} from '@/components/compare/plans-card'
import type { ToolPlanGroup } from '@/data/tool-plans'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

/**
 * The Value Ladder — the decide-at-a-glance hero, rebuilt as a ranked, icon-led
 * leaderboard (winner of a 5-concept / 4-judge design tournament).
 *
 * Every priced plan that returns an estimated API value gets one row, led by its
 * real tool logo and an always-visible price chip. A single track sits on ONE
 * shared log-dollar x-axis, so all 24 rows compare on the same scale:
 *   • a white "you pay" segment runs 0 → fx(price)
 *   • an emerald two-band "you get" segment continues to the value TIP at
 *     fx(headlineValue) — light = typical use, bold = heavy use
 *
 * The encoding is split honestly (the disqualifier the judges caught): on a log
 * axis the TIP's absolute x-position is the only thing that tracks absolute
 * dollars handed back (monotonic with value), while the green OVERHANG past the
 * white tip equals ln(value/price)/span — i.e. it tracks the MULTIPLE. So the
 * "Nx" chip and the overhang length agree (both encode the ratio), and the tip
 * reach encodes total $. No mark claims to be two things.
 *
 * Sort toggles between "Most value" (default — the $-giants lead), "Best per $"
 * (the ratio kings lead), and "Cheapest"; the FLIP teaches absolute ≠ ratio.
 */

// One shared log-dollar axis, returned as a percent so bar widths are pure CSS.
// Domain hi = 10500 covers the largest confidence-band ceiling (Codex Pro $200's
// heavy[1] × 4 = $10,000 → fx 99.3 < 100, no clip). Lo = 7 keeps Gemini's $4.99
// from vanishing at the left edge.
const LO = 7
const HI = 10500
const lnX0 = Math.log(LO)
const lnX1 = Math.log(HI)
const fx = (v: number) =>
	((Math.log(Math.max(v, LO)) - lnX0) / (lnX1 - lnX0)) * 100

const GRIDLINES = [10, 20, 100, 1000, 10000]

// Shared grid template: only the track column (col 5) flexes, so every row and
// the axis strip align pixel-for-pixel on one axis.
const GRID =
	'grid grid-cols-[1.5rem_2rem_11rem_3.25rem_minmax(0,1fr)_4.5rem] items-center gap-x-3'

/** Tone → emerald dot color, mirroring the heavy-ceiling marker used elsewhere. */
const toneDot: Record<SubsidyTone, string> = {
	'at-cost': 'bg-muted-foreground/40',
	subtle: 'bg-foreground/55',
	good: 'bg-emerald-400/70',
	great: 'bg-emerald-300/90',
	incredible: 'bg-emerald-200 shadow-[0_0_7px_rgb(16_185_129/0.75)]',
}

type Sort = 'value' | 'ratio' | 'price'
type Filter = 'all' | 'official' | 'harness'

type RowDatum = {
	key: string
	slug: string
	toolName: string
	planName: string
	bucket: 'official' | 'harness'
	price: number
	eff: number
	value: number
	ratio: number
	tone: SubsidyTone
	typValue: number
	typLow: number
	heavyHigh: number
	isBest: boolean
}

type ShelfItem = {
	key: string
	slug: string
	toolName: string
	planName: string
	kind: 'free' | 'custom'
	detail?: string
}

function buildRows(groups: ToolPlanGroup[]): RowDatum[] {
	const rows: RowDatum[] = []
	for (const group of groups) {
		const eff = group.tokenEfficiency ?? 1
		const bestName = computeBestPlanName(group)
		for (const plan of group.plans) {
			if (typeof plan.priceUSD !== 'number' || plan.priceUSD <= 0) continue
			if (!plan.apiValueUSD) continue
			const { headlineValue, headlineRatio, tone } = getHeadlineValue(
				plan.apiValueUSD,
				plan.priceUSD,
				eff,
			)
			const typMid =
				(plan.apiValueUSD.typical[0] + plan.apiValueUSD.typical[1]) / 2
			rows.push({
				key: `${group.slug}:${plan.name}`,
				slug: group.slug,
				toolName: group.name,
				planName: plan.name,
				bucket: group.bucket,
				price: plan.priceUSD,
				eff,
				value: headlineValue,
				ratio: headlineRatio,
				tone,
				typValue: typMid * eff,
				typLow: plan.apiValueUSD.typical[0] * eff,
				heavyHigh: plan.apiValueUSD.heavy[1] * eff,
				isBest: plan.name === bestName,
			})
		}
	}
	return rows
}

function buildShelf(groups: ToolPlanGroup[]): ShelfItem[] {
	const items: ShelfItem[] = []
	for (const group of groups) {
		for (const plan of group.plans) {
			if (plan.priceUSD === 0) {
				items.push({
					key: `${group.slug}:${plan.name}`,
					slug: group.slug,
					toolName: group.name,
					planName: plan.name,
					kind: 'free',
				})
			} else if (plan.priceUSD === 'custom') {
				items.push({
					key: `${group.slug}:${plan.name}`,
					slug: group.slug,
					toolName: group.name,
					planName: plan.name,
					kind: 'custom',
				})
			}
		}
	}
	// Free first, then custom; stable within each by tool.
	return items.sort((a, b) =>
		a.kind === b.kind ? (a.key < b.key ? -1 : 1) : a.kind === 'free' ? -1 : 1,
	)
}

const byKey = (a: RowDatum, b: RowDatum) => (a.key < b.key ? -1 : 1)
const COMPARATORS: Record<Sort, (a: RowDatum, b: RowDatum) => number> = {
	value: (a, b) => b.value - a.value || a.price - b.price || byKey(a, b),
	ratio: (a, b) =>
		b.ratio - a.ratio || b.value - a.value || a.price - b.price || byKey(a, b),
	price: (a, b) => a.price - b.price || b.value - a.value || byKey(a, b),
}

const SORTS: { id: Sort; label: string }[] = [
	{ id: 'value', label: 'Most value' },
	{ id: 'ratio', label: 'Best per $' },
	{ id: 'price', label: 'Cheapest' },
]
const FILTERS: { id: Filter; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'official', label: 'Official' },
	{ id: 'harness', label: 'Harness' },
]
const PODIUM_CAPTION: Record<Sort, string> = {
	value: 'most value back',
	ratio: 'best per dollar',
	price: 'cheapest',
}

const COLLAPSED = 12

/**
 * The headline takeaway, derived from the data (never hardcoded): who returns the
 * most absolute value, who returns the most per dollar, and whether token
 * efficiency is what's lifting the leader. So the prose stays true as plans move.
 */
type Takeaway = {
	valueLeader: RowDatum
	ratioLeader: RowDatum
	sameTool: boolean
	sameRow: boolean
	eff: number | null
}

function buildTakeaway(rows: RowDatum[]): Takeaway | null {
	if (rows.length === 0) return null
	const valueLeader = rows.reduce((a, b) =>
		COMPARATORS.value(a, b) <= 0 ? a : b,
	)
	const ratioLeader = rows.reduce((a, b) =>
		COMPARATORS.ratio(a, b) <= 0 ? a : b,
	)
	return {
		valueLeader,
		ratioLeader,
		sameTool: valueLeader.slug === ratioLeader.slug,
		sameRow: valueLeader.key === ratioLeader.key,
		eff: valueLeader.eff > 1 ? valueLeader.eff : null,
	}
}

export function CompareValueChart({ groups }: { groups: ToolPlanGroup[] }) {
	const allRows = useMemo(() => buildRows(groups), [groups])
	const shelf = useMemo(() => buildShelf(groups), [groups])
	const takeaway = useMemo(() => buildTakeaway(allRows), [allRows])
	const reduce = useReducedMotion()

	const [sort, setSort] = useState<Sort>('value')
	const [filter, setFilter] = useState<Filter>('all')
	const [expanded, setExpanded] = useState(false)
	const [hovered, setHovered] = useState<{ key: string; slug: string } | null>(
		null,
	)

	const ranked = useMemo(
		() =>
			allRows
				.filter((r) => filter === 'all' || r.bucket === filter)
				.sort(COMPARATORS[sort]),
		[allRows, filter, sort],
	)
	const visible = expanded ? ranked : ranked.slice(0, COLLAPSED)

	return (
		<motion.div
			initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
			animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
			className="mb-12 overflow-hidden rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm"
		>
			{/* Header: title + takeaway, then sort control + filter + legend. */}
			<div className="flex flex-col gap-4 border-b border-border/40 px-6 py-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex max-w-2xl flex-col gap-1.5">
						<h2 className="font-mono text-base font-bold tracking-tight text-foreground">
							Dollar for dollar
						</h2>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Every paid plan, ranked by the value it hands back.
							{takeaway && (
								<>
									{' '}
									{takeaway.sameRow ? (
										<>
											<span className="text-foreground/80">
												{takeaway.valueLeader.toolName}
											</span>{' '}
											wins both ways — most value and the best return per dollar
										</>
									) : (
										<>
											<span className="text-foreground/80">
												{takeaway.valueLeader.toolName}
											</span>{' '}
											returns the most outright
											<span className="text-foreground/55"> · </span>
											{takeaway.sameTool
												? 'its'
												: `${takeaway.ratioLeader.toolName}'s`}{' '}
											${takeaway.ratioLeader.price} tier stretches a dollar
											furthest
										</>
									)}
									{takeaway.eff && (
										<>
											<span className="text-foreground/55"> · </span>
											<span className="text-sky-200/80">
												{takeaway.eff}× token efficiency
											</span>{' '}
											tips the scale
										</>
									)}
								</>
							)}
						</p>
					</div>
					<ChartLegend />
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<SegmentedControl options={SORTS} value={sort} onChange={setSort} />
					<FilterChips value={filter} onChange={setFilter} />
				</div>
			</div>

			{/* Axis + ranked list, sharing one log-dollar scale. */}
			<div className="px-6 pb-4 pt-4">
				<AxisStrip />
				<div className="relative mt-1">
					<GridlineOverlay />
					<ul className="relative flex flex-col gap-0.5">
						<AnimatePresence initial={false} mode="popLayout">
							{visible.map((row, i) => (
								<ValueRow
									key={row.key}
									row={row}
									rank={i + 1}
									isPodium={i < 3}
									sort={sort}
									hovered={hovered}
									onHover={setHovered}
									reduce={!!reduce}
								/>
							))}
						</AnimatePresence>
					</ul>
				</div>

				{ranked.length > COLLAPSED && (
					<div className="mt-3 flex justify-center">
						<button
							type="button"
							onClick={() => setExpanded((v) => !v)}
							className="rounded-full border border-border/60 bg-secondary/30 px-3.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
						>
							{expanded ? 'Show top 12' : `Show all ${ranked.length} plans`}
						</button>
					</div>
				)}

				{shelf.length > 0 && <ContextShelf items={shelf} />}
			</div>

			<p className="border-t border-border/40 px-6 py-3 text-[11px] leading-relaxed text-muted-foreground/70">
				Estimated API value handed back, token-efficiency adjusted — same
				figures as the cards below. At-cost plans (Cursor Pro / Pro+ / Teams)
				return about $1 per $1 by design.
			</p>
		</motion.div>
	)
}

function ValueRow({
	row,
	rank,
	isPodium,
	sort,
	hovered,
	onHover,
	reduce,
}: {
	row: RowDatum
	rank: number
	isPodium: boolean
	sort: Sort
	hovered: { key: string; slug: string } | null
	onHover: (v: { key: string; slug: string } | null) => void
	reduce: boolean
}) {
	const isHovered = hovered?.key === row.key
	const isPeer = !!hovered && hovered.slug === row.slug && !isHovered
	const isDimmed = !!hovered && hovered.slug !== row.slug
	const showCaption = isPodium || isHovered

	const ratioClass =
		row.tone === 'at-cost'
			? 'text-muted-foreground/70'
			: subsidyValueClass[row.tone]

	return (
		<motion.li
			layout={!reduce}
			initial={reduce ? false : { opacity: 0, x: -12, filter: 'blur(4px)' }}
			animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
			exit={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
			transition={
				reduce
					? { duration: 0 }
					: {
							layout: { type: 'spring', stiffness: 320, damping: 26 },
							duration: 0.45,
							delay: Math.min(rank * 0.035, 0.5),
							ease: [0.22, 1, 0.36, 1],
						}
			}
		>
			<button
				type="button"
				aria-label={`Rank ${rank}: ${row.toolName} ${row.planName}, pay $${row.price}, value back about ${formatMoney(
					row.value,
				)}, ${row.ratio} times your money${row.isBest ? ', best deal for this tool' : ''}`}
				onMouseEnter={() => onHover({ key: row.key, slug: row.slug })}
				onMouseLeave={() => onHover(null)}
				onFocus={() => onHover({ key: row.key, slug: row.slug })}
				onBlur={() => onHover(null)}
				className={cn(
					GRID,
					'group relative w-full rounded-md border-l-2 pr-1 pl-2.5 text-left transition-all duration-300 ease-out focus:outline-none',
					isPodium ? 'py-2.5' : 'py-1.5',
					isHovered || isPeer ? 'border-foreground/30' : 'border-border/40',
					isPodium && !isHovered && !isPeer && 'bg-emerald-500/[0.03]',
					isHovered && 'bg-secondary/40 ring-1 ring-foreground/15',
					isPeer && 'bg-foreground/[0.025] ring-1 ring-foreground/15',
					isDimmed && 'opacity-30 blur-[0.4px] saturate-50',
				)}
			>
				{/* col 1 — rank numeral */}
				<span
					className={cn(
						'col-start-1 text-right font-mono tabular-nums',
						isPodium
							? 'text-xs font-bold text-emerald-300/80'
							: 'text-[10px] text-muted-foreground/45',
					)}
				>
					{String(rank).padStart(2, '0')}
				</span>

				{/* col 2 — tool logo */}
				<div className="col-start-2 flex items-center justify-center">
					<ToolMark slug={row.slug} size={isPodium ? 7 : 5} ring={row.isBest} />
				</div>

				{/* col 3 — plan + tool name (+ podium caption) */}
				<div className="col-start-3 flex min-w-0 flex-col">
					<span className="flex items-center gap-1.5 truncate font-mono text-xs font-medium text-foreground/95">
						<span className="truncate">{row.planName}</span>
						{row.isBest && (
							<span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1 py-[0.5px] font-mono text-[7px] uppercase tracking-wider text-emerald-300/95">
								best
							</span>
						)}
					</span>
					<span className="truncate text-[10px] text-muted-foreground">
						{row.toolName}
					</span>
					{isPodium && (
						<span className="truncate font-mono text-[8.5px] font-medium uppercase tracking-wider text-emerald-400/70">
							#{rank} {PODIUM_CAPTION[sort]}
						</span>
					)}
				</div>

				{/* col 4 — price chip */}
				<span className="col-start-4 justify-self-end rounded-md bg-secondary/40 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-foreground/85">
					${row.price}
				</span>

				{/* col 5 — the shared-axis track */}
				<div className="relative col-start-5">
					<ValueTrack row={row} podium={isPodium} reduce={reduce} />
					{showCaption && (
						<div className="pointer-events-none absolute top-full left-0 z-10 mt-1 whitespace-nowrap rounded border border-border/60 bg-popover/95 px-2 py-0.5 font-mono text-[9px] tabular-nums text-muted-foreground shadow-lg shadow-black/30 backdrop-blur-sm">
							{row.tone === 'at-cost' ? (
								<>at cost · ${row.price} in API credit</>
							) : (
								<>
									{formatMoney(row.typLow)} typical →{' '}
									<span className="text-foreground/80">
										{formatMoney(row.heavyHigh)} heavy
									</span>
								</>
							)}
						</div>
					)}
				</div>

				{/* col 6 — ratio + efficiency pill */}
				<div className="col-start-6 flex flex-col items-end gap-0.5">
					<span
						className={cn(
							'font-mono font-bold tabular-nums',
							isPodium ? 'text-base' : 'text-sm',
							ratioClass,
						)}
					>
						{row.ratio}×
					</span>
					{row.eff > 1 && (
						<span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-1 py-[0.5px] font-mono text-[7px] uppercase tracking-wider text-sky-200/80">
							{row.eff}× eff
						</span>
					)}
				</div>
			</button>
		</motion.li>
	)
}

/**
 * The track: white "you pay" segment, an emerald light→bold "you get" two-band
 * reaching the value tip, a lollipop dot at the tip, and a faint confidence band
 * + end-cap tick for the typical→heavy range. All widths are percents on the
 * shared fx() axis so every row aligns. At-cost plans draw white only.
 */
function ValueTrack({
	row,
	podium,
	reduce,
}: {
	row: RowDatum
	podium: boolean
	reduce: boolean
}) {
	const isAtCost = row.tone === 'at-cost'
	const pPrice = fx(row.price)
	const pTyp = fx(row.typValue)
	const pTip = fx(row.value)
	const pTypLow = fx(row.typLow)
	const pHeavyHigh = fx(row.heavyHigh)

	const grow = (delay: number, dur: number) =>
		reduce
			? { duration: 0 }
			: { duration: dur, delay, ease: [0.22, 1, 0.36, 1] as const }

	return (
		<div
			className={cn(
				'relative w-full rounded-full bg-secondary/30',
				podium ? 'h-3' : 'h-2',
			)}
		>
			{/* confidence band: typical-low → heavy-high (behind everything) */}
			{!isAtCost && (
				<div
					className="absolute inset-y-0 rounded-full bg-emerald-400/[0.12]"
					style={{
						left: `${pTypLow}%`,
						width: `${Math.max(0, pHeavyHigh - pTypLow)}%`,
					}}
				/>
			)}

			{/* typical band: white tip → typical value (lighter green) */}
			{!isAtCost && pTyp > pPrice && (
				<motion.div
					initial={reduce ? false : { scaleX: 0 }}
					animate={{ scaleX: 1 }}
					transition={grow(0.18, 0.6)}
					className="absolute inset-y-0 origin-left bg-emerald-400/30"
					style={{ left: `${pPrice}%`, width: `${pTyp - pPrice}%` }}
				/>
			)}

			{/* heavy band: typical → value tip (bolder green) */}
			{!isAtCost && pTip > pTyp && (
				<motion.div
					initial={reduce ? false : { scaleX: 0 }}
					animate={{ scaleX: 1 }}
					transition={grow(0.26, 0.7)}
					className="absolute inset-y-0 origin-left bg-gradient-to-r from-emerald-400/60 to-emerald-400/50"
					style={{ left: `${pTyp}%`, width: `${pTip - pTyp}%` }}
				/>
			)}

			{/* white "you pay" segment (drawn over the green's left edge) */}
			<motion.div
				initial={reduce ? false : { scaleX: 0 }}
				animate={{ scaleX: 1 }}
				transition={grow(0, 0.5)}
				className={cn(
					'absolute inset-y-0 left-0 origin-left rounded-l-full',
					isAtCost ? 'bg-foreground/45' : 'bg-foreground/80',
				)}
				style={{ width: `${pPrice}%` }}
			/>

			{/* end-cap tick at heavy-high ceiling */}
			{!isAtCost && (
				<div
					className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-emerald-300/40"
					style={{ left: `${pHeavyHigh}%` }}
				/>
			)}

			{/* lollipop head at the value tip — its x-position = absolute $ */}
			<motion.div
				initial={reduce ? false : { scale: 0, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={reduce ? { duration: 0 } : { delay: 0.5, duration: 0.4 }}
				className={cn(
					'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
					podium ? 'size-2.5' : 'size-2',
					isAtCost ? 'bg-muted-foreground/40' : toneDot[row.tone],
				)}
				style={{ left: `${isAtCost ? pPrice : pTip}%` }}
			/>
		</div>
	)
}

/** The sticky-feeling axis strip: $ gridline labels in the track column. */
function AxisStrip() {
	return (
		<div className={cn(GRID, 'h-4')}>
			<div className="relative col-start-5 h-full">
				{GRIDLINES.map((g) => (
					<span
						key={g}
						className="absolute -translate-x-1/2 font-mono text-[9px] tabular-nums text-muted-foreground/50"
						style={{ left: `${fx(g)}%` }}
					>
						{formatMoney(g)}
					</span>
				))}
			</div>
			<span className="col-start-6 text-right font-mono text-[8px] uppercase tracking-wider text-muted-foreground/45">
				× value
			</span>
		</div>
	)
}

/** Faint vertical gridlines behind the rows, aligned to the track column. */
function GridlineOverlay() {
	return (
		<div
			aria-hidden
			className={cn(GRID, 'pointer-events-none absolute inset-0')}
		>
			<div className="relative col-start-5 h-full self-stretch">
				{GRIDLINES.map((g) => (
					<span
						key={g}
						className="absolute inset-y-0 w-px bg-border/15"
						style={{ left: `${fx(g)}%` }}
					/>
				))}
			</div>
		</div>
	)
}

/** Unranked context shelf: free tiers + custom/enterprise plans. */
function ContextShelf({ items }: { items: ShelfItem[] }) {
	return (
		<div className="mt-4 rounded-xl border border-border/40 bg-secondary/[0.08] px-4 py-3">
			<div className="mb-2 flex items-center gap-2">
				<span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
					Not ranked
				</span>
				<span className="text-[10px] text-muted-foreground/50">
					no per-dollar figure — free tiers &amp; custom pricing
				</span>
			</div>
			<div className="flex flex-wrap gap-1.5">
				{items.map((it) => (
					<span
						key={it.key}
						className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 py-0.5 pr-2 pl-1"
						title={`${it.toolName} · ${it.planName}`}
					>
						<ToolMark slug={it.slug} size={4} />
						<span className="font-mono text-[10px] text-foreground/70">
							{it.toolName}
						</span>
						<span
							className={cn(
								'rounded-full px-1 py-[0.5px] font-mono text-[8px] uppercase tracking-wider',
								it.kind === 'free'
									? 'bg-emerald-500/10 text-emerald-300/90'
									: 'bg-secondary/60 text-muted-foreground',
							)}
						>
							{it.kind === 'free' ? 'Free' : 'Custom'}
						</span>
					</span>
				))}
			</div>
		</div>
	)
}

/**
 * Segmented sort control. Uses a group of aria-pressed toggle buttons (rather
 * than role="radio", which Biome's useSemanticElements rejects in favor of a
 * real radio input) — same accessible semantics, native button keyboard support.
 */
function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
}: {
	options: { id: T; label: string }[]
	value: T
	onChange: (v: T) => void
}) {
	return (
		<div className="inline-flex rounded-lg border border-border/60 bg-secondary/20 p-0.5">
			{options.map((o) => {
				const active = o.id === value
				return (
					<button
						key={o.id}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(o.id)}
						className={cn(
							'relative rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
							active
								? 'text-foreground'
								: 'text-muted-foreground/70 hover:text-foreground',
						)}
					>
						{active && (
							<motion.span
								layoutId="sort-pill"
								className="absolute inset-0 -z-10 rounded-md bg-foreground/10 ring-1 ring-foreground/15"
								transition={{ type: 'spring', stiffness: 380, damping: 30 }}
							/>
						)}
						{o.label}
					</button>
				)
			})}
		</div>
	)
}

/** Filter chips for official vs harness. */
function FilterChips({
	value,
	onChange,
}: {
	value: Filter
	onChange: (v: Filter) => void
}) {
	return (
		<div className="inline-flex items-center gap-1">
			{FILTERS.map((f) => {
				const active = f.id === value
				return (
					<button
						key={f.id}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(f.id)}
						className={cn(
							'rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors',
							active
								? 'border-foreground/30 bg-foreground/10 text-foreground'
								: 'border-border/50 text-muted-foreground/70 hover:border-foreground/25 hover:text-foreground',
						)}
					>
						{f.label}
					</button>
				)
			})}
		</div>
	)
}

/** A tool's logo in a small chip, styled like the table's tool cell. */
function ToolMark({
	slug,
	size = 5,
	ring = false,
}: {
	slug: string
	size?: 4 | 5 | 7
	ring?: boolean
}) {
	const logo = getToolLogo(slug)
	const isGeminiCli = slug === 'gemini-cli'
	const sizeClass = size === 7 ? 'size-7' : size === 4 ? 'size-4' : 'size-5'
	if (!logo) {
		return <span className={cn(sizeClass, 'rounded-full bg-foreground/40')} />
	}
	return (
		<span
			className={cn(
				'flex items-center justify-center rounded bg-background/80 p-0.5 ring-1 ring-border/60 backdrop-blur-sm',
				sizeClass,
				'[&>svg]:h-full [&>svg]:w-full',
				isMonochromeLogo(slug) &&
					!isGeminiCli &&
					'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
				ring && 'ring-emerald-400/40',
				getLogoHoverClasses(slug),
			)}
		>
			{logo}
		</span>
	)
}

function ChartLegend() {
	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
			<span className="inline-flex items-center gap-1.5">
				<span className="inline-flex h-1.5 w-8 overflow-hidden rounded-full">
					<span className="h-full w-1/3 bg-foreground/75" />
					<span className="h-full w-1/4 bg-emerald-400/30" />
					<span className="h-full flex-1 bg-emerald-400/60" />
				</span>
				pay → get
			</span>
			<span className="inline-flex items-center gap-1">
				<span className="size-1.5 rounded-full bg-muted-foreground/55" />
				<span className="size-1.5 rounded-full bg-emerald-400/70" />
				<span className="size-1.5 rounded-full bg-emerald-300" />
				worse → better deal
			</span>
			<span className="inline-flex items-center gap-1.5">
				<span className="flex size-3 items-center justify-center rounded-full ring-1 ring-emerald-300/60">
					<span className="size-1 rounded-full bg-emerald-300" />
				</span>
				best per tool
			</span>
		</div>
	)
}
