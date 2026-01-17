import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CompactSystemStatus } from '@/components/subscribe/compact-system-status'
import { FeatureCarousel } from '@/components/subscribe/feature-carousel'
import { FeaturePreview } from '@/components/subscribe/feature-preview'
import { FeaturesGrid, features } from '@/components/subscribe/features-grid'
import { SubscribeForm } from '@/components/subscribe/subscribe-form'
import { SystemMonitor } from '@/components/subscribe/system-monitor'
import { getWaitlistDailySignups, getWaitlistStats } from '@/server/admin'
import { getDigestPreviewData } from '@/server/digest'

export const Route = createFileRoute('/subscribe')({
	loader: async () => {
		const [waitlistStats, dailySignups, digestPreview] = await Promise.all([
			getWaitlistStats(),
			getWaitlistDailySignups(),
			getDigestPreviewData(),
		])

		return {
			totalSubscribers: waitlistStats.totalCount,
			last24h: waitlistStats.last24h,
			last7d: waitlistStats.last7d,
			recentSignups: waitlistStats.recentSignups,
			chartData: dailySignups,
			digestPreview,
		}
	},
	head: () => {
		const baseUrl = process.env.VITE_BASE_URL || 'https://changelogs.directory'
		return {
			meta: [
				{ title: 'Subscribe | changelogs.directory' },
				{
					name: 'description',
					content:
						'Subscribe to the weekly digest. Get curated changelog updates from your favorite developer tools delivered to your inbox.',
				},
				{
					name: 'keywords',
					content:
						'subscribe, newsletter, changelog, developer tools, weekly digest',
				},
				{
					property: 'og:title',
					content: 'Subscribe to changelogs.directory',
				},
				{
					property: 'og:description',
					content:
						'Get curated changelog updates from your favorite developer tools delivered to your inbox.',
				},
				{
					property: 'og:url',
					content: `${baseUrl}/subscribe`,
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
					name: 'twitter:title',
					content: 'Subscribe to changelogs.directory',
				},
				{
					name: 'twitter:description',
					content:
						'Get curated changelog updates from your favorite developer tools delivered to your inbox.',
				},
			],
		}
	},
	component: SubscribePage,
})

function SubscribePage() {
	const { totalSubscribers, last24h, last7d, recentSignups, digestPreview } =
		Route.useLoaderData()
	const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
	const previewRef = useRef<HTMLDivElement>(null)

	const selectedFeatureData = features.find((f) => f.id === selectedFeature)

	const handleSelectFeature = (id: string) => {
		setSelectedFeature((prev) => (prev === id ? null : id))
	}

	useEffect(() => {
		if (selectedFeature && previewRef.current) {
			setTimeout(() => {
				previewRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'start',
				})
			}, 100)
		}
	}, [selectedFeature])

	return (
		<div className="relative min-h-screen w-full overflow-hidden pb-12 pt-20">
			<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<SubscribeHeader />

				{/* Subscribe Form - immediately after header */}
				<section className="mt-10">
					<SectionHeader title="Join the feed" delay={0.2} />
					<SubscribeForm delay={0.3} />
				</section>

				{/* Main content grid - Features + System Monitor side by side */}
				<div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-5">
					{/* Left column - Features */}
					<div className="lg:col-span-3">
						<SectionHeader title="What you get" delay={0.5} />
						{/* Desktop: Grid layout */}
						<FeaturesGrid
							selectedFeatureId={selectedFeature}
							onSelectFeature={handleSelectFeature}
							className="hidden md:grid"
						/>
						{/* Mobile: Horizontal carousel */}
						<FeatureCarousel
							features={features}
							selectedFeatureId={selectedFeature}
							onSelectFeature={handleSelectFeature}
						/>
					</div>

					{/* Right column - System Monitor */}
					<div className="flex flex-col lg:col-span-2">
						<SectionHeader title="System status" delay={0.6} />
						{/* Desktop: Full system monitor */}
						<SystemMonitor
							className="hidden flex-1 md:flex md:flex-col"
							totalSubscribers={totalSubscribers}
							last24h={last24h}
							last7d={last7d}
							recentSignups={recentSignups}
						/>
						{/* Mobile: Compact summary with sheet */}
						<CompactSystemStatus
							totalSubscribers={totalSubscribers}
							last24h={last24h}
							last7d={last7d}
							recentSignups={recentSignups}
						/>
					</div>
				</div>

				{/* Full-width Preview Section */}
				<AnimatePresence>
					{selectedFeatureData && selectedFeatureData.status === 'active' && (
						<div className="mt-8" ref={previewRef}>
							<FeaturePreview
								featureId={selectedFeatureData.id}
								featureTitle={selectedFeatureData.title}
								onClose={() => setSelectedFeature(null)}
								htmlPreview={digestPreview.htmlPreview}
								hasReleases={digestPreview.hasReleases}
							/>
						</div>
					)}
				</AnimatePresence>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.2 }}
					className="mt-16 border-t border-white/10 pt-8 text-center"
				>
					<p className="font-mono text-xs text-muted-foreground/40">
						<span className="text-muted-foreground/60">{'//'}</span> No spam,
						ever. Unsubscribe with one click.
					</p>
				</motion.div>
			</div>
		</div>
	)
}

function SubscribeHeader() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="text-center"
		>
			{/* Status badge */}
			<div className="mb-6 flex items-center justify-center gap-3">
				<div className="h-px w-12 bg-gradient-to-r from-transparent to-green-500/50" />
				<div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 ring-1 ring-green-500/20">
					<span className="size-1.5 animate-pulse rounded-full bg-green-500" />
					<span className="font-mono text-[10px] uppercase tracking-widest text-green-500">
						Open for signups
					</span>
				</div>
				<div className="h-px w-12 bg-gradient-to-l from-transparent to-green-500/50" />
			</div>

			{/* Main headline */}
			<h1 className="mb-4 font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
				<span className="mr-2 opacity-50">&gt;</span>
				Subscribe to the feed
				<motion.span
					animate={{ opacity: [0, 1, 0] }}
					transition={{ duration: 0.8, repeat: Infinity }}
					className="ml-1 inline-block h-8 w-3 bg-green-500/50 align-middle"
				/>
			</h1>

			{/* Subheadline */}
			<p className="mx-auto max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
				<span className="text-green-500/60">{'//'}</span> Get curated changelog
				updates from your favorite developer tools.
				<br className="hidden sm:block" />
				One email per week. No spam, just changelog intel.
			</p>
		</motion.div>
	)
}

function SectionHeader({
	title,
	delay = 0,
}: {
	title: string
	delay?: number
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
			className="mb-4 flex items-center gap-2"
		>
			<div className="size-1.5 rounded-full bg-green-500/50" />
			<h2 className="font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground">
				{title}
			</h2>
		</motion.div>
	)
}
