import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { SHOWCASE_TOOLS } from '@/lib/tool-registry'
import { cn } from '@/lib/utils'

const tools = SHOWCASE_TOOLS.map((tool) => ({
	slug: tool.slug,
	name: tool.name,
	Logo: tool.Logo,
	subtitle: `by ${tool.vendor}`,
	isMonochrome: tool.isMonochrome,
}))

// Pixels per second - controls scroll speed feel
const SCROLL_SPEED = 35

export function LogoShowcase() {
	const [isMounted, setIsMounted] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const [scrollDistance, setScrollDistance] = useState(0)
	const [duration, setDuration] = useState(15) // fallback duration

	useEffect(() => {
		// Delay to sync with parent component's fade-in (700ms delay from index.tsx)
		const timer = setTimeout(() => {
			setIsMounted(true)
		}, 800) // Small delay to ensure component is ready
		return () => clearTimeout(timer)
	}, [])

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const measure = () => {
			const children = Array.from(container.children)
			let width = 0

			// Measure first set of tools only (first N children = one complete set)
			for (let i = 0; i < tools.length && i < children.length; i++) {
				const child = children[i] as HTMLElement
				const style = getComputedStyle(child)
				width +=
					child.offsetWidth +
					Number.parseFloat(style.marginLeft) +
					Number.parseFloat(style.marginRight)
			}

			if (width > 0) {
				setScrollDistance(width)
				setDuration(width / SCROLL_SPEED)
			}
		}

		// Measure after a short delay to ensure layout is complete
		const measureTimer = setTimeout(measure, 100)

		const resizeObserver = new ResizeObserver(() => {
			// Debounce resize measurements
			clearTimeout(measureTimer)
			setTimeout(measure, 100)
		})
		resizeObserver.observe(container)

		return () => {
			clearTimeout(measureTimer)
			resizeObserver.disconnect()
		}
	}, [])

	// Only need 2 copies for seamless infinite loop
	const allTools = [...tools, ...tools]

	return (
		<div className="group/showcase relative w-full overflow-hidden border-y border-border bg-background py-6">
			{/* Single row - Scrolls left to right */}
			<div
				ref={containerRef}
				className="flex animate-scroll group-hover/showcase:[animation-play-state:paused]"
				style={
					{
						'--scroll-distance': `${scrollDistance}px`,
						animation:
							scrollDistance > 0
								? `scroll ${duration}s linear infinite`
								: 'none',
					} as React.CSSProperties
				}
			>
				{allTools.map((tool, index) => {
					// Calculate stagger delay based on position in the original tools array
					const toolIndex = index % tools.length
					const delayMs = toolIndex * 250 // 150ms between each item for better visibility

					return (
						<Link
							to="/tools/$slug"
							params={{ slug: tool.slug }}
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
								<span className="font-mono text-xs text-muted-foreground transition-colors duration-300 group-hover/item:text-muted-foreground">
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
