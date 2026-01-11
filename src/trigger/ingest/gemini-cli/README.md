# Gemini CLI Ingestion Pipeline

Fetches changelog data from GitHub Releases API for Google's Gemini CLI.

## Source

- **Type**: GITHUB_RELEASES
- **URL**: https://api.github.com/repos/google-gemini/gemini-cli/releases
- **Version Prefix**: `v` (stripped from version tags)
- **Pre-releases**: Included (stable, preview, and nightly)

## Release Types

Gemini CLI has three release types, all preserved:

1. **Stable** (v0.23.0) - `prerelease: false`
2. **Preview** (v0.24.0-preview.0) - `prerelease: true`
3. **Nightly** (v0.24.0-nightly.20260103...) - `prerelease: true`

The GitHub API's `prerelease` field automatically distinguishes between stable and pre-releases.

## Schedule

Runs every 6 hours: `0 */6 * * *`

## Manual Trigger

```bash
pnpm exec trigger.dev@latest dev
# Then trigger via dashboard or API
```

## Force Full Rescan

Trigger with a payload to bypass cache and reprocess unchanged releases:

```json
{
  "forceFullRescan": true
}
```

## Expected Volume

- **Total releases**: ~200+
- **API calls per run**: ~3-4 (paginated at 100/page)
- **Nightly releases**: Filtered by content hash (only changed content ingested)
