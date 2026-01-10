import { Link } from '@tanstack/react-router'
import { ArrowRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
	getLogoHoverClasses,
	getToolLogo,
	isMonochromeLogo,
} from '@/lib/tool-logos'
import { cn } from '@/lib/utils'

interface ToolCardProps {
	tool: {
		slug: string
		name: string
		vendor: string | null
		description?: string | null
	}
	latestRelease?: {
		version: string
		formattedVersion?: string | null
		createdAt: Date | string
	}
	releaseCount?: number
	index: number
	isHovered: boolean
	onHoverStart: () => void
	onHoverEnd: () => void
}

export function ToolCard({
	tool,
	latestRelease,
	releaseCount,
	isHovered,
	onHoverStart,
	onHoverEnd,
}: ToolCardProps) {
	const logo = getToolLogo(tool.slug)

	return (
		<Link
			to="/tools/$slug"
			params={{ slug: tool.slug }}
			className="block h-full"
			data-testid={`tool-card-${tool.slug}`}
			onMouseEnter={onHoverStart}
			onMouseLeave={onHoverEnd}
		>
			<Card
				data-testid="tool-card"
				className={cn(
					'group relative h-full overflow-hidden border-border/60 bg-card/40 transition-all duration-500 ease-out',
					isHovered
						? 'border-foreground/40 bg-card/80 shadow-lg translate-y-[-2px]'
						: 'hover:border-foreground/20',
				)}
			>
				{/* Background Image with Fade In */}
				<div
					className={cn(
						'absolute inset-0 z-0 transition-opacity duration-700 ease-out',
						isHovered ? 'opacity-20' : 'opacity-0',
					)}
				>
					<div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20 z-10" />
					<img
						src={`/images/tools/${tool.slug}.png`}
						alt=""
						data-testid={`tool-card-bg-${tool.slug}`}
						className="h-full w-full object-cover grayscale"
					/>
				</div>

				{/* Top accent line */}
				<div
					className={cn(
						'absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/50 to-transparent opacity-0 transition-opacity duration-500 z-20',
						isHovered && 'opacity-100',
					)}
				/>

				<div className="p-6 flex flex-col h-full relative z-20">
					{/* Header */}
					<div className="flex items-start justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="shrink-0">
								{logo ? (
									<div
										className={cn(
											'flex size-10 items-center justify-center rounded p-1.5 [&>svg]:h-full [&>svg]:w-full transition-all duration-500',
											// Monochrome by default, color on hover
											(!isHovered || isMonochromeLogo(tool.slug)) &&
												'[&>svg]:fill-foreground [&>svg_path]:fill-foreground [&>svg_circle]:fill-foreground',
											isHovered && getLogoHoverClasses(tool.slug),
										)}
									>
										{logo}
									</div>
								) : (
									<div className="flex size-10 items-center justify-center rounded bg-secondary/50">
										<Package className="h-5 w-5 text-muted-foreground" />
									</div>
								)}
							</div>
							<div>
								<h3 className="font-mono text-base font-bold tracking-tight">
									{tool.name}
								</h3>
								{tool.vendor && (
									<span className="font-mono text-xs text-muted-foreground">
										{tool.vendor}
									</span>
								)}
							</div>
						</div>

						{/* Arrow icon that appears on hover */}
						<div
							className={cn(
								'text-foreground/50 transition-all duration-500 ease-out transform',
								isHovered
									? 'opacity-100 translate-x-0'
									: 'opacity-0 -translate-x-2',
							)}
						>
							<ArrowRight className="size-5" />
						</div>
					</div>

					{/* Description */}
					{tool.description && (
						<p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-grow leading-relaxed">
							{tool.description}
						</p>
					)}

					{/* Footer / Stats */}
					<div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-xs font-mono text-muted-foreground">
						<div className="flex items-center gap-2">
							{latestRelease ? (
								<span className="flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
									{latestRelease.formattedVersion ||
										`v${latestRelease.version}`}
								</span>
							) : (
								<span>No releases</span>
							)}
						</div>

						{releaseCount !== undefined && (
							<Badge
								variant="secondary"
								className="font-normal text-[10px] bg-secondary/50 text-muted-foreground"
							>
								{releaseCount} releases
							</Badge>
						)}
					</div>
				</div>
			</Card>
		</Link>
	)
}
