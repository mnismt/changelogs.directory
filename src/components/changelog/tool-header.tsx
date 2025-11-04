import { ExternalLink, Github, Home } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface ToolHeaderProps {
	name: string
	vendor: string
	description?: string | null
	homepage: string
	repositoryUrl: string
	releaseCount: number
	lastFetchedAt?: Date | null
	tags: string[]
	logo?: ReactNode
}

export function ToolHeader({
	name,
	vendor,
	description,
	homepage,
	repositoryUrl,
	releaseCount,
	lastFetchedAt,
	tags,
	logo,
}: ToolHeaderProps) {
	const lastUpdated = lastFetchedAt
		? new Date(lastFetchedAt).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		: 'Never'

	return (
		<div className="space-y-6 border-b border-border pb-8">
			{/* Header */}
			<div className="space-y-4">
				{/* Logo and Vendor */}
				<div className="flex items-center gap-4">
					{logo && (
						<div className="[&>svg]:h-12 [&>svg]:w-12 [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
							{logo}
						</div>
					)}
					<div className="space-y-1">
						<div className="text-sm text-muted-foreground">{vendor}</div>
						<h1 className="font-mono text-4xl font-bold leading-none">
							{name}
						</h1>
					</div>
				</div>

				{/* Description */}
				{description && (
					<p className="text-lg text-muted-foreground">{description}</p>
				)}
			</div>

			{/* Tags */}
			{tags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{tags.map((tag) => (
						<Badge
							key={tag}
							variant="outline"
							className="bg-card font-mono text-xs uppercase"
						>
							{tag}
						</Badge>
					))}
				</div>
			)}

			{/* Stats and Links */}
			<div className="flex flex-wrap items-center gap-6 text-sm">
				{/* Stats */}
				<div className="flex gap-6">
					<div>
						<span className="text-muted-foreground">Releases:</span>{' '}
						<span className="font-mono font-semibold">{releaseCount}</span>
					</div>
					<div>
						<span className="text-muted-foreground">Last updated:</span>{' '}
						<span className="font-mono">{lastUpdated}</span>
					</div>
				</div>

				{/* Separator */}
				<div className="h-4 w-px bg-border" />

				{/* Links */}
				<div className="flex gap-4">
					<a
						href={homepage}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
					>
						<Home className="h-4 w-4" />
						Homepage
						<ExternalLink className="h-3 w-3" />
					</a>
					<a
						href={repositoryUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
					>
						<Github className="h-4 w-4" />
						Repository
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
			</div>
		</div>
	)
}
