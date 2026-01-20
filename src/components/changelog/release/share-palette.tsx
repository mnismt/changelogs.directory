import { ArrowUpRight, Check, Copy, FileText, Terminal } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bluesky } from '@/components/logo/bluesky'
import { HackerNews } from '@/components/logo/hackernews'
import { RedditMono } from '@/components/logo/reddit-mono'
import { XformerlyTwitter } from '@/components/logo/x'
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

interface SharePaletteProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	toolName: string
	toolSlug: string
	version: string
	formattedVersion: string
	changes: Change[]
}

type CopyState = 'idle' | 'link' | 'markdown'

interface CommandItem {
	id: string
	label: string
	shortcut: string
	icon: React.ReactNode
	action: () => void
	group: 'clipboard' | 'social'
	external?: boolean
}

/**
 * Premium command palette for sharing releases.
 *
 * Features:
 * - Terminal-inspired aesthetic with `>_` prompts
 * - Keyboard navigation (↑↓ Enter Esc, number shortcuts)
 * - Staggered cinematic entrance animations
 * - Monochrome icons with glow on hover
 * - Spring-based micro-interactions
 *
 * @see docs/design/animations/release-detail.md#k-share-system
 */
export function SharePalette({
	open,
	onOpenChange,
	toolName,
	toolSlug,
	version,
	formattedVersion,
	changes,
}: SharePaletteProps) {
	const [copyState, setCopyState] = useState<CopyState>('idle')
	const [selectedIndex, setSelectedIndex] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	const shareUrl = generateShareUrl(toolSlug, version)

	const handleClose = useCallback(() => {
		onOpenChange(false)
		setSelectedIndex(0)
		setCopyState('idle')
	}, [onOpenChange])

	const handleCopyLink = useCallback(async () => {
		const success = await copyToClipboard(shareUrl)
		if (success) {
			setCopyState('link')
			setTimeout(() => {
				setCopyState('idle')
				handleClose()
			}, 1200)
		}
	}, [shareUrl, handleClose])

	const handleCopyMarkdown = useCallback(async () => {
		const markdown = generateMarkdown(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		const success = await copyToClipboard(markdown)
		if (success) {
			setCopyState('markdown')
			setTimeout(() => {
				setCopyState('idle')
				handleClose()
			}, 1200)
		}
	}, [toolName, formattedVersion, changes, shareUrl, handleClose])

	const handleShareTwitter = useCallback(() => {
		const text = generateTerminalTweet(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		openTwitterShare(text)
		handleClose()
	}, [toolName, formattedVersion, changes, shareUrl, handleClose])

	const handleShareBluesky = useCallback(() => {
		const text = generateTerminalTweet(
			toolName,
			formattedVersion,
			changes,
			shareUrl,
		)
		openBlueskyShare(text)
		handleClose()
	}, [toolName, formattedVersion, changes, shareUrl, handleClose])

	const handleShareReddit = useCallback(() => {
		const title = generateRedditTitle(toolName, formattedVersion)
		openRedditShare(shareUrl, title)
		handleClose()
	}, [toolName, formattedVersion, shareUrl, handleClose])

	const handleShareHN = useCallback(() => {
		const title = generateHNTitle(toolName, formattedVersion)
		openHackerNewsShare(shareUrl, title)
		handleClose()
	}, [toolName, formattedVersion, shareUrl, handleClose])

	const commands: CommandItem[] = [
		{
			id: 'copy-link',
			label: 'copy_link',
			shortcut: '⌘C',
			icon:
				copyState === 'link' ? (
					<Check className="size-4 text-green-500" />
				) : (
					<Copy className="size-4" />
				),
			action: handleCopyLink,
			group: 'clipboard',
		},
		{
			id: 'copy-markdown',
			label: 'copy_as_markdown',
			shortcut: '⌘M',
			icon:
				copyState === 'markdown' ? (
					<Check className="size-4 text-green-500" />
				) : (
					<FileText className="size-4" />
				),
			action: handleCopyMarkdown,
			group: 'clipboard',
		},
		{
			id: 'share-x',
			label: 'share_to_x',
			shortcut: '1',
			icon: <XformerlyTwitter monochrome className="size-4" />,
			action: handleShareTwitter,
			group: 'social',
			external: true,
		},
		{
			id: 'share-bluesky',
			label: 'share_to_bluesky',
			shortcut: '2',
			icon: <Bluesky monochrome className="size-4" />,
			action: handleShareBluesky,
			group: 'social',
			external: true,
		},
		{
			id: 'share-reddit',
			label: 'share_to_reddit',
			shortcut: '3',
			icon: <RedditMono className="size-4" />,
			action: handleShareReddit,
			group: 'social',
			external: true,
		},
		{
			id: 'share-hn',
			label: 'share_to_hn',
			shortcut: '4',
			icon: <HackerNews monochrome className="size-4" />,
			action: handleShareHN,
			group: 'social',
			external: true,
		},
	]

	const clipboardCommands = commands.filter((c) => c.group === 'clipboard')
	const socialCommands = commands.filter((c) => c.group === 'social')

	// Keyboard navigation
	useEffect(() => {
		if (!open) return

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case 'Escape':
					e.preventDefault()
					handleClose()
					break
				case 'ArrowDown':
					e.preventDefault()
					setSelectedIndex((prev) => (prev + 1) % commands.length)
					break
				case 'ArrowUp':
					e.preventDefault()
					setSelectedIndex(
						(prev) => (prev - 1 + commands.length) % commands.length,
					)
					break
				case 'Enter':
					e.preventDefault()
					commands[selectedIndex]?.action()
					break
				case 'c':
					if (e.metaKey || e.ctrlKey) {
						e.preventDefault()
						handleCopyLink()
					}
					break
				case 'm':
					if (e.metaKey || e.ctrlKey) {
						e.preventDefault()
						handleCopyMarkdown()
					}
					break
				case '1':
					e.preventDefault()
					handleShareTwitter()
					break
				case '2':
					e.preventDefault()
					handleShareBluesky()
					break
				case '3':
					e.preventDefault()
					handleShareReddit()
					break
				case '4':
					e.preventDefault()
					handleShareHN()
					break
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		document.body.style.overflow = 'hidden'

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [
		open,
		selectedIndex,
		commands,
		handleClose,
		handleCopyLink,
		handleCopyMarkdown,
		handleShareTwitter,
		handleShareBluesky,
		handleShareReddit,
		handleShareHN,
	])

	// Focus container when open
	useEffect(() => {
		if (open && containerRef.current) {
			containerRef.current.focus()
		}
	}, [open])

	const containerVariants = {
		hidden: {
			opacity: 0,
			scale: 0.96,
			y: -8,
			filter: 'blur(8px)',
		},
		visible: {
			opacity: 1,
			scale: 1,
			y: 0,
			filter: 'blur(0px)',
			transition: {
				type: 'spring' as const,
				stiffness: 400,
				damping: 30,
				staggerChildren: 0.03,
				delayChildren: 0.05,
			},
		},
		exit: {
			opacity: 0,
			scale: 0.96,
			y: -4,
			filter: 'blur(4px)',
			transition: {
				duration: 0.15,
			},
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, x: -8 },
		visible: {
			opacity: 1,
			x: 0,
			transition: {
				type: 'spring' as const,
				stiffness: 500,
				damping: 30,
			},
		},
	}

	const renderCommand = (command: CommandItem, index: number) => {
		const isSelected = selectedIndex === index
		const isCopied =
			(command.id === 'copy-link' && copyState === 'link') ||
			(command.id === 'copy-markdown' && copyState === 'markdown')

		return (
			<motion.button
				key={command.id}
				type="button"
				variants={itemVariants}
				onClick={command.action}
				onMouseEnter={() => setSelectedIndex(index)}
				className={cn(
					'group relative flex w-full items-center gap-3 px-3 py-2.5 rounded-md',
					'font-mono text-sm tracking-wide',
					'transition-all duration-200',
					'focus:outline-none',
					isSelected
						? 'bg-white/10 text-foreground'
						: 'text-muted-foreground hover:text-foreground',
					isCopied && 'bg-green-500/10',
				)}
			>
				{/* Selection indicator */}
				<motion.div
					className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-green-500 rounded-full"
					initial={{ opacity: 0, scaleY: 0 }}
					animate={{
						opacity: isSelected ? 1 : 0,
						scaleY: isSelected ? 1 : 0,
					}}
					transition={{ duration: 0.15 }}
				/>

				{/* Terminal prompt */}
				<span
					className={cn(
						'text-xs transition-colors duration-200',
						isSelected ? 'text-green-500' : 'text-muted-foreground',
					)}
				>
					{'>_'}
				</span>

				{/* Icon with glow effect */}
				<span
					className={cn(
						'transition-all duration-200',
						isSelected && 'drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]',
						isCopied && 'text-green-500',
					)}
				>
					{command.icon}
				</span>

				{/* Label */}
				<span className="flex-1 text-left">{command.label}</span>

				{/* External indicator */}
				{command.external && (
					<ArrowUpRight
						className={cn(
							'size-3 transition-all duration-200',
							isSelected
								? 'opacity-100 translate-x-0'
								: 'opacity-0 -translate-x-1',
						)}
					/>
				)}

				{/* Shortcut */}
				<span
					className={cn(
						'text-xs px-1.5 py-0.5 rounded',
						'transition-all duration-200',
						isSelected
							? 'bg-white/10 text-foreground'
							: 'text-muted-foreground',
					)}
				>
					{command.shortcut}
				</span>
			</motion.button>
		)
	}

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
						onClick={handleClose}
						aria-hidden="true"
					/>

					{/* Palette */}
					<div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
						<motion.div
							ref={containerRef}
							role="dialog"
							aria-modal="true"
							aria-label="Share command palette"
							tabIndex={-1}
							variants={containerVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className={cn(
								'w-full max-w-sm mx-4',
								'rounded-lg overflow-hidden',
								'bg-black/95 backdrop-blur-2xl',
								'border border-white/10',
								'shadow-2xl shadow-black/50',
								'focus:outline-none',
							)}
						>
							{/* Header */}
							<motion.div
								variants={itemVariants}
								className="flex items-center justify-between px-4 py-3 border-b border-white/5"
							>
								<div className="flex items-center gap-2">
									<Terminal className="size-4 text-green-500" />
									<span className="font-mono text-sm text-muted-foreground">
										$ share{' '}
										<span className="text-foreground">{formattedVersion}</span>
									</span>
								</div>
								<span className="font-mono text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">
									esc
								</span>
							</motion.div>

							{/* Commands */}
							<div className="p-2">
								{/* Clipboard section */}
								<motion.div variants={itemVariants} className="mb-1">
									<span className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
										{'// clipboard'}
									</span>
								</motion.div>
								{clipboardCommands.map((cmd) =>
									renderCommand(cmd, commands.indexOf(cmd)),
								)}

								{/* Separator */}
								<motion.div
									variants={itemVariants}
									className="my-2 mx-3 h-px bg-white/5"
								/>

								{/* Social section */}
								<motion.div variants={itemVariants} className="mb-1">
									<span className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
										{'// social'}
									</span>
								</motion.div>
								{socialCommands.map((cmd) =>
									renderCommand(cmd, commands.indexOf(cmd)),
								)}
							</div>

							{/* Footer hint */}
							<motion.div
								variants={itemVariants}
								className="px-4 py-2 border-t border-white/5 bg-white/[0.02]"
							>
								<span className="font-mono text-[10px] text-muted-foreground/70">
									↑↓ navigate • enter select • 1-4 quick share
								</span>
							</motion.div>
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	)
}
