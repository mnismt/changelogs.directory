import { Columns2, X } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type CompareBucket = 'official' | 'harness'

interface SectionSegmentedControlProps {
	value: CompareBucket
	onChange: (value: CompareBucket) => void
	/** Phase 2: compare-select mode controls. */
	compareMode?: boolean
	onToggleCompareMode?: () => void
	pinnedCount?: number
}

const SEGMENTS: { id: CompareBucket; label: string }[] = [
	{ id: 'official', label: 'Official' },
	{ id: 'harness', label: 'Harnesses' },
]

/**
 * Sticky Official/Harnesses two-pill toggle with a layoutId sliding pill
 * (distinct from MobileDock's 'dock-active'). Filters which bucket's rows
 * render, and hosts the Phase 2 Compare/Cancel toggle + select hint.
 * md:hidden, stuck below the global mobile header.
 */
export function SectionSegmentedControl({
	value,
	onChange,
	compareMode = false,
	onToggleCompareMode,
	pinnedCount = 0,
}: SectionSegmentedControlProps) {
	return (
		<div className="sticky top-14 z-30 -mx-4 mb-6 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
			<div className="flex items-center gap-2">
				<div className="flex flex-1 items-center gap-1 rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur-sm">
					{SEGMENTS.map((segment) => {
						const isActive = segment.id === value
						return (
							<button
								key={segment.id}
								type="button"
								onClick={() => onChange(segment.id)}
								className={cn(
									'relative flex-1 rounded-full px-4 py-2 font-mono text-[13px] font-medium transition-colors',
									isActive
										? 'text-foreground'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{isActive && (
									<motion.div
										layoutId="compare-section-active"
										className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/5"
										transition={{
											type: 'spring',
											stiffness: 300,
											damping: 30,
										}}
									/>
								)}
								<span className="relative z-10">{segment.label}</span>
							</button>
						)
					})}
				</div>

				{onToggleCompareMode && (
					<button
						type="button"
						onClick={onToggleCompareMode}
						aria-pressed={compareMode}
						className={cn(
							'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 font-mono text-[13px] font-medium transition-colors',
							compareMode
								? 'border-foreground/30 bg-foreground/10 text-foreground'
								: 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
						)}
					>
						{compareMode ? (
							<X className="size-4" />
						) : (
							<Columns2 className="size-4" />
						)}
						<span>{compareMode ? 'Cancel' : 'Compare'}</span>
					</button>
				)}
			</div>

			{compareMode && (
				<motion.p
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-2 font-mono text-[11px] text-muted-foreground"
				>
					{pinnedCount === 0
						? 'Select 2 tools to compare side by side.'
						: pinnedCount === 1
							? 'Select 1 more tool.'
							: 'Ready — tap Compare below.'}
				</motion.p>
			)}
		</div>
	)
}
