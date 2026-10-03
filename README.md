# TumbuhGuard Standardize

> **A measurement can be consistent and still be wrong.**  
> Validate the measurer, not just the measurement.

TumbuhGuard Standardize is an offline-first protocol runner for practical length/height anthropometry standardization. It guides supervisors through blinded repeat measurements, qualified-reference comparison, protocol-validity checks, observation evidence, remediation, and re-standardization.

This repository is a **synthetic-data competition prototype for FIK FAIR 2026 · IGNITE**. It is not a child-growth monitoring application and it is not an official Kemenkes or WHO certification system.

## Why it exists

Digital records can preserve a measurement without proving the measurement was performed reliably. TumbuhGuard focuses on the practical QA layer between training and record entry:

**protocol enforcement + evidence integrity + deterministic measurement QA**

Excel can calculate a result. TumbuhGuard manages whether the result was produced through a valid assessment workflow.

## Competition scope

Included:

- length/height only
- one trainee + one qualified reference measurer
- 10 deterministic synthetic subjects
- blinded Round-2 workflow
- trainee repeatability TEM
- reference repeatability validity gate
- working trainee/reference agreement calculation
- signed mean difference as descriptive evidence
- station/device provenance
- observed-skill evidence
- remediation state
- revision CAS / stale-write prevention
- IndexedDB persistence
- JSON export with SHA-256 consistency hash
- PWA cache configuration for offline-after-warmup operation

Explicitly out of scope: AI/LLMs, computer vision, cloud backend, authentication, real child data, diagnosis, growth monitoring, Z-scores, FHIR/SATUSEHAT/ASIK integration, dashboards, gamification, and analytics.

## Scientific boundary

The repeatability formula is implemented as:

```text
TEM = sqrt(sum(d_i^2) / (2N))
```

The current working reference-agreement calculation uses quadratic differences between trainee/reference subject means. Exact parity with an authoritative WHO/UNICEF/DHS Annex-13 oracle was **not verifiable from supplied materials in this build environment**.

Therefore the repository marks:

```text
EXTERNAL_ORACLE_PARITY_PENDING
```

Do not describe the working agreement formula as proven WHO/DHS oracle parity until that audit is completed.

Working strict thresholds (raw values, never rounded values):

- trainee repeatability TEM `< 0.6 cm`
- reference agreement TEM `< 0.8 cm`
- reference measurer repeatability TEM `< 0.4 cm`

## Locked runtime target

- Node 24 LTS
- React 19.x
- Vite 7.x
- TypeScript strict mode
- Dexie 4.x / IndexedDB
- Zod 4.x
- Vitest 4.x
- Playwright 1.63.x
- vite-plugin-pwa / Workbox

## Run

With Node 24 LTS and npm registry access:

```bash
npm ci
npm run check
npm run dev
```

For browser E2E:

```bash
npm run test:e2e
```

### Build-environment note

The environment used to assemble this repository provided Node `22.16.0` and had no network path to `registry.npmjs.org` (`EAI_AGAIN`). I therefore **do not claim** that `npm ci`, Vite build, Vitest, or Playwright passed here. The committed lockfile is a bootstrap manifest and must be regenerated once with registry access before it becomes the reproducible release lock. See `docs/test-evidence.md` for exactly what was and was not executed.

## State machine

```text
DRAFT
  ↓
SETUP_VALID
  ↓
ROUND1_OPEN → ROUND1_LOCKED
  ↓
ROUND2_OPEN → ROUND2_LOCKED
  ↓
REFERENCE_OPEN → REFERENCE_LOCKED
  ↓
READY_TO_CALCULATE
  ↓
RESULT_VALID
  ↓
REMEDIATION
  ↓
CLOSED
```

Re-standardization creates a **new** session linked with `parentSessionId`. Closed historical sessions are not reopened.

## Integrity model

Correctness does not depend on `BroadcastChannel`. Every persisted session write uses revision compare-and-swap semantics. A stale writer receives `STALE_REVISION`.

SHA-256 is used for accidental-corruption/consistency verification and export integrity. This is **not tamper-proof storage** against a malicious local device owner.

## Round-2 blinding claim

The safe claim is:

> The application enforces blinded measurement in the normal assessment workflow: Round-1 values are not exposed to the Round-2 entry interface.

This is workflow blinding, not cryptographic secrecy against unrestricted DevTools access.

## Repository guide

- `src/domain/calculation/` — pure TypeScript math, independent of UI/storage/browser APIs
- `src/domain/protocol/` — working profile, invariants, evaluator, claim metadata
- `src/domain/session/` — state machine and blind DTO selectors
- `src/data/` — Dexie persistence, CAS repository, export integrity
- `src/features/` — narrow workflow UI
- `src/fixtures/` — deterministic synthetic demo
- `tests/` — unit/domain/persistence/claim tests
- `e2e/` — Playwright acceptance specifications
- `docs/` — scientific boundary, claims, demo script, judge Q&A, test evidence

## POST_HACKATHON

Anything outside the locked competition scope belongs here rather than in V0.9. No post-hackathon features are implemented in this repository.
