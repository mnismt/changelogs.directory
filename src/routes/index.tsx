import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { FeedFilters } from '@/components/home/feed-filters'
import { FeedReleaseCard } from '@/components/home/feed-release-card'
import { HeroSection } from '@/components/home/hero-section'
import { HomePageSkeleton } from '@/components/home/home-skeleton'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SparklesCore } from '@/components/ui/sparkles'
import { useDebounce } from '@/hooks/use-debounce'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { captureException } from '@/integrations/sentry'
import { getToolLogo, isMonochromeLogo } from '@/lib/tool-logos'
import { cn } from '@/lib/utils'
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
	formattedVersion?: string
}

const trackedToolSlugs = ['claude-code', 'codex', 'cursor'] as const
type TrackedToolSlug = (typeof trackedToolSlugs)[number]
type ToolFilterOption = {
	slug: TrackedToolSlug
	name: string
	logo: ReactNode
}

const MAX_FEED_RELEASES = 12
const INITIAL_RELEASE_LIMIT = MAX_FEED_RELEASES + 1

export const Route = createFileRoute('/')({
	head: () => {
		const baseUrl =
			import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'
		return {
			meta: [
				{
					title: 'changelogs.directory - latest developer tool updates',
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
					content: 'changelogs.directory - latest developer tool updates',
				},
				{
					property: 'og:description',
					content:
						'Track changelogs, releases, and updates for your favorite developer tools with a single, searchable hub.',
				},
				{
					property: 'og:url',
					content: `${baseUrl}/`,
				},
				{
					property: 'og:image',
					content: `${baseUrl}/og`,
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
					content: `${baseUrl}/og`,
				},
			],
			links: [
				{
					rel: 'canonical',
					href: `${baseUrl}/`,
				},
			],
		}
	},
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
	const [showPrereleases, setShowPrereleases] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const debouncedSearchQuery = useDebounce(searchQuery, 300)
	const isSearching = searchQuery !== debouncedSearchQuery
	const [isMounted, setIsMounted] = useState(false)
	const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
	const [hoveredTool, setHoveredTool] = useState<string | null>(null)

	const viewReleasesSparkles = useMemo(
		() => (
			<SparklesCore
				background="transparent"
				minSize={0.4}
				maxSize={1}
				particleDensity={30}
				className="h-full w-full"
				particleColor="#FFFFFF"
			/>
		),
		[],
	)

	// Animation State Machine
	type AnimationStep = 'hero' | 'connector' | 'prompt' | 'expanding' | 'done'
	const [animationStep, setAnimationStep] = useState<AnimationStep>('hero')

	// Mount animation trigger
	useEffect(() => {
		setIsMounted(true)
	}, [])

	// Fetch releases with React Query
	const { data } = useQuery({
		queryKey: [
			'releases',
			{ types: selectedTypes, tools: selectedTools, showPrereleases },
		],
		queryFn: () =>
			fetchReleases({
				data: {
					limit: INITIAL_RELEASE_LIMIT,
					offset: 0,
					changeTypes:
						selectedTypes.length > 0
							? (selectedTypes as ChangeType[])
							: undefined,
					toolSlugs: selectedTools.length > 0 ? selectedTools : undefined,
					includePrereleases: showPrereleases,
				},
			}),
		initialData: initialData,
	})

	const releases = data.releases
	const pagination = data.pagination

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
	const filteredTools = pagination.matchingToolsCount ?? 0
	const totalTools = initialData.pagination.matchingToolsCount ?? 0
	const filteredReleases = pagination.totalCount
	const totalReleases = initialData.pagination.totalCount

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

	// Handle animation transitions
	useEffect(() => {
		if (animationStep === 'connector') {
			// Draw line for 600ms, then show prompt
			const timer = setTimeout(() => setAnimationStep('prompt'), 600)
			return () => clearTimeout(timer)
		}
		if (animationStep === 'prompt') {
			// Type command for 800ms, then expand feed
			const timer = setTimeout(() => setAnimationStep('expanding'), 1000)
			return () => clearTimeout(timer)
		}
		if (animationStep === 'expanding') {
			// Expand for 1000ms, then finish
			const timer = setTimeout(() => setAnimationStep('done'), 1000)
			return () => clearTimeout(timer)
		}
	}, [animationStep])

	const showFeed = animationStep === 'expanding' || animationStep === 'done'

	// Stable callback to prevent infinite loops in HeroSection effect
	const handleHeroAnimationComplete = useCallback(() => {
		setAnimationStep((prev) => (prev === 'hero' ? 'connector' : prev))
	}, [])

	return (
		<div className="flex-1 pt-20 sm:pt-24 lg:pt-28">
			{/* Hero Section */}
			<HeroSection
				heroRelease={heroRelease}
				isMounted={isMounted}
				onAnimationComplete={handleHeroAnimationComplete}
			/>

			{/* Connector & Prompt Section */}
			<div className="flex flex-col items-center justify-center">
				{/* Connector Line */}
				<div
					className={cn(
						'w-px bg-gradient-to-b from-border/0 via-border to-border/0 transition-all duration-500 ease-out',
						animationStep === 'hero' ? 'h-0 opacity-0' : 'h-12 opacity-100',
					)}
				/>

				{/* Terminal Prompt */}
				<div
					className={cn(
						'font-mono text-sm transition-all duration-300 flex items-center gap-2 relative',
						animationStep === 'hero' || animationStep === 'connector'
							? 'opacity-0 translate-y-[-10px]'
							: 'opacity-100 translate-y-0',
					)}
				>
					{/* Sparkles Effect */}
					<div className="absolute top-1/2 left-0 h-24 w-full -translate-y-1/2 pointer-events-none">
						{viewReleasesSparkles}
					</div>
					<span className="text-muted-foreground/50">$</span>
					<span className="text-foreground">
						{animationStep === 'prompt' ? (
							<TypewriterText text="view releases" />
						) : (
							'view releases'
						)}
					</span>
					{animationStep === 'prompt' && (
						<span className="animate-pulse text-green-500">_</span>
					)}
				</div>

				{/* Connector Line to Feed */}
				<div
					className={cn(
						'w-px bg-gradient-to-b from-border/0 via-border to-border/0 transition-all duration-500 ease-out',
						showFeed ? 'h-12 opacity-100' : 'h-0 opacity-0',
					)}
				/>
			</div>

			{/* Feed Section - Expandable Wrapper */}
			<div
				className={cn(
					'grid transition-[grid-template-rows] duration-1000 ease-in-out',
					showFeed ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
				)}
			>
				<div className="overflow-hidden min-h-0">
					<section className="px-4 pb-12 sm:px-6 lg:px-8">
						<div className="mx-auto max-w-7xl">
							{/* Terminal-style frame wrapper */}
							<div className="rounded-none border border-border/60 bg-card/40 md:rounded-sm">
								{/* Command Strip */}
								<div className="border-b border-border/40">
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
								<div className="border-b border-border/40">
									<div className="p-4">
										<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
											<FeedFilters
												selectedTypes={selectedTypes}
												onTypeChange={setSelectedTypes}
												showPrereleases={showPrereleases}
												onShowPrereleasesChange={setShowPrereleases}
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
								<div className="border-b border-border/40 flex items-center gap-4 px-4 py-3 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<span className="font-mono font-semibold text-foreground flex items-center gap-1">
											<AnimatedNumber value={filteredTools} />
											<span className="text-muted-foreground/50">/</span>
											<AnimatedNumber value={totalTools} />
										</span>
										<span>tools tracked</span>
									</div>
									<span className="text-muted-foreground/50">•</span>
									<div className="flex items-center gap-2">
										<span className="font-mono font-semibold text-foreground flex items-center gap-1">
											<AnimatedNumber value={filteredReleases} />
											<span className="text-muted-foreground/50">/</span>
											<AnimatedNumber value={totalReleases} />
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
													isMounted={true} // Always mounted once expanded
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
				</div>
			</div>
		</div>
	)
}

function TypewriterText({ text }: { text: string }) {
	const [displayedText, setDisplayedText] = useState('')

	useEffect(() => {
		let index = 0
		const interval = setInterval(() => {
			if (index <= text.length) {
				setDisplayedText(text.slice(0, index))
				index++
			} else {
				clearInterval(interval)
			}
		}, 50)
		return () => clearInterval(interval)
	}, [text])

	return <>{displayedText}</>
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
			className={`h-full transition-all ease-out ${
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
				formattedVersion={release.formattedVersion}
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
