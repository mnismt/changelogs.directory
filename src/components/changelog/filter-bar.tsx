import type { ChangeType } from '@prisma/client'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Calendar, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'

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

interface DatePreset {
	label: string
	value: string
	getDates: () => { from: Date; to: Date }
}

const DATE_PRESETS: DatePreset[] = [
	{
		label: '7d',
		value: '7d',
		getDates: () => {
			const to = new Date()
			const from = new Date()
			from.setDate(from.getDate() - 7)
			return { from, to }
		},
	},
	{
		label: '30d',
		value: '30d',
		getDates: () => {
			const to = new Date()
			const from = new Date()
			from.setDate(from.getDate() - 30)
			return { from, to }
		},
	},
	{
		label: '3mo',
		value: '3mo',
		getDates: () => {
			const to = new Date()
			const from = new Date()
			from.setMonth(from.getMonth() - 3)
			return { from, to }
		},
	},
	{
		label: '6mo',
		value: '6mo',
		getDates: () => {
			const to = new Date()
			const from = new Date()
			from.setMonth(from.getMonth() - 6)
			return { from, to }
		},
	},
	{
		label: '1y',
		value: '1y',
		getDates: () => {
			const to = new Date()
			const from = new Date()
			from.setFullYear(from.getFullYear() - 1)
			return { from, to }
		},
	},
	{
		label: 'All time',
		value: 'all',
		getDates: () => {
			// Return far past and future dates to effectively show all
			const from = new Date('2000-01-01')
			const to = new Date()
			to.setFullYear(to.getFullYear() + 1)
			return { from, to }
		},
	},
]

