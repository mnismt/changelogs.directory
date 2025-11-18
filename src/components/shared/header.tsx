import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { CompareDialog } from '@/components/shared/compare-dialog'
import { SubscribeDialog } from '@/components/shared/subscribe-dialog'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

export function Header() {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false)

	return (
		<header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link to="/" className="flex items-center">
					<code className="text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80">
						changelogs.directory
					</code>
				</Link>

				<nav className="hidden items-center gap-6 text-sm md:flex">
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/tools"
								className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
							>
								Tools
							</Link>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs border-border bg-card p-2 text-foreground">
							<p className="font-mono text-xs">
								Browse changelogs for popular developer tools and stay updated
								with new releases
							</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
								onClick={() => setIsCompareDialogOpen(true)}
							>
								Compare
							</button>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs border-border bg-card p-2 text-foreground">
							<p className="font-mono text-xs">
								Compare features and updates across different tools side by side
							</p>
						</TooltipContent>
					</Tooltip>

					<Button
						variant="outline"
						size="sm"
						className="border-border bg-card font-mono text-xs uppercase tracking-wide text-foreground hover:bg-card/80"
						onClick={() => setIsDialogOpen(true)}
					>
						Subscribe
					</Button>
				</nav>
			</div>
			<SubscribeDialog
				open={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
			/>
			<CompareDialog
				open={isCompareDialogOpen}
				onClose={() => setIsCompareDialogOpen(false)}
			/>
		</header>
	)
}
