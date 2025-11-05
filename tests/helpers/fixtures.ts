import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
	ChangeType,
	FetchStatus,
	ImpactLevel,
	PrismaClient,
	SourceType,
} from '@prisma/client'
import type { ParsedRelease } from '@/lib/parsers/changelog-md'

/**
 * Load markdown changelog fixture
 */
export function loadChangelogFixture(filename = 'claude-code-changelog.md'): string {
	const fixturePath = join(process.cwd(), 'tests', 'fixtures', filename)
	return readFileSync(fixturePath, 'utf-8')
}

/**
 * Create a mock Tool record
 */
export function createMockTool(overrides?: Partial<Parameters<PrismaClient['tool']['create']>[0]['data']>) {
	return {
		id: 'cmhh44bag0000usd3j82z9szg',
		slug: 'claude-code',
		name: 'Claude Code',
		vendor: 'Anthropic',
		description: 'AI coding assistant',
		homepage: 'https://claude.ai',
		repositoryUrl: 'https://github.com/anthropics/claude-code',
		sourceType: 'CHANGELOG_MD' as SourceType,
		sourceUrl: 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md',
		sourceConfig: null,
		logoUrl: null,
		tags: ['ai', 'cli'],
		isActive: true,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		lastFetchedAt: null,
		...overrides,
	}
}

/**
 * Create a mock FetchLog record
 */
export function createMockFetchLog(overrides?: Partial<Parameters<PrismaClient['fetchLog']['create']>[0]['data']>) {
	return {
		id: 'cmhhg954q0001i0t531hs2kb9',
		toolId: 'cmhh44bag0000usd3j82z9szg',
		status: 'IN_PROGRESS' as FetchStatus,
		startedAt: new Date('2025-11-02T08:28:55.227Z'),
		completedAt: null,
		duration: null,
		releasesFound: 0,
		releasesNew: 0,
		releasesUpdated: 0,
		changesCreated: 0,
		error: null,
		errorStack: null,
		sourceUrl: 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md',
		sourceEtag: null,
		...overrides,
	}
}

/**
 * Create a mock Release record
 */
export function createMockRelease(overrides?: Partial<Parameters<PrismaClient['release']['create']>[0]['data']>) {
	return {
		id: 'cmhhg9w460003i0t5x8n6z7dc',
		toolId: 'cmhh44bag0000usd3j82z9szg',
		version: '2.0.31',
		versionSort: '002000031-z',
		releaseDate: null,
		publishedAt: new Date('2025-11-02T08:29:30.198Z'),
		sourceUrl: 'https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md#2031',
		rawContent: '## 2.0.31\n- Windows: native installation...',
		contentHash: '4b6f114c7c6cec0c7c1e77ba52b9986c018cfe11687e38636c577ebf6b603a70',
		title: null,
		summary: 'This release focuses on improving usability...',
		createdAt: new Date('2025-11-02T08:29:30.198Z'),
		updatedAt: new Date('2025-11-02T08:29:30.198Z'),
		...overrides,
	}
}

/**
 * Create a mock Change record
 */
export function createMockChange(overrides?: Partial<Parameters<PrismaClient['change']['create']>[0]['data']>) {
	return {
		id: 'cmhhg9w460004i0t550wdk6y9',
		releaseId: 'cmhhg9w460003i0t5x8n6z7dc',
		type: 'BUGFIX' as ChangeType,
		title: 'Fixed a bug with subagents and MCP servers',
		description: null,
		platform: null,
		component: null,
		isBreaking: false,
		isSecurity: false,
		isDeprecation: false,
		impact: 'PATCH' as ImpactLevel,
		links: null,
		order: 0,
		createdAt: new Date('2025-11-02T08:29:30.198Z'),
		...overrides,
	}
}

/**
 * Create a mock ParsedRelease
 */
export function createMockParsedRelease(overrides?: Partial<ParsedRelease>): ParsedRelease {
	return {
		version: '2.0.31',
		versionSort: '002000031-z',
		releaseDate: undefined,
		title: undefined,
		summary: 'This release focuses on improving usability...',
		rawContent: '## 2.0.31\n- Windows: native installation...',
		contentHash: '4b6f114c7c6cec0c7c1e77ba52b9986c018cfe11687e38636c577ebf6b603a70',
		changes: [
			{
				type: 'FEATURE' as ChangeType,
				title: 'Windows: native installation uses shift+tab',
				description: undefined,
				platform: 'windows',
				component: undefined,
				isBreaking: false,
				isSecurity: false,
				isDeprecation: false,
				impact: 'MINOR' as ImpactLevel,
				links: undefined,
				order: 0,
			},
		],
		...overrides,
	}
}