export function FilterBar() {
	const dateFromId = useId()
	const dateToId = useId()
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as {
		type?: string | string[]
		platform?: string | string[]
		dateFrom?: string
		dateTo?: string
		datePreset?: string
	}

	const [showCustomRange, setShowCustomRange] = useState(false)

	// Normalize to arrays
	const selectedTypes = search.type
		? Array.isArray(search.type)
			? search.type
			: [search.type]
		: []

	// Determine active date preset
	const activeDatePreset = search.datePreset || 'all'

	const hasActiveFilters =
		selectedTypes.length > 0 ||
		(activeDatePreset !== 'all' && activeDatePreset !== undefined)

	const activeFilterCount =
		selectedTypes.length + (activeDatePreset !== 'all' ? 1 : 0)

	const toggleType = (type: string) => {
		const newTypes = selectedTypes.includes(type)
			? selectedTypes.filter((t) => t !== type)
			: [...selectedTypes, type]

		updateFilters({ types: newTypes })
	}

	const setDatePreset = (preset: string) => {
		if (preset === 'custom') {
			setShowCustomRange(true)
			return
		}

		const presetConfig = DATE_PRESETS.find((p) => p.value === preset)
		if (!presetConfig) return

		const { from, to } = presetConfig.getDates()

		updateFilters({
			dateFrom: preset === 'all' ? undefined : from.toISOString(),
			dateTo: preset === 'all' ? undefined : to.toISOString(),
			datePreset: preset,
		})
		setShowCustomRange(false)
	}

	const applyCustomDateRange = (from: string, to: string) => {
		updateFilters({
			dateFrom: from ? new Date(from).toISOString() : undefined,
			dateTo: to ? new Date(to).toISOString() : undefined,
			datePreset: 'custom',
		})
	}

	const updateFilters = (updates: {
		types?: string[]
		dateFrom?: string
		dateTo?: string
		datePreset?: string
	}) => {
		const searchObj: Record<string, string | string[]> = {}

		const types = updates.types !== undefined ? updates.types : selectedTypes

		if (types.length > 0) {
			searchObj.type = types.length === 1 ? types[0] : types
		}

		if (updates.dateFrom !== undefined) {
			searchObj.dateFrom = updates.dateFrom
		} else if (search.dateFrom) {
			searchObj.dateFrom = search.dateFrom
		}

		if (updates.dateTo !== undefined) {
			searchObj.dateTo = updates.dateTo
		} else if (search.dateTo) {
			searchObj.dateTo = search.dateTo
		}

		if (updates.datePreset !== undefined && updates.datePreset !== 'all') {
			searchObj.datePreset = updates.datePreset
		}

		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: searchObj } as any)
	}

	const clearFilters = () => {
		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: {} } as any)
		setShowCustomRange(false)
	}

	return (
		<div className="space-y-6 border-b border-border pb-6">
			{/* Change Type Filters */}
			<div className="space-y-3">
				<h3 className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Filter by Type
				</h3>
				<ButtonGroup>
					{FILTER_OPTIONS.map((option) => {
						const isActive = selectedTypes.includes(option.value)
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => toggleType(option.value)}
							>
								<Badge
									variant={isActive ? 'default' : 'outline'}
									className={`cursor-pointer font-mono text-xs uppercase transition-colors ${
										isActive
											? 'bg-foreground text-background hover:bg-foreground/90'
											: 'border-border bg-secondary hover:border-accent'
									}`}
								>
									{option.label}
								</Badge>
							</button>
						)
					})}
				</ButtonGroup>
			</div>

			{/* Date Range Filters */}
			<div className="space-y-3">
				<h3 className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Filter by Date
				</h3>
				<ButtonGroup>
					{DATE_PRESETS.map((preset) => {
						const isActive = activeDatePreset === preset.value
						return (
							<button
								key={preset.value}
								type="button"
								onClick={() => setDatePreset(preset.value)}
							>
								<Badge
									variant={isActive ? 'default' : 'outline'}
									className={`cursor-pointer font-mono text-xs uppercase transition-colors ${
										isActive
											? 'bg-foreground text-background hover:bg-foreground/90'
											: 'border-border bg-secondary hover:border-accent'
									}`}
								>
									{preset.label}
								</Badge>
							</button>
						)
					})}
					<button
						type="button"
						onClick={() => setShowCustomRange(!showCustomRange)}
					>
						<Badge
							variant={activeDatePreset === 'custom' ? 'default' : 'outline'}
							className={`cursor-pointer font-mono text-xs uppercase transition-colors ${
								activeDatePreset === 'custom'
									? 'bg-foreground text-background hover:bg-foreground/90'
									: 'border-border bg-secondary hover:border-accent'
							}`}
						>
							<Calendar className="mr-1 h-3 w-3" />
							Custom
						</Badge>
					</button>
				</ButtonGroup>

				{/* Custom Date Range Inputs */}
				{showCustomRange && (
					<div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/50 p-4">
						<div className="flex items-center gap-2">
							<label
								htmlFor={dateFromId}
								className="font-mono text-xs text-muted-foreground"
							>
								From:
							</label>
							<Input
								id={dateFromId}
								type="date"
								defaultValue={
									search.dateFrom
										? new Date(search.dateFrom).toISOString().split('T')[0]
										: ''
								}
								className="h-8 w-40 border-border bg-secondary font-mono text-xs"
								onChange={(e) => {
									const to = search.dateTo || new Date().toISOString()
									applyCustomDateRange(e.target.value, to)
								}}
							/>
						</div>
						<div className="flex items-center gap-2">
							<label
								htmlFor={dateToId}
								className="font-mono text-xs text-muted-foreground"
							>
								To:
							</label>
							<Input
								id={dateToId}
								type="date"
								defaultValue={
									search.dateTo
										? new Date(search.dateTo).toISOString().split('T')[0]
										: new Date().toISOString().split('T')[0]
								}
								className="h-8 w-40 border-border bg-secondary font-mono text-xs"
								onChange={(e) => {
									const from =
										search.dateFrom || new Date('2000-01-01').toISOString()
									applyCustomDateRange(from, e.target.value)
								}}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Active Filters Summary & Clear */}
			{hasActiveFilters && (
				<div className="flex items-center gap-3">
					<Badge
						variant="outline"
						className="border-accent bg-accent/10 font-mono text-xs"
					>
						{activeFilterCount} active
					</Badge>
					<Button
						variant="outline"
						size="sm"
						onClick={clearFilters}
						className="h-7 border-border font-mono text-xs hover:border-accent"
					>
						<X className="mr-1 h-3 w-3" />
						Clear all
					</Button>
				</div>
			)}
		</div>
	)
}
