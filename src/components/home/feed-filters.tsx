import { cn } from '@/lib/utils'

const CHANGE_TYPES = [
	{ value: null, label: 'All' },
	{ value: 'FEATURE', label: 'Features' },
	{ value: 'BUGFIX', label: 'Bugfixes' },
	{ value: 'BREAKING', label: 'Breaking' },
	{ value: 'SECURITY', label: 'Security' },
	{ value: 'IMPROVEMENT', label: 'Improvements' },
	{ value: 'DOCUMENTATION', label: 'Docs' },
] as const

interface FeedFiltersProps {
	selectedTypes: string[]
	onTypeChange: (types: string[]) => void
	showPrereleases: boolean
	onShowPrereleasesChange: (show: boolean) => void
	className?: string
}

export function FeedFilters({
	selectedTypes,
	onTypeChange,
	showPrereleases,
	onShowPrereleasesChange,
	className,
}: FeedFiltersProps) {
	const handleToggle = (value: string | null) => {
		if (value === null) {
			// "All" selected - clear filters
			onTypeChange([])
		} else {
			// Toggle individual type
			if (selectedTypes.includes(value)) {
				onTypeChange(selectedTypes.filter((t) => t !== value))
			} else {
				onTypeChange([...selectedTypes, value])
			}
		}
	}

	const isActive = (value: string | null) => {
		if (value === null) {
			return selectedTypes.length === 0
		}
		return selectedTypes.includes(value)
	}

	return (
		<div className={cn('flex flex-wrap items-center gap-2', className)}>
			<span className="text-sm text-muted-foreground font-mono mr-2">
				Filter:
			</span>
			{CHANGE_TYPES.map(({ value, label }) => (
				<button
					key={value || 'all'}
					type="button"
					onClick={() => handleToggle(value)}
					className={cn(
						'rounded cursor-pointer border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-300 ease-out',
						isActive(value)
							? 'border-foreground/30 bg-accent text-foreground'
							: 'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground',
					)}
				>
					{label}
				</button>
			))}

			<div className="h-4 w-px bg-border mx-2" />

			<button
				type="button"
				onClick={() => onShowPrereleasesChange(!showPrereleases)}
				className={cn(
					'rounded cursor-pointer border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-300 ease-out',
					!showPrereleases
						? 'border-foreground/30 bg-accent text-foreground'
						: 'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground',
				)}
			>
				Stable Only
			</button>
		</div>
	)
}
