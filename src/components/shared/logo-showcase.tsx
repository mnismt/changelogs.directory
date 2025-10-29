import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Ampcode } from '@/components/logo/amp'
import { ClaudeAI } from '@/components/logo/claude'
import { Cursor } from '@/components/logo/cursor'
import { Droid } from '@/components/logo/droid'
import { OpenAI } from '@/components/logo/openai'

const tools = [
	{ name: 'Amp', Logo: Ampcode, url: 'https://ampcode.com' },
	{
		name: 'Claude Code',
		Logo: ClaudeAI,
		url: 'https://www.claude.com/product/claude-code',
	},
	{ name: 'Cursor', Logo: Cursor, url: 'https://cursor.com' },
	{ name: 'Droid', Logo: Droid, url: 'https://factory.ai' },
	{ name: 'Codex', Logo: OpenAI, url: 'https://openai.com/codex' },
]

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
							className={`group flex min-w-[260px] shrink-0 items-center gap-4 rounded-lg border border-transparent px-8 py-3 transition-all duration-500 hover:scale-105 hover:border-border hover:bg-card sm:min-w-[280px] ${
								isMounted
									? 'translate-y-0 opacity-60 hover:opacity-100'
									: 'translate-y-4 opacity-0'
							}`}
							style={{
								transitionDelay: isMounted ? `${delayMs}ms` : '0ms',
							}}
						>
							<div className="flex size-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110 sm:size-12 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-foreground [&>svg]:text-foreground [&>svg_path]:fill-foreground">
								<tool.Logo />
							</div>
							<span className="whitespace-nowrap font-mono text-lg font-bold text-muted-foreground transition-colors duration-300 group-hover:text-foreground sm:text-xl">
								{tool.name}
							</span>
						</Link>
					)
				})}
			</div>

			{/* Enhanced fade overlays with stronger gradient */}
			<div className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-linear-to-r from-background via-background/80 to-transparent md:w-80" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-linear-to-l from-background via-background/80 to-transparent md:w-80" />
		</div>
	)
}
