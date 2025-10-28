import { Link } from '@tanstack/react-router'
import { Ampcode } from '../logo/amp'
import { ClaudeAI } from '../logo/claude'
import { Cursor } from '../logo/cursor'
import { Droid } from '../logo/droid'
import { OpenAI } from '../logo/openai'

const tools = [
	{ name: 'Ampcode', Logo: Ampcode, url: 'https://ampcode.com' },
	{
		name: 'Claude AI',
		Logo: ClaudeAI,
		url: 'https://www.claude.com/product/claude-code',
	},
	{ name: 'Cursor', Logo: Cursor, url: 'https://cursor.com' },
	{ name: 'Droid', Logo: Droid, url: 'https://factory.ai' },
	{ name: 'Codex', Logo: OpenAI, url: 'https://openai.com/codex' },
]

export function LogoShowcase() {
	// Triple the array for seamless infinite scroll
	const allTools = [...tools, ...tools, ...tools]

	return (
		<div className="relative w-full overflow-hidden border-y border-border bg-background py-6">
			<div className="flex animate-scroll">
				{allTools.map((tool, index) => (
					<Link
						to={tool.url}
						target="_blank"
						key={`${tool.name}-${index}`}
						className="group flex min-w-[240px] shrink-0 items-center gap-4 px-6 opacity-60 transition-opacity duration-300 hover:opacity-100"
					>
						<div className="flex size-10 shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-foreground [&>svg]:text-foreground [&>svg_path]:fill-foreground">
							<tool.Logo />
						</div>
						<span className="whitespace-nowrap font-mono text-sm text-muted-foreground">
							{tool.name}
						</span>
					</Link>
				))}
			</div>
			{/* Fade overlays */}
			<div className="pointer-events-none absolute inset-y-0 left-0 w-32 md:w-64 bg-linear-to-r from-background to-transparent" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-32 md:w-64 bg-linear-to-l from-background to-transparent" />
		</div>
	)
}
