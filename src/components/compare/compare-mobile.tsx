import { ShieldCheck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { CompareSection } from '@/components/compare/compare-section'
import { CompareTray } from '@/components/compare/compare-tray'
import {
	type CompareBucket,
	SectionSegmentedControl,
} from '@/components/compare/section-segmented-control'
import { ToolDetailSheet } from '@/components/compare/tool-detail-sheet'
import { TwoUpCompareSheet } from '@/components/compare/two-up-compare-sheet'
import type { ToolPlanGroup } from '@/data/tool-plans'

interface CompareMobileProps {
	official: ToolPlanGroup[]
	harness: ToolPlanGroup[]
}

/**
 * Mobile-only (md:hidden) Plans Directory.
 *
 * - Phase 1: a calm, normalized row list with a sticky bucket filter and a
 *   drill-down BottomSheet per tool.
 * - Phase 2: an opt-in compare mode — pin 2 tools (across either bucket) via a
 *   floating tray, then view them side by side, plan tiers aligned, in the
 *   TwoUpCompareSheet.
 *
 * Replaces the dense desktop card grid below md; the desktop tree is untouched.
 */
export function CompareMobile({ official, harness }: CompareMobileProps) {
	const [activeBucket, setActiveBucket] = useState<CompareBucket>('official')
	const [openSlug, setOpenSlug] = useState<string | null>(null)
	const [compareMode, setCompareMode] = useState(false)
	const [pinned, setPinned] = useState<string[]>([])
	const [compareOpen, setCompareOpen] = useState(false)

	const all = [...official, ...harness]
	const groups = activeBucket === 'official' ? official : harness
	const openGroup = all.find((g) => g.slug === openSlug) ?? null
	const pinnedGroups = pinned
		.map((slug) => all.find((g) => g.slug === slug))
		.filter((g): g is ToolPlanGroup => g != null)

	const toggleCompareMode = useCallback(() => {
		setCompareMode((prev) => {
			if (prev) {
				// Leaving compare mode resets selection.
				setPinned([])
				setCompareOpen(false)
			} else {
				setOpenSlug(null)
			}
			return !prev
		})
	}, [])

	// Pin/unpin, capped at 2 — a 3rd pick replaces the oldest (FIFO) for fluidity.
	const toggleSelect = useCallback((slug: string) => {
		setPinned((prev) => {
			if (prev.includes(slug)) return prev.filter((s) => s !== slug)
			if (prev.length < 2) return [...prev, slug]
			return [prev[1], slug]
		})
	}, [])

	const removePinned = useCallback((slug: string) => {
		setPinned((prev) => prev.filter((s) => s !== slug))
	}, [])

	return (
		<div className="md:hidden">
			<SectionSegmentedControl
				value={activeBucket}
				onChange={setActiveBucket}
				compareMode={compareMode}
				onToggleCompareMode={toggleCompareMode}
				pinnedCount={pinned.length}
			/>

			{!compareMode && (
				<div className="-mt-2 mb-5 flex flex-col items-center gap-1.5 px-2 text-center">
					<p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
						{activeBucket === 'official'
							? 'First-party CLIs built by the model makers — Anthropic, OpenAI, Google.'
							: 'Third-party IDEs & agents that route across many model providers.'}
					</p>
					<p className="flex items-center justify-center gap-1.5 font-mono text-[11px] leading-relaxed text-muted-foreground/70">
						<ShieldCheck className="size-3.5 shrink-0 text-emerald-400/70" />
						<span>
							Hand-verified — we read the fine print so you don't have to.
						</span>
					</p>
				</div>
			)}

			<CompareSection
				key={activeBucket}
				groups={groups}
				onOpen={setOpenSlug}
				compareMode={compareMode}
				selectedSlugs={pinned}
				onToggleSelect={toggleSelect}
			/>

			{/* Phase 1: single-tool drill-down (only reachable outside compare mode). */}
			<ToolDetailSheet
				group={openGroup}
				open={openSlug !== null}
				onClose={() => setOpenSlug(null)}
			/>

			{/* Phase 2: floating tray + side-by-side sheet. */}
			<CompareTray
				pinned={pinnedGroups}
				onRemove={removePinned}
				onCompare={() => setCompareOpen(true)}
				visible={compareMode && pinned.length > 0 && !compareOpen}
			/>
			<TwoUpCompareSheet
				a={pinnedGroups[0] ?? null}
				b={pinnedGroups[1] ?? null}
				open={compareOpen}
				onClose={() => setCompareOpen(false)}
			/>
		</div>
	)
}
