import { FileText } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface SummarySheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	headline: string | null
	summary: string | null
}

export function SummarySheet({
	open,
	onOpenChange,
	headline,
	summary,
}: SummarySheetProps) {
	return (
		<BottomSheet open={open} onClose={() => onOpenChange(false)}>
			<div className="flex h-full flex-col">
				{/* Header */}
				<div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
					<div className="flex size-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
						<FileText className="size-4 text-foreground" />
					</div>
					<div className="flex flex-col">
						<span className="font-mono text-sm font-bold text-foreground">
							README.md
						</span>
						<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
							RELEASE NOTES
						</span>
					</div>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto px-6 py-6">
					<div className="space-y-6 font-mono text-sm leading-relaxed pb-8">
						{/* Command Simulation in Sheet */}
						<div className="flex items-center gap-2 text-green-400/80 mb-6 font-mono text-xs">
							<span>$</span>
							<span className="text-foreground">cat README.md</span>
						</div>

						{headline && (
							<div className="relative pl-4">
								<div className="absolute left-0 top-1 bottom-1 w-0.5 bg-foreground/20" />
								<p className="text-foreground font-semibold">{headline}</p>
							</div>
						)}

						{summary && (
							<p className="text-muted-foreground whitespace-pre-wrap">
								{summary}
							</p>
						)}

						{/* Cursor at end */}
						<div className="animate-pulse text-green-500">_</div>
					</div>
				</div>
			</div>
		</BottomSheet>
	)
}
