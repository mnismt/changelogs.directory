import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { FeedFilters } from '@/components/home/feed-filters'
import { FeedReleaseCard } from '@/components/home/feed-release-card'
import { HeroRelease } from '@/components/home/hero-release'
import { LogoShowcase } from '@/components/shared/logo-showcase'
import { useDebounce } from '@/hooks/use-debounce'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { getToolLogo } from '@/lib/tool-logos'
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

const trackedToolSlugs = ['claude-code', 'codex'] as const
type TrackedToolSlug = (typeof trackedToolSlugs)[number]

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
			data: { limit: 12, offset: 0 },
		})
		return data
	},
	component: HomePage,
})

function HomePage() {
	const initialData = Route.useLoaderData()
	const fetchReleases = useServerFn(getLatestReleasesAcrossTools)

	// State
	const [selectedTypes, setSelectedTypes] = useState<string[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const debouncedSearchQuery = useDebounce(searchQuery, 300)
	const isSearching = searchQuery !== debouncedSearchQuery
	const [releases, setReleases] = useState(initialData.releases)
	const [pagination, setPagination] = useState(initialData.pagination)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [isMounted, setIsMounted] = useState(false)
	const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
	const [hoveredTool, setHoveredTool] = useState<string | null>(null)

	// Refs for infinite scroll
	const sentinelRef = useRef<HTMLDivElement>(null)
	const observerRef = useRef<IntersectionObserver | null>(null)

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
						limit: 12,
						offset: 0,
						changeTypes:
							selectedTypes.length > 0
								? (selectedTypes as ChangeType[])
								: undefined,
					},
				})
				setReleases(data.releases)
				setPagination(data.pagination)
			} catch (error) {
				console.error('Error fetching releases:', error)
			}
		}

		refetch()
	}, [selectedTypes, fetchReleases])

	// Infinite scroll handler
	const loadMore = useCallback(async () => {
		if (isLoadingMore || !pagination.hasMore) return

		setIsLoadingMore(true)
		try {
			const data = await fetchReleases({
				data: {
					limit: 12,
					offset: pagination.offset + pagination.limit,
					changeTypes:
						selectedTypes.length > 0
							? (selectedTypes as ChangeType[])
							: undefined,
				},
			})

			setReleases((prev) => [...prev, ...data.releases])
			setPagination(data.pagination)
		} catch (error) {
			console.error('Error loading more releases:', error)
		} finally {
			setIsLoadingMore(false)
		}
	}, [
		isLoadingMore,
		pagination.hasMore,
		pagination.offset,
		pagination.limit,
		selectedTypes,
		fetchReleases,
	])

	// Set up intersection observer for infinite scroll
	useEffect(() => {
		const sentinel = sentinelRef.current
		if (!sentinel) return

		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMore()
				}
			},
			{ rootMargin: '200px' },
		)

		observerRef.current.observe(sentinel)

		return () => {
			observerRef.current?.disconnect()
		}
	}, [loadMore])

	// Extract hero release (first one)
	const heroRelease = releases[0]

	// Apply client-side search filter to feed releases
	const feedReleases = releases.slice(1).filter((release) => {
		if (!debouncedSearchQuery) return true

		const query = debouncedSearchQuery.toLowerCase()
		const matchesToolName = release.tool.name.toLowerCase().includes(query)
		const matchesVendor = release.tool.vendor?.toLowerCase().includes(query)
		const matchesVersion = release.version.toLowerCase().includes(query)
		const matchesSummary = release.summary?.toLowerCase().includes(query)

		return matchesToolName || matchesVendor || matchesVersion || matchesSummary
	})

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

	return (
		<div className="flex min-h-screen flex-col">
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
													<div className="h-1.5 w-1.5 rounded-full bg-green-500" />
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
																className="flex size-6 items-center justify-center rounded bg-secondary p-1 text-foreground"
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
														v{heroRelease.version}
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
											placeholder="Search tools, versions, summaries..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											aria-label="Search releases by tool name, version, or summary"
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
									<FeedFilters
										selectedTypes={selectedTypes}
										onTypeChange={setSelectedTypes}
									/>
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
								{feedReleases.length > 0 ? (
									<div
										className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ease-out ${
											isSearching ? 'opacity-60' : 'opacity-100'
										}`}
									>
										{feedReleases.map((release, index) => (
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

						{/* Infinite scroll sentinel */}
						<div ref={sentinelRef} className="mt-12 flex justify-center">
							{isLoadingMore && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading more releases...
								</div>
							)}
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
				summary={release.summary}
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
