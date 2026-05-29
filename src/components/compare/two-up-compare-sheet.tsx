import { priceTier } from '@/components/compare/hover-context'
import {
	computeBestPlanName,
	formatMoney,
	formatPrice,
	getHeadlineValue,
	subsidyValueClass,
} from '@/components/compare/plans-card'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { ToolPlan, ToolPlanGroup } from '@/data/tool-plans'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface TwoUpCompareSheetProps {
	a: ToolPlanGroup | null
	b: ToolPlanGroup | null
	open: boolean
	onClose: () => void
}

/** Ordered price tiers (mirrors hover-context.priceTier buckets). */
const TIERS: { tier: number; label: string; hint: string }[] = [
	{ tier: 0, label: 'Free', hint: '$0' },
	{ tier: 1, label: 'Entry', hint: 'under $25' },
	{ tier: 2, label: 'Mid', hint: '$25–74' },
	{ tier: 3, label: 'Heavy', hint: '$75–149' },
	{ tier: 4, label: 'Power', hint: '$150+' },
]

/**
 * Phase 2: two tools side by side, plans aligned by price tier so equivalent
 * tiers stack on the same row (e.g. $20 vs $20, Max 20x vs Pro $200). Reuses
 * the shared subsidy math (getHeadlineValue) and the BottomSheet shell — never
 * duplicates value logic. Plans stay vertical inside each column (no nested
 * horizontal scroll). md-agnostic but only mounted from CompareMobile.
 */
export function TwoUpCompareSheet({
	a,
	b,
	open,
	onClose,
}: TwoUpCompareSheetProps) {
	return (
		<BottomSheet open={open} onClose={onClose} title="Compare" maxHeight="90vh">
			{a && b && <CompareBody a={a} b={b} />}
		</BottomSheet>
	)
}

function CompareBody({ a, b }: { a: ToolPlanGroup; b: ToolPlanGroup }) {
	const aBucket = bucketByTier(a)
	const bBucket = bucketByTier(b)
	const aBest = computeBestPlanName(a)
	const bBest = computeBestPlanName(b)

	const presentTiers = TIERS.filter(
		(t) => aBucket.byTier.has(t.tier) || bBucket.byTier.has(t.tier),
	)
	const hasCustom = aBucket.custom.length > 0 || bBucket.custom.length > 0

	return (
		<div className="flex flex-col gap-4 px-4 pt-1 pb-6">
			{/* Sticky two-column tool header */}
			<div className="sticky top-0 z-10 -mx-4 grid grid-cols-2 gap-2 border-b border-border/40 bg-black/90 px-4 pb-3 backdrop-blur-xl">
				<ToolColumnHeader group={a} />
				<ToolColumnHeader group={b} />
			</div>

			{/* Models */}
			<TierBlock label="Models">
				<ModelsCell group={a} />
				<ModelsCell group={b} />
			</TierBlock>

			{/* Plans aligned by tier */}
			{presentTiers.map((t) => (
				<TierBlock key={t.tier} label={t.label} hint={t.hint}>
					<PlanCell
						plans={aBucket.byTier.get(t.tier) ?? []}
						group={a}
						bestName={aBest}
					/>
					<PlanCell
						plans={bBucket.byTier.get(t.tier) ?? []}
						group={b}
						bestName={bBest}
					/>
				</TierBlock>
			))}

			{hasCustom && (
				<TierBlock label="Custom" hint="PAYG / BYOK">
					<PlanCell plans={aBucket.custom} group={a} bestName={aBest} />
					<PlanCell plans={bBucket.custom} group={b} bestName={bBest} />
				</TierBlock>
			)}
		</div>
	)
}

function bucketByTier(group: ToolPlanGroup): {
	byTier: Map<number, ToolPlan[]>
	custom: ToolPlan[]
} {
	const byTier = new Map<number, ToolPlan[]>()
	const custom: ToolPlan[] = []
	for (const plan of group.plans) {
		const t = priceTier(plan.priceUSD)
		if (t === null) {
			custom.push(plan)
			continue
		}
		const list = byTier.get(t) ?? []
		list.push(plan)
		byTier.set(t, list)
	}
	return { byTier, custom }
}

