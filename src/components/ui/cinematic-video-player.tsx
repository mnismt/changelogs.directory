import { motion, useInView } from 'motion/react'
import { Maximize, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CinematicVideoPlayerProps {
	src: string
	poster?: string
	className?: string
	maxWidth?: string | number
	loop?: boolean
}

export function CinematicVideoPlayer({
	src,
	poster,
	className,
	maxWidth,
	loop = true,
}: CinematicVideoPlayerProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState(false)

	// Viewport detection - 50% visibility threshold
	const isInView = useInView(containerRef, { amount: 0.5 })

	// Auto-play/pause based on viewport
	useEffect(() => {
		const video = videoRef.current
		if (!video) return

		if (isInView) {
			video
				.play()
				.then(() => setIsPlaying(true))
				.catch(() => {})
		} else {
			video.pause()
			setIsPlaying(false)
		}
	}, [isInView])

	// Manual play/pause toggle
	const togglePlay = () => {
		const video = videoRef.current
		if (!video) return

		if (isPlaying) {
			video.pause()
			setIsPlaying(false)
		} else {
			video
				.play()
				.then(() => setIsPlaying(true))
				.catch(() => {})
		}
	}

	// Toggle fullscreen
	const toggleFullscreen = () => {
		const container = containerRef.current
		const video = videoRef.current
		if (!container) return

		const doc = document as any
		const elem = container as any

		// Check if currently fullscreen
		const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement

		if (!isFullscreen) {
			// Try standard API first, then webkit prefix, then video-only fallback
			if (elem.requestFullscreen) {
				elem.requestFullscreen().catch(() => {})
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen()
			} else if ((video as any)?.webkitEnterFullscreen) {
				// iOS Safari: video-only fullscreen
				;(video as any).webkitEnterFullscreen()
			}
		} else {
			// Exit fullscreen
			if (doc.exitFullscreen) {
				doc.exitFullscreen().catch(() => {})
			} else if (doc.webkitExitFullscreen) {
				doc.webkitExitFullscreen()
			}
		}
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				'relative overflow-hidden rounded-md border border-border/40 bg-black/20',
				className,
			)}
			style={maxWidth ? { maxWidth } : undefined}
		>
		{/* Video element */}
		<video
			ref={videoRef}
			src={src}
			poster={poster}
			loop={loop}
			muted
			playsInline
			className="w-full h-auto"
		>
			<track kind="captions" />
		</video>

			{/* Vignette overlay */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)',
				}}
			/>

		{/* Control bar */}
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.3 }}
			className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10"
		>
			{/* Play/Pause button */}
			<motion.button
				type="button"
				onClick={togglePlay}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				transition={{ type: 'spring', stiffness: 400, damping: 25 }}
				className="p-1.5 text-white/80 hover:text-white transition-colors"
				aria-label={isPlaying ? 'Pause video' : 'Play video'}
			>
				{isPlaying ? (
					<Pause className="size-4" />
				) : (
					<Play className="size-4" />
				)}
			</motion.button>

			{/* Divider */}
			<div className="w-px h-4 bg-white/20" />

			{/* Fullscreen button */}
			<motion.button
				type="button"
				onClick={toggleFullscreen}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				transition={{ type: 'spring', stiffness: 400, damping: 25 }}
				className="p-1.5 text-white/80 hover:text-white transition-colors"
				aria-label="Toggle fullscreen"
			>
				<Maximize className="size-4" />
			</motion.button>
		</motion.div>
		</div>
	)
}
