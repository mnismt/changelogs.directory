# GitHub API Client & Cache

Minimal docs for the GitHub integration used by ingestion steps.

## Modules

- `api.ts`
  - `parseGitHubRepoUrl(url)` – extract `{ owner, name }`
  - `fetchCommitHistory(repoUrl, filePath, token?)` – list ALL commits that touched a path (paginated)
  - `fetchCommitDetail(repoUrl, sha, token?)` – commit detail with files/patches (cached)
  - `buildVersionDateMapping(repoUrl, filePath, token?)` – map `version -> Date` via patches
- `cache.ts`
  - `getCacheKey(owner, repo, sha)` – `github:commit:{owner}:{repo}:{sha}`
  - `getCachedCommitDetail(owner, repo, sha, fetchFn)` – Redis write‑through cache
- `../redis.ts`
  - `getRedisClient()` – Upstash Redis singleton (graceful if missing)

## Commit Detail Cache Flow

```
┌─────────────────────────────────────────────┐
│  fetchCommitDetail(repoUrl, sha, token)     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Check Redis Cache   │
        └──────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    Cache HIT           Cache MISS
         │                   │
         ▼                   ▼
   Return cached      Fetch from GitHub API
   (sub-ms)                 (300ms)
                            │
                            ▼
                     Cache for 90 days
                            │
                            ▼
                      Return data
```

## Caching Details

- Backend: Upstash Redis via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Key: `github:commit:{owner}:{repo}:{sha}`
- TTL: 90 days (commits are immutable)
- Resilience: If Redis fails, fall back to GitHub API (non-blocking)

## Configuration

```bash
# GitHub rate limit (optional but recommended)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Upstash Redis (required for caching; otherwise gracefully disabled)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```
