import { Check, Copy, FileText, Share2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { XformerlyTwitter } from '@/components/logo/x'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Change } from '@/generated/prisma/client'
import { UserRole } from '@/lib/auth/types'
import {
	copyToClipboard,
	generateMarkdown,
	generateShareUrl,
	generateSimpleTweet,
	generateTerminalTweet,
	openTwitterShare,
} from '@/lib/share'
import { cn } from '@/lib/utils'
import { getSessionFn } from '@/server/auth'

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
	const [isAdmin, setIsAdmin] = useState(false)

	// Check if user is admin on mount
	useEffect(() => {
		getSessionFn().then((session) => {
			setIsAdmin(session?.user?.role === UserRole.ADMIN)
		})
	}, [])

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

	const handleShareTwitterSimple = () => {
		const text = generateSimpleTweet(toolName, formattedVersion, shareUrl)
		openTwitterShare(text)
		setOpen(false)
	}

	const handleShareTwitterVerbose = () => {
		const text = generateTerminalTweet(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		openTwitterShare(text)
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

				{/* Share to X (simple) */}
				<DropdownMenuItem
					onClick={handleShareTwitterSimple}
					className="gap-3 py-2.5 cursor-pointer"
				>
					<XformerlyTwitter className="size-3.5" />
					<span className="text-xs tracking-wider">SHARE_TO_X</span>
				</DropdownMenuItem>

				{/* Share to X (verbose) - Admin only */}
				{isAdmin && (
					<DropdownMenuItem
						onClick={handleShareTwitterVerbose}
						className="gap-3 py-2.5 cursor-pointer"
					>
						<XformerlyTwitter className="size-3.5" />
						<div className="flex flex-col gap-0.5">
							<span className="text-xs tracking-wider">
								SHARE_TO_X --verbose
							</span>
							<span className="text-[10px] text-muted-foreground">
								includes change summary
							</span>
						</div>
					</DropdownMenuItem>
				)}

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
