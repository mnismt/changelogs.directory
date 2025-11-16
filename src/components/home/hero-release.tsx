import { Link } from '@tanstack/react-router'
import { ArrowRight, Package } from 'lucide-react'
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatRelativeDate } from '@/lib/date-utils'
import { getToolLogo } from '@/lib/tool-logos'

interface HeroReleaseProps {
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
}

export function HeroRelease({
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
}: HeroReleaseProps) {
	const logo = getToolLogo(toolSlug)

	return (
		<Card className="relative overflow-hidden border-border bg-card transition-all duration-700 ease-out hover:border-foreground/20 animate-in fade-in slide-in-from-bottom-4">
			{/* Background effect */}
			<div className="absolute inset-0 opacity-20">
				<BackgroundRippleEffect rows={8} cols={24} cellSize={48} />
			</div>

			{/* Content */}
			<div className="relative z-10 p-8 sm:p-12">
				{/* Header with logo and tool name */}
				<div className="mb-6 flex items-start gap-4">
					<div className="shrink-0 transition-transform duration-700 ease-out hover:rotate-12">
						{logo ? (
							<div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card p-3 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
								{logo}
							</div>
						) : (
							<div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
								<Package className="h-8 w-8 text-muted-foreground" />
							</div>
						)}
					</div>

					<div className="flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
								{toolName}
							</h2>
							{vendor && (
								<Badge
									variant="outline"
									className="border-border bg-secondary font-mono text-xs uppercase"
								>
									{vendor}
								</Badge>
							)}
						</div>

						{/* Version and badges */}
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<code className="rounded border border-border bg-secondary px-3 py-1 font-mono text-lg font-medium">
								v{version}
							</code>

							{hasBreaking && (
								<Badge
									variant="destructive"
									className="font-mono text-xs uppercase"
								>
									Breaking
								</Badge>
							)}

							{hasSecurity && (
								<Badge
									variant="destructive"
									className="font-mono text-xs uppercase"
								>
									Security
								</Badge>
							)}

							{hasDeprecation && (
								<Badge
									variant="outline"
									className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500 font-mono text-xs uppercase"
								>
									Deprecation
								</Badge>
							)}
						</div>
					</div>
				</div>

				{/* Release date */}
				<div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
					<time dateTime={releaseDate.toString()}>
						{formatDate(releaseDate)}
					</time>
					<span>•</span>
					<span>{formatRelativeDate(releaseDate)}</span>
				</div>

				{/* Summary */}
				{summary && (
					<p className="mb-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
						{summary}
					</p>
				)}

				{/* Change count breakdown */}
				<div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
					<div className="flex items-center gap-2">
						<span className="font-mono font-semibold">{changeCount}</span>
						<span className="text-muted-foreground">
							{changeCount === 1 ? 'change' : 'changes'}
						</span>
					</div>

					{Object.entries(changesByType).length > 0 && (
						<>
							<span className="text-muted-foreground/50">•</span>
							<div className="flex flex-wrap gap-3">
								{Object.entries(changesByType)
									.sort(([, a], [, b]) => b - a)
									.map(([type, count]) => (
										<div
											key={type}
											className="flex items-center gap-1.5 text-muted-foreground"
										>
											<span className="font-mono text-xs uppercase">
												{type.toLowerCase()}s
											</span>
											<span className="font-mono text-foreground">{count}</span>
										</div>
									))}
							</div>
						</>
					)}
				</div>

				{/* CTA */}
				<Link
					to="/tools/$slug/releases/$version"
					params={{ slug: toolSlug, version }}
					className="group inline-flex items-center gap-2 rounded-lg border border-border bg-primary px-6 py-3 font-mono text-sm font-medium text-primary-foreground transition-all duration-500 ease-out hover:border-foreground/30 hover:bg-primary/90"
				>
					View release details
					<ArrowRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
				</Link>
			</div>
		</Card>
	)
}
