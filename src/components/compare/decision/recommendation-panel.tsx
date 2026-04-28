import { AlertTriangle, Cpu, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { MODELS } from '@/data/models'
import type { ModelAvailability, ToolComparison } from '@/data/tool-comparison'
import type { FilterState } from '../persona-filters'
import { ToolLogo } from '../tool-logo'

interface RecommendationPanelProps {
	tools: ToolComparison[]
	filters: FilterState
}

interface Verdict {
	winner: string
	reason: string
	gotcha?: string
	alternatives: { tool: string; reason: string }[]
}

export function RecommendationPanel({
	tools,
	filters,
}: RecommendationPanelProps) {
	const verdict = computeVerdict(tools, filters)
	const winnerTool = tools.find((t) => t.slug === verdict.winner)
	const usageKey = filters.usage || 'daily'
	const cost = winnerTool?.pricing?.realCosts?.[usageKey]

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-6 md:p-8"
		>
			{/* Winner Header */}
			<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div className="flex items-start gap-4">
					<div className="shrink-0 rounded-full bg-green-500/20 p-3">
						<Trophy className="h-6 w-6 text-green-400" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="mb-1 font-mono text-xs uppercase tracking-wider text-green-400">
							Recommended for you
						</div>
						<div className="flex items-center gap-3">
							<ToolLogo slug={verdict.winner} className="h-8 w-8" />
							<h2 className="font-mono text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">
								{verdict.winner}
							</h2>
						</div>
					</div>
				</div>

				{cost && (
					<div className="ml-[3.25rem] sm:ml-0 sm:text-right">
						<div className="font-mono text-xs text-muted-foreground/60">
							Est. Cost
						</div>
						<div className="font-mono text-xl font-bold text-foreground md:text-2xl">
							{cost.range}
							<span className="ml-1 text-sm font-normal text-muted-foreground">
								/mo
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Reason */}
			<p className="mb-4 font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
				{verdict.reason}
			</p>

			{/* Mini Model Support Menu */}
			{winnerTool && (
				<div className="mb-6 rounded border border-white/10 bg-black/20 p-3">
					<div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
						<Cpu className="h-3.5 w-3.5" />
						<span className="font-mono uppercase tracking-wider">
							Key Models ({filters.models || 'standard'})
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{getTopModelsForTool(winnerTool, filters.models).map((m) => (
							<div
								key={m.id}
								className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1"
							>
								<div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
								<span className="font-mono text-xs text-foreground">
									{m.name}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Gotcha Warning */}
			{verdict.gotcha && (
				<div className="mb-6 flex items-start gap-2 rounded border border-yellow-500/20 bg-yellow-500/5 p-3">
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
					<p className="font-mono text-xs text-yellow-400/80">
						{verdict.gotcha}
					</p>
				</div>
			)}

			{/* Alternatives */}
			<div>
				<h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
					Why not the others?
				</h3>
				<div className="grid gap-2 sm:grid-cols-2">
					{verdict.alternatives.map((alt) => (
						<div
							key={alt.tool}
							className="flex items-start gap-3 rounded border border-border/30 bg-background/20 p-3"
						>
							<ToolLogo slug={alt.tool} className="mt-0.5 h-4 w-4 shrink-0" />
							<div>
								<div className="font-mono text-xs font-medium uppercase text-foreground">
									{alt.tool}
								</div>
								<div className="font-mono text-xs text-muted-foreground">
									{alt.reason}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</motion.div>
	)
}

export function computeVerdict(
	_tools: ToolComparison[],
	filters: FilterState,
): Verdict {
	// Free/Budget models → Cursor
	if (filters.models === 'free') {
		return {
			winner: 'cursor',
			reason:
				'Cursor is the only major tool with a truly free tier for hobbyists. You get basic completions and a generous trial period without paying a cent.',
			gotcha:
				'Free tier has slower requests and rate limits on frontier models.',
			alternatives: [
				{
					tool: 'codex',
					reason: 'Requires ChatGPT Plus ($20/mo) for useful access',
				},
				{
					tool: 'claude-code',
					reason: 'Requires Claude Pro ($20/mo) minimum',
				},
			],
		}
	}

	// Terminal preference → Claude Code
	if (filters.style === 'terminal') {
		return {
			winner: 'claude-code',
			reason:
				"For terminal-native workflows, Claude Code is unmatched. SSH into any server and you're ready to go. No IDE overhead, just raw Claude power.",
			gotcha:
				'Shares quota with claude.ai — heavy chat users may hit limits faster.',
			alternatives: [
				{ tool: 'cursor', reason: 'If you occasionally want a GUI' },
				{
					tool: 'codex',
					reason: "If you're already deep in the ChatGPT ecosystem",
				},
			],
		}
	}

	// IDE preference → Cursor
	if (filters.style === 'ide') {
		return {
			winner: 'cursor',
			reason:
				'For IDE lovers, Cursor is the gold standard. Tab completion, background agents, and a polished VS Code experience. The $20/mo starting point is reasonable for daily coders.',
			gotcha:
				'Token costs can surprise power users — monitor usage in settings.',
			alternatives: [
				{
					tool: 'claude-code',
					reason: "VS Code extension if you want Claude's brain",
				},
				{ tool: 'codex', reason: "If you prefer ChatGPT's approach" },
			],
		}
	}

	// Privacy requirement → Cursor (SOC 2)
	if (filters.privacy) {
		return {
			winner: 'cursor',
			reason:
				"Cursor is SOC 2 certified with team-wide privacy controls. For enterprise requirements, it's the safest bet.",
			alternatives: [
				{ tool: 'claude-code', reason: 'Anthropic is also SOC 2 certified' },
				{ tool: 'codex', reason: 'Enterprise tier has compliance features' },
			],
		}
	}

	// Power user → Cursor
	if (filters.usage === 'power') {
		return {
			winner: 'cursor',
			reason:
				"Power users benefit from background agents — queue up refactoring while you're in meetings. Be ready for the $200+/mo bill, but the productivity gain from async work is unmatched.",
			gotcha: 'Budget $200-500/mo for heavy usage with frontier models.',
			alternatives: [
				{
					tool: 'claude-code',
					reason:
						'5.5x cheaper on tokens (efficiency), but no background agents',
				},
				{ tool: 'codex', reason: 'If you need cloud tasks for async work' },
			],
		}
	}

	// Daily user → Claude Code
	if (filters.usage === 'daily') {
		return {
			winner: 'claude-code',
			reason:
				'For daily agent users, Claude Code offers the best balance of power and efficiency. Terminal-native means it fits into existing workflows.',
			gotcha: 'Shared quota with claude.ai — manage your chat usage.',
			alternatives: [
				{
					tool: 'cursor',
					reason: 'If you prefer VS Code. Budget $60-100/mo for this level.',
				},
				{
					tool: 'codex',
					reason: "If you're already paying for ChatGPT Pro ($200/mo)",
				},
			],
		}
	}

	// Light user → Codex
	return {
		winner: 'codex',
		reason:
			'Light users with ChatGPT Plus already have Codex included. Why pay extra? Use it for occasional code reviews and simple tasks.',
		alternatives: [
			{ tool: 'claude-code', reason: "If you prefer Claude's reasoning" },
			{ tool: 'cursor', reason: 'If you want the best tab completion' },
		],
	}
}

function getTopModelsForTool(
	tool: ToolComparison,
	tier: string,
): { id: string; name: string }[] {
	// 1. Filter models by the requested tier
	const relevantModels = tool.pricing.models.filter((m) => {
		const def = MODELS[m.modelId]
		if (!def) return false
		// Relax strict tier matching: if user asks for 'standard', show standard + frontier
		// If 'frontier', show frontier
		if (tier === 'frontier') return def.tier === 'frontier'
		if (tier === 'standard')
			return def.tier === 'standard' || def.tier === 'frontier'
		if (tier === 'budget')
			return def.tier === 'budget' || def.tier === 'standard'
		if (tier === 'free') return def.tier === 'free' || m.availability.free
		return true
	})

	// 2. Map to display data and slice
	return relevantModels
		.slice(0, 4) // max 4 tags
		.map((m) => ({
			id: m.modelId,
			name:
				MODELS[m.modelId]?.name.replace('Claude', '').replace('GPT-', '') ||
				m.modelId,
		}))
}
