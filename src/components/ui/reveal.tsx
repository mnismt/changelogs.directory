import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
	children: ReactNode
	className?: string
	delay?: number
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
			animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
			transition={{
				duration: 0.6,
				delay,
				ease: [0.22, 1, 0.36, 1], // Custom ease-out
			}}
			className={className}
		>
			{children}
		</motion.div>
	)
}