function TierBlock({
	label,
	hint,
	children,
}: {
	label: string
	hint?: string
	children: React.ReactNode
}) {
	return (
		<section className="flex flex-col gap-1.5">
			<div className="flex items-baseline gap-1.5">
				<span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
					{label}
				</span>
				{hint && (
					<span className="font-mono text-[10px] text-muted-foreground/50">
						{hint}
					</span>
				)}
			</div>
			<div className="grid grid-cols-2 items-stretch gap-2">{children}</div>
		</section>
	)
}

function ToolColumnHeader({ group }: { group: ToolPlanGroup }) {
	const logo = getToolLogo(group.slug)
	const isGeminiCli = group.slug === 'gemini-cli'

	return (
		<div className="flex min-w-0 flex-col items-center gap-1.5 pt-3 text-center">
			{logo && (
				<div
					className={cn(
						'flex size-8 items-center justify-center rounded p-1',
						'[&>svg]:h-full [&>svg]:w-full',
						isMonochromeLogo(group.slug) &&
							!isGeminiCli &&
							'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
						getLogoHoverClasses(group.slug),
					)}
				>
					{logo}
				</div>
			)}
			<span className="truncate font-mono text-[13px] font-bold tracking-tight text-foreground">
				{group.name}
			</span>
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
		</div>
	)
}

function ModelsCell({ group }: { group: ToolPlanGroup }) {
	return (
		<p className="rounded-lg border border-border/40 bg-card/20 p-2.5 text-[11px] leading-relaxed text-foreground/85">
			{group.models.join(' · ')}
		</p>
	)
}

function PlanCell({
	plans,
	group,
	bestName,
}: {
	plans: ToolPlan[]
	group: ToolPlanGroup
	bestName: string | null
}) {
	if (plans.length === 0) {
		return (
			<div className="flex items-center justify-center rounded-lg border border-dashed border-border/40 p-2.5 font-mono text-xs text-muted-foreground/40">
				—
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{plans.map((plan) => (
				<PlanMini
					key={plan.name}
					plan={plan}
					tokenEfficiency={group.tokenEfficiency ?? 1}
					isBest={plan.name === bestName}
				/>
			))}
		</div>
	)
}

function PlanMini({
	plan,
	tokenEfficiency,
	isBest,
}: {
	plan: ToolPlan
	tokenEfficiency: number
	isBest: boolean
}) {
	const showValue =
		!!plan.apiValueUSD && typeof plan.priceUSD === 'number' && plan.priceUSD > 0

	return (
		<div
			className={cn(
				'flex h-full flex-col gap-1 rounded-lg border p-2.5',
				isBest
					? 'border-emerald-400/30 bg-emerald-500/[0.05] shadow-[0_0_18px_-6px_rgb(16_185_129/0.4)]'
					: 'border-border/50 bg-card/30',
			)}
		>
			<div className="flex items-center justify-between gap-1">
				<span className="truncate font-mono text-[12px] font-medium text-foreground/95">
					{plan.name}
				</span>
				{isBest && (
					<span
						className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-[1px] font-mono text-[8px] uppercase tracking-wider text-emerald-300/95"
						title="Best deal"
					>
						best
					</span>
				)}
			</div>
			<span
				className={cn(
					'font-mono text-sm font-bold tabular-nums',
					plan.priceUSD === 0
						? 'text-emerald-400/90'
						: plan.priceUSD === 'custom'
							? 'text-foreground/70'
							: 'text-foreground',
				)}
			>
				{formatPrice(plan)}
			</span>
			{showValue && plan.apiValueUSD && typeof plan.priceUSD === 'number' && (
				<PlanMiniValue
					value={plan.apiValueUSD}
					price={plan.priceUSD}
					tokenEfficiency={tokenEfficiency}
				/>
			)}
		</div>
	)
}

function PlanMiniValue({
	value,
	price,
	tokenEfficiency,
}: {
	value: NonNullable<ToolPlan['apiValueUSD']>
	price: number
	tokenEfficiency: number
}) {
	const { headlineValue, headlineRatio, tone } = getHeadlineValue(
		value,
		price,
		tokenEfficiency,
	)
	return (
		<span
			className={cn(
				'font-mono text-[11px] tabular-nums leading-snug',
				subsidyValueClass[tone],
			)}
		>
			~{headlineRatio}× · {formatMoney(headlineValue)}/mo
		</span>
	)
}
