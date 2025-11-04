import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface VersionListProps {
	toolSlug: string
	currentVersion: string
	versions: Array<{
		version: string
		releaseDate: Date | null
		_count: { changes: number }
	}>
	initialLimit?: number
}

export function VersionList({
	toolSlug,
	currentVersion,
	versions,
	initialLimit = 10,
}: VersionListProps) {
	const [showAll, setShowAll] = useState(false)

	// Filter out current version
	const otherVersions = versions.filter((v) => v.version !== currentVersion)

	if (otherVersions.length === 0) {
		return null
	}

	const displayedVersions = showAll
		? otherVersions
		: otherVersions.slice(0, initialLimit)
	const remainingCount = otherVersions.length - initialLimit

	return (
		<div className="mt-16 border-t border-border pt-8">
			<h2 className="mb-6 text-2xl font-bold">More Versions</h2>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{displayedVersions.map((version) => (
					<Link
						key={version.version}
						to="/tools/$toolSlug/releases/$version"
						params={{ toolSlug, version: version.version }}
						className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-accent"
					>
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1 space-y-1">
								<div className="font-mono text-sm font-semibold group-hover:text-foreground">
									{version.version}
								</div>
								<div className="text-xs text-muted-foreground">
									{version.releaseDate
										? new Date(version.releaseDate).toLocaleDateString(
												'en-US',
												{
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												},
											)
										: 'Date unknown'}
								</div>
							</div>
							<Badge variant="outline" className="shrink-0 font-mono text-xs">
								{version._count.changes}
							</Badge>
						</div>
					</Link>
				))}
			</div>

			{!showAll && remainingCount > 0 && (
				<div className="mt-6 text-center">
					<Button
						variant="outline"
						onClick={() => setShowAll(true)}
						className="font-mono"
					>
						Show {remainingCount} more{' '}
						{remainingCount === 1 ? 'version' : 'versions'}
					</Button>
				</div>
			)}

			{showAll && otherVersions.length > initialLimit && (
				<div className="mt-6 text-center">
					<Button
						variant="outline"
						onClick={() => setShowAll(false)}
						className="font-mono"
					>
						Show less
					</Button>
				</div>
			)}
		</div>
	)
}
