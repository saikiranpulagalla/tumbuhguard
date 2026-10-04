# TumbuhGuard Standardize v1.0.1

## Verified release

- Release: `v1.0.1`
- Release commit: `ad4b31a39087c43952032340f6cafc8de4278dc0`
- Node: `24.19.0`
- `npm audit`: 0 vulnerabilities

## Verification evidence

- Unit: 22 files; 129 passed; 2 intentional external-oracle skips; 3/3 stability PASS
- Browser: 36 passed; 0 failed; 0 skipped; Microsoft Edge Chromium; 1 worker; 0 retries
- Offline/PWA: O01–O10 PASS
- Fresh clone: PASS
- `npm run check`: PASS
- `npm run verify:fixtures`: PASS
- `npm run release:check`: PASS
- `git fsck --full`: PASS (only pre-existing dangling temporary trees)

## Known limitations

- `EXTERNAL_ORACLE_PARITY_PENDING`: exact independent DHS/Annex-13 oracle parity remains pending.
- Corrupt historical-record isolation is an accepted fail-closed P2 limitation.
- Reference-entry DTO narrowing is accepted hardening P2 work.
- Playwright-managed Chromium was unavailable in the verification environment; Microsoft Edge Chromium completed the browser suite successfully.
