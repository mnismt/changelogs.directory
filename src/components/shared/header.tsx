import { Link } from '@tanstack/react-router'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

export function Header() {
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
								to="/"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Tools
							</Link>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs border-border bg-card text-foreground p-2 ">
							<p className="font-mono text-xs">
								Browse changelogs for popular developer tools and stay updated
								with new releases
							</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Compare
							</Link>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs border-border bg-card text-foreground p-2">
							<p className="font-mono text-xs">
								Compare features and updates across different tools side by side
							</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Docs
							</Link>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs border-border bg-card text-foreground p-2">
							<p className="font-mono text-xs">
								Learn how to use changelogs.directory and integrate with your
								workflow
							</p>
						</TooltipContent>
					</Tooltip>
				</nav>
			</div>
		</header>
	)
}
