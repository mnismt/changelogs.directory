import type { ReactNode } from 'react'
import { ClaudeAI } from '@/components/logo/claude'
import { Cursor } from '@/components/logo/cursor'
import { OpenAI } from '@/components/logo/openai'
import { OpenCode } from '@/components/logo/opencode'
import { Windsurf } from '@/components/logo/windsurf'

function createClaudeLogo(): ReactNode {
	return <ClaudeAI />
}

function createOpenAILogo(): ReactNode {
	return <OpenAI />
}

function createCursorLogo(): ReactNode {
	return <Cursor />
}

function createWindsurfLogo(): ReactNode {
	return <Windsurf />
}

function createOpenCodeLogo(): ReactNode {
	return <OpenCode />
}

const logoMap: Record<string, () => ReactNode> = {
	'claude-code': createClaudeLogo,
	codex: createOpenAILogo,
	cursor: createCursorLogo,
	windsurf: createWindsurfLogo,
	opencode: createOpenCodeLogo,
}

export function getToolLogo(slug: string): ReactNode | null {
	const logoFactory = logoMap[slug]
	return logoFactory ? logoFactory() : null
}

// Logos that are already monochrome and need to keep fill styles on hover
const monochromeLogos = new Set(['cursor', 'opencode'])

/**
 * Check if a tool's logo is monochrome (needs to keep fill styles on hover)
 */
export function isMonochromeLogo(slug: string): boolean {
	return monochromeLogos.has(slug)
}

/**
 * Get hover animation classes for a tool's logo
 * Cursor only scales (no rotation) since it's a simple icon
 */
export function getLogoHoverClasses(slug: string): string {
	if (slug === 'cursor' || slug === 'windsurf' || slug === 'opencode') {
		return 'group-hover:scale-110'
	}
	return 'group-hover:rotate-45 group-hover:scale-110'
}
