# Next Changes

Features and improvements saved for upcoming releases.

---

### Release Summary Component (v0.6.1)

- Implemented `ReleaseSummary` component with responsive design.
  - **Desktop**: Inline `TerminalWindow` showing `README.md` content.
  - **Mobile**: Compact file card trigger + `SummarySheet` native bottom sheet.
- Integrated `SummarySheet` with `SectionNav` pill on mobile (shows `README.md` icon).
- Currently hidden in code (`src/routes/tools/$slug/releases/$version.tsx`) pending `gemini-cli` release.
