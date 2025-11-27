# Changelogs.directory

Changelogs.directory is a centralized platform that tracks, aggregates, and presents changelog information for CLI developer tools. The platform addresses the growing challenge developers face in staying updated with the rapidly evolving landscape of command-line AI coding tools like Claude Code, OpenAI Codex, AMP Code, and Droid CLI.

## Setup

### Environment Variables

Create a `.env` file in the project root:

```bash
# PostHog Analytics
VITE_PUBLIC_POSTHOG_KEY=phc_your_key_here
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Email Provider (resend or zeptomail, defaults to resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_key_here
# ZEPTOMAIL_API_KEY=your_zepto_key  # Only needed if EMAIL_PROVIDER=zeptomail
```

Get your PostHog key from: https://app.posthog.com/project/settings

Get your Resend API key from: https://resend.com/api-keys

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build & Deploy

```bash
pnpm build
pnpm deploy
```

## Analytics

PostHog is integrated for web analytics. See `src/integrations/posthog/README.md` for usage.
