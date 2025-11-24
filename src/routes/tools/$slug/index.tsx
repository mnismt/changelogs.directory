import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { ReleaseCard } from '@/components/changelog/release/release-card'
import {
	type TimelineRelease,
	TimelineView,
} from '@/components/changelog/timeline/timeline-view'
import { FilterBar } from '@/components/changelog/tool/filter-bar'
import { ToolHeader } from '@/components/changelog/tool/tool-header'
import { ToolPageSkeleton } from '@/components/changelog/tool/tool-skeleton'
import { ViewToggle } from '@/components/changelog/tool/view-toggle'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { captureException } from '@/integrations/sentry'
import { toDate } from '@/lib/date-utils'
import { getToolLogo } from '@/lib/tool-logos'
import { getToolMetadata, getToolReleasesPaginated } from '@/server/tools'

const INITIAL_PAGE_SIZE = 20

const searchSchema = z.object({
	type: z.union([z.string(), z.array(z.string())]).optional(),
	view: z.enum(['grid', 'timeline']).optional(),
	datePreset: z.enum(['7d', '30d', '3mo', '6mo', '1y', 'all']).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
})

export const Route = createFileRoute('/tools/$slug/')({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		datePreset: search.datePreset,
		startDate: search.startDate,
		endDate: search.endDate,
	}),
	loader: async ({ params, deps }) => {
		const [toolMetadata, firstPage] = await Promise.all([
			getToolMetadata({ data: { slug: params.slug } }),
			getToolReleasesPaginated({
				data: {
					slug: params.slug,
					limit: INITIAL_PAGE_SIZE,
					offset: 0,
					datePreset: deps.datePreset,
					startDate: deps.startDate,
					endDate: deps.endDate,
				},
			}),
		])

		return {
			tool: toolMetadata,
			initialReleases: firstPage.releases,
			initialPagination: firstPage.pagination,
		}
	},
	pendingComponent: ToolPageSkeleton,
	errorComponent: ToolPageError,
	component: ToolPage,
	head: ({ loaderData }) => {
		const toolName = loaderData?.tool?.name || 'Tool'
		return {
			meta: [
				{
					title: `${toolName} Changelog - changelogs.directory`,
				},
				{
					name: 'description',
					content: `Track all releases, features, improvements, and breaking changes for ${toolName}.`,
				},
			],
		}
	},
})

