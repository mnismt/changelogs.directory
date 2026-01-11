import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { getToolConfig } from '@/lib/tool-registry'

/**
 * Parse markdown links [text](url) and return React elements
 * - Internal links (/path) → TanStack <Link>
 * - External links (http/https) → <a target="_blank">
 * - Relative links (./path) → normalized to internal links
 * - Tool links (/tools/{slug}) → includes inline logo
 */
export function parseMarkdownLinks(text: string): ReactNode[] {
	const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
	const result: ReactNode[] = []
	let lastIndex = 0
	let key = 0

	let match = linkRegex.exec(text)
	while (match !== null) {
		// Add text before the link
		if (match.index > lastIndex) {
			result.push(text.slice(lastIndex, match.index))
		}

		const [, linkText, url] = match
		const isInternal = url.startsWith('/')
		const isExternal = url.startsWith('http://') || url.startsWith('https://')

		if (isInternal) {
			// Check if this is a tool link to inject logo
			const toolMatch = url.match(/^\/tools\/([^/]+)$/)
			const toolConfig = toolMatch ? getToolConfig(toolMatch[1]) : null
			const LogoComponent = toolConfig?.Logo

			result.push(
				<Link
					key={key++}
					to={url}
					className="text-primary hover:text-primary/80 transition-colors duration-300"
				>
					{LogoComponent && (
						<LogoComponent className="inline align-[-0.125em] mr-1 size-[1em]" />
					)}
					{linkText}
				</Link>,
			)
		} else if (isExternal) {
			result.push(
				<a
					key={key++}
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:underline"
				>
					{linkText}
				</a>,
			)
		} else {
			// Fallback: render as internal link (handle relative paths)
			result.push(
				<Link
					key={key++}
					to={url.startsWith('./') ? url.slice(1) : `/${url}`}
					className="text-primary hover:underline"
				>
					{linkText}
				</Link>,
			)
		}

		lastIndex = match.index + match[0].length
		match = linkRegex.exec(text)
	}

	// Add remaining text after last match
	if (lastIndex < text.length) {
		result.push(text.slice(lastIndex))
	}

	return result.length > 0 ? result : [text]
}
