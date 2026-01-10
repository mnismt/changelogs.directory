/**
 * Utility to access TOOL_REGISTRY in tests.
 * Avoids import path issues in Vitest.
 */
import {
	TOOL_REGISTRY,
	type ToolConfig,
	TOOL_SLUGS,
	SHOWCASE_TOOLS,
	FEED_FILTER_TOOLS,
	getToolConfig,
} from "@/lib/tool-registry"

export function getAllToolSlugs(): string[] {
	return TOOL_SLUGS
}

export function getAllTools(): ToolConfig[] {
	return TOOL_REGISTRY
}

export function getToolBySlug(slug: string): ToolConfig | undefined {
	return getToolConfig(slug)
}

export function getShowcaseTools(): ToolConfig[] {
	return SHOWCASE_TOOLS
}

export function getFeedFilterTools(): ToolConfig[] {
	return FEED_FILTER_TOOLS
}
