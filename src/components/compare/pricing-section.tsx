import { motion } from 'motion/react'
import type { ToolComparison } from '@/data/tool-comparison'
import { cn } from '@/lib/utils'
import type { FilterState } from './persona-filters'
import { SectionHeader } from './shared/section-header'
import { ToolLogo } from './tool-logo'

interface PricingSectionProps {
	tools: ToolComparison[]
	filters: FilterState
}

export function PricingSection({ tools, filters }: PricingSectionProps) {
	const usageKey = filters.usage

	return (
		<section className="py-12">
			<SectionHeader
				title="The Real Cost"
				subtitle={`For ${usageKey === 'light' ? 'light' : usageKey === 'daily' ? 'daily agent' : 'power'} users on ${filters.models} models`}
			/>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{tools.map((tool, index) => {
					const cost = tool.pricing?.realCosts?.[usageKey]
					if (!cost) return null

					const isLowest = isLowestCost(tools, usageKey, tool.slug)

					return (
						<motion.div
							key={tool.slug}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: index * 0.1 }}
							className={cn(
								'relative rounded-lg border p-6',
								isLowest
									? 'border-green-500/30 bg-green-500/5'
									: 'border-border/40 bg-background/40',
							)}
						>
							{isLowest && (
								<div className="absolute -top-3 left-4 rounded-full bg-green-500/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-green-400">
									Lowest Cost
								</div>
							)}

							<div className="mb-4 flex items-center gap-3 font-mono text-lg font-bold uppercase tracking-tight text-foreground">
								<ToolLogo slug={tool.slug} />
								{tool.slug}
							</div>

							<div className="mb-2 font-mono text-3xl font-bold text-foreground">
								{cost.range}
								<span className="text-sm font-normal text-muted-foreground">
									/mo
								</span>
							</div>

							<p className="mb-4 font-mono text-xs text-muted-foreground">
								{cost.note}
							</p>

							<div className="border-t border-border/30 pt-4">
								<div className="font-mono text-xs text-muted-foreground">
									<span className="text-muted-foreground/70">Mechanism:</span>{' '}
									{tool.pricing.mechanism.description}
								</div>
							</div>
						</motion.div>
					)
				})}
			</div>

			{/* Pricing Insight Quote */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
				className="mt-8 rounded border border-border/30 bg-background/20 p-4"
			>
				<p className="font-mono text-sm italic text-muted-foreground">
					{getPricingInsight(tools, filters)}
				</p>
			</motion.div>
		</section>
	)
}

function isLowestCost(
	tools: ToolComparison[],
	usageKey: 'light' | 'daily' | 'power',
	currentSlug: string,
): boolean {
	const costs = tools
		.filter((t) => t.pricing?.realCosts?.[usageKey]?.range)
		.map((t) => ({
			slug: t.slug,
			minCost: parseMinCost(t.pricing.realCosts[usageKey].range),
		}))

	if (costs.length === 0) return false

	const sorted = costs.sort((a, b) => a.minCost - b.minCost)
	return sorted[0]?.slug === currentSlug
}

function parseMinCost(range: string): number {
	const match = range.match(/\$(\d+)/)
	return match ? Number.parseInt(match[1], 10) : 999
}

function getPricingInsight(
	_tools: ToolComparison[],
	filters: FilterState,
): string {
	if (filters.usage === 'power') {
		return '"Heavy users should budget for overages. Cursor\'s token model can surprise you; Claude Code\'s API option gives you cost control."'
	}
	if (filters.usage === 'daily') {
		return '"Daily agent users: Codex shares quota with ChatGPT. If you\'re a heavy GPT user, that ceiling hits fast."'
	}
	return '"Light usage? Claude Pro at $20/mo includes Claude Code. Codex comes free with ChatGPT Plus."'
}
