import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ChangeType } from '@/generated/prisma/client'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface VersionListProps {
	toolSlug: string
	currentVersion: string
	versions: Array<{
		version: string
		formattedVersion?: string
		releaseDate: Date | null
		_count: { changes: number }
		changesByType?: Record<string, number>
	}>
	initialLimit?: number
}

const changeTypeLabels: Partial<Record<ChangeType, string>> = {
	BREAKING: '⚠️ Breaking',
	SECURITY: '🔒 Security',
	FEATURE: '✨ Features',
	IMPROVEMENT: '🚀 Improvements',
	PERFORMANCE: '⚡ Performance',
	BUGFIX: '🐛 Bug Fixes',
	DEPRECATION: '🌅 Deprecated',
	DOCUMENTATION: '📚 Docs',
	OTHER: '📦 Other',
}

const changeTypeOrder: ChangeType[] = [
	'BREAKING',
	'SECURITY',
	'FEATURE',
	'IMPROVEMENT',
	'PERFORMANCE',
	'BUGFIX',
	'DEPRECATION',
	'DOCUMENTATION',
	'OTHER',
]

export function VersionList({
	toolSlug,
	currentVersion,
	versions,
	initialLimit = 12,
}: VersionListProps) {
	const [showAll, setShowAll] = useState(false)
	const [pendingVersion, setPendingVersion] = useState<string | null>(null)
	const [isDesktop, setIsDesktop] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [direction, setDirection] = useState(0)

	const ITEMS_PER_PAGE = 15

	useEffect(() => {
		const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
		checkDesktop()
		window.addEventListener('resize', checkDesktop)
		return () => window.removeEventListener('resize', checkDesktop)
	}, [])

	// Reset pending state when the version actually changes
	useEffect(() => {
		setPendingVersion(null)
	}, [currentVersion])

	if (versions.length === 0) {
		return null
	}

	// Mobile Logic
	const mobileDisplayedVersions = showAll
		? versions
		: versions.slice(0, initialLimit)
	const remainingCount = versions.length - initialLimit

	// Desktop Logic
	const totalPages = Math.ceil(versions.length / ITEMS_PER_PAGE)
	const desktopDisplayedVersions = versions.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	)

	const handlePageChange = (newPage: number) => {
		setDirection(newPage > currentPage ? 1 : -1)
		setCurrentPage(newPage)
	}

	const renderChangeTypeTooltip = (changesByType?: Record<string, number>) => {
		if (!changesByType || Object.keys(changesByType).length === 0) {
			return null
		}

		const items = changeTypeOrder
			.filter((type) => changesByType[type] && changesByType[type] > 0)
			.map((type) => ({
				type,
				count: changesByType[type],
				label: changeTypeLabels[type],
			}))

		if (items.length === 0) {
			return null
		}

		return (
			<div className="space-y-1.5">
				{items.map((item) => (
					<div
						key={item.type}
						className="flex items-center justify-between gap-4 text-xs"
					>
						<span className="font-mono">{item.label}</span>
						<span className="font-mono font-semibold">{item.count}</span>
					</div>
				))}
			</div>
		)
	}

	const renderVersionCard = (version: (typeof versions)[0]) => {
		const isCurrent = version.version === currentVersion
		const isPending = version.version === pendingVersion
		const tooltipContent = renderChangeTypeTooltip(version.changesByType)
		const hasTooltip = tooltipContent !== null

		const content = (
			<div className="flex flex-col h-full justify-between gap-4">
				<div className="flex items-start justify-between gap-2">
					<div className="space-y-1.5">
						<div className="font-mono text-sm font-bold tracking-tight group-hover:text-foreground transition-colors">
							{version.formattedVersion || version.version}
						</div>
						<div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
							{formatDate(version.releaseDate, 'MMM d, yyyy')}
						</div>
					</div>
					{isCurrent && (
						<div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
					)}
					{isPending && !isCurrent && (
						<div className="size-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse" />
					)}
				</div>

				<div className="flex items-center justify-between pt-2 border-t border-white/5">
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-mono text-muted-foreground/70">
							CHANGES
						</span>
						<span className="text-xs font-mono text-foreground/80">
							{version._count.changes}
						</span>
					</div>
					<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
						<ArrowRight className="size-3 text-muted-foreground" />
					</div>
				</div>
			</div>
		)

		let cardClasses = `
			group block h-full p-4 rounded-sm border transition-all duration-300 w-full
		`

		if (isCurrent) {
			cardClasses +=
				' bg-white/[0.03] border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
		} else if (isPending) {
			cardClasses +=
				' bg-yellow-500/5 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
		} else {
			cardClasses +=
				' bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/[0.02] hover:-translate-y-0.5 hover:shadow-lg'
		}

		const cardElement = isCurrent ? (
			<div className={cardClasses}>{content}</div>
		) : (
			<Link
				to="/tools/$slug/releases/$version"
				params={{ slug: toolSlug, version: version.version }}
				className={cardClasses}
				onClick={() => setPendingVersion(version.version)}
			>
				{content}
			</Link>
		)

		if (!hasTooltip) {
			return cardElement
		}

		return (
			<Tooltip>
				<TooltipTrigger asChild>{cardElement}</TooltipTrigger>
				<TooltipContent
					side="top"
					align="end"
					sideOffset={8}
					className="max-w-xs border border-white/10 bg-black/90 backdrop-blur-xl p-3 text-foreground shadow-xl"
				>
					{tooltipContent}
				</TooltipContent>
			</Tooltip>
		)
	}

	// Animation Variants
	const containerVariants: Variants = {
		enter: (direction: number) => ({
			x: direction > 0 ? 50 : -50,
			opacity: 0,
			filter: 'blur(10px)',
		}),
		center: {
			x: 0,
			opacity: 1,
			filter: 'blur(0px)',
			transition: {
				duration: 0.4,
				ease: 'easeInOut',
				staggerChildren: 0.05,
			},
		},
		exit: (direction: number) => ({
			x: direction > 0 ? -50 : 50,
			opacity: 0,
			filter: 'blur(10px)',
			transition: {
				duration: 0.3,
				ease: 'easeIn',
			},
		}),
	}

	const itemVariants: Variants = {
		enter: { opacity: 0, y: 20, scale: 0.95 },
		center: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: { duration: 0.4, ease: 'easeOut' },
		},
		exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
	}

	return (
		<div className="mt-8 pt-8 border-t border-white/5">
			<div className="flex items-center gap-4 mb-8">
				<h2 className="font-mono text-lg font-bold uppercase tracking-wider text-muted-foreground">
					{'// Version_History'}
				</h2>
				<div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
				<Badge
					variant="outline"
					className="font-mono text-[10px] border-white/10 bg-white/5 text-muted-foreground"
				>
					TOTAL: {versions.length}
				</Badge>
			</div>

			{/* Mobile View: Horizontal Scroll */}
			{!isDesktop && (
				<>
					<div className="flex overflow-x-auto pb-4 gap-3 snap-x snap-mandatory scrollbar-hide">
						{mobileDisplayedVersions.map((version) => (
							<div key={version.version} className="min-w-[160px] snap-start">
								{renderVersionCard(version)}
							</div>
						))}
					</div>

					{!showAll && remainingCount > 0 && (
						<div className="mt-8 text-center">
							<Button
								variant="ghost"
								onClick={() => setShowAll(true)}
								className="font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/10"
							>
								{'>'} load_more_versions({remainingCount})
							</Button>
						</div>
					)}

					{showAll && versions.length > initialLimit && (
						<div className="mt-8 text-center">
							<Button
								variant="ghost"
								onClick={() => setShowAll(false)}
								className="font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/10"
							>
								{'>'} collapse_history()
							</Button>
						</div>
					)}
				</>
			)}

			{/* Desktop View: Grid with Pagination */}
			{isDesktop && (
				<>
					<div className="relative min-h-[400px]">
						<AnimatePresence mode="wait" custom={direction} initial={false}>
							<motion.div
								key={currentPage}
								custom={direction}
								variants={containerVariants}
								initial="enter"
								animate="center"
								exit="exit"
								className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
							>
								{desktopDisplayedVersions.map((version) => (
									<motion.div key={version.version} variants={itemVariants}>
										{renderVersionCard(version)}
									</motion.div>
								))}
							</motion.div>
						</AnimatePresence>
					</div>

					{totalPages > 1 && (
						<div className="mt-8 flex items-center justify-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
								className="font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
							>
								Prev
							</Button>

							<div className="flex items-center gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => {
										// Show first, last, current, and adjacent pages
										if (
											page === 1 ||
											page === totalPages ||
											(page >= currentPage - 1 && page <= currentPage + 1)
										) {
											const isActive = currentPage === page
											return (
												<div key={page} className="relative">
													{isActive && (
														<motion.div
															layoutId="active-page-indicator"
															className="absolute inset-0 bg-foreground rounded-md"
															transition={{
																type: 'spring',
																stiffness: 300,
																damping: 30,
															}}
														/>
													)}
													<button
														type="button"
														onClick={() => handlePageChange(page)}
														className={cn(
															'relative z-10 font-mono text-xs w-8 h-8 flex items-center justify-center rounded-md transition-colors',
															isActive
																? 'text-background font-bold'
																: 'text-muted-foreground hover:text-foreground hover:bg-white/5',
														)}
													>
														{page}
													</button>
												</div>
											)
										}
										if (page === currentPage - 2 || page === currentPage + 2) {
											return (
												<span
													key={page}
													className="text-muted-foreground/40 font-mono text-xs px-1"
												>
													...
												</span>
											)
										}
										return null
									},
								)}
							</div>

							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									handlePageChange(Math.min(totalPages, currentPage + 1))
								}
								disabled={currentPage === totalPages}
								className="font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	)
}
