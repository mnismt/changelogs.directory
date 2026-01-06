import { motion } from 'motion/react'

const SQUARES = [
	{ id: 'sq-1', scale: 40, delay: 0 },
	{ id: 'sq-2', scale: 55, delay: 0.3 },
	{ id: 'sq-3', scale: 70, delay: 0.6 },
	{ id: 'sq-4', scale: 85, delay: 0.9 },
	{ id: 'sq-5', scale: 100, delay: 1.2 },
	{ id: 'sq-6', scale: 115, delay: 1.5 },
]

export function RecursiveBackground() {
	return (
		<div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
			{/* Nested squares pulsing outward */}
			{SQUARES.map((sq, i) => (
				<motion.div
					key={sq.id}
					className="absolute inset-0 flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: i * 0.1 }}
				>
					<motion.div
						className="border border-white/[0.03] rounded-lg"
						style={{
							width: `${sq.scale}%`,
							height: `${sq.scale}%`,
						}}
						animate={{
							opacity: [0.3, 0.6, 0.3],
							scale: [1, 1.02, 1],
						}}
						transition={{
							duration: 4 + i * 0.5,
							delay: sq.delay,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
						}}
					/>
				</motion.div>
			))}

			{/* Center glow */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<motion.div
					className="size-64 bg-primary/5 rounded-full blur-3xl"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.5, 0.3],
					}}
					transition={{
						duration: 6,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
				/>
			</div>

			{/* Corner accents */}
			<div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-white/[0.02]" />
			<div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-white/[0.02]" />
			<div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-white/[0.02]" />
			<div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-white/[0.02]" />
		</div>
	)
}
