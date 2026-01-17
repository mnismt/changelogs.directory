import { motion } from 'motion/react'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { cn, maskEmail } from '@/lib/utils'

interface SystemMonitorProps {
	totalSubscribers: number
	last24h: number
	last7d: number
	recentSignups: Array<{
		id: string
		email: string
		createdAt: Date
	}>
	className?: string
}

function formatRelativeTime(date: Date): string {
	const now = new Date()
	const diffMs = now.getTime() - new Date(date).getTime()
	const diffMins = Math.floor(diffMs / (1000 * 60))
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffMins < 1) return 'just now'
	if (diffMins < 60) return `${diffMins}m ago`
	if (diffHours < 24) return `${diffHours}h ago`
	if (diffDays === 1) return '1 day ago'
	return `${diffDays} days ago`
}

function getNextMilestone(current: number): number {
	// Focus on meaningful milestones: 100, 500, 1000, 5000, 10000...
	const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000]
	for (const m of milestones) {
		if (current < m) return m
	}
	return Math.ceil(current / 100000) * 100000 + 100000
}

export function SystemMonitor({
	totalSubscribers,
	last24h,
	last7d,
	recentSignups,
	className,
}: SystemMonitorProps) {
	const milestone = getNextMilestone(totalSubscribers)
	const progress = (totalSubscribers / milestone) * 100

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.7 }}
			className={cn(
				'overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl',
				'flex flex-col',
				className,
			)}
		>
			{/* Terminal header */}
			<div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
				<div className="flex gap-1.5">
					<div className="size-3 rounded-full border border-red-500/50 bg-red-500/20" />
					<div className="size-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
					<div className="size-3 rounded-full border border-green-500/50 bg-green-500/20" />
				</div>
				<span className="ml-2 font-mono text-xs text-muted-foreground">
					changelogs --stats
				</span>
			</div>

			<div className="p-5 space-y-5 flex-1 flex flex-col">
				{/* Progress to milestone */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							Subscribers
						</span>
						<span className="font-mono text-xs text-muted-foreground">
							<span className="text-foreground font-semibold">
								{totalSubscribers}
							</span>
							/{milestone}
						</span>
					</div>
					<div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${Math.min(progress, 100)}%` }}
							transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
							className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400"
						/>
					</div>
					<p className="mt-1.5 font-mono text-[10px] text-muted-foreground/60">
						{milestone - totalSubscribers} to go until milestone
					</p>
				</div>

				{/* Divider */}
				<div className="h-px bg-white/10" />

				{/* Stats grid */}
				<div className="grid grid-cols-2 gap-4">
					<StatBox label="This week" value={`+${last7d}`} trend="up" />
					<StatBox label="Last 24h" value={`+${last24h}`} trend="up" />
				</div>

				{/* Divider */}
				<div className="h-px bg-white/10" />

				{/* Recent joins */}
				<div>
					<p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
						Recent joins
					</p>
					<ul className="space-y-2">
						{recentSignups.slice(0, 5).map((signup, index) => (
							<motion.li
								key={signup.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{
									delay: 1 + index * 0.1,
									duration: 0.3,
								}}
								className="group flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<div className="size-1.5 rounded-full bg-green-500/50 transition-colors group-hover:bg-green-500" />
									<EncryptedText
										text={maskEmail(signup.email)}
										className="font-mono text-xs text-foreground/70 transition-colors group-hover:text-foreground"
										revealDelayMs={80 + index * 50}
										flipDelayMs={60}
									/>
								</div>
								<span className="font-mono text-[10px] text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
									{formatRelativeTime(signup.createdAt)}
								</span>
							</motion.li>
						))}
					</ul>
				</div>

				{/* System status footer */}
				<div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-auto">
					<div className="flex gap-1">
						<span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
						<span className="size-1.5 rounded-full bg-green-500/60" />
						<span className="size-1.5 rounded-full bg-green-500/30" />
					</div>
					<span className="font-mono text-[10px] uppercase tracking-wider text-green-500/70">
						System healthy
					</span>
				</div>
			</div>
		</motion.div>
	)
}

function StatBox({
	label,
	value,
	trend,
}: {
	label: string
	value: string
	trend: 'up' | 'down' | 'neutral'
}) {
	return (
		<div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
			<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
				{label}
			</p>
			<div className="mt-1 flex items-center gap-1.5">
				<span className="font-mono text-lg font-semibold text-foreground">
					{value}
				</span>
				<span
					className={cn(
						'font-mono text-xs',
						trend === 'up' && 'text-green-500',
						trend === 'down' && 'text-red-500',
						trend === 'neutral' && 'text-muted-foreground',
					)}
				>
					{trend === 'up' && '↑'}
					{trend === 'down' && '↓'}
					{trend === 'neutral' && '→'}
				</span>
			</div>
		</div>
	)
}
