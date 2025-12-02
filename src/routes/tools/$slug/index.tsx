import type { ChangeType } from '@prisma/client'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { ReleaseCard } from '@/components/changelog/release/release-card'
import {
	type TimelineRelease,
	TimelineView,
} from '@/components/changelog/timeline/timeline-view'
import { FilterBar } from '@/components/changelog/tool/filter-bar'
import { StickyFilterBar } from '@/components/changelog/tool/sticky-filter-bar'
import { ToolPageSkeleton } from '@/components/changelog/tool/tool-skeleton'
import { ViewToggle } from '@/components/changelog/tool/view-toggle'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { captureException } from '@/integrations/sentry'
import { toDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { getToolReleasesPaginated } from '@/server/tools'

const INITIAL_PAGE_SIZE = 20

const searchSchema = z.object({
	type: z.union([z.string(), z.array(z.string())]).optional(),
	view: z.enum(['grid', 'timeline']).optional(),
	datePreset: z.enum(['7d', '30d', '3mo', '6mo', '1y', 'all']).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	showPrereleases: z.boolean().optional().default(false),
})

export const Route = createFileRoute('/tools/$slug/')({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		datePreset: search.datePreset,
		startDate: search.startDate,
		endDate: search.endDate,
		showPrereleases: search.showPrereleases,
	}),
	loader: async ({ params, deps }) => {
		const firstPage = await getToolReleasesPaginated({
			data: {
				slug: params.slug,
				limit: INITIAL_PAGE_SIZE,
				offset: 0,
				datePreset: deps.datePreset,
				startDate: deps.startDate,
				endDate: deps.endDate,
				includePrereleases: deps.showPrereleases,
			},
		})

		return {
			initialReleases: firstPage.releases,
			initialPagination: firstPage.pagination,
		}
	},
	pendingComponent: ToolPageSkeleton,
	errorComponent: ToolPageError,
	component: ToolPage,
	head: ({ params }) => {
		// Note: We don't have tool name here anymore, but layout handles main meta.
		// We can keep basic title or rely on parent.
		// For now, let's keep it simple.
		return {
			meta: [
				{
					title: `${params.slug} Changelog - changelogs.directory`,
				},
			],
		}
	},
})

