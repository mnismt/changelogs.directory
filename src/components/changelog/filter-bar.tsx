import type { ChangeType } from '@prisma/client'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Calendar, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

const DATE_PRESETS = [
	{ value: '7d', label: '7d' },
	{ value: '30d', label: '30d' },
	{ value: '3mo', label: '3mo' },
	{ value: '6mo', label: '6mo' },
	{ value: '1y', label: '1y' },
	{ value: 'all', label: 'All time' },
] as const

export function FilterBar() {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as {
		type?: string | string[]
		platform?: string | string[]
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
	const activeFilterCount = selectedTypes.length + dateFilterCount

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
		navigate({ search: searchObj } as any)
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
		navigate({ search: searchObj } as any)
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
		navigate({ search: searchObj } as any)
	}

	const clearFilters = () => {
		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: {} } as any)
		setShowCustomPicker(false)
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
						const isActive =
							search.datePreset === preset.value ||
							(preset.value === 'all' &&
								!search.datePreset &&
								!search.startDate &&
								!search.endDate)
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
					<Collapsible
						open={showCustomPicker}
						onOpenChange={setShowCustomPicker}
					>
						<CollapsibleTrigger asChild>
							<button type="button">
								<Badge
									variant={
										showCustomPicker || search.startDate || search.endDate
											? 'default'
											: 'outline'
									}
									className={`cursor-pointer font-mono text-xs uppercase transition-colors ${
										showCustomPicker || search.startDate || search.endDate
											? 'bg-foreground text-background hover:bg-foreground/90'
											: 'border-border bg-secondary hover:border-accent'
									}`}
								>
									<Calendar className="mr-1 h-3 w-3" />
									Custom
								</Badge>
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="mt-3 space-y-2">
							<div className="flex flex-col gap-2 sm:flex-row">
								<Input
									type="date"
									placeholder="Start date"
									value={search.startDate || ''}
									onChange={(e) =>
										setCustomDateRange(e.target.value, search.endDate || '')
									}
									className="font-mono text-xs"
								/>
								<Input
									type="date"
									placeholder="End date"
									value={search.endDate || ''}
									onChange={(e) =>
										setCustomDateRange(search.startDate || '', e.target.value)
									}
									className="font-mono text-xs"
								/>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</ButtonGroup>
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
