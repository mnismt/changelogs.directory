import { Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ChangeType } from '@/generated/prisma/client'
import { formatDate, formatRelativeDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface ReleaseCardBaseProps {
	version: string
	formattedVersion?: string
	releaseDate?: Date | string | null
	headline?: string | null
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
	> {
	toolSlug: string
	changeCount: number
}

const changeTypeLabels: Partial<Record<ChangeType, string>> = {
	BREAKING: '⚠️ Breaking',
	SECURITY: '🔒 Security',
	FEATURE: '✨ Features',
	IMPROVEMENT: '🚀 Improvements',
	PERFORMANCE: '⚡ Performance',
	BUGFIX: '🐛 Bug Fixes',
	DEPRECATION: '🌅 Deprecated',
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
	version,
	formattedVersion,
	releaseDate,
	headline,
	changesByType,
	rightAccessory,
	bodyFooter,
	summaryLineClamp = 3,
	className,
}: ReleaseCardBaseProps) {
	const formattedDate = formatDate(releaseDate)
	const relativeDate = formatRelativeDate(releaseDate)
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
		<motion.div
			className={cn(
				'group relative h-full overflow-hidden rounded-lg border border-white/10 bg-black/40 p-5 backdrop-blur-md transition-all duration-500',
				'hover:border-white/20 hover:bg-black/60 hover:shadow-2xl hover:shadow-white/5',
				className,
			)}
			whileHover={{ y: -4 }}
		>
			{/* Glow Effect */}
			<div className="absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100">
				<div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20" />
			</div>

			<div className="relative z-10 flex h-full flex-col gap-4">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-foreground">
								<Package className="size-5 text-muted-foreground" />
								<span>{formattedVersion || version}</span>
							</div>
							{hasSeverityBadges && (
								<div className="flex gap-1.5">
									{hasBreaking && (
										<span className="rounded-sm bg-red-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-500 border border-red-500/20">
											Breaking
										</span>
									)}
									{hasSecurity && (
										<span className="rounded-sm bg-red-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-500 border border-red-500/20">
											Security
										</span>
									)}
								</div>
							)}
						</div>
						<div className="flex items-center gap-2 font-mono text-xs text-muted-foreground/60">
							<span>
								{'//'} {relativeDate}
							</span>
							<span className="text-muted-foreground/20">•</span>
							<span>{formattedDate}</span>
						</div>
					</div>
					{rightAccessory}
				</div>

				{/* Content */}
				{headline && (
					<div className="flex-1">
						<p
							className={cn(
								summaryClampClass,
								'font-mono text-sm text-muted-foreground leading-relaxed',
							)}
						>
							<span className="text-green-500/50 mr-2">$</span>
							{headline}
						</p>
					</div>
				)}

				{/* Footer */}
				{bodyFooter && (
					<div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
						{bodyFooter}
					</div>
				)}
			</div>
		</motion.div>
	)
}

export function ReleaseCard({
	toolSlug,
	version,
	formattedVersion,
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
			version={version}
			formattedVersion={formattedVersion}
			releaseDate={releaseDate}
			headline={headline}
			changesByType={changesByType}
			rightAccessory={
				<div className="font-mono text-xs text-muted-foreground/40">
					{changeCount} changes
				</div>
			}
			summaryLineClamp={3}
		/>
	)

	const linkElement = (
		<Link
			to="/tools/$slug/releases/$version"
			params={{ slug: toolSlug, version }}
			className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
			data-testid="release-card"
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
				className="max-w-xs border border-white/10 bg-black/90 p-3 text-foreground backdrop-blur-md"
			>
				{tooltipContent}
			</TooltipContent>
		</Tooltip>
	)
}
