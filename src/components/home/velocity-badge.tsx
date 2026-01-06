interface VelocityBadgeProps {
	releasesToday: number
	threshold?: number
}

export function VelocityBadge({
	releasesToday,
	threshold = 2,
}: VelocityBadgeProps) {
	if (releasesToday < threshold) {
		return null
	}

	return (
		<span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 font-mono text-xs text-orange-400">
			<span aria-hidden>🔥</span>
			<span>{releasesToday} today</span>
		</span>
	)
}
