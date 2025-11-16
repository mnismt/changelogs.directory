import { Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatRelativeDate } from '@/lib/date-utils'
import { getToolLogo } from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface FeedReleaseCardProps {
	toolSlug: string
	toolName: string
	vendor: string | null
	version: string
	releaseDate: Date | string
	summary: string | null
	changeCount: number
	changesByType: Record<string, number>
	hasBreaking: boolean
	hasSecurity: boolean
	hasDeprecation: boolean
	className?: string
}

export function FeedReleaseCard({
	toolSlug,
	toolName,
	vendor,
	version,
	releaseDate,
	summary,
	changeCount,
	changesByType,
	hasBreaking,
	hasSecurity,
	hasDeprecation,
	className,
}: FeedReleaseCardProps) {
	const logo = getToolLogo(toolSlug)

	// Calculate total feature/bugfix/improvement counts for tooltip
	const featureCount = changesByType.FEATURE || 0
	const bugfixCount = changesByType.BUGFIX || 0
	const improvementCount = changesByType.IMPROVEMENT || 0

	return (
		<Card
			className={cn(
				'group relative border-border bg-card p-6 transition-all duration-700 ease-out hover:rotate-1 hover:border-foreground/20',
				className,
			)}
		>
			<Link
				to="/tools/$slug/releases/$version"
				params={{ slug: toolSlug, version }}
				className="block"
			>
				{/* Tool header with logo */}
				<div className="mb-4 flex items-center gap-3">
					<div className="shrink-0 transition-transform duration-700 ease-out group-hover:rotate-12">
						{logo ? (
							<div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-secondary p-2 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
								{logo}
							</div>
						) : (
							<div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-secondary">
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
				<div className="mb-3 flex flex-wrap items-center gap-2">
					<code className="rounded border border-border bg-secondary px-2 py-1 font-mono text-sm font-medium">
						v{version}
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
				<div className="mb-3 text-xs text-muted-foreground">
					<time dateTime={releaseDate.toString()}>
						{formatDate(releaseDate)}
					</time>
					<span className="mx-1">•</span>
					<span>{formatRelativeDate(releaseDate)}</span>
				</div>

				{/* Summary (truncated to 2 lines) */}
				{summary && (
					<p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
						{summary}
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
			<div className="mt-4 pt-4 border-t border-border/50">
				<Link
					to="/tools/$slug"
					params={{ slug: toolSlug }}
					className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-300 hover:text-foreground"
				>
					View all {toolName} releases
					<span className="transition-transform duration-300 group-hover:translate-x-0.5">
						→
					</span>
				</Link>
			</div>
		</Card>
	)
}
