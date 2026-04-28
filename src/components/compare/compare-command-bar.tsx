import { Filter, Share2, X } from 'lucide-react'
import {
	AnimatePresence,
	motion,
	useMotionValueEvent,
	useScroll,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { type CompareViewMode, CompareViewToggle } from './compare-view-toggle'
import { type FilterState, PersonaFilters } from './persona-filters'

interface CompareCommandBarProps {
	filters: FilterState
	onFilterChange: (filters: FilterState) => void
	view: CompareViewMode
	onViewChange: (view: CompareViewMode) => void
	onShare: () => void
}

export function CompareCommandBar({
	filters,
	onFilterChange,
	view,
	onViewChange,
	onShare,
}: CompareCommandBarProps) {
	const ref = useRef<HTMLDivElement>(null)
	const { scrollY } = useScroll()
	const [isStuck, setIsStuck] = useState(false)
	const [isExpanded, setIsExpanded] = useState(false)
	const isDesktop = useMediaQuery('(min-width: 768px)')

	useMotionValueEvent(scrollY, 'change', () => {
		if (ref.current) {
			const rect = ref.current.getBoundingClientRect()
			setIsStuck(rect.top <= 80)
		}
	})

	useEffect(() => {
		if (!isStuck) {
			setIsExpanded(false)
		}
	}, [isStuck])

	const commandString = buildCommandString(filters, view)

	return (
		<>
			{/* Sentinel to track position */}
			<div ref={ref} className="pointer-events-none h-px w-full opacity-0" />

			{/* Original Content (always visible on desktop, fades on mobile when stuck) */}
			<div
				className={cn(
					'transition-opacity duration-300',
					isStuck && !isDesktop
						? 'pointer-events-none opacity-0'
						: 'opacity-100',
				)}
			>
				<CommandBarContent
					filters={filters}
					onFilterChange={onFilterChange}
					view={view}
					onViewChange={onViewChange}
					onShare={onShare}
					commandString={commandString}
					isCompact={false}
				/>
			</div>

			{/* Sticky Clone - Mobile only */}
			<AnimatePresence mode="wait">
				{isStuck && !isDesktop && (
					<>
						{/* Mobile Collapsed State */}
						{!isExpanded && (
							<motion.button
								initial={{ opacity: 0, y: -20, scale: 0.9 }}
								animate={{
									opacity: 1,
									y: 0,
									scale: 1,
									backgroundColor: 'rgba(0,0,0,0.8)',
									borderColor: 'rgba(255,255,255,0.1)',
									backdropFilter: 'blur(12px)',
								}}
								exit={{ opacity: 0, y: -20, scale: 0.9 }}
								transition={{ duration: 0.2 }}
								onClick={() => setIsExpanded(true)}
								className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground shadow-xl backdrop-blur-xl hover:bg-white/5 hover:text-foreground"
							>
								<Filter className="h-4 w-4" />
								<span className="font-mono text-xs">{view.toUpperCase()}</span>
							</motion.button>
						)}

						{/* Mobile Expanded State */}
						{isExpanded && (
							<motion.div
								initial={{ opacity: 0, y: -20, scale: 0.95 }}
								animate={{
									opacity: 1,
									y: 0,
									scale: 1,
									backgroundColor: 'rgba(0,0,0,0.8)',
									borderColor: 'rgba(255,255,255,0.1)',
									backdropFilter: 'blur(12px)',
								}}
								exit={{ opacity: 0, y: -20, scale: 0.95 }}
								transition={{ duration: 0.3, ease: 'circOut' }}
								className="fixed left-4 right-4 top-20 z-50 mx-auto rounded-xl border border-white/10 p-4 shadow-2xl shadow-black/50"
							>
								<div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
									<span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Compare Options
									</span>
									<button
										type="button"
										onClick={() => setIsExpanded(false)}
										className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
								<CommandBarContent
									filters={filters}
									onFilterChange={onFilterChange}
									view={view}
									onViewChange={onViewChange}
									onShare={onShare}
									commandString={commandString}
									isCompact={true}
								/>
							</motion.div>
						)}
					</>
				)}
			</AnimatePresence>
		</>
	)
}

interface CommandBarContentProps {
	filters: FilterState
	onFilterChange: (filters: FilterState) => void
	view: CompareViewMode
	onViewChange: (view: CompareViewMode) => void
	onShare: () => void
	commandString: string
	isCompact: boolean
}

function CommandBarContent({
	filters,
	onFilterChange,
	view,
	onViewChange,
	onShare,
	commandString,
	isCompact,
}: CommandBarContentProps) {
	return (
		<div
			className={cn(
				'rounded-lg border border-border/40 bg-background/40 backdrop-blur-sm',
				isCompact ? 'p-4' : 'p-6',
			)}
		>
			{/* Command prompt line */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
					<span className="text-primary">$_</span>
					<span className="hidden sm:inline">{commandString}</span>
					<span className="sm:hidden">compare</span>
				</div>

				<div className="flex items-center gap-3">
					<CompareViewToggle view={view} onViewChange={onViewChange} />
					<button
						type="button"
						onClick={onShare}
						className="flex items-center gap-2 rounded border border-border/40 bg-background/20 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-background/40 hover:text-foreground"
					>
						<Share2 className="h-3 w-3" />
						<span className="hidden sm:inline">Share</span>
					</button>
				</div>
			</div>

			{/* Filters - more compact in sticky mode */}
			<PersonaFilters
				filters={filters}
				onFilterChange={onFilterChange}
				className={cn(
					'!mb-0 !border-0 !bg-transparent !p-0',
					isCompact && 'compact',
				)}
			/>
		</div>
	)
}

function buildCommandString(
	filters: FilterState,
	view: CompareViewMode,
): string {
	const parts = ['compare']

	if (filters.usage) {
		parts.push(`--usage=${filters.usage}`)
	}
	if (filters.models) {
		parts.push(`--models=${filters.models}`)
	}
	if (filters.style) {
		parts.push(`--style=${filters.style}`)
	}
	if (filters.privacy) {
		parts.push('--privacy')
	}
	parts.push(`--view=${view}`)

	return parts.join(' ')
}
