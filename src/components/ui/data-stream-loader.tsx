import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface DataStreamLoaderProps {
	className?: string
	text?: string
}

export function DataStreamLoader({
	className,
	text = 'PROCESSING_DATA_STREAM',
}: DataStreamLoaderProps) {
	const [hexStream, setHexStream] = useState<string[]>([])

	// Generate random hex codes
	useEffect(() => {
		const interval = setInterval(() => {
			setHexStream((prev) => {
				const newHex = Math.random()
					.toString(16)
					.substring(2, 10)
					.toUpperCase()
				const newStream = [newHex, ...prev].slice(0, 12)
				return newStream
			})
		}, 100)
		return () => clearInterval(interval)
	}, [])

	return (
		<div
			className={cn(
				'relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-background/20 backdrop-blur-sm',
				className,
			)}
		>
			{/* Grid Background */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

			{/* Scanning Line */}
			<motion.div
				className="absolute inset-x-0 h-px bg-primary/50 shadow-[0_0_20px_2px_rgba(var(--primary),0.3)]"
				animate={{
					top: ['0%', '100%', '0%'],
					opacity: [0, 1, 0],
				}}
				transition={{
					duration: 3,
					repeat: Infinity,
					ease: 'linear',
				}}
			/>

			{/* Center Content */}
			<div className="relative z-10 flex flex-col items-center gap-4">
				<div className="relative flex items-center justify-center size-20">
					{/* Rotating Rings */}
					<motion.div
						className="absolute size-16 rounded-full border-t-2 border-primary/40"
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
					/>
					<motion.div
						className="absolute size-12 rounded-full border-r-2 border-primary/60"
						animate={{ rotate: -360 }}
						transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
					/>
					
					{/* Inner Pulse */}
					<motion.div
						className="size-2 rounded-full bg-primary"
						animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
						transition={{ duration: 1.5, repeat: Infinity }}
					/>
				</div>

				<div className="flex flex-col items-center gap-1">
					<p className="font-mono text-xs font-bold tracking-widest text-primary/80">
						{text}
					</p>
					<div className="flex gap-1">
						<motion.div
							className="size-1 rounded-full bg-primary/60"
							animate={{ opacity: [0.3, 1, 0.3] }}
							transition={{ duration: 1, repeat: Infinity, delay: 0 }}
						/>
						<motion.div
							className="size-1 rounded-full bg-primary/60"
							animate={{ opacity: [0.3, 1, 0.3] }}
							transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
						/>
						<motion.div
							className="size-1 rounded-full bg-primary/60"
							animate={{ opacity: [0.3, 1, 0.3] }}
							transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
						/>
					</div>
				</div>
			</div>

			{/* Data Stream Overlay */}
			<div className="absolute right-4 top-4 flex flex-col items-end gap-1 font-mono text-[10px] text-primary/20">
				{hexStream.map((hex, i) => (
					<motion.span
						key={`${hex}-${i}`}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1 - i * 0.1, x: 0 }}
						className="uppercase"
					>
						0x{hex}
					</motion.span>
				))}
			</div>
			
			{/* Corner Accents */}
			<div className="absolute left-0 top-0 size-8 border-l border-t border-primary/20" />
			<div className="absolute right-0 top-0 size-8 border-r border-t border-primary/20" />
			<div className="absolute bottom-0 left-0 size-8 border-b border-l border-primary/20" />
			<div className="absolute bottom-0 right-0 size-8 border-b border-r border-primary/20" />
		</div>
	)
}
