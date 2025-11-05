# GitHub API Client & Cache

Minimal docs for the GitHub integration used by ingestion steps.

## Modules

- `api.ts`
  - `parseGitHubRepoUrl(url)` – extract `{ owner, name }`
  - `fetchCommitHistory(repoUrl, filePath, token?)` – list ALL commits that touched a path (paginated)
  - `fetchCommitDetail(repoUrl, sha, token?)` – commit detail with files/patches (cached)
  - `buildVersionDateMapping(repoUrl, filePath, token?)` – map `version -> Date` via patches
- `releases.ts`
  - `fetchGitHubReleases(repoUrl, token?, options?)` – fetch releases with Redis cache + ETag support (paginated)
- `cache.ts`
  - `getCommitCacheKey(owner, repo, sha)` – `github:commit:{owner}:{repo}:{sha}`
  - `getReleasesCacheKey(owner, repo)` – `github:release:{owner}:{repo}:list`
  - `getEtagCacheKey(owner, repo)` – `github:etag:{owner}:{repo}:releases`
  - `getCachedCommitDetail(owner, repo, sha, fetchFn)` – Redis write-through cache for commits
  - `getCachedReleases(owner, repo)` – Get cached releases list + ETag
  - `setCachedReleases(owner, repo, releases, etag)` – Cache releases with ETag
- `../redis.ts`
  - `getRedisClient()` – Upstash Redis singleton (graceful if missing)

## Cache Flows

### Commit Detail Cache

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

### Releases Cache with ETag

```
┌─────────────────────────────────────────────┐
│  fetchGitHubReleases(repoUrl, token)        │
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
   Return cached      Get cached ETag (if exists)
   (filtered)                │
                             ▼
                   GitHub API with If-None-Match
                             │
              ┌──────────────┴──────────────┐
              │                             │
         304 Not Modified           200 OK (new data)
              │                             │
              ▼                             ▼
         Return empty             Parse JSON releases
         (shouldn't happen)                │
                                           ▼
                                    Cache data + new ETag
                                           │
                                           ▼
                                    Return filtered releases
```

## Caching Details

### Commit Cache
- Backend: Upstash Redis via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Key: `github:commit:{owner}:{repo}:{sha}`
- TTL: 90 days (commits are immutable)
- Resilience: If Redis fails, fall back to GitHub API (non-blocking)

### Releases Cache
- Backend: Upstash Redis
- Keys:
  - Releases list: `github:release:{owner}:{repo}:list`
  - ETag: `github:etag:{owner}:{repo}:releases`
- TTL: 90 days (releases rarely change after publication)
- ETag support: Uses GitHub's `If-None-Match` header for conditional requests
- **Size optimization**: Strips unnecessary fields (author, assets, URLs) - keeps only 7 essential fields
  - GitHub API: ~50 fields per release
  - Cached: 7 fields (tag_name, name, body, prerelease, draft, published_at, html_url)
  - Reduction: ~70% smaller payload
  - Safety: Skips caching if payload >10MB (Upstash limit), but still caches ETag
- Benefits:
  - Avoids re-downloading unchanged releases (304 Not Modified)
  - Reduces API rate limit usage (60/hour without token, 5000/hour with token)
  - Faster ingestion runs (cache hit returns in <10ms vs 2-5 seconds for full pagination)

## Configuration

```bash
# GitHub rate limit (optional but recommended)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Upstash Redis (required for caching; otherwise gracefully disabled)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```
