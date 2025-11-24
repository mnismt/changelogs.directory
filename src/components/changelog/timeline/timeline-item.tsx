import { Link } from '@tanstack/react-router'
import { ChangeCount } from '@/components/changelog/release/change-count'
import { ReleaseCardBase } from '@/components/changelog/release/release-card'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { formatDate } from '@/lib/date-utils'

interface TimelineItemProps {
	id: string
	toolSlug: string
	version: string
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
		? 'bg-red-500'
		: hasDeprecation
			? 'bg-yellow-500'
			: 'bg-foreground'

	const cardFooter = headline ? (
		<p className="mt-2 text-xs opacity-70 transition-opacity duration-700 ease-out group-hover:opacity-100">
			<ChangeCount changeCount={changeCount} changesByType={changesByType} />
		</p>
	) : null

	const renderCard = () => (
		<ReleaseCardBase
			toolSlug={toolSlug}
			version={version}
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
			className={`relative grid gap-6 pb-8 transition-all duration-600 ease-out ${
				isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
			} ${isLeft ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]'} ${
				isBlurred ? 'blur-[2px] opacity-40' : ''
			}`}
			style={{ transitionDelay: staggerDelay }}
		>
			{/* Left content (or empty space) */}
			{isLeft ? (
				<Link
					to="/tools/$slug/releases/$version"
					params={{ slug: toolSlug, version }}
					className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label={ariaLabel}
					onMouseEnter={() => onHover?.(id)}
					onMouseLeave={() => onHover?.(null)}
				>
					{renderCard()}
				</Link>
			) : (
				<div />
			)}

			{/* Timeline marker - centered */}
			<div className="relative flex flex-col items-center">
				{/* Marker dot with animation for important releases */}
				<div className="relative mt-2 flex h-3 w-3 items-center justify-center">
					{/* Ping animation layer (only for breaking/security) */}
					{hasBreakingOrSecurity && (
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
					)}
					{/* Solid dot */}
					<span
						className={`relative inline-flex h-3 w-3 rounded-full ${dotColor}`}
					/>
				</div>
			</div>

			{/* Right content (or empty space) */}
			{!isLeft ? (
				<Link
					to="/tools/$slug/releases/$version"
					params={{ slug: toolSlug, version }}
					className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label={ariaLabel}
					onMouseEnter={() => onHover?.(id)}
					onMouseLeave={() => onHover?.(null)}
				>
					{renderCard()}
				</Link>
			) : (
				<div />
			)}
		</div>
	)
}
