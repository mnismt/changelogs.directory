import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FetchLogEntry {
	id: string
	status: string
	startedAt: Date
	completedAt: Date | null
	duration: number | null
	releasesFound: number
	releasesNew: number
	releasesUpdated: number
	changesCreated: number
	error: string | null
	tool: {
		name: string
		slug: string
	}
}

interface IngestionTableProps {
	logs: FetchLogEntry[]
}

function formatDuration(ms: number | null): string {
	if (!ms) return '-'
	if (ms < 1000) return `${ms}ms`
	return `${(ms / 1000).toFixed(1)}s`
}

function formatRelativeTime(date: Date): string {
	const now = new Date()
	const diffMs = now.getTime() - new Date(date).getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return 'just now'
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	return `${diffDays}d ago`
}

function getStatusBadgeVariant(
	status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (status) {
		case 'SUCCESS':
			return 'default'
		case 'FAILED':
			return 'destructive'
		case 'IN_PROGRESS':
		case 'PENDING':
			return 'secondary'
		default:
			return 'outline'
	}
}

export function IngestionTable({ logs }: IngestionTableProps) {
	return (
		<Card className="border-border bg-card">
			<CardHeader>
				<CardTitle className="font-mono text-lg">
					Recent Ingestion Jobs
				</CardTitle>
				<CardDescription>
					Last 20 fetch operations across all tools
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-border border-b">
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Tool
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Status
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Duration
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Releases
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Changes
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Time
								</th>
							</tr>
						</thead>
						<tbody>
							{logs.map((log) => (
								<tr
									key={log.id}
									className={cn(
										'border-border border-b last:border-0',
										log.status === 'FAILED' && 'bg-card/50',
									)}
								>
									<td className="py-3">
										<Link
											to="/tools/$slug"
											params={{ slug: log.tool.slug }}
											className="font-mono text-sm hover:underline"
										>
											{log.tool.name}
										</Link>
									</td>
									<td className="py-3">
										<Badge
											variant={getStatusBadgeVariant(log.status)}
											className="font-mono text-xs"
										>
											{log.status}
										</Badge>
									</td>
									<td className="py-3">
										<span className="font-mono text-muted-foreground text-sm">
											{formatDuration(log.duration)}
										</span>
									</td>
									<td className="py-3">
										<span className="font-mono text-sm">
											{log.releasesNew > 0 && (
												<span className="text-foreground">
													+{log.releasesNew}
												</span>
											)}
											{log.releasesNew > 0 && log.releasesUpdated > 0 && ' / '}
											{log.releasesUpdated > 0 && (
												<span className="text-muted-foreground">
													~{log.releasesUpdated}
												</span>
											)}
											{log.releasesNew === 0 && log.releasesUpdated === 0 && (
												<span className="text-muted-foreground">-</span>
											)}
										</span>
									</td>
									<td className="py-3">
										<span className="font-mono text-muted-foreground text-sm">
											{log.changesCreated > 0 ? `+${log.changesCreated}` : '-'}
										</span>
									</td>
									<td className="py-3">
										<span className="text-muted-foreground text-xs">
											{formatRelativeTime(log.startedAt)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{logs.length === 0 && (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No ingestion jobs found
					</p>
				)}
			</CardContent>
		</Card>
	)
}
