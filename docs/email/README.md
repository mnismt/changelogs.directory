# Email System

> **Last verified**: 2026-01-17

This section documents the email infrastructure for Changelogs.directory, including the weekly digest pipeline, email templates, and webhook handling.

## Overview

The email system handles:

- **Weekly Digest**: Automated emails sent every Monday with curated changelog updates
- **Transactional Emails**: Welcome emails, notifications (planned)
- **Subscriber Management**: Waitlist signup, unsubscribe flow, bounce handling

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│  Subscribe  │ ──▶ │   Waitlist   │ ──▶ │ Weekly Digest  │ ──▶ │   Resend/   │
│    Page     │     │   (Prisma)   │     │ (Trigger.dev)  │     │  ZeptoMail  │
└─────────────┘     └──────────────┘     └────────────────┘     └─────────────┘
                                                                       │
                                                                       ▼
                                                              ┌─────────────────┐
                                                              │    Webhooks     │
                                                              │ (bounce/deliver)│
                                                              └─────────────────┘
```

## Quick Navigation

| Topic | Document | Description |
|-------|----------|-------------|
| System Design | [architecture.md](architecture.md) | Provider abstraction, directory structure |
| Weekly Digest | [weekly-digest.md](weekly-digest.md) | Scheduled job, batching, observability |
| Templates | [templates.md](templates.md) | React Email components, styling |
| Webhooks | [webhooks.md](webhooks.md) | Bounce/complaint handling, CAN-SPAM |

## Key Files

```
src/
├── lib/email/
│   ├── index.ts              # Provider factory
│   ├── types.ts              # EmailProvider interface
│   ├── resend-provider.ts    # Resend implementation
│   ├── zepto-provider.ts     # ZeptoMail implementation
│   ├── logging-provider.ts   # Decorator for EmailLog
│   ├── template-registry.ts  # Template lookup
│   └── templates/
│       ├── release-digest.tsx    # Weekly digest email
│       ├── welcome.tsx           # Signup confirmation
│       ├── tool-release-update.tsx  # (Future)
│       └── new-tool-announcement.tsx # (Future)
├── trigger/digest/
│   ├── index.ts              # sendWeeklyDigest task
│   └── shared.ts             # Helper functions
├── server/digest.ts          # Server functions (stats, unsubscribe)
└── routes/
    ├── subscribe.tsx         # Public signup page
    └── admin/digests.tsx     # Admin dashboard
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_PROVIDER` | No | `resend` (default) or `zeptomail` |
| `RESEND_API_KEY` | If using Resend | API key from resend.com |
| `ZEPTOMAIL_API_KEY` | If using ZeptoMail | API key from ZeptoMail |
| `BASE_URL` | Yes | Base URL for unsubscribe links |

See [guides/environment-variables.md](../guides/environment-variables.md) for full list.

## Database Models

The email system uses these Prisma models (see [database-schema.md](../reference/database-schema.md)):

- **Waitlist**: Subscriber emails, unsubscribe tokens, last digest sent
- **DigestLog**: Weekly digest run history, delivery metrics
- **EmailLog**: Individual email tracking (for debugging)

## See Also

- [reference/database-schema.md](../reference/database-schema.md) - Full schema documentation
- [guides/environment-variables.md](../guides/environment-variables.md) - Configuration
- [project/architecture.md](../project/architecture.md) - System overview
