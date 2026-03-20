# Testing Documentation

> **Last verified**: 2026-03-20

Comprehensive documentation for testing changelogs.directory, with focus on end-to-end (E2E) testing.

## Quick Navigation

| I want to... | Read |
|--------------|------|
| Understand E2E test architecture | [e2e-architecture.md](e2e-architecture.md) |
| Learn about config validation tests | [config-validation.md](config-validation.md) |
| Write browser tests | [browser-tests.md](browser-tests.md) |
| Manage test snapshots | [snapshots.md](snapshots.md) |
| Debug failing tests | [troubleshooting.md](troubleshooting.md) |
| Run unit tests | [../guides/testing.md](../guides/testing.md) |

---

## Test Categories

### Unit Tests

**Purpose**: Test isolated functions and modules.

- **Location**: `tests/lib/`, `tests/trigger/`
- **Runner**: Vitest
- **Documentation**: [guides/testing.md](../guides/testing.md)

```bash
pnpm test              # Run all unit tests
pnpm test --watch      # Watch mode
```

### E2E Tests

**Purpose**: Validate configuration consistency and browser UI flows.

- **Location**: `tests/e2e/`
- **Runners**: Vitest (config) + Playwright (browser)
- **Documentation**: This folder

```bash
pnpm test:e2e:config   # Config validation (fast, no browser)
pnpm test:e2e          # Browser E2E tests (needs database)
pnpm test:e2e:ui       # Playwright UI mode for debugging
```

---

## Commands Quick Reference

| Command | Description | Duration |
|---------|-------------|----------|
| `pnpm test` | Run unit tests | ~5s |
| `pnpm test:e2e:config` | Config validation tests | ~500ms |
| `pnpm test:e2e` | Browser E2E tests | ~30-60s |
| `pnpm test:e2e:ui` | Playwright UI mode | Interactive |
| `pnpm test:e2e:headed` | Browser tests with visible browser | ~60s |
| `pnpm test:all` | All tests (unit + config + browser) | ~90s |

---

## When to Run Which Tests

| Scenario | Command |
|----------|---------|
| Adding a new tool | `pnpm test:e2e:config` (catches missing assets) |
| Modifying UI components | `pnpm test:e2e` (validates rendering) |
| Changing parsers | `pnpm test` (unit tests) |
| Before pushing to main | `pnpm test:all` |
| Debugging browser test | `pnpm test:e2e:ui` |

---

## CI Integration

E2E tests run automatically on every PR via GitHub Actions:

1. **Config Validation** job runs first (fast fail)
2. **Browser Tests** job runs if config passes

See [e2e-architecture.md](e2e-architecture.md#ci-integration) for details.

---

## Further Reading

- [Adding a Tool Guide](../guides/adding-a-tool.md) - Includes E2E validation step
- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
