import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { ToolCard } from '@/components/tools/tool-card'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { SparklesCore } from '@/components/ui/sparkles'
import { captureException } from '@/integrations/sentry'
import { getAllTools } from '@/server/tools'

export const Route = createFileRoute('/tools/')({
	loader: async () => {
		return await getAllTools()
	},
	pendingComponent: ToolsDirectorySkeleton,
	errorComponent: ToolsDirectoryError,
	component: ToolsDirectoryPage,
	head: () => {
		const baseUrl =
			import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'
		return {
			meta: [
				{
					title: 'developer tools directory - changelogs.directory',
				},
				{
					name: 'description',
					content:
						'Browse changelogs for popular CLI developer tools. Track updates, features, and breaking changes for Claude Code, Codex, and more.',
				},
				// Open Graph tags
				{ property: 'og:type', content: 'website' },
				{
					property: 'og:title',
					content: 'developer tools directory - changelogs.directory',
				},
				{
					property: 'og:description',
					content:
						'Browse changelogs for popular CLI developer tools. Track updates, features, and breaking changes.',
				},
				{
					property: 'og:image',
					content: `${baseUrl}/og/tools`,
				},
				{ property: 'og:url', content: `${baseUrl}/tools` },
				// Twitter Card tags
				{ name: 'twitter:card', content: 'summary_large_image' },
				{
					name: 'twitter:title',
					content: 'Developer Tools Directory - changelogs.directory',
				},
				{
					name: 'twitter:description',
					content:
						'Browse changelogs for popular CLI developer tools. Track updates, features, and breaking changes.',
				},
				{
					name: 'twitter:image',
					content: `${baseUrl}/og/tools`,
				},
			],
		}
	},
})

