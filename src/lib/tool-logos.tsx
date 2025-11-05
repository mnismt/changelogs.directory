import type { ReactNode } from 'react'
import { ClaudeAI } from '@/components/logo/claude'
import { OpenAI } from '@/components/logo/openai'

function createClaudeLogo(): ReactNode {
	return <ClaudeAI />
}

function createOpenAILogo(): ReactNode {
	return <OpenAI />
}

const logoMap: Record<string, () => ReactNode> = {
	'claude-code': createClaudeLogo,
	codex: createOpenAILogo,
}

export function getToolLogo(slug: string): ReactNode | null {
	const logoFactory = logoMap[slug]
	return logoFactory ? logoFactory() : null
}
