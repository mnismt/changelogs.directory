import { cn } from '@/lib/utils'

interface ScanlineOverlayProps {
	className?: string
	opacity?: number
}

export function ScanlineOverlay({
	className,
	opacity = 0.05,
}: ScanlineOverlayProps) {
	return (
		<div
			className={cn(
				'pointer-events-none fixed inset-0 z-[100] h-screen w-screen overflow-hidden',
				className,
			)}
			style={{ opacity }}
		>
			<div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,#000_1px,#000_2px)] bg-[length:100%_2px]" />
			<div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-20" />
		</div>
	)
}
