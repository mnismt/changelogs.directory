# Email Templates

> **Last verified**: 2026-03-20

This document describes the React Email template system.

## Overview

Email templates are built with [React Email](https://react.email), which allows writing emails as React components and rendering them to HTML.

## Template List

| Template | File | Status | Trigger |
|----------|------|--------|---------|
| Release Digest | `release-digest.tsx` | Active | Weekly schedule (Mondays 9 AM UTC) |
| Welcome | `welcome.tsx` | Active | On waitlist signup |
| Tool Release Update | `tool-release-update.tsx` | Planned | Per-tool subscription (future) |
| New Tool Announcement | `new-tool-announcement.tsx` | Planned | When new tool added (future) |

## Directory Structure

```
src/lib/email/templates/
├── index.ts              # Re-exports all templates
├── styles.ts             # Shared styles (colors, fonts, spacing)
├── release-digest.tsx    # Weekly digest email
├── welcome.tsx           # Signup confirmation
├── tool-release-update.tsx  # Individual tool updates
└── new-tool-announcement.tsx # New tool notifications
```

## Shared Styles

Common styles are defined in `styles.ts`:

```typescript
// src/lib/email/templates/styles.ts
export const colors = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  muted: '#737373',
  accent: '#22c55e', // Green for active states
  border: 'rgba(255, 255, 255, 0.1)',
}

export const fonts = {
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
```

## Release Digest Template

### Props Interface

```typescript
interface ReleaseDigestEmailProps {
  period: string           // "Jan 10-17, 2026" or "This Week"
  releases: DigestRelease[]
  totalReleases: number
  totalTools: number
}

interface DigestRelease {
  toolName: string
  toolSlug: string
  toolLogo: string
  vendor: string
  version: string
  releaseDate: string
  headline: string
  changeCount: number
  features: number
  bugfixes: number
  improvements: number
  breaking: number
}
```

### Component Structure

```tsx
export function ReleaseDigestEmail({
  period,
  releases,
  totalReleases,
  totalTools,
}: ReleaseDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {totalReleases} releases from {totalTools} tools this week
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header with logo */}
          <Section style={styles.header}>
            <Img src={`${BASE_URL}/logo.png`} width={40} height={40} />
            <Text style={styles.title}>Changelogs Weekly</Text>
          </Section>

          {/* Stats summary */}
          <Section style={styles.stats}>
            <Text>{totalReleases} releases • {totalTools} tools</Text>
          </Section>

          {/* Release cards */}
          {releases.map((release) => (
            <ReleaseCard key={release.toolSlug} release={release} />
          ))}

          {/* Footer with unsubscribe */}
          <Section style={styles.footer}>
            <Link href="{{unsubscribeUrl}}">Unsubscribe</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

### Rendering

```typescript
import { render } from '@react-email/components'
import { ReleaseDigestEmail } from '@/lib/email/templates/release-digest'

// Render to HTML
const html = await render(ReleaseDigestEmail(props))

// Render to plain text
const text = await render(ReleaseDigestEmail(props), { plainText: true })
```

## Creating a New Template

### 1. Create the component

```tsx
// src/lib/email/templates/my-template.tsx
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { colors, fonts } from './styles'

export interface MyTemplateProps {
  userName: string
  message: string
}

export function MyTemplate({ userName, message }: MyTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{message}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text>Hello {userName},</Text>
          <Text>{message}</Text>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: colors.background,
  fontFamily: fonts.sans,
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
}
```

### 2. Export from index

```typescript
// src/lib/email/templates/index.ts
export * from './my-template'
```

### 3. Add to template registry (optional)

```typescript
// src/lib/email/template-registry.ts
import { MyTemplate } from './templates/my-template'

export const templates = {
  'my-template': MyTemplate,
  'release-digest': ReleaseDigestEmail,
  // ...
}
```

### 4. Use in sending code

```typescript
import { render } from '@react-email/components'
import { MyTemplate } from '@/lib/email/templates'

const html = await render(MyTemplate({ userName: 'John', message: 'Hello!' }))

await emailProvider.sendEmail({
  to: 'john@example.com',
  subject: 'Hello John!',
  html,
})
```

## Preview During Development

React Email provides a dev server for previewing templates:

```bash
# Install React Email CLI (if not already)
pnpm add -D @react-email/cli

# Start preview server
pnpm email dev
```

This opens a browser at `localhost:3000` where you can preview all templates with sample data.

## Best Practices

### 1. Inline Styles Only

Email clients don't support external CSS. Always use inline styles:

```tsx
// Good
<Text style={{ color: '#22c55e', fontSize: '14px' }}>Hello</Text>

// Bad - won't work in most email clients
<Text className="text-green-500">Hello</Text>
```

### 2. Use React Email Components

The `@react-email/components` package provides cross-client compatible components:

```tsx
import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
```

### 3. Test Across Clients

Email rendering varies across clients. Test in:
- Gmail (web + mobile)
- Apple Mail
- Outlook (desktop + web)
- Yahoo Mail

### 4. Keep It Simple

- Max width: 600px (mobile-friendly)
- Use web-safe fonts or fallbacks
- Avoid complex layouts (tables work best)
- Test with images disabled

### 5. Include Plain Text

Always generate a plain text version:

```typescript
const text = await render(MyTemplate(props), { plainText: true })
```

## See Also

- [architecture.md](architecture.md) - Email provider system
- [weekly-digest.md](weekly-digest.md) - Digest pipeline
- [React Email Documentation](https://react.email/docs)
