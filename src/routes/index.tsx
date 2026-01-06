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
import { HeroSection } from '@/components/home/hero-section'
import { HomePageSkeleton } from '@/components/home/home-skeleton'
import { ToolLanesFeed } from '@/components/home/tool-lanes-feed'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SparklesCore } from '@/components/ui/sparkles'
import { useDebounce } from '@/hooks/use-debounce'
import { captureException } from '@/integrations/sentry'
import {
	FEED_FILTER_TOOLS,
	getLogoHoverClasses,
	isMonochromeLogo,
} from '@/lib/tool-registry'
import { cn } from '@/lib/utils'
import {
	getLatestReleasesAcrossTools,
	getReleasesGroupedByTool,
} from '@/server/tools'

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

type ToolFilterOption = {
	slug: string
	name: string
	logo: ReactNode
}

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
		// Fetch both hero release and grouped releases in parallel
		const [heroData, groupedData] = await Promise.all([
			getLatestReleasesAcrossTools({
				data: { limit: 1, offset: 0 },
			}),
			getReleasesGroupedByTool({
				data: { releasesPerTool: 8 },
			}),
		])
		return { heroData, groupedData }
	},
	pendingComponent: HomePageSkeleton,
	errorComponent: HomePageError,
	component: HomePage,
})

function HomePage() {
	const { heroData, groupedData: initialGroupedData } = Route.useLoaderData()
	const fetchGroupedReleases = useServerFn(getReleasesGroupedByTool)

	// State
	const [selectedTypes, setSelectedTypes] = useState<string[]>([])
	const [selectedTools, setSelectedTools] = useState<string[]>([])
	const [showPrereleases, setShowPrereleases] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const debouncedSearchQuery = useDebounce(searchQuery, 300)
	const isSearching = searchQuery !== debouncedSearchQuery
	const [isMounted, setIsMounted] = useState(false)

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

	// Fetch grouped releases with React Query (for filter changes)
	const { data: groupedData } = useQuery({
		queryKey: ['groupedReleases', { types: selectedTypes, showPrereleases }],
		queryFn: () =>
			fetchGroupedReleases({
				data: {
					releasesPerTool: 8,
					changeTypes:
						selectedTypes.length > 0
							? (selectedTypes as ChangeType[])
							: undefined,
					includePrereleases: showPrereleases,
				},
			}),
		initialData: initialGroupedData,
	})

	// Extract hero release (first one from heroData)
	const heroRelease = heroData.releases[0]

	const handleToolToggle = (slug: string) => {
		setSelectedTools((prev) =>
			prev.includes(slug)
				? prev.filter((toolSlug) => toolSlug !== slug)
				: [...prev, slug],
		)
	}

	// Calculate stats
	const visibleTools =
		selectedTools.length > 0
			? groupedData.tools.filter((t) => selectedTools.includes(t.slug))
			: groupedData.tools
	const filteredToolsCount = visibleTools.length
	const totalToolsCount = groupedData.pagination.totalTools
	const filteredReleasesCount = visibleTools.reduce(
		(sum, t) => sum + t.releases.length,
		0,
	)
	const totalReleasesCount = groupedData.pagination.totalReleases

	const toolFilterOptions: ToolFilterOption[] = FEED_FILTER_TOOLS.map(
		(tool) => ({
			slug: tool.slug,
			name: tool.name,
			logo: <tool.Logo />,
		}),
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
												placeholder="Search tools, versions..."
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												aria-label="Search releases by tool or version"
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
																	className={`group flex flex-col items-center gap-1 rounded border bg-secondary px-3 py-2 text-center transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 hover:border-foreground/40 hover:bg-card/80 ${
																		isSelected
																			? 'border-foreground/60 text-foreground'
																			: 'border-border/60 text-muted-foreground'
																	}`}
																>
																	<span
																		className={cn(
																			'flex size-8 items-center justify-center text-current transition-transform duration-700 ease-out [&>svg]:size-5',
																			getLogoHoverClasses(slug),
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
											<AnimatedNumber value={filteredToolsCount} />
											<span className="text-muted-foreground/50">/</span>
											<AnimatedNumber value={totalToolsCount} />
										</span>
										<span>tools tracked</span>
									</div>
									<span className="text-muted-foreground/50">•</span>
									<div className="flex items-center gap-2">
										<span className="font-mono font-semibold text-foreground flex items-center gap-1">
											<AnimatedNumber value={filteredReleasesCount} />
											<span className="text-muted-foreground/50">/</span>
											<AnimatedNumber value={totalReleasesCount} />
										</span>
										<span>total releases</span>
									</div>
								</div>

								{/* Tool Lanes Feed */}
								<div
									className={cn(
										'p-6 transition-opacity duration-300 ease-out',
										isSearching ? 'opacity-60' : 'opacity-100',
									)}
								>
									<ToolLanesFeed
										data={groupedData}
										selectedTools={selectedTools}
										searchQuery={debouncedSearchQuery}
									/>
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
