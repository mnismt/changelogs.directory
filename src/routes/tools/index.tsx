import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { Card, Carousel } from '@/components/ui/apple-cards-carousel'
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
	head: () => ({
		meta: [
			{
				title: 'Developer Tools Directory - changelogs.directory',
			},
			{
				name: 'description',
				content:
					'Browse changelogs for popular CLI developer tools. Track updates, features, and breaking changes for Claude Code, Codex, and more.',
			},
		],
	}),
})

function ToolsDirectoryPage() {
	const { tools, stats } = Route.useLoaderData()
	const navigate = useNavigate()
	const [isExiting, setIsExiting] = useState(false)
	const [targetHref, setTargetHref] = useState<string | null>(null)

	// Handle navigation after exit animation
	useEffect(() => {
		if (isExiting && targetHref) {
			const timer = setTimeout(() => {
				navigate({ to: targetHref })
			}, 700) // Wait for animations to complete
			return () => clearTimeout(timer)
		}
	}, [isExiting, targetHref, navigate])

	const handleCardNavigate = (href: string) => {
		setTargetHref(href)
		setIsExiting(true)
	}

	// Create carousel cards for each tool
	const toolCards = tools.map((tool, index) => {
		return (
			<Card
				key={tool.id}
				index={index}
				layout
				card={{
					src: `/images/tools/${tool.slug}.png`,
					title: tool.name,
					category: tool.vendor,
					href: `/tools/${tool.slug}`,
				}}
				onNavigate={() => handleCardNavigate(`/tools/${tool.slug}`)}
			/>
		)
	})

	return (
		<div className="container mx-auto max-w-7xl px-4 pb-12 pt-20 md:pt-32">
			{/* Hero Section with fade-in animation */}
			<motion.div
				className="mb-12"
				initial={{ opacity: 0, y: 16 }}
				animate={{
					opacity: isExiting ? 0 : 1,
					y: isExiting ? -8 : 0,
				}}
				transition={{
					duration: isExiting ? 0.3 : 0.7,
					ease: 'easeOut',
					delay: isExiting ? 0.15 : 0,
				}}
			>
				<div className="space-y-4 text-center">
					<h1 className="font-mono text-4xl font-bold sm:text-5xl">
						Developer Tools Directory
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Track changelogs for your favorite CLI tools. Stay updated with the
						latest releases, features, improvements, and breaking changes.
					</p>

					{/* Stats Bar */}
					<div className="relative mx-auto mt-8 max-w-md">
						{/* Sparkles effect above divider */}
						<div className="absolute inset-x-0 -top-8 h-20 w-full">
							<SparklesCore
								background="transparent"
								minSize={0.4}
								maxSize={1}
								particleDensity={100}
								className="h-full w-full"
								particleColor="#FFFFFF"
							/>
						</div>
					</div>
					<div className="mx-auto flex max-w-md items-center justify-center gap-8 border-t border-border pt-6">
						<div className="text-center">
							<div className="font-mono text-3xl font-bold">
								{stats.totalTools}
							</div>
							<div className="text-xs uppercase text-muted-foreground">
								Tools Tracked
							</div>
						</div>
						<div className="h-12 w-px bg-border" />
						<div className="text-center">
							<div className="font-mono text-3xl font-bold">
								{stats.totalReleases}
							</div>
							<div className="text-xs uppercase text-muted-foreground">
								Total Releases
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Tools Carousel */}
			{tools.length > 0 ? (
				<Carousel items={toolCards} initialScroll={0} />
			) : (
				<div className="py-20 text-center">
					<p className="text-muted-foreground">
						No tools found. Check back soon!
					</p>
				</div>
			)}
		</div>
	)
}

function ToolsDirectorySkeleton() {
	return (
		<div className="container mx-auto max-w-7xl px-4 pb-12 pt-20 md:pt-32">
			<div className="mb-12 space-y-4 text-center">
				<div className="mx-auto h-10 w-64 animate-pulse rounded bg-secondary/60" />
				<div className="mx-auto h-4 w-80 animate-pulse rounded bg-secondary/60" />
				<div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8 border-t border-border pt-6">
					<div className="h-12 w-12 animate-pulse rounded bg-secondary/60" />
					<div className="h-12 w-12 animate-pulse rounded bg-secondary/60" />
				</div>
			</div>
			<div className="grid gap-8 sm:grid-cols-2">
				{TOOLS_DIRECTORY_SKELETON_KEYS.map((key) => (
					<div
						key={key}
						className="h-48 animate-pulse rounded border border-border/60 bg-card/60"
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
] as const

function ToolsDirectoryError({
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
				title="Failed to load tools"
				message="We couldn't load the developer tools directory."
				detail={detail ?? undefined}
				onRetry={reset}
			/>
		</div>
	)
}
