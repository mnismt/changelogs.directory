import type { ChangeType } from '@prisma/client'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

const PLATFORM_OPTIONS = [
	{ value: 'windows', label: 'Windows' },
	{ value: 'macos', label: 'macOS' },
	{ value: 'linux', label: 'Linux' },
	{ value: 'vscode', label: 'VSCode' },
	{ value: 'ide', label: 'IDE' },
]

interface FilterBarProps {
	showPlatformFilter?: boolean
}

export function FilterBar({ showPlatformFilter = false }: FilterBarProps) {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as {
		type?: string | string[]
		platform?: string | string[]
	}

	// Normalize to arrays
	const selectedTypes = search.type
		? Array.isArray(search.type)
			? search.type
			: [search.type]
		: []
	const selectedPlatforms = search.platform
		? Array.isArray(search.platform)
			? search.platform
			: [search.platform]
		: []

	const hasActiveFilters =
		selectedTypes.length > 0 || selectedPlatforms.length > 0

	const toggleType = (type: string) => {
		const newTypes = selectedTypes.includes(type)
			? selectedTypes.filter((t) => t !== type)
			: [...selectedTypes, type]

		const searchObj: Record<string, string | string[]> = {}

		if (newTypes.length > 0) {
			searchObj.type = newTypes.length === 1 ? newTypes[0] : newTypes
		}

		if (selectedPlatforms.length > 0) {
			searchObj.platform =
				selectedPlatforms.length === 1
					? selectedPlatforms[0]
					: selectedPlatforms
		}

		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: searchObj } as any)
	}

	const togglePlatform = (platform: string) => {
		const newPlatforms = selectedPlatforms.includes(platform)
			? selectedPlatforms.filter((p) => p !== platform)
			: [...selectedPlatforms, platform]

		const searchObj: Record<string, string | string[]> = {}

		if (selectedTypes.length > 0) {
			searchObj.type =
				selectedTypes.length === 1 ? selectedTypes[0] : selectedTypes
		}

		if (newPlatforms.length > 0) {
			searchObj.platform =
				newPlatforms.length === 1 ? newPlatforms[0] : newPlatforms
		}

		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: searchObj } as any)
	}

	const clearFilters = () => {
		// biome-ignore lint/suspicious/noExplicitAny: TanStack Router search typing is complex
		navigate({ search: {} } as any)
	}

	return (
		<div className="space-y-4 border-b border-border pb-6">
			{/* Change Type Filters */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-muted-foreground">
					Filter by type
				</h3>
				<div className="flex flex-wrap gap-2">
					{FILTER_OPTIONS.map((option) => {
						const isActive = selectedTypes.includes(option.value)
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => toggleType(option.value)}
								className="group"
							>
								<Badge
									variant={isActive ? 'default' : 'outline'}
									className={`cursor-pointer font-mono text-xs uppercase transition-colors ${
										isActive
											? 'bg-foreground text-background'
											: 'hover:border-accent'
									}`}
								>
									{option.label}
								</Badge>
							</button>
						)
					})}
				</div>
			</div>

			{/* Platform Filters */}
			{showPlatformFilter && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-muted-foreground">
						Filter by platform
					</h3>
					<div className="flex flex-wrap gap-2">
						{PLATFORM_OPTIONS.map((option) => {
							const isActive = selectedPlatforms.includes(option.value)
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => togglePlatform(option.value)}
									className="group"
								>
									<Badge
										variant={isActive ? 'default' : 'outline'}
										className={`cursor-pointer font-mono text-xs uppercase transition-colors ${
											isActive
												? 'bg-foreground text-background'
												: 'hover:border-accent'
										}`}
									>
										{option.label}
									</Badge>
								</button>
							)
						})}
					</div>
				</div>
			)}

			{/* Clear Filters */}
			{hasActiveFilters && (
				<Button
					variant="outline"
					size="sm"
					onClick={clearFilters}
					className="font-mono text-xs"
				>
					<X className="mr-1 h-3 w-3" />
					Clear filters
				</Button>
			)}
		</div>
	)
}
