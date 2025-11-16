import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FeedFilters } from '@/components/home/feed-filters'
import { FeedReleaseCard } from '@/components/home/feed-release-card'
import { HeroRelease } from '@/components/home/hero-release'
import { LogoShowcase } from '@/components/shared/logo-showcase'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
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
	releaseDate: Date | string
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
	const [releases, setReleases] = useState(initialData.releases)
	const [pagination, setPagination] = useState(initialData.pagination)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [isMounted, setIsMounted] = useState(false)

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
	const feedReleases = releases.slice(1)

	// Calculate stats
	const totalTools = new Set(releases.map((r) => r.tool.slug)).size
	const totalReleases = pagination.totalCount

	return (
		<div className="flex min-h-screen flex-col">
			<main className="flex-1">
				{/* Hero Section */}
				<section className="border-b border-border px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
					<div className="mx-auto max-w-4xl">
						{/* Page title */}
						<div
							className={`mb-12 text-center transition-all duration-700 ${
								isMounted
									? 'translate-y-0 opacity-100'
									: 'translate-y-4 opacity-0'
							}`}
						>
							<h1 className="mb-4 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
								What's new
							</h1>
							<p className="text-lg text-muted-foreground sm:text-xl">
								Latest releases and updates across developer tools
							</p>
						</div>

						{/* Hero release card */}
						{heroRelease && (
							<div
								className={`transition-all duration-700 delay-200 ${
									isMounted
										? 'translate-y-0 opacity-100'
										: 'translate-y-8 opacity-0'
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
						)}
					</div>
				</section>

				{/* Feed Section */}
				<section className="px-4 py-12 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-7xl">
						{/* Filters */}
						<div
							className={`mb-8 transition-all duration-500 delay-300 ${
								isMounted
									? 'translate-y-0 opacity-100'
									: 'translate-y-4 opacity-0'
							}`}
						>
							<FeedFilters
								selectedTypes={selectedTypes}
								onTypeChange={setSelectedTypes}
							/>
						</div>

						{/* Stats */}
						<div
							className={`mb-8 flex items-center gap-4 text-sm text-muted-foreground transition-all duration-400 delay-[400ms] ${
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
						{feedReleases.length > 0 ? (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{feedReleases.map((release, index) => (
									<FeedReleaseCardWithReveal
										key={release.id}
										release={release}
										index={index}
										isMounted={isMounted}
									/>
								))}
							</div>
						) : (
							<div className="py-12 text-center">
								<p className="text-muted-foreground">
									No releases found matching your filters.
								</p>
							</div>
						)}

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

				{/* Logo Showcase */}
				<div
					className={`transition-all duration-700 delay-700 ${
						isMounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
					}`}
				>
					<LogoShowcase />
				</div>
			</main>
		</div>
	)
}

// Component wrapper with scroll reveal for each feed card
function FeedReleaseCardWithReveal({
	release,
	index,
	isMounted,
}: {
	release: ReleaseData
	index: number
	isMounted: boolean
}) {
	const { ref, isVisible } = useScrollReveal({ threshold: 0.1 })

	// Calculate stagger delay for initial load
	const initialDelay = (index + 1) * 100

	return (
		<div
			ref={ref}
			style={{
				animationDelay: `${initialDelay}ms`,
				animationFillMode: 'both',
			}}
			className={`transition-all duration-700 ${
				isMounted
					? 'animate-in fade-in slide-in-from-bottom-4'
					: 'translate-y-8 opacity-0'
			} ${isVisible ? 'translate-y-0 opacity-100' : ''}`}
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
			/>
		</div>
	)
}
