import { CompareRow } from '@/components/compare/compare-row'
import type { ToolPlanGroup } from '@/data/tool-plans'

interface CompareSectionProps {
	groups: ToolPlanGroup[]
	onOpen: (slug: string) => void
	compareMode?: boolean
	selectedSlugs?: string[]
	onToggleSelect?: (slug: string) => void
}

/**
 * One glass "settings group" container holding the bucket's CompareRow buttons,
 * hairline-divided. Rendered inside CompareMobile (md:hidden).
 */
export function CompareSection({
	groups,
	onOpen,
	compareMode = false,
	selectedSlugs,
	onToggleSelect,
}: CompareSectionProps) {
	return (
		<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
			{groups.map((group, i) => (
				<div
					key={group.slug}
					className={i > 0 ? 'border-t border-border/40' : undefined}
				>
					<CompareRow
						group={group}
						index={i}
						onOpen={onOpen}
						compareMode={compareMode}
						selected={selectedSlugs?.includes(group.slug)}
						onToggleSelect={onToggleSelect}
					/>
				</div>
			))}
		</div>
	)
}
