import { Minus, Square, Terminal, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SubscribeCta } from '@/components/home/subscribe-cta'
import { Button } from '@/components/ui/button'

interface SubscribeDialogProps {
	open: boolean
	onClose: () => void
}

export function SubscribeDialog({ open, onClose }: SubscribeDialogProps) {
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (open) {
			window.addEventListener('keydown', handleKeydown)
			// Lock body scroll
			document.body.style.overflow = 'hidden'
			return () => {
				window.removeEventListener('keydown', handleKeydown)
				document.body.style.overflow = 'unset'
			}
		}
	}, [open, onClose])

	if (!isMounted) return null

	return createPortal(
		<AnimatePresence>
			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
					role="dialog"
					aria-modal="true"
				>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="absolute inset-0 bg-background/60 backdrop-blur-md"
						onClick={onClose}
					/>

					{/* Dialog Container */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{
							type: 'spring',
							damping: 25,
							stiffness: 300,
							duration: 0.4,
						}}
						className="relative z-10 w-full max-w-2xl overflow-hidden rounded-lg border border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
					>
						{/* Terminal Header */}
						<div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3 select-none">
							<div className="flex items-center gap-2">
								<div className="flex gap-1.5">
									<div className="size-3 rounded-full bg-red-500/20 border border-red-500/50" />
									<div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
									<div className="size-3 rounded-full bg-green-500/20 border border-green-500/50" />
								</div>
								<div className="ml-4 flex items-center gap-2 rounded-md bg-background/50 px-2 py-1 text-xs font-mono text-muted-foreground border border-border/30">
									<Terminal className="size-3" />
									<span>subscribe.sh</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 rounded-sm hover:bg-background/50"
									onClick={onClose}
								>
									<Minus className="size-3" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 rounded-sm hover:bg-background/50"
									onClick={onClose}
								>
									<Square className="size-3" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 rounded-sm hover:bg-red-500/20 hover:text-red-500"
									onClick={onClose}
								>
									<X className="size-3" />
								</Button>
							</div>
						</div>

						{/* Content */}
						<div className="relative">
							{/* Scanline effect */}
							<div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] opacity-20" />

							<div className="p-1">
								<SubscribeCta showStats />
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body,
	)
}
