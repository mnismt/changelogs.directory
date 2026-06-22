import { Check, ChevronRight, Package } from 'lucide-react'
import { motion } from 'motion/react'
import { DeprecationBadge } from '@/components/compare/plans-card'
import { ToolHeadlineChip } from '@/components/compare/tool-headline-chip'
import type { ToolPlanGroup } from '@/data/tool-plans'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface CompareRowProps {
	group: ToolPlanGroup
	index: number
	onOpen: (slug: string) => void
	/** Phase 2: when in compare-select mode the row toggles a pin instead of opening the sheet. */
	compareMode?: boolean
	selected?: boolean
	onToggleSelect?: (slug: string) => void
}

/**
 * The glanceable mobile row: a full-width >=64px tap target. In the default
 * mode it opens the tool's detail sheet; in compare-select mode the same single
 * button toggles a pin (no nested buttons). Touch-only — NO hover handlers (so
 * synthetic-mouse states never latch dim/blur/peer). The value column is
 * normalized across rows so "~Nx" stacks vertically for informal A/B.
 */
export function CompareRow({
	group,
	index,
	onOpen,
	compareMode = false,
	selected = false,
	onToggleSelect,
}: CompareRowProps) {
	const logo = getToolLogo(group.slug)
	const isGeminiCli = group.slug === 'gemini-cli'

	return (
		<motion.button
			type="button"
			onClick={() =>
				compareMode ? onToggleSelect?.(group.slug) : onOpen(group.slug)
			}
			aria-pressed={compareMode ? selected : undefined}
			initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
			animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			transition={{
				duration: 0.5,
				ease: [0.22, 1, 0.36, 1],
				delay: 0.06 * index,
			}}
			whileTap={{
				scale: 0.985,
				transition: { type: 'spring', stiffness: 320, damping: 26 },
			}}
			className={cn(
				'flex min-h-[72px] w-full items-center gap-3.5 px-4 py-4 text-left transition-colors',
				selected ? 'bg-emerald-500/[0.06]' : 'active:bg-white/[0.03]',
			)}
		>
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

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="truncate font-mono text-sm font-bold tracking-tight text-foreground">
					{group.name}
				</span>
				<span className="truncate font-mono text-[11px] text-muted-foreground">
					{group.vendor}
				</span>
				{group.deprecated && (
					<DeprecationBadge
						info={group.deprecated}
						className="self-start"
						interactive={false}
					/>
				)}
			</div>

			<div className="shrink-0">
				<ToolHeadlineChip group={group} />
			</div>

			{compareMode ? (
				<span
					className={cn(
						'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
						selected
							? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
							: 'border-border/70 text-transparent',
					)}
				>
					<Check className="size-3.5" strokeWidth={3} />
				</span>
			) : (
				<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
			)}
		</motion.button>
	)
}
