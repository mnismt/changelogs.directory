import { ArrowRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ToolPlanGroup } from '@/data/tool-plans'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface CompareTrayProps {
	pinned: ToolPlanGroup[]
	onRemove: (slug: string) => void
	onCompare: () => void
	visible: boolean
}

/**
 * Floating action bar for compare-select mode. Sits above the MobileDock
 * (bottom-6) at bottom-[5.5rem] so the two never collide; the parent hides it
 * while the TwoUpCompareSheet (a BottomSheet) is open, since the sheet is modal
 * and already auto-hides the dock via body.dataset.bottomSheetOpen. md:hidden.
 */
export function CompareTray({
	pinned,
	onRemove,
	onCompare,
	visible,
}: CompareTrayProps) {
	const ready = pinned.length === 2

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: 'spring', stiffness: 260, damping: 22 }}
					className="fixed inset-x-4 bottom-[5.5rem] z-40 flex justify-center md:hidden"
				>
					<div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-black/70 p-2 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
						<div className="flex min-w-0 flex-1 items-center gap-1.5">
							{pinned.map((group) => (
								<PinnedChip
									key={group.slug}
									group={group}
									onRemove={onRemove}
								/>
							))}
							{pinned.length === 1 && (
								<span className="shrink-0 font-mono text-[11px] text-muted-foreground">
									+1 more
								</span>
							)}
						</div>

						<button
							type="button"
							onClick={onCompare}
							disabled={!ready}
							className={cn(
								'flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 font-mono text-[13px] font-bold transition-colors',
								ready
									? 'bg-foreground text-background hover:bg-foreground/90'
									: 'cursor-not-allowed bg-white/5 text-muted-foreground/60',
							)}
						>
							Compare
							<ArrowRight className="size-4" />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

function PinnedChip({
	group,
	onRemove,
}: {
	group: ToolPlanGroup
	onRemove: (slug: string) => void
}) {
	const logo = getToolLogo(group.slug)
	const isGeminiCli = group.slug === 'gemini-cli'

	return (
		<span className="flex min-w-0 items-center gap-1 rounded-full bg-white/5 py-1 pr-1 pl-1.5">
			{logo && (
				<span
					className={cn(
						'flex size-5 shrink-0 items-center justify-center',
						'[&>svg]:h-full [&>svg]:w-full',
						isMonochromeLogo(group.slug) &&
							!isGeminiCli &&
							'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
						getLogoHoverClasses(group.slug),
					)}
				>
					{logo}
				</span>
			)}
			<span className="truncate font-mono text-[12px] text-foreground">
				{group.name}
			</span>
			<button
				type="button"
				onClick={() => onRemove(group.slug)}
				aria-label={`Remove ${group.name}`}
				className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
			>
				<X className="size-3" />
			</button>
		</span>
	)
}
