import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

const BOOT_DURATION = 1200

interface TerminalBootProps {
	onComplete: () => void
}

export function TerminalBoot({ onComplete }: TerminalBootProps) {
	const [isComplete, setIsComplete] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsComplete(true)
			setTimeout(onComplete, 400)
		}, BOOT_DURATION)

		return () => clearTimeout(timer)
	}, [onComplete])

	return (
		<AnimatePresence>
			{!isComplete && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-background"
				>
					<div className="flex flex-col items-center gap-6">
						{/* Pulsing META badge */}
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.5, ease: 'easeOut' }}
							className="relative"
						>
							{/* Glow ring */}
							<motion.div
								className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
								animate={{
									scale: [1, 1.5, 1],
									opacity: [0.5, 0.2, 0.5],
								}}
								transition={{
									duration: 1.5,
									repeat: Number.POSITIVE_INFINITY,
									ease: 'easeInOut',
								}}
							/>

							{/* Badge */}
							<div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
								<motion.div
									className="size-2 rounded-full bg-primary"
									animate={{ opacity: [1, 0.4, 1] }}
									transition={{
										duration: 0.8,
										repeat: Number.POSITIVE_INFINITY,
									}}
								/>
								<span className="font-mono text-sm text-primary uppercase tracking-widest">
									Meta
								</span>
							</div>
						</motion.div>

						{/* Subtle loading text */}
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.4 }}
							transition={{ delay: 0.3 }}
							className="font-mono text-xs text-muted-foreground"
						>
							~/changelog
						</motion.p>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