function ToolPage() {
	const search = Route.useSearch()

	const loaderData = Route.useLoaderData()
	const slug = Route.useParams().slug

	// State for accumulated releases and pagination
	const [releases, setReleases] = useState(loaderData.initialReleases)
	const [pagination, setPagination] = useState(loaderData.initialPagination)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
	const [isMounted, setIsMounted] = useState(false)
	const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	const handleCardHover = useCallback((id: string | null) => {
		setHoveredCardId(id)
	}, [])

	useEffect(() => {
		setIsMounted(true)
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

		// Filter releases that have changes matching the selected types
		return releases.filter((release) => {
			// Check if release has any of the selected types in changesByType
			return selectedTypes.some((type) => release.changesByType?.[type])
		})
	}, [releases, selectedTypes])

	// Not found state
	if (!loaderData.tool) {
		return (
			<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h2 className="mb-2 text-xl font-semibold">Tool not found</h2>
					<p className="text-muted-foreground">
						The requested tool could not be found.
					</p>
				</div>
			</div>
		)
	}

	const tool = loaderData.tool
	const logo = getToolLogo(slug)

	return (
		<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
			<div className="space-y-8">
				{/* Tool Header */}
				<div
					className={`transition-all duration-700 ease-out ${
						isMounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
					}`}
				>
					<ToolHeader
						slug={slug}
						name={tool.name}
						vendor={tool.vendor}
						description={tool.description}
						homepage={tool.homepage}
						repositoryUrl={tool.repositoryUrl}
						releaseCount={tool._count.releases}
						lastFetchedAt={tool.lastFetchedAt}
						latestVersion={tool.latestVersion || undefined}
						latestReleaseDate={tool.latestReleaseDate || undefined}
						firstVersion={tool.firstVersion || undefined}
						firstReleaseDate={tool.firstReleaseDate || undefined}
						tags={tool.tags}
						logo={logo}
					/>
				</div>

				{/* Filter Bar and View Toggle */}
				<div
					className={`transition-all duration-700 ease-out ${
						isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
					}`}
					style={{ transitionDelay: '120ms' }}
				>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex-1">
							<FilterBar />
						</div>
						<ViewToggle />
					</div>
				</div>

				{/* Releases - Grid or Timeline */}
				<div
					className={`transition-all duration-700 ease-out ${
						isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
					}`}
					style={{ transitionDelay: '220ms' }}
				>
					{filteredReleases.length === 0 ? (
						<div className="rounded-lg border border-border bg-card p-8 text-center">
							<p className="text-muted-foreground">
								{selectedTypes.length > 0
									? 'No releases match the selected filters.'
									: 'No releases found.'}
							</p>
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
										/>
									))}
								</div>
							) : (
								<div
									className={`transition-all duration-600 ease-out ${
										isMounted
											? 'translate-y-0 opacity-100'
											: 'translate-y-4 opacity-0'
									}`}
									style={{ transitionDelay: '260ms' }}
								>
									<TimelineView toolSlug={slug} releases={filteredReleases} />
								</div>
							)}

							{/* Infinite scroll trigger */}
							{pagination.hasMore && (
								<div
									ref={loadMoreRef}
									className="flex min-h-[100px] flex-col items-center justify-center gap-4 py-8"
								>
									{isLoadingMore ? (
										<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{TOOL_FEED_SKELETON_KEYS.map((key) => (
												<ReleaseCardSkeletonPlaceholder key={key} />
											))}
										</div>
									) : null}
									{loadMoreError ? (
										<div className="text-center text-sm text-muted-foreground">
											<p>{loadMoreError}</p>
											<button
												type="button"
												onClick={() => {
													void loadMoreReleases()
												}}
												className="mt-1 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:text-muted-foreground"
											>
												Try again
											</button>
										</div>
									) : null}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}

function ReleaseCardSkeletonPlaceholder() {
	return (
		<div className="space-y-3 rounded border border-border/60 bg-card/60 p-5">
			<div className="animate-pulse space-y-2">
				<div className="h-3 w-16 rounded bg-secondary/60" />
				<div className="h-5 w-32 rounded bg-secondary/60" />
				<div className="h-3 w-full rounded bg-secondary/60" />
				<div className="h-3 w-3/4 rounded bg-secondary/60" />
			</div>
		</div>
	)
}

const TOOL_FEED_SKELETON_KEYS = [
	'tool-feed-1',
	'tool-feed-2',
	'tool-feed-3',
] as const

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
}

function ReleaseCardWithReveal({
	release,
	index,
	toolSlug,
	isBlurred = false,
	onHover,
}: ReleaseCardWithRevealProps) {
	const { ref, isVisible } = useScrollReveal({
		threshold: 0.2,
		rootMargin: '-60px',
	})
	const delay = 150 + Math.min(index, 10) * 40
	const releaseDate = toDate(release.releaseDate)

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Mouse events are for visual enhancement only
		<div
			ref={ref}
			className={`transition-all duration-500 ease-out ${
				isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
			} ${isBlurred ? 'blur-[2px] opacity-40' : ''}`}
			style={{ transitionDelay: `${delay}ms` }}
			onMouseEnter={() => onHover?.(release.id)}
			onMouseLeave={() => onHover?.(null)}
		>
			<ReleaseCard
				toolSlug={toolSlug}
				version={release.version}
				releaseDate={releaseDate}
				headline={release.headline}
				changeCount={release._count.changes}
				changesByType={release.changesByType}
			/>
		</div>
	)
}
