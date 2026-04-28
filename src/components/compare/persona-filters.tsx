import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type UsageLevel = 'light' | 'daily' | 'power'
export type ModelTier = 'free' | 'budget' | 'standard' | 'frontier'
export type StylePreference = 'terminal' | 'ide'

export interface FilterState {
	usage: UsageLevel
	models: ModelTier
	style?: StylePreference
	privacy: boolean
}

interface PersonaFiltersProps {
	filters: FilterState
	onFilterChange: (filters: FilterState) => void
	className?: string
}

const usageOptions: { value: UsageLevel; label: string }[] = [
	{ value: 'light', label: 'Light' },
	{ value: 'daily', label: 'Daily' },
	{ value: 'power', label: 'Power' },
]

const modelOptions: { value: ModelTier; label: string }[] = [
	{ value: 'free', label: 'Free' },
	{ value: 'standard', label: 'Standard' },
	{ value: 'frontier', label: 'Frontier' },
]

export function PersonaFilters({
	filters,
	onFilterChange,
	className,
}: PersonaFiltersProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className={cn(
				'flex flex-col gap-6 md:flex-row md:items-start md:gap-8',
				className,
			)}
		>
			{/* Usage Argument */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
				<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
					--usage
				</span>
				<div className="flex flex-wrap gap-1">
					{usageOptions.map((option) => (
						<FilterButton
							key={option.value}
							active={filters.usage === option.value}
							onClick={() =>
								onFilterChange({ ...filters, usage: option.value })
							}
						>
							{option.label}
						</FilterButton>
					))}
				</div>
			</div>

			{/* Models Argument */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
				<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
					--models
				</span>
				<div className="flex flex-wrap gap-1">
					{modelOptions.map((option) => {
						const isDisabled =
							option.value === 'free' &&
							(filters.usage === 'daily' || filters.usage === 'power')

						return (
							<FilterButton
								key={option.value}
								active={filters.models === option.value}
								disabled={isDisabled}
								onClick={() =>
									onFilterChange({ ...filters, models: option.value })
								}
								title={
									isDisabled
										? 'Free tier is not suitable for daily/power usage'
										: undefined
								}
							>
								{option.label}
							</FilterButton>
						)
					})}
				</div>
			</div>

			{/* Privacy Flag */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
				<span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
					--privacy
				</span>
				<FilterButton
					active={filters.privacy}
					onClick={() =>
						onFilterChange({ ...filters, privacy: !filters.privacy })
					}
				>
					{filters.privacy ? 'REQUIRED' : 'FALSE'}
				</FilterButton>
			</div>
		</motion.div>
	)
}

function FilterButton({
	children,
	active,
	onClick,
	disabled,
	title,
}: {
	children: React.ReactNode
	active: boolean
	onClick: () => void
	disabled?: boolean
	title?: string
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn(
				'rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-all border',
				active
					? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_-4px_rgba(34,197,94,0.5)]'
					: 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5',
				disabled &&
					'opacity-50 cursor-not-allowed hover:text-muted-foreground hover:bg-transparent',
			)}
		>
			{children}
		</button>
	)
}
