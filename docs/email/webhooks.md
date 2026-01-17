# Email Webhooks

> **Last verified**: 2026-01-17

This document describes webhook handling for email delivery events.

## Overview

Email providers send webhooks to notify us of delivery events:

- **Delivered**: Email successfully delivered to recipient's inbox
- **Bounced**: Email rejected by recipient's server
- **Complained**: Recipient marked email as spam

## Webhook Endpoint

```
POST /api/resend-webhook
```

This endpoint handles events from Resend (primary provider).

## Event Types

### email.delivered

Email was successfully delivered.

```typescript
// src/server/digest.ts
export const handleDeliveredEvent = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    await prisma.emailLog.updateMany({
      where: {
        to: { in: data.emails },
        subject: data.subject,
        status: 'success',
      },
      data: { status: 'delivered' },
    })
  })
```

### email.bounced

Email was rejected by recipient's mail server.

**Causes**:
- Invalid email address
- Mailbox full
- Domain doesn't exist
- Server rejected delivery

```typescript
export const handleBounceEvent = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    // Update EmailLog
    await prisma.emailLog.updateMany({
      where: {
        to: { in: data.emails },
        subject: data.subject,
      },
      data: { status: 'bounced' },
    })

    // Increment DigestLog bounce count
    await prisma.digestLog.updateMany({
      where: {
        startedAt: { gte: weekAgo },
        status: { in: ['COMPLETED', 'PARTIAL'] },
      },
      data: { emailsBounced: { increment: 1 } },
    })
  })
```

### email.complained

Recipient marked email as spam.

**Action**: Auto-unsubscribe to protect sender reputation.

```typescript
export const handleComplaintEvent = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    await prisma.waitlist.updateMany({
      where: { email: { in: data.emails } },
      data: { isUnsubscribed: true },
    })
  })
```

## Resend Webhook Setup

### 1. Create webhook in Resend dashboard

1. Go to [resend.com/webhooks](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Enter endpoint URL: `https://changelogs.directory/api/resend-webhook`
4. Select events: `email.delivered`, `email.bounced`, `email.complained`
5. Copy the signing secret

### 2. Add environment variable

```bash
RESEND_WEBHOOK_SECRET=whsec_your_secret_here
```

### 3. Verify signature (optional but recommended)

```typescript
// src/routes/api/resend-webhook.ts
import { Webhook } from 'svix'

export async function POST(request: Request) {
  const payload = await request.text()
  const headers = {
    'svix-id': request.headers.get('svix-id')!,
    'svix-timestamp': request.headers.get('svix-timestamp')!,
    'svix-signature': request.headers.get('svix-signature')!,
  }

  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!)

  try {
    const event = wh.verify(payload, headers)
    // Process event
  } catch (err) {
    return new Response('Invalid signature', { status: 401 })
  }
}
```

## CAN-SPAM Compliance

The weekly digest includes CAN-SPAM compliant headers:

### List-Unsubscribe Header

```typescript
// One-click unsubscribe
const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${subscriber.unsubscribeToken}`

headers: {
  'List-Unsubscribe': `<${unsubscribeUrl}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
}
```

This enables:
- Gmail's "Unsubscribe" button in header
- Apple Mail's unsubscribe option
- Other email clients' built-in unsubscribe

### Unsubscribe Flow

1. User clicks unsubscribe link or email client's unsubscribe button
2. Request hits `/api/unsubscribe?token=xxx`
3. Token looked up in `Waitlist.unsubscribeToken`
4. `Waitlist.isUnsubscribed` set to `true`
5. User shown confirmation page

```typescript
// src/server/digest.ts
export const processUnsubscribe = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const subscriber = await prisma.waitlist.findUnique({
      where: { unsubscribeToken: data.token },
    })

    if (!subscriber) {
      return { found: false }
    }

    if (subscriber.isUnsubscribed) {
      return { found: true, alreadyUnsubscribed: true }
    }

    await prisma.waitlist.update({
      where: { id: subscriber.id },
      data: { isUnsubscribed: true },
    })

    return { found: true, alreadyUnsubscribed: false }
  })
```

## Monitoring

### Bounce Rate

Track bounce rate in admin dashboard:

```typescript
const bounceRate = (log.emailsBounced / log.emailsSent) * 100
```

**Alert thresholds**:
- \>5%: Investigate email list quality
- \>10%: Pause sending, clean list

### Complaint Rate

Spam complaints should be < 0.1% to maintain sender reputation.

**If complaints increase**:
1. Review email content
2. Check sending frequency
3. Verify opt-in process
4. Consider double opt-in

## Testing Webhooks

### Local Development

Use a tunnel service to receive webhooks locally:

```bash
# Using ngrok
ngrok http 5173

# Update Resend webhook URL temporarily
# https://abc123.ngrok.io/api/resend-webhook
```

### Webhook Payload Examples

**Delivered**:
```json
{
  "type": "email.delivered",
  "data": {
    "email_id": "abc123",
    "to": ["user@example.com"],
    "subject": "Changelogs Weekly #3"
  }
}
```

**Bounced**:
```json
{
  "type": "email.bounced",
  "data": {
    "email_id": "abc123",
    "to": ["invalid@example.com"],
    "subject": "Changelogs Weekly #3",
    "bounce_type": "hard"
  }
}
```

**Complained**:
```json
{
  "type": "email.complained",
  "data": {
    "email_id": "abc123",
    "to": ["user@example.com"],
    "subject": "Changelogs Weekly #3"
  }
}
```

## See Also

- [architecture.md](architecture.md) - Email provider system
- [weekly-digest.md](weekly-digest.md) - Digest pipeline
- [Resend Webhooks Documentation](https://resend.com/docs/webhooks)
