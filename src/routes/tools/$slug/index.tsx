import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FilterBar } from '@/components/changelog/filter-bar'
import { ReleaseCard } from '@/components/changelog/release-card'
import { TimelineView } from '@/components/changelog/timeline-view'
import { ToolHeader } from '@/components/changelog/tool-header'
import { ViewToggle } from '@/components/changelog/view-toggle'
import { getToolLogo } from '@/lib/tool-logos'
import { getToolMetadata, getToolReleasesPaginated } from '@/server/tools'

const INITIAL_PAGE_SIZE = 20

export const Route = createFileRoute('/tools/$slug/')({
	loader: async ({ params, search }) => {
		// Parse date filters from search params
		const dateFrom = search.dateFrom ? new Date(search.dateFrom) : undefined
		const dateTo = search.dateTo ? new Date(search.dateTo) : undefined

		const [toolMetadata, firstPage] = await Promise.all([
			getToolMetadata({ data: { slug: params.slug } }),
			getToolReleasesPaginated({
				data: {
					slug: params.slug,
					limit: INITIAL_PAGE_SIZE,
					offset: 0,
					dateFrom,
					dateTo,
				},
			}),
		])

		return {
			tool: toolMetadata,
			initialReleases: firstPage.releases,
			initialPagination: firstPage.pagination,
		}
	},
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
	const search = Route.useSearch() as {
		type?: string | string[]
		view?: 'grid' | 'timeline'
		dateFrom?: string
		dateTo?: string
	}

	const loaderData = Route.useLoaderData()
	const slug = Route.useParams().slug

	// State for accumulated releases and pagination
	const [releases, setReleases] = useState(loaderData.initialReleases)
	const [pagination, setPagination] = useState(loaderData.initialPagination)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	// Reset releases when filters change
	useEffect(() => {
		setReleases(loaderData.initialReleases)
		setPagination(loaderData.initialPagination)
		setIsLoadingMore(false)
	}, [
		search.type,
		search.dateFrom,
		search.dateTo,
		loaderData.initialReleases,
		loaderData.initialPagination,
	])

	const loadMoreReleases = useCallback(async () => {
		if (isLoadingMore || !pagination.hasMore) return

		setIsLoadingMore(true)
		try {
			// Parse date filters
			const dateFrom = search.dateFrom ? new Date(search.dateFrom) : undefined
			const dateTo = search.dateTo ? new Date(search.dateTo) : undefined

			const nextPage = await getToolReleasesPaginated({
				data: {
					slug,
					limit: INITIAL_PAGE_SIZE,
					offset: releases.length,
					dateFrom,
					dateTo,
				},
			})

			setReleases((prev) => [...prev, ...nextPage.releases])
			setPagination(nextPage.pagination)
		} catch (error) {
			console.error('Failed to load more releases:', error)
		} finally {
			setIsLoadingMore(false)
		}
	}, [
		slug,
		isLoadingMore,
		pagination.hasMore,
		releases.length,
		search.dateFrom,
		search.dateTo,
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

				{/* Filter Bar and View Toggle */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex-1">
						<FilterBar />
					</div>
					<ViewToggle />
				</div>

				{/* Releases - Grid or Timeline */}
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
								{filteredReleases.map((release) => (
									<ReleaseCard
										key={release.id}
										toolSlug={slug}
										version={release.version}
										releaseDate={release.releaseDate}
										summary={release.summary}
										changeCount={release._count.changes}
										changesByType={release.changesByType}
									/>
								))}
							</div>
						) : (
							<TimelineView toolSlug={slug} releases={filteredReleases} />
						)}

						{/* Infinite scroll trigger */}
						{pagination.hasMore && (
							<div
								ref={loadMoreRef}
								className="flex min-h-[100px] items-center justify-center py-8"
							>
								{isLoadingMore && (
									<div className="text-muted-foreground font-mono text-sm">
										Loading more releases...
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}
