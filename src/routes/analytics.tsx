import { Await, createFileRoute, defer } from '@tanstack/react-router'
import {
	Activity,
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	Mail,
	Package,
	Wrench,
	Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { type ReactNode, Suspense } from 'react'
import { ChangeTypeChart } from '@/components/admin/change-type-chart'
import { IngestionStatsChart } from '@/components/admin/ingestion-stats-chart'
import { IngestionTable } from '@/components/admin/ingestion-table'
import { ReleaseTrendsChart } from '@/components/admin/release-trends-chart'
import { ToolChangeProfilesChart } from '@/components/admin/tool-change-profiles-chart'
import { ToolQualityMetricsChart } from '@/components/admin/tool-quality-metrics-chart'
import { ToolsTable } from '@/components/admin/tools-table'
import { WaitlistChart } from '@/components/admin/waitlist-chart'
import { DataStreamLoader } from '@/components/ui/data-stream-loader'
import { Reveal } from '@/components/ui/reveal'
import { cn, maskEmail } from '@/lib/utils'
import {
	getChangeTypeDistribution,
	getContentSummary,
	getIngestionOverview,
	getIngestionStats,
	getReleaseTrends,
	getToolsOverview,
	getWaitlistDailySignups,
	getWaitlistStats,
} from '@/server/admin'
import {
	getToolChangeProfiles,
	getToolQualityMetrics,
} from '@/server/tool-analytics'

export const Route = createFileRoute('/analytics')({
	loader: async () => {
		// Start fetching everything
		const ingestionOverviewPromise = getIngestionOverview()
		const ingestionStatsPromise = getIngestionStats()
		const waitlistStatsPromise = getWaitlistStats()

		const toolsOverviewPromise = getToolsOverview()
		const changeTypeDistributionPromise = getChangeTypeDistribution()
		const contentSummaryPromise = getContentSummary()
		const waitlistDailySignupsPromise = getWaitlistDailySignups()
		const releaseTrendsPromise = getReleaseTrends()
		const toolChangeProfilesPromise = getToolChangeProfiles()
		const toolQualityMetricsPromise = getToolQualityMetrics()

		// Await critical/fast data
		const [ingestionOverview, ingestionStats, waitlistStats] =
			await Promise.all([
				ingestionOverviewPromise,
				ingestionStatsPromise,
				waitlistStatsPromise,
			])

		return {
			ingestionOverview,
			ingestionStats,
			waitlistStats,
			toolsOverview: defer(toolsOverviewPromise),
			changeTypeDistribution: defer(changeTypeDistributionPromise),
			contentSummary: defer(contentSummaryPromise),
			waitlistDailySignups: defer(waitlistDailySignupsPromise),
			releaseTrends: defer(releaseTrendsPromise),
			toolChangeProfiles: defer(toolChangeProfilesPromise),
			toolQualityMetrics: defer(toolQualityMetricsPromise),
		}
	},
	head: () => {
		const baseUrl = process.env.VITE_BASE_URL || 'https://changelogs.directory'
		return {
			meta: [
				{ title: 'analytics | changelogs.directory' },
				{
					name: 'robots',
					content: 'noindex, nofollow',
				},
				{
					name: 'description',
					content:
						'Real-time monitoring of ingestion pipelines, content metrics, and platform growth.',
				},
				{
					name: 'keywords',
					content: 'analytics, changelogs, changelog, changelog directory',
				},
				{
					property: 'og:url',
					content: `${baseUrl}/analytics`,
				},
				{
					property: 'og:image',
					content: `${baseUrl}/og`,
				},
				{
					name: 'twitter:card',
					content: 'summary_large_image',
				},
				{
					name: 'twitter:creator',
					content: '@leodoan_',
				},
				{
					name: 'twitter:title',
					content: 'changelogs.directory - Latest Developer Tool Updates',
				},
				{
					name: 'twitter:description',
					content:
						'Track the latest releases, features, and breaking changes for your favorite developer tools.',
				},
				{
					name: 'twitter:image',
					content: `${baseUrl}/og`,
				},
			],
		}
	},
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
		releaseTrends,
		toolChangeProfiles,
		toolQualityMetrics,
	} = Route.useLoaderData()
	const recentSignups = waitlistStats.recentSignups?.slice(0, 7) || []

	return (
		<div className="relative min-h-screen w-full overflow-hidden pt-20 pb-12">
			{/* Content */}
			<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Header Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-12"
				>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-px flex-1 bg-border/40" />
						<span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">
							System Status
						</span>
						<div className="h-px flex-1 bg-border/40" />
					</div>
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center text-foreground font-mono">
						Analytics_Dashboard
					</h1>
					<p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto font-mono text-sm">
						Real-time monitoring of ingestion pipelines, content metrics, and
						platform growth.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 gap-8">
					{/* Tool Statistics Section */}
					<Section title="Tool Statistics" delay={0.1}>
						<Suspense
							fallback={
								<DataStreamLoader
									className="h-[400px]"
									text="ANALYZING_TOOL_METRICS"
								/>
							}
						>
							<Await promise={toolsOverview}>
								{(data) => (
									<Reveal>
										<GlassCard className="overflow-hidden">
											<ToolsTable tools={data} />
										</GlassCard>
									</Reveal>
								)}
							</Await>
						</Suspense>
					</Section>

					{/* Tool Comparison Section */}
					<Section title="Tool Comparison" delay={0.15}>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<Suspense
								fallback={
									<DataStreamLoader
										className="h-[400px]"
										text="COMPARING_PROFILES"
									/>
								}
							>
								<Await promise={toolChangeProfiles}>
									{(data) => (
										<Reveal>
											<GlassCard className="p-6">
												<h3 className="font-mono text-sm font-medium text-muted-foreground mb-6">
													Change Type Profiles
												</h3>
												<ToolChangeProfilesChart data={data} />
											</GlassCard>
										</Reveal>
									)}
								</Await>
							</Suspense>
							<Suspense
								fallback={
									<DataStreamLoader
										className="h-[400px]"
										text="CALCULATING_QUALITY"
									/>
								}
							>
								<Await promise={toolQualityMetrics}>
									{(data) => (
										<Reveal delay={0.1}>
											<GlassCard className="p-6">
												<h3 className="font-mono text-sm font-medium text-muted-foreground mb-6">
													Quality Metrics Comparison
												</h3>
												<ToolQualityMetricsChart data={data} />
											</GlassCard>
										</Reveal>
									)}
								</Await>
							</Suspense>
						</div>
					</Section>

					{/* Content Metrics Section */}
					<Section title="Content Metrics" delay={0.2}>
						<Suspense
							fallback={
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
									<DataStreamLoader className="h-32" text="COUNTING" />
									<DataStreamLoader className="h-32" text="COUNTING" />
									<DataStreamLoader className="h-32" text="SCANNING" />
								</div>
							}
						>
							<Await promise={contentSummary}>
								{(data) => (
									<Reveal>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
											<StatsCard
												title="Total Releases"
												value={data.totalReleases}
												icon={<Package className="size-4" />}
												trend="up"
											/>
											<StatsCard
												title="Total Changes"
												value={data.totalChanges}
												icon={<FileText className="size-4" />}
												trend="up"
											/>
											<StatsCard
												title="Breaking Changes"
												value={data.breakingCount}
												description={`${data.securityCount} security / ${data.deprecationCount} deprecations`}
												icon={<AlertTriangle className="size-4" />}
												trend="down"
												trendLabel="High Attention"
											/>
										</div>
									</Reveal>
								)}
							</Await>
						</Suspense>

						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<Suspense
								fallback={
									<DataStreamLoader
										className="h-[400px]"
										text="ANALYZING_DISTRIBUTION"
									/>
								}
							>
								<Await promise={changeTypeDistribution}>
									{(data) => (
										<Reveal>
											<GlassCard className="p-6">
												<h3 className="font-mono text-sm font-medium text-muted-foreground mb-6">
													Change Distribution
												</h3>
												<ChangeTypeChart data={data} />
											</GlassCard>
										</Reveal>
									)}
								</Await>
							</Suspense>
							<Suspense
								fallback={
									<DataStreamLoader
										className="h-[400px]"
										text="PLOTTING_TRENDS"
									/>
								}
							>
								<Await promise={releaseTrends}>
									{(data) => (
										<Reveal delay={0.1}>
											<GlassCard className="p-6">
												<h3 className="font-mono text-sm font-medium text-muted-foreground mb-6">
													Release Activity (8 Weeks)
												</h3>
												<ReleaseTrendsChart data={data} />
											</GlassCard>
										</Reveal>
									)}
								</Await>
							</Suspense>
						</div>
					</Section>

					{/* Ingestion Health Section */}
					<Section title="Ingestion Health" delay={0.3}>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
							<StatsCard
								title="Success Rate (7d)"
								value={`${ingestionStats.successRate}%`}
								description="Last 7 days"
								icon={<CheckCircle className="size-4" />}
								trend="neutral"
							/>
							<StatsCard
								title="Avg Duration"
								value={
									ingestionStats.avgDuration > 0
										? `${(ingestionStats.avgDuration / 1000).toFixed(1)}s`
										: '-'
								}
								description="Successful jobs"
								icon={<Clock className="size-4" />}
								trend="neutral"
							/>
							<StatsCard
								title="Total Jobs (7d)"
								value={ingestionStats.totalJobs}
								description={`${ingestionStats.successCount} success / ${ingestionStats.failedCount} failed`}
								icon={<Activity className="size-4" />}
								trend={ingestionStats.failedCount > 0 ? 'down' : 'up'}
							/>
							<Suspense
								fallback={
									<DataStreamLoader className="h-32" text="CHECKING_TOOLS" />
								}
							>
								<Await promise={contentSummary}>
									{(data) => (
										<Reveal>
											<StatsCard
												title="Tools Tracked"
												value={data.totalTools}
												description="Active connectors"
												icon={<Wrench className="size-4" />}
												trend="up"
											/>
										</Reveal>
									)}
								</Await>
							</Suspense>
						</div>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<GlassCard className="p-6">
								<h3 className="font-mono text-sm font-medium text-muted-foreground mb-6">
									Job History
								</h3>
								<IngestionStatsChart
									successCount={ingestionStats.successCount}
									failedCount={ingestionStats.failedCount}
									totalJobs={ingestionStats.totalJobs}
								/>
							</GlassCard>
							<GlassCard className="p-0 overflow-hidden">
								<div className="p-4 border-b border-border/40 bg-muted/20">
									<h3 className="font-mono text-sm font-medium text-muted-foreground">
										Recent Logs
									</h3>
								</div>
								<IngestionTable logs={ingestionOverview} />
							</GlassCard>
						</div>
					</Section>

					{/* Waitlist Section */}
					<Section title="Growth & Community" delay={0.4}>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
							<StatsCard
								title="Total Subscribers"
								value={waitlistStats.totalCount}
								description="All time"
								icon={<Mail className="size-4" />}
								trend="up"
							/>
							<StatsCard
								title="Last 24 Hours"
								value={waitlistStats.last24h}
								description="New subscribers"
								icon={<Zap className="size-4" />}
								trend="up"
							/>
							<StatsCard
								title="Last 7 Days"
								value={waitlistStats.last7d}
								description="New subscribers"
								icon={<Calendar className="size-4" />}
								trend="up"
							/>
						</div>
						<div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
							<Suspense
								fallback={
									<DataStreamLoader
										className="h-[400px]"
										text="PROJECTING_GROWTH"
									/>
								}
							>
								<Await promise={waitlistDailySignups}>
									{(data) => (
										<Reveal>
											<GlassCard className="p-6">
												<h3 className="font-mono text-sm font-medium text-muted-foreground mb-6">
													Growth Trajectory
												</h3>
												<WaitlistChart data={data} />
											</GlassCard>
										</Reveal>
									)}
								</Await>
							</Suspense>
							<GlassCard className="flex flex-col h-full">
								<div className="p-6 border-b border-border/40">
									<h3 className="font-mono text-sm font-medium text-muted-foreground">
										Recent Signups
									</h3>
									<p className="text-xs text-muted-foreground/60 mt-1">
										Latest community members
									</p>
								</div>
								<div className="flex-1 p-0">
									{recentSignups.length > 0 ? (
										<ul className="divide-y divide-border/40">
											{recentSignups.map((signup) => (
												<li
													key={signup.id}
													className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
												>
													<div className="flex items-center gap-3">
														<div className="size-2 rounded-full bg-foreground/20 animate-pulse" />
														<span className="font-mono text-sm text-foreground/80">
															{maskEmail(signup.email)}
														</span>
													</div>
													<span className="text-xs font-mono text-muted-foreground/60">
														{new Date(signup.createdAt).toLocaleDateString()}
													</span>
												</li>
											))}
										</ul>
									) : (
										<div className="p-8 text-center text-muted-foreground text-sm font-mono">
											No signups yet
										</div>
									)}
								</div>
							</GlassCard>
						</div>
					</Section>
				</div>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8 }}
					className="mt-16 border-t border-border/40 pt-8 text-center"
				>
					<p className="font-mono text-xs text-muted-foreground/40">
						SYSTEM_ID: {Math.random().toString(36).substring(7).toUpperCase()} •
						LAST_SYNC:{' '}
						{new Date().toLocaleString('en-US', {
							dateStyle: 'medium',
							timeStyle: 'short',
						})}
					</p>
				</motion.div>
			</div>
		</div>
	)
}

