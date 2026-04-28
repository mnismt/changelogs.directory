import { Database, Lightbulb } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type CompareViewMode = 'decision' | 'data'

interface CompareViewToggleProps {
	view: CompareViewMode
	onViewChange: (view: CompareViewMode) => void
}

export function CompareViewToggle({
	view,
	onViewChange,
}: CompareViewToggleProps) {
	return (
		<div className="flex items-center gap-1 rounded-md border border-border/40 bg-background/20 p-1">
			<motion.button
				type="button"
				onClick={() => onViewChange('decision')}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				className={cn(
					'relative flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors duration-300',
					view === 'decision'
						? 'text-background'
						: 'text-muted-foreground hover:text-foreground',
				)}
			>
				{view === 'decision' && (
					<motion.div
						layoutId="compare-view-toggle-active"
						className="absolute inset-0 rounded bg-foreground"
						transition={{
							type: 'spring',
							stiffness: 200,
							damping: 25,
							mass: 1.2,
						}}
					/>
				)}
				<span className="relative z-10 flex items-center gap-2">
					<Lightbulb className="h-3 w-3" />
					<span className="hidden sm:inline">Decision</span>
				</span>
			</motion.button>

			<motion.button
				type="button"
				onClick={() => onViewChange('data')}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				className={cn(
					'relative flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors duration-300',
					view === 'data'
						? 'text-background'
						: 'text-muted-foreground hover:text-foreground',
				)}
			>
				{view === 'data' && (
					<motion.div
						layoutId="compare-view-toggle-active"
						className="absolute inset-0 rounded bg-foreground"
						transition={{
							type: 'spring',
							stiffness: 200,
							damping: 25,
							mass: 1.2,
						}}
					/>
				)}
				<span className="relative z-10 flex items-center gap-2">
					<Database className="h-3 w-3" />
					<span className="hidden sm:inline">Data</span>
				</span>
			</motion.button>
		</div>
	)
}
