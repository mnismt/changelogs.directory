/**
 * Formats version strings for display based on tool-specific rules
 *
 * Examples:
 * - Codex: "codex-rs-abc123...999-1-rust-v0.0.25" → "v0.0.25"
 * - Claude: "2.0.31" → "v2.0.31" (no change)
 * - Cursor: "cursor-2-1" → "v2.1"
 */
export function formatVersionForDisplay(
	version: string,
	toolSlug: string,
): string {
	// Tool-specific formatting rules
	const formatters: Record<string, (v: string) => string> = {
		codex: formatCodexVersion,
		cursor: formatCursorVersion,
		'claude-code': formatClaudeCodeVersion,
		windsurf: formatWindsurfVersion,
	}

	const formatter = formatters[toolSlug]
	return formatter ? formatter(version) : version
}

/**
 * Codex versions: "codex-rs-<hash>-1-rust-v0.0.2505121726"
 * Extract just the semantic version: "v0.0.2505121726"
 */
function formatCodexVersion(version: string): string {
	// Match pattern: anything ending with "rust-v" followed by version number
	const match = version.match(/rust-v([\d.]+)$/)
	if (match) {
		return `v${match[1]}`
	}

	// Fallback: try to find last v-prefixed version
	const vMatch = version.match(/v([\d.]+)$/)
	if (vMatch) {
		return `v${vMatch[1]}`
	}

	// Last resort: return as-is
	return version
}

function formatClaudeCodeVersion(version: string): string {
	return `v${version}`
}

/**
 * Cursor versions: "cursor-2-1" → "v2.1"
 * Convert hyphens to dots after removing the "cursor-" prefix
 */
function formatCursorVersion(version: string): string {
	const versionPart = version.replace(/^cursor-/, '')
	return `v${versionPart.replace(/-/g, '.')}`
}

function formatWindsurfVersion(version: string): string {
	const versionPart = version.replace(/^windsurf-/, '')
	return `v${versionPart}`
}

/**
 * Optional: Get a short version (for tight spaces)
 * Example: "v0.0.2505121726" → "v0.0.250…"
 */
export function formatVersionShort(
	version: string,
	toolSlug: string,
	maxLength = 12,
): string {
	const formatted = formatVersionForDisplay(version, toolSlug)
	if (formatted.length <= maxLength) return formatted
	return `${formatted.substring(0, maxLength - 1)}…`
}
