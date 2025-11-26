import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ToolHero } from '@/components/changelog/tool/tool-hero'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { captureException } from '@/integrations/sentry'
import { getToolMetadata } from '@/server/tools'

export const Route = createFileRoute('/tools/$slug')({
	loader: async ({ params }) => {
		const tool = await getToolMetadata({ data: { slug: params.slug } })
		return { tool }
	},
	errorComponent: ToolLayoutError,
	component: ToolLayout,
})

function ToolLayout() {
	const { tool } = Route.useLoaderData()
	const { slug } = Route.useParams()

	if (!tool) {
		return (
			<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h2 className="mb-2 text-xl font-semibold">Tool not found</h2>
					<p className="text-muted-foreground">
						The requested tool could not be found.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="relative min-h-screen w-full overflow-hidden">
			<div className="container mx-auto max-w-7xl px-4 pt-20 pb-12 md:pt-32">
				<ToolHero slug={slug} tool={tool} />
				<Outlet />
			</div>
		</div>
	)
}

function ToolLayoutError({
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
				title="Failed to load tool"
				message="We couldn't load this tool's details."
				detail={detail ?? undefined}
				onRetry={reset}
			/>
		</div>
	)
}
