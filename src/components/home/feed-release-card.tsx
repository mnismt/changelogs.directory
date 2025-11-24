import { Link } from '@tanstack/react-router'
import { ArrowRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatRelativeDate } from '@/lib/date-utils'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'

interface FeedReleaseCardProps {
	toolSlug: string
	toolName: string
	vendor: string | null
	version: string
	releaseDate: Date | string | null
	headline: string | null
	changeCount: number
	changesByType: Record<string, number>
	hasBreaking: boolean
	hasSecurity: boolean
	hasDeprecation: boolean
	className?: string
	isThisCardHovered?: boolean
	isSameToolHovered?: boolean
	isDimmed?: boolean
	onHoverStart?: () => void
	onHoverEnd?: () => void
}

export function FeedReleaseCard({
	toolSlug,
	toolName,
	vendor,
	version,
	releaseDate,
	headline,
	changeCount,
	changesByType,
	hasBreaking,
	hasSecurity,
	hasDeprecation,
	className,
	isThisCardHovered = false,
	isSameToolHovered = false,
	isDimmed = false,
	onHoverStart,
	onHoverEnd,
}: FeedReleaseCardProps) {
	const logo = getToolLogo(toolSlug)

	// Calculate total feature/bugfix/improvement counts for tooltip
	const featureCount = changesByType.FEATURE || 0
	const bugfixCount = changesByType.BUGFIX || 0
	const improvementCount = changesByType.IMPROVEMENT || 0

	return (
		<Card
			className={cn(
				'group relative overflow-hidden border-border bg-card transition-all duration-300 ease-out',
				isThisCardHovered && 'border-foreground/30',
				isDimmed && 'opacity-50',
				className,
			)}
			onMouseEnter={onHoverStart}
			onMouseLeave={onHoverEnd}
		>
			{/* macOS-like window controls */}
			<div className="flex items-center gap-2 border-b border-border/40 bg-secondary/50 px-4">
				<div className="flex items-center gap-1.5">
					<span
						className={cn(
							'h-2 w-2 rounded-full transition-colors duration-300',
							isSameToolHovered ? 'bg-[#ff5f56]' : 'bg-muted-foreground/30',
						)}
						aria-hidden
					/>
					<span
						className={cn(
							'h-2 w-2 rounded-full transition-colors duration-300',
							isSameToolHovered ? 'bg-[#ffbd2e]' : 'bg-muted-foreground/30',
						)}
						aria-hidden
					/>
					<span
						className={cn(
							'h-2 w-2 rounded-full transition-colors duration-300',
							isSameToolHovered ? 'bg-[#27c93f]' : 'bg-muted-foreground/30',
						)}
						aria-hidden
					/>
				</div>
			</div>

			<div className="p-5">
				<Link
					to="/tools/$slug/releases/$version"
					params={{ slug: toolSlug, version }}
					className="block"
				>
					{/* Tool header with logo */}
					<div className="mb-3 flex items-center gap-3">
						<div className="shrink-0">
							{logo ? (
								<div
									className={cn(
										'flex size-10 items-center justify-center rounded p-2 [&>svg]:h-full [&>svg]:w-full [&>svg]:transition-all duration-700 [&>svg_path]:transition-all [&>svg_path]:duration-300 [&>svg_circle]:transition-all [&>svg_circle]:duration-300',
										// Keep monochrome fill for monochrome logos or when not hovered
										(isMonochromeLogo(toolSlug) || !isSameToolHovered) &&
											'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
										getLogoHoverClasses(toolSlug),
									)}
								>
									{logo}
								</div>
							) : (
								<div className="flex size-10 items-center justify-center rounded">
									<Package className="h-5 w-5 text-muted-foreground" />
								</div>
							)}
						</div>

						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<h3 className="truncate font-mono text-sm font-semibold">
									{toolName}
								</h3>
								{vendor && (
									<Badge
										variant="outline"
										className="shrink-0 border-border bg-secondary font-mono text-[10px] uppercase"
									>
										{vendor}
									</Badge>
								)}
							</div>
						</div>
					</div>

					{/* Version and badges */}
					<div className="mb-2 flex flex-wrap items-center gap-2">
						<code className="rounded px-2 py-1 font-mono text-sm font-medium">
							{formatVersionForDisplay(version, toolSlug)}
						</code>

						{hasBreaking && (
							<Badge
								variant="destructive"
								className="font-mono text-[10px] uppercase"
							>
								Breaking
							</Badge>
						)}

						{hasSecurity && (
							<Badge
								variant="destructive"
								className="font-mono text-[10px] uppercase"
							>
								Security
							</Badge>
						)}

						{hasDeprecation && (
							<Badge
								variant="outline"
								className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500 font-mono text-[10px] uppercase"
							>
								Deprecation
							</Badge>
						)}
					</div>

					{/* Release date */}
					<div className="mb-2 text-xs text-muted-foreground">
						{releaseDate && (
							<time dateTime={releaseDate.toString()}>
								{formatDate(releaseDate)}
							</time>
						)}
						<span className="mx-1">•</span>
						<span>{formatRelativeDate(releaseDate)}</span>
					</div>

					{/* Headline (truncated to 2 lines) */}
					{headline && (
						<p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
							{headline}
						</p>
					)}

					{/* Change count */}
					<div className="flex items-center gap-2 text-xs">
						<span className="font-mono font-semibold text-foreground">
							{changeCount}
						</span>
						<span className="text-muted-foreground">
							{changeCount === 1 ? 'change' : 'changes'}
						</span>

						{(featureCount > 0 || bugfixCount > 0 || improvementCount > 0) && (
							<>
								<span className="text-muted-foreground/50">•</span>
								<div className="flex items-center gap-2 text-muted-foreground">
									{featureCount > 0 && (
										<span>
											<span className="font-mono">{featureCount}</span> feature
											{featureCount !== 1 ? 's' : ''}
										</span>
									)}
									{bugfixCount > 0 && (
										<span>
											<span className="font-mono">{bugfixCount}</span> fix
											{bugfixCount !== 1 ? 'es' : ''}
										</span>
									)}
									{improvementCount > 0 && (
										<span>
											<span className="font-mono">{improvementCount}</span>{' '}
											improvement{improvementCount !== 1 ? 's' : ''}
										</span>
									)}
								</div>
							</>
						)}
					</div>
				</Link>

				{/* Secondary link to tool page */}
				<div className="mt-3 border-t border-border/50 pt-3">
					<Link
						to="/tools/$slug"
						params={{ slug: toolSlug }}
						className="group/release inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors duration-700 ease-out hover:text-foreground group-hover:text-foreground/50"
					>
						View all {toolName} releases
						<ArrowRight className="size-4 transition-transform duration-700 ease-out group-hover:translate-x-1 group-hover/release:rotate-180" />
					</Link>
				</div>
			</div>
		</Card>
	)
}
