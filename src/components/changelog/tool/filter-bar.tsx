import type { ChangeType } from '@prisma/client'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const FILTER_OPTIONS: Array<{ value: ChangeType; label: string }> = [
	{ value: 'FEATURE', label: 'Features' },
	{ value: 'BUGFIX', label: 'Bugfixes' },
	{ value: 'BREAKING', label: 'Breaking' },
	{ value: 'SECURITY', label: 'Security' },
	{ value: 'IMPROVEMENT', label: 'Improvements' },
	{ value: 'PERFORMANCE', label: 'Performance' },
	{ value: 'DEPRECATION', label: 'Deprecated' },
	{ value: 'DOCUMENTATION', label: 'Docs' },
]

const DATE_PRESETS = [
	{ value: '7d', label: '7d' },
	{ value: '30d', label: '30d' },
	{ value: '3mo', label: '3mo' },
	{ value: '6mo', label: '6mo' },
	{ value: '1y', label: '1y' },
	{ value: 'all', label: 'All time' },
] as const

interface FilterBarProps {
	hoveredTypes?: ChangeType[] | null
}

export function FilterBar({ hoveredTypes }: FilterBarProps) {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as {
		type?: string | string[]
		datePreset?: string
		startDate?: string
		endDate?: string
	}

	const [showCustomPicker, setShowCustomPicker] = useState(
		Boolean(search.startDate || search.endDate),
	)

	// Normalize to arrays
	const selectedTypes = search.type
		? Array.isArray(search.type)
			? search.type
			: [search.type]
		: []

	// Calculate date filter count (preset OR custom range counts as 1)
	const dateFilterCount =
		search.datePreset && search.datePreset !== 'all'
			? 1
			: search.startDate || search.endDate
				? 1
				: 0

	const hasActiveFilters = selectedTypes.length > 0 || dateFilterCount > 0

	const toggleType = (type: string) => {
		const newTypes = selectedTypes.includes(type)
			? selectedTypes.filter((t) => t !== type)
			: [...selectedTypes, type]

		const searchObj: Record<string, string | string[]> = { ...search }

		if (newTypes.length > 0) {
			searchObj.type = newTypes.length === 1 ? newTypes[0] : newTypes
		} else {
			delete searchObj.type
		}

		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: searchObj, replace: true, resetScroll: false } as any)
	}

	const setDatePreset = (preset: string) => {
		const searchObj: Record<string, string | string[]> = { ...search }

		if (preset === 'all') {
			delete searchObj.datePreset
			delete searchObj.startDate
			delete searchObj.endDate
		} else {
			searchObj.datePreset = preset
			delete searchObj.startDate
			delete searchObj.endDate
		}

		setShowCustomPicker(false)

		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: searchObj, replace: true, resetScroll: false } as any)
	}

	const setCustomDateRange = (startDate: string, endDate: string) => {
		const searchObj: Record<string, string | string[]> = { ...search }

		if (startDate) {
			searchObj.startDate = startDate
		} else {
			delete searchObj.startDate
		}

		if (endDate) {
			searchObj.endDate = endDate
		} else {
			delete searchObj.endDate
		}

		delete searchObj.datePreset

		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: searchObj, replace: true, resetScroll: false } as any)
	}

	const clearFilters = () => {
		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: {}, replace: true, resetScroll: false } as any)
		setShowCustomPicker(false)
	}

	return (
		<div className="space-y-8">
			{/* Type Filters */}
			<div className="space-y-3">
				<div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
					<span className="text-green-500/50">❯</span>
					<span>FILTER_BY_TYPE</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{FILTER_OPTIONS.map((option) => {
						const isActive = selectedTypes.includes(option.value)
						const isHoveredMatch = hoveredTypes?.includes(option.value) ?? false
						const hasHoveredTypes = hoveredTypes && hoveredTypes.length > 0
						const shouldDim = hasHoveredTypes && !isHoveredMatch

						return (
							<motion.button
								key={option.value}
								type="button"
								onClick={() => toggleType(option.value)}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className={cn(
									'relative px-3 py-1.5 font-mono text-xs transition-all duration-300 border rounded-sm',
									isActive
										? 'bg-foreground text-background border-foreground font-bold'
										: 'bg-transparent text-foreground/60 border-transparent hover:text-foreground hover:border-white/10 hover:bg-white/5',
									isHoveredMatch &&
										!isActive &&
										'text-foreground border-foreground/40 bg-foreground/5',
									shouldDim && 'opacity-30 blur-[0.5px]',
								)}
							>
								{isActive && (
									<motion.span
										layoutId="active-dot"
										className="absolute -top-1 -right-1 size-1.5 rounded-full bg-green-500"
									/>
								)}
								{option.label}
							</motion.button>
						)
					})}
				</div>
			</div>

			{/* Date Filters */}
			<div className="space-y-3">
				<div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
					<span className="text-blue-500/50">❯</span>
					<span>FILTER_BY_DATE</span>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{DATE_PRESETS.map((preset) => {
						const isActive =
							search.datePreset === preset.value ||
							(preset.value === 'all' &&
								!search.datePreset &&
								!search.startDate &&
								!search.endDate)
						return (
							<motion.button
								key={preset.value}
								type="button"
								onClick={() => setDatePreset(preset.value)}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className={cn(
									'relative px-3 py-1.5 font-mono text-xs transition-colors duration-300 border rounded-sm border-transparent',
									isActive
										? 'text-background'
										: 'text-foreground/60 hover:text-foreground hover:bg-white/5',
								)}
							>
								{isActive && (
									<motion.div
										layoutId="date-filter-active"
										className="absolute inset-0 rounded-sm bg-foreground"
										transition={{
											type: 'spring',
											stiffness: 200,
											damping: 25,
											mass: 1.2,
										}}
									/>
								)}
								<span className="relative z-10">{preset.label}</span>
							</motion.button>
						)
					})}

					<div className="h-4 w-px bg-white/10 mx-2" />

					<motion.button
						type="button"
						onClick={() => setShowCustomPicker(!showCustomPicker)}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className={cn(
							'px-3 py-1.5 font-mono text-xs transition-all duration-300 border rounded-sm flex items-center gap-2',
							showCustomPicker || search.startDate || search.endDate
								? 'bg-foreground text-background border-foreground font-bold'
								: 'bg-transparent text-foreground/60 border-transparent hover:text-foreground hover:border-white/10 hover:bg-white/5',
						)}
					>
						<span>CUSTOM_RANGE</span>
						<motion.span
							animate={{ rotate: showCustomPicker ? 180 : 0 }}
							className="text-[10px]"
						>
							▼
						</motion.span>
					</motion.button>
				</div>

				<AnimatePresence>
					{showCustomPicker && (
						<motion.div
							initial={{ opacity: 0, height: 0, y: -10 }}
							animate={{ opacity: 1, height: 'auto', y: 0 }}
							exit={{ opacity: 0, height: 0, y: -10 }}
							className="overflow-hidden"
						>
							<div className="flex items-center gap-4 pt-2 pl-1">
								<div className="relative group">
									<span className="absolute -top-2 left-0 text-[9px] text-muted-foreground/50 font-mono">
										FROM
									</span>
									<input
										type="date"
										value={search.startDate || ''}
										onChange={(e) =>
											setCustomDateRange(e.target.value, search.endDate || '')
										}
										className="bg-transparent border-b border-white/20 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors w-32"
									/>
								</div>
								<span className="text-muted-foreground/30 font-mono">→</span>
								<div className="relative group">
									<span className="absolute -top-2 left-0 text-[9px] text-muted-foreground/50 font-mono">
										TO
									</span>
									<input
										type="date"
										value={search.endDate || ''}
										onChange={(e) =>
											setCustomDateRange(search.startDate || '', e.target.value)
										}
										className="bg-transparent border-b border-white/20 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-foreground transition-colors w-32"
									/>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Active Filters Summary & Clear */}
			<AnimatePresence>
				{hasActiveFilters && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="flex items-center gap-4 pt-4 border-t border-white/5"
					>
						<div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
							<span className="size-1.5 rounded-full bg-accent animate-pulse" />
							<span>
								{selectedTypes.length + dateFilterCount} ACTIVE_FILTERS
							</span>
						</div>
						<button
							type="button"
							onClick={clearFilters}
							className="text-xs font-mono text-red-400/70 hover:text-red-400 hover:underline decoration-red-400/30 underline-offset-4 transition-colors"
						>
							[ CLEAR_ALL ]
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
