import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { VelocityStats } from '@/server/compare'
import { SectionHeader } from './shared/section-header'
import { ToolLogo } from './tool-logo'

interface VelocitySectionProps {
	velocityStats: VelocityStats[]
}

export function VelocitySection({ velocityStats }: VelocitySectionProps) {
	const maxReleases = Math.max(
		...velocityStats.map((s) => s.avgReleasesPerMonth),
		1,
	)

	const sortedStats = [...velocityStats].sort(
		(a, b) => b.avgReleasesPerMonth - a.avgReleasesPerMonth,
	)

	return (
		<section className="py-12">
			<SectionHeader
				title="Development Velocity"
				subtitle="We've tracked every release. Here's who ships fastest."
			/>

			{/* Release Frequency Bars */}
			<div className="mt-8 space-y-4">
				{sortedStats.map((stat, index) => {
					const widthPercent = (stat.avgReleasesPerMonth / maxReleases) * 100
					const isWinner = index === 0

					return (
						<motion.div
							key={stat.toolSlug}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							className="flex items-center gap-4"
						>
							<div className="flex w-28 shrink-0 items-center gap-2 font-mono text-sm font-medium uppercase text-foreground">
								<ToolLogo slug={stat.toolSlug} className="h-4 w-4" />
								{stat.toolSlug}
							</div>
							<div className="relative h-8 flex-1 rounded bg-background/30">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${widthPercent}%` }}
									transition={{ duration: 0.8, delay: index * 0.1 }}
									className={cn(
										'absolute inset-y-0 left-0 rounded',
										isWinner ? 'bg-green-500/40' : 'bg-primary/20',
									)}
								/>
								<div className="absolute inset-y-0 flex items-center px-3">
									<span className="font-mono text-sm text-foreground">
										{stat.avgReleasesPerMonth.toFixed(1)}/mo
									</span>
									{isWinner && (
										<span className="ml-2 text-xs text-green-400">Fastest</span>
									)}
								</div>
							</div>
						</motion.div>
					)
				})}
			</div>

			{/* Change Breakdown Table */}
			<div className="mt-12">
				<h3 className="mb-4 font-mono text-sm uppercase tracking-wider text-muted-foreground">
					Last 30 Days
				</h3>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[500px] border-collapse font-mono text-sm">
						<thead>
							<tr className="border-b border-border/40">
								<th className="py-2 pr-4 text-left text-muted-foreground">
									Tool
								</th>
								<th className="px-4 py-2 text-center text-green-400">
									Features
								</th>
								<th className="px-4 py-2 text-center text-blue-400">
									Bugfixes
								</th>
								<th className="px-4 py-2 text-center text-red-400">Breaking</th>
							</tr>
						</thead>
						<tbody>
							{velocityStats.map((stat) => (
								<motion.tr
									key={stat.toolSlug}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="border-b border-border/20"
								>
									<td className="py-2 pr-4 font-medium uppercase text-foreground">
										<div className="flex items-center gap-2">
											<ToolLogo slug={stat.toolSlug} className="h-4 w-4" />
											{stat.toolSlug}
										</div>
									</td>
									<td className="px-4 py-2 text-center text-green-400">
										+{stat.changesLast30Days.features}
									</td>
									<td className="px-4 py-2 text-center text-blue-400">
										+{stat.changesLast30Days.fixes}
									</td>
									<td className="px-4 py-2 text-center text-red-400">
										{stat.changesLast30Days.breaking}
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Velocity Insight */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.6 }}
				className="mt-8 rounded border border-border/30 bg-background/20 p-4"
			>
				<p className="font-mono text-sm italic text-muted-foreground">
					{getVelocityInsight(sortedStats)}
				</p>
			</motion.div>
		</section>
	)
}

function getVelocityInsight(stats: VelocityStats[]): string {
	if (stats.length === 0) {
		return '"Not enough release data to draw conclusions yet."'
	}
	const fastest = stats[0]
	const slowest = stats[stats.length - 1]

	if (fastest.avgReleasesPerMonth > slowest.avgReleasesPerMonth * 2) {
		return `"${fastest.toolSlug} ships ${(fastest.avgReleasesPerMonth / slowest.avgReleasesPerMonth).toFixed(1)}x faster than ${slowest.toolSlug}. Fast iteration means bugs get fixed quickly — but also introduced quickly."`
	}
	return '"All tools are shipping at a similar pace. Competition is fierce."'
}
