import type { ComponentType, SVGProps } from 'react'
import { ClaudeAI } from '@/components/logo/claude'
import { Cursor } from '@/components/logo/cursor'
import { OpenAI } from '@/components/logo/openai'
import { cn } from '@/lib/utils'

type LogoComponent = ComponentType<SVGProps<SVGSVGElement>>

const logoMap: Record<string, LogoComponent> = {
	cursor: Cursor,
	codex: OpenAI,
	'claude-code': ClaudeAI,
}

interface ToolLogoProps {
	slug: string
	className?: string
}

export function ToolLogo({ slug, className }: ToolLogoProps) {
	const Logo = logoMap[slug]

	if (!Logo) {
		return null
	}

	return (
		<Logo
			className={cn('h-5 w-5 shrink-0 fill-current text-foreground', className)}
		/>
	)
}
