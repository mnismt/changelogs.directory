import { useNavigate, useSearch } from '@tanstack/react-router'
import { Grid3x3, List } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function ViewToggle() {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as {
		view?: 'grid' | 'timeline'
		type?: string | string[]
	}

	const currentView = search.view || 'timeline'

	const handleViewChange = (view: 'grid' | 'timeline') => {
		navigate({
			search: {
				...search,
				view,
			},
			replace: true,
			resetScroll: false,
			// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		} as any)
	}

	return (
		<div className="flex items-center gap-2">
			<motion.button
				type="button"
				onClick={() => handleViewChange('grid')}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className={cn(
					'relative flex items-center gap-2 px-3 py-1.5 font-mono text-xs transition-colors duration-300 border rounded-sm border-transparent',
					currentView === 'grid'
						? 'text-background'
						: 'text-foreground/60 hover:text-foreground hover:bg-white/5',
				)}
			>
				{currentView === 'grid' && (
					<motion.div
						layoutId="view-toggle-active"
						className="absolute inset-0 rounded-sm bg-foreground"
						transition={{
							type: 'spring',
							stiffness: 200,
							damping: 25,
							mass: 1.2,
						}}
					/>
				)}
				<span className="relative z-10 flex items-center gap-2">
					<Grid3x3 className="h-3 w-3" />
					GRID
				</span>
			</motion.button>

			<div className="h-4 w-px bg-white/10" />

			<motion.button
				type="button"
				onClick={() => handleViewChange('timeline')}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className={cn(
					'relative flex items-center gap-2 px-3 py-1.5 font-mono text-xs transition-colors duration-300 border rounded-sm border-transparent',
					currentView === 'timeline'
						? 'text-background'
						: 'text-foreground/60 hover:text-foreground hover:bg-white/5',
				)}
			>
				{currentView === 'timeline' && (
					<motion.div
						layoutId="view-toggle-active"
						className="absolute inset-0 rounded-sm bg-foreground"
						transition={{
							type: 'spring',
							stiffness: 200,
							damping: 25,
							mass: 1.2,
						}}
					/>
				)}
				<span className="relative z-10 flex items-center gap-2">
					<List className="h-3 w-3" />
					TIMELINE
				</span>
			</motion.button>
		</div>
	)
}
