import { Check, Copy, FileText, Share2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Bluesky } from '@/components/logo/bluesky'
import { HackerNews } from '@/components/logo/hackernews'
import { Reddit } from '@/components/logo/reddit'
import { XformerlyTwitter } from '@/components/logo/x'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface ShareMenuProps {
	toolName: string
	toolSlug: string
	version: string
	formattedVersion: string
	changes: Change[]
	className?: string
}

type CopyState = 'idle' | 'copied'

export function ShareMenu({
	toolName,
	toolSlug,
	version,
	formattedVersion,
	changes,
	className,
}: ShareMenuProps) {
	const [copyState, setCopyState] = useState<CopyState>('idle')
	const [open, setOpen] = useState(false)

	const shareUrl = generateShareUrl(toolSlug, version)

	const handleCopyLink = async () => {
		const success = await copyToClipboard(shareUrl)
		if (success) {
			setCopyState('copied')
			setTimeout(() => {
				setCopyState('idle')
				setOpen(false)
			}, 1500)
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
		setOpen(false)
	}

	const handleShareBluesky = () => {
		const text = generateTerminalTweet(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		openBlueskyShare(text)
		setOpen(false)
	}

	const handleShareReddit = () => {
		const title = generateRedditTitle(toolName, formattedVersion)
		openRedditShare(shareUrl, title)
		setOpen(false)
	}

	const handleShareHN = () => {
		const title = generateHNTitle(toolName, formattedVersion)
		openHackerNewsShare(shareUrl, title)
		setOpen(false)
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
			setCopyState('copied')
			setTimeout(() => {
				setCopyState('idle')
				setOpen(false)
			}, 1500)
		}
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<motion.button
					type="button"
					whileTap={{ scale: 0.98 }}
					className={cn(
						'group flex items-center gap-2 px-3 py-1.5 rounded-sm',
						'border border-white/10 bg-white/5',
						'hover:bg-white/10 hover:border-white/20',
						'transition-all duration-300',
						'focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
						className,
					)}
				>
					<Share2 className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
					<span className="text-[10px] tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
						[ SHARE ]
					</span>
				</motion.button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				sideOffset={8}
				className={cn(
					'min-w-[220px] font-mono',
					'bg-black/95 backdrop-blur-xl',
					'border-white/10',
					'shadow-2xl shadow-black/50',
				)}
			>
				{/* Copy Link */}
				<DropdownMenuItem
					onClick={handleCopyLink}
					className="gap-3 py-2.5 cursor-pointer"
				>
					{copyState === 'copied' ? (
						<Check className="size-3.5 text-green-500" />
					) : (
						<Copy className="size-3.5" />
					)}
					<span className="text-xs tracking-wider">
						{copyState === 'copied' ? 'COPIED!' : 'COPY_LINK'}
					</span>
				</DropdownMenuItem>

				{/* Share to X */}
				<DropdownMenuItem
					onClick={handleShareTwitter}
					className="gap-3 py-2.5 cursor-pointer"
				>
					<XformerlyTwitter className="size-3.5" />
					<span className="text-xs tracking-wider">SHARE_TO_X</span>
				</DropdownMenuItem>

				{/* Share to Bluesky */}
				<DropdownMenuItem
					onClick={handleShareBluesky}
					className="gap-3 py-2.5 cursor-pointer"
				>
					<Bluesky className="size-3.5" />
					<span className="text-xs tracking-wider">SHARE_TO_BLUESKY</span>
				</DropdownMenuItem>

				{/* Share to Reddit */}
				<DropdownMenuItem
					onClick={handleShareReddit}
					className="gap-3 py-2.5 cursor-pointer"
				>
					<Reddit className="size-3.5" />
					<span className="text-xs tracking-wider">SHARE_TO_REDDIT</span>
				</DropdownMenuItem>

				{/* Share to Hacker News */}
				<DropdownMenuItem
					onClick={handleShareHN}
					className="gap-3 py-2.5 cursor-pointer"
				>
					<HackerNews className="size-3.5" />
					<span className="text-xs tracking-wider">SHARE_TO_HN</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator className="bg-white/10" />

				{/* Copy as Markdown */}
				<DropdownMenuItem
					onClick={handleCopyMarkdown}
					className="gap-3 py-2.5 cursor-pointer"
				>
					<FileText className="size-3.5" />
					<div className="flex flex-col gap-0.5">
						<span className="text-xs tracking-wider">COPY_AS_MARKDOWN</span>
						<span className="text-[10px] text-muted-foreground">
							for docs & READMEs
						</span>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
