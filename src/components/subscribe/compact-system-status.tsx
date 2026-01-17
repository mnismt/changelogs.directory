import { ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { cn, maskEmail } from '@/lib/utils'

interface CompactSystemStatusProps {
	totalSubscribers: number
	last7d: number
	last24h: number
	recentSignups: Array<{
		id: string
		email: string
		createdAt: Date
	}>
	className?: string
}

function getNextMilestone(current: number): number {
	const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000]
	for (const m of milestones) {
		if (current < m) return m
	}
	return Math.ceil(current / 100000) * 100000 + 100000
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

export function CompactSystemStatus({
	totalSubscribers,
	last7d,
	last24h,
	recentSignups,
	className,
}: CompactSystemStatusProps) {
	const [isOpen, setIsOpen] = useState(false)
	const milestone = getNextMilestone(totalSubscribers)
	const progress = (totalSubscribers / milestone) * 100

	return (
		<>
			{/* Compact summary bar */}
			<motion.button
				type="button"
				onClick={() => setIsOpen(true)}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
				whileTap={{ scale: 0.98 }}
				className={cn(
					'group w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.03] md:hidden',
					className,
				)}
			>
				<div className="flex items-center gap-3">
					{/* Status indicator */}
					<div className="flex gap-0.5">
						<span className="size-1.5 animate-pulse rounded-full bg-green-500" />
						<span className="size-1.5 rounded-full bg-green-500/60" />
						<span className="size-1.5 rounded-full bg-green-500/30" />
					</div>

					{/* Stats */}
					<div className="flex items-center gap-2 font-mono text-xs">
						<span className="text-foreground font-semibold">
							{totalSubscribers}
						</span>
						<span className="text-muted-foreground/60">/</span>
						<span className="text-muted-foreground">{milestone}</span>
						<span className="text-muted-foreground/40">•</span>
						<span className="text-green-500">+{last7d}</span>
						<span className="text-muted-foreground/60 text-[10px]">
							this week
						</span>
					</div>
				</div>

				{/* Expand indicator */}
				<ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
			</motion.button>

			{/* Bottom sheet */}
			<SystemStatusSheet
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				totalSubscribers={totalSubscribers}
				milestone={milestone}
				progress={progress}
				last7d={last7d}
				last24h={last24h}
				recentSignups={recentSignups}
			/>
		</>
	)
}

interface SystemStatusSheetProps {
	isOpen: boolean
	onClose: () => void
	totalSubscribers: number
	milestone: number
	progress: number
	last7d: number
	last24h: number
	recentSignups: Array<{
		id: string
		email: string
		createdAt: Date
	}>
}

function SystemStatusSheet({
	isOpen,
	onClose,
	totalSubscribers,
	milestone,
	progress,
	last7d,
	last24h,
	recentSignups,
}: SystemStatusSheetProps) {
	const dragControls = useDragControls()
	const [dragY, setDragY] = useState(0)

	const handleDragEnd = useCallback(
		(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
			if (info.offset.y > 100 || info.velocity.y > 500) {
				onClose()
			}
			setDragY(0)
		},
		[onClose],
	)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			document.body.dataset.bottomSheetOpen = 'true'
		} else {
			document.body.style.overflow = ''
			delete document.body.dataset.bottomSheetOpen
		}
		return () => {
			document.body.style.overflow = ''
			delete document.body.dataset.bottomSheetOpen
		}
	}, [isOpen])

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}
		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [isOpen, onClose])

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
					/>

					{/* Sheet */}
					<motion.div
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={{
							type: 'spring',
							stiffness: 300,
							damping: 30,
						}}
						drag="y"
						dragControls={dragControls}
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={{ top: 0, bottom: 0.5 }}
						onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
						onDragEnd={handleDragEnd}
						style={{ y: dragY }}
						className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl md:hidden"
					>
						{/* Drag handle */}
						<div className="flex justify-center py-3">
							<div className="h-1 w-10 rounded-full bg-white/20" />
						</div>

						{/* Header */}
						<div className="flex items-center justify-between border-b border-white/10 px-4 pb-3">
							<div className="flex items-center gap-2">
								<div className="flex gap-1.5">
									<div className="size-3 rounded-full border border-red-500/50 bg-red-500/20" />
									<div className="size-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
									<div className="size-3 rounded-full border border-green-500/50 bg-green-500/20" />
								</div>
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									changelogs --stats
								</span>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
							>
								<X className="size-4" />
							</button>
						</div>

						{/* Content */}
						<div className="overflow-y-auto p-4 space-y-5">
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
										transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
										className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400"
									/>
								</div>
								<p className="mt-1.5 font-mono text-[10px] text-muted-foreground/60">
									{milestone - totalSubscribers} to go until milestone
								</p>
							</div>

							{/* Stats grid */}
							<div className="grid grid-cols-2 gap-3">
								<StatBox label="This week" value={`+${last7d}`} trend="up" />
								<StatBox label="Last 24h" value={`+${last24h}`} trend="up" />
							</div>

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
												delay: 0.3 + index * 0.1,
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
							<div className="flex items-center gap-2 pt-2 border-t border-white/5">
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
				</>
			)}
		</AnimatePresence>
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
