# Weekly Digest Pipeline

> **Last verified**: 2026-03-20

This document describes the automated weekly digest email system.

## Overview

Every Monday at 9:00 AM UTC, a Trigger.dev scheduled task sends a curated digest of the week's changelog updates to all active subscribers.

## Schedule

```typescript
// src/trigger/digest/index.ts
export const weeklyDigestSchedule = schedules.task({
  id: 'weekly-digest-schedule',
  cron: '0 9 * * 1', // Monday at 9:00 AM UTC
  run: async () => {
    await sendWeeklyDigest.trigger({})
  },
})
```

## Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Check     │ ──▶ │   Fetch     │ ──▶ │   Build     │ ──▶ │   Send      │
│   Period    │     │  Releases   │     │   Email     │     │   Batches   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Idempotency         7-day window      React Email        50/batch
  (ISO week)          Dedupe by tool    Render HTML        100ms delay
```

### Phase 1: Check Period

```typescript
const period = getISOWeek(now) // e.g., "2026-W03"

// Idempotency check - skip if already sent this week
const existingDigest = await prisma.digestLog.findUnique({
  where: { period },
})

if (existingDigest?.status === 'COMPLETED' && !payload.force) {
  return { skipped: true, reason: 'already_sent' }
}
```

### Phase 2: Fetch Releases

```typescript
const releases = await getWeeklyReleases(weekAgo)

// Skip if no releases this week
if (releases.length === 0) {
  await prisma.digestLog.upsert({
    where: { period },
    create: { period, status: 'SKIPPED' },
    update: { status: 'SKIPPED' },
  })
  return { skipped: true, reason: 'no_releases' }
}

// Dedupe: keep only latest release per tool
const dedupedReleases = dedupeReleases(releases)
```

### Phase 3: Build Email

```typescript
const emailContent: ReleaseDigestEmailProps = {
  period: 'This Week',
  releases: dedupedReleases.slice(0, 10), // Top 10 tools
  totalReleases: releases.length,
  totalTools: uniqueTools.size,
}

// Render once, send to all
const html = await render(ReleaseDigestEmail(emailContent))
const text = await render(ReleaseDigestEmail(emailContent), { plainText: true })
```

### Phase 4: Send Batches

```typescript
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 100

for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
  const batch = subscribers.slice(i, i + BATCH_SIZE)

  const results = await Promise.allSettled(
    batch.map((sub) => sendDigestEmail(sub, emailContent, periodLabel))
  )

  // Update progress
  await prisma.digestLog.update({
    where: { id: digestLog.id },
    data: { emailsSent, emailsFailed },
  })

  // Rate limit protection
  if (i + BATCH_SIZE < subscribers.length) {
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
  }
}
```

## Subject Line Format

```
Changelogs Weekly #3 · Jan 10-17, 2026
```

Components:
- Week number extracted from ISO week period
- Date range formatted as "Jan 10-17, 2026"

## Subscriber Selection

Active subscribers are those who:
1. Have `isUnsubscribed: false`
2. Have `isTest: false`
3. Either haven't received a digest, or last received before the period start

```typescript
const subscribers = await prisma.waitlist.findMany({
  where: {
    isUnsubscribed: false,
    isTest: false,
    OR: [
      { lastDigestSentAt: null },
      { lastDigestSentAt: { lt: periodStart } },
    ],
  },
  select: { id: true, email: true, unsubscribeToken: true },
})
```

## Test Mode

Send a test digest to a single email without affecting production:

```typescript
// From admin dashboard
await sendWeeklyDigest.trigger({
  test: { email: 'your@email.com' },
})
```

Test mode differences:
- Uses unique period string (`TEST-<timestamp>-<random>`)
- Doesn't update subscriber's `lastDigestSentAt`
- Creates `DigestLog` with `isTest: true`
- Skips idempotency check

## DigestLog Model

Each digest run creates a `DigestLog` record:

| Field | Description |
|-------|-------------|
| `period` | ISO week (PK for production) or unique test ID |
| `isTest` | Boolean flag for test runs |
| `status` | PENDING, IN_PROGRESS, COMPLETED, PARTIAL, FAILED, SKIPPED |
| `subscribersTotal` | Snapshot of recipient count at send time |
| `emailsSent` | Successfully sent count |
| `emailsFailed` | Failed count |
| `emailsBounced` | Bounced count (updated via webhook) |
| `releasesIncluded` | Number of releases in digest |
| `toolsIncluded` | Number of unique tools |
| `startedAt` | Job start time |
| `completedAt` | Job completion time |
| `error` | Error message if failed |

## Status Definitions

| Status | Condition |
|--------|-----------|
| COMPLETED | All emails sent successfully |
| PARTIAL | Some emails failed, but at least one succeeded |
| FAILED | All emails failed |
| SKIPPED | No releases this week or no subscribers |
| IN_PROGRESS | Currently sending |

## Observability

### Admin Dashboard

Access `/admin/digests` to:
- View digest history with delivery stats
- Preview the current week's email
- Send test digests
- Toggle test runs visibility

### Metrics

```typescript
// Delivery rate
const deliveryRate = (emailsSent / subscribersTotal) * 100

// Bounce rate (updated via webhook)
const bounceRate = (emailsBounced / emailsSent) * 100
```

### Alerts

High failure rate (>10%) logs a warning:

```typescript
if (failureRate > 0.1) {
  logger.warn('High digest failure rate detected', {
    period,
    failureRate: `${(failureRate * 100).toFixed(1)}%`,
  })
}
```

## Force Resend

To resend a digest for a specific week:

```typescript
await sendWeeklyDigest.trigger({ force: true })
```

This bypasses the idempotency check and re-sends to all subscribers.

## See Also

- [architecture.md](architecture.md) - Provider abstraction
- [templates.md](templates.md) - Digest email template
- [webhooks.md](webhooks.md) - Bounce handling
- [../reference/database-schema.md](../reference/database-schema.md) - DigestLog schema
