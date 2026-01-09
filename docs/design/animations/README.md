# Animation Documentation

This directory contains page-by-page animation choreography details for Changelogs.directory.

## Overview

All pages follow the core "Directory" concept with monochrome aesthetics and cinematic transitions. Each document details the animation choreography and UX flow for a specific page.

## Recent Updates

### v0.5.x Navigation System (2026-01-09)
- **Section Navigation**: Mobile floating bar + Desktop sidebar with viewport bracket
- **Version Picker Sheet**: Bottom sheet with fuzzy search and month grouping
- **Collapsible Sections**: Auto-collapse on mobile with progressive rendering

See [release-detail.md](release-detail.md#g-section-navigation-v05x) for full documentation.

## Pages

### Core Pages
- **[homepage.md](homepage.md)** - Landing page transitions and hero animations
- **[tools-index.md](tools-index.md)** - Directory listing animations and filter interactions
- **[tools-detail.md](tools-detail.md)** - Individual tool page animations
- **[release-detail.md](release-detail.md)** - Release page transitions and change displays
- **[analytics.md](analytics.md)** - Analytics page visualizations

## Design Principles

All animations follow these core principles from [design-rules.md](../design-rules.md):

1. **Monochrome** - Black/white/gray palette with subtle gradients
2. **Cinematic** - Slow, deliberate transitions (0.6-0.8s duration)
3. **Glassmorphism** - Subtle backdrop-blur effects
4. **Typography** - Inter (UI) + Fira Code (technical data)
5. **Global Effects** - Noise texture, vignette, subtle animations

## Implementation Notes

Each page document includes:
- **State Machine**: Page load → user interaction → state transitions
- **Animation Timing**: Specific durations and delays (Framer Motion syntax)
- **Mobile Adaptations**: Responsive behavior for small screens
- **Code Examples**: Actual implementation snippets where relevant

## Further Reading

- **[../design-rules.md](../design-rules.md)** - Core design principles
- **[../og-images.md](../og-images.md)** - Open Graph image generation

---

**Last Updated**: 2026-01-09
