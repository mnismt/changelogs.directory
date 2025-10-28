# PostHog Integration

PostHog is integrated for web analytics and product insights.

## Setup

1. **Get your PostHog credentials:**
   - Sign up at https://posthog.com
   - Get your Project API Key from: https://app.posthog.com/project/settings

2. **Add environment variables:**
   Create a `.env` file in the project root with:
   ```bash
   VITE_PUBLIC_POSTHOG_KEY=phc_your_key_here
   VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

   For EU hosting, use: `https://eu.i.posthog.com`

3. **PostHog is already configured!**
   - Automatic pageview tracking on route changes
   - Client-side only (no SSR issues)
   - Person profiles: identified_only (for privacy)

## Usage

### Track Custom Events

```tsx
import { posthog } from '@/integrations/posthog'

function MyComponent() {
  const handleClick = () => {
    posthog.capture('button_clicked', {
      button_name: 'subscribe',
      location: 'hero_section'
    })
  }

  return <button onClick={handleClick}>Subscribe</button>
}
```

### Identify Users

```tsx
import { posthog } from '@/integrations/posthog'

// After successful login/signup
posthog.identify(
  'user_id_123',
  {
    email: 'user@example.com',
    name: 'John Doe'
  }
)
```

### Feature Flags

```tsx
import { posthog } from '@/integrations/posthog'

const isFeatureEnabled = posthog.isFeatureEnabled('new-feature')

if (isFeatureEnabled) {
  // Show new feature
}
```

## What's Tracked Automatically

- ✅ Page views (on every route change)
- ✅ Page leave events
- ✅ Session recording (configurable)
- ✅ Basic user properties

## Configuration

Edit `src/integrations/posthog/provider.tsx` to customize:
- Session recording settings
- Autocapture behavior
- Privacy settings
- Advanced options

## Docs

- PostHog Docs: https://posthog.com/docs
- React Integration: https://posthog.com/docs/libraries/react
- JS SDK: https://posthog.com/docs/libraries/js

