import { describe, expect, it } from 'vitest'
import {
	extractVersionsFromPatch,
	parseGitHubRepoUrl,
} from '@/lib/github/api'

describe('parseGitHubRepoUrl', () => {
	it('should parse standard GitHub repository URL', () => {
		const result = parseGitHubRepoUrl('https://github.com/anthropics/claude-code')
		expect(result).toEqual({
			owner: 'anthropics',
			name: 'claude-code',
		})
	})

	it('should parse raw.githubusercontent.com URL', () => {
		const result = parseGitHubRepoUrl(
			'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md',
		)
		expect(result).toEqual({
			owner: 'anthropics',
			name: 'claude-code',
		})
	})

	it('should handle .git suffix', () => {
		const result = parseGitHubRepoUrl(
			'https://github.com/anthropics/claude-code.git',
		)
		expect(result).toEqual({
			owner: 'anthropics',
			name: 'claude-code',
		})
	})

	it('should return null for invalid URLs', () => {
		expect(parseGitHubRepoUrl('https://example.com/repo')).toBeNull()
		expect(parseGitHubRepoUrl('not-a-url')).toBeNull()
		expect(parseGitHubRepoUrl('')).toBeNull()
	})
})

describe('extractVersionsFromPatch', () => {
	it('should extract single version from patch', () => {
		const patch = `
@@ -1,3 +1,7 @@
+## 2.0.33
+- Added new feature
+- Fixed bug
+
 ## 2.0.32
 - Previous version
`
		const versions = extractVersionsFromPatch(patch)
		expect(versions).toEqual(['2.0.33'])
	})

	it('should extract multiple versions from patch', () => {
		const patch = `
@@ -1,3 +1,15 @@
+## 2.0.34
+- Feature A
+
+## 2.0.33
+- Feature B
+
 ## 2.0.32
 - Previous version
`
		const versions = extractVersionsFromPatch(patch)
		expect(versions).toEqual(['2.0.34', '2.0.33'])
	})

	it('should handle pre-release versions', () => {
		const patch = `
+## 2.0.0-beta.1
+- Beta release
`
		const versions = extractVersionsFromPatch(patch)
		expect(versions).toEqual(['2.0.0-beta.1'])
	})

	it('should ignore versions without + prefix (not new additions)', () => {
		const patch = `
@@ -1,3 +1,7 @@
+## 2.0.33
+- New version
+
 ## 2.0.32
 - Existing version (no + prefix)
`
		const versions = extractVersionsFromPatch(patch)
		expect(versions).toEqual(['2.0.33'])
	})

	it('should return empty array when no versions found', () => {
		const patch = `
@@ -1,3 +1,5 @@
+- Added some feature
+- Fixed some bug
`
		const versions = extractVersionsFromPatch(patch)
		expect(versions).toEqual([])
	})

	it('should handle real-world changelog patch format', () => {
		const patch = `
@@ -1,6 +1,18 @@
 # Changelog
 
+## 2.0.33
+
+- **Keyboard Shortcuts**: Add Command Palette shortcut \`Cmd+Shift+P\`
+- **Editor**: Improved syntax highlighting for TypeScript
+- **Performance**: Reduced memory usage by 15%
+- **Fix**: Resolved issue with file watchers on Windows
+
+Thanks to all contributors!
+
+---
+
 ## 2.0.32
`
		const versions = extractVersionsFromPatch(patch)
		expect(versions).toEqual(['2.0.33'])
	})
})
