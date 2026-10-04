# TumbuhGuard Standardize v1.0.0 release evidence

Release candidate: `v1.0.0` (tag created only after the checks below pass).

## Verified release boundary

- Node `24.19.0`; npm `10.9.0`
- `npm ci`, `npm audit`, typecheck, lint, three consecutive unit suites, and production build
- Unit suite: 20 files, 124 passing tests, 2 intentional external-oracle skips
- Production browser and PWA verification through Playwright 1.63.0 using the Microsoft Edge Chromium channel (managed Playwright Chromium was unavailable)
- H01–H20 final hostile audit: PASS; see `docs/final-hostile-audit.md`
- Fresh-clone verification repeats clean installation, static checks, unit suite, build, browser, and offline/PWA checks
- `git fsck --full` succeeds; harmless dangling temporary trees may be reported
- `git bundle verify tumbuhguard.bundle` confirms complete history after the release tag is present

## Release limitations

- `EXTERNAL_ORACLE_PARITY_PENDING`: exact external DHS/Annex-13 parity is not claimed.
- Rollup tree-shaking remains deliberately disabled because the complete application graph stalls when it is enabled.
- Browser release evidence uses the Microsoft Edge Chromium channel through Playwright.

The final ZIP filename, size, SHA-256 checksum, tagged commit, and extracted-artifact verification are recorded in the final Codex release report for the immutable shipped artifact.
