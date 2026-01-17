# Email Architecture

> **Last verified**: 2026-01-17

This document describes the email provider abstraction and system design.

## Provider Abstraction

The email system uses a provider pattern to support multiple email services without changing application code.

### Interface

```typescript
// src/lib/email/types.ts
interface EmailParams {
  from: { email: string; name: string }
  to: string
  subject: string
  html: string
  text?: string
  headers?: Record<string, string>
}

interface EmailResult {
  success: boolean
  error?: string
}

interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>
}
```

### Factory

```typescript
// src/lib/email/index.ts
function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'resend'

  switch (provider) {
    case 'resend':
      return new LoggingEmailProvider(
        new ResendProvider(process.env.RESEND_API_KEY),
        'resend'
      )
    case 'zeptomail':
      return new LoggingEmailProvider(
        new ZeptoMailProvider(process.env.ZEPTOMAIL_API_KEY),
        'zeptomail'
      )
    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}
```

### Providers

| Provider | File | Notes |
|----------|------|-------|
| Resend | `resend-provider.ts` | Primary provider, supports webhooks |
| ZeptoMail | `zepto-provider.ts` | Alternative provider |
| Logging | `logging-provider.ts` | Decorator that logs all emails to `EmailLog` |

## Logging Decorator

All email sends are wrapped with `LoggingEmailProvider` which:

1. Records the email in `EmailLog` table before sending
2. Calls the underlying provider
3. Updates status on success/failure

```typescript
// Simplified flow
async sendEmail(params: EmailParams): Promise<EmailResult> {
  // 1. Create log entry
  const log = await prisma.emailLog.create({
    data: {
      to: params.to,
      subject: params.subject,
      provider: this.providerName,
      status: 'pending',
    },
  })

  // 2. Send via actual provider
  const result = await this.provider.sendEmail(params)

  // 3. Update status
  await prisma.emailLog.update({
    where: { id: log.id },
    data: { status: result.success ? 'success' : 'failed' },
  })

  return result
}
```

## Directory Structure

```
src/lib/email/
├── index.ts              # createEmailProvider() factory
├── types.ts              # EmailProvider interface, EmailParams, EmailResult
├── resend-provider.ts    # Resend API implementation
├── zepto-provider.ts     # ZeptoMail API implementation
├── logging-provider.ts   # Decorator for EmailLog persistence
├── template-registry.ts  # Template lookup by ID
└── templates/
    ├── index.ts          # Re-exports all templates
    ├── styles.ts         # Shared email styles (colors, fonts)
    ├── release-digest.tsx    # Weekly digest template
    ├── welcome.tsx           # Welcome/signup confirmation
    ├── tool-release-update.tsx  # Per-tool release notification (future)
    └── new-tool-announcement.tsx # New tool added (future)
```

## Adding a New Provider

1. **Create provider class**:

```typescript
// src/lib/email/sendgrid-provider.ts
import type { EmailParams, EmailProvider, EmailResult } from './types'

export class SendGridProvider implements EmailProvider {
  constructor(private apiKey: string) {}

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    // SendGrid API implementation
  }
}
```

2. **Add to factory**:

```typescript
// src/lib/email/index.ts
case 'sendgrid':
  return new LoggingEmailProvider(
    new SendGridProvider(process.env.SENDGRID_API_KEY),
    'sendgrid'
  )
```

3. **Add environment variable**:

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
```

4. **Update docs**:
   - Add to `docs/guides/environment-variables.md`
   - Add to this document's provider table

## Error Handling

### Transient Errors (Retryable)

- Network timeouts
- Rate limits (429)
- Provider temporary outages

### Permanent Errors (Not Retryable)

- Invalid API key (401)
- Invalid email address format
- Blocked/bounced recipient

### Retry Strategy

The weekly digest uses Trigger.dev's built-in retry:

```typescript
// trigger.config.ts
retries: {
  maxAttempts: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 10000,
}
```

Individual email failures within a batch are logged but don't fail the entire job.

## See Also

- [weekly-digest.md](weekly-digest.md) - Digest pipeline details
- [templates.md](templates.md) - Email template development
- [webhooks.md](webhooks.md) - Bounce/delivery handling
