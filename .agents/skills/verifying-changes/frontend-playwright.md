# Frontend Verification with Playwright MCP

Use Playwright MCP to verify UI changes via browser automation.

## Core Workflow

```
1. Navigate → 2. Snapshot → 3. Interact → 4. Verify
```

### 1. Navigate to Page

```
mcp__playwright__browser_navigate
  url: "http://localhost:5173"
```

**Note**: This project uses port 5173 (Vite default), not 3000.

### 2. Get Page Snapshot

```
mcp__playwright__browser_snapshot
```

Returns accessibility tree with element refs like:
```
- button "View Changelog" [ref=s1e5]
- link "Claude Code" [ref=s1e3]
- heading "Changelogs Directory" [ref=s1e1]
```

### 3. Interact with Elements

Use `ref` values from snapshot:

```
mcp__playwright__browser_type
  element: "Search input"
  ref: "s1e3"
  text: "claude"
  submit: true

mcp__playwright__browser_click
  element: "View button"
  ref: "s1e5"
```

### 4. Verify Results

**Wait for content:**
```
mcp__playwright__browser_wait_for
  text: "Claude Code"
```

**Take screenshot:**
```
mcp__playwright__browser_take_screenshot
  filename: "result.png"
```

## Tool Reference

### Navigation

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `browser_navigate` | Open URL | `url` |
| `browser_navigate_back` | Go back | - |
| `browser_tabs` | Manage tabs | `action`: list/new/close/select |

### Reading Page State

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `browser_snapshot` | Get accessibility tree | `filename` (optional) |
| `browser_take_screenshot` | Visual capture | `filename`, `fullPage`, `element`+`ref` |
| `browser_console_messages` | Get JS console | `level`: error/warning/info/debug |
| `browser_network_requests` | Get API calls | `includeStatic` |

### Interacting

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `browser_click` | Click element | `element`, `ref`, `doubleClick` |
| `browser_type` | Type text | `element`, `ref`, `text`, `submit` |
| `browser_select_option` | Select dropdown | `element`, `ref`, `values` |
| `browser_hover` | Hover element | `element`, `ref` |
| `browser_press_key` | Press key | `key` (e.g., "Enter", "Escape") |
| `browser_drag` | Drag and drop | `startRef`, `endRef` |

### Waiting

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `browser_wait_for` | Wait for condition | `text`, `textGone`, `time` |

### Other

| Tool | Purpose |
|------|---------|
| `browser_close` | Close browser |
| `browser_resize` | Resize window |
| `browser_handle_dialog` | Accept/dismiss dialogs |
| `browser_evaluate` | Run JavaScript |

## Common Patterns

### Verify Page Loads (SSR Check)

```
1. browser_navigate → http://localhost:5173/tools
2. browser_snapshot → check for expected elements (not loading spinners)
3. browser_console_messages → check for JS errors
4. browser_network_requests → verify NO data fetch on initial load (SSR worked)
```

### Verify Tool Page

```
1. browser_navigate → http://localhost:5173/tools/claude-code
2. browser_snapshot → verify tool info displayed
3. browser_wait_for → text: "releases" or release data
4. browser_console_messages → no errors
```

### Verify Navigation Works

```
1. browser_navigate → http://localhost:5173
2. browser_snapshot → get nav link refs
3. browser_click → click "Tools" link
4. browser_wait_for → text: expected page content
5. browser_console_messages → no "DATABASE_URL" errors
```

### Verify Form Submission

```
1. browser_navigate → form page
2. browser_snapshot → get input refs
3. browser_type → fill fields
4. browser_click → submit button
5. browser_wait_for → success message
6. browser_snapshot → verify result
```

### Visual Regression

```
1. browser_navigate → page
2. browser_take_screenshot → filename: "before.png"
3. [make changes]
4. browser_take_screenshot → filename: "after.png"
```

## TanStack Start SSR Verification

### Check SSR is Working

After navigation, SSR pages should:
1. Show content immediately (no loading state)
2. Have NO client-side data fetch in network requests
3. Have data visible in initial HTML (view source)

```
1. browser_navigate → http://localhost:5173/tools
2. browser_network_requests → should see NO /api calls for initial data
3. browser_snapshot → data should already be rendered
```

### Check Client Navigation Works

This catches the "DATABASE_URL not set" error:

```
1. browser_navigate → http://localhost:5173 (home)
2. browser_snapshot → get tools link ref
3. browser_click → click tools link (client-side navigation)
4. browser_wait_for → page content
5. browser_console_messages → should be no errors!
```

If you see "DATABASE_URL environment variable is not set":
- **Cause**: Route imports `getPrisma()` directly
- **Fix**: Move database code to server function in `src/server/`

## Snapshot vs Screenshot

| Use Snapshot When | Use Screenshot When |
|-------------------|---------------------|
| Need to interact with elements | Visual verification only |
| Checking text content | Checking layout/styling |
| Verifying element presence | Documenting appearance |
| Getting element refs for actions | Comparing before/after visuals |

**Prefer snapshot** for most verification—it's faster and provides actionable element refs.

## Tips

- Always get a fresh snapshot after navigation or interactions
- Use `browser_wait_for` before snapshot if content loads async
- Check `browser_console_messages` for JS errors after interactions
- Use `browser_network_requests` to verify API calls were made
- The `element` parameter is human-readable description for logging
- The `ref` parameter is the exact reference from snapshot (e.g., `s1e5`)
- This project uses port **5173** (not 3000)

## Project-Specific Routes to Test

| Route | What to Verify |
|-------|----------------|
| `/` | Home page loads, navigation works |
| `/tools` | Tools list renders, links work |
| `/tools/[slug]` | Tool detail with releases |
| `/tools/[slug]/releases/[version]` | Release detail with changes |
