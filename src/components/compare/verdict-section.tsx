import { Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import type { ToolComparison } from '@/data/tool-comparison'
import { cn } from '@/lib/utils'
import type { FilterState } from './persona-filters'
import { SectionHeader } from './shared/section-header'
import { ToolLogo } from './tool-logo'

interface VerdictSectionProps {
	tools: ToolComparison[]
	filters: FilterState
}

interface Verdict {
	winner: string
	reason: string
	alternatives: { tool: string; reason: string }[]
}

export function VerdictSection({ tools, filters }: VerdictSectionProps) {
	const verdict = computeVerdict(tools, filters)
	const winnerTool = tools.find((t) => t.slug === verdict.winner)

	return (
		<section className="py-12">
			<SectionHeader
				title="The Verdict"
				subtitle={`Based on ${filters.usage} usage, ${filters.models} models${filters.style ? `, ${filters.style} preference` : ''}${filters.privacy ? ', privacy required' : ''}`}
			/>

			{/* Winner Card */}
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="mt-8 rounded-lg border-2 border-green-500/30 bg-green-500/5 p-8"
			>
				<div className="mb-4 flex items-center gap-3">
					<div className="rounded-full bg-green-500/20 p-2">
						<Trophy className="h-6 w-6 text-green-400" />
					</div>
					<div>
						<div className="font-mono text-xs uppercase tracking-wider text-green-400">
							Recommended
						</div>
						<div className="flex items-center gap-2 font-mono text-2xl font-bold uppercase text-foreground">
							<ToolLogo slug={verdict.winner} />
							{verdict.winner}
						</div>
					</div>
				</div>

				<p className="mb-6 font-mono text-sm leading-relaxed text-muted-foreground">
					"{verdict.reason}"
				</p>

				{winnerTool && (
					<div className="flex flex-wrap gap-4 border-t border-green-500/20 pt-4">
						<div className="font-mono text-xs text-muted-foreground">
							<span className="text-muted-foreground/60">Tagline:</span>{' '}
							{winnerTool.tagline}
						</div>
						<div className="font-mono text-xs text-muted-foreground">
							<span className="text-muted-foreground/60">Best for:</span>{' '}
							{winnerTool.bestFor}
						</div>
					</div>
				)}
			</motion.div>

			{/* Alternatives */}
			<div className="mt-8">
				<h3 className="mb-4 font-mono text-sm uppercase tracking-wider text-muted-foreground">
					Alternatives
				</h3>
				<div className="space-y-3">
					{verdict.alternatives.map((alt, index) => (
						<motion.div
							key={alt.tool}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							className="flex items-start gap-3 rounded border border-border/30 bg-background/20 p-4"
						>
							<div className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-foreground">
								<ToolLogo slug={alt.tool} className="h-4 w-4" />
								{alt.tool}
							</div>
							<div className="font-mono text-xs text-muted-foreground">
								{alt.reason}
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Pros/Cons Grid */}
			<div className="mt-12 grid gap-6 md:grid-cols-3">
				{tools.map((tool) => (
					<motion.div
						key={tool.slug}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className={cn(
							'rounded-lg border p-6',
							tool.slug === verdict.winner
								? 'border-green-500/30 bg-green-500/5'
								: 'border-border/40 bg-background/40',
						)}
					>
						<div className="mb-4 flex items-center gap-3 font-mono text-lg font-bold uppercase text-foreground">
							<ToolLogo slug={tool.slug} />
							{tool.slug}
						</div>

						<div className="mb-4">
							<div className="mb-2 font-mono text-xs uppercase text-green-400">
								Pros
							</div>
							<ul className="space-y-1">
								{tool.pros.slice(0, 3).map((pro) => (
									<li
										key={pro}
										className="font-mono text-xs text-muted-foreground"
									>
										+ {pro.split(' - ')[0]}
									</li>
								))}
							</ul>
						</div>

						<div>
							<div className="mb-2 font-mono text-xs uppercase text-red-400">
								Cons
							</div>
							<ul className="space-y-1">
								{tool.cons.slice(0, 3).map((con) => (
									<li
										key={con}
										className="font-mono text-xs text-muted-foreground"
									>
										- {con.split(' - ')[0]}
									</li>
								))}
							</ul>
						</div>
					</motion.div>
				))}
			</div>
		</section>
	)
}

function computeVerdict(
	_tools: ToolComparison[],
	filters: FilterState,
): Verdict {
	// Terminal preference → Claude Code
	if (filters.style === 'terminal') {
		return {
			winner: 'claude-code',
			reason:
				"For terminal-native workflows, Claude Code is unmatched. SSH into any server and you're ready to go. No IDE overhead, just raw Claude power.",
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

	// Power user → Cursor or Claude Code (depends on background agents need)
	if (filters.usage === 'power') {
		return {
			winner: 'cursor',
			reason:
				"Power users benefit from background agents — queue up refactoring while you're in meetings. Be ready for the $200+/mo bill, but the productivity gain from async work is unmatched.",
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

	// Daily user → Context-dependent
	if (filters.usage === 'daily') {
		return {
			winner: 'claude-code',
			reason:
				'For daily agent users, Claude Code offers the best balance of power and efficiency. Terminal-native means it fits into existing workflows. Just watch out for the shared quota with claude.ai.',
			alternatives: [
				{
					tool: 'cursor',
					reason: 'If you prefer VS Code. Budget $60-100/mo for this level.',
				},
				{
					tool: 'codex',
					reason:
						"If you're already paying for ChatGPT Pro ($200/mo) and want the bundle",
				},
			],
		}
	}

	// Light user → Codex (included with ChatGPT Plus)
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
