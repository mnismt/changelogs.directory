import { motion, useInView } from 'motion/react'
import type { ReactNode } from 'react'
import { useRef } from 'react'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { formatDate, formatRelativeDate } from '@/lib/date-utils'
import type { PlatformRelease } from '@/lib/parsers/platform-changelog'
import { cn } from '@/lib/utils'

interface MetaTimelineProps {
	releases: PlatformRelease[]
}

export function MetaTimeline({ releases }: MetaTimelineProps) {
	return (
		<div className="relative">
			{/* Vertical timeline line */}
			<div className="absolute left-[11px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

			{/* Release cards */}
			<div className="space-y-8">
				{releases.map((release, index) => (
					<MetaReleaseCard
						key={release.version}
						release={release}
						isLatest={index === 0}
						index={index}
					/>
				))}
			</div>
		</div>
	)
}

interface MetaReleaseCardProps {
	release: PlatformRelease
	isLatest: boolean
	index: number
}

function MetaReleaseCard({ release, isLatest, index }: MetaReleaseCardProps) {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<motion.div
			ref={ref}
			id={`v${release.version}`}
			initial={{ opacity: 0, x: -20 }}
			animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
			transition={{ duration: 0.5, delay: index * 0.1 }}
			className="relative pl-8 scroll-mt-24"
		>
			{/* Timeline node */}
			<div className="absolute left-0 top-6">
				<motion.div
					className={cn(
						'size-6 rounded-full border-2 flex items-center justify-center',
						isLatest
							? 'border-primary bg-primary/20'
							: 'border-border/60 bg-background',
					)}
					animate={
						isLatest
							? {
									boxShadow: [
										'0 0 0 0 rgba(var(--primary), 0.4)',
										'0 0 0 8px rgba(var(--primary), 0)',
									],
								}
							: {}
					}
					transition={{
						duration: 1.5,
						repeat: isLatest ? Number.POSITIVE_INFINITY : 0,
					}}
				>
					<div
						className={cn(
							'size-2 rounded-full',
							isLatest ? 'bg-primary' : 'bg-muted-foreground/40',
						)}
					/>
				</motion.div>
			</div>

			{/* Card */}
			<GlassCard className="group overflow-hidden">
				{/* Version Header */}
				<div className="border-b border-border/40 bg-muted/20 px-6 py-4">
					<div className="flex flex-wrap items-center gap-3">
						<span className="font-mono text-lg font-semibold text-foreground">
							{isInView ? (
								<EncryptedText
									text={`v${release.version}`}
									revealDelayMs={40}
									flipDelayMs={30}
									encryptedClassName="text-primary/60"
									revealedClassName="text-foreground"
								/>
							) : (
								<span className="text-muted-foreground/40">v?.?.?</span>
							)}
						</span>
						{isLatest && (
							<span className="font-mono text-[10px] uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
								[LATEST]
							</span>
						)}
						<span className="font-mono text-xs text-muted-foreground">
							{formatRelativeDate(release.date)} — {release.title}
						</span>
						<span className="ml-auto font-mono text-xs text-muted-foreground/30 transition-colors group-hover:text-muted-foreground">
							{formatDate(release.date, 'dd MMM yyyy')}
						</span>
					</div>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Video (if present) */}
					{release.video && (
						<div
							className="mb-6 overflow-hidden rounded-lg border border-border/40 bg-black/20 mx-auto w-full max-sm:!max-w-full"
							style={
								release.videoWidth
									? { maxWidth: release.videoWidth }
									: undefined
							}
						>
							<video
								src={release.video}
								autoPlay
								loop
								muted
								playsInline
								className="w-full h-auto"
							>
								<track kind="captions" />
							</video>
						</div>
					)}

					{/* Image (if present and no video) */}
					{release.image && !release.video && (
						<div
							className="mb-6 overflow-hidden rounded-lg border border-border/40 bg-black/20 mx-auto w-full max-sm:!max-w-full"
							style={
								release.imageWidth
									? { maxWidth: release.imageWidth }
									: undefined
							}
						>
							<img
								src={release.image}
								alt={`Screenshot for v${release.version}`}
								className="w-full h-auto"
								onError={(e) => {
									e.currentTarget.parentElement?.classList.add('hidden')
								}}
							/>
						</div>
					)}

					{/* Changes List */}
					<ul className="space-y-2">
						{release.changes.map((change) => (
							<li key={change} className="flex items-baseline gap-2">
								<span className="font-mono text-primary/60 text-xs">•</span>
								<span className="font-mono text-sm text-muted-foreground">
									{change}
								</span>
							</li>
						))}
					</ul>
				</div>
			</GlassCard>
		</motion.div>
	)
}

function GlassCard({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-xl border border-border/40 bg-background/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/10 shadow-sm transition-all duration-300 hover:border-border/60 hover:bg-background/30',
				className,
			)}
		>
			{children}
		</div>
	)
}
