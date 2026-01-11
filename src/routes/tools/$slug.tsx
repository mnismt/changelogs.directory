import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ToolHero } from '@/components/changelog/tool/tool-hero'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { captureException } from '@/integrations/sentry'
import { getToolMetadata } from '@/server/tools'

export const Route = createFileRoute('/tools/$slug')({
	loader: async ({ params }) => {
		const tool = await getToolMetadata({ data: { slug: params.slug } })
		if (!tool) {
			throw notFound()
		}
		return { tool }
	},
	errorComponent: ToolLayoutError,
	component: ToolLayout,
	head: ({ params, loaderData }) => {
		const baseUrl =
			import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'
		const toolName = loaderData?.tool?.name ?? 'Tool'
		const toolNameLower = toolName.toLowerCase()
		return {
			meta: [
				{
					title: `${toolNameLower} changelog - changelogs.directory`,
				},
				{
					name: 'description',
					content: `Track all releases and changes for ${toolName}. View detailed changelogs, breaking changes, and feature updates.`,
				},
				// Open Graph tags
				{ property: 'og:type', content: 'website' },
				{
					property: 'og:title',
					content: `${toolNameLower} changelog`,
				},
				{
					property: 'og:description',
					content: `Track all releases and changes for ${toolName}`,
				},
				{
					property: 'og:image',
					content: `${baseUrl}/og/tools/${params.slug}`,
				},
				{
					property: 'og:url',
					content: `${baseUrl}/tools/${params.slug}`,
				},
				// Twitter Card tags
				{ name: 'twitter:card', content: 'summary_large_image' },
				{
					name: 'twitter:title',
					content: `${toolNameLower} changelog`,
				},
				{
					name: 'twitter:description',
					content: `Track all releases and changes for ${toolName}`,
				},
				{
					name: 'twitter:image',
					content: `${baseUrl}/og/tools/${params.slug}`,
				},
			],
		}
	},
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
