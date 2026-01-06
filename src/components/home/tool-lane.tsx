import { Link } from '@tanstack/react-router'
import { ArrowRight, Package } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'
import { LaneNavigation } from './lane-navigation'
import { LaneReleaseCard } from './lane-release-card'
import { VelocityBadge } from './velocity-badge'

interface LaneRelease {
	id: string
	version: string
	formattedVersion?: string
	releaseDate: Date | string | null
	summary?: string | null
	headline?: string | null
	_count: { changes: number }
	hasBreaking?: boolean
	hasSecurity?: boolean
	hasDeprecation?: boolean
}

interface ToolLaneProps {
	tool: {
		slug: string
		name: string
		vendor: string | null
		totalReleases: number
		velocity: { today: number }
	}
	releases: LaneRelease[]
	hasMatchingReleases: boolean
	animationDelay?: number
}

export function ToolLane({
	tool,
	releases,
	hasMatchingReleases,
	animationDelay = 0,
}: ToolLaneProps) {
	const scrollContainerRef = useRef<HTMLUListElement>(null)
	const [isHovered, setIsHovered] = useState(false)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(true)

	const logo = getToolLogo(tool.slug)

	const updateScrollState = useCallback(() => {
		const container = scrollContainerRef.current
		if (!container) return

		const { scrollLeft, scrollWidth, clientWidth } = container
		setCanScrollLeft(scrollLeft > 0)
		setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
	}, [])

	const scroll = useCallback((direction: 'left' | 'right') => {
		const container = scrollContainerRef.current
		if (!container) return

		const cardWidth = 320 + 16 // w-80 + gap-4
		const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2

		container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
	}, [])

	const isAtEnd = !canScrollRight && releases.length > 4

	return (
		<section
			aria-label={`${tool.name} releases`}
			aria-roledescription="carousel"
			className="animate-in fade-in slide-in-from-bottom-2 duration-500"
			style={{ animationDelay: `${animationDelay}ms` }}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Lane Header */}
			<div className="mb-3 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3 min-w-0">
					{/* Tool Logo */}
					<div className="shrink-0">
						{logo ? (
							<div
								className={cn(
									'flex size-8 items-center justify-center rounded [&>svg]:h-full [&>svg]:w-full [&>svg]:transition-all duration-700 [&>svg_path]:transition-all [&>svg_path]:duration-300',
									(isMonochromeLogo(tool.slug) || !isHovered) &&
										'[&>svg]:fill-foreground [&>svg_path]:fill-foreground',
									isHovered &&
										getLogoHoverClasses(tool.slug).replace(/group-hover:/g, ''),
								)}
							>
								{logo}
							</div>
						) : (
							<div className="flex size-8 items-center justify-center rounded">
								<Package className="h-4 w-4 text-muted-foreground" />
							</div>
						)}
					</div>

					{/* Tool Name + Vendor */}
					<div className="flex items-center gap-2 min-w-0">
						<h3
							id={`lane-${tool.slug}-heading`}
							className="truncate font-mono text-sm font-semibold"
						>
							{tool.name}
						</h3>
						{tool.vendor && (
							<Badge
								variant="outline"
								className="shrink-0 border-border bg-secondary font-mono text-[10px] uppercase"
							>
								{tool.vendor}
							</Badge>
						)}
					</div>

					{/* Velocity Badge */}
					<VelocityBadge releasesToday={tool.velocity.today} />
				</div>

				{/* View All Link */}
				<Link
					to="/tools/$slug"
					params={{ slug: tool.slug }}
					className={cn(
						'group/link flex items-center gap-1 shrink-0 font-mono text-xs transition-colors',
						isAtEnd
							? 'text-foreground'
							: 'text-muted-foreground hover:text-foreground',
					)}
				>
					<span className="hidden sm:inline">View all</span>
					<ArrowRight
						className={cn(
							'size-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5',
							isAtEnd && 'translate-x-0.5',
						)}
					/>
				</Link>
			</div>

			{/* Lane Content */}
			<div className="relative">
				{/* Navigation Arrows (Desktop) */}
				<div className="hidden md:block">
					<LaneNavigation
						side="left"
						onClick={() => scroll('left')}
						disabled={!canScrollLeft}
						visible={isHovered && releases.length > 4}
					/>
					<LaneNavigation
						side="right"
						onClick={() => scroll('right')}
						disabled={!canScrollRight}
						visible={isHovered && releases.length > 4}
					/>
				</div>

				{/* Scroll Container */}
				{hasMatchingReleases ? (
					<ul
						ref={scrollContainerRef}
						aria-labelledby={`lane-${tool.slug}-heading`}
						className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory touch-pan-x list-none m-0 p-0"
						style={{
							scrollbarWidth: 'none',
							msOverflowStyle: 'none',
						}}
						onScroll={updateScrollState}
					>
						{releases.map((release, index) => (
							<li
								key={release.id}
								aria-label={`Release ${index + 1} of ${releases.length}: version ${release.version}`}
								className="snap-start h-auto flex"
							>
								<LaneReleaseCard
									toolSlug={tool.slug}
									version={release.version}
									formattedVersion={release.formattedVersion}
									releaseDate={release.releaseDate}
									summary={release.headline || release.summary}
									changeCount={release._count.changes}
									hasBreaking={release.hasBreaking}
									hasSecurity={release.hasSecurity}
									hasDeprecation={release.hasDeprecation}
									isLaneHovered={isHovered}
								/>
							</li>
						))}
					</ul>
				) : (
					<div className="flex h-24 items-center justify-center rounded border border-dashed border-border/40 bg-card/20">
						<p className="font-mono text-sm text-muted-foreground">
							No releases matching current filters
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
