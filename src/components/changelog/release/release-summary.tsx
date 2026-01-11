import { FileText, Terminal } from 'lucide-react'
import { motion } from 'motion/react'
import { TerminalWindow } from '@/components/ui/terminal-window'
import { SummarySheet } from './summary-sheet'

interface ReleaseSummaryProps {
	headline: string | null
	summary: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ReleaseSummary({
	headline,
	summary,
	open,
	onOpenChange,
}: ReleaseSummaryProps) {
	if (!headline && !summary) return null

	return (
		<>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
					visible: {
						opacity: 1,
						y: 0,
						filter: 'blur(0px)',
						transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
					},
				}}
			>
				{/* Desktop: Terminal Window */}
				<div className="hidden md:block">
					<TerminalWindow title="README.md" className="mb-8">
						<div className="space-y-4 font-mono text-sm">
							{/* Command simulation */}
							<div className="flex items-center gap-2 text-green-400/80">
								<span>$</span>
								<span className="text-foreground">cat README.md</span>
							</div>

							{/* Content */}
							<div className="border-l-2 border-white/10 pl-4 space-y-4">
								{headline && (
									<p className="text-foreground font-semibold leading-relaxed">
										{headline}
									</p>
								)}
								{summary && (
									<p className="text-muted-foreground leading-relaxed">
										{summary}
									</p>
								)}
							</div>

							{/* Cursor */}
							<div className="animate-pulse text-green-500">_</div>
						</div>
					</TerminalWindow>
				</div>

				{/* Mobile: Compact File Card */}
				<motion.button
					type="button"
					onClick={() => onOpenChange(true)}
					whileTap={{ scale: 0.98 }}
					className="md:hidden w-full group relative mb-6 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10 active:bg-white/10"
				>
					<div className="flex items-center gap-3">
						{/* Icon Box */}
						<div className="flex size-8 shrink-0 items-center justify-center rounded bg-black/40 border border-white/10 text-muted-foreground group-hover:text-foreground group-hover:border-white/20 transition-colors">
							<Terminal className="size-4" />
						</div>

						{/* Text Info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between">
								<span className="font-mono text-xs font-bold text-foreground truncate">
									README.md
								</span>
								<span className="font-mono text-[10px] text-muted-foreground/70">
									1.2 KB
								</span>
							</div>
							<p className="font-mono text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
								{headline || summary}
							</p>
						</div>

						{/* Arrow */}
						<div className="text-muted-foreground/70 group-hover:text-foreground transition-colors">
							<FileText className="size-3.5" />
						</div>
					</div>
				</motion.button>
			</motion.div>

			<SummarySheet
				open={open}
				onOpenChange={onOpenChange}
				headline={headline}
				summary={summary}
			/>
		</>
	)
}
