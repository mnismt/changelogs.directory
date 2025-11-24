import { createFileRoute } from '@tanstack/react-router'
import {
	Activity,
	AlertTriangle,
	CheckCircle,
	Clock,
	FileText,
	Mail,
	Package,
	Wrench,
} from 'lucide-react'
import { ChangeTypeChart } from '@/components/admin/change-type-chart'
import { IngestionStatsChart } from '@/components/admin/ingestion-stats-chart'
import { IngestionTable } from '@/components/admin/ingestion-table'
import { StatsCard } from '@/components/admin/stats-card'
import { ToolsTable } from '@/components/admin/tools-table'
import { WaitlistChart } from '@/components/admin/waitlist-chart'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	getChangeTypeDistribution,
	getContentSummary,
	getIngestionOverview,
	getIngestionStats,
	getToolsOverview,
	getWaitlistDailySignups,
	getWaitlistStats,
} from '@/server/admin'

export const Route = createFileRoute('/admin/')({
	loader: async () => {
		const [
			ingestionOverview,
			ingestionStats,
			toolsOverview,
			changeTypeDistribution,
			contentSummary,
			waitlistStats,
			waitlistDailySignups,
		] = await Promise.all([
			getIngestionOverview(),
			getIngestionStats(),
			getToolsOverview(),
			getChangeTypeDistribution(),
			getContentSummary(),
			getWaitlistStats(),
			getWaitlistDailySignups(),
		])

		return {
			ingestionOverview,
			ingestionStats,
			toolsOverview,
			changeTypeDistribution,
			contentSummary,
			waitlistStats,
			waitlistDailySignups,
		}
	},
	head: () => ({
		meta: [
			{ title: 'Admin Dashboard | Changelogs.directory' },
			{
				name: 'robots',
				content: 'noindex, nofollow',
			},
		],
	}),
	component: AdminDashboard,
})

function AdminDashboard() {
	const {
		ingestionOverview,
		ingestionStats,
		toolsOverview,
		changeTypeDistribution,
		contentSummary,
		waitlistStats,
		waitlistDailySignups,
	} = Route.useLoaderData()

	return (
		<div className="mx-auto max-w-7xl px-4 py-8">
			<div className="mb-8">
				<h1 className="font-mono text-3xl font-bold">Admin Dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Monitor ingestion health, content metrics, and subscriber growth
				</p>
			</div>

			{/* Ingestion Health Section */}
			<section className="mb-8">
				<h2 className="mb-4 font-mono text-xl font-semibold">
					Ingestion Health
				</h2>
				<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatsCard
						title="Success Rate (7d)"
						value={`${ingestionStats.successRate}%`}
						description="Last 7 days"
						icon={<CheckCircle className="size-5" />}
					/>
					<StatsCard
						title="Avg Duration"
						value={
							ingestionStats.avgDuration > 0
								? `${(ingestionStats.avgDuration / 1000).toFixed(1)}s`
								: '-'
						}
						description="Successful jobs"
						icon={<Clock className="size-5" />}
					/>
					<StatsCard
						title="Total Jobs (7d)"
						value={ingestionStats.totalJobs}
						description={`${ingestionStats.successCount} success / ${ingestionStats.failedCount} failed`}
						icon={<Activity className="size-5" />}
					/>
					<StatsCard
						title="Tools Tracked"
						value={contentSummary.totalTools}
						description="Active connectors"
						icon={<Wrench className="size-5" />}
					/>
				</div>
				<div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
					<IngestionStatsChart
						successCount={ingestionStats.successCount}
						failedCount={ingestionStats.failedCount}
						totalJobs={ingestionStats.totalJobs}
					/>
					<IngestionTable logs={ingestionOverview} />
				</div>
			</section>

			{/* Content Metrics Section */}
			<section className="mb-8">
				<h2 className="mb-4 font-mono text-xl font-semibold">
					Content Metrics
				</h2>
				<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<StatsCard
						title="Total Releases"
						value={contentSummary.totalReleases}
						icon={<Package className="size-5" />}
					/>
					<StatsCard
						title="Total Changes"
						value={contentSummary.totalChanges}
						icon={<FileText className="size-5" />}
					/>
					<StatsCard
						title="Breaking Changes"
						value={contentSummary.breakingCount}
						description={`${contentSummary.securityCount} security / ${contentSummary.deprecationCount} deprecations`}
						icon={<AlertTriangle className="size-5" />}
					/>
				</div>

				{/* Change Type Distribution Chart */}
				<ChangeTypeChart data={changeTypeDistribution} />
			</section>

			{/* Tool Statistics Section */}
			<section className="mb-8">
				<h2 className="mb-4 font-mono text-xl font-semibold">
					Tool Statistics
				</h2>
				<ToolsTable tools={toolsOverview} />
			</section>

			{/* Waitlist Section */}
			<section className="mb-8">
				<h2 className="mb-4 font-mono text-xl font-semibold">Waitlist</h2>
				<div className="mb-6">
					<StatsCard
						title="Total Subscribers"
						value={waitlistStats.totalCount}
						description="Email signups"
						icon={<Mail className="size-5" />}
						className="max-w-xs"
					/>
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<WaitlistChart data={waitlistDailySignups} />
					<Card className="border-border bg-card">
						<CardHeader>
							<CardTitle className="font-mono text-lg">
								Recent Signups
							</CardTitle>
							<CardDescription>Last 10 email subscriptions</CardDescription>
						</CardHeader>
						<CardContent>
							{waitlistStats.recentSignups.length > 0 ? (
								<ul className="space-y-2">
									{waitlistStats.recentSignups.map((signup) => (
										<li
											key={signup.id}
											className="border-border flex items-center justify-between border-b pb-2 last:border-0"
										>
											<span className="font-mono text-sm">{signup.email}</span>
											<span className="text-muted-foreground text-xs">
												{new Date(signup.createdAt).toLocaleDateString()}
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-muted-foreground text-sm">No signups yet</p>
							)}
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Footer */}
			<div className="border-border text-muted-foreground border-t pt-4 text-center text-xs">
				<p>
					Last updated:{' '}
					{new Date().toLocaleString('en-US', {
						dateStyle: 'medium',
						timeStyle: 'short',
					})}
				</p>
			</div>
		</div>
	)
}
