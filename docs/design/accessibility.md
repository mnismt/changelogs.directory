# Accessibility Guidelines

## Contrast Requirements

### WCAG 2.1 Level AA Standards

All essential user interface components must meet these minimum contrast ratios:

| Text Size | Minimum Contrast | Example |
|-----------|------------------|---------|
| Normal text (<18px) | 4.5:1 | Labels, metadata, descriptions |
| Large text (≥18px or ≥14px bold) | 3:1 | Headings, tool names |
| UI Components (borders, icons) | 3:1 | Buttons, form inputs |

### Current Color System

On dark background `oklch(0.09 0 0)` (#0A0A0A):

| Color Variable | Value | Hex | Contrast Ratio | Status |
|----------------|-------|-----|----------------|--------|
| `--foreground` | `oklch(1 0 0)` | #FFFFFF | 18.9:1 | ✅ AAA |
| `--muted-foreground` | `oklch(0.65 0 0)` | #A0A0A0 | 5.7:1 | ✅ AA |
| `--border` | `oklch(0.3 0 0)` | #4D4D4D | 2.4:1 | ⚠️ UI only |

### Opacity Modifier Rules

| Modifier | Use Case | Contrast Impact | Allowed For |
|----------|----------|-----------------|-------------|
| Full color (no modifier) | Essential content | Best | Labels, navigation, metadata |
| `/80` | Secondary content | Good | Hover states, less critical info |
| `/70` | Tertiary content | Acceptable | Secondary metadata with context |
| `/60` | Decorative hints | Low | Non-essential visual separators |
| `/50` and below | **Decorative only** | Very low | Separators (`/`, `~`, `•`), ornaments |

### Examples

**✅ Correct Usage**:
```tsx
// Essential label - full contrast
<span className="text-muted-foreground">TOTAL_RELEASES:</span>

// Decorative separator - low contrast allowed
<span className="text-muted-foreground/50">/</span>

// Interactive state - maintains readability
<button className="text-foreground/80 hover:text-foreground">
```

**❌ Incorrect Usage**:
```tsx
// Essential label with too low contrast
<span className="text-muted-foreground/40">TOTAL_RELEASES:</span>

// User guidance text that's hard to read
<p className="text-sm opacity-30">Try adjusting your filters</p>
```

## Testing

### Browser DevTools

1. Inspect element with low contrast
2. Open Styles panel
3. Click color swatch
4. Check "Contrast ratio" in color picker
5. Verify it meets 4.5:1 (or 3:1 for large text)

### Automated Testing

```bash
# Install axe DevTools browser extension
# Or use axe-core in E2E tests (planned)
```

### Manual Verification Checklist

After making design changes:

- [ ] Navigation (header, breadcrumbs, footer links)
- [ ] Form labels and placeholders
- [ ] Button text and states
- [ ] Metadata labels (timestamps, counts, stats)
- [ ] Error messages and empty states
- [ ] Filter controls and section headers

## Exceptions

Purely decorative elements don't require contrast compliance:
- Background patterns and textures
- Visual separators (slashes, dots, lines)
- Glow effects and shadows
- Logo watermarks

## Resources

- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [OKLCH Color Picker](https://oklch.com/)
