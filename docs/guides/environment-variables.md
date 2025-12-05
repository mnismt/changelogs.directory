# Environment Variables Reference

> **Last verified**: 2025-12-05

This document lists all environment variables used across the Changelogs.directory application, including web app, Trigger.dev workers, and deployment infrastructure.

## Quick Reference

| Category | Required? | Environment |
|----------|-----------|-------------|
| [Core Application](#core-application) | ✅ Required | All |
| [Authentication](#authentication) | ✅ Required | Web App |
| [Ingestion Pipeline](#ingestion-pipeline) | ⚠️ Recommended | Trigger.dev |
| [Analytics & Monitoring](#analytics--monitoring) | Optional | Web App |
| [Email Notifications](#email-notifications) | Optional | Web App |
| [Deployment](#deployment) | Optional | CI/CD |

---

## Core Application

### Database

#### `DATABASE_URL` (required)

PostgreSQL connection string for Prisma ORM.

**Format**: `postgresql://user:password@host:port/database?params`

**Examples**:
```bash
# Local development (PostgreSQL in Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/changelogs"

# Production (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-cool-sound-123456.us-east-2.aws.neon.tech/changelogs?sslmode=require"

# Production (Supabase)
DATABASE_URL="postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres"
```

**Used by**:
- Prisma migrations and queries
- All server functions
- Trigger.dev ingestion tasks

**Notes**:
- Production connections **must** use SSL (`?sslmode=require`)
- Connection pooling is handled by Prisma
- Must be set in **both** web app and Trigger.dev environments

---

### Caching (Optional, but recommended for production)

#### `UPSTASH_REDIS_REST_URL` (optional)

Upstash Redis REST API endpoint for caching.

**Format**: `https://<host>.upstash.io`

**Example**:
```bash
UPSTASH_REDIS_REST_URL="https://tough-chicken-31111.upstash.io"
```

**Used by**:
- Feed caching (`src/lib/redis.ts`)
- Tool page caching
- Cursor incremental crawling (`src/trigger/ingest/cursor/cache.ts`)

**Get from**: [Upstash Console](https://console.upstash.com) → Redis → REST API

---

#### `UPSTASH_REDIS_REST_TOKEN` (optional)

Authentication token for Upstash Redis.

**Example**:
```bash
UPSTASH_REDIS_REST_TOKEN="AabcdefGHIJKLMNOPQRSTUVWXYZ1234567890"
```

**Used by**: Redis client authentication

**Notes**:
- Keep this secret secure
- Rotate periodically
- If not set, caching is disabled (app still works)

---

## Authentication

#### `BETTER_AUTH_SECRET` (required)

Secret key for session encryption and CSRF protection.

**Format**: 32+ character random string

**Generate**:
```bash
openssl rand -hex 32
```

**Example**:
```bash
BETTER_AUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

**Used by**: Better Auth session management (`src/lib/auth/server.ts`)

**Notes**:
- **Never commit this to git**
- Use different secrets for dev/staging/prod
- Changing this invalidates all existing sessions

---

#### `BETTER_AUTH_URL` (required)

Base URL of your application for authentication redirects.

**Examples**:
```bash
# Local development
BETTER_AUTH_URL="http://localhost:5173"

# Production
BETTER_AUTH_URL="https://changelogs.directory"

# Staging
BETTER_AUTH_URL="https://staging.changelogs.directory"
```

**Used by**:
- OAuth callback URLs
- Session cookie domain
- CORS trusted origins

**Notes**:
- Must match actual deployment URL
- No trailing slash
- Must use HTTPS in production

---

### Admin Seeding

#### `ADMIN_EMAIL` (required for seeding)

Email address for the admin user created during database seeding.

**Example**:
```bash
ADMIN_EMAIL="admin@yourdomain.com"
```

**Used by**: `prisma/seed.ts` to create initial admin user

---

#### `ADMIN_PASSWORD` (required for seeding)

Password for the admin user.

**Example**:
```bash
ADMIN_PASSWORD="YourSecurePassword123!"
```

**Used by**: `prisma/seed.ts` to create initial admin user

**Notes**:
- Only needed during initial database setup
- Change password after first login via admin UI
- Can be unset after seeding completes

---

## Ingestion Pipeline

These variables are used by Trigger.dev background jobs for changelog ingestion.

#### `GOOGLE_VERTEX_CREDENTIALS` (required for LLM enrichment)

Google Cloud service account credentials JSON for Vertex AI (Gemini API).

**Format**: Stringified JSON object

**Example**:
```bash
GOOGLE_VERTEX_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"trigger@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/trigger%40your-project.iam.gserviceaccount.com"}'
```

**Used by**:
- `src/lib/llm/index.ts` - LLM classification and summarization
- All ingestion tasks (claude-code, codex, cursor)

**Get from**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Vertex AI API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Create service account with **Vertex AI User** role
6. Create JSON key and copy the entire content

**Notes**:
- **Must be set in Trigger.dev environment** (not just local .env)
- If not set, ingestion falls back to keyword-based classification
- Costs ~$0.05-0.10 per full ingestion run (~141 releases)

---

#### `GITHUB_TOKEN` (optional, but recommended)

GitHub Personal Access Token for higher API rate limits.

**Format**: `ghp_` followed by 36 characters

**Example**:
```bash
GITHUB_TOKEN="ghp_abcdefghijklmnopqrstuvwxyz1234567890"
```

**Used by**:
- Fetching CHANGELOG.md files from GitHub
- GitHub Releases API calls
- Git commit history fetching

**Get from**: [GitHub Settings → Tokens](https://github.com/settings/tokens)

**Scopes**: `public_repo` (read-only access to public repositories)

**Rate Limits**:
- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour

**Notes**:
- Highly recommended for production to avoid rate limiting
- Token should be for a bot account or service account
- Rotate periodically for security

---

## Analytics & Monitoring

### PostHog (Web Analytics)

#### `VITE_PUBLIC_POSTHOG_KEY` (optional)

PostHog project API key for web analytics.

**Format**: `phc_` followed by alphanumeric string

**Example**:
```bash
VITE_PUBLIC_POSTHOG_KEY="phc_abcdefghijklmnopqrstuvwxyz123456"
```

**Used by**: `src/integrations/posthog/provider.tsx` - Analytics tracking

**Get from**: [PostHog Dashboard](https://app.posthog.com) → Project Settings

---

#### `VITE_PUBLIC_POSTHOG_HOST` (optional)

PostHog instance URL (US or EU region).

**Examples**:
```bash
# US region
VITE_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# EU region
VITE_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"

# Self-hosted
VITE_PUBLIC_POSTHOG_HOST="https://posthog.yourcompany.com"
```

**Used by**: PostHog client initialization

**Default**: `https://us.i.posthog.com`

---

### Sentry (Error Tracking)

#### `VITE_SENTRY_DSN` (optional)

Sentry Data Source Name for client-side error tracking.

**Format**: `https://<key>@<org>.ingest.sentry.io/<project>`

**Example**:
```bash
VITE_SENTRY_DSN="https://abc123def456@o123456.ingest.sentry.io/789012"
```

**Used by**: `src/integrations/sentry/index.ts` - Client-side error reporting

**Get from**: [Sentry](https://sentry.io) → Project Settings → Client Keys (DSN)

---

#### `SENTRY_DSN` (optional)

Sentry DSN for server-side error tracking (separate from client DSN).

**Example**:
```bash
SENTRY_DSN="https://xyz789ghi012@o123456.ingest.sentry.io/345678"
```

**Used by**: `src/integrations/sentry/server.ts` - Server-side error reporting

---

#### `VITE_SENTRY_ENVIRONMENT` (optional)

Environment tag for Sentry events (helps filter errors by environment).

**Examples**:
```bash
VITE_SENTRY_ENVIRONMENT="development"
VITE_SENTRY_ENVIRONMENT="staging"
VITE_SENTRY_ENVIRONMENT="production"
```

**Used by**: Sentry event tagging

**Default**: `development`

---

## Email Notifications

#### `EMAIL_PROVIDER` (optional)

Email service provider to use for transactional emails.

**Options**: `resend` | `zeptomail`

**Example**:
```bash
EMAIL_PROVIDER="resend"
```

**Used by**: `src/lib/email/index.ts` - Email sending

**Default**: `resend`

---

#### `RESEND_API_KEY` (required if EMAIL_PROVIDER=resend)

Resend API key for sending emails.

**Format**: `re_` followed by alphanumeric string

**Example**:
```bash
RESEND_API_KEY="re_abcdefghijklmnopqrstuvwxyz1234567890"
```

**Used by**:
- Waitlist confirmation emails
- Admin notifications

**Get from**: [Resend Dashboard](https://resend.com/api-keys)

**Notes**:
- Free tier: 100 emails/day
- Production: Upgrade to paid plan

---

#### `ZEPTOMAIL_API_KEY` (required if EMAIL_PROVIDER=zeptomail)

ZeptoMail API key (alternative to Resend).

**Example**:
```bash
ZEPTOMAIL_API_KEY="your_zeptomail_key_here"
```

**Get from**: [ZeptoMail](https://www.zoho.com/zeptomail/)

**Notes**: Only needed if using ZeptoMail instead of Resend

---

## Deployment

### Vercel (Optional)

#### `VERCEL_ACCESS_TOKEN` (optional)

Personal access token for Vercel CLI automated deployments.

**Example**:
```bash
VERCEL_ACCESS_TOKEN="abc123def456ghi789jkl012mno345pqr678stu901vwx234"
```

**Used by**: Deployment scripts, CI/CD pipelines

**Get from**: [Vercel Account Settings](https://vercel.com/account/tokens)

---

#### `VERCEL_PROJECT_ID` (optional)

Vercel project identifier for deployments.

**Example**:
```bash
VERCEL_PROJECT_ID="prj_abc123def456ghi789"
```

**Used by**: `pnpm deploy` command

**Get from**: Vercel Project Settings → General

---

## Configuration by Environment

### Local Development (`.env`)

```bash
# === Core ===
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/changelogs"
BETTER_AUTH_SECRET="generate-with-openssl-rand-hex-32"
BETTER_AUTH_URL="http://localhost:5173"

# === Admin (for seeding) ===
ADMIN_EMAIL="admin@localhost"
ADMIN_PASSWORD="admin123"

# === Ingestion (optional locally) ===
GOOGLE_VERTEX_CREDENTIALS='{"type":"service_account",...}'
GITHUB_TOKEN="ghp_yourtoken"

# === Analytics (optional) ===
VITE_PUBLIC_POSTHOG_KEY="phc_yourkey"
VITE_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# === Email (optional) ===
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_yourkey"
```

### Production (`.env.production` or Vercel)

```bash
# === Core ===
DATABASE_URL="postgresql://user:pass@neon.tech/changelogs?sslmode=require"
BETTER_AUTH_SECRET="production-secret-different-from-dev"
BETTER_AUTH_URL="https://changelogs.directory"

# === Redis ===
UPSTASH_REDIS_REST_URL="https://prod-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="prod_token_here"

# === Ingestion ===
GOOGLE_VERTEX_CREDENTIALS='{"type":"service_account",...}'
GITHUB_TOKEN="ghp_productiontoken"

# === Analytics ===
VITE_PUBLIC_POSTHOG_KEY="phc_prodkey"
VITE_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
VITE_SENTRY_DSN="https://key@sentry.io/project"
SENTRY_DSN="https://key@sentry.io/project"
VITE_SENTRY_ENVIRONMENT="production"

# === Email ===
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_productionkey"
```

### Trigger.dev Environment Variables

**Required** in [Trigger.dev Dashboard](https://cloud.trigger.dev) → Project Settings → Environment Variables:

```bash
DATABASE_URL="postgresql://..."
GOOGLE_VERTEX_CREDENTIALS='{"type":"service_account",...}'
GITHUB_TOKEN="ghp_..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Notes**:
- Trigger.dev runs in a separate environment from your web app
- Must duplicate database and ingestion-related vars
- Use same production DATABASE_URL as web app
- Redis vars only needed if using Cursor ingestion (incremental crawling)

---

## Security Best Practices

### Never Commit Secrets
```bash
# .gitignore should include:
.env
.env.local
.env.production
.env.*.local
```

### Rotate Secrets Regularly
- `BETTER_AUTH_SECRET` - Every 90 days
- `GITHUB_TOKEN` - Every 180 days
- `RESEND_API_KEY` - Every 180 days
- `GOOGLE_VERTEX_CREDENTIALS` - Rotate service account keys annually

### Use Different Secrets per Environment
Never use the same `BETTER_AUTH_SECRET` in dev, staging, and production.

### Verify Permissions
- Google service accounts: Only **Vertex AI User** role (not Owner)
- GitHub tokens: Only `public_repo` scope (not `repo` or `admin`)
- Vercel tokens: Only project-scoped, not account-wide

---

## Troubleshooting

### Issue: "DATABASE_URL environment variable is not set"

**Cause**: Missing DATABASE_URL in Trigger.dev or web app environment

**Fix**:
1. For web app: Check `.env` file exists and contains `DATABASE_URL`
2. For Trigger.dev: Go to project settings → Environment Variables → Add `DATABASE_URL`

---

### Issue: LLM enrichment failing with 401 Unauthorized

**Cause**: Invalid or missing `GOOGLE_VERTEX_CREDENTIALS`

**Fix**:
1. Verify JSON is valid: `echo $GOOGLE_VERTEX_CREDENTIALS | jq .`
2. Check service account has "Vertex AI User" role
3. Ensure Vertex AI API is enabled in Google Cloud project
4. Re-generate service account key if corrupted

---

### Issue: GitHub rate limit exceeded (403)

**Cause**: Missing `GITHUB_TOKEN` or token expired

**Fix**:
1. Create token at https://github.com/settings/tokens
2. Select `public_repo` scope
3. Add to `.env` and Trigger.dev environment
4. Redeploy if needed

---

### Issue: Redis connection errors

**Cause**: Missing or incorrect `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`

**Fix**:
1. Verify URL and token from Upstash console
2. Ensure URL starts with `https://`
3. Token should be ~40 characters
4. If using Cursor ingestion, both vars are required

---

## Environment Variable Checklist

Before deploying to production, ensure:

- [ ] `DATABASE_URL` set in both web app and Trigger.dev
- [ ] `BETTER_AUTH_SECRET` is unique and secure (not dev secret)
- [ ] `BETTER_AUTH_URL` matches production domain
- [ ] `GOOGLE_VERTEX_CREDENTIALS` set in Trigger.dev for LLM enrichment
- [ ] `GITHUB_TOKEN` set in Trigger.dev to avoid rate limits
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set for caching
- [ ] Analytics keys (`POSTHOG`, `SENTRY`) set if using monitoring
- [ ] Email provider (`RESEND_API_KEY`) set if using notifications
- [ ] All secrets are different from development environment
- [ ] `.env` is in `.gitignore` and not committed

---

## Further Reading

- [guides/deployment.md](deployment.md) - Production deployment procedures
- [guides/adding-a-tool.md](adding-a-tool.md) - Which env vars are needed for new tools
- [guides/testing.md](testing.md) - Testing with environment variables
- [Trigger.dev Documentation](https://trigger.dev/docs/configuration/environment-variables)

---

**Questions?** Open an issue on GitHub or consult the [documentation index](../README.md).
