import { Filter, X } from 'lucide-react'
import {
	AnimatePresence,
	motion,
	useMotionValueEvent,
	useScroll,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export function StickyFilterBar({ children }: { children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null)
	const { scrollY } = useScroll()
	const [isStuck, setIsStuck] = useState(false)
	const [isExpanded, setIsExpanded] = useState(false)
	const isDesktop = useMediaQuery('(min-width: 768px)')

	useMotionValueEvent(scrollY, 'change', () => {
		if (ref.current) {
			// Get the initial position of the element
			// We want to stick when we scroll PAST the element's initial position
			// The element is rendered in the flow, so we can check its offsetTop
			// However, offsetTop is static.
			// A better way is to check if the scrollY is greater than the element's top position + some offset
			// Let's assume the element is around 300px down.
			// But to be precise, we can use the ref.

			// Actually, the simplest way for a "clone" sticky header is:
			// 1. Render the original element (invisible or visible) to hold space.
			// 2. Render a fixed element that appears when scrollY > threshold.

			// Let's try a threshold of 200px for now, or use the ref's position.
			// Since the layout is dynamic, let's stick to the sentinel but make it robust.
			// The sentinel is at the top of the component.
			// If sentinel.getBoundingClientRect().top < 80 (top-20), we are stuck.

			const rect = ref.current.getBoundingClientRect()
			setIsStuck(rect.top <= 80)
		}
	})

	// Reset expansion when unstuck
	useEffect(() => {
		if (!isStuck) {
			setIsExpanded(false)
		}
	}, [isStuck])

	return (
		<>
			{/* Sentinel to track position */}
			<div ref={ref} className="h-px w-full pointer-events-none opacity-0" />

			{/* Original Content (keeps layout space) */}
			<div
				className={cn(
					'transition-opacity duration-300',
					isStuck ? 'opacity-0 pointer-events-none' : 'opacity-100',
				)}
			>
				{children}
			</div>

			{/* Sticky Clone */}
			<AnimatePresence mode="wait">
				{isStuck && (
					<>
						{/* Mobile Collapsed State */}
						{!isDesktop && !isExpanded && (
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
								className="fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground shadow-xl backdrop-blur-xl hover:bg-white/5 hover:text-foreground"
							>
								<Filter className="h-4 w-4" />
								<span>Filters</span>
							</motion.button>
						)}

						{/* Expanded State (Mobile & Desktop) */}
						{(isDesktop || isExpanded) && (
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
								className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-7xl rounded-xl border border-white/10 p-4 shadow-2xl shadow-black/50 md:left-8 md:right-8 lg:left-0 lg:right-0"
							>
								{/* Mobile Close Button */}
								{!isDesktop && (
									<div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2 md:hidden">
										<span className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">
											Filter & View
										</span>
										<button
											type="button"
											onClick={() => setIsExpanded(false)}
											className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								)}
								{children}
							</motion.div>
						)}
					</>
				)}
			</AnimatePresence>
		</>
	)
}
