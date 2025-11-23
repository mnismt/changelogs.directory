import type { ChangeType } from '@prisma/client'

interface ChangeCountProps {
	changeCount: number
	changesByType?: Record<string, number>
}

// Label mapping for each change type with singular/plural forms
const changeTypeLabels: Record<
	ChangeType,
	{ singular: string; plural: string }
> = {
	BREAKING: { singular: 'breaking change', plural: 'breaking changes' },
	SECURITY: { singular: 'security fix', plural: 'security fixes' },
	FEATURE: { singular: 'feature', plural: 'features' },
	IMPROVEMENT: { singular: 'improvement', plural: 'improvements' },
	PERFORMANCE: {
		singular: 'performance improvement',
		plural: 'performance improvements',
	},
	BUGFIX: { singular: 'bug fix', plural: 'bug fixes' },
	DEPRECATION: { singular: 'deprecation', plural: 'deprecations' },
	DOCUMENTATION: {
		singular: 'documentation update',
		plural: 'documentation updates',
	},
	OTHER: { singular: 'other change', plural: 'other changes' },
}

// Order of change types by importance/severity
const changeTypeOrder: ChangeType[] = [
	'BREAKING',
	'SECURITY',
	'FEATURE',
	'IMPROVEMENT',
	'PERFORMANCE',
	'BUGFIX',
	'DEPRECATION',
	'DOCUMENTATION',
	'OTHER',
]

export function ChangeCount({ changeCount, changesByType }: ChangeCountProps) {
	// Build the expanded breakdown text
	const buildBreakdown = () => {
		if (!changesByType || Object.keys(changesByType).length === 0) {
			return null
		}

		const parts: string[] = []

		// Order by importance and filter out zero counts
		for (const type of changeTypeOrder) {
			const count = changesByType[type]
			if (count && count > 0) {
				const labels = changeTypeLabels[type]
				const label = count === 1 ? labels.singular : labels.plural
				parts.push(`${count} ${label}`)
			}
		}

		return parts.length > 0 ? parts.join(', ') : null
	}

	const breakdown = buildBreakdown()
	const hasBreakdown = breakdown !== null

	// Build full text for screen readers
	const ariaLabel = hasBreakdown
		? `${changeCount} ${changeCount === 1 ? 'change' : 'changes'}: ${breakdown}`
		: `${changeCount} ${changeCount === 1 ? 'change' : 'changes'}`

	return (
		<span className="text-muted-foreground" title={ariaLabel}>
			{/* Collapsed state - always visible */}
			<span className="inline">
				{changeCount} {changeCount === 1 ? 'change' : 'changes'}
			</span>

			{/* Expanded state - smooth fade in on hover (desktop) or always visible (mobile) */}
			{hasBreakdown && (
				<>
					<span className="inline opacity-100 transition-all duration-300 ease-in-out sm:max-w-0 sm:overflow-hidden sm:opacity-0 sm:group-hover:max-w-xs sm:group-hover:opacity-100">
						{' '}
						•{' '}
					</span>
					<span className="inline opacity-100 transition-all duration-300 ease-in-out sm:max-w-0 sm:overflow-hidden sm:opacity-0 sm:group-hover:max-w-xl sm:group-hover:opacity-100">
						{breakdown}
					</span>
				</>
			)}
		</span>
	)
}
