# Test evidence

Evidence captured for the continuation audit of **TumbuhGuard Standardize** on 2026-10-03. This document records only commands that were actually run in this environment.

## Environment

| Item | Observed |
|---|---|
| Runtime | Node `v22.16.0` |
| Locked target | Node 24 LTS (`>=24 <25`) |
| npm | `10.9.2` |
| Global TypeScript | `5.8.3` |
| Registry | unavailable from this environment (`registry.npmjs.org`; `npm ci` timed out / prior probe returned `EAI_AGAIN`) |
| External anthropometry oracle | not supplied |

Node-24 runtime parity and registry-backed dependency installation are therefore **not verified** here.

## Executed checks

### Dependency-free domain/source gate — PASS

Command:

```bash
node scripts/domain-smoke.mjs
```

The script compiles the actual dependency-free project domain/application/fixture TypeScript with strict flags, then executes assertions. Latest result:

```text
status: PASS
compiled source files: 24
Cadre A precision TEM: 0.07071067811865475
Cadre A reference agreement TEM: 0
Cadre B precision TEM: 1.4849242404917498
Cadre B signed difference: 0
Cadre C precision TEM: 0.07071067811865475
Cadre C reference agreement TEM: 0.848528137423857
Cadre C signed difference: -1.2
Invalid Reference referenceValid: false
Invalid Reference referenceTEM: null
EXTERNAL_ORACLE_PARITY_PENDING
```

The executed assertions additionally cover:

- identical-repeat TEM = 0
- constant 0.2 cm difference TEM ≈ 0.141421356
- raw strict threshold boundaries at 0.6 / 0.8 / 0.4
- a raw TEM of 0.59996 displaying as 0.600 while still passing
- cancellation: signed difference 0 does not imply low disagreement
- subject-order independence
- duplicate subject IDs rejected by the calculation layer
- decimal comma normalization and malformed/range input rejection
- P01–P10 pure protocol/state cases: subject count/composition, duplicate subject/station, provenance, illegal transition, incomplete lock, post-lock edit rejection and blind DTO field exclusion
- P13–P18 pure protocol/state cases: measurer collision, early calculation, invalid-reference suppression, station-change review, protocol snapshot retention and linked re-standardization
- exact 24-month boundary maps to `AT_OR_OVER_24_MONTHS` / `STANDING`
- duplicate measurement submission rejection
- D10 stale-result revision detection
- linked re-standardization creates a new child and leaves the parent unchanged
- active-session service-worker update reloads are deferred
- missing/unknown schema markers with existing records are rejected by pure schema policy
- the public demo seed exactly matches the source fixtures and remains explicitly synthetic
- S04 backup export metadata is explicitly synthetic and SHA-256 verification detects a tampered hash

### Source hygiene — PASS

A dependency-free mirror of `scripts/lint-source.ts` was executed over `src/`, `tests/`, `e2e/`, and `scripts/`:

```text
PASS 77 source/test/script files
```

It checks trailing whitespace, tab characters, `@ts-ignore`, and unsafe `as any` casts. `git diff --check` also passes.

### TypeScript syntax parse — PASS

The globally installed TypeScript parser parsed all TypeScript/TSX files in `src/`, `tests/`, `e2e/`, and `scripts/`:

```text
PASS TypeScript syntax parse 74 TS/TSX files
```

This is a syntax check only. It is **not** a substitute for the project-local `npm run typecheck` gate.

### Static release guard mirror — PASS (non-release subset)

A dependency-free release audit was run against repository files. It verified:

- Node 24 engine lock is declared
- required `typecheck`, `lint`, `test`, `e2e`, and `build` scripts exist
- build metadata contains the external-oracle boundary
- the public demo seed contains exactly four explicit synthetic fixtures
- all visible demo measurements remain at one-decimal precision
- source/public fixture data are synchronized
- no positive banned certification/diagnosis claim appears in runtime source
- no `fetch`, `XMLHttpRequest`, `WebSocket`, or `axios` runtime path exists in `src/`
- safe integrity/blinding/position wording exists in documentation
- required release-audit artifacts exist

Latest result:

```text
staticAudit: PASS
requiredArtifacts: 27
fixtureCount: 4
runtimeNetworkCalls: none found
runtimeRemoteUrls: none found
competitionPiiMediaInputs: none found
unsafePositiveRuntimeClaims: none found
nodeObserved: v22.16.0
lockResolved: false
```

