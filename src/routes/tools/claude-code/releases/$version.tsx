import type { Change, ChangeType } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { ChangeItem } from '@/components/changelog/change-item'
import { CollapsibleSection } from '@/components/changelog/collapsible-section'
import { FilterBar } from '@/components/changelog/filter-bar'
import { ClaudeAI } from '@/components/logo/claude'
import { Badge } from '@/components/ui/badge'
import { getReleaseWithChanges } from '@/server/tools'

export const Route = createFileRoute('/tools/claude-code/releases/$version')({
	component: ReleaseDetailPage,
	head: ({ params }) => ({
		meta: [
			{
				title: `Claude Code ${params.version} Changelog - changelogs.directory`,
			},
			{
				name: 'description',
				content: `View all changes, features, and bugfixes in Claude Code version ${params.version}.`,
			},
		],
	}),
})

function ReleaseDetailPage() {
	const { version } = Route.useParams()
	const search = Route.useSearch() as {
		type?: string | string[]
		platform?: string | string[]
	}

	// Fetch release data
	const {
		data: release,
		isPending,
		error,
	} = useQuery({
		queryKey: ['release', 'claude-code', version],
		queryFn: async () => {
			return await getReleaseWithChanges({
				data: { toolSlug: 'claude-code', version },
			})
		},
	})

	// Normalize filters
	const selectedTypes = search.type
		? Array.isArray(search.type)
			? search.type
			: [search.type]
		: []
	const selectedPlatforms = search.platform
		? Array.isArray(search.platform)
			? search.platform
			: [search.platform]
		: []

	// Group changes by type and apply filters
	const groupedChanges = useMemo(() => {
		if (!release?.changes) return {}

		const filtered = release.changes.filter((change) => {
			// Filter by type
			if (selectedTypes.length > 0 && !selectedTypes.includes(change.type)) {
				return false
			}

			// Filter by platform
			if (selectedPlatforms.length > 0 && change.platform) {
				if (!selectedPlatforms.includes(change.platform.toLowerCase())) {
					return false
				}
			}

			return true
		})

		// Group by type
		const grouped: Record<ChangeType, Change[]> = {
			FEATURE: [],
			BUGFIX: [],
			IMPROVEMENT: [],
			BREAKING: [],
			SECURITY: [],
			DEPRECATION: [],
			PERFORMANCE: [],
			DOCUMENTATION: [],
			OTHER: [],
		}

		filtered.forEach((change) => {
			grouped[change.type].push(change)
		})

		return grouped
	}, [release?.changes, selectedTypes, selectedPlatforms])

	// Section titles and order
	const sections: Array<{ type: ChangeType; title: string }> = [
		{ type: 'BREAKING', title: '⚠️ Breaking Changes' },
		{ type: 'SECURITY', title: '🔒 Security Updates' },
		{ type: 'FEATURE', title: '✨ New Features' },
		{ type: 'IMPROVEMENT', title: '🚀 Improvements' },
		{ type: 'PERFORMANCE', title: '⚡ Performance' },
		{ type: 'BUGFIX', title: '🐛 Bug Fixes' },
		{ type: 'DEPRECATION', title: '⚠️ Deprecated' },
		{ type: 'DOCUMENTATION', title: '📚 Documentation' },
		{ type: 'OTHER', title: '📦 Other Changes' },
	]

	// Loading state
	if (isPending) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-12">
				<div className="space-y-8">
					{/* Skeleton breadcrumbs */}
					<div className="h-4 w-64 animate-pulse rounded bg-card" />

					{/* Skeleton header */}
					<div className="space-y-4 border-b border-border pb-8">
						<div className="h-12 w-48 animate-pulse rounded bg-card" />
						<div className="h-6 w-96 animate-pulse rounded bg-card" />
					</div>

					{/* Skeleton sections */}
					{Array.from({ length: 3 }, (_, i) => `skeleton-section-${i}`).map(
						(key) => (
							<div
								key={key}
								className="h-32 animate-pulse rounded-lg border border-border bg-card"
							/>
						),
					)}
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-12">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h2 className="mb-2 text-xl font-semibold">Failed to load release</h2>
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
	if (!release) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-12">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h2 className="mb-2 text-xl font-semibold">Release not found</h2>
					<p className="text-muted-foreground">
						The requested release could not be found.
					</p>
				</div>
			</div>
		)
	}

	const formattedDate = release.releaseDate
		? new Date(release.releaseDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: 'Date unknown'

	return (
		<div className="container mx-auto max-w-7xl px-4 py-12">
			<div className="space-y-8">
				{/* Back Button & Breadcrumbs */}
				<div className="space-y-4">
					<Link
						to="/tools/claude-code"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to all releases</span>
					</Link>

					{/* Breadcrumbs with Logo */}
					<nav className="flex items-center gap-3">
						<div className="flex items-center gap-3">
							<div className="[&>svg]:h-8 [&>svg]:w-8 [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
								<ClaudeAI />
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Link
									to="/tools/claude-code"
									className="font-mono text-foreground transition-colors hover:text-muted-foreground"
								>
									{release.tool.name}
								</Link>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Releases</span>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
								<span className="font-mono text-foreground">{version}</span>
							</div>
						</div>
					</nav>
				</div>

				{/* Release Header */}
				<div className="space-y-4 border-b border-border pb-8">
					<div className="flex items-start justify-between gap-4">
						<h1 className="font-mono text-4xl font-bold">{version}</h1>
						{release.tags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{release.tags.map((tag) => (
									<Badge
										key={tag}
										variant={
											tag === 'breaking' || tag === 'security'
												? 'destructive'
												: 'outline'
										}
										className="font-mono text-xs uppercase"
									>
										{tag}
									</Badge>
								))}
							</div>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
						<span>Released on {formattedDate}</span>
						<span>•</span>
						<span>
							{release.changes.length}{' '}
							{release.changes.length === 1 ? 'change' : 'changes'}
						</span>
						{release.sourceUrl && (
							<>
								<span>•</span>
								<a
									href={release.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1 transition-colors hover:text-foreground"
								>
									View source
									<ExternalLink className="h-3 w-3" />
								</a>
							</>
						)}
					</div>

					{release.summary && (
						<p className="text-muted-foreground">{release.summary}</p>
					)}
				</div>

				{/* Filter Bar */}
				<FilterBar showPlatformFilter />

				{/* Changes by Type */}
				<div className="space-y-4">
					{sections.map((section) => {
						const changes = groupedChanges[section.type]
						if (!changes || changes.length === 0) return null

						return (
							<CollapsibleSection
								key={section.type}
								title={section.title}
								count={changes.length}
								defaultOpen={
									section.type === 'BREAKING' ||
									section.type === 'SECURITY' ||
									section.type === 'FEATURE'
								}
							>
								{changes.map((change) => (
									<ChangeItem
										key={change.id}
										title={change.title}
										description={change.description}
										platform={change.platform}
										isBreaking={change.isBreaking}
										isSecurity={change.isSecurity}
										isDeprecation={change.isDeprecation}
										links={
											change.links
												? (change.links as Array<{
														url: string
														text: string
														type?: string
													}>)
												: null
										}
									/>
								))}
							</CollapsibleSection>
						)
					})}

					{/* Empty state */}
					{Object.values(groupedChanges).every(
						(changes) => changes.length === 0,
					) && (
						<div className="rounded-lg border border-border bg-card p-8 text-center">
							<p className="text-muted-foreground">
								{selectedTypes.length > 0 || selectedPlatforms.length > 0
									? 'No changes match the selected filters.'
									: 'No changes found in this release.'}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
