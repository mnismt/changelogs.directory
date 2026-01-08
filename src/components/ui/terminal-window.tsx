import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TerminalWindowProps {
	title?: string
	children: ReactNode
	className?: string
	headerClassName?: string
}

export function TerminalWindow({
	title = 'bash — 80x24',
	children,
	className,
	headerClassName,
}: TerminalWindowProps) {
	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl',
				className,
			)}
		>
			{/* Terminal Header */}
			<div
				className={cn(
					'flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3',
					headerClassName,
				)}
			>
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-red-500/80" />
					<div className="h-3 w-3 rounded-full bg-yellow-500/80" />
					<div className="h-3 w-3 rounded-full bg-green-500/80" />
				</div>
				<div className="absolute left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground/60">
					{title}
				</div>
			</div>

			{/* Terminal Content */}
			<div className="p-4 font-mono text-sm sm:p-6">{children}</div>
		</div>
	)
}
