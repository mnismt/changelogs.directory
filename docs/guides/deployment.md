# Deployment Guide

> **Last verified**: 2025-12-05

This guide covers deploying Changelogs.directory to production, including database setup, web app deployment, and Trigger.dev workers.

## Architecture Overview

The application consists of three components:

1. **Web App** (TanStack Start) → Deployed to **Vercel**
2. **Database** (PostgreSQL) → Hosted on **Neon** or **Supabase**
3. **Background Jobs** (Trigger.dev) → Deployed to **Trigger.dev Cloud**

All components must be configured and deployed for full functionality.

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables documented and ready
- [ ] Database connection string (production)
- [ ] Better Auth secret generated (unique for production)
- [ ] Google Vertex AI credentials (service account JSON)
- [ ] GitHub token (for higher rate limits)
- [ ] Redis credentials (Upstash)
- [ ] Email provider credentials (Resend or ZeptoMail)
- [ ] Analytics keys (PostHog, Sentry) - optional
- [ ] Domain name configured (e.g., `changelogs.directory`)

---

## Step 1: Database Setup

### Option A: Neon PostgreSQL (Recommended)

**Why Neon**: Serverless PostgreSQL, generous free tier, automatic scaling.

1. **Create Account**: https://neon.tech
2. **Create Project**: "changelogs-production"
3. **Copy Connection String**:
   ```
   postgresql://user:pass@ep-cool-sound-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save as** `DATABASE_URL` environment variable

### Option B: Supabase PostgreSQL

1. **Create Account**: https://supabase.com
2. **Create Project**: "changelogs"
3. **Get Connection String**: Settings → Database → Connection string (URI)
4. **Save as** `DATABASE_URL`

### Run Migrations

```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run Prisma migrations
pnpm prisma migrate deploy

# Seed initial data
pnpm prisma db seed
```

**Verify**:
```bash
# Check tables created
pnpm prisma studio
# Should see: Tool, Release, Change, FetchLog, User tables
```

---

## Step 2: Deploy Web App (Vercel)

### 2.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Framework Preset: **TanStack Start** (or "Other" if not detected)
5. Build Command: `pnpm build`
6. Output Directory: `.output/public`

### 2.2 Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```bash
# === Core ===
DATABASE_URL=postgresql://user:pass@neon.tech/db?sslmode=require

# === Authentication ===
BETTER_AUTH_SECRET=your_production_secret_here
BETTER_AUTH_URL=https://changelogs.directory

# === Redis Caching ===
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# === Analytics (Optional) ===
VITE_PUBLIC_POSTHOG_KEY=phc_prodkey
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
VITE_SENTRY_DSN=https://key@sentry.io/project
SENTRY_DSN=https://key@sentry.io/project
VITE_SENTRY_ENVIRONMENT=production

# === Email (Optional) ===
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_prodkey
```

**Notes**:
- Use **Production** environment for all variables
- Never use development secrets in production
- Verify `BETTER_AUTH_URL` matches your domain

### 2.3 Deploy

```bash
# Option 1: Push to main branch (auto-deploys)
git push origin main

# Option 2: Deploy via CLI
pnpm vercel --prod
```

**Expected Output**:
```
✔ Deployment ready
  https://changelogs.directory
```

### 2.4 Configure Custom Domain

1. Go to Vercel Project → Settings → Domains
2. Add `changelogs.directory`
3. Update DNS records at your registrar:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel IP)
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

4. Wait for SSL certificate (5-10 minutes)

### 2.5 Verify Deployment

1. Visit https://changelogs.directory
2. Check homepage loads without errors
3. Navigate to `/tools/claude-code`
4. Verify database connection works (releases appear)
5. Test authentication (sign up, sign in)

---

## Step 3: Deploy Trigger.dev Workers

### 3.1 Create Trigger.dev Project

1. Go to [Trigger.dev](https://cloud.trigger.dev)
2. Create new project: "changelogs-production"
3. Copy **Project ID** (e.g., `proj_abc123xyz`)

### 3.2 Configure Environment Variables

In Trigger.dev Project → Settings → Environment Variables:

```bash
# === Database (REQUIRED) ===
DATABASE_URL=postgresql://user:pass@neon.tech/db?sslmode=require

# === LLM Enrichment (REQUIRED) ===
GOOGLE_VERTEX_CREDENTIALS={"type":"service_account",...}

# === GitHub API (RECOMMENDED) ===
GITHUB_TOKEN=ghp_productiontoken

