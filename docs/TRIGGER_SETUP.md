# Trigger.dev Setup Guide

## Overview

The Claude Code changelog ingestion runs automatically every 6 hours via Trigger.dev scheduled tasks.

## Current Status

- ✅ Trigger.dev SDK configured (v4.0.5)
- ✅ Ingestion task implemented (`src/trigger/ingest-claude-code.ts`)
- ✅ Task tested locally and working
- ⏳ Schedule configuration pending

## Development Testing

To test the ingestion task locally:

```bash
# Option 1: Use the Trigger.dev dev server
pnpm exec trigger.dev@latest dev

# Then trigger manually from the Trigger.dev dashboard
```

## Production Deployment

### 1. Deploy Task to Trigger.dev

```bash
# Build and deploy the trigger tasks
pnpm exec trigger.dev@latest deploy
```

### 2. Configure Schedule

There are two ways to schedule the task:

#### Option A: Using Trigger.dev Dashboard (Recommended)

1. Go to https://cloud.trigger.dev
2. Navigate to your project (`proj_bcoqvcqkiytlhpiuehfb`)
3. Find the `ingest-claude-code` task
4. Click "Schedules" → "New Schedule"
5. Configure:
   - **Name**: `claude-code-ingestion`
   - **Cron**: `0 */6 * * *` (every 6 hours)
   - **Timezone**: UTC
   - **Payload**: `{}`
6. Save and enable

#### Option B: Using Code (Programmatic)

Update `src/trigger/ingest-claude-code.ts` to include a schedule:

```typescript
import { schedules } from "@trigger.dev/sdk/v3"

export const ingestClaudeCodeSchedule = schedules.task({
  id: "ingest-claude-code-schedule",
  // Run every 6 hours
  cron: "0 */6 * * *",
  task: ingestClaudeCode,
})
```

Then redeploy:
```bash
pnpm exec trigger.dev@latest deploy
```

## Task Configuration

### Concurrency
- Set to `1` to prevent duplicate ingestion runs
- Configured in `src/trigger/ingest-claude-code.ts`

### Max Duration
- Set to `300 seconds` (5 minutes)
- Typical run time: ~10-30 seconds (without LLM) or ~2-5 minutes (with LLM for 141 releases)

### Retries
- Enabled in development and production
- Max attempts: 3
- Exponential backoff: 1s → 10s

## LLM Integration (Intelligent Classification)

The ingestion pipeline uses Google Gemini 2.5 Flash via Vertex AI to intelligently classify changes and generate concise summaries.

### How It Works

1. **Change Classification**: Each changelog entry is analyzed by LLM to determine:
   - Type: FEATURE, BUGFIX, IMPROVEMENT, SECURITY, BREAKING, DEPRECATION, etc.
   - Impact level: MAJOR, MINOR, PATCH
   - Flags: isBreaking, isSecurity, isDeprecation
   - Confidence score (0-1)

2. **Release Summaries**: LLM generates 2-3 sentence summaries for each release:
   - Highlights key changes
   - Focuses on user-facing improvements
   - Professional, concise language

3. **Fallback Logic**: If LLM fails or confidence is low (<0.7), falls back to keyword-based classification:
   - Uses regex patterns to detect change types
   - Ensures ingestion always completes
   - Maintains data quality

### Environment Variables

**Required in Trigger.dev:**
- `GOOGLE_VERTEX_CREDENTIALS`: JSON string containing Google Cloud service account credentials

**Format:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Cost Estimation

- **Model**: Google Gemini 2.5 Flash
- **Cost**: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
- **Per Run**: ~141 releases × 3-5 changes each = ~500 LLM calls
- **Estimated Cost**: ~$0.05-0.10 per full ingestion run
- **Monthly Cost**: ~$0.60-1.20 (if running every 6 hours)

### Performance