function ToolPage() {
	const search = Route.useSearch()
	const loaderData = Route.useLoaderData()
	const slug = Route.useParams().slug

	// State
	const [releases, setReleases] = useState(loaderData.initialReleases)
	const [pagination, setPagination] = useState(loaderData.initialPagination)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
	const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
	const [hoveredTypes, setHoveredTypes] = useState<ChangeType[] | null>(null)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	const handleCardHover = useCallback((id: string | null) => {
		setHoveredCardId(id)
	}, [])

	const handleHoverTypesChange = useCallback((types: ChangeType[] | null) => {
		setHoveredTypes(types)
	}, [])

	// Reset releases when filters change
	useEffect(() => {
		setReleases(loaderData.initialReleases)
		setPagination(loaderData.initialPagination)
		setIsLoadingMore(false)
		setLoadMoreError(null)
	}, [
		search.type,
		search.datePreset,
		search.startDate,
		search.endDate,
		search.showPrereleases,
		loaderData.initialReleases,
		loaderData.initialPagination,
	])

	const loadMoreReleases = useCallback(async () => {
		if (isLoadingMore || !pagination.hasMore) return

		setIsLoadingMore(true)
		try {
			setLoadMoreError(null)
			const nextPage = await getToolReleasesPaginated({
				data: {
					slug,
					limit: INITIAL_PAGE_SIZE,
					offset: releases.length,
					datePreset: search.datePreset,
					startDate: search.startDate,
					endDate: search.endDate,
					includePrereleases: search.showPrereleases,
				},
			})

			setReleases((prev) => [...prev, ...nextPage.releases])
			setPagination(nextPage.pagination)
		} catch (error) {
			console.error('Failed to load more releases:', error)
			captureException(error)
			setLoadMoreError('Unable to load more releases.')
		} finally {
			setIsLoadingMore(false)
		}
	}, [
		slug,
		isLoadingMore,
		pagination.hasMore,
		releases.length,
		search.datePreset,
		search.startDate,
		search.endDate,
		search.showPrereleases,
	])

	// Intersection observer for infinite scroll
	useEffect(() => {
		if (!pagination.hasMore || isLoadingMore) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMoreReleases()
				}
			},
			{ threshold: 0.1 },
		)

		const currentRef = loadMoreRef.current
		if (currentRef) {
			observer.observe(currentRef)
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef)
			}
		}
	}, [pagination.hasMore, isLoadingMore, loadMoreReleases])

	// Normalize selected types to array
	const selectedTypes = search.type
		? Array.isArray(search.type)
			? search.type
			: [search.type]
		: []

	// Filter releases based on selected types
	const filteredReleases = useMemo(() => {
		if (!releases) return []
		if (selectedTypes.length === 0) return releases
		return releases.filter((release) => {
			return selectedTypes.some((type) => release.changesByType?.[type])
		})
	}, [releases, selectedTypes])

	return (
		<div className="space-y-6">
			{/* Controls */}
			<StickyFilterBar>
				<motion.div
					initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
					animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
					transition={{
						duration: 0.8,
						ease: [0.2, 0.8, 0.2, 1],
						delay: 0.6,
					}}
					className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:px-4"
				>
					<div className="flex-1">
						<FilterBar hoveredTypes={hoveredTypes} />
					</div>
					<ViewToggle />
				</motion.div>
			</StickyFilterBar>

			{/* Feed */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.8 }}
				className="min-h-[500px]"
			>
				{filteredReleases.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-lg">
						<div className="font-mono text-muted-foreground">
							<p className="mb-2">No releases found</p>
							<p className="text-xs opacity-50">Try adjusting your filters</p>
						</div>
					</div>
				) : (
					<>
						{search.view === 'grid' ? (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{filteredReleases.map((release, index) => (
									<ReleaseCardWithReveal
										key={release.id}
										release={release}
										index={index}
										toolSlug={slug}
										isBlurred={
											hoveredCardId !== null && hoveredCardId !== release.id
										}
										onHover={handleCardHover}
										onHoverTypesChange={handleHoverTypesChange}
									/>
								))}
							</div>
						) : (
							<TimelineView
								toolSlug={slug}
								releases={filteredReleases}
								onHoverTypesChange={handleHoverTypesChange}
							/>
						)}

						{/* Load More */}
						{pagination.hasMore && (
							<div
								ref={loadMoreRef}
								className="flex min-h-[100px] flex-col items-center justify-center gap-4 py-12"
							>
								{isLoadingMore ? (
									<div className="flex items-center gap-2 font-mono text-xs text-muted-foreground animate-pulse">
										<span>LOADING_DATA...</span>
									</div>
								) : null}

								{loadMoreError && (
									<div className="text-center font-mono text-xs text-red-400/80">
										<p>{loadMoreError}</p>
										<button
											type="button"
											onClick={() => void loadMoreReleases()}
											className="mt-2 hover:text-red-400 underline decoration-red-400/30 underline-offset-4"
										>
											RETRY_CONNECTION
										</button>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</motion.div>
		</div>
	)
}

function ToolPageError({
	error,
	reset,
}: {
	error: unknown
	reset: () => void
}) {
	useEffect(() => {
		captureException(error)
	}, [error])

	const detail =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: null

	return (
		<div className="px-4 py-24">
			<ErrorBoundaryCard
				title="Failed to load tool"
				message="We couldn't load this tool's changelog."
				detail={detail ?? undefined}
				onRetry={reset}
			/>
		</div>
	)
}

interface ReleaseCardWithRevealProps {
	release: TimelineRelease
	index: number
	toolSlug: string
	isBlurred?: boolean
	onHover?: (id: string | null) => void
	onHoverTypesChange?: (types: ChangeType[] | null) => void
}

function ReleaseCardWithReveal({
	release,
	index,
	toolSlug,
	isBlurred = false,
	onHover,
	onHoverTypesChange,
}: ReleaseCardWithRevealProps) {
	const { ref, isVisible } = useScrollReveal({
		threshold: 0.2,
		rootMargin: '-60px',
	})
	const delay = 150 + Math.min(index, 10) * 40
	const releaseDate = toDate(release.releaseDate)

	const handleMouseEnter = () => {
		onHover?.(release.id)

		// Extract change types from the release
		const types = release.changesByType
			? (Object.keys(release.changesByType) as ChangeType[])
			: null

		onHoverTypesChange?.(types)
	}

	const handleMouseLeave = () => {
		onHover?.(null)
		onHoverTypesChange?.(null)
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Mouse events are for visual enhancement only
		<div
			ref={ref}
			className={cn(
				'transition-all duration-500 ease-out',
				isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
				isBlurred && 'blur-[2px] opacity-40',
			)}
			style={{ transitionDelay: `${delay}ms` }}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<ReleaseCard
				toolSlug={toolSlug}
				version={release.version}
				formattedVersion={release.formattedVersion}
				releaseDate={releaseDate}
				headline={release.headline}
				changeCount={release._count.changes}
				changesByType={release.changesByType}
			/>
		</div>
	)
}