function Section({
	title,
	children,
	delay = 0,
}: {
	title: string
	children: ReactNode
	delay?: number
}) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-100px' }}
			transition={{ duration: 0.5, delay }}
		>
			<div className="flex items-center gap-2 mb-6">
				<div className="size-1.5 rounded-full bg-primary/50" />
				<h2 className="font-mono text-lg font-semibold tracking-tight text-foreground/90">
					{title}
				</h2>
			</div>
			{children}
		</motion.section>
	)
}

function GlassCard({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-xl border border-border/40 bg-background/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/10 shadow-sm transition-all duration-300 hover:border-border/60 hover:bg-background/30 hover:shadow-md',
				className,
			)}
		>
			{children}
		</div>
	)
}

function StatsCard({
	title,
	value,
	description,
	icon,
	trend,
	trendLabel,
}: {
	title: string
	value: string | number
	description?: string
	icon: ReactNode
	trend?: 'up' | 'down' | 'neutral'
	trendLabel?: string
}) {
	return (
		<GlassCard className="p-5 group">
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
						{title}
					</p>
					<div className="flex items-baseline gap-2">
						<h3 className="text-2xl font-bold font-mono tracking-tight text-foreground group-hover:text-primary transition-colors">
							{value}
						</h3>
					</div>
				</div>
				<div
					className={cn(
						'p-2 rounded-lg bg-muted/30 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary',
					)}
				>
					{icon}
				</div>
			</div>
			{(description || trend) && (
				<div className="mt-4 flex items-center gap-2 text-xs">
					{trend && (
						<span
							className={cn(
								'flex items-center gap-1 font-medium px-1.5 py-0.5 rounded-md',
								trend === 'up' && 'text-green-500 bg-green-500/10',
								trend === 'down' && 'text-red-500 bg-red-500/10',
								trend === 'neutral' && 'text-yellow-500 bg-yellow-500/10',
							)}
						>
							{trend === 'up' && '↑'}
							{trend === 'down' && '↓'}
							{trend === 'neutral' && '→'}
							{trendLabel || (trend === 'up' ? 'Good' : 'Review')}
						</span>
					)}
					{description && (
						<span className="text-muted-foreground/60 truncate">
							{description}
						</span>
					)}
				</div>
			)}
		</GlassCard>
	)
}
