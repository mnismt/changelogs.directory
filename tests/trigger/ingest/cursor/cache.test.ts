import { describe, expect, it } from 'vitest'
import { getCacheKey } from '@/trigger/ingest/cursor/cache'

describe('cursor cache', () => {
	describe('getCacheKey', () => {
		it('generates correct cache key format without namespace', () => {
			const key = getCacheKey('cursor')
			expect(key).toBe('cursor:latest-release:cursor')
		})

		it('uses consistent key format for any tool slug', () => {
			expect(getCacheKey('cursor')).toBe('cursor:latest-release:cursor')
			expect(getCacheKey('other-tool')).toBe('cursor:latest-release:other-tool')
		})

		it('key format is simple colon-separated without environment namespace', () => {
			const key = getCacheKey('cursor')
			const parts = key.split(':')

			expect(parts).toHaveLength(3)
			expect(parts[0]).toBe('cursor')
			expect(parts[1]).toBe('latest-release')
			expect(parts[2]).toBe('cursor')
		})
	})
})
