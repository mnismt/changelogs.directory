import type { ChangeType } from '@prisma/client'
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDate } from '@/lib/date-utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'

interface ReleaseCardProps {
	toolSlug: string
	version: string
	releaseDate?: Date | null
	summary?: string | null
	changeCount: number
	changesByType?: Record<string, number>
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

export function ReleaseCard({
	toolSlug,
	version,
	releaseDate,
	summary,
	changeCount,
	changesByType,
}: ReleaseCardProps) {
	const formattedDate = formatDate(releaseDate)

	const renderChangeTypeTooltip = () => {
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

	const tooltipContent = renderChangeTypeTooltip()
	const hasTooltip = tooltipContent !== null

	const cardContent = (
		<Card className="group h-full border-border bg-card transition-colors hover:border-accent">
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<CardTitle className="flex items-center font-mono text-xl">
						<Package className="size-5" />
						<span className="ml-2">
							{formatVersionForDisplay(version, toolSlug)}
						</span>
					</CardTitle>
					<div className="flex shrink-0 flex-col items-end gap-2">
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
						<Badge variant="outline" className="font-mono text-xs">
							{changeCount}
						</Badge>
					</div>
				</div>
				<CardDescription className="text-muted-foreground">
					{formattedDate}
				</CardDescription>
			</CardHeader>
			{summary && (
				<CardContent>
					<p className="line-clamp-3 text-sm text-muted-foreground">
						{summary}
					</p>
				</CardContent>
			)}
		</Card>
	)

	const linkElement = (
		<Link
			to="/tools/$slug/releases/$version"
			params={{ slug: toolSlug, version }}
			className="block h-full"
		>
			{cardContent}
		</Link>
	)

	if (!hasTooltip) {
		return linkElement
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{linkElement}</TooltipTrigger>
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
