import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Children, useEffect, useState } from 'react'
import type { Change, ChangeType } from '@/generated/prisma/client'
import { cn } from '@/lib/utils'

/**
 * Collapsible section component with mobile-optimized auto-collapse and progressive rendering.
 *
 * Features:
 * - Auto-collapses on mobile when items exceed threshold (5 items)
 * - Progressive rendering: loads items in batches via requestAnimationFrame
 * - Animated expand/collapse with height + opacity transitions
 * - Provides section ref for scroll tracking via useSectionObserver
 *
 * @see docs/design/animations/release-detail.md#i-collapsible-sections-v050
 */

const COLLAPSE_THRESHOLD = 5
const INITIAL_RENDER_COUNT = 10

interface CollapsibleSectionProps {
	type: ChangeType
	title: string
	changes: Change[]
	children: React.ReactNode
	onSectionRef?: (el: HTMLDivElement | null) => void
}

export function CollapsibleSection({
	type,
	title,
	changes,
	children,
	onSectionRef,
}: CollapsibleSectionProps) {
	const [isExpanded, setIsExpanded] = useState(true)
	const [isMobile, setIsMobile] = useState(false)
	const [renderCount, setRenderCount] = useState(INITIAL_RENDER_COUNT)

	const itemCount = changes.length
	const shouldCollapse = isMobile && itemCount > COLLAPSE_THRESHOLD
	const childArray = Children.toArray(children)

	// Detect mobile viewport
	useEffect(() => {
		const checkMobile = () => {
			const mobile = window.innerWidth < 768
			setIsMobile(mobile)
			// Auto-collapse on mobile if above threshold
			if (mobile && itemCount > COLLAPSE_THRESHOLD) {
				setIsExpanded(false)
			} else {
				setIsExpanded(true)
			}
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [itemCount])

	// Progressive rendering: start with INITIAL_RENDER_COUNT, then load more
	useEffect(() => {
		if (renderCount < childArray.length) {
			const timer = requestAnimationFrame(() => {
				setRenderCount((prev) => Math.min(prev + 20, childArray.length))
			})
			return () => cancelAnimationFrame(timer)
		}
	}, [renderCount, childArray.length])

	// Get visible children based on expanded state and render count
	const getVisibleChildren = () => {
		const limitedByRender = childArray.slice(0, renderCount)
		if (shouldCollapse && !isExpanded) {
			return limitedByRender.slice(0, COLLAPSE_THRESHOLD)
		}
		return limitedByRender
	}

	const visibleChildren = getVisibleChildren()
	const collapsedChildren =
		shouldCollapse && isExpanded
			? childArray.slice(COLLAPSE_THRESHOLD, renderCount)
			: []

	const handleToggle = () => {
		if (shouldCollapse) {
			setIsExpanded(!isExpanded)
		}
	}

	return (
		<div ref={onSectionRef} id={type.toLowerCase()} className="scroll-mt-24">
			{/* Section Header */}
			<div className="flex items-center gap-4 pl-2">
				<h3 className="font-mono text-xs md:text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
					{title}
				</h3>
				<div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
			</div>

			{/* Content */}
			<div className="space-y-1 mt-4">
				{visibleChildren}

				{/* Collapsed items with animation */}
				<AnimatePresence initial={false}>
					{collapsedChildren.length > 0 && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeInOut' }}
							className="overflow-hidden space-y-1"
						>
							{collapsedChildren}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Expand/Collapse Button (mobile only with >5 items) */}
			<AnimatePresence>
				{shouldCollapse && (
					<motion.button
						type="button"
						onClick={handleToggle}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className={cn(
							'mt-4 flex items-center gap-2 pl-2',
							'text-muted-foreground hover:text-foreground transition-colors',
							'font-mono text-xs',
						)}
					>
						<motion.span
							animate={{ rotate: isExpanded ? 180 : 0 }}
							transition={{ duration: 0.3, ease: 'easeInOut' }}
						>
							<ChevronDown className="size-4" />
						</motion.span>
						<span>
							{isExpanded
								? 'Show less'
								: `Showing ${COLLAPSE_THRESHOLD} of ${itemCount} • Tap to expand`}
						</span>
					</motion.button>
				)}
			</AnimatePresence>
		</div>
	)
}
