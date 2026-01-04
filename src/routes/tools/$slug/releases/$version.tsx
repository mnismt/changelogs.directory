import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { ChangeItem } from '@/components/changelog/release/change-item'
import { ReleaseDetailSkeleton } from '@/components/changelog/release/release-detail-skeleton'
import { VersionList } from '@/components/changelog/release/version-list'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import type { Change, ChangeType } from '@/generated/prisma/client'
import { captureException } from '@/integrations/sentry'
import {
	getAdjacentVersions,
	getAllVersions,
	getReleaseWithChanges,
} from '@/server/tools'

export const Route = createFileRoute('/tools/$slug/releases/$version')({
	loader: async ({ params }) => {
		const [release, adjacentVersions, allVersions] = await Promise.all([
			getReleaseWithChanges({
				data: { toolSlug: params.slug, version: params.version },
			}),
			getAdjacentVersions({
				data: { toolSlug: params.slug, version: params.version },
			}),
			getAllVersions({
				data: { slug: params.slug },
			}),
		])

		return {
			release,
			adjacentVersions,
			allVersions,
		}
	},
	pendingComponent: ReleaseDetailSkeleton,
	errorComponent: ReleaseDetailError,
	component: ReleaseDetailPage,
	head: ({ params, loaderData }) => {
		const baseUrl =
			import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'
		const formattedVersion =
			loaderData?.release?.formattedVersion || params.version
		const toolName = loaderData?.release?.tool?.name ?? 'Release'
		const pageTitle = `${toolName.toLowerCase()} ${formattedVersion.toLowerCase()} changelog - changelogs.directory`
		const description = `View all changes, features, and bugfixes in ${toolName} version ${formattedVersion}.`

		return {
			meta: [
				{
					title: pageTitle,
				},
				{
					name: 'description',
					content: description,
				},
				// Open Graph tags
				{ property: 'og:type', content: 'website' },
				{
					property: 'og:title',
					content: `${toolName.toLowerCase()} ${formattedVersion.toLowerCase()} changelog`,
				},
				{
					property: 'og:description',
					content: description,
				},
				{
					property: 'og:image',
					content: `${baseUrl}/og/tools/${params.slug}/releases/${params.version}`,
				},
				{
					property: 'og:url',
					content: `${baseUrl}/tools/${params.slug}/releases/${params.version}`,
				},
				// Twitter Card tags
				{ name: 'twitter:card', content: 'summary_large_image' },
				{
					name: 'twitter:title',
					content: `${toolName} ${formattedVersion} Changelog`,
				},
				{
					name: 'twitter:description',
					content: description,
				},
				{
					name: 'twitter:image',
					content: `${baseUrl}/og/tools/${params.slug}/releases/${params.version}`,
				},
			],
		}
	},
})

