import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { ChangeType } from '@/generated/prisma/client'

interface SectionNavProps {
	sections: Array<{ type: ChangeType; title: string; count: number }>
	activeSection: ChangeType | null
	visibleSections?: Set<ChangeType>
	onSectionClick: (type: ChangeType) => void
}

const SECTION_ICONS: Record<ChangeType, string> = {
	BREAKING: '⚠',
	SECURITY: '🔒',
	FEATURE: '✨',
	IMPROVEMENT: '🚀',
	PERFORMANCE: '⚡',
	BUGFIX: '🐛',
	DEPRECATION: '🌅',
	DOCUMENTATION: '📚',
	OTHER: '📦',
}

// TODO: Enable in v0.5.2+ for desktop sidebar
// const SECTION_LABELS: Record<ChangeType, string> = {
// 	BREAKING: 'BREAKING',
// 	SECURITY: 'SECURITY',
// 	FEATURE: 'FEATURES',
// 	IMPROVEMENT: 'IMPROVE',
// 	PERFORMANCE: 'PERF',
// 	BUGFIX: 'BUGFIX',
// 	DEPRECATION: 'DEPREC',
// 	DOCUMENTATION: 'DOCS',
// 	OTHER: 'OTHER',
// }

const SCROLL_THRESHOLD_MOBILE = 300
// TODO: Enable in v0.5.2+ for desktop sidebar
// const SCROLL_THRESHOLD_DESKTOP = 100
// const ITEM_HEIGHT = 32

export function SectionNav({
	sections,
	activeSection,
	visibleSections = new Set(),
	onSectionClick,
}: SectionNavProps) {
	const [isVisibleMobile, setIsVisibleMobile] = useState(false)
	// TODO: Enable in v0.5.2+ for desktop sidebar
	// const [isVisibleDesktop, setIsVisibleDesktop] = useState(false)
	// const [isHovered, setIsHovered] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setIsVisibleMobile(window.scrollY > SCROLL_THRESHOLD_MOBILE)
			// TODO: Enable in v0.5.2+ for desktop sidebar
			// setIsVisibleDesktop(window.scrollY > SCROLL_THRESHOLD_DESKTOP)
		}

		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// TODO: Enable in v0.5.2+ for desktop sidebar viewport bracket
	// const bracketStyle = useMemo(() => {
	// 	if (visibleSections.size === 0) return null
	// 	const visibleIndices = sections
	// 		.map((section, index) => ({ type: section.type, index }))
	// 		.filter(({ type }) => visibleSections.has(type))
	// 		.map(({ index }) => index)
	// 	if (visibleIndices.length === 0) return null
	// 	const firstIndex = Math.min(...visibleIndices)
	// 	const lastIndex = Math.max(...visibleIndices)
	// 	const top = firstIndex * ITEM_HEIGHT + 8
	// 	const height = (lastIndex - firstIndex + 1) * ITEM_HEIGHT
	// 	return { top, height }
	// }, [sections, visibleSections])

	if (sections.length <= 1) {
		return null
	}

	return (
		<>
			{/* Mobile: Horizontal bar at top */}
			<motion.nav
				initial={{ y: -60, opacity: 0 }}
				animate={{
					y: isVisibleMobile ? 0 : -60,
					opacity: isVisibleMobile ? 1 : 0,
				}}
				transition={{
					type: 'spring',
					stiffness: 300,
					damping: 30,
				}}
				className="fixed top-14 left-0 right-0 z-40 md:hidden"
			>
				<div className="mx-3 flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/80 px-2 py-1.5 backdrop-blur-xl scrollbar-hide">
					{sections.map((section) => {
						const isActive = activeSection === section.type
						const isInView = visibleSections.has(section.type)
						return (
							<motion.button
								key={section.type}
								type="button"
								onClick={() => onSectionClick(section.type)}
								whileTap={{ scale: 0.95 }}
								className="relative shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors"
							>
								{isActive && (
									<motion.div
										layoutId="section-nav-active-mobile"
										className="absolute inset-0 rounded-full bg-white/15"
										transition={{
											type: 'spring',
											stiffness: 300,
											damping: 30,
										}}
									/>
								)}
								{!isActive && isInView && (
									<div className="absolute inset-0 rounded-full bg-white/5" />
								)}
								<span className="relative text-xs">
									{SECTION_ICONS[section.type]}
								</span>
								<span
									className={`relative font-mono text-[10px] uppercase tracking-wider ${
										isActive
											? 'text-foreground'
											: isInView
												? 'text-foreground/70'
												: 'text-muted-foreground'
									}`}
								>
									{section.count}
								</span>
							</motion.button>
						)
					})}
				</div>
			</motion.nav>

			{/* TODO: Enable desktop sidebar in v0.5.2+
			Desktop: Sidebar TOC on left with viewport bracket
			Compact by default, expands on hover to show labels
			See git history for full implementation */}
		</>
	)
}