function ToolsDirectoryPage() {
	const { tools, stats } = Route.useLoaderData()
	const [hoveredToolSlug, setHoveredToolSlug] = useState<string | null>(null)

	return (
		<div className="container mx-auto max-w-7xl px-4 pb-12 pt-20 md:pt-32 relative min-h-screen">
			{/* Global Background Layer */}
			<div className="fixed inset-0 z-[-1] bg-background">
				<AnimatePresence mode="wait">
					{hoveredToolSlug && (
						<motion.div
							key={hoveredToolSlug}
							initial={{ opacity: 0, scale: 1.1 }}
							animate={{ opacity: 0.3, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.7, ease: 'easeOut' }}
							className="absolute inset-0"
						>
							<img
								src={`/images/tools/${hoveredToolSlug}.png`}
								alt=""
								className="h-full w-full object-cover grayscale"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			{/* Header Section */}
			<div className="lg:mb-16 relative">
				<div className="absolute inset-x-0 -top-20 -bottom-20 opacity-30 pointer-events-none">
					<SparklesCore
						background="transparent"
						minSize={0.4}
						maxSize={1}
						particleDensity={150}
						className="h-full w-full"
						particleColor="#FFFFFF"
					/>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: 'easeOut' }}
					className="relative z-10 text-center space-y-6"
				>
					<div className="inline-block">
						<h1 className="font-mono text-4xl font-bold tracking-tighter sm:text-5xl">
							<span className="text-muted-foreground/50 mr-2">~/</span>
							tools
						</h1>
					</div>

					<p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
						Track changelogs for your favorite CLI tools. Stay updated with the
						latest releases, features, improvements, and breaking changes.
					</p>

					{/* System Stats */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.2,
							ease: [0.2, 0.65, 0.3, 0.9],
						}}
						className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8 max-w-3xl mx-auto"
					>
						{/* System Status */}
						<div className="group relative overflow-hidden rounded-lg border border-border/40 bg-card/20 p-4 backdrop-blur-sm transition-all hover:border-green-500/30 hover:bg-card/40">
							<div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
							<div className="relative flex flex-col items-center justify-center gap-2">
								<div className="flex items-center gap-2">
									<span className="relative flex h-2.5 w-2.5">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
										<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
									</span>
									<span className="font-mono text-xs font-medium tracking-wider text-green-500/80">
										SYSTEM_READY
									</span>
								</div>
								<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									Status
								</span>
							</div>
						</div>

						{/* Total Tools */}
						<div className="group relative overflow-hidden rounded-lg border border-border/40 bg-card/20 p-4 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:bg-card/40">
							<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
							<div className="relative flex flex-col items-center justify-center gap-1">
								<div className="flex items-baseline gap-1">
									<AnimatedNumber
										value={stats.totalTools}
										className="font-mono text-2xl font-bold text-foreground"
									/>
								</div>
								<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									Total Tools
								</span>
							</div>
						</div>

						{/* Total Releases */}
						<div className="group relative overflow-hidden rounded-lg border border-border/40 bg-card/20 p-4 backdrop-blur-sm transition-all hover:border-purple-500/30 hover:bg-card/40">
							<div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
							<div className="relative flex flex-col items-center justify-center gap-1">
								<div className="flex items-baseline gap-1">
									<AnimatedNumber
										value={stats.totalReleases}
										className="font-mono text-2xl font-bold text-foreground"
									/>
								</div>
								<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
									Total Releases
								</span>
							</div>
						</div>
					</motion.div>
				</motion.div>
			</div>

			{/* Tools Grid */}
			{tools.length > 0 ? (
				<motion.div
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
					initial="hidden"
					animate="visible"
					variants={{
						visible: {
							transition: {
								staggerChildren: 0.05,
							},
						},
					}}
				>
					{tools.map((tool, index) => (
						<motion.div
							key={tool.id}
							variants={{
								hidden: { opacity: 0, y: 20 },
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										duration: 0.5,
										ease: 'easeOut',
									},
								},
							}}
							className="h-full"
						>
							<ToolCard
								tool={tool}
								latestRelease={
									tool.latestVersion && tool.latestReleaseDate
										? {
												version: tool.latestVersion,
												formattedVersion: tool.formattedLatestVersion,
												createdAt: tool.latestReleaseDate,
											}
										: undefined
								}
								releaseCount={tool._count.releases}
								index={index}
								isHovered={hoveredToolSlug === tool.slug}
								onHoverStart={() => setHoveredToolSlug(tool.slug)}
								onHoverEnd={() => setHoveredToolSlug(null)}
							/>
						</motion.div>
					))}
				</motion.div>
			) : (
				<div className="py-20 text-center">
					<p className="text-muted-foreground font-mono">
						No tools found in directory.
					</p>
				</div>
			)}
		</div>
	)
}

function ToolsDirectorySkeleton() {
	return (
		<div className="container mx-auto max-w-7xl px-4 pb-12 pt-20 md:pt-32">
			<div className="mb-16 space-y-6 text-center">
				<div className="mx-auto h-12 w-48 animate-pulse rounded bg-secondary/60" />
				<div className="mx-auto h-4 w-96 animate-pulse rounded bg-secondary/60" />
				<div className="mx-auto h-4 w-64 animate-pulse rounded bg-secondary/60" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{TOOLS_DIRECTORY_SKELETON_KEYS.map((key) => (
					<div
						key={key}
						className="h-48 animate-pulse rounded border border-border/60 bg-card/40"
					/>
				))}
			</div>
		</div>
	)
}

const TOOLS_DIRECTORY_SKELETON_KEYS = [
	'tools-skeleton-1',
	'tools-skeleton-2',
	'tools-skeleton-3',
	'tools-skeleton-4',
	'tools-skeleton-5',
	'tools-skeleton-6',
] as const

function ToolsDirectoryError({
	error,
	reset,
}: {
	error: unknown
	reset: () => void
}) {
	useState(() => {
		captureException(error)
	})

	const detail =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: null

	return (
		<div className="px-4 py-24">
			<ErrorBoundaryCard
				title="Failed to load tools"
				message="We couldn't load the developer tools directory."
				detail={detail ?? undefined}
				onRetry={reset}
			/>
		</div>
	)
}