- **With LLM**: ~2-5 minutes for 141 releases
- **Without LLM**: ~10-30 seconds (fallback only)
- **Individual Call Latency**: ~200-500ms per change classification

### Benefits

1. **Better Accuracy**: LLM understands context and nuance better than regex
2. **Reduced "OTHER" Classifications**: More precise categorization
3. **Concise Summaries**: Human-quality summaries instead of raw text truncation
4. **Graceful Degradation**: Falls back to keywords if LLM fails

## Monitoring

### Trigger.dev Dashboard

View task runs at: https://cloud.trigger.dev/projects/proj_bcoqvcqkiytlhpiuehfb/runs

Monitor:
- ✅ Successful runs
- ❌ Failed runs with error messages
- ⏱️ Run duration and performance
- 📊 Execution history

### Database Logs

Query FetchLog table to see ingestion history:

```sql
-- Latest ingestion runs
SELECT
  fl.status,
  fl.started_at,
  fl.duration,
  fl.releases_found,
  fl.releases_new,
  fl.releases_updated,
  fl.changes_created,
  fl.error
FROM fetch_log fl
JOIN tool t ON fl.tool_id = t.id
WHERE t.slug = 'claude-code'
ORDER BY fl.started_at DESC
LIMIT 10;
```

Or via Prisma Studio:
```bash
pnpm prisma studio
```

## Troubleshooting

### Task Not Running

1. Check Trigger.dev dashboard for error messages
2. Verify schedule is enabled
3. Check DATABASE_URL environment variable in Trigger.dev project settings

### Database Connection Issues

Ensure `DATABASE_URL` is set in Trigger.dev environment variables:
1. Go to Project Settings → Environment Variables
2. Add: `DATABASE_URL=postgresql://...` (from `.env`)

### LLM Issues

If LLM classification fails:
1. Check `GOOGLE_VERTEX_CREDENTIALS` is set in Trigger.dev environment
2. Verify credentials JSON is valid and properly escaped
3. Check Trigger.dev logs for LLM error messages
4. Fallback to keyword classification will activate automatically

## Testing LLM Integration

### Local Testing (Fallback Mode)

Test parser without LLM credentials (uses keyword-based fallback):
```bash
pnpm tsx test-parser-fallback.ts
```

This verifies:
- Parser works without LLM
- Fallback classification functions
- No crashes on missing credentials

### Testing with LLM Credentials

Set credentials locally and test full LLM integration:
```bash
export GOOGLE_VERTEX_CREDENTIALS='{"type":"service_account",...}'
pnpm tsx test-llm-parser.ts
```

This tests:
- LLM-based classification
- Summary generation
- Confidence scoring
- Real API calls (costs ~$0.001 per test)

### GitHub Rate Limiting

If you hit GitHub rate limits:
1. Add GitHub token to Trigger.dev environment: `GITHUB_TOKEN`
2. Update fetch headers in task:
```typescript
headers: {
  "Authorization": `token ${process.env.GITHUB_TOKEN}`,
  "User-Agent": "Changelogs.directory Bot"
}
```

## Manual Trigger

To manually trigger ingestion (useful for testing):

### Via Dashboard
1. Go to Trigger.dev dashboard
2. Find `ingest-claude-code` task
3. Click "Test" → "Run Test"

### Via API
```typescript
import { tasks } from "@trigger.dev/sdk/v3"

await tasks.trigger("ingest-claude-code", {
  toolSlug: "claude-code"
})
```

## Next Steps

After scheduling is set up:
1. ✅ Monitor first few scheduled runs
2. ✅ Verify data is being ingested correctly
3. ✅ Check FetchLog for any errors
4. 🚀 Move on to Phase 2: Building UI pages

## Resources

- [Trigger.dev Documentation](https://trigger.dev/docs)
- [Scheduled Tasks Guide](https://trigger.dev/docs/tasks/scheduled)
- [Monitoring Guide](https://trigger.dev/docs/runs/monitoring)
