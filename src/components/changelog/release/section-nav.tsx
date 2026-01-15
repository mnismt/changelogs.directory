import { FileText } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeType } from '@/generated/prisma/client'
import { cn } from '@/lib/utils'

interface SectionNavProps {
	sections: Array<{ type: ChangeType; title: string; count: number }>
	activeSection: ChangeType | null
	visibleSections?: Set<ChangeType>
	onSectionClick: (type: ChangeType) => void
	hasSummary?: boolean
	onSummaryClick?: () => void
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

const SECTION_LABELS: Record<ChangeType, string> = {
	BREAKING: 'BREAKING',
	SECURITY: 'SECURITY',
	FEATURE: 'FEATURES',
	IMPROVEMENT: 'IMPROVE',
	PERFORMANCE: 'PERF',
	BUGFIX: 'BUGFIX',
	DEPRECATION: 'DEPREC',
	DOCUMENTATION: 'DOCS',
	OTHER: 'OTHER',
}

const SCROLL_THRESHOLD_MOBILE = 300
const SCROLL_THRESHOLD_DESKTOP = 100
const ITEM_HEIGHT = 32

export function SectionNav({
	sections,
	activeSection,
	visibleSections = new Set(),
	onSectionClick,
	hasSummary,
	onSummaryClick,
}: SectionNavProps) {
	const [isVisibleMobile, setIsVisibleMobile] = useState(false)
	const [isVisibleDesktop, setIsVisibleDesktop] = useState(false)
	const [isHovered, setIsHovered] = useState(false)
	const [isScrolling, setIsScrolling] = useState(false)

	useEffect(() => {
		let scrollTimeout: ReturnType<typeof setTimeout>

		const handleScroll = () => {
			setIsVisibleMobile(window.scrollY > SCROLL_THRESHOLD_MOBILE)
			setIsVisibleDesktop(window.scrollY > SCROLL_THRESHOLD_DESKTOP)

			// Brighten immediately when scrolling
			setIsScrolling(true)

			// Dim after user stops scrolling
			clearTimeout(scrollTimeout)
			scrollTimeout = setTimeout(() => {
				setIsScrolling(false)
			}, 150)
		}

		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => {
			window.removeEventListener('scroll', handleScroll)
			clearTimeout(scrollTimeout)
		}
	}, [])

	const bracketStyle = useMemo(() => {
		if (visibleSections.size === 0) return null
		const visibleIndices = sections
			.map((section, index) => ({ type: section.type, index }))
			.filter(({ type }) => visibleSections.has(type))
			.map(({ index }) => index)
		if (visibleIndices.length === 0) return null
		const firstIndex = Math.min(...visibleIndices)
		const lastIndex = Math.max(...visibleIndices)
		const top = firstIndex * ITEM_HEIGHT + 8
		const height = (lastIndex - firstIndex + 1) * ITEM_HEIGHT
		return { top, height }
	}, [sections, visibleSections])

	if (sections.length <= 1) {
		return null
	}

	return (
		<>
			{/* Mobile: Floating terminal bar at top */}
			<motion.nav
				data-testid="section-nav-mobile"
				initial={{ y: -40, opacity: 0, filter: 'blur(8px)', scale: 0.95 }}
				animate={{
					y: isVisibleMobile ? 0 : -40,
					opacity: isVisibleMobile ? 1 : 0,
					filter: isVisibleMobile ? 'blur(0px)' : 'blur(8px)',
					scale: isVisibleMobile ? 1 : 0.95,
				}}
				transition={{
					type: 'spring',
					stiffness: 260,
					damping: 25,
				}}
				className="fixed top-[4.5rem] left-0 right-0 z-40 md:hidden"
			>
				<div className="mx-3 flex items-center gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-black/90 px-3 py-2 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl scrollbar-hide">
					{/* Terminal prefix indicator */}
					<span className="shrink-0 font-mono text-xs text-white/60 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
						$_
					</span>
					<div className="h-4 w-px shrink-0 bg-white/10" />

					{/* Summary Button */}
					{hasSummary && (
						<>
							<motion.button
								type="button"
								onClick={onSummaryClick}
								className="relative shrink-0 flex items-center gap-2 rounded-full px-2.5 py-1 transition-[colors,transform] duration-100 active:scale-95 text-cyan-400/80 hover:text-cyan-400"
							>
								<FileText className="size-3.5" />
								<span className="font-mono text-[10px] uppercase tracking-wider font-bold">
									README.md
								</span>
							</motion.button>
							<div className="h-4 w-px shrink-0 bg-white/10" />
						</>
					)}

					{sections.map((section) => {
						const isActive = activeSection === section.type
						const isInView = visibleSections.has(section.type)
						const isBreaking = section.type === 'BREAKING'
						return (
							<motion.button
								key={section.type}
								type="button"
								data-active={isActive ? 'true' : 'false'}
								onClick={() => onSectionClick(section.type)}
								className="relative shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 transition-[colors,transform] duration-100 active:scale-95"
							>
								{isActive && (
									<motion.div
										layoutId="section-nav-active-mobile"
										className={cn(
											'absolute inset-0 rounded-full',
											isBreaking
												? 'bg-amber-500/15 ring-1 ring-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.12)]'
												: 'bg-white/15 ring-1 ring-white/20 shadow-[0_0_10px_rgba(255,255,255,0.08)]',
										)}
										transition={{
											type: 'spring',
											stiffness: 300,
											damping: 30,
										}}
									/>
								)}
								{!isActive && isInView && (
									<div
										className="absolute inset-0 rounded-full bg-white/[0.03] ring-1 ring-white/10"
										style={{ animation: 'pulse 3s ease-in-out infinite' }}
									/>
								)}
								<span
									className={cn(
										'relative text-sm transition-all duration-200',
										isActive &&
											(isBreaking
												? 'drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]'
												: 'drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]'),
									)}
								>
									{SECTION_ICONS[section.type]}
								</span>
								<span
									className={cn(
										'relative font-mono text-[10px] uppercase tracking-wider',
										isActive
											? isBreaking
												? 'text-amber-200'
												: 'text-foreground'
											: isInView
												? 'text-foreground/70'
												: 'text-muted-foreground',
									)}
								>
									{section.count}
								</span>
								{/* Active dot indicator */}
								{isActive && (
									<span
										className={cn(
											'absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
											isBreaking
												? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
												: 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]',
										)}
									/>
								)}
							</motion.button>
						)
					})}
				</div>
			</motion.nav>

			{/* Desktop: Sidebar TOC on left with viewport bracket */}
			<motion.nav
				data-testid="section-nav"
				data-visible={isVisibleDesktop ? 'true' : 'false'}
				initial={{ x: -20, opacity: 0 }}
				animate={{
					x: isVisibleDesktop ? 0 : -20,
					opacity: isVisibleDesktop ? (isHovered || isScrolling ? 1 : 0.3) : 0,
				}}
				transition={{
					type: 'spring',
					stiffness: 300,
					damping: 30,
					opacity: { duration: isScrolling || isHovered ? 0.1 : 0.4 },
				}}
				className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 md:block xl:left-8"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className="relative rounded-xl border border-white/10 bg-black/80 px-2 py-2 shadow-2xl backdrop-blur-xl">
					{/* Viewport bracket indicator */}
					{bracketStyle && (
						<motion.div
							className="absolute left-0 w-0.5 rounded-full bg-white/40"
							initial={false}
							animate={{
								top: bracketStyle.top,
								height: bracketStyle.height,
							}}
							transition={{
								type: 'spring',
								stiffness: 300,
								damping: 30,
							}}
						/>
					)}

					<div className="flex flex-col gap-0.5">
						{sections.map((section) => {
							const isActive = activeSection === section.type
							const isInView = visibleSections.has(section.type)
							const isBreaking = section.type === 'BREAKING'
							return (
								<motion.button
									key={section.type}
									type="button"
									data-active={isActive ? 'true' : 'false'}
									onClick={() => onSectionClick(section.type)}
									className={cn(
										'relative flex h-8 items-center gap-2 rounded-lg px-2 transition-[colors,transform] duration-100 active:scale-95',
										isActive
											? isBreaking
												? 'text-amber-200'
												: 'text-foreground'
											: isInView
												? 'text-foreground/70'
												: 'text-muted-foreground hover:text-foreground/50',
									)}
								>
									{isActive && (
										<motion.div
											layoutId="section-nav-active-desktop"
											className={cn(
												'absolute inset-0 rounded-lg',
												isBreaking
													? 'bg-amber-500/15 ring-1 ring-amber-500/30'
													: 'bg-white/10 ring-1 ring-white/20',
											)}
											transition={{
												type: 'spring',
												stiffness: 300,
												damping: 30,
											}}
										/>
									)}
									<span className="relative text-sm">
										{SECTION_ICONS[section.type]}
									</span>
									<span className="relative font-mono text-[10px] uppercase tracking-wider">
										{section.count}
									</span>
									{/* Label - shown on hover or always on XL+ */}
									<motion.span
										initial={false}
										animate={{
											width: isHovered ? 'auto' : 0,
											opacity: isHovered ? 1 : 0,
										}}
										className="relative overflow-hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-wider xl:!w-auto xl:!opacity-100"
									>
										{SECTION_LABELS[section.type]}
									</motion.span>
								</motion.button>
							)
						})}
					</div>
				</div>
			</motion.nav>
		</>
	)
}
