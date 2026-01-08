import { Link, useLocation } from '@tanstack/react-router'
import { BarChart2, GitCompare, Home, Mail, Terminal } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SubscribeDialog } from '@/components/shared/subscribe-dialog'
import { cn } from '@/lib/utils'

export function MobileDock() {
	const location = useLocation()
	const [isSubscribeOpen, setIsSubscribeOpen] = useState(false)
	const [isHidden, setIsHidden] = useState(false)

	// Listen for bottom sheet open state
	useEffect(() => {
		const checkBottomSheet = () => {
			setIsHidden(document.body.dataset.bottomSheetOpen === 'true')
		}

		// Check initially
		checkBottomSheet()

		// Use MutationObserver to watch for data attribute changes
		const observer = new MutationObserver(checkBottomSheet)
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['data-bottom-sheet-open'],
		})

		return () => observer.disconnect()
	}, [])

	const items = [
		{
			label: 'Home',
			href: '/',
			icon: Home,
			match: (path: string) => path === '/',
		},
		{
			label: 'Tools',
			href: '/tools',
			icon: Terminal,
			match: (path: string) => path.startsWith('/tools'),
		},
		{
			label: 'Compare',
			href: '/compare',
			icon: GitCompare,
			match: (path: string) => path.startsWith('/compare'),
		},
		{
			label: 'Analytics',
			href: '/analytics',
			icon: BarChart2,
			match: (path: string) => path.startsWith('/analytics'),
		},
	]

	return (
		<>
			<AnimatePresence>
				{!isHidden && (
					<motion.div
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 100, opacity: 0 }}
						transition={{
							type: 'spring',
							stiffness: 260,
							damping: 20,
						}}
						className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:hidden"
					>
						<div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
							{items.map((item) => {
								const isActive = item.match(location.pathname)
								const Icon = item.icon

								return (
									<Link key={item.label} to={item.href} className="relative">
										<motion.div
											className={cn(
												'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors',
												isActive
													? 'text-foreground'
													: 'text-muted-foreground hover:text-foreground',
											)}
											whileTap={{ scale: 0.9 }}
											whileHover={{ scale: 1.1 }}
										>
											{isActive && (
												<motion.div
													layoutId="dock-active"
													className="absolute inset-0 rounded-full bg-white/10"
													transition={{
														type: 'spring',
														stiffness: 300,
														damping: 30,
													}}
												/>
											)}
											<Icon className="h-5 w-5" />
											{isActive && (
												<span className="absolute -bottom-1 h-1 w-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
											)}
										</motion.div>
									</Link>
								)
							})}

							<div className="mx-1 h-6 w-px bg-white/10" />

							<motion.button
								onClick={() => setIsSubscribeOpen(true)}
								className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
								whileTap={{ scale: 0.9 }}
								whileHover={{ scale: 1.1 }}
							>
								<Mail className="h-5 w-5" />
								<span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 ring-2 ring-black" />
							</motion.button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<SubscribeDialog
				open={isSubscribeOpen}
				onClose={() => setIsSubscribeOpen(false)}
			/>
		</>
	)
}
