# TumbuhGuard Standardize

> **A measurement can be consistent and still be wrong.**  
> **Validate the measurer, not just the measurement.**

TumbuhGuard Standardize is an **offline-first protocol runner for practical length/height anthropometry standardization**. It guides supervisors through blinded repeat measurements, qualified-reference comparison, protocol-validity checks, observation evidence, remediation, and re-standardization.

This repository is a **synthetic-data competition prototype for FIK FAIR 2026 · IGNITE**. It is not a child-growth monitoring application and it is not an official certification system.

## Problem

Digitizing a measurement does not prove that the measurement was performed reliably. Anthropometric measurements can be repeatable but systematically different from a qualified reference, inconsistent between repeats, or affected by technique/equipment conditions.

The practical QA problem is therefore not only **what value was recorded**, but **whether the measurer completed a defensible standardization workflow**.

## Solution

TumbuhGuard operationalizes:

**Protocol enforcement + evidence integrity + deterministic measurement QA**

The competition build provides:

- one length/height standardization profile
- 10 synthetic subjects
- one trainee and one qualified reference measurer
- locked Round 1 followed by blinded Round 2
- reference-measurer repeatability validity gate
- deterministic repeatability/agreement mathematics
- station/device/position provenance
- observation evidence
- remediation notes and linked re-standardization
- IndexedDB recovery, CAS stale-write rejection and integrity hashes
- offline-after-warmup PWA operation

## Why it matters

ASIK can digitize the record and Plataran Sehat can digitize learning. TumbuhGuard Standardize is positioned as a **proposed practical measurement-quality assessment workflow between training and downstream record entry**.

It does not claim to replace existing government systems or to have invented TEM/anthropometric standardization.

## How the standardization workflow works

```text
Setup
  ↓
Round 1 measurement
  ↓
Lock Round 1
  ↓
Blinded Round 2
  ↓
Qualified-reference repeats
  ↓
Reference-validity gate
  ↓
Deterministic QA result
  ↓
Evidence review
  ↓
Remediation
  ↓
New linked re-standardization session
```

The application uses an explicit state machine and rejects impossible transitions such as Round 2 before Round 1 lock or calculation before reference completion.

### Workflow blinding

Safe claim:

> The application enforces blinded measurement in the normal assessment workflow: Round-1 values are not exposed to the Round-2 entry interface.

This is workflow blinding, not cryptographic secrecy against a malicious local device owner using unrestricted DevTools.

## Scientific methodology

Repeatability TEM is implemented as:

```text
d_i = x_i1 - x_i2

TEM = sqrt(sum(d_i^2) / (2N))
```

Pairs are matched by subject ID; duplicates and empty inputs are rejected.

The working competition profile uses strict raw-value comparisons:

- trainee repeatability TEM `< 0.6 cm`
- trainee/reference agreement TEM `< 0.8 cm`
- reference measurer repeatability TEM `< 0.4 cm`

Classification never uses rounded display values.

Signed mean difference is descriptive evidence only. Cadre B proves that positive/negative deviations can cancel to a mean near zero while repeatability remains poor. Cadre C proves the headline insight: excellent repeatability can coexist with poor qualified-reference agreement.

### External-oracle boundary

The supplied materials did **not** include the authoritative Annex-13/DHS oracle needed to prove exact reference-agreement parity. Therefore the repository deliberately marks:

```text
EXTERNAL_ORACLE_PARITY_PENDING
```

The working agreement formula must not be described as verified WHO/DHS parity until that external oracle audit is completed.

## What TumbuhGuard does not claim

The competition build does **not** claim:

- Kemenkes certification
- WHO certification of a cadre/measurer
- official Kemenkes certification workflow
- official Kemenkes authorship of the working TEM thresholds
- WHO authorship of this exact UI sequence
- diagnosis, stunting prediction or growth monitoring
- causal attribution of a disagreement to a person/equipment condition without observation evidence
- tamper-proof local storage

Deployment as an official cadre assessment would require programme validation and approval.

## Offline architecture

The core workflow has no runtime healthcare/cloud/API dependency.

