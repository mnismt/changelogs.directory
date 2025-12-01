import type { ChangeType } from '@prisma/client'
import { motion, useScroll, useTransform } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toDate } from '@/lib/date-utils'
import { TimelineItem } from './timeline-item'

export interface TimelineRelease {
	id: string
	version: string
	formattedVersion?: string
	releaseDate: Date | string | null
	headline: string | null
	summary: string | null
	_count: {
		changes: number
	}
	changesByType?: Record<string, number>
}

interface TimelineViewProps {
	toolSlug: string
	releases: TimelineRelease[]
	onHoverTypesChange?: (types: ChangeType[] | null) => void
}

function groupReleasesByYear(releases: TimelineRelease[]) {
	const groups: Record<string, TimelineRelease[]> = {}

	for (const release of releases) {
		let year = 'Date Unknown'
		if (release.releaseDate) {
			const date = toDate(release.releaseDate)
			if (date) {
				year = date.getFullYear().toString()
			}
		}

		if (!groups[year]) {
			groups[year] = []
		}
		groups[year].push(release)
	}

	return groups
}

export function TimelineView({
	toolSlug,
	releases,
	onHoverTypesChange,
}: TimelineViewProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const timelineRef = useRef<HTMLDivElement>(null)
	const [height, setHeight] = useState(0)
	const [hoveredId, setHoveredId] = useState<string | null>(null)

	// Build a map of releases by ID for quick lookup
	const releasesById = useMemo(() => {
		const map = new Map<string, TimelineRelease>()
		for (const release of releases) {
			map.set(release.id, release)
		}
		return map
	}, [releases])

	const handleItemHover = useCallback(
		(id: string | null) => {
			setHoveredId(id)

			if (id === null) {
				onHoverTypesChange?.(null)
			} else {
				const release = releasesById.get(id)
				const types = release?.changesByType
					? (Object.keys(release.changesByType) as ChangeType[])
					: null
				onHoverTypesChange?.(types)
			}
		},
		[releasesById, onHoverTypesChange],
	)

	const groupedByYear = useMemo(() => groupReleasesByYear(releases), [releases])

	// Sort years in descending order (newest first)
	// Put "Date Unknown" at the end
	const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
		if (a === 'Date Unknown') return 1
		if (b === 'Date Unknown') return -1
		return Number.parseInt(b, 10) - Number.parseInt(a, 10)
	})

	// Measure the timeline height
	useEffect(() => {
		if (timelineRef.current) {
			const rect = timelineRef.current.getBoundingClientRect()
			setHeight(rect.height)
		}
	}, [releases])

	// Set up scroll-based animation
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start 20%', 'end 60%'],
	})

	const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
	const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

	if (sortedYears.length === 0) {
		return null
	}

	return (
		<div ref={containerRef} className="mx-auto max-w-5xl">
			<div ref={timelineRef} className="relative">
				{/* Static background line - Circuit Trace Style */}
				<div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
				<div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/5 to-transparent blur-[1px]" />

				{/* Animated scroll-progress line - Glowing Pulse */}
				<div
					style={{ height: `${height}px` }}
					className="pointer-events-none absolute left-1/2 top-0 w-px -translate-x-1/2 overflow-hidden"
				>
					<motion.div
						style={{
							height: heightTransform,
							opacity: opacityTransform,
						}}
						className="absolute inset-x-0 top-0 w-px bg-gradient-to-b from-white via-white/80 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)]"
					/>
				</div>

				{sortedYears.map((year, yearIndex) => {
					const yearReleases = groupedByYear[year]
					const isFirstYear = yearIndex === 0

					return (
						<div key={year} className={isFirstYear ? '' : 'mt-12'}>
							{/* Year header */}
							<div className="relative mb-8 flex justify-center">
								<div className="relative z-10 bg-background px-4 font-mono text-2xl font-bold text-foreground/80">
									{year}
								</div>
							</div>

							{/* Timeline items for this year */}
							<div>
								{yearReleases.map((release, releaseIndex) => {
									// Calculate global index for alternating sides
									const globalIndex =
										sortedYears
											.slice(0, yearIndex)
											.reduce((acc, y) => acc + groupedByYear[y].length, 0) +
										releaseIndex
									const isLeft = globalIndex % 2 === 0
									const isBlurred =
										hoveredId !== null && hoveredId !== release.id

									return (
										<TimelineItem
											key={release.id}
											id={release.id}
											toolSlug={toolSlug}
											version={release.version}
											formattedVersion={release.formattedVersion}
											releaseDate={release.releaseDate}
											headline={release.headline}
											changeCount={release._count.changes}
											changesByType={release.changesByType}
											isLeft={isLeft}
											sequenceIndex={globalIndex}
											isBlurred={isBlurred}
											onHover={handleItemHover}
										/>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
