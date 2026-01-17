import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
	title: string
	description: string
	status: 'active' | 'coming-soon'
	icon: LucideIcon
	command?: string
	delay?: number
	isSelected?: boolean
	onSelect?: () => void
}

export function FeatureCard({
	title,
	description,
	status,
	icon: Icon,
	command,
	delay = 0,
	isSelected = false,
	onSelect,
}: FeatureCardProps) {
	const isActive = status === 'active'
	const isClickable = isActive && onSelect

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			onClick={isClickable ? onSelect : undefined}
			className={cn(
				'group relative overflow-hidden rounded-xl border p-5 transition-all duration-300',
				'bg-white/[0.02] backdrop-blur-xl',
				isActive
					? 'border-green-500/20 hover:border-green-500/40 hover:bg-green-500/[0.02]'
					: 'border-white/10 hover:border-white/20 hover:bg-white/[0.03]',
				isClickable && 'cursor-pointer',
				!isActive && 'cursor-not-allowed opacity-70',
				isSelected && 'ring-1 ring-green-500/50 border-green-500/40',
			)}
		>
			{/* Status indicator */}
			<div className="mb-3 flex items-center justify-between">
				<div
					className={cn(
						'flex items-center gap-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
						isActive
							? 'bg-green-500/10 text-green-500'
							: 'bg-amber-500/10 text-amber-500',
					)}
				>
					<span
						className={cn(
							'size-1.5 rounded-full',
							isActive ? 'bg-green-500 animate-pulse' : 'bg-amber-500',
						)}
					/>
					{isActive ? 'Active' : 'Coming Soon'}
				</div>
				<div
					className={cn(
						'rounded-lg p-2 transition-all duration-300',
						isActive
							? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20'
							: 'bg-white/5 text-muted-foreground',
					)}
				>
					<Icon className="size-4" />
				</div>
			</div>

			{/* Content */}
			<h3 className="mb-1.5 font-mono text-base font-semibold text-foreground">
				{title}
			</h3>
			<p className="mb-3 font-mono text-xs leading-relaxed text-muted-foreground">
				{description}
			</p>

			{/* Command preview */}
			{command && (
				<div
					className={cn(
						'rounded-md border px-2.5 py-1.5 font-mono text-[11px]',
						isActive
							? 'border-green-500/20 bg-green-500/5 text-green-400'
							: 'border-white/10 bg-white/5 text-muted-foreground',
					)}
				>
					<span className="text-muted-foreground/60">$</span> {command}
				</div>
			)}

			{/* Footer action / status */}
			<div
				className={cn(
					'mt-3 flex items-center gap-1 font-mono text-[10px] transition-colors',
					isActive
						? 'text-green-500/60 group-hover:text-green-500'
						: 'text-muted-foreground/30',
				)}
			>
				{isActive ? (
					<>
						<span>Click to preview</span>
						<span>→</span>
					</>
				) : (
					<span>Coming soon</span>
				)}
			</div>

			{/* Decorative gradient */}
			<div
				className={cn(
					'pointer-events-none absolute -bottom-12 -right-12 size-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100',
					isActive ? 'bg-green-500/20' : 'bg-white/5',
				)}
			/>
		</motion.div>
	)
}
