import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { FeedFilters } from '@/components/home/feed-filters'
import { FeedReleaseCard } from '@/components/home/feed-release-card'
import { HeroRelease } from '@/components/home/hero-release'
import { HomePageSkeleton } from '@/components/home/home-skeleton'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { LogoShowcase } from '@/components/shared/logo-showcase'
import { useDebounce } from '@/hooks/use-debounce'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { captureException } from '@/integrations/sentry'
import { getToolLogo, isMonochromeLogo } from '@/lib/tool-logos'
import { cn } from '@/lib/utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'
import { getLatestReleasesAcrossTools } from '@/server/tools'

type ChangeType =
	| 'FEATURE'
	| 'BUGFIX'
	| 'IMPROVEMENT'
	| 'BREAKING'
	| 'SECURITY'
	| 'DEPRECATION'
	| 'PERFORMANCE'
	| 'DOCUMENTATION'
	| 'OTHER'

type ReleaseData = {
	id: string
	version: string
	releaseDate: Date | string | null
	headline: string | null
	summary: string | null
	_count: { changes: number }
	tool: {
		slug: string
		name: string
		vendor: string | null
		tags: string[]
	}
	changesByType: Record<string, number>
	hasBreaking: boolean
	hasSecurity: boolean
	hasDeprecation: boolean
}

const trackedToolSlugs = ['claude-code', 'codex', 'cursor'] as const
type TrackedToolSlug = (typeof trackedToolSlugs)[number]
type ToolFilterOption = {
	slug: TrackedToolSlug
	name: string
	logo: ReactNode
}

const MAX_FEED_RELEASES = 9
const INITIAL_RELEASE_LIMIT = MAX_FEED_RELEASES + 1

export const Route = createFileRoute('/')({
	head: () => ({
		meta: [
			{
				title: 'changelogs.directory - Latest Developer Tool Updates',
			},
			{
				name: 'description',
				content:
					'Track the latest releases, features, and breaking changes for Claude Code, Codex, and other CLI developer tools. All updates in one place.',
			},
			{
				property: 'og:type',
				content: 'website',
			},
			{
				property: 'og:title',
				content: 'changelogs.directory - Latest Developer Tool Updates',
			},
			{
				property: 'og:description',
				content:
					'Track changelogs, releases, and updates for your favorite developer tools with a single, searchable hub.',
			},
			{
				property: 'og:url',
				content: 'https://changelogs.directory/',
			},
			{
				property: 'og:image',
				content: 'https://changelogs.directory/og-image.png',
			},
			{
				name: 'twitter:card',
				content: 'summary_large_image',
			},
			{
				name: 'twitter:creator',
				content: '@leodoan_',
			},
			{
				name: 'twitter:title',
				content: 'changelogs.directory - Latest Developer Tool Updates',
			},
			{
				name: 'twitter:description',
				content:
					'Track the latest releases, features, and breaking changes for your favorite developer tools.',
			},
			{
				name: 'twitter:image',
				content: 'https://changelogs.directory/og-image.png',
			},
		],
		links: [
			{
				rel: 'canonical',
				href: 'https://changelogs.directory/',
			},
		],
	}),
	loader: async () => {
		const data = await getLatestReleasesAcrossTools({
			data: { limit: INITIAL_RELEASE_LIMIT, offset: 0 },
		})
		return data
	},
	pendingComponent: HomePageSkeleton,
	errorComponent: HomePageError,
	component: HomePage,
})

