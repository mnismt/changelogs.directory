import { describe, it, expect } from 'vitest'
import { parsePlatformChangelog } from '@/lib/parsers/platform-changelog'

describe('parsePlatformChangelog', () => {
    it('parses markdown links correctly', () => {
        const content = `---
title: Changelog
description: Test
---

## 0.6.0

> **2026-01-11** — Test

- [Gemini CLI](./tools/gemini-cli) is now tracked
`
        const result = parsePlatformChangelog(content)
        expect(result.releases[0].changes[0]).toBe('[Gemini CLI](./tools/gemini-cli) is now tracked')
    })
})
