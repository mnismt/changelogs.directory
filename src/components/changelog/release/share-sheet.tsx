import { Check, Copy, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bluesky } from '@/components/logo/bluesky'
import { HackerNews } from '@/components/logo/hackernews'
import { RedditMono } from '@/components/logo/reddit-mono'
import { XformerlyTwitter } from '@/components/logo/x'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { Change } from '@/generated/prisma/client'
import {
	copyToClipboard,
	generateHNTitle,
	generateMarkdown,
	generateRedditTitle,
	generateShareUrl,
	generateTerminalTweet,
	openBlueskyShare,
	openHackerNewsShare,
	openRedditShare,
	openTwitterShare,
} from '@/lib/share'
import { cn } from '@/lib/utils'

/**
 * Mobile share bottom sheet with native-feel UX.
 *
 * Features:
 * - Copy Link with visual feedback
 * - Share to X (Twitter)
 * - Share to Bluesky
 * - Share to Reddit
 * - Share to Hacker News
 * - Copy as Markdown for docs
 * - Drag-to-dismiss gesture support
 *
 * @see docs/design/animations/release-detail.md
 */

interface ShareSheetProps {
	open: boolean
	onClose: () => void
	toolName: string
	toolSlug: string
	version: string
	formattedVersion: string
	changes: Change[]
}

type CopyState = 'idle' | 'link-copied' | 'markdown-copied'

