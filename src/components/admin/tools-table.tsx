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

interface ToolOverview {
	id: string
	name: string
	slug: string
	isActive: boolean
	lastFetchedAt: Date | null
	releaseCount: number
	changeCount: number
	breakingCount: number
	securityCount: number
	deprecationCount: number
	lastFetchStatus: string | null
	lastFetchStartedAt: Date | null
}

interface ToolsTableProps {
	tools: ToolOverview[]
}

function formatRelativeTime(date: Date | null): string {
	if (!date) return 'Never'
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

export function ToolsTable({ tools }: ToolsTableProps) {
	return (
		<Card className="border-border bg-card">
			<CardHeader>
				<CardTitle className="font-mono text-lg">Tool Statistics</CardTitle>
				<CardDescription>
					Overview of all tracked tools and their content
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
								<th className="text-muted-foreground pb-3 text-right text-xs font-medium">
									Releases
								</th>
								<th className="text-muted-foreground pb-3 text-right text-xs font-medium">
									Changes
								</th>
								<th className="text-muted-foreground pb-3 text-right text-xs font-medium">
									Breaking
								</th>
								<th className="text-muted-foreground pb-3 text-right text-xs font-medium">
									Security
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium pl-4">
									Last Fetch
								</th>
								<th className="text-muted-foreground pb-3 text-left text-xs font-medium">
									Health
								</th>
							</tr>
						</thead>
						<tbody>
							{tools.map((tool) => (
								<tr
									key={tool.id}
									className="border-border border-b last:border-0"
								>
									<td className="py-3">
										<Link
											to="/tools/$slug"
											params={{ slug: tool.slug }}
											className="font-mono text-sm hover:underline"
										>
											{tool.name}
										</Link>
									</td>
									<td className="py-3">
										<Badge
											variant={tool.isActive ? 'default' : 'secondary'}
											className="font-mono text-xs"
										>
											{tool.isActive ? 'Active' : 'Paused'}
										</Badge>
									</td>
									<td className="py-3 text-right">
										<span className="font-mono text-sm">
											{tool.releaseCount}
										</span>
									</td>
									<td className="py-3 text-right">
										<span className="font-mono text-sm">
											{tool.changeCount}
										</span>
									</td>
									<td className="py-3 text-right">
										<span
											className={cn(
												'font-mono text-sm',
												tool.breakingCount > 0
													? 'text-red-500'
													: 'text-muted-foreground',
											)}
										>
											{tool.breakingCount}
										</span>
									</td>
									<td className="py-3 text-right">
										<span
											className={cn(
												'font-mono text-sm',
												tool.securityCount > 0
													? 'text-green-500'
													: 'text-muted-foreground',
											)}
										>
											{tool.securityCount}
										</span>
									</td>
									<td className="py-3 pl-4">
										<span className="text-muted-foreground text-xs">
											{formatRelativeTime(tool.lastFetchedAt)}
										</span>
									</td>
									<td className="py-3">
										{tool.lastFetchStatus === 'SUCCESS' && (
											<span
												className="inline-block size-2 rounded-full bg-foreground"
												title="Healthy"
											/>
										)}
										{tool.lastFetchStatus === 'FAILED' && (
											<span
												className="bg-muted-foreground inline-block size-2 rounded-full"
												title="Failed"
											/>
										)}
										{!tool.lastFetchStatus && (
											<span
												className="border-muted-foreground inline-block size-2 rounded-full border"
												title="No data"
											/>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{tools.length === 0 && (
					<p className="text-muted-foreground py-8 text-center text-sm">
						No tools configured
					</p>
				)}
			</CardContent>
		</Card>
	)
}
