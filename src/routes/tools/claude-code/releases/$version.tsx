import type { Change, ChangeType } from '@prisma/client'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Copy, ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ChangeItem } from '@/components/changelog/change-item'
import { CollapsibleSection } from '@/components/changelog/collapsible-section'
import { ReleaseStickyHeader } from '@/components/changelog/release-sticky-header'
import { VersionList } from '@/components/changelog/version-list'
import { ClaudeAI } from '@/components/logo/claude'
import { Accordion } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
	getAdjacentVersions,
	getAllVersions,
	getReleaseWithChanges,
} from '@/server/tools'

export const Route = createFileRoute('/tools/claude-code/releases/$version')({
	loader: async ({ params }) => {
		const [release, adjacentVersions, allVersions] = await Promise.all([
			getReleaseWithChanges({
				data: { toolSlug: 'claude-code', version: params.version },
			}),
			getAdjacentVersions({
				data: { toolSlug: 'claude-code', version: params.version },
			}),
			getAllVersions({
				data: { slug: 'claude-code' },
			}),
		])

		return {
			release,
			adjacentVersions,
			allVersions,
		}
	},
	component: ReleaseDetailPage,
	head: ({ params }) => ({
		meta: [
			{
				title: `Claude Code ${params.version} Changelog - changelogs.directory`,
			},
			{
				name: 'description',
				content: `View all changes, features, and bugfixes in Claude Code version ${params.version}.`,
			},
		],
	}),
})

function ReleaseDetailPage() {
	const { version } = Route.useParams()
	const navigate = useNavigate()
	const [copied, setCopied] = useState(false)

	const { release, adjacentVersions, allVersions } = Route.useLoaderData()

	// Group changes by type and apply filters
	const groupedChanges = useMemo((): Record<ChangeType, Change[]> => {
		const empty: Record<ChangeType, Change[]> = {
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
		const grouped: Record<ChangeType, Change[]> = {
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
			grouped[change.type].push(change)
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

	// Default open sections
	const defaultOpenSections = sections
		.filter(
			(section) =>
				section.type === 'BREAKING' ||
				section.type === 'SECURITY' ||
				section.type === 'FEATURE',
		)
		.map((section) => section.type)

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
					to: '/tools/claude-code/releases/$version',
					params: { version: adjacentVersions.next },
				})
			} else if (e.key === 'p' && adjacentVersions?.prev) {
				navigate({
					to: '/tools/claude-code/releases/$version',
					params: { version: adjacentVersions.prev },
				})
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [adjacentVersions, navigate])

	// Copy permalink
	const copyPermalink = () => {
		const url = window.location.href
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 3000)
		})
	}

	// Not found state
	if (!release) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-12">
				<div className="rounded-lg border border-border bg-card p-8 text-center">
					<h2 className="mb-2 text-xl font-semibold">Release not found</h2>
					<p className="text-muted-foreground">
						The requested release could not be found.
					</p>
				</div>
			</div>
		)
	}

	const formattedDate = release.releaseDate
		? new Date(release.releaseDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: 'Date unknown'

	return (
		<div className="animate-fade-in">
			{/* Sticky Header */}
			{adjacentVersions && allVersions && (
				<ReleaseStickyHeader
					toolSlug="claude-code"
					version={version}
					prevVersion={adjacentVersions.prev}
					nextVersion={adjacentVersions.next}
					allVersions={allVersions}
					logo={<ClaudeAI />}
				/>
			)}

			<div className="container mx-auto max-w-7xl px-4 py-12">
				<div className="space-y-8">
					{/* Back Button & Breadcrumbs */}
					<div className="space-y-4">
						<Link
							to="/tools/claude-code"
							className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>Back to all releases</span>
						</Link>

						{/* Breadcrumbs with Logo */}
						<nav className="flex items-center gap-3">
							<div className="flex items-center gap-3">
								<div className="[&>svg]:h-8 [&>svg]:w-8 [&>svg]:fill-foreground [&>svg_path]:fill-foreground">
									<ClaudeAI />
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Link
										to="/tools/claude-code"
										className="font-mono text-foreground transition-colors hover:text-muted-foreground"
									>
										{release.tool.name}
									</Link>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">Releases</span>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
									<span className="font-mono text-foreground">{version}</span>
								</div>
							</div>
						</nav>
					</div>

					{/* Release Header */}
					<div className="space-y-4 border-b border-border pb-8">
						<div className="flex items-start justify-between gap-4">
							<h1 className="font-mono text-4xl font-bold">{version}</h1>
							<Button
								variant="outline"
								size="sm"
								onClick={copyPermalink}
								className="gap-1 font-mono text-xs transition-all"
							>
								<Copy
									className={`h-3 w-3 transition-all duration-300 ${
										copied ? 'scale-110 text-green-500' : ''
									}`}
								/>
								<span
									className={`transition-all duration-300 ${
										copied ? 'text-green-500' : ''
									}`}
								>
									{copied ? 'Copied!' : 'Copy link'}
								</span>
							</Button>
						</div>

						<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							<span>Released on {formattedDate}</span>
							<span>•</span>
							<span>
								{release.changes.length}{' '}
								{release.changes.length === 1 ? 'change' : 'changes'}
							</span>
							{release.sourceUrl && (
								<>
									<span>•</span>
									<a
										href={release.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 transition-colors hover:text-foreground"
									>
										View source
										<ExternalLink className="h-3 w-3" />
									</a>
								</>
							)}
						</div>

						{release.summary && (
							<p className="text-muted-foreground">{release.summary}</p>
						)}
					</div>

					{/* Changes by Type */}
					{Object.values(groupedChanges).every(
						(changes) => changes.length === 0,
					) ? (
						<div className="rounded-lg border border-border bg-card p-8 text-center">
							<p className="text-muted-foreground">
								No changes found in this release.
							</p>
						</div>
					) : (
						<Accordion
							type="multiple"
							defaultValue={defaultOpenSections}
							className="space-y-0"
						>
							{sections.map((section) => {
								const changes = groupedChanges[section.type]
								if (!changes || changes.length === 0) return null

								return (
									<CollapsibleSection
										key={section.type}
										value={section.type}
										title={section.title}
										count={changes.length}
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
											/>
										))}
									</CollapsibleSection>
								)
							})}
						</Accordion>
					)}

					{/* Version List at Bottom */}
					{allVersions && (
						<VersionList
							toolSlug="claude-code"
							currentVersion={version}
							versions={allVersions}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
