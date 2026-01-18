import { ItemErrorBoundary } from '@/components/shared/item-error-boundary'
import type { getReleasesGroupedByTool } from '@/server/tools'
import { ToolLane } from './tool-lane'

type GroupedReleasesData = Awaited<ReturnType<typeof getReleasesGroupedByTool>>

interface ToolLanesFeedProps {
	data: GroupedReleasesData
	selectedTools: string[]
	searchQuery: string
}

export function ToolLanesFeed({
	data,
	selectedTools,
	searchQuery,
}: ToolLanesFeedProps) {
	const { tools } = data

	// Filter tools by selected tool slugs (if any)
	const visibleTools =
		selectedTools.length > 0
			? tools.filter((tool) => selectedTools.includes(tool.slug))
			: tools

	// Apply search filter to releases within each tool
	const toolsWithFilteredReleases = visibleTools.map((tool) => {
		let filteredReleases = tool.releases

		// Apply search query filter (client-side)
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filteredReleases = filteredReleases.filter((release) => {
				const matchesVersion = release.version.toLowerCase().includes(query)
				const matchesFormattedVersion = release.formattedVersion
					?.toLowerCase()
					.includes(query)
				return matchesVersion || matchesFormattedVersion
			})
		}

		// Apply change type filter (already applied server-side, but we track if there are matches)
		const hasMatchingReleases = filteredReleases.length > 0

		return {
			...tool,
			releases: filteredReleases,
			hasMatchingReleases,
		}
	})

	if (toolsWithFilteredReleases.length === 0) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground">
					No tools found matching your filters.
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{toolsWithFilteredReleases.map((tool, index) => (
				<ItemErrorBoundary key={tool.id}>
					<ToolLane
						tool={{
							slug: tool.slug,
							name: tool.name,
							vendor: tool.vendor,
							totalReleases: tool.totalReleases,
							velocity: tool.velocity,
						}}
						releases={tool.releases}
						hasMatchingReleases={tool.hasMatchingReleases}
						animationDelay={200 + index * 100}
					/>
				</ItemErrorBoundary>
			))}
		</div>
	)
}
