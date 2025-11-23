import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ToolCard } from '@/components/changelog/tool/tool-card'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { captureException } from '@/integrations/sentry'
import { getToolLogo } from '@/lib/tool-logos'
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

	return (
		<div className="container mx-auto max-w-7xl px-4 pb-12 pt-20 md:pt-32">
			{/* Hero Section with fade-in animation */}
			<div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
				<div className="space-y-4 text-center">
					<h1 className="font-mono text-4xl font-bold sm:text-5xl">
						Developer Tools Directory
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Track changelogs for your favorite CLI tools. Stay updated with the
						latest releases, features, improvements, and breaking changes.
					</p>

					{/* Stats Bar */}
					<div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8 border-t border-border pt-6">
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
			</div>

			{/* Tools Grid with staggered animation */}
			<div className="grid gap-8 sm:grid-cols-2">
				{tools.map((tool, index) => (
					<div
						key={tool.id}
						className="animate-in fade-in slide-in-from-bottom-4"
						style={{
							animationDelay: `${(index + 1) * 100}ms`,
							animationDuration: '700ms',
							animationFillMode: 'both',
						}}
					>
						<ToolCard
							slug={tool.slug}
							name={tool.name}
							vendor={tool.vendor}
							description={tool.description}
							tags={tool.tags}
							releaseCount={tool._count.releases}
							latestVersion={tool.latestVersion}
							latestReleaseDate={tool.latestReleaseDate}
							logo={getToolLogo(tool.slug)}
						/>
					</div>
				))}
			</div>

			{/* Empty State (shouldn't happen, but good UX) */}
			{tools.length === 0 && (
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