After the application has loaded successfully once and its shell is cached, the complete standardization workflow is designed to operate without network connectivity. Workbox precaches the built HTML/JS/CSS, local icon/manifest, synthetic fixtures and help/protocol copy bundled into the application.

Service-worker updates use a prompted flow. A waiting update is **not allowed to force-reload an active assessment**; apply/reload is enabled only at a safe workflow state.

`navigator.storage.persist()` is requested opportunistically. Denial does not block the application.

## Persistence and integrity

Sessions are stored in IndexedDB through Dexie. Writes use revision compare-and-swap semantics:

```text
expected revision == stored revision  → save + increment
expected revision != stored revision  → STALE_REVISION
```

BroadcastChannel is only a duplicate-tab UX warning. Correctness depends on CAS, not the channel.

Stored sessions are Zod-validated and SHA-256 checked before use. This is described as:

> **Application-level revision history with integrity checks.**

It is not protection against a malicious owner of the same local device.

## Privacy

The competition build is **synthetic-only**.

It does not require NIK, real child names, photos, addresses, phone numbers, medical-record identifiers, or any real health information. Exports explicitly contain:

```text
dataMode: SYNTHETIC
synthetic: true
```

No AI is used in the application.

## Demo

The Home screen includes **Run 90-sec Demo**. It loads the deterministic Cadre C case at the final blinded Round-2 entry:

1. enter S10 repeat `95.9 cm`
2. lock Round 2
3. open the reference stage
4. load the explicit synthetic reference fixture
5. lock evidence and calculate
6. show approximately:
   - repeatability TEM `0.071 cm` — PASS
   - reference agreement `0.849 cm` — NEEDS RE-STANDARDIZATION
   - signed difference `-1.200 cm` — descriptive only
7. inspect Measurements / Observation / Equipment / Protocol evidence
8. create a linked re-standardization session

See `docs/demo-script.md` for the judge script.

## Local development

Locked target:

- Node 24 LTS
- TypeScript strict mode
- React 19.x
- Vite 7.x
- Dexie 4.x / IndexedDB
- Zod 4.x
- Vitest 4.x
- Playwright 1.63.x
- vite-plugin-pwa / Workbox

With Node 24 and registry access:

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

## Testing

Tier-A coverage is authored across:

- `tests/unit/` — calculation boundaries and input parsing
- `tests/domain/` — protocol/state/blinding/revision/update rules
- `tests/persistence/` — CAS, integrity, malformed records and schema compatibility
- `tests/claims/` — privacy, synthetic-only and prohibited-claim guards
- `tests/fixtures/` — Cadre A/B/C/Invalid Reference
- `e2e/` — blinding, recovery, two-tab CAS, offline workflow, update safety, demo and mobile/accessibility checks

M03/M04 authoritative external golden fixtures remain intentionally blocked by `EXTERNAL_ORACLE_PARITY_PENDING` rather than fabricated.

## Repository history / release gates

The repository preserves additive Git history. Tags are created only for gates with executed evidence. See:

- `git log --oneline --decorate --graph --all`
- `git tag --list`
- `docs/test-evidence.md`

The existing verified tags are V0.0/V0.1-era tags. Later gates must not be tagged until their required Node 24/npm/browser commands actually pass.

## Limitations

- Exact WHO/UNICEF/DHS Annex-13 reference-agreement parity is pending the authoritative external oracle.
- This environment does not provide the locked Node 24 runtime.
- Registry connectivity is unavailable here, so dependency installation and browser-backed release verification cannot honestly be reported as passed in this environment.
- The current `package-lock.json` remains a bootstrap lock until it can be regenerated/validated with registry access.
- Competition data are synthetic only; real programme deployment requires privacy/security/programme validation beyond this prototype.

## Future work

`POST_HACKATHON`

Only after competition release lock: programme validation, authoritative oracle parity audit, and any official-system integration discussions. No AI, cloud backend, diagnosis, growth monitoring, FHIR/SATUSEHAT/ASIK integration, dashboards or analytics are part of V1.
