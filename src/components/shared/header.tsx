import { Link, useMatches } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { SubscribeDialog } from '@/components/shared/subscribe-dialog'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { getToolLogo } from '@/lib/tool-logos'

// ... existing imports ...

export function Header() {
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	return (
		<header className="fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-2">
					<Link to="/" className="group flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/50 bg-muted/50 transition-colors group-hover:border-foreground/20 group-hover:bg-muted">
							<span className="font-mono text-sm font-bold text-foreground">
								&gt;_
							</span>
						</div>
						<span className="font-mono text-sm font-semibold tracking-tight text-foreground/90 transition-colors group-hover:text-foreground">
							changelogs.directory
						</span>
					</Link>

					<ToolHeaderInfo />
				</div>

				<nav className="hidden items-center gap-1 md:flex">
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/tools"
								className="group relative flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground data-[status=active]:bg-muted/50 data-[status=active]:text-foreground"
								activeProps={{
									'data-status': 'active',
								}}
							>
								<span className="font-mono">/tools</span>
							</Link>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="border-border bg-popover px-3 py-1.5 text-popover-foreground shadow-xl"
						>
							<p className="font-mono text-[10px] tracking-wide uppercase">
								Browse all tools
							</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/compare"
								className="group relative flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground data-[status=active]:bg-muted/50 data-[status=active]:text-foreground"
								activeProps={{
									'data-status': 'active',
								}}
							>
								<span className="font-mono">/compare</span>
							</Link>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="border-border bg-popover px-3 py-1.5 text-popover-foreground shadow-xl"
						>
							<p className="font-mono text-[10px] tracking-wide uppercase">
								Compare tools
							</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								to="/analytics"
								className="group relative flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground data-[status=active]:bg-muted/50 data-[status=active]:text-foreground"
								activeProps={{
									'data-status': 'active',
								}}
							>
								<span className="relative font-mono overflow-hidden">
									<span className="relative z-10">/analytics</span>
									<span className="absolute inset-0 translate-y-full bg-foreground/10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
									<span className="absolute bottom-0 left-0 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
								</span>
							</Link>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="border-border bg-popover px-3 py-1.5 text-popover-foreground shadow-xl"
						>
							<p className="font-mono text-[10px] tracking-wide uppercase">
								View Analytics
							</p>
						</TooltipContent>
					</Tooltip>

					<div className="mx-2 h-4 w-px bg-border/50" />

					<Button
						variant="ghost"
						size="sm"
						className="h-8 gap-2 rounded-md border border-border/50 bg-background px-3 font-mono text-xs text-foreground transition-all hover:border-foreground/20 hover:bg-muted/50"
						onClick={() => setIsDialogOpen(true)}
					>
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
						</span>
						SUBSCRIBE
					</Button>
				</nav>
			</div>
			<SubscribeDialog
				open={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
			/>
		</header>
	)
}

function ToolHeaderInfo() {
	const matches = useMatches()
	const toolMatch = matches.find((m) => m.routeId === '/tools/$slug')
	const toolData = toolMatch?.loaderData as
		| { tool?: { name: string } }
		| undefined
	const params = toolMatch?.params as { slug: string } | undefined

	const show = !!(toolMatch && toolData?.tool && params?.slug)
	const logo = show && params?.slug ? getToolLogo(params.slug) : null

	return (
		<AnimatePresence>
			{show && (
				<motion.div
					key="tool-breadcrumb"
					initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
					animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
					exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
					transition={{ type: 'spring', stiffness: 300, damping: 30 }}
					className="flex items-center gap-2"
				>
					<span className="text-muted-foreground/40 font-mono">/</span>
					<div className="flex items-center gap-2 group/tool">
						<div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-sm bg-foreground/5 ring-1 ring-foreground/10 transition-all duration-300 group-hover/tool:bg-foreground/10 group-hover/tool:ring-foreground/20">
							<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover/tool:opacity-100" />
							<div className="h-3.5 w-3.5 text-foreground transition-transform duration-500 group-hover/tool:scale-110 group-hover/tool:rotate-3 [&>svg]:size-full [&>svg]:fill-foreground">
								{logo}
							</div>
						</div>
						<span className="font-mono text-sm font-medium text-foreground/80 transition-colors group-hover/tool:text-foreground">
							{toolData?.tool?.name}
						</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
