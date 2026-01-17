import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Feature {
	id: string
	title: string
	description: string
	status: 'active' | 'coming-soon'
	icon: LucideIcon
	command?: string
}

interface FeatureCarouselProps {
	features: Feature[]
	selectedFeatureId: string | null
	onSelectFeature: (id: string) => void
	className?: string
}

export function FeatureCarousel({
	features,
	selectedFeatureId,
	onSelectFeature,
	className,
}: FeatureCarouselProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.5 }}
			className={cn('relative md:hidden', className)}
		>
			{/* Scroll container with proper padding */}
			<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory">
				{features.map((feature, index) => (
					<FeatureCard
						key={feature.id}
						feature={feature}
						isSelected={selectedFeatureId === feature.id}
						onSelect={
							feature.status === 'active'
								? () => onSelectFeature(feature.id)
								: undefined
						}
						isFirst={index === 0}
						isLast={index === features.length - 1}
					/>
				))}
			</div>
		</motion.div>
	)
}

function FeatureCard({
	feature,
	isSelected,
	onSelect,
	isFirst,
	isLast,
}: {
	feature: Feature
	isSelected: boolean
	onSelect?: () => void
	isFirst: boolean
	isLast: boolean
}) {
	const Icon = feature.icon
	const isActive = feature.status === 'active'

	return (
		<motion.button
			type="button"
			onClick={onSelect}
			disabled={!isActive}
			whileTap={isActive ? { scale: 0.98 } : undefined}
			className={cn(
				'group relative shrink-0 snap-start overflow-hidden rounded-xl border p-5 text-left transition-all duration-300',
				'w-[85vw] max-w-[320px] bg-white/[0.02] backdrop-blur-xl',
				isFirst && 'ml-0',
				isLast && 'mr-0',
				isActive
					? 'border-green-500/20 hover:border-green-500/40 hover:bg-green-500/[0.02]'
					: 'border-white/10 hover:border-white/20',
				isActive &&
					isSelected &&
					'ring-1 ring-green-500/50 border-green-500/40',
				!isActive && 'opacity-70 cursor-default',
			)}
		>
			{/* Status + Icon row */}
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
				{feature.title}
			</h3>
			<p className="mb-3 font-mono text-xs leading-relaxed text-muted-foreground">
				{feature.description}
			</p>

			{/* Command preview */}
			{feature.command && (
				<div
					className={cn(
						'rounded-md border px-2.5 py-1.5 font-mono text-[11px]',
						isActive
							? 'border-green-500/20 bg-green-500/5 text-green-400'
							: 'border-white/10 bg-white/5 text-muted-foreground',
					)}
				>
					<span className="text-muted-foreground/60">$</span> {feature.command}
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
						<span>Tap to preview</span>
						<span>→</span>
					</>
				) : (
					<span>Coming soon</span>
				)}
			</div>
		</motion.button>
	)
}
