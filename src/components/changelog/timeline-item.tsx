import { Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { formatDate } from '@/lib/date-utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'
import { ChangeCount } from './change-count'

interface TimelineItemProps {
	toolSlug: string
	version: string
	releaseDate?: Date | string | null
	summary?: string | null
	changeCount: number
	changesByType?: Record<string, number>
	isLast?: boolean
	isLeft?: boolean
	sequenceIndex?: number
}

export function TimelineItem({
	toolSlug,
	version,
	releaseDate,
	summary,
	changeCount,
	changesByType,
	isLast = false,
	isLeft = true,
	sequenceIndex = 0,
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

	return (
		<div
			ref={ref}
			className={`relative grid gap-6 pb-8 transition-all duration-600 ease-out ${
				isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
			} ${isLeft ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]'}`}
			style={{ transitionDelay: staggerDelay }}
		>
			{/* Left content (or empty space) */}
			{isLeft ? (
				<Link
					to="/tools/$slug/releases/$version"
					params={{ slug: toolSlug, version }}
					className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label={ariaLabel}
				>
					<Card className="group border-border bg-card transition-all duration-700 ease-out hover:border-foreground/20 hover:bg-card/80">
						<CardHeader>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
								<div className="space-y-1">
									<CardTitle className="flex items-center font-mono text-xl">
										<Package className="size-5" />
										<span className="ml-2">
											{formatVersionForDisplay(version, toolSlug)}
										</span>
									</CardTitle>
									<CardDescription className="text-muted-foreground">
										{formattedDate}
									</CardDescription>
								</div>
								{(changesByType?.BREAKING || changesByType?.SECURITY) && (
									<div className="flex flex-wrap gap-1">
										{changesByType?.BREAKING && (
											<Badge
												variant="destructive"
												className="font-mono text-xs uppercase"
											>
												Breaking
											</Badge>
										)}
										{changesByType?.SECURITY && (
											<Badge
												variant="destructive"
												className="font-mono text-xs uppercase"
											>
												Security
											</Badge>
										)}
									</div>
								)}
							</div>
						</CardHeader>
						{summary && (
							<CardContent>
								<p className="line-clamp-2 text-sm text-muted-foreground">
									{summary}
								</p>
								<p className="mt-2 text-xs opacity-70 transition-opacity duration-700 ease-out group-hover:opacity-100">
									<ChangeCount
										changeCount={changeCount}
										changesByType={changesByType}
									/>
								</p>
							</CardContent>
						)}
					</Card>
				</Link>
			) : (
				<div />
			)}

			{/* Timeline marker and line - centered */}
			<div className="relative flex flex-col items-center">
				{/* Connector line */}
				{!isLast && <div className="absolute top-4 h-full w-0.5 bg-border" />}
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
				>
					<Card className="group border-border bg-card transition-all duration-700 ease-out hover:border-foreground/20 hover:bg-card/80">
						<CardHeader>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
								<div className="space-y-1">
									<CardTitle className="flex items-center font-mono text-xl">
										<Package className="size-5" />
										<span className="ml-2">
											{formatVersionForDisplay(version, toolSlug)}
										</span>
									</CardTitle>
									<CardDescription className="text-muted-foreground">
										{formattedDate}
									</CardDescription>
								</div>
								{(changesByType?.BREAKING || changesByType?.SECURITY) && (
									<div className="flex flex-wrap gap-1">
										{changesByType?.BREAKING && (
											<Badge
												variant="destructive"
												className="font-mono text-xs uppercase"
											>
												Breaking
											</Badge>
										)}
										{changesByType?.SECURITY && (
											<Badge
												variant="destructive"
												className="font-mono text-xs uppercase"
											>
												Security
											</Badge>
										)}
									</div>
								)}
							</div>
						</CardHeader>
						{summary && (
							<CardContent>
								<p className="line-clamp-2 text-sm text-muted-foreground">
									{summary}
								</p>
								<p className="mt-2 text-xs opacity-70 transition-opacity duration-700 ease-out group-hover:opacity-100">
									<ChangeCount
										changeCount={changeCount}
										changesByType={changesByType}
									/>
								</p>
							</CardContent>
						)}
					</Card>
				</Link>
			) : (
				<div />
			)}
		</div>
	)
}
