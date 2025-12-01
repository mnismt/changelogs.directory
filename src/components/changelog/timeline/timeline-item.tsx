import { Link } from '@tanstack/react-router'
import { ChangeCount } from '@/components/changelog/release/change-count'
import { ReleaseCardBase } from '@/components/changelog/release/release-card'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface TimelineItemProps {
	id: string
	toolSlug: string
	version: string
	formattedVersion?: string
	releaseDate?: Date | string | null
	headline?: string | null
	changeCount: number
	changesByType?: Record<string, number>
	isLeft?: boolean
	sequenceIndex?: number
	isBlurred?: boolean
	onHover?: (id: string | null) => void
}

export function TimelineItem({
	id,
	toolSlug,
	version,
	formattedVersion,
	releaseDate,
	headline,
	changeCount,
	changesByType,
	isLeft = true,
	sequenceIndex = 0,
	isBlurred = false,
	onHover,
}: TimelineItemProps) {
	const formattedDate = formatDate(releaseDate)
	const { ref, isVisible } = useScrollReveal({
		threshold: 0.2,
		rootMargin: '-50px',
	})
	const staggerDelay = `${Math.min(sequenceIndex, 12) * 35}ms`

	const ariaLabel = `Version ${version}${releaseDate ? ` released on ${formattedDate}` : ''}`

	// Determine dot style based on changesByType
	const hasBreakingOrSecurity =
		changesByType?.BREAKING || changesByType?.SECURITY
	const hasDeprecation = changesByType?.DEPRECATION

	const dotColor = hasBreakingOrSecurity
		? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
		: hasDeprecation
			? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
			: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'

	const cardFooter = headline ? (
		<p className="mt-2 text-xs opacity-70 transition-opacity duration-700 ease-out group-hover:opacity-100">
			<ChangeCount changeCount={changeCount} changesByType={changesByType} />
		</p>
	) : null

	const renderCard = () => (
		<ReleaseCardBase
			toolSlug={toolSlug}
			version={version}
			formattedVersion={formattedVersion}
			releaseDate={releaseDate}
			headline={headline}
			changesByType={changesByType}
			summaryLineClamp={2}
			bodyFooter={cardFooter}
		/>
	)

	return (
		<div
			ref={ref}
			className={cn(
				'relative grid gap-6 pb-12 transition-all duration-700 ease-out group/timeline-item',
				isVisible
					? 'translate-y-0 opacity-100 translate-x-0'
					: `translate-y-6 opacity-0 ${isLeft ? 'translate-x-8' : '-translate-x-8'}`,
				isLeft ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]',
				isBlurred && 'blur-[2px] opacity-40',
			)}
			style={{ transitionDelay: staggerDelay }}
		>
			{/* Left content (or empty space) */}
			{isLeft ? (
				<div className="relative">
					<div className="absolute top-6 -right-6 h-px w-6 bg-white/10 transition-colors duration-500 group-hover/timeline-item:bg-white/30" />
					<Link
						to="/tools/$slug/releases/$version"
						params={{ slug: toolSlug, version }}
						className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
						aria-label={ariaLabel}
						onMouseEnter={() => onHover?.(id)}
						onMouseLeave={() => onHover?.(null)}
					>
						{renderCard()}
					</Link>
				</div>
			) : (
				<div />
			)}

			{/* Timeline marker - centered */}
			<div className="relative flex flex-col items-center">
				{/* Marker dot with animation for important releases */}
				<div className="relative mt-6 flex h-3 w-3 items-center justify-center">
					{/* Ping animation layer (only for breaking/security) */}
					{hasBreakingOrSecurity && (
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
					)}
					{/* Solid dot */}
					<span
						className={`relative inline-flex h-2 w-2 rounded-full ${dotColor} ring-4 ring-black`}
					/>
				</div>
			</div>

			{/* Right content (or empty space) */}
			{!isLeft ? (
				<div className="relative">
					<div className="absolute top-6 -left-6 h-px w-6 bg-white/10 transition-colors duration-500 group-hover/timeline-item:bg-white/30" />
					<Link
						to="/tools/$slug/releases/$version"
						params={{ slug: toolSlug, version }}
						className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
						aria-label={ariaLabel}
						onMouseEnter={() => onHover?.(id)}
						onMouseLeave={() => onHover?.(null)}
					>
						{renderCard()}
					</Link>
				</div>
			) : (
				<div />
			)}
		</div>
	)
}
