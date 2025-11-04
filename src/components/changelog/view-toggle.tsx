import { useNavigate, useSearch } from '@tanstack/react-router'
import { Grid3x3, List } from 'lucide-react'

export function ViewToggle() {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as {
		view?: 'grid' | 'timeline'
		type?: string | string[]
		platform?: string | string[]
	}

	const currentView = search.view || 'grid'

	const handleViewChange = (view: 'grid' | 'timeline') => {
		navigate({
			search: {
				...search,
				view,
			},
			// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		} as any)
	}

	return (
		<fieldset
			className="inline-flex gap-1 rounded-lg border border-border bg-card p-1"
			aria-label="View mode toggle"
		>
			<button
				type="button"
				onClick={() => handleViewChange('grid')}
				aria-pressed={currentView === 'grid'}
				className={`flex items-center gap-2 rounded-md px-3 py-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
					currentView === 'grid'
						? 'bg-foreground text-background'
						: 'hover:bg-accent hover:text-foreground'
				}`}
			>
				<Grid3x3 className="h-4 w-4" />
				Grid
			</button>
			<button
				type="button"
				onClick={() => handleViewChange('timeline')}
				aria-pressed={currentView === 'timeline'}
				className={`flex items-center gap-2 rounded-md px-3 py-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
					currentView === 'timeline'
						? 'bg-foreground text-background'
						: 'hover:bg-accent hover:text-foreground'
				}`}
			>
				<List className="h-4 w-4" />
				Timeline
			</button>
		</fieldset>
	)
}
