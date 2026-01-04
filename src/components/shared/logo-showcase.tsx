import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SHOWCASE_TOOLS } from '@/lib/tool-registry'
import { cn } from '@/lib/utils'

const tools = SHOWCASE_TOOLS.map((tool) => ({
	name: tool.name,
	Logo: tool.Logo,
	url: tool.url,
	subtitle: `by ${tool.vendor}`,
	isMonochrome: tool.isMonochrome,
}))

export function LogoShowcase() {
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		// Delay to sync with parent component's fade-in (700ms delay from index.tsx)
		const timer = setTimeout(() => {
			setIsMounted(true)
		}, 800) // Small delay to ensure component is ready
		return () => clearTimeout(timer)
	}, [])

	// Triple the array for seamless infinite scroll
	const allTools = [...tools, ...tools, ...tools]

	return (
		<div className="group/showcase relative w-full overflow-hidden border-y border-border bg-background py-6">
			{/* Single row - Scrolls left to right */}
			{/* Removed gap-4, using mx-4 on items instead for smooth math */}
			<div className="flex animate-scroll group-hover/showcase:animation-play-state-paused">
				{allTools.map((tool, index) => {
					// Calculate stagger delay based on position in the original tools array
					const toolIndex = index % tools.length
					const delayMs = toolIndex * 250 // 150ms between each item for better visibility

					return (
						<Link
							to={tool.url}
							target="_blank"
							key={`${tool.name}-${index}`}
							className={`group/item mx-4 flex min-w-[240px] shrink-0 items-center gap-4 rounded-lg border border-transparent px-6 py-3 transition-all duration-500 hover:scale-105 hover:border-border hover:bg-card sm:min-w-[260px] ${
								isMounted
									? 'translate-y-0 opacity-60 hover:opacity-100'
									: 'translate-y-4 opacity-0'
							}`}
							style={{
								transitionDelay: isMounted ? `${delayMs}ms` : '0ms',
							}}
						>
							<div
								className={cn(
									'flex size-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover/item:scale-110 sm:size-12 [&>svg]:h-full [&>svg]:w-full',
									tool.isMonochrome &&
										'[&>svg]:fill-foreground [&>svg]:text-foreground [&>svg_path]:fill-foreground',
								)}
							>
								<tool.Logo />
							</div>
							<div className="flex flex-col">
								<span className="font-mono text-base font-bold text-muted-foreground transition-colors duration-300 group-hover/item:text-foreground sm:text-lg">
									{tool.name}
								</span>
								<span className="font-mono text-xs text-muted-foreground/60 transition-colors duration-300 group-hover/item:text-muted-foreground">
									{tool.subtitle}
								</span>
							</div>
						</Link>
					)
				})}
			</div>

			{/* Enhanced fade overlays with stronger gradient */}
			<div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent md:w-64" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent md:w-64" />
		</div>
	)
}
