# Configuration Validation Tests

> **Last verified**: 2026-03-20

This document describes the static configuration validation tests that ensure all tools are properly configured across the codebase.

## Overview

When adding a new tool to changelogs.directory, developers must synchronize configuration across **6 different locations**:

1. `TOOL_REGISTRY` in `src/lib/tool-registry.tsx`
2. `prisma/seed.ts` - Database tool records
3. `src/components/logo/*.tsx` - Logo React components
4. `getToolLogoSVG()` in `src/lib/og-utils.tsx` - OG image inline SVGs
5. `public/images/tools/*.png` - Tool background images
6. `src/trigger/ingest/*/` - Ingestion pipeline directories

The configuration validation tests automatically check that all these locations are in sync.

---

## Test Files

### `tests/e2e/config/tool-assets.test.ts`

Validates that every tool in `TOOL_REGISTRY` has all required assets.

#### Logo Components

```typescript
describe("Logo Components", () => {
  it.each(toolSlugs)("tool '%s' has a logo component file", (slug) => {
    const logoFile = LOGO_COMPONENT_MAP[slug];
    expect(logoFile).toBeDefined();
    // Checks file exists at src/components/logo/{logoFile}
  });
});
```

**What it checks**:
- Every tool slug has an entry in `LOGO_COMPONENT_MAP`
- The mapped logo file exists in `src/components/logo/`

**LOGO_COMPONENT_MAP**:

Not all tools have a 1:1 mapping between slug and logo filename:

| Slug | Logo File | Reason |
|------|-----------|--------|
| `claude-code` | `claude.tsx` | Brand name differs from product |
| `codex` | `openai.tsx` | Codex is an OpenAI product |
| `cursor` | `cursor.tsx` | Direct match |
| `windsurf` | `windsurf.tsx` | Direct match |
| `opencode` | `opencode.tsx` | Direct match |
| `antigravity` | `antigravity.tsx` | Direct match |
| `gemini-cli` | `gemini-cli.tsx` | Direct match |

**When adding a new tool**, update the map in the test file:

```typescript
const LOGO_COMPONENT_MAP: Record<string, string> = {
  // ... existing mappings
  "new-tool": "new-tool.tsx",
};
```

#### Background Images

```typescript
describe("Background Images", () => {
  it.each(toolSlugs)(
    "tool '%s' has a background image in public/images/tools/",
    (slug) => {
      const imagePath = path.join(publicDir, "images/tools", `${slug}.png`);
      expect(fs.existsSync(imagePath)).toBe(true);
    }
  );
});
```

**What it checks**:
- File exists at `public/images/tools/{slug}.png`

**Image requirements**:
- Format: PNG
- Recommended size: 1200x630 (matches OG image dimensions)
- Used for hover effect on tool cards in `/tools` directory

#### No Orphaned Images

```typescript
describe("No Orphaned Background Images", () => {
  it("all images in public/images/tools/ correspond to a registered tool", () => {
    const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith(".png"));
    for (const imageFile of imageFiles) {
      const slug = imageFile.replace(".png", "");
      expect(toolSlugs).toContain(slug);
    }
  });
});
```

**What it checks**:
- No PNG files in `public/images/tools/` without a matching tool in registry
- Prevents orphaned assets from accumulating

#### OG Image SVGs

