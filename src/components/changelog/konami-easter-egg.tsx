import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'

const KONAMI_CODE = [
	'ArrowUp',
	'ArrowUp',
	'ArrowDown',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowLeft',
	'ArrowRight',
	'KeyB',
	'KeyA',
]

interface KonamiEasterEggProps {
	rawChangelog: string
}

export function KonamiEasterEgg({ rawChangelog }: KonamiEasterEggProps) {
	const [isActive, setIsActive] = useState(false)
	const [konamiIndex, setKonamiIndex] = useState(0)

	const handleKonamiComplete = useCallback(() => {
		setIsActive(true)
	}, [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === KONAMI_CODE[konamiIndex]) {
				if (konamiIndex === KONAMI_CODE.length - 1) {
					handleKonamiComplete()
					setKonamiIndex(0)
				} else {
					setKonamiIndex((i) => i + 1)
				}
			} else {
				setKonamiIndex(0)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [konamiIndex, handleKonamiComplete])

	return (
		<AnimatePresence>
			{isActive && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
					onClick={() => setIsActive(false)}
				>
					<motion.div
						initial={{ scale: 0.9, y: 20 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.9, y: 20 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl border border-primary/40 bg-black/95"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Terminal header */}
						<div className="flex items-center justify-between border-b border-primary/40 px-4 py-3 bg-primary/5">
							<div className="flex items-center gap-3">
								<div className="flex gap-1.5">
									<div className="size-2.5 rounded-full bg-red-500/60" />
									<div className="size-2.5 rounded-full bg-yellow-500/60" />
									<div className="size-2.5 rounded-full bg-green-500/60" />
								</div>
								<span className="font-mono text-[10px] text-primary uppercase tracking-widest">
									DEVELOPER_MODE :: CHANGELOG.md
								</span>
							</div>
							<button
								type="button"
								onClick={() => setIsActive(false)}
								className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								[ESC]
							</button>
						</div>

						{/* Raw content */}
						<div className="p-4 overflow-auto max-h-[calc(80vh-60px)]">
							<pre className="font-mono text-xs text-primary/80 whitespace-pre-wrap">
								{rawChangelog}
							</pre>
						</div>

						{/* Footer hint */}
						<div className="border-t border-primary/40 px-4 py-2 bg-primary/5">
							<span className="font-mono text-[10px] text-muted-foreground">
								↑↑↓↓←→←→BA activated • Click outside or press ESC to close
							</span>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
