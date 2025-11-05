import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { ChangeCount } from './change-count'

interface ReleaseCardProps {
	version: string
	releaseDate?: Date | null
	summary?: string | null
	changeCount: number
	changesByType?: Record<string, number>
}

export function ReleaseCard({
	version,
	releaseDate,
	summary,
	changeCount,
	changesByType,
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
			to="/tools/claude-code/releases/$version"
			params={{ version }}
			className="block h-full"
		>
			<Card className="group h-full border-border bg-card transition-colors hover:border-accent">
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<CardTitle className="font-mono text-xl">{version}</CardTitle>
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
					</div>
					<CardDescription className="text-muted-foreground">
						{formattedDate} •{' '}
						<ChangeCount
							changeCount={changeCount}
							changesByType={changesByType}
						/>
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
