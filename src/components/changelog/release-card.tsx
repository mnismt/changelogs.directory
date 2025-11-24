import type { ChangeType } from '@prisma/client'
import { Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import type { ReactNode } from 'react'
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
import { cn } from '@/lib/utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'

interface ReleaseCardBaseProps {
	toolSlug: string
	version: string
	releaseDate?: Date | string | null
	headline?: string | null
	changeCount: number
	changesByType?: Record<string, number>
	rightAccessory?: ReactNode
	bodyFooter?: ReactNode
	summaryLineClamp?: 2 | 3
	className?: string
}

interface ReleaseCardProps
	extends Omit<
		ReleaseCardBaseProps,
		'rightAccessory' | 'bodyFooter' | 'summaryLineClamp' | 'className'
	> {}

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

export function ReleaseCardBase({
	toolSlug,
	version,
	releaseDate,
	headline,
	changeCount,
	changesByType,
	rightAccessory,
	bodyFooter,
	summaryLineClamp = 3,
	className,
}: ReleaseCardBaseProps) {
	const formattedDate = formatDate(releaseDate)
	const hasBreaking = Boolean(
		changesByType?.BREAKING && changesByType.BREAKING > 0,
	)
	const hasSecurity = Boolean(
		changesByType?.SECURITY && changesByType.SECURITY > 0,
	)
	const hasDeprecation = Boolean(
		changesByType?.DEPRECATION && changesByType.DEPRECATION > 0,
	)
	const hasSeverityBadges = hasBreaking || hasSecurity || hasDeprecation
	const summaryClampClass =
		summaryLineClamp === 2 ? 'line-clamp-2' : 'line-clamp-3'

	return (
		<Card
			className={cn(
				'group h-full border-border bg-card transition-all duration-700 ease-out hover:border-foreground/20 hover:bg-card/80',
				className,
			)}
		>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<CardTitle className="flex items-center font-mono text-xl">
						<Package className="size-5" />
						<span className="ml-2">
							{formatVersionForDisplay(version, toolSlug)}
						</span>
					</CardTitle>
					{(hasSeverityBadges || rightAccessory) && (
						<div className="flex shrink-0 flex-col items-end gap-2">
							{hasSeverityBadges && (
								<div className="flex flex-wrap gap-1">
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
											className="font-mono text-xs uppercase"
										>
											Deprecated
										</Badge>
									)}
								</div>
							)}
							{rightAccessory}
						</div>
					)}
				</div>
				{formattedDate && (
					<CardDescription className="text-muted-foreground">
						{formattedDate}
					</CardDescription>
				)}
			</CardHeader>
			{headline && (
				<CardContent>
					<p className={cn(summaryClampClass, 'text-sm text-muted-foreground')}>
						{headline}
					</p>
					{bodyFooter}
				</CardContent>
			)}
		</Card>
	)
}

export function ReleaseCard({
	toolSlug,
	version,
	releaseDate,
	headline,
	changeCount,
	changesByType,
}: ReleaseCardProps) {
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
		<ReleaseCardBase
			toolSlug={toolSlug}
			version={version}
			releaseDate={releaseDate}
			headline={headline}
			changeCount={changeCount}
			changesByType={changesByType}
			rightAccessory={
				<Badge variant="outline" className="font-mono text-xs">
					{changeCount}
				</Badge>
			}
			summaryLineClamp={3}
		/>
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