function ReleaseDetailPage() {
	const { slug, version } = Route.useParams()
	const navigate = useNavigate()

	const { release, adjacentVersions, allVersions } = Route.useLoaderData()

	// Group changes by type and apply filters
	const groupedChanges = useMemo((): Partial<Record<ChangeType, Change[]>> => {
		const empty: Partial<Record<ChangeType, Change[]>> = {
			FEATURE: [],
			BUGFIX: [],
			IMPROVEMENT: [],
			BREAKING: [],
			SECURITY: [],
			DEPRECATION: [],
			PERFORMANCE: [],
			DOCUMENTATION: [],
			OTHER: [],
		}

		if (!release?.changes) return empty

		// Group by type
		const grouped: Partial<Record<ChangeType, Change[]>> = {
			FEATURE: [],
			BUGFIX: [],
			IMPROVEMENT: [],
			BREAKING: [],
			SECURITY: [],
			DEPRECATION: [],
			PERFORMANCE: [],
			DOCUMENTATION: [],
			OTHER: [],
		}

		release.changes.forEach((change) => {
			const arr = grouped[change.type]
			if (arr) {
				arr.push(change)
			}
		})

		return grouped
	}, [release?.changes])

	// Section titles and order
	const sections: Array<{ type: ChangeType; title: string }> = [
		{ type: 'BREAKING', title: '⚠️ Breaking Changes' },
		{ type: 'SECURITY', title: '🔒 Security Updates' },
		{ type: 'FEATURE', title: '✨ New Features' },
		{ type: 'IMPROVEMENT', title: '🚀 Improvements' },
		{ type: 'PERFORMANCE', title: '⚡ Performance' },
		{ type: 'BUGFIX', title: '🐛 Bug Fixes' },
		{ type: 'DEPRECATION', title: '⚠️ Deprecated' },
		{ type: 'DOCUMENTATION', title: '📚 Documentation' },
		{ type: 'OTHER', title: '📦 Other Changes' },
	]

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Only trigger on n/p keys (not in input fields)
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return
			}

			if (e.key === 'n' && adjacentVersions?.next) {
				navigate({
					to: '/tools/$slug/releases/$version',
					params: { slug, version: adjacentVersions.next },
				})
			} else if (e.key === 'p' && adjacentVersions?.prev) {
				navigate({
					to: '/tools/$slug/releases/$version',
					params: { slug, version: adjacentVersions.prev },
				})
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [adjacentVersions, navigate, slug])

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={{
				hidden: { opacity: 0 },
				visible: {
					opacity: 1,
					transition: {
						staggerChildren: 0.1,
						delayChildren: 0.05,
					},
				},
			}}
			className="space-y-8"
		>
			{/* Changes by Type */}
			<AnimatePresence mode="wait">
				{Object.values(groupedChanges).every(
					(changes) => changes.length === 0,
				) ? (
					<motion.div
						key={`empty-${version}`}
						initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
						animate={{
							opacity: 1,
							y: 0,
							filter: 'blur(0px)',
							transition: { duration: 0.4, ease: 'easeOut' },
						}}
						exit={{
							opacity: 0,
							y: -20,
							filter: 'blur(10px)',
							transition: { duration: 0.3, ease: 'easeIn' },
						}}
						className="rounded-lg border border-dashed border-white/10 bg-white/5 p-12 text-center"
					>
						<p className="font-mono text-muted-foreground">
							No changes found in this release.
						</p>
					</motion.div>
				) : (
					<motion.div
						key={`content-${version}`}
						initial="hidden"
						animate="visible"
						exit="exit"
						variants={{
							hidden: { opacity: 0 },
							visible: {
								opacity: 1,
								transition: {
									staggerChildren: 0.1,
									delayChildren: 0.05,
								},
							},
							exit: {
								opacity: 0,
								transition: { duration: 0.2 },
							},
						}}
						className="space-y-10"
					>
						{sections.map((section) => {
							const changes = groupedChanges[section.type]
							if (!changes || changes.length === 0) return null

							return (
								<motion.div
									key={`${section.type}-${version}`}
									layout
									variants={{
										hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
										visible: {
											opacity: 1,
											y: 0,
											filter: 'blur(0px)',
											transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
										},
										exit: {
											opacity: 0,
											y: -10,
											filter: 'blur(5px)',
											transition: { duration: 0.3, ease: 'easeInOut' },
										},
									}}
									className="space-y-4"
								>
									<div className="flex items-center gap-4 pl-2">
										<h3 className="font-mono text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
											{section.title}
										</h3>
										<div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
									</div>

									<div className="space-y-1">
										{changes.map((change) => (
											<ChangeItem
												key={change.id}
												title={change.title}
												description={change.description}
												platform={change.platform}
												isBreaking={change.isBreaking}
												isSecurity={change.isSecurity}
												isDeprecation={change.isDeprecation}
												links={
													change.links
														? (change.links as Array<{
																url: string
																text: string
																type?: string
															}>)
														: null
												}
												media={
													change.media
														? (change.media as Array<{
																type: 'video' | 'image'
																url: string
																alt?: string
															}>)
														: null
												}
											/>
										))}
									</div>
								</motion.div>
							)
						})}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Version List at Bottom */}
			{allVersions && (
				<motion.div
					variants={{
						hidden: { opacity: 0 },
						visible: {
							opacity: 1,
							transition: { duration: 0.5, delay: 0.3 },
						},
					}}
				>
					<VersionList
						toolSlug={slug}
						currentVersion={version}
						versions={allVersions}
					/>
				</motion.div>
			)}
		</motion.div>
	)
}

function ReleaseDetailError({
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
				title="Failed to load release"
				message="We couldn't load this release's details."
				detail={detail ?? undefined}
				onRetry={reset}
			/>
		</div>
	)
}
