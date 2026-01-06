import fs from 'node:fs'
import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import {
	type PlatformChangelog,
	parsePlatformChangelog,
} from '@/lib/parsers/platform-changelog'

// Cache parsed changelog (invalidated on server restart)
// Disabled in development for hot-reload of CHANGELOG.md
let cachedChangelog: PlatformChangelog | null = null
let cachedRawContent: string | null = null

const isDev = process.env.NODE_ENV === 'development'

export const getPlatformChangelog = createServerFn({ method: 'GET' }).handler(
	async (): Promise<PlatformChangelog> => {
		// Skip cache in development for easier testing
		if (!isDev && cachedChangelog) return cachedChangelog

		const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
		const content = fs.readFileSync(changelogPath, 'utf-8')

		cachedChangelog = parsePlatformChangelog(content)
		cachedRawContent = content
		return cachedChangelog
	},
)

export const getRawChangelog = createServerFn({ method: 'GET' }).handler(
	async (): Promise<string> => {
		// Skip cache in development for easier testing
		if (!isDev && cachedRawContent) return cachedRawContent

		const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
		cachedRawContent = fs.readFileSync(changelogPath, 'utf-8')
		return cachedRawContent
	},
)
