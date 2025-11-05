import type { ChangeType } from '@prisma/client'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface VersionListProps {
	toolSlug: string
	currentVersion: string
	versions: Array<{
		version: string
		releaseDate: Date | null
		_count: { changes: number }
		changesByType?: Record<string, number>
	}>
	initialLimit?: number
}

const changeTypeLabels: Record<ChangeType, string> = {
	BREAKING: '⚠️ Breaking',
	SECURITY: '🔒 Security',
	FEATURE: '✨ Features',
	IMPROVEMENT: '🚀 Improvements',
	PERFORMANCE: '⚡ Performance',
	BUGFIX: '🐛 Bug Fixes',
	DEPRECATION: '⚠️ Deprecated',
	DOCUMENTATION: '📚 Docs',
	OTHER: '📦 Other',
}

const changeTypeOrder: ChangeType[] = [
	'BREAKING',
	'SECURITY',
	'FEATURE',
	'IMPROVEMENT',
	'PERFORMANCE',
	'BUGFIX',
	'DEPRECATION',
	'DOCUMENTATION',
	'OTHER',
]

export function VersionList({
	toolSlug,
	currentVersion,
	versions,
	initialLimit = 10,
}: VersionListProps) {
	const [showAll, setShowAll] = useState(false)

	if (versions.length === 0) {
		return null
	}

	const displayedVersions = showAll ? versions : versions.slice(0, initialLimit)
	const remainingCount = versions.length - initialLimit

	const renderChangeTypeTooltip = (changesByType?: Record<string, number>) => {
		if (!changesByType || Object.keys(changesByType).length === 0) {
			return null
		}

		const items = changeTypeOrder
			.filter((type) => changesByType[type] && changesByType[type] > 0)
			.map((type) => ({
				type,
				count: changesByType[type],
				label: changeTypeLabels[type],
			}))

		if (items.length === 0) {
			return null
		}

		return (
			<div className="space-y-1.5">
				{items.map((item) => (
					<div
						key={item.type}
						className="flex items-center justify-between gap-4 text-xs"
					>
						<span className="font-mono">{item.label}</span>
						<span className="font-mono font-semibold">{item.count}</span>
					</div>
				))}
			</div>
		)
	}

	const renderVersionCard = (version: (typeof versions)[0]) => {
		const isCurrent = version.version === currentVersion
		const tooltipContent = renderChangeTypeTooltip(version.changesByType)
		const hasTooltip = tooltipContent !== null

		const content = (
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 space-y-1">
					<div className="font-mono text-sm font-semibold group-hover:text-foreground">
						{version.version}
					</div>
					<div className="text-xs text-muted-foreground">
						{version.releaseDate
							? new Date(version.releaseDate).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})
							: 'Date unknown'}
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1">
					{isCurrent && (
						<span className="text-xs font-mono uppercase text-muted-foreground">
							You're here
						</span>
					)}
					<Badge variant="outline" className="font-mono text-xs">
						{version._count.changes}
					</Badge>
				</div>
			</div>
		)

		const cardElement = isCurrent ? (
			<div className="block rounded-lg border border-accent bg-secondary p-4">
				{content}
			</div>
		) : (
			<Link
				to="/tools/claude-code/releases/$version"
				params={{ version: version.version }}
				className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-accent"
			>
				{content}
			</Link>
		)

		if (!hasTooltip) {
			return <div key={version.version}>{cardElement}</div>
		}

		return (
			<Tooltip key={version.version}>
				<TooltipTrigger asChild>{cardElement}</TooltipTrigger>
				<TooltipContent
					side="top"
					align="end"
					sideOffset={8}
					className="max-w-xs border border-border bg-card p-3 text-foreground"
				>
					{tooltipContent}
				</TooltipContent>
			</Tooltip>
		)
	}

	return (
		<div className="mt-16 border-t border-border pt-8">
			<h2 className="mb-6 text-2xl font-bold">More Versions</h2>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{displayedVersions.map(renderVersionCard)}
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

			{showAll && versions.length > initialLimit && (
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
