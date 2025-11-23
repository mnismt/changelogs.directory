import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { formatDate, formatRelativeDate } from '@/lib/date-utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'

interface ToolCardProps {
	slug: string
	name: string
	vendor: string
	description?: string | null
	tags: string[]
	releaseCount: number
	latestVersion?: string | null
	latestReleaseDate?: Date | null
	logo?: ReactNode
}

export function ToolCard({
	slug,
	name,
	vendor,
	description,
	tags,
	releaseCount,
	latestVersion,
	latestReleaseDate,
	logo,
}: ToolCardProps) {
	const absoluteDate = formatDate(latestReleaseDate)
	const relativeDate = formatRelativeDate(latestReleaseDate)

	return (
		<Link to="/tools/$slug" params={{ slug }} className="block h-full">
			<Card className="group h-full border-border bg-card transition-all duration-500 ease-out hover:border-foreground/20 hover:bg-card/80">
				<CardHeader>
					<div className="flex items-start gap-3">
						{logo && (
							<div className="shrink-0 transition-transform duration-700 ease-out [&>svg]:h-10 [&>svg]:w-10 [&>svg]:fill-foreground group-hover:rotate-12">
								{logo}
							</div>
						)}
						<div className="flex-1 space-y-0.5">
							<CardTitle className="font-mono text-xl transition-colors duration-300">
								{name}
							</CardTitle>
							<CardDescription className="text-xs uppercase transition-colors duration-300 group-hover:text-muted-foreground/80">
								{vendor}
							</CardDescription>
						</div>
					</div>
				</CardHeader>

				{description && (
					<CardContent>
						<p className="line-clamp-2 text-sm text-muted-foreground">
							{description}
						</p>
					</CardContent>
				)}

				<CardFooter className="flex-col items-start gap-3">
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{tags.map((tag) => (
								<Badge
									key={tag}
									variant="outline"
									className="bg-card font-mono text-xs uppercase transition-colors duration-300 group-hover:border-foreground/10"
								>
									{tag}
								</Badge>
							))}
						</div>
					)}

					<div className="w-full border-t border-border pt-3 transition-colors duration-300 group-hover:border-foreground/10">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span className="transition-colors duration-300 group-hover:text-muted-foreground/80">
								{releaseCount} releases
							</span>
							{latestVersion && (
								<div className="relative flex flex-col items-end gap-0.5">
									<span className="font-mono text-foreground transition-colors duration-300 group-hover:text-foreground/90">
										{formatVersionForDisplay(latestVersion, slug)}
									</span>
									<div className="relative h-4 min-w-[80px] overflow-hidden text-[10px]">
										{/* Relative date - visible by default, fades out on hover */}
										<span className="absolute right-0 top-0 whitespace-nowrap transition-all duration-300 ease-out group-hover:translate-y-full group-hover:opacity-0">
											{relativeDate}
										</span>
										{/* Absolute date - hidden by default, slides in on hover */}
										<span className="absolute right-0 top-0 -translate-y-full whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
											{absoluteDate}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</CardFooter>
			</Card>
		</Link>
	)
}
