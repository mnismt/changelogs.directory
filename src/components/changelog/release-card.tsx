import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

interface ReleaseCardProps {
	toolSlug: string
	version: string
	releaseDate?: Date | null
	summary?: string | null
	tags: string[]
	changeCount: number
}

export function ReleaseCard({
	toolSlug,
	version,
	releaseDate,
	summary,
	tags,
	changeCount,
}: ReleaseCardProps) {
	const formattedDate = releaseDate
		? new Date(releaseDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})
		: 'Date unknown'

	return (
		<Link
			to="/tools/$toolSlug/releases/$version"
			params={{ toolSlug, version }}
			className="block h-full"
		>
			<Card className="h-full border-border bg-card transition-colors hover:border-accent">
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<CardTitle className="font-mono text-xl">{version}</CardTitle>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant={
											tag === 'breaking' || tag === 'security'
												? 'destructive'
												: 'outline'
										}
										className="font-mono text-xs uppercase"
									>
										{tag}
									</Badge>
								))}
							</div>
						)}
					</div>
					<CardDescription className="text-muted-foreground">
						{formattedDate} • {changeCount}{' '}
						{changeCount === 1 ? 'change' : 'changes'}
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
		</Link>
	)
}