```typescript
describe("OG Image SVGs", () => {
  it.each(toolSlugs)(
    "tool '%s' has a case in getToolLogoSVG() switch statement",
    (slug) => {
      const ogUtilsContent = fs.readFileSync(ogUtilsPath, "utf-8");
      const casePattern = new RegExp(`case\\s+["']${slug}["']\\s*:`);
      expect(casePattern.test(ogUtilsContent)).toBe(true);
    }
  );
});
```

**What it checks**:
- `src/lib/og-utils.tsx` has a `case '{slug}':` in the `getToolLogoSVG()` switch statement
- Missing case = 500 error when generating OG images

**To add a case**:

```typescript
// In src/lib/og-utils.tsx
export function getToolLogoSVG(slug: string): string {
  switch (slug) {
    case "new-tool":
      return `<svg>...</svg>`;  // Inline SVG string
    // ... other cases
  }
}
```

#### Ingestion Pipelines

```typescript
describe("Ingestion Pipelines", () => {
  it.each(toolSlugs)(
    "tool '%s' has an ingestion pipeline directory with index.ts",
    (slug) => {
      const pipelineDir = path.join(srcDir, "trigger/ingest", slug);
      const indexPath = path.join(pipelineDir, "index.ts");
      expect(fs.existsSync(pipelineDir)).toBe(true);
      expect(fs.existsSync(indexPath)).toBe(true);
    }
  );
});
```

**What it checks**:
- Directory exists at `src/trigger/ingest/{slug}/`
- `index.ts` file exists in that directory

---

### `tests/e2e/config/database-sync.test.ts`

Validates bidirectional sync between `TOOL_REGISTRY` and `prisma/seed.ts`.

#### Slug Extraction

The test extracts slugs from `seed.ts` using regex:

```typescript
const slugPattern = /where:\s*{\s*slug:\s*["']([a-z0-9-]+)["']\s*}/g;
```

This matches patterns like:
```typescript
await prisma.tool.upsert({
  where: { slug: "claude-code" },  // ← Extracted
  // ...
});
```

#### Bidirectional Sync

```typescript
it("should have every TOOL_REGISTRY slug in seed.ts", () => {
  const missingSlugs = TOOL_SLUGS.filter(slug => !seedSlugs.includes(slug));
  expect(missingSlugs).toEqual([]);
});

it("should have every seed.ts slug in TOOL_REGISTRY", () => {
  const extraSlugs = seedSlugs.filter(slug => !TOOL_SLUGS.includes(slug));
  expect(extraSlugs).toEqual([]);
});
```

**What it catches**:
- Tool added to registry but not to seed
- Tool in seed but removed from registry
- Typos in slugs (mismatches)

#### Tool Count Validation

```typescript
it("should have matching tool counts", () => {
  expect(upsertCount).toBe(TOOL_SLUGS.length);
  expect(seedSlugs.length).toBe(TOOL_SLUGS.length);
});
```

#### Slug Format Validation

```typescript
it("should have valid slug format for all slugs", () => {
  const validSlugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  for (const slug of TOOL_SLUGS) {
    expect(slug).toMatch(validSlugPattern);
  }
});
```

**Valid slug format**:
- Lowercase letters and numbers only
- Words separated by hyphens
- Examples: `claude-code`, `gemini-cli`, `cursor`

---

## Running the Tests

```bash
# Run all config validation tests
pnpm test:e2e:config

# Run specific test file
pnpm vitest run tests/e2e/config/tool-assets.test.ts

# Run in watch mode
pnpm vitest tests/e2e/config/
```

---

## Common Failure Scenarios

### Missing Logo Component

**Error**:
```
AssertionError: Logo component not found: src/components/logo/undefined
```

**Fix**:
1. Create the logo component file
2. Add mapping to `LOGO_COMPONENT_MAP` in test file

### Missing Background Image

**Error**:
```
AssertionError: Background image not found: public/images/tools/new-tool.png
```

**Fix**:
1. Create/obtain the background image
2. Save as `public/images/tools/{slug}.png`

### Missing OG Image Case

**Error**:
```
AssertionError: Missing case for 'new-tool' in getToolLogoSVG() switch statement
```

**Fix**:
1. Open `src/lib/og-utils.tsx`
2. Add `case "new-tool":` with inline SVG

### Missing Ingestion Pipeline

**Error**:
```
AssertionError: Ingestion pipeline directory not found: src/trigger/ingest/new-tool
```

**Fix**:
1. Create directory `src/trigger/ingest/{slug}/`
2. Create `index.ts` with ingestion task

### Registry/Seed Mismatch

**Error**:
```
AssertionError: Missing from seed.ts: new-tool
```

**Fix**:
1. Add `prisma.tool.upsert()` call in `prisma/seed.ts`
2. Ensure slug matches exactly

---

## Extending the Tests

### Adding a New Validation

To add a new asset check:

1. Add test case to `tool-assets.test.ts`:

```typescript
describe("New Asset Type", () => {
  it.each(toolSlugs)("tool '%s' has required asset", (slug) => {
    const assetPath = path.join(srcDir, "path/to", `${slug}.ext`);
    expect(
      fs.existsSync(assetPath),
      `Asset not found: ${assetPath}`
    ).toBe(true);
  });
});
```

2. Run tests to verify existing tools pass

### Updating Expected Tool Count

When adding/removing tools, update the count assertion in `database-sync.test.ts`:

```typescript
it("should have exactly N tools", () => {
  const expectedTools = ["tool-1", "tool-2", /* ... */];
  expect(TOOL_SLUGS.sort()).toEqual(expectedTools.sort());
});
```

---

## Related Documentation

- [E2E Architecture](e2e-architecture.md)
- [Adding a Tool Guide](../guides/adding-a-tool.md)
- [Tool Registry Reference](../reference/tool-registry.md)