function HomePage() {
	const initialData = Route.useLoaderData()
	const fetchReleases = useServerFn(getLatestReleasesAcrossTools)

	// State
	const [selectedTypes, setSelectedTypes] = useState<string[]>([])
	const [selectedTools, setSelectedTools] = useState<string[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const debouncedSearchQuery = useDebounce(searchQuery, 300)
	const isSearching = searchQuery !== debouncedSearchQuery
	const [releases, setReleases] = useState(initialData.releases)
	const [pagination, setPagination] = useState(initialData.pagination)
	const [isMounted, setIsMounted] = useState(false)
	const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
	const [hoveredTool, setHoveredTool] = useState<string | null>(null)

	// Mount animation trigger
	useEffect(() => {
		setIsMounted(true)
	}, [])

	// Fetch more releases when filters change
	useEffect(() => {
		const refetch = async () => {
			try {
				const data = await fetchReleases({
					data: {
						limit: INITIAL_RELEASE_LIMIT,
						offset: 0,
						changeTypes:
							selectedTypes.length > 0
								? (selectedTypes as ChangeType[])
								: undefined,
						toolSlugs: selectedTools.length > 0 ? selectedTools : undefined,
					},
				})
				setReleases(data.releases)
				setPagination(data.pagination)
			} catch (error) {
				console.error('Error fetching releases:', error)
				captureException(error)
			}
		}

		refetch()
	}, [selectedTypes, selectedTools, fetchReleases])

	// Extract hero release (first one)
	const heroRelease = releases[0]

	// Apply client-side search filter to feed releases
	const feedReleases = releases.slice(1).filter((release) => {
		if (!debouncedSearchQuery) return true

		const query = debouncedSearchQuery.toLowerCase()
		const matchesToolName = release.tool.name.toLowerCase().includes(query)
		const matchesVendor = release.tool.vendor?.toLowerCase().includes(query)
		const matchesVersion = release.version.toLowerCase().includes(query)
		const matchesHeadline = release.headline?.toLowerCase().includes(query)
		const matchesSummary = release.summary?.toLowerCase().includes(query)

		return (
			matchesToolName ||
			matchesVendor ||
			matchesVersion ||
			matchesHeadline ||
			matchesSummary
		)
	})
	const limitedFeedReleases = feedReleases.slice(0, MAX_FEED_RELEASES)

	const handleToolToggle = (slug: string) => {
		setSelectedTools((prev) =>
			prev.includes(slug)
				? prev.filter((toolSlug) => toolSlug !== slug)
				: [...prev, slug],
		)
	}

	// Build tool metadata map from current releases
	const toolMetadataMap = releases.reduce(
		(map, release) => map.set(release.tool.slug, release.tool),
		new Map<string, ReleaseData['tool']>(),
	)

	// Calculate stats
	const totalTools = new Set(releases.map((r) => r.tool.slug)).size
	const totalReleases = pagination.totalCount
	const trackedToolLogos = trackedToolSlugs
		.map((slug) => ({
			slug,
			logo: getToolLogo(slug),
		}))
		.filter(
			(
				entry,
			): entry is { slug: TrackedToolSlug; logo: NonNullable<ReactNode> } =>
				Boolean(entry.logo),
		)

	const toolFilterOptions: ToolFilterOption[] = trackedToolSlugs.flatMap(
		(slug) => {
			const toolMeta = toolMetadataMap.get(slug)
			const logo = getToolLogo(slug)
			if (!logo) {
				return []
			}
			return [
				{
					slug,
					name: toolMeta?.name ?? slug,
					logo,
				},
			]
		},
	)

	return (
		<div className="flex flex-col">
			<main className="flex-1">
				{/* Hero Section */}
				<section className="border-b border-border px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="mx-auto max-w-4xl">
						{/* Page title */}
						<div
							className={`mb-8 text-center transition-all duration-600 ease-out ${
								isMounted
									? 'translate-y-0 opacity-100'
									: 'translate-y-4 opacity-0'
							}`}
						>
							<h1 className="mb-4 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
								What's new
							</h1>
							<p className="mt-3 font-mono text-sm text-muted-foreground/80">
								Track CLI and editor releases in one terminal-like feed.
							</p>
						</div>

						{/* Logo Showcase */}
						<div
							className={`mb-12 transition-all duration-600 ease-out delay-100 ${
								isMounted
									? 'translate-y-0 opacity-100'
									: 'translate-y-4 opacity-0'
							}`}
						>
							<LogoShowcase />
						</div>

						{/* Dashboard-style hero layout */}
						{heroRelease && (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr,300px]">
								{/* Left: Hero release card */}
								<div
									className={`transition-all duration-600 ease-out delay-200 ${
										isMounted
											? 'translate-y-0 opacity-100'
											: 'translate-y-6 opacity-0'
									}`}
								>
									<HeroRelease
										toolSlug={heroRelease.tool.slug}
										toolName={heroRelease.tool.name}
										vendor={heroRelease.tool.vendor}
										version={heroRelease.version}
										releaseDate={heroRelease.releaseDate}
										headline={heroRelease.headline}
										summary={heroRelease.summary}
										changeCount={heroRelease._count.changes}
										changesByType={heroRelease.changesByType}
										hasBreaking={heroRelease.hasBreaking}
										hasSecurity={heroRelease.hasSecurity}
										hasDeprecation={heroRelease.hasDeprecation}
									/>
								</div>

								{/* Right: Stats panel */}
								<div
									className={`transition-all duration-600 ease-out delay-[250ms] ${
										isMounted
											? 'translate-y-0 opacity-100'
											: 'translate-y-6 opacity-0'
									}`}
								>
									<div className="flex h-full flex-col gap-3 rounded border border-border bg-card p-4">
										<div className="border-b border-border/40 pb-2">
											<h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
												System Status
											</h3>
										</div>

										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between border-b border-border/40 pb-2">
												<span className="font-mono text-xs text-muted-foreground">
													Status
												</span>
												<div className="flex items-center gap-1.5">
													<span className="relative flex h-3 w-3 items-center justify-center">
														<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-40" />
														<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
													</span>
													<span className="font-mono text-xs font-medium text-foreground">
														Operational
													</span>
												</div>
											</div>

											<div className="flex items-baseline justify-between">
												<span className="font-mono text-xs text-muted-foreground">
													Tools tracked
												</span>
												<div className="flex items-center gap-2">
													<span className="font-mono text-sm font-semibold">
														{totalTools}
													</span>
													<div className="flex items-center gap-1">
														{trackedToolLogos.map(({ slug, logo }) => (
															<div
																key={slug}
																className={cn(
																	'flex size-6 items-center justify-center rounded bg-secondary p-1 text-foreground [&>svg]:size-full',
																	isMonochromeLogo(slug) &&
																		'[&>svg]:fill-foreground [&>svg_path]:fill-foreground',
																)}
															>
																{logo}
															</div>
														))}
													</div>
												</div>
											</div>

											<div className="flex items-baseline justify-between">
												<span className="font-mono text-xs text-muted-foreground">
													Total releases
												</span>
												<span className="font-mono text-sm font-semibold">
													{totalReleases}
												</span>
											</div>

											<div className="mt-2 border-t border-border/40 pt-3">
												<div className="mb-1 font-mono text-xs text-muted-foreground">
													Latest
												</div>
												<div className="font-mono text-xs">
													<span className="text-foreground">
														{heroRelease.tool.name}
													</span>
													<span className="mx-1 text-muted-foreground/50">
														•
													</span>
													<span className="text-muted-foreground">
														{formatVersionForDisplay(
															heroRelease.version,
															heroRelease.tool.slug,
														)}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Feed Section */}
				<section className="px-4 py-12 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-7xl">
						{/* Terminal-style frame wrapper */}
						<div className="rounded-none border border-border/60 bg-card/40 md:rounded-sm">
							{/* Command Strip */}
							<div
								className={`border-b border-border/40 transition-all duration-600 ease-out delay-300 ${
									isMounted
										? 'translate-y-0 opacity-100'
										: 'translate-y-4 opacity-0'
								}`}
							>
								<div className="flex flex-col gap-3 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
										<span className="hidden sm:inline">
											Command palette (coming soon)
										</span>
										<span className="hidden sm:inline text-muted-foreground/50">
											/
										</span>
										<span>Search releases</span>
										<span className="text-muted-foreground/50">/</span>
										<span>Filter by type</span>
									</div>

									<div className="relative flex-1 sm:max-w-xs">
										<input
											type="search"
											placeholder="Search tools, versions, or release notes..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											aria-label="Search releases by tool, version, or release notes"
											className="w-full rounded border border-border bg-secondary px-3 py-1.5 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 focus-visible:border-foreground/40 focus-visible:ring-2"
										/>
										{isSearching && (
											<Loader2 className="absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground/50" />
										)}
									</div>
								</div>
							</div>

							{/* Filters */}
							<div
								className={`border-b border-border/40 transition-all duration-600 ease-out delay-[350ms] ${
									isMounted
										? 'translate-y-0 opacity-100'
										: 'translate-y-4 opacity-0'
								}`}
							>
								<div className="p-4">
									<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
										<FeedFilters
											selectedTypes={selectedTypes}
											onTypeChange={setSelectedTypes}
										/>

										{toolFilterOptions.length > 0 && (
											<div className="flex flex-wrap items-center gap-3 lg:justify-end">
												<div className="flex flex-wrap gap-2">
													{toolFilterOptions.map(({ slug, name, logo }) => {
														const isSelected = selectedTools.includes(slug)
														return (
															<button
																key={slug}
																type="button"
																onClick={() => handleToolToggle(slug)}
																aria-pressed={isSelected}
																aria-label={`Filter by ${name}`}
																onMouseEnter={() => setHoveredTool(slug)}
																onMouseLeave={() => setHoveredTool(null)}
																onFocus={() => setHoveredTool(slug)}
																onBlur={() => setHoveredTool(null)}
																className={`group flex flex-col items-center gap-1 rounded border bg-secondary px-3 py-2 text-center transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 hover:border-foreground/40 hover:bg-card/80 ${
																	isSelected
																		? 'border-foreground/60 text-foreground'
																		: 'border-border/60 text-muted-foreground'
																}`}
															>
																<span
																	className={cn(
																		'flex size-8 items-center justify-center text-current transition-transform duration-700 ease-out group-hover:rotate-30 [&>svg]:size-5',
																		isMonochromeLogo(slug) &&
																			'[&>svg]:fill-foreground [&>svg_path]:fill-foreground',
																	)}
																>
																	{logo}
																</span>
															</button>
														)
													})}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Stats */}
							<div
								className={`border-b border-border/40 flex items-center gap-4 px-4 py-3 text-sm text-muted-foreground transition-opacity duration-600 ease-out delay-[400ms] ${
									isMounted ? 'opacity-100' : 'opacity-0'
								}`}
							>
								<div className="flex items-center gap-2">
									<span className="font-mono font-semibold text-foreground">
										{totalTools}
									</span>
									<span>tools tracked</span>
								</div>
								<span className="text-muted-foreground/50">•</span>
								<div className="flex items-center gap-2">
									<span className="font-mono font-semibold text-foreground">
										{totalReleases}
									</span>
									<span>total releases</span>
								</div>
							</div>

							{/* Feed Grid */}
							<div className="p-6">
								{limitedFeedReleases.length > 0 ? (
									<div
										className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ease-out ${
											isSearching ? 'opacity-60' : 'opacity-100'
										}`}
									>
										{limitedFeedReleases.map((release, index) => (
											<FeedReleaseCardWithReveal
												key={release.id}
												release={release}
												index={index}
												isMounted={isMounted}
												hoveredCardId={hoveredCardId}
												hoveredTool={hoveredTool}
												setHoveredCardId={setHoveredCardId}
												setHoveredTool={setHoveredTool}
												isSearching={isSearching}
											/>
										))}
									</div>
								) : (
									<div
										className={`py-12 text-center transition-opacity duration-300 ease-out ${
											isSearching ? 'opacity-60' : 'opacity-100'
										}`}
									>
										<p className="text-muted-foreground">
											No releases found matching your filters.
										</p>
									</div>
								)}
							</div>
						</div>

						{/* View all link */}
						<div className="mt-12 flex flex-col items-center gap-2 text-center">
							<p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
								Need deeper history?
							</p>
							<Link
								to="/tools"
								className="font-mono text-sm uppercase tracking-wide text-foreground transition-colors hover:text-muted-foreground"
							>
								All tools →
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	)
}

// Component wrapper with scroll reveal for each feed card
function FeedReleaseCardWithReveal({
	release,
	index,
	isMounted,
	hoveredCardId,
	hoveredTool,
	setHoveredCardId,
	setHoveredTool,
	isSearching,
}: {
	release: ReleaseData
	index: number
	isMounted: boolean
	hoveredCardId: string | null
	hoveredTool: string | null
	setHoveredCardId: (cardId: string | null) => void
	setHoveredTool: (toolSlug: string | null) => void
	isSearching: boolean
}) {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.1 })

	// Calculate stagger delay for initial load (stagger by 50ms for smoother entrance)
	const initialDelay = 450 + index * 50

	// Determine if this card should be dimmed
	const isDimmed = hoveredTool !== null && hoveredTool !== release.tool.slug
	// Only the specific hovered card gets border highlight
	const isThisCardHovered = hoveredCardId === release.id
	// Cards of same tool get colored dots
	const isSameToolHovered = hoveredTool === release.tool.slug

	return (
		<div
			ref={ref}
			className={`transition-all ease-out ${
				isMounted && (isVisible || isSearching)
					? 'translate-y-0 opacity-100 duration-400'
					: 'translate-y-4 opacity-0 duration-600'
			}`}
			style={{
				transitionDelay: isSearching ? '0ms' : `${initialDelay}ms`,
			}}
		>
			<FeedReleaseCard
				toolSlug={release.tool.slug}
				toolName={release.tool.name}
				vendor={release.tool.vendor}
				version={release.version}
				releaseDate={release.releaseDate}
				headline={release.headline}
				changeCount={release._count.changes}
				changesByType={release.changesByType}
				hasBreaking={release.hasBreaking}
				hasSecurity={release.hasSecurity}
				hasDeprecation={release.hasDeprecation}
				isThisCardHovered={isThisCardHovered}
				isSameToolHovered={isSameToolHovered}
				isDimmed={isDimmed}
				onHoverStart={() => {
					setHoveredCardId(release.id)
					setHoveredTool(release.tool.slug)
				}}
				onHoverEnd={() => {
					setHoveredCardId(null)
					setHoveredTool(null)
				}}
			/>
		</div>
	)
}

function HomePageError({
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
				title="Failed to load releases"
				message="We couldn't load the latest releases feed."
				detail={detail ?? undefined}
				onRetry={reset}
			/>
		</div>
	)
}
