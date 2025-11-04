import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { FilterBar } from '@/components/changelog/filter-bar'
import { ReleaseCard } from '@/components/changelog/release-card'
import { ToolHeader } from '@/components/changelog/tool-header'
import { ClaudeAI } from '@/components/logo/claude'
import { getToolWithReleases } from '@/server/tools'

export const Route = createFileRoute('/tools/claude-code/')({
	component: ClaudeCodePage,
	head: () => ({
		meta: [
			{
				title: 'Claude Code Changelog - changelogs.directory',
			},
			{
				name: 'description',
				content:
					'Track all releases, features, improvements, and breaking changes for Claude Code CLI.',
			},
		],
	}),
})

function ClaudeCodePage() {
	const search = Route.useSearch() as {
		type?: string | string[]
	}

	// Fetch tool data
	const {
		data: tool,
		isPending,
		error,
	} = useQuery({
		queryKey: ['tool', 'claude-code'],
		queryFn: async () => {
			return await getToolWithReleases({ data: { slug: 'claude-code' } })
		},
	})

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
		// This requires checking the changes for each release
		// For now, we'll filter based on release tags
		return tool.releases.filter((release) => {
			// If no type filter, show all
			if (selectedTypes.length === 0) return true

			// Check if release has any of the selected types in its tags
			const hasMatchingTag = release.tags.some((tag) =>
				selectedTypes.some((type) => type.toLowerCase() === tag.toLowerCase()),
			)

			return hasMatchingTag
		})
	}, [tool?.releases, selectedTypes])

	// Loading state
	if (isPending) {
		return (
			<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
				<div className="space-y-8">
					{/* Skeleton header */}
					<div className="space-y-4 border-b border-border pb-8">
						<div className="h-8 w-48 animate-pulse rounded bg-card" />
						<div className="h-12 w-96 animate-pulse rounded bg-card" />
						<div className="h-6 w-full max-w-2xl animate-pulse rounded bg-card" />
					</div>

					{/* Skeleton cards */}
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
							<div
								key={key}
								className="h-48 animate-pulse rounded-lg border border-border bg-card"
							/>
						))}
					</div>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h2 className="mb-2 text-xl font-semibold">
						Failed to load tool data
					</h2>
					<p className="text-muted-foreground">
						{error instanceof Error
							? error.message
							: 'An unexpected error occurred'}
					</p>
				</div>
			</div>
		)
	}

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

	return (
		<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
			<div className="space-y-8">
				{/* Tool Header */}
				<ToolHeader
					name={tool.name}
					vendor={tool.vendor}
					description={tool.description}
					homepage={tool.homepage}
					repositoryUrl={tool.repositoryUrl}
					releaseCount={tool.releases.length}
					lastFetchedAt={tool.lastFetchedAt}
					tags={tool.tags}
					logo={<ClaudeAI />}
				/>

				{/* Filter Bar */}
				<FilterBar />

				{/* Releases Grid */}
				{filteredReleases.length === 0 ? (
					<div className="rounded-lg border border-border bg-card p-8 text-center">
						<p className="text-muted-foreground">
							{selectedTypes.length > 0
								? 'No releases match the selected filters.'
								: 'No releases found.'}
						</p>
					</div>
				) : (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{filteredReleases.map((release) => (
							<ReleaseCard
								key={release.id}
								toolSlug="claude-code"
								version={release.version}
								releaseDate={release.releaseDate}
								summary={release.summary}
								tags={release.tags}
								changeCount={release._count.changes}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
