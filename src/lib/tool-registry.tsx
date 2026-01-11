import type { ComponentType, ReactNode, SVGProps } from 'react'
import { GoogleAntigravity } from '@/components/logo/antigravity'
import { ClaudeAI } from '@/components/logo/claude'
import { Cursor } from '@/components/logo/cursor'
import { GeminiCli } from '@/components/logo/gemini-cli'
import { OpenAI } from '@/components/logo/openai'
import { OpenCode } from '@/components/logo/opencode'
import { Windsurf } from '@/components/logo/windsurf'

/**
 * Tool metadata for frontend display.
 * This is the SINGLE SOURCE OF TRUTH for tool UI configuration.
 *
 * When adding a new tool:
 * 1. Add entry here
 * 2. Create logo component in src/components/logo/
 * 3. Add OG SVG in getToolLogoSVG() in src/lib/og-utils.tsx
 * 4. Add to prisma/seed.ts for database
 * 5. Create ingestion pipeline in src/trigger/ingest/<tool>/
 */
export interface ToolConfig {
	/** URL-friendly identifier (matches database slug) */
	slug: string
	/** Display name */
	name: string
	/** Company/vendor name */
	vendor: string
	/** Official website URL */
	url: string
	/** React component for the logo */
	Logo: ComponentType<SVGProps<SVGSVGElement>>
	/** Whether logo uses currentColor (monochrome) vs fixed colors */
	isMonochrome: boolean
	/** Whether to show in homepage feed filter buttons */
	showInFeedFilter: boolean
	/** Whether to show in hero logo carousel */
	showInShowcase: boolean
}

/**
 * All registered tools for the frontend.
 * Order determines display order in UI components.
 */
export const TOOL_REGISTRY: ToolConfig[] = [
	{
		slug: 'claude-code',
		name: 'Claude Code',
		vendor: 'Anthropic',
		url: 'https://www.claude.com/product/claude-code',
		Logo: ClaudeAI,
		isMonochrome: false,
		showInFeedFilter: true,
		showInShowcase: true,
	},
	{
		slug: 'codex',
		name: 'Codex',
		vendor: 'OpenAI',
		url: 'https://openai.com/codex',
		Logo: OpenAI,
		isMonochrome: false,
		showInFeedFilter: true,
		showInShowcase: true,
	},
	{
		slug: 'cursor',
		name: 'Cursor',
		vendor: 'Anysphere',
		url: 'https://cursor.com',
		Logo: Cursor,
		isMonochrome: true,
		showInFeedFilter: true,
		showInShowcase: true,
	},
	{
		slug: 'windsurf',
		name: 'Windsurf',
		vendor: 'Cognition',
		url: 'https://windsurf.com',
		Logo: Windsurf,
		isMonochrome: false,
		showInFeedFilter: true,
		showInShowcase: true,
	},
	{
		slug: 'opencode',
		name: 'OpenCode',
		vendor: 'SST',
		url: 'https://opencode.ai',
		Logo: OpenCode,
		isMonochrome: true,
		showInFeedFilter: true,
		showInShowcase: true,
	},
	{
		slug: 'antigravity',
		name: 'Antigravity',
		vendor: 'Google',
		url: 'https://antigravity.google',
		Logo: GoogleAntigravity,
		isMonochrome: false,
		showInFeedFilter: true,
		showInShowcase: true,
	},
	{
		slug: 'gemini-cli',
		name: 'Gemini CLI',
		vendor: 'Google',
		url: 'https://geminicli.com',
		Logo: GeminiCli,
		isMonochrome: false,
		showInFeedFilter: true,
		showInShowcase: true,
	},
]

// Derived exports for convenience
export const TOOL_SLUGS = TOOL_REGISTRY.map((t) => t.slug)
export const FEED_FILTER_TOOLS = TOOL_REGISTRY.filter((t) => t.showInFeedFilter)
export const SHOWCASE_TOOLS = TOOL_REGISTRY.filter((t) => t.showInShowcase)
export const MONOCHROME_SLUGS = new Set(
	TOOL_REGISTRY.filter((t) => t.isMonochrome).map((t) => t.slug),
)

/** Get tool config by slug */
export function getToolConfig(slug: string): ToolConfig | undefined {
	return TOOL_REGISTRY.find((t) => t.slug === slug)
}

/** Get logo component for a tool */
export function getToolLogo(slug: string): ReactNode | null {
	const config = getToolConfig(slug)
	if (!config) return null
	const LogoComponent = config.Logo
	return <LogoComponent />
}

/** Check if a tool's logo is monochrome */
export function isMonochromeLogo(slug: string): boolean {
	return MONOCHROME_SLUGS.has(slug)
}

/** Get hover animation classes for a tool's logo */
export function getLogoHoverClasses(slug: string): string {
	const config = getToolConfig(slug)
	if (!config) return 'group-hover:rotate-45 group-hover:scale-110'

	// Simple icons (monochrome or specific tools) only scale, no rotation
	if (
		config.isMonochrome ||
		slug === 'windsurf' ||
		slug === 'antigravity' ||
		slug === 'gemini-cli'
	) {
		return 'group-hover:scale-110'
	}
	return 'group-hover:rotate-45 group-hover:scale-110'
}
