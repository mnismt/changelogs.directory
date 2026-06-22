import {
	computeBestPlanName,
	formatMoney,
	formatPrice,
	getHeadlineValue,
} from '@/components/compare/plans-card'
import type { ToolPlan, ToolPlanGroup } from '@/data/tool-plans'
import { cn } from '@/lib/utils'

/**
 * The decision answer in the glanceable row: the emerald "~Nx value" headline
 * for tools with a subsidy winner, with a graceful fallback to a plain price
 * (Free / Custom / cheapest) for BYOK / free / custom tools where
 * computeBestPlanName returns null. Reuses the same subsidy math as the card
 * and the detail sheet — never renders NaN or a blank ratio.
 */
export function ToolHeadlineChip({ group }: { group: ToolPlanGroup }) {
	const bestName = computeBestPlanName(group)
	const bestPlan = bestName
		? group.plans.find((p) => p.name === bestName)
		: undefined

	if (
		bestPlan?.apiValueUSD &&
		typeof bestPlan.priceUSD === 'number' &&
		bestPlan.priceUSD > 0
	) {
		const { headlineValue, headlineRatio, tone } = getHeadlineValue(
			bestPlan.apiValueUSD,
			bestPlan.priceUSD,
			group.tokenEfficiency ?? 1,
		)

		return (
			<div className="flex flex-col items-end gap-0.5">
				<span
					className={cn(
						'font-mono text-sm font-bold tabular-nums',
						tone === 'at-cost' || tone === 'subtle'
							? 'text-emerald-300/80'
							: 'text-emerald-300',
					)}
				>
					~{headlineRatio}× value
				</span>
				<span className="font-mono text-[11px] text-muted-foreground truncate max-w-[8.5rem] text-right">
					{bestPlan.name} · {formatMoney(headlineValue)}/mo
				</span>
			</div>
		)
	}

	// Fallback: no subsidy winner — surface the cheapest / most-generous plan.
	const fallback = pickFallbackPlan(group.plans)
	const priceLabel = formatPrice(fallback)

	return (
		<div className="flex flex-col items-end gap-0.5">
			<span
				className={cn(
					'font-mono text-sm font-bold tabular-nums',
					fallback.priceUSD === 0
						? 'text-emerald-400/90'
						: fallback.priceUSD === 'custom'
							? 'text-foreground/70'
							: 'text-foreground',
				)}
			>
				{priceLabel}
			</span>
			<span className="font-mono text-[11px] text-muted-foreground truncate max-w-[8.5rem] text-right">
				{fallback.name}
			</span>
		</div>
	)
}

function pickFallbackPlan(plans: ToolPlan[]): ToolPlan {
	const free = plans.find((p) => p.priceUSD === 0)
	if (free) return free
	const numeric = plans
		.filter((p) => typeof p.priceUSD === 'number')
		.sort((a, b) => (a.priceUSD as number) - (b.priceUSD as number))
	return numeric[0] ?? plans[0]
}
