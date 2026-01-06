import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { formatRelativeDate } from '@/lib/date-utils'
import { getToolLogo, isMonochromeLogo } from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface LaneReleaseCardProps {
	toolSlug: string
	version: string
	formattedVersion?: string
	releaseDate: Date | string | null
	summary?: string | null
	changeCount: number
	hasBreaking?: boolean
	hasSecurity?: boolean
	hasDeprecation?: boolean
	isLaneHovered?: boolean
	className?: string
}

export function LaneReleaseCard({
	toolSlug,
	version,
	formattedVersion,
	releaseDate,
	summary,
	changeCount,
	hasBreaking = false,
	hasSecurity = false,
	hasDeprecation = false,
	isLaneHovered = false,
	className,
}: LaneReleaseCardProps) {
	const logo = getToolLogo(toolSlug)

	return (
		<Card
			className={cn(
				'group/card flex flex-col flex-shrink-0 w-64 sm:w-72 lg:w-80 h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 ease-out hover:border-foreground/30 hover:bg-card/80 scroll-snap-align-start',
				className,
			)}
		>
			{/* macOS-like window controls */}
			<div className="flex items-center justify-between gap-2 border-b border-border/40 bg-secondary/50 px-3 py-2">
				<div className="flex items-center gap-3 min-w-0 flex-1">
					{/* Dots */}
					<div className="flex items-center gap-1.5 shrink-0">
						<span
							className={cn(
								'h-2 w-2 rounded-full transition-colors duration-300',
								isLaneHovered ? 'bg-[#ff5f56]' : 'bg-muted-foreground/30',
							)}
							aria-hidden
						/>
						<span
							className={cn(
								'h-2 w-2 rounded-full transition-colors duration-300',
								isLaneHovered ? 'bg-[#ffbd2e]' : 'bg-muted-foreground/30',
							)}
							aria-hidden
						/>
						<span
							className={cn(
								'h-2 w-2 rounded-full transition-colors duration-300',
								isLaneHovered ? 'bg-[#27c93f]' : 'bg-muted-foreground/30',
							)}
							aria-hidden
						/>
					</div>
					{/* Version (Left Aligned) */}
					<code className="truncate font-mono text-xs font-medium text-muted-foreground/70">
						{formattedVersion || version}
					</code>
				</div>

				{/* Status indicators in header */}
				{(hasBreaking || hasSecurity || hasDeprecation) && (
					<div className="flex items-center gap-1.5 shrink-0">
						{hasSecurity && (
							<span className="flex items-center gap-1 font-mono text-[9px] font-medium uppercase text-red-400">
								<span className="h-1.5 w-1.5 rounded-full bg-red-500" />
								security
							</span>
						)}
						{hasBreaking && (
							<span className="flex items-center gap-1 font-mono text-[9px] font-medium uppercase text-orange-400">
								<span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
								breaking
							</span>
						)}
						{hasDeprecation && (
							<span className="flex items-center gap-1 font-mono text-[9px] font-medium uppercase text-yellow-400">
								<span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
								deprecated
							</span>
						)}
					</div>
				)}

				{/* Tool Logo (Right Aligned) */}
				{logo && (
					<div
						className={cn(
							'flex size-3.5 items-center justify-center opacity-40 transition-all duration-300 group-hover/card:opacity-100 shrink-0',
							(isMonochromeLogo(toolSlug) || !isLaneHovered) &&
								'[\u0026>svg]:fill-foreground [\u0026>svg_path]:fill-foreground grayscale',
							!isMonochromeLogo(toolSlug) &&
								isLaneHovered &&
								'grayscale-0 [\u0026>svg]:fill-current',
						)}
					>
						{logo}
					</div>
				)}
			</div>

			<Link
				to="/tools/$slug/releases/$version"
				params={{ slug: toolSlug, version }}
				className="flex flex-col flex-1 p-4 h-full"
			>
				<div className="flex-1">
					{/* Summary */}
					{summary && (
						<p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
							{summary}
						</p>
					)}
				</div>

				<div className="mt-4 pt-4 border-t border-border/20">
					<div className="flex items-center justify-between gap-4">
						{/* Relative date */}
						<p className="font-mono text-xs text-muted-foreground shrink-0">
							{formatRelativeDate(releaseDate)}
						</p>

						{/* Change count */}
						<p className="font-mono text-xs text-muted-foreground shrink-0">
							<span className="font-semibold text-foreground">
								{changeCount}
							</span>{' '}
							{changeCount === 1 ? 'change' : 'changes'}
						</p>
					</div>
				</div>
			</Link>
		</Card>
	)
}
