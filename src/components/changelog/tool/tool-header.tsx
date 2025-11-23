import { Calendar, ExternalLink, Github, Home, Package } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/date-utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'

interface ToolHeaderProps {
	slug: string
	name: string
	vendor: string
	description?: string | null
	homepage: string
	repositoryUrl: string
	releaseCount: number
	lastFetchedAt?: Date | null
	latestVersion?: string
	latestReleaseDate?: Date | null
	firstVersion?: string
	firstReleaseDate?: Date | null
	tags: string[]
	logo?: ReactNode
}

export function ToolHeader({
	slug,
	name,
	vendor,
	description,
	homepage,
	repositoryUrl,
	releaseCount,
	lastFetchedAt,
	latestVersion,
	latestReleaseDate,
	firstVersion,
	firstReleaseDate,
	tags,
	logo,
}: ToolHeaderProps) {
	const formatDateValue = (date?: Date | null) => {
		if (!date) return 'Unknown'
		return formatDate(date)
	}

	const lastSynced = formatDateValue(lastFetchedAt)

	return (
		<div className="space-y-6 border-b border-border pb-8">
			{/* Logo and Title */}
			<div className="flex items-center gap-4">
				{logo && (
					<div className="shrink-0 [&>svg]:h-12 [&>svg]:w-12 [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
						{logo}
					</div>
				)}
				<div className="space-y-1">
					<div className="text-sm text-muted-foreground">{vendor}</div>
					<h1 className="font-mono text-4xl font-bold leading-none">{name}</h1>
				</div>
			</div>

			{/* Description */}
			{description && (
				<p className="max-w-3xl text-lg text-muted-foreground">{description}</p>
			)}

			{/* Stats Card */}
			<Card className="border-border bg-card/50 p-6">
				<div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
					{/* Total Releases */}
					<div className="space-y-1">
						<div className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
							<Package className="size-3.5" />
							Releases
						</div>
						<div className="font-mono text-2xl font-bold">{releaseCount}</div>
					</div>

					{/* Last Synced */}
					<div className="space-y-1">
						<div className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
							<Calendar className="size-3.5" />
							Synced
						</div>
						<div className="font-mono text-sm">{lastSynced}</div>
					</div>

					{/* Latest Version */}
					{latestVersion && (
						<div className="space-y-1">
							<div className="text-xs uppercase text-muted-foreground">
								Latest
							</div>
							<div className="space-y-0.5">
								<div className="font-mono text-sm font-semibold">
									{formatVersionForDisplay(latestVersion, slug)}
								</div>
								<div className="font-mono text-xs text-muted-foreground">
									{formatDateValue(latestReleaseDate)}
								</div>
							</div>
						</div>
					)}

					{/* First Version */}
					{firstVersion && (
						<div className="space-y-1">
							<div className="text-xs uppercase text-muted-foreground">
								First
							</div>
							<div className="space-y-0.5">
								<div className="font-mono text-sm font-semibold">
									{formatVersionForDisplay(firstVersion, slug)}
								</div>
								<div className="font-mono text-xs text-muted-foreground">
									{formatDateValue(firstReleaseDate)}
								</div>
							</div>
						</div>
					)}
				</div>
			</Card>

			{/* Bottom: Links and Tags */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				{/* Links */}
				<div className="flex shrink-0 gap-4">
					<a
						href={homepage}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<Home className="h-4 w-4" />
						Homepage
						<ExternalLink className="h-3 w-3" />
					</a>
					<a
						href={repositoryUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<Github className="h-4 w-4" />
						Repository
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>

				{/* Tags */}
				<div className="flex flex-wrap gap-2">
					{tags.length > 0 ? (
						tags.map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="bg-card font-mono text-xs uppercase"
							>
								{tag}
							</Badge>
						))
					) : (
						<div className="h-6" />
					)}
				</div>
			</div>
		</div>
	)
}
