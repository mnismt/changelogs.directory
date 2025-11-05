import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { FilterBar } from '@/components/changelog/filter-bar'
import { ReleaseCard } from '@/components/changelog/release-card'
import { TimelineView } from '@/components/changelog/timeline-view'
import { ToolHeader } from '@/components/changelog/tool-header'
import { ViewToggle } from '@/components/changelog/view-toggle'
import { getToolLogo } from '@/lib/tool-logos'
import { getToolWithReleases } from '@/server/tools'

export const Route = createFileRoute('/tools/$slug/')({
	loader: async ({ params }) => {
		return await getToolWithReleases({ data: { slug: params.slug } })
	},
	component: ToolPage,
	head: ({ loaderData }) => {
		const toolName = loaderData?.name || 'Tool'
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
	}

	const tool = Route.useLoaderData()
	const slug = Route.useParams().slug

	// Normalize selected types to array
	const selectedTypes = search.type
		? Array.isArray(search.type)
			? search.type
			: [search.type]
		: []

	// Filter releases based on selected types
	const filteredReleases = useMemo(() => {
		if (!tool?.releases) return []
		if (selectedTypes.length === 0) return tool.releases

		// Filter releases that have changes matching the selected types
		return tool.releases.filter((release) => {
			// Check if release has any of the selected types in changesByType
			return selectedTypes.some((type) => release.changesByType?.[type])
		})
	}, [tool?.releases, selectedTypes])

	// Not found state
	if (!tool) {
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
					releaseCount={tool.releases.length}
					lastFetchedAt={tool.lastFetchedAt}
					latestVersion={tool.releases[0]?.version}
					latestReleaseDate={tool.releases[0]?.releaseDate}
					firstVersion={tool.releases[tool.releases.length - 1]?.version}
					firstReleaseDate={
						tool.releases[tool.releases.length - 1]?.releaseDate
					}
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
				) : search.view === 'grid' ? (
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
			</div>
		</div>
	)
}