This is deliberately **not** the competition release check. `scripts/release-check.ts` now refuses to pass unless it is executed on Node 24 and the lockfile contains resolved entries for every declared direct dependency. With the current bootstrap lock and Node 22, a release pass is impossible by design.


### RC.3 dependency-free package smoke — PASS

After expanding the pure Tier-A and static audits, the package-level command was executed:

```bash
npm run test:smoke
```

It passed both `scripts/domain-smoke.mjs` and `scripts/static-smoke.mjs`. The domain smoke compiled/executed 24 dependency-free project source files. The static smoke scanned 48 runtime files and 27 required release artifacts. It explicitly reported `lockfileResolved: false`, so this result cannot be confused with the Node-24 competition release gate.

RC.3 build metadata is `tg-2026-10-03-rc.3`.

### Git structural check — PASS before continuation commits

`git fsck --full` passed when the inherited repository was opened. Final Git fsck, bundle verification, ZIP content verification, and fresh extraction checks are recorded again after the continuation commits.

## Authored but not executable in this environment

The deeper Tier-A suite is authored in Vitest/Playwright, including mathematics/input/protocol/persistence/privacy and browser recovery/offline/concurrency/update/accessibility journeys. These release commands are **not claimed as passed** because packages cannot be restored here:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run e2e
npm run build
npm run verify:fixtures
npm run release:check
```

An explicit `timeout 30s npm ci --ignore-scripts --no-audit --no-fund --fetch-retries=0` retry on 2026-10-03 exited `124` while registry access remained unavailable.

The current `package-lock.json` contains only the root dependency declaration and has not been hydrated/validated into a full reproducible dependency graph. Missing resolved entries include React, Dexie, Vite, Zod, Vitest and Playwright. Under Node 24 with registry access, regenerate the complete lock once, commit it, and then use `npm ci` for release validation.

## External-oracle status

Two authoritative golden parity cases (M03/M04) cannot be truthfully completed because the Annex-13/DHS oracle workbook/source material is not present. They remain:

```text
EXTERNAL_ORACLE_PARITY_PENDING
```

The project must not claim exact WHO/DHS formula parity until those cases are verified against the authoritative oracle.

## Gate status

- `gate-v0.0-calculation` — inherited tag; dependency-free calculation evidence remains green, with external oracle parity explicitly pending.
- `gate-v0.1-domain` — inherited tag; dependency-free domain kernel evidence remains green.
- V0.2 through V0.9 — implementation/test coverage has been substantially expanded, but **no new gate tag is created in this environment** because the required npm/Vitest/Playwright/production-build evidence is unavailable.

This is intentionally stricter than treating authored tests as executed tests.

## Git handoff verification

After the continuation implementation commits, the repository was checked with:

```bash
git status --short
git fsck --full
git bundle create tumbuhguard.bundle --all
git bundle verify tumbuhguard.bundle
git tag --list
```

Observed at handoff-audit commit `161f177`:

- working tree: clean (the generated bundle is intentionally ignored)
- `git fsck --full`: PASS
- `git bundle verify tumbuhguard.bundle`: PASS; complete history recorded
- retained verified tags only: `gate-v0.0-calculation`, `gate-v0.1-domain`
- no V0.2+ tag was created without its required browser/npm evidence

The final bundle is regenerated after the evidence commit so the delivered bundle contains the latest repository history.

## Fresh ZIP extraction test

The generated handoff ZIP was extracted into a new directory and tested at source commit `e291581`.

Passed from the extracted copy:

```text
git rev-parse --is-inside-work-tree  -> true
git log --all                       -> full additive history present
git tag                             -> gate-v0.0-calculation, gate-v0.1-domain
git fsck --full                     -> PASS
git bundle verify tumbuhguard.bundle -> PASS, complete history
node scripts/domain-smoke.mjs       -> PASS
```

The required npm release path remains blocked rather than green:

```text
npm ci --ignore-scripts -> timed out waiting for unavailable package registry
npm run typecheck       -> FAIL because React/Dexie/etc. packages/types are not installed
npm run lint            -> FAIL because local tsx is not installed
npm test                -> FAIL because local Vitest is not installed
npm run e2e             -> FAIL because the declared local Playwright package is not installed
npm run build           -> FAIL because project dependencies are not installed
```

Those failures are environmental/dependency-restoration blockers and are **not** reported as application release passes. They must be rerun under Node 24 LTS with registry access and a regenerated complete lockfile before any V0.2+ or competition-release tag is created.

## RC.2 fresh-extraction audit — source commit `961caae`

A handoff ZIP built from the actual repository (including `.git/` and `tumbuhguard.bundle`) was extracted to a fresh directory and inspected on 2026-10-03.

Passed from that extracted copy:

```text
git rev-parse --is-inside-work-tree  -> true
git rev-parse HEAD                   -> 961caae07b2b7f8eb6b9d2ddb8544c865dddafcd
git tag --list                       -> gate-v0.0-calculation, gate-v0.1-domain
git fsck --full                      -> PASS
git bundle verify tumbuhguard.bundle -> PASS, complete history
node scripts/domain-smoke.mjs        -> PASS (23 compiled dependency-free source files)
```

The dependency-backed release path remained blocked, not green:

```text
npm ci (registry-backed)       -> timed out while registry remained unreachable
npm ci --offline              -> ENOTCACHED (@playwright/test not present in cache)
npm run typecheck             -> FAIL: project React/Dexie/Node packages/types not installed
npm run lint                  -> FAIL: local `tsx` not installed
npm test                      -> FAIL: local `vitest` not installed
npm run build                 -> FAIL during TypeScript resolution because dependencies are not installed
npm run e2e                   -> FAIL: declared local Playwright package not installed
```

These are dependency-restoration/runtime blockers. They are not converted into application PASS claims and no V0.2+ tag is created from this audit.

## RC.3 fresh-extraction audit — source commit `db06040`

The RC.3 handoff ZIP was built from the actual repository, including `.git/` and `tumbuhguard.bundle`, then extracted into a new directory and tested on 2026-10-03.

Passed from the extracted copy:

```text
git rev-parse --is-inside-work-tree   -> true
git rev-parse HEAD                    -> db060409f6d34b18e355fb1cd3425aa0b091345c
git tag --list                        -> gate-v0.0-calculation, gate-v0.1-domain
git fsck --full                       -> PASS
git bundle verify tumbuhguard.bundle  -> PASS, complete history
npm run test:smoke                    -> PASS
  domain source files executed        -> 24
  P01-P10, P13-P18 pure cases         -> PASS
  D10 result revision invariant       -> PASS
  S04 synthetic backup/hash           -> PASS
  static runtime files scanned        -> 48
  static required artifacts           -> 27
