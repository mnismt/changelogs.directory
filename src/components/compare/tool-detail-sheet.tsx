import { ArrowUpRight, Info } from 'lucide-react'
import {
	computeBestPlanName,
	DeprecationBadge,
	EfficiencyNote,
	formatHost,
	getGroupMaxValue,
	ModelRow,
	PlanRow,
	SectionLabel,
	UptimeIndicator,
	ValueLegend,
} from '@/components/compare/plans-card'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { ToolPlanGroup } from '@/data/tool-plans'
import { groupModelsByProvider } from '@/lib/model-providers'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface ToolDetailSheetProps {
	group: ToolPlanGroup | null
	open: boolean
	onClose: () => void
}

/**
 * Drill-down detail for a single tool. Thin wrapper over the shared BottomSheet
 * (drag-dismiss, scroll-lock, safe-area, auto MobileDock-hide). Reuses the same
 * PlanRow / SubsidyVisualization / ValueBar as the desktop card — but at full,
 * legible scale (dense={false}) with the best plan force-highlighted on touch.
 */
export function ToolDetailSheet({
	group,
	open,
	onClose,
}: ToolDetailSheetProps) {
	return (
		<BottomSheet
			open={open}
			onClose={onClose}
			title={group?.name}
			icon={group ? <SheetLogo group={group} /> : undefined}
			maxHeight="85vh"
		>
			{group && <SheetBody group={group} />}
		</BottomSheet>
	)
}

function SheetLogo({ group }: { group: ToolPlanGroup }) {
	const logo = getToolLogo(group.slug)
	if (!logo) return null
	const isGeminiCli = group.slug === 'gemini-cli'

	return (
		<span
			className={cn(
				'flex size-6 shrink-0 items-center justify-center',
				'[&>svg]:h-full [&>svg]:w-full',
				isMonochromeLogo(group.slug) &&
					!isGeminiCli &&
					'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
				getLogoHoverClasses(group.slug),
			)}
		>
			{logo}
		</span>
	)
}

function SheetBody({ group }: { group: ToolPlanGroup }) {
	const providerGroups = groupModelsByProvider(group.models, group.slug)
	const bestPlanName = computeBestPlanName(group)
	const maxValue = getGroupMaxValue(group)

	return (
		<div className="flex flex-col gap-5 px-4 pt-2 pb-6">
			{/* Sub-header */}
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<span className="text-[12px] text-muted-foreground">
					{group.vendor}
				</span>
				<span
					className={cn(
						'rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider',
						group.bucket === 'official'
							? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400/90'
							: 'border-border/60 bg-secondary/40 text-muted-foreground',
					)}
				>
					{group.bucket}
				</span>
				{group.deprecated && (
					<DeprecationBadge info={group.deprecated} size="lg" />
				)}
				{typeof group.uptime90d === 'number' && (
					<UptimeIndicator pct={group.uptime90d} />
				)}
				<span className="font-mono text-[11px] text-muted-foreground tabular-nums">
					{group.lastVerified}
				</span>
			</div>

			{/* Tagline */}
			<p className="text-sm leading-relaxed text-muted-foreground">
				{group.tagline}
			</p>

			{/* Models */}
			<section className="flex flex-col gap-2">
				<SectionLabel>Models</SectionLabel>
				<div className="flex flex-col gap-1.5">
					{providerGroups.map((pg) => (
						<ModelRow key={pg.provider} group={pg} dense={false} />
					))}
				</div>
			</section>

			{/* Plans */}
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
								tokenEfficiency={group.tokenEfficiency ?? 1}
								maxValue={maxValue}
							/>
						)
					})}
				</ul>
				{group.tokenEfficiency && group.tokenEfficiency > 1 && (
					<EfficiencyNote name={group.name} factor={group.tokenEfficiency} />
				)}
			</section>

			{/* Good to know — the context devs come here for, framed as homework we
			    did for them (not a warning). Calm, neutral, never alarming. */}
			{group.gotchas && group.gotchas.length > 0 && (
				<section className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card/30 p-3.5">
					<div className="flex items-center gap-1.5">
						<Info className="size-3.5 shrink-0 text-muted-foreground" />
						<SectionLabel>Good to know</SectionLabel>
					</div>
					<ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-muted-foreground">
						{group.gotchas.map((g) => (
							<li key={g} className="flex gap-1.5">
								<span className="select-none text-muted-foreground/40">›</span>
								<span>{g}</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{/* Footer */}
			<a
				href={group.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="flex min-h-11 items-center justify-between gap-3 border-t border-border/60 pt-3 font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground"
			>
				<span className="truncate">{formatHost(group.sourceUrl)}</span>
				<ArrowUpRight className="size-4 shrink-0" />
			</a>
		</div>
	)
}
