import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useEffect, useState } from 'react'
import { parseMarkdownLinks } from '@/lib/markdown-utils'
import type { PlatformRelease } from '@/lib/parsers/platform-changelog'
import { getPlatformChangelog } from '@/server/platform'

const STORAGE_KEY = 'changelog:lastSeenVersion'
const SWIPE_THRESHOLD = 50

export function WhatsNewToast() {
	const [showToast, setShowToast] = useState(false)
	const [latestRelease, setLatestRelease] = useState<PlatformRelease | null>(
		null,
	)

	useEffect(() => {
		// Only run on client
		if (typeof window === 'undefined') return

		getPlatformChangelog().then((changelog) => {
			const lastSeen = localStorage.getItem(STORAGE_KEY)
			const latest = changelog.releases[0]

			if (lastSeen !== latest.version) {
				setLatestRelease(latest)
				// Delay to not interrupt initial page load
				const timer = setTimeout(() => setShowToast(true), 2000)
				return () => clearTimeout(timer)
			}
		})
	}, [])

	const dismiss = () => {
		if (latestRelease) {
			localStorage.setItem(STORAGE_KEY, latestRelease.version)
		}
		setShowToast(false)
	}

	const handleSeeWhatsNew = () => {
		if (latestRelease) {
			localStorage.setItem(STORAGE_KEY, latestRelease.version)
		}
		setShowToast(false)
	}

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		// Dismiss if swiped down past threshold
		if (info.offset.y > SWIPE_THRESHOLD) {
			dismiss()
		}
	}

	return (
		<AnimatePresence>
			{showToast && latestRelease && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{
						type: 'spring',
						damping: 25,
						stiffness: 300,
					}}
					drag="y"
					dragConstraints={{ top: 0, bottom: 0 }}
					dragElastic={0.3}
					onDragEnd={handleDragEnd}
					className="fixed z-50 bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-[360px]"
				>
					<div className="relative overflow-hidden rounded-xl border border-border/40 bg-black/80 backdrop-blur-xl shadow-2xl touch-pan-x">
						{/* Glow effect */}
						<div className="absolute -top-20 -right-20 size-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

						{/* Swipe indicator - mobile only */}
						<div className="flex flex-col items-center gap-1 pt-2 pb-1 md:hidden">
							<div className="h-1 w-8 rounded-full bg-white/20" />
							<span className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
								Swipe to dismiss
							</span>
						</div>

						{/* Header */}
						<div className="border-b border-border/40 px-4 py-2 bg-muted/10 md:mt-0 -mt-1">
							<span className="font-mono text-[10px] uppercase tracking-widest text-primary/60">
								NEW_RELEASE
							</span>
						</div>

						{/* Content */}
						<div className="p-4">
							<div className="flex items-center gap-2 mb-2">
								<span className="font-mono text-sm font-semibold text-foreground">
									v{latestRelease.version}
								</span>
								<span className="text-muted-foreground">—</span>
								<span className="font-mono text-sm text-muted-foreground truncate">
									{latestRelease.title}
								</span>
							</div>

							<p className="font-mono text-xs text-muted-foreground/80 line-clamp-2 mb-4">
								{parseMarkdownLinks(latestRelease.changes[0])}
							</p>

							<div className="flex gap-2">
								<Link
									to="/changelog"
									onClick={handleSeeWhatsNew}
									className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 font-mono text-xs text-primary hover:bg-primary/20 transition-colors"
								>
									See what's new
								</Link>
								<button
									type="button"
									onClick={dismiss}
									className="px-3 py-2 rounded-lg border border-border/40 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
								>
									Dismiss
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
