import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { Layers } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChangeItem } from '@/components/changelog/release/change-item'
import { CollapsibleSection } from '@/components/changelog/release/collapsible-section'
import { ReleaseDetailSkeleton } from '@/components/changelog/release/release-detail-skeleton'
import { SectionNav } from '@/components/changelog/release/section-nav'
import { VersionList } from '@/components/changelog/release/version-list'
import { VersionPickerSheet } from '@/components/changelog/release/version-picker-sheet'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import type { Change, ChangeType } from '@/generated/prisma/client'
import { useSectionObserver } from '@/hooks/use-section-observer'
import { captureException } from '@/integrations/sentry'
import {
	getAdjacentVersions,
	getAllVersions,
	getReleaseWithChanges,
} from '@/server/tools'

export const Route = createFileRoute('/tools/$slug/releases/$version')({
	loader: async ({ params }) => {
		// 1. Fetch critical data (release)
		const release = await getReleaseWithChanges({
			data: { toolSlug: params.slug, version: params.version },
		})

		if (!release) {
			throw notFound()
		}

		// 2. Fetch non-critical data in parallel (resilient)
		const [adjacentVersions, allVersions] = await Promise.all([
			getAdjacentVersions({
				data: { toolSlug: params.slug, version: params.version },
			}).catch(() => ({
				prev: null,
				next: null,
				formattedPrev: null,
				formattedNext: null,
			})),
			getAllVersions({
				data: { slug: params.slug },
			}).catch(() => []),
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

	// Version picker state
	const [isVersionPickerOpen, setIsVersionPickerOpen] = useState(false)

	// Section refs for scroll observation
	const sectionRefsMap = useRef<Map<ChangeType, HTMLDivElement | null>>(
		new Map(),
	)
	const { activeSection, visibleSections, scrollToSection } =
		useSectionObserver(sectionRefsMap.current)

	// Group changes by type
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

	// Section definitions
	const sections: Array<{ type: ChangeType; title: string }> = [
		{ type: 'BREAKING', title: '⚠️ Breaking Changes' },
		{ type: 'SECURITY', title: '🔒 Security Updates' },
		{ type: 'FEATURE', title: '✨ New Features' },
		{ type: 'IMPROVEMENT', title: '🚀 Improvements' },
		{ type: 'PERFORMANCE', title: '⚡ Performance' },
		{ type: 'BUGFIX', title: '🐛 Bug Fixes' },
		{ type: 'DEPRECATION', title: '🌅 Deprecated' },
		{ type: 'DOCUMENTATION', title: '📚 Documentation' },
		{ type: 'OTHER', title: '📦 Other Changes' },
	]

	// Active sections (only those with changes)
	const activeSections = useMemo(() => {
		return sections
			.filter((section) => {
				const changes = groupedChanges[section.type]
				return changes && changes.length > 0
			})
			.map((section) => ({
				type: section.type,
				title: section.title,
				count: groupedChanges[section.type]?.length ?? 0,
			}))
	}, [groupedChanges, sections])

	// Ref setter callback
	const setSectionRef = useCallback(
		(type: ChangeType) => (el: HTMLDivElement | null) => {
			sectionRefsMap.current.set(type, el)
		},
		[],
	)

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
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

	const hasChanges = !Object.values(groupedChanges).every(
		(changes) => changes.length === 0,
	)

	return (
		<>
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
				className="space-y-8 pb-24 md:pb-8"
			>
				{/* Changes by Type */}
				<AnimatePresence mode="wait">
					{!hasChanges ? (
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
									>
										<CollapsibleSection
											type={section.type}
											title={section.title}
											changes={changes}
											onSectionRef={setSectionRef(section.type)}
										>
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
										</CollapsibleSection>
									</motion.div>
								)
							})}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Version List at Bottom - Desktop only */}
				{allVersions && (
					<motion.div
						variants={{
							hidden: { opacity: 0 },
							visible: {
								opacity: 1,
								transition: { duration: 0.5, delay: 0.3 },
							},
						}}
						className="hidden md:block"
					>
						<VersionList
							toolSlug={slug}
							currentVersion={version}
							versions={allVersions}
						/>
					</motion.div>
				)}
			</motion.div>

			{/* Section Nav */}
			{hasChanges && (
				<SectionNav
					sections={activeSections}
					activeSection={activeSection}
					visibleSections={visibleSections}
					onSectionClick={scrollToSection}
				/>
			)}

			{/* Mobile Version Picker FAB + Sheet */}
			{allVersions && (
				<>
					<motion.button
						type="button"
						onClick={() => setIsVersionPickerOpen(true)}
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{
							type: 'spring',
							stiffness: 260,
							damping: 20,
							delay: 0.5,
						}}
						whileTap={{ scale: 0.9 }}
						className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center size-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-lg"
						aria-label="Open version picker"
					>
						<Layers className="size-5 text-foreground" />
					</motion.button>

					<VersionPickerSheet
						open={isVersionPickerOpen}
						onClose={() => setIsVersionPickerOpen(false)}
						currentVersion={version}
						versions={allVersions}
						toolSlug={slug}
					/>
				</>
			)}
		</>
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
