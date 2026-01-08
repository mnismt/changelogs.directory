import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { ChangeType } from '@/generated/prisma/client'

interface SectionNavProps {
	sections: Array<{ type: ChangeType; title: string; count: number }>
	activeSection: ChangeType | null
	onSectionClick: (type: ChangeType) => void
}

const SECTION_ICONS: Record<ChangeType, string> = {
	BREAKING: '⚠',
	SECURITY: '🔒',
	FEATURE: '✨',
	IMPROVEMENT: '🚀',
	PERFORMANCE: '⚡',
	BUGFIX: '🐛',
	DEPRECATION: '⚠',
	DOCUMENTATION: '📚',
	OTHER: '📦',
}

const SCROLL_THRESHOLD = 300

export function SectionNav({
	sections,
	activeSection,
	onSectionClick,
}: SectionNavProps) {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setIsVisible(window.scrollY > SCROLL_THRESHOLD)
		}

		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	if (sections.length <= 1) {
		return null
	}

	return (
		<motion.nav
			initial={{ y: -60, opacity: 0 }}
			animate={{
				y: isVisible ? 0 : -60,
				opacity: isVisible ? 1 : 0,
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
									layoutId="section-nav-active"
									className="absolute inset-0 rounded-full bg-white/10"
									transition={{
										type: 'spring',
										stiffness: 300,
										damping: 30,
									}}
								/>
							)}
							<span className="relative text-xs">
								{SECTION_ICONS[section.type]}
							</span>
							<span
								className={`relative font-mono text-[10px] uppercase tracking-wider ${
									isActive ? 'text-foreground' : 'text-muted-foreground'
								}`}
							>
								{section.count}
							</span>
						</motion.button>
					)
				})}
			</div>
		</motion.nav>
	)
}
