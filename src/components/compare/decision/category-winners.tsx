import {
	Brain,
	DollarSign,
	Lock,
	Rocket,
	Search,
	Sparkles,
	Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { ToolComparison } from '@/data/tool-comparison'
import { cn } from '@/lib/utils'
import type { VelocityStats } from '@/server/compare'
import type { FilterState } from '../persona-filters'
import { ToolLogo } from '../tool-logo'

interface CategoryWinnersProps {
	tools: ToolComparison[]
	filters: FilterState
	velocityStats: VelocityStats[]
	onCategoryClick?: (category: string) => void
}

interface CategoryWinner {
	id: string
	label: string
	icon: React.ReactNode
	winner: string
	note: string
}

export function CategoryWinners({
	tools,
	filters,
	velocityStats,
	onCategoryClick,
}: CategoryWinnersProps) {
	const categories = computeCategoryWinners(tools, filters, velocityStats)

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.1 }}
			className="rounded-lg border border-border/40 bg-background/40 p-6 backdrop-blur-sm"
		>
			<h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
				Category Leaders
			</h3>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{categories.map((category, index) => (
					<motion.button
						key={category.id}
						type="button"
						onClick={() => onCategoryClick?.(category.id)}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						whileHover={{
							scale: 1.02,
							backgroundColor: 'rgba(255,255,255,0.05)',
						}}
						whileTap={{ scale: 0.98 }}
						className={cn(
							'group flex flex-col items-center gap-2 rounded-lg border border-border/30 bg-background/20 p-3 text-center transition-colors',
							onCategoryClick && 'cursor-pointer hover:border-border/50',
						)}
					>
						<div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
							{category.icon}
							<span className="font-mono text-[10px] uppercase tracking-wider">
								{category.label}
							</span>
						</div>

						<div className="flex items-center gap-1.5">
							<ToolLogo slug={category.winner} className="h-4 w-4" />
							<span className="font-mono text-xs font-medium uppercase text-foreground">
								{category.winner}
							</span>
						</div>

						<span className="font-mono text-[10px] text-muted-foreground/70 line-clamp-2">
							{category.note}
						</span>
					</motion.button>
				))}
			</div>
		</motion.div>
	)
}

function computeCategoryWinners(
	tools: ToolComparison[],
	filters: FilterState,
	velocityStats: VelocityStats[],
): CategoryWinner[] {
	const usageKey = filters.usage || 'daily'

	// Cost winner (lowest for usage level)
	const costWinner = findLowestCost(tools, usageKey)

	// Agents winner (best agentic support)
	const agentsWinner = findBestAgents(tools)

	// Search winner (best codebase search)
	const searchWinner = findBestSearch(tools)

	// Velocity winner (most active development)
	const velocityWinner = findMostActive(velocityStats)

	// Privacy winner (best privacy features)
	const privacyWinner = findBestPrivacy(tools)

	// UX winner (editorial pick based on polish)
	const uxWinner = findBestUX(tools)

	// Models winner (best model selection/price)
	const modelsWinner = findBestModels(tools, filters)

	return [
		{
			id: 'cost',
			label: 'Cost',
			icon: <DollarSign className="h-3 w-3" />,
			winner: costWinner.slug,
			note: costWinner.note,
		},
		{
			id: 'models',
			label: 'Models',
			icon: <Brain className="h-3 w-3" />,
			winner: modelsWinner.slug,
			note: modelsWinner.note,
		},
		{
			id: 'agents',
			label: 'Agents',
			icon: <Zap className="h-3 w-3" />,
			winner: agentsWinner.slug,
			note: agentsWinner.note,
		},
		{
			id: 'search',
			label: 'Search',
			icon: <Search className="h-3 w-3" />,
			winner: searchWinner.slug,
			note: searchWinner.note,
		},
		{
			id: 'velocity',
			label: 'Velocity',
			icon: <Rocket className="h-3 w-3" />,
			winner: velocityWinner.slug,
			note: velocityWinner.note,
		},
		{
			id: 'privacy',
			label: 'Privacy',
			icon: <Lock className="h-3 w-3" />,
			winner: privacyWinner.slug,
			note: privacyWinner.note,
		},
		{
			id: 'ux',
			label: 'UX',
			icon: <Sparkles className="h-3 w-3" />,
			winner: uxWinner.slug,
			note: uxWinner.note,
		},
	]
}

function findLowestCost(
	tools: ToolComparison[],
	usageKey: 'light' | 'daily' | 'power',
): { slug: string; note: string } {
	let lowest = { slug: 'codex', minCost: 999, note: 'Included with Plus' }

	for (const tool of tools) {
		const cost = tool.pricing?.realCosts?.[usageKey]
		if (cost?.range) {
			const match = cost.range.match(/\$(\d+)/)
			const minCost = match ? Number.parseInt(match[1], 10) : 999
			if (minCost < lowest.minCost) {
				lowest = { slug: tool.slug, minCost, note: cost.range }
			}
		}
	}

	return lowest
}

function findBestModels(
	tools: ToolComparison[],
	filters: FilterState,
): { slug: string; note: string } {
	// If looking for Frontier models, Cursor has the widest selection
	if (filters.models === 'frontier') {
		return { slug: 'cursor', note: 'All top models' }
	}
	// For free models, Cursor has the best free tier
	if (filters.models === 'free') {
		return { slug: 'cursor', note: 'Free frontier use' }
	}
	// Default to Cursor for variety, or Claude if focused on Sonnet
	return { slug: 'cursor', note: 'Widest selection' }
}

function findBestAgents(tools: ToolComparison[]): {
	slug: string
	note: string
} {
	// Check capabilities for cloud agents (background agents)
	for (const tool of tools) {
		if (tool.capabilities?.cloudAgents === 'cloud') {
			return { slug: tool.slug, note: 'Background agents' }
		}
	}
	return { slug: 'cursor', note: 'Background agents' }
}

function findBestSearch(tools: ToolComparison[]): {
	slug: string
	note: string
} {
	// Check for codebase search capability
	for (const tool of tools) {
		if (tool.capabilities?.codebaseSearch === 'native-rag') {
			return { slug: tool.slug, note: 'Native RAG search' }
		}
	}
	for (const tool of tools) {
		if (tool.capabilities?.codebaseSearch === 'agentic') {
			return { slug: tool.slug, note: 'Agentic search' }
		}
	}
	return { slug: 'cursor', note: 'Full codebase' }
}

function findMostActive(velocityStats: VelocityStats[]): {
	slug: string
	note: string
} {
	if (velocityStats.length === 0) {
		return { slug: 'claude-code', note: 'Rapid updates' }
	}

	const sorted = [...velocityStats].sort(
		(a, b) => b.releasesLast30Days - a.releasesLast30Days,
	)

	const winner = sorted[0]
	return {
		slug: winner.toolSlug,
		note: `${winner.releasesLast30Days} releases/30d`,
	}
}

function findBestPrivacy(tools: ToolComparison[]): {
	slug: string
	note: string
} {
	// Look for SOC 2 certification or privacy mode
	for (const tool of tools) {
		if (tool.slug === 'cursor') {
			return { slug: 'cursor', note: 'SOC 2 certified' }
		}
	}
	return { slug: 'cursor', note: 'SOC 2 certified' }
}

function findBestUX(_tools: ToolComparison[]): { slug: string; note: string } {
	// Editorial pick - Cursor has the most polished IDE experience
	return { slug: 'cursor', note: 'Most polished' }
}