# === Redis (REQUIRED for Cursor ingestion) ===
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Critical**:
- Use **same** `DATABASE_URL` as web app
- Stringify `GOOGLE_VERTEX_CREDENTIALS` JSON (no newlines)
- Set `GITHUB_TOKEN` to avoid rate limits

### 3.3 Deploy Tasks

```bash
# Deploy all ingestion tasks
pnpm exec trigger.dev@latest deploy

# Or deploy with specific environment
pnpm exec trigger.dev@latest deploy --env production
```

**Expected Output**:
```
✔ Building tasks...
✔ Deploying to Trigger.dev...
  - ingest-claude-code
  - ingest-codex
  - ingest-cursor
✔ Deployment successful
  View: https://cloud.trigger.dev/projects/proj_abc123xyz
```

### 3.4 Verify Schedules

1. Open Trigger.dev Dashboard
2. Navigate to **Schedules** tab
3. Verify schedules are active:
   - `ingest-claude-code-schedule` → `0 */6 * * *` (every 6 hours)
   - `ingest-codex-schedule` → `0 */6 * * *`
   - `ingest-cursor-schedule` → `0 */6 * * *`

4. Check "Next Run" times (should be within 6 hours)

### 3.5 Manual Test Run

1. Go to **Tasks** tab
2. Click `ingest-claude-code`
3. Click "Test" → "Run Test"
4. Monitor logs for errors
5. Verify `SUCCESS` status
6. Check database for new releases:
   ```sql
   SELECT version, headline FROM release
   WHERE "toolId" = (SELECT id FROM tool WHERE slug = 'claude-code')
   ORDER BY "versionSort" DESC LIMIT 5;
   ```

---

## Step 4: Post-Deployment Verification

### 4.1 Smoke Tests

Run these tests after deployment:

