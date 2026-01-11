import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { KonamiEasterEgg } from '@/components/changelog/konami-easter-egg'
import { MetaTimeline } from '@/components/changelog/meta-timeline'
import { RecursiveBackground } from '@/components/changelog/recursive-background'
import { TerminalBoot } from '@/components/changelog/terminal-boot'
import { getPlatformChangelog, getRawChangelog } from '@/server/platform'

export const Route = createFileRoute('/changelog')({
	loader: async () => {
		const [changelog, rawChangelog] = await Promise.all([
			getPlatformChangelog(),
			getRawChangelog(),
		])
		return { changelog, rawChangelog }
	},
	head: () => {
		const baseUrl = process.env.VITE_BASE_URL || 'https://changelogs.directory'
		return {
			meta: [
				{ title: 'changelog | changelogs.directory' },
				{
					name: 'description',
					content:
						'Track updates to the changelog aggregation platform itself.',
				},
				{
					property: 'og:url',
					content: `${baseUrl}/changelog`,
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
					name: 'twitter:creator',
					content: '@leodoan_',
				},
				{
					name: 'twitter:title',
					content: 'changelogs.directory Changelog',
				},
				{
					name: 'twitter:description',
					content:
						'Track updates to the changelog aggregation platform itself.',
				},
				{
					name: 'twitter:image',
					content: `${baseUrl}/og`,
				},
			],
		}
	},
	component: ChangelogPage,
})

function ChangelogPage() {
	const { changelog, rawChangelog } = Route.useLoaderData()
	const [bootComplete, setBootComplete] = useState(false)

	const totalChanges = changelog.releases.reduce(
		(sum, r) => sum + r.changes.length,
		0,
	)

	// Scroll to hash after boot completes
	useEffect(() => {
		if (bootComplete && typeof window !== 'undefined') {
			const hash = window.location.hash
			if (hash) {
				// Small delay to ensure DOM is ready
				setTimeout(() => {
					const element = document.querySelector(hash)
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'start' })
					}
				}, 100)
			}
		}
	}, [bootComplete])

	return (
		<>
			{/* Boot Sequence */}
			{!bootComplete && (
				<TerminalBoot onComplete={() => setBootComplete(true)} />
			)}

			{/* Recursive Background (unique to this page) */}
			<RecursiveBackground />

			{/* Konami Easter Egg */}
			<KonamiEasterEgg rawChangelog={rawChangelog} />

			{/* Main Content */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: bootComplete ? 1 : 0 }}
				transition={{ duration: 0.5 }}
				className="relative min-h-screen w-full overflow-hidden pt-20 pb-12"
			>
				<div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					{/* Header Section */}
					<ChangelogHeader
						description={changelog.description}
						releaseCount={changelog.releases.length}
						totalChanges={totalChanges}
					/>

					{/* Timeline */}
					<MetaTimeline releases={changelog.releases} />

					{/* Meta Footer */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: bootComplete ? 1 : 0 }}
						transition={{ delay: 1 }}
						className="mt-16 border-t border-border/40 pt-8 text-center"
					>
						<p className="font-mono text-xs text-muted-foreground/70">
							RECURSION_DEPTH: 1 • SELF_REFERENCE: TRUE • PARADOX_LEVEL: STABLE
						</p>
					</motion.div>
				</div>
			</motion.div>
		</>
	)
}

function ChangelogHeader({
	description,
	releaseCount,
	totalChanges,
}: {
	description: string
	releaseCount: number
	totalChanges: number
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className="mb-12"
		>
			{/* Meta badge */}
			<div className="flex items-center gap-3 mb-4 justify-center">
				<div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
				<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
					<div className="size-1.5 rounded-full bg-primary animate-pulse" />
					<span className="font-mono text-[10px] text-primary uppercase tracking-widest">
						Meta
					</span>
				</div>
				<div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
			</div>

			{/* Title */}
			<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center text-foreground font-mono mb-4">
				<span className="opacity-50 mr-2">~/</span>
				changelog
				<motion.span
					animate={{ opacity: [0, 1, 0] }}
					transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
					className="ml-1 inline-block w-3 h-8 bg-primary/50 align-middle"
				/>
			</h1>

			{/* Description */}
			<p className="text-center text-muted-foreground max-w-2xl mx-auto font-mono text-xs md:text-sm leading-relaxed mb-8">
				<span className="text-primary/60">{'//'}</span> {description}
			</p>

			{/* System Status Bar */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
			>
				<div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/10 shadow-sm p-4">
					<div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs">
						<div className="flex items-center gap-2">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
							</span>
							<span className="text-muted-foreground uppercase tracking-wider">
								SELF_AWARE
							</span>
						</div>
						<div className="h-4 w-px bg-border/40" />
						<div className="text-muted-foreground">
							<span className="text-foreground font-medium">
								{releaseCount}
							</span>{' '}
							RELEASES
						</div>
						<div className="h-4 w-px bg-border/40" />
						<div className="text-muted-foreground">
							<span className="text-foreground font-medium">
								{totalChanges}
							</span>{' '}
							CHANGES
						</div>
						<div className="h-4 w-px bg-border/40" />
						<div className="text-muted-foreground">
							<span className="text-foreground font-medium">∞</span> META
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	)
}