```

The required dependency-backed release path remained blocked, not green:

```text
npm ci --ignore-scripts --no-audit --no-fund
  -> bounded at 15 seconds; registry still unreachable (exit 124)

npm ci --offline --ignore-scripts --no-audit --no-fund
  -> FAIL ENOTCACHED: @playwright/test is not present in the npm cache

npm run typecheck
  -> FAIL because React/ReactDOM/Node/Dexie package types are not installed

npm test
  -> FAIL because local Vitest is not installed

npm run build
  -> FAIL during TypeScript dependency/type resolution because project packages are not installed
```

These failures are dependency-restoration/runtime blockers and are not converted into gate PASS claims. No V0.2+ tag is created from this audit. Exact Annex-13/DHS parity remains `EXTERNAL_ORACLE_PARITY_PENDING`.
# Position-validity release note

PV01-PV06 verify matching positions, every trainee/reference round mismatch, multiple deviations, and inactive replacement history. The Cadre A attack case retains passing raw metrics but withholds the verdict when position is mismatched.

## Phase 5 — Round-2 structural blinding

Executed on 2026-10-03 under Node `v24.19.0` / npm `10.9.0` after commit `8baff69`.

- `npm run typecheck` — PASS
- `npm run lint` — PASS (`82` source/test files)
- `npm test` — PASS three consecutive times: `19` files, `99` passed, `2` intentional external-oracle skips
- `npm run build` — PASS; PWA generated `dist/sw.js`, Workbox runtime, manifest and local assets

The Round-2 presentation receives an explicit allow-list projection only: `subjectId`, `subjectLabel`, `stationId`, `stationLabel`, and `expectedPosition`. It receives no `Session`, measurement collection, Round-1 value, reference value, result, repository, or database object. Unit coverage verifies DTO keys, DOM/ARIA absence of Round-1 values, and state-transition rejection of entering Round 2 early or reopening Round 1 during Round 2.

Production-preview Playwright coverage was extended for Back, Forward, reload, reopen, and second-tab checks, but this environment's Playwright web-server invocation did not complete within its bounded Windows command transport. Those browser checks remain **BLOCKED**, not passed.
