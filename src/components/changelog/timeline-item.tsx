import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

interface TimelineItemProps {
	version: string
	releaseDate?: Date | null
	summary?: string | null
	tags: string[]
	changeCount: number
	isLast?: boolean
	isLeft?: boolean
}

export function TimelineItem({
	version,
	releaseDate,
	summary,
	tags,
	changeCount,
	isLast = false,
	isLeft = true,
}: TimelineItemProps) {
	const formattedDate = releaseDate
		? new Date(releaseDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: 'Date unknown'

	const ariaLabel = `Version ${version}${releaseDate ? ` released on ${formattedDate}` : ''}`

	// Determine dot style based on tags
	const hasBreakingOrSecurity = tags.some(
		(tag) => tag === 'breaking' || tag === 'security',
	)
	const hasDeprecation = tags.some((tag) => tag === 'deprecation')

	const dotColor = hasBreakingOrSecurity
		? 'bg-red-500'
		: hasDeprecation
			? 'bg-yellow-500'
			: 'bg-foreground'

	return (
		<div
			className={`relative grid gap-6 pb-8 ${
				isLeft ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]'
			}`}
		>
			{/* Left content (or empty space) */}
			{isLeft ? (
				<Link
					to="/tools/claude-code/releases/$version"
					params={{ version }}
					className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label={ariaLabel}
				>
					<Card className="border-border bg-card transition-colors hover:border-accent">
						<CardHeader>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
								<div className="space-y-1">
									<CardTitle className="font-mono text-xl">{version}</CardTitle>
									<CardDescription className="text-muted-foreground">
										{formattedDate}
									</CardDescription>
								</div>
								{tags.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{tags.map((tag) => (
											<Badge
												key={tag}
												variant={
													tag === 'breaking' || tag === 'security'
														? 'destructive'
														: 'outline'
												}
												className="font-mono text-xs uppercase"
											>
												{tag}
											</Badge>
										))}
									</div>
								)}
							</div>
						</CardHeader>
						{summary && (
							<CardContent>
								<p className="line-clamp-2 text-sm text-muted-foreground">
									{summary}
								</p>
								<p className="mt-2 text-xs text-muted-foreground">
									{changeCount} {changeCount === 1 ? 'change' : 'changes'}
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
					to="/tools/claude-code/releases/$version"
					params={{ version }}
					className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label={ariaLabel}
				>
					<Card className="border-border bg-card transition-colors hover:border-accent">
						<CardHeader>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
								<div className="space-y-1">
									<CardTitle className="font-mono text-xl">{version}</CardTitle>
									<CardDescription className="text-muted-foreground">
										{formattedDate}
									</CardDescription>
								</div>
								{tags.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{tags.map((tag) => (
											<Badge
												key={tag}
												variant={
													tag === 'breaking' || tag === 'security'
														? 'destructive'
														: 'outline'
												}
												className="font-mono text-xs uppercase"
											>
												{tag}
											</Badge>
										))}
									</div>
								)}
							</div>
						</CardHeader>
						{summary && (
							<CardContent>
								<p className="line-clamp-2 text-sm text-muted-foreground">
									{summary}
								</p>
								<p className="mt-2 text-xs text-muted-foreground">
									{changeCount} {changeCount === 1 ? 'change' : 'changes'}
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
