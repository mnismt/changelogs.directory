import { LayoutGrid, Table2 } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type CompareView = 'cards' | 'table'

interface CompareViewToggleProps {
	value: CompareView
	onChange: (view: CompareView) => void
}

const OPTIONS: {
	value: CompareView
	label: string
	Icon: typeof LayoutGrid
}[] = [
	{ value: 'cards', label: 'Cards', Icon: LayoutGrid },
	{ value: 'table', label: 'Table', Icon: Table2 },
]

/**
 * Desktop-only segmented control switching the /compare page between the browsy
 * card grid and the alignable matrix. A shared `layoutId` pill slides between
 * the two — both views read the same TOOL_PLANS data, so it's purely a lens.
 */
export function CompareViewToggle({ value, onChange }: CompareViewToggleProps) {
	return (
		<div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/40 p-1 backdrop-blur-sm">
			{OPTIONS.map(({ value: v, label, Icon }) => {
				const active = v === value
				return (
					<button
						key={v}
						type="button"
						onClick={() => onChange(v)}
						aria-pressed={active}
						className={cn(
							'relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5',
							'font-mono text-[11px] uppercase tracking-wider transition-colors',
							active
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground/80',
						)}
					>
						{active && (
							<motion.span
								layoutId="compare-view-pill"
								transition={{ type: 'spring', stiffness: 380, damping: 32 }}
								className="absolute inset-0 rounded-full border border-border/70 bg-secondary/70"
							/>
						)}
						<Icon className="relative z-10 size-3.5" />
						<span className="relative z-10">{label}</span>
					</button>
				)
			})}
		</div>
	)
}
