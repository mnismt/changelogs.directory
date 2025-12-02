import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SubscribeDialog } from '@/components/shared/subscribe-dialog'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

export const Route = createFileRoute('/compare')({
	component: ComparePage,
})

function ComparePage() {
	const [subscribeOpen, setSubscribeOpen] = useState(false)

	return (
		<div className="relative flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-20">
			{/* Background Elements */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
				<div className="absolute top-20 left-[10%] font-mono text-[20vw] font-bold text-foreground/[0.02]">
					{'//'}
				</div>
				<div className="absolute bottom-20 right-[10%] font-mono text-[25vw] font-bold text-foreground/[0.02]">
					VS
				</div>
			</div>

			<div className="relative z-10 mx-auto max-w-2xl text-center">
				<div className="mb-6 inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 backdrop-blur-sm">
					<span className="mr-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
					<span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
						Under Construction
					</span>
				</div>

				<h1 className="mb-6 font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
					Compare mode is <br className="hidden sm:block" />
					<span className="text-muted-foreground">still in the lab.</span>
				</h1>

				<p className="mx-auto mb-10 max-w-lg font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
					We're cooking a split-screen diff viewer that lets you pit editor
					releases against one another, feature by feature. Think side-by-side
					commits with pricing badges that match your caffeine habit.
				</p>

				<div className="mx-auto mb-12 flex max-w-md flex-wrap justify-center gap-3 font-mono text-xs uppercase text-muted-foreground/80">
					<span className="flex items-center gap-2 rounded border border-border/80 bg-secondary/30 px-4 py-2 text-foreground backdrop-blur-sm transition-colors hover:bg-secondary/50">
						<span aria-hidden="true" className="text-muted-foreground/70">
							{'<>'}
						</span>
						diff summaries
					</span>
					<span className="flex items-center gap-2 rounded border border-border/80 bg-accent/30 px-4 py-2 text-foreground backdrop-blur-sm transition-colors hover:bg-accent/50">
						<span aria-hidden="true" className="text-foreground">
							$
						</span>
						price compare
					</span>
					<span className="flex items-center gap-2 rounded border border-border/80 bg-primary/10 px-4 py-2 text-foreground backdrop-blur-sm transition-colors hover:bg-primary/20">
						<span aria-hidden="true" className="text-primary">
							v
						</span>
						version matrix
					</span>
				</div>

				<div className="mx-auto max-w-xs">
					<HoverBorderGradient
						containerClassName="w-full"
						className="flex w-full items-center justify-center font-mono text-sm uppercase tracking-wider"
						onClick={() => setSubscribeOpen(true)}
					>
						Join the Waitlist
					</HoverBorderGradient>
					<p className="mt-4 font-mono text-[10px] text-muted-foreground/60">
						Ping us if you want early access to the private build.
					</p>
				</div>
			</div>

			<SubscribeDialog
				open={subscribeOpen}
				onClose={() => setSubscribeOpen(false)}
			/>
		</div>
	)
}
