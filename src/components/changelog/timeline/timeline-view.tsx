import { useMemo } from 'react'
import { toDate } from '@/lib/date-utils'
import { TimelineItem } from './timeline-item'

export interface TimelineRelease {
	id: string
	version: string
	releaseDate: Date | string | null
	summary: string | null
	_count: {
		changes: number
	}
	changesByType?: Record<string, number>
}

interface TimelineViewProps {
	toolSlug: string
	releases: TimelineRelease[]
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

export function TimelineView({ toolSlug, releases }: TimelineViewProps) {
	const groupedByYear = useMemo(() => groupReleasesByYear(releases), [releases])

	// Sort years in descending order (newest first)
	// Put "Date Unknown" at the end
	const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
		if (a === 'Date Unknown') return 1
		if (b === 'Date Unknown') return -1
		return Number.parseInt(b, 10) - Number.parseInt(a, 10)
	})

	if (sortedYears.length === 0) {
		return null
	}

	return (
		<div className="mx-auto max-w-5xl">
			{sortedYears.map((year, yearIndex) => {
				const yearReleases = groupedByYear[year]
				const isFirstYear = yearIndex === 0

				return (
					<div key={year} className={isFirstYear ? '' : 'mt-12'}>
						{/* Year header */}
						<h2 className="mb-8 font-mono text-2xl font-semibold text-foreground">
							{year}
						</h2>

						{/* Timeline items for this year */}
						<div>
							{yearReleases.map((release, releaseIndex) => {
								const isLastInYear = releaseIndex === yearReleases.length - 1
								const isLastOverall =
									yearIndex === sortedYears.length - 1 && isLastInYear

								// Calculate global index for alternating sides
								const globalIndex =
									sortedYears
										.slice(0, yearIndex)
										.reduce((acc, y) => acc + groupedByYear[y].length, 0) +
									releaseIndex
								const isLeft = globalIndex % 2 === 0

								return (
									<TimelineItem
										key={release.id}
										toolSlug={toolSlug}
										version={release.version}
										releaseDate={release.releaseDate}
										summary={release.summary}
										changeCount={release._count.changes}
										changesByType={release.changesByType}
										isLast={isLastOverall}
										isLeft={isLeft}
										sequenceIndex={globalIndex}
									/>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}