export function ShareSheet({
	open,
	onClose,
	toolName,
	toolSlug,
	version,
	formattedVersion,
	changes,
}: ShareSheetProps) {
	const [copyState, setCopyState] = useState<CopyState>('idle')

	const shareUrl = generateShareUrl(toolSlug, version)

	// Reset copy state on close
	useEffect(() => {
		if (!open) {
			setCopyState('idle')
		}
	}, [open])

	const handleCopyLink = async () => {
		const success = await copyToClipboard(shareUrl)
		if (success) {
			setCopyState('link-copied')
			setTimeout(() => {
				setCopyState('idle')
				onClose()
			}, 1200)
		}
	}

	const handleShareTwitter = () => {
		const text = generateTerminalTweet(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		openTwitterShare(text)
		onClose()
	}

	const handleShareBluesky = () => {
		const text = generateTerminalTweet(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		openBlueskyShare(text)
		onClose()
	}

	const handleShareReddit = () => {
		const title = generateRedditTitle(toolName, formattedVersion)
		openRedditShare(shareUrl, title)
		onClose()
	}

	const handleShareHN = () => {
		const title = generateHNTitle(toolName, formattedVersion)
		openHackerNewsShare(shareUrl, title)
		onClose()
	}

	const handleCopyMarkdown = async () => {
		const markdown = generateMarkdown(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		const success = await copyToClipboard(markdown)
		if (success) {
			setCopyState('markdown-copied')
			setTimeout(() => {
				setCopyState('idle')
				onClose()
			}, 1200)
		}
	}

	return (
		<BottomSheet open={open} onClose={onClose} title="// SHARE">
			<div className="px-2 pb-6 pt-2">
				{/* Share options grid */}
				<div className="space-y-1">
					{/* Copy Link */}
					<button
						type="button"
						onClick={handleCopyLink}
						className={cn(
							'flex w-full items-center gap-4 rounded-xl p-4',
							'active:scale-[0.98] transition-all duration-150',
							copyState === 'link-copied'
								? 'bg-green-500/10'
								: 'bg-white/5 hover:bg-white/10',
						)}
					>
						<div
							className={cn(
								'flex size-10 items-center justify-center rounded-full',
								copyState === 'link-copied' ? 'bg-green-500/20' : 'bg-white/10',
							)}
						>
							{copyState === 'link-copied' ? (
								<Check className="size-5 text-green-500" />
							) : (
								<Copy className="size-5 text-foreground" />
							)}
						</div>
						<div className="flex-1 text-left">
							<p className="font-mono text-sm font-medium text-foreground">
								{copyState === 'link-copied' ? 'Copied!' : 'Copy Link'}
							</p>
							<p className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
								{shareUrl.replace('https://', '').replace('http://', '')}
							</p>
						</div>
					</button>

					{/* Share to X */}
					<button
						type="button"
						onClick={handleShareTwitter}
						className={cn(
							'flex w-full items-center gap-4 rounded-xl p-4',
							'bg-white/5 hover:bg-white/10',
							'active:scale-[0.98] transition-all duration-150',
						)}
					>
						<div className="flex size-10 items-center justify-center rounded-full bg-white/10">
							<XformerlyTwitter className="size-5" />
						</div>
						<div className="flex-1 text-left">
							<p className="font-mono text-sm font-medium text-foreground">
								Share to X
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								Post changelog link
							</p>
						</div>
					</button>

					{/* Share to Bluesky */}
					<button
						type="button"
						onClick={handleShareBluesky}
						className={cn(
							'flex w-full items-center gap-4 rounded-xl p-4',
							'bg-white/5 hover:bg-white/10',
							'active:scale-[0.98] transition-all duration-150',
						)}
					>
						<div className="flex size-10 items-center justify-center rounded-full bg-white/10">
							<Bluesky className="size-5" />
						</div>
						<div className="flex-1 text-left">
							<p className="font-mono text-sm font-medium text-foreground">
								Share to Bluesky
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								Post to network
							</p>
						</div>
					</button>

					{/* Share to Reddit */}
					<button
						type="button"
						onClick={handleShareReddit}
						className={cn(
							'flex w-full items-center gap-4 rounded-xl p-4',
							'bg-white/5 hover:bg-white/10',
							'active:scale-[0.98] transition-all duration-150',
						)}
					>
						<div className="flex size-10 items-center justify-center rounded-full bg-white/10">
							<RedditMono className="size-5" />
						</div>
						<div className="flex-1 text-left">
							<p className="font-mono text-sm font-medium text-foreground">
								Share to Reddit
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								Submit to subreddit
							</p>
						</div>
					</button>

					{/* Share to Hacker News */}
					<button
						type="button"
						onClick={handleShareHN}
						className={cn(
							'flex w-full items-center gap-4 rounded-xl p-4',
							'bg-white/5 hover:bg-white/10',
							'active:scale-[0.98] transition-all duration-150',
						)}
					>
						<div className="flex size-10 items-center justify-center rounded-full bg-white/10">
							<HackerNews className="size-5" />
						</div>
						<div className="flex-1 text-left">
							<p className="font-mono text-sm font-medium text-foreground">
								Share to HN
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								Submit story
							</p>
						</div>
					</button>

					{/* Divider */}
					<div className="my-2 h-px bg-white/10" />

					{/* Copy as Markdown */}
					<button
						type="button"
						onClick={handleCopyMarkdown}
						className={cn(
							'flex w-full items-center gap-4 rounded-xl p-4',
							'active:scale-[0.98] transition-all duration-150',
							copyState === 'markdown-copied'
								? 'bg-green-500/10'
								: 'bg-white/5 hover:bg-white/10',
						)}
					>
						<div
							className={cn(
								'flex size-10 items-center justify-center rounded-full',
								copyState === 'markdown-copied'
									? 'bg-green-500/20'
									: 'bg-white/10',
							)}
						>
							{copyState === 'markdown-copied' ? (
								<Check className="size-5 text-green-500" />
							) : (
								<FileText className="size-5 text-foreground" />
							)}
						</div>
						<div className="flex-1 text-left">
							<p className="font-mono text-sm font-medium text-foreground">
								{copyState === 'markdown-copied'
									? 'Copied!'
									: 'Copy as Markdown'}
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								For docs & READMEs
							</p>
						</div>
					</button>
				</div>
			</div>
		</BottomSheet>
	)
}
