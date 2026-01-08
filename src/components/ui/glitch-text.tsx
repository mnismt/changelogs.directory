import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface GlitchTextProps {
	children: string
	className?: string
	intensity?: 'low' | 'medium' | 'high'
	frequency?: number
}

export function GlitchText({
	children,
	className,
	intensity = 'low',
	frequency = 2000,
}: GlitchTextProps) {
	const [isGlitching, setIsGlitching] = useState(false)

	// Intensity configuration
	const config = {
		low: { x: 2, duration: 0.2 },
		medium: { x: 5, duration: 0.15 },
		high: { x: 10, duration: 0.1 },
	}

	const settings = config[intensity]

	useEffect(() => {
		const interval = setInterval(() => {
			if (Math.random() > 0.7) {
				// 30% chance to glitch per interval
				setIsGlitching(true)
				setTimeout(() => setIsGlitching(false), settings.duration * 1000)
			}
		}, frequency)

		return () => clearInterval(interval)
	}, [frequency, settings.duration])

	return (
		<div className={cn('relative inline-block', className)}>
			{/* Main Text */}
			<motion.span
				animate={
					isGlitching
						? {
								x: [0, -settings.x, settings.x, 0],
								filter: [
									'none',
									'hue-rotate(90deg)',
									'hue-rotate(-90deg)',
									'none',
								],
							}
						: {}
				}
				transition={{ duration: settings.duration }}
			>
				{children}
			</motion.span>

			{/* Red Shadow (Left) */}
			{isGlitching && (
				<motion.span
					className="absolute left-0 top-0 -z-10 text-red-500/80 opacity-70 mix-blend-screen"
					initial={{ x: 0 }}
					animate={{ x: -settings.x * 1.5 }}
				>
					{children}
				</motion.span>
			)}

			{/* Cyan Shadow (Right) */}
			{isGlitching && (
				<motion.span
					className="absolute left-0 top-0 -z-10 text-cyan-500/80 opacity-70 mix-blend-screen"
					initial={{ x: 0 }}
					animate={{ x: settings.x * 1.5 }}
				>
					{children}
				</motion.span>
			)}
		</div>
	)
}