- [ ] Homepage loads (https://changelogs.directory)
- [ ] Tools directory page loads (`/tools`)
- [ ] Individual tool pages load (`/tools/claude-code`)
- [ ] Release pages load (`/tools/claude-code/releases/2.0.31`)
- [ ] Analytics page loads (`/analytics`)
- [ ] Authentication works (sign up, sign in, sign out)
- [ ] No JavaScript errors in browser console
- [ ] No 500 errors in Vercel logs

### 4.2 Database Verification

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Check data exists
pnpm prisma studio

# Or via SQL
psql $DATABASE_URL -c "SELECT slug, name FROM tool"
```

**Expected**:
- At least 3 tools (claude-code, codex, cursor)
- Releases for each tool
- FetchLog entries (if ingestion ran)

### 4.3 Ingestion Verification

Check Trigger.dev dashboard:

1. **Runs** tab → Verify recent successful runs
2. **Logs** tab → No critical errors
3. **Schedules** tab → Next run scheduled

Check database:
```sql
SELECT
	t.slug,
	fl.status,
	fl.releases_new,
	fl.releases_updated,
	fl.started_at
FROM fetch_log fl
JOIN tool t ON fl.tool_id = t.id
ORDER BY fl.started_at DESC
LIMIT 10;
```

**Expected**: `status = 'SUCCESS'`, `releases_new > 0` or `releases_updated > 0`

---

## Step 5: Monitoring & Alerts

### 5.1 Vercel Monitoring

- **Speed Insights**: Vercel Dashboard → Analytics → Speed Insights
- **Error Logs**: Vercel Dashboard → Deployments → [Latest] → Logs
- **Usage**: Monitor function invocations and bandwidth

### 5.2 Trigger.dev Monitoring

- **Run History**: Dashboard → Runs
- **Error Alerts**: Set up email notifications for failed runs
- **Cost Monitoring**: Dashboard → Usage

### 5.3 Sentry Error Tracking (Optional)

If `SENTRY_DSN` is set:

1. Check [Sentry Dashboard](https://sentry.io)
2. Monitor for:
   - JavaScript errors
   - Server errors (500s)
   - Performance issues

### 5.4 PostHog Analytics (Optional)

If `POSTHOG_KEY` is set:

1. Check [PostHog Dashboard](https://app.posthog.com)
2. Monitor:
   - Page views
   - User sessions
   - Feature usage

---

## Rollback Procedures

### Web App Rollback (Vercel)

**Option 1**: Via Dashboard
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"

**Option 2**: Via Git
```bash
# Revert last commit
git revert HEAD
git push origin main
# Vercel auto-deploys reverted version
```

### Trigger.dev Rollback

**Option 1**: Redeploy previous version
```bash
git checkout <previous-commit>
pnpm exec trigger.dev@latest deploy
```

**Option 2**: Disable schedule temporarily
1. Go to Trigger.dev Dashboard → Schedules
2. Click schedule → "Disable"
3. Fix issue locally
4. Redeploy: `pnpm exec trigger.dev@latest deploy`
5. Re-enable schedule

### Database Rollback

**WARNING**: Database rollbacks are destructive. Test in staging first.

```bash
# Rollback last migration
pnpm prisma migrate resolve --rolled-back <migration_name>

# Revert to specific migration
pnpm prisma migrate reset
pnpm prisma migrate deploy
```

**Backup first**:
```bash
# Export data before rollback
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## CI/CD Pipeline (GitHub Actions)

Automate deployment with GitHub Actions.

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9.11.0

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm build

      - run: pnpm vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-triggers:
    runs-on: ubuntu-latest
    needs: deploy-web
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9.11.0

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm exec trigger.dev@latest deploy
        env:
          TRIGGER_ACCESS_TOKEN: ${{ secrets.TRIGGER_ACCESS_TOKEN }}
```

---

## Troubleshooting

### Issue: Vercel build fails

**Error**: `Build failed with exit code 1`

**Fix**:
1. Check Vercel build logs for specific error
2. Verify `DATABASE_URL` is set in Vercel environment
3. Check all imports are valid (no missing dependencies)
4. Test build locally: `pnpm build`

---

### Issue: Database connection errors in production

**Error**: `Can't reach database server`

**Fix**:
1. Verify `DATABASE_URL` in Vercel matches Neon/Supabase
2. Ensure connection string includes `?sslmode=require`
3. Check Neon/Supabase database is not paused (free tier auto-pauses)
4. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

---

### Issue: Trigger.dev tasks not running

**Error**: No scheduled runs appearing

**Fix**:
1. Verify schedules are **enabled** in dashboard
2. Check cron syntax is valid: https://crontab.guru/
3. Ensure `DATABASE_URL` is set in Trigger.dev environment
4. Manually trigger task to test configuration
5. Check logs for error messages

---

### Issue: LLM enrichment failing in production

**Error**: 401 Unauthorized from Vertex AI

**Fix**:
1. Verify `GOOGLE_VERTEX_CREDENTIALS` is set in Trigger.dev
2. Ensure JSON is valid (no extra quotes or escaping)
3. Check service account has "Vertex AI User" role
4. Verify Vertex AI API is enabled in Google Cloud project

---

### Issue: Rate limiting from GitHub

**Error**: 403 rate limit exceeded

**Fix**:
1. Set `GITHUB_TOKEN` in Trigger.dev environment
2. Use a token with `public_repo` scope
3. Verify token is not expired (check GitHub settings)

---

## Deployment Checklist

Before marking deployment as complete:

- [ ] Web app deployed to Vercel (https://changelogs.directory)
- [ ] Database migrations ran successfully
- [ ] Database seeded with initial tools
- [ ] All environment variables set (web app + Trigger.dev)
- [ ] Trigger.dev tasks deployed
- [ ] Schedules active and next run scheduled
- [ ] At least one successful ingestion run
- [ ] Releases appear in database
- [ ] Web UI displays tools and releases correctly
- [ ] Authentication works (sign up/sign in)
- [ ] No errors in Vercel logs
- [ ] No errors in Trigger.dev logs
- [ ] Monitoring/alerting configured (Sentry, PostHog)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

---

## Maintenance

### Weekly Tasks

- [ ] Review Trigger.dev run history for failures
- [ ] Check database size (Neon/Supabase dashboard)
- [ ] Monitor Vercel usage (bandwidth, function invocations)

### Monthly Tasks

- [ ] Review and rotate secrets (API keys, tokens)
- [ ] Update dependencies: `pnpm update`
- [ ] Review Sentry error trends
- [ ] Check PostHog analytics for unusual patterns

### Quarterly Tasks

- [ ] Update to latest TanStack Start version
- [ ] Review and optimize database indexes
- [ ] Audit environment variables (remove unused)
- [ ] Load testing (if traffic increased significantly)

---

## Further Reading

- [guides/environment-variables.md](environment-variables.md) - Complete env var reference
- [guides/testing.md](testing.md) - Pre-deployment testing
- [Vercel Documentation](https://vercel.com/docs)
- [Trigger.dev Documentation](https://trigger.dev/docs)
- [Neon Documentation](https://neon.tech/docs)

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
