import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LaneNavigationProps {
	side: 'left' | 'right'
	onClick: () => void
	disabled: boolean
	visible: boolean
}

export function LaneNavigation({
	side,
	onClick,
	disabled,
	visible,
}: LaneNavigationProps) {
	const Icon = side === 'left' ? ChevronLeft : ChevronRight
	const showButton = visible && !disabled

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
			className={cn(
				'absolute top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 border border-border/60 backdrop-blur-sm transition-all duration-300',
				side === 'left' ? 'left-2' : 'right-2',
				showButton ? 'opacity-100' : 'opacity-0 pointer-events-none',
				disabled
					? 'cursor-not-allowed text-muted-foreground/30'
					: 'cursor-pointer text-foreground hover:bg-card hover:border-foreground/40',
			)}
		>
			<Icon className="size-4" />
		</button>
	)
}
