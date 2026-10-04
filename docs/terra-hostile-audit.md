# TUMBUHGUARD TERRA AUDIT

Audit date: 2026-10-03 (Asia/Calcutta). Scope: hostile first-pass audit only; no product-code, dependency, fixture, or test changes were made.

## 1. Executive verdict

**NOT RELEASE-CANDIDATE.** The domain design is materially stronger than the release artefact, but Vite/TypeScript/browser verification is not reproducible. The committed `package-lock.json` is a bootstrap lock containing only its root package; Node `v23.3.0` does not satisfy the declared `>=24 <25` engine; and `tsc -b` reports project-reference (`TS6307`) errors independent of missing third-party types. Exact Annex-13/DHS reference-agreement parity remains `EXTERNAL_ORACLE_PARITY_PENDING` and was not claimed as verified.

Highest verified gate: **V0.1 domain kernel, qualified only for static/source inspection**. The current environment could not execute the dependency-backed domain, persistence, browser, PWA, or accessibility suites. The dependency-free `domain-smoke` command itself failed in this environment, so the previous report's executable-domain claim was not reproduced.

Finding counts: **P0 3; P1 4; P2 5; P3 2.** Findings are sorted by severity then scientific/data/blinding/release impact. `BLOCKED` means no claim of pass was made.

## Findings

### TG-P0-001

**Severity:** P0  
**Category:** Release engineering / reproducibility  
**Files:** `package-lock.json`, `package.json`, `scripts/static-smoke.mjs`  
**Exact code/path:** `package-lock.json` has only `packages[""]`; it has no `packages["node_modules/<direct dependency>"]` records.  
**Failure scenario:** A clean judge or CI machine runs `npm ci`.  
**Why this matters:** There is no committed dependency graph or integrity metadata; the build is not reproducible and cannot be a release artefact.  
**How to reproduce:** `Get-Content package-lock.json`; `node scripts/static-smoke.mjs` reports all 18 direct dependencies unresolved. `npm ci --foreground-scripts --loglevel verbose` attempted registry fetches.  
**Expected behavior:** A full v3 lockfile permits deterministic `npm ci` without modifying the lock.  
**Actual behavior:** Lock is 922 bytes and bootstrap-only. Registry DNS is also unavailable here (`ENOTFOUND registry.npmjs.org`), preventing recovery validation.  
**Root cause:** Lockfile was committed before dependency resolution completed.  
**Recommended fix:** On Node 24 with registry access, regenerate the lock intentionally, review the complete diff, commit it, then run `npm ci` from a clean directory.  
**Regression test:** CI must fail if any declared direct dependency lacks a lock package entry and must run clean `npm ci`.  
**Hackathon impact:** A fresh laptop cannot be trusted to build or demo the submission.  
**Confidence:** Confirmed.

### TG-P0-002

**Severity:** P0  
**Category:** Build/configuration  
**Files:** `tsconfig.node.json`, `scripts/create-demo-seed.ts`, `scripts/release-check.ts`, imports under `src/`  
**Exact code/path:** `tsconfig.node.json` sets `composite: true` and includes only config files and `scripts`, while scripts import non-listed source files.  
**Failure scenario:** Dependencies are restored and `npm run typecheck` or `npm run build` runs.  
**Why this matters:** TypeScript project builds remain blocked even if packages install.  
**How to reproduce:** `npm run typecheck` emitted `TS6307` for `scripts/create-demo-seed.ts -> src/fixtures/demo.ts`, `scripts/release-check.ts -> src/app/build-info.ts`, and transitive domain modules.  
**Expected behavior:** Every imported file in a composite project is included through `files`/`include` or supplied by a referenced project.  
**Actual behavior:** The node project compiles scripts but imports files outside its file list.  
**Root cause:** Invalid TypeScript project-boundary configuration.  
**Recommended fix:** Define a proper project reference boundary (normally app project referenced by node project), or adjust the node project's included files/architecture so imports satisfy composite rules; verify with a clean Node-24 build.  
**Regression test:** `tsc -b --pretty false` in fresh CI, followed by `vite build`.  
**Hackathon impact:** Production bundle cannot currently be certified buildable.  
**Confidence:** Confirmed.

### TG-P0-003

**Severity:** P0  
**Category:** Scientific release gate  
**Files:** `src/domain/calculation/agreement.ts`, `docs/claims-matrix.md`, `src/features/results/ResultsPanel.tsx`  
**Exact code/path:** `referenceAgreementTEM()` labels itself a project working formula and carries `EXTERNAL_ORACLE_PARITY_PENDING`.  
**Failure scenario:** A judge asks whether the reference-agreement result is exact WHO/DHS Annex-13 parity.  
**Why this matters:** The calculation can be internally consistent yet not match the external standard it is compared against.  
**How to reproduce:** Search `rg EXTERNAL_ORACLE_PARITY_PENDING`; no authoritative workbook, oracle output, or comparison fixture exists.  
**Expected behavior:** Authoritative outputs must be supplied and compared before parity is claimed.  
**Actual behavior:** The app correctly warns that parity is pending; two math tests are deliberately skipped.  
**Root cause:** Required external oracle has not been provided.  
**Recommended fix:** Obtain the authoritative permitted oracle, document version/provenance, add independent golden inputs/outputs and boundary comparisons; do not remove the marker beforehand.  
**Regression test:** Authoritative fixtures M03/M04 running separately from implementation-derived expectations.  
**Hackathon impact:** The product may be demoed only as a conservative working competition profile, not scientific parity.  
**Confidence:** Confirmed.

### TG-P1-001

**Severity:** P1  
**Category:** Protocol validity / scientific conservatism  
**Files:** `src/domain/protocol/invariants.ts`, `src/domain/session/transition.ts`, `src/features/round-one/RoundPanel.tsx`, `src/features/reference/ReferencePanel.tsx`  
**Exact code/path:** `assertMeasurementProvenance()` validates subject/station/device links but never requires `candidate.position === station.expectedPosition`; both entry UIs permit selecting either position.  
**Failure scenario:** A standing reading is recorded for a recumbent subject (or conversely), all rounds complete, and a numerical pass is produced.  
**Why this matters:** Position changes length/height semantics; showing only a post-hoc “POSITION DEVIATION” evidence flag can permit a protocol-invalid quantitative verdict.  
**How to reproduce:** Submit the non-default position in any entry row; transition accepts it and `evaluateStandardization()` uses its raw value unchanged.  
**Expected behavior:** The profile must explicitly choose either hard rejection, a calculation/result-withheld state, or a prominently gated supervisor override; no silent normal PASS.  
**Actual behavior:** Deviation is merely counted in remediation/evidence after calculation.  
**Root cause:** Position provenance is modelled as descriptive evidence rather than a calculation-validity precondition.  
**Recommended fix:** Establish product policy, enforce it at the domain boundary, and add result-level tests for mixed-position data.  
**Regression test:** A deliberate mismatch cannot produce a normal PASS/REFERENCE PASS verdict.  
**Hackathon impact:** A scientifically literate judge can demonstrate an invalid measurement being scored.  
**Confidence:** Confirmed behavior; required policy choice is product/scientific governance.

### TG-P1-002

**Severity:** P1  
**Category:** Test/release evidence  
**Files:** `scripts/domain-smoke.mjs`, `docs/test-evidence.md`  
**Exact code/path:** failure handler calls `process.stderr.write(compile.stdout)`/`compile.stderr` without handling absent values.  
**Failure scenario:** The spawned compiler cannot run or supplies no captured stream.  
**Why this matters:** The supposed dependency-free audit command crashes with `ERR_INVALID_ARG_TYPE`, obscuring the real compile failure and invalidating a key evidence route in this environment.  
**How to reproduce:** `node scripts/domain-smoke.mjs` under observed Node 23.3.0 fails at line 22 with chunk `undefined`.  
**Expected behavior:** Audit script should print a determinate compiler failure and exit cleanly.  
**Actual behavior:** It throws a secondary Node stream error.  
**Root cause:** Unsafe write of optional `spawnSync` output.  
**Recommended fix:** Safely stringify/default stdout/stderr and explicitly handle `compile.error`; run it under Node 24 after correcting TypeScript configuration.  
**Regression test:** Mock/no-compiler case and successful clean Node-24 invocation.  
**Hackathon impact:** Existing claims of executed dependency-free coverage cannot be revalidated here.  
**Confidence:** Confirmed.

### TG-P1-003

**Severity:** P1  
**Category:** Offline/PWA verification  
**Files:** `vite.config.ts`, `e2e/offline.spec.ts`, `e2e/update.spec.ts`  
**Exact code/path:** Workbox is authored with `registerType: 'prompt'`, precache patterns, and fallback, but no production build or browser test executed.  
**Failure scenario:** First load/cache/update behavior differs from authored Playwright assumptions on a demo device.  
**Why this matters:** “Offline after warm cache” is a protected product claim and a demo differentiator.  
**How to reproduce:** `npm run build` and `npm run e2e` cannot run because dependencies are unresolved; no generated service worker exists to inspect.  
**Expected behavior:** A Node-24 production build plus Chromium warm-cache/offline/update test passes.  
**Actual behavior:** Static scan found no app runtime fetch/XHR/WebSocket path, but that is not PWA execution evidence.  
**Root cause:** Release dependency/build failure.  
**Recommended fix:** Repair P0-001/P0-002, execute PWA E2E against the generated build, and retain artifacts/traces.  
**Regression test:** Existing offline/update specs plus a cache-version update scenario.  
**Hackathon impact:** Offline claim is presently unverified.  
**Confidence:** Confirmed verification gap, not a confirmed runtime bug.

### TG-P1-004

**Severity:** P1  
**Category:** Routing / bypass-test quality  
**Files:** `src/app/routes.ts`, `src/App.tsx`, `e2e/blinded-round.spec.ts`  
**Exact code/path:** `ROUTE_MODEL` declares only `/` and `/session`, but `App` is state-rendered and does not read routing state. The blinding E2E uses a hash history probe, not a direct `/round2`, `/results`, or browser-forward route.  
**Failure scenario:** A judge deep-links to a claimed route or tests browser navigation expecting route guards.  
**Why this matters:** Documentation/audit claims about direct route access are not supported by an implemented router or an actual route-guard test.  
**How to reproduce:** Inspect `src/app/routes.ts`, `App.tsx`, and `e2e/blinded-round.spec.ts`; no router/deep-route test exists.  
**Expected behavior:** Either remove route-based claims and test the state-rendered app honestly, or implement guarded routes and test them.  
**Actual behavior:** No direct-route workflow exists.  
**Root cause:** Route model is dead/unfinished scaffolding.  
**Recommended fix:** Clarify product navigation model; if routes are retained, add domain-backed guard tests.  
**Regression test:** Direct URLs across every forbidden state.  
**Hackathon impact:** A hostile navigation demonstration exposes a mismatch between claimed and implemented controls.  
**Confidence:** Confirmed.

### TG-P2-001

**Severity:** P2  
**Category:** Accessibility  
**Files:** `src/features/results/ResultsPanel.tsx`  
**Failure scenario:** Keyboard user switches evidence tabs and a screen reader cannot associate a tab with its panel.  
**Actual behavior:** Tabs have `role=tab` but no `id`, `aria-controls`, panel `aria-labelledby`, roving tabindex, or keyboard arrow handling.  
**Recommended fix:** Implement the tab ARIA pattern or use semantic buttons without tab roles.  
**Regression test:** Keyboard and accessibility-tree assertions.  
**Confidence:** Confirmed by source inspection.

### TG-P2-002

**Severity:** P2  
**Category:** Input test coverage  
**Files:** `src/domain/schemas/measurement-input.ts`, `tests/unit/input-tier-a.test.ts`  
**Failure scenario:** Accept/reject behavior for whitespace, leading zeroes, `80.`, `.2`, exponent, plus sign, and partial numeric suffixes regresses unseen.  
**Actual behavior:** Parser is conservative and source review indicates it rejects partial parses, but the specified matrix is only partly tested and did not execute.  
**Recommended fix:** Table-drive the full specified corpus, including `-0`, precision and copy/paste cases.  
**Confidence:** Confirmed coverage gap.

### TG-P2-003

**Severity:** P2  
**Category:** Persistence/import-export  
**Files:** `src/data/export/session-export.ts`, `src/App.tsx`  
**Failure scenario:** Operator expects JSON backup to be importable/recoverable.  
**Actual behavior:** Export and checksum verification exist, but there is no import feature or import validation path; therefore import attack requirements are not applicable/implemented, not passed.  
**Recommended fix:** Document export-only status prominently; if import is later added, validate schema/hash/calculation anew.  
**Confidence:** Confirmed.

### TG-P2-004

**Severity:** P2  
**Category:** State integrity/test quality  
**Files:** `src/data/validation.ts`, `tests/persistence/integrity.test.ts`  
**Failure scenario:** A locally modified record has a recomputed integrity hash but a result that does not derive from its measurements.  
**Actual behavior:** Cross-field rules validate shape, revision, and reference-field consistency, but do not recompute stored results from measurements. SHA-256 is correctly not security against the local owner.  
**Recommended fix:** On load, recompute or mark result unverifiable when result-bearing session data are internally inconsistent; preserve the stated trusted-local threat model.  
**Confidence:** Confirmed design limitation; malicious-local-owner protection is explicitly out of scope.

### TG-P2-005

**Severity:** P2  
**Category:** Reset/concurrency coverage  
**Files:** `src/App.tsx`, `e2e/hostile.spec.ts`  
**Failure scenario:** Reset happens while a second tab displays an active session.  
**Actual behavior:** Reset deletes/reopens the database and broadcasts a generic notification, but only a single-tab reset/reload test is authored. Whether a stale tab has uncommitted form text, fails its next write, and presents recovery safely is unexecuted.  
**Recommended fix:** Add two-tab reset test and explicit remote-reset reload/recovery behavior.  
**Confidence:** Confirmed coverage gap.

### TG-P3-001

**Severity:** P3  
**Category:** Supply chain  
**Files:** `package.json`  
**Actual behavior:** Exact versions avoid range drift, and no postinstall script is declared, but the unresolved lock prevents transitive dependency and integrity review.  
**Recommended fix:** Re-audit package tree after P0-001.  
**Confidence:** Confirmed limitation.

### TG-P3-002

**Severity:** P3  
**Category:** Responsive verification  
**Files:** `src/styles/global.css`, `e2e/accessibility.spec.ts`  
**Actual behavior:** CSS has 800px/520px breakpoints and 44px controls, but only an authored 390px overflow test exists; the requested 320/360/412/768/1024/1440 matrix did not execute.  
**Recommended fix:** Run the matrix after build recovery.  
**Confidence:** Confirmed coverage gap.

## 2. Repository/Git integrity

`HEAD` is exactly `0cd1346daf626741b9bd61b235e5b1b375217f26` on `main`. Expected commits (`071b17c`, `0d526e0`, `961caae`, `d435470`, `63ec67b`, `db06040`, `0cd1346`) exist with matching summaries. Tags `gate-v0.0-calculation` and `gate-v0.1-domain` exist. `git fsck --full` passed. `git bundle verify tumbuhguard.bundle` passed and reports complete history; the bundle is intentionally ignored by `.gitignore` but present in this checkout. No repository corruption found.

## 3. Build/reproducibility

Observed Node is `v23.3.0`; required is Node 24 (`>=24 <25`). npm is `10.9.0`. `npm ci` was attempted and registry DNS returned `ENOTFOUND`; independently, static inspection proves the lock has no resolved package entries. Typecheck failed from missing packages/types and confirmed `TS6307` configuration defects. Lint, unit, build, fixture script, release check and E2E are **BLOCKED** by unresolved dependencies; E2E also depends on a successful production build. `node scripts/static-smoke.mjs` passed and correctly reports the unresolved lock. `node scripts/domain-smoke.mjs` failed with a secondary stream error.

## 4. Scientific calculation

Source review confirms repeatability TEM uses `sqrt(sum(d²)/(2N))`, raw strict `<` thresholds, finite/positive inputs, duplicate IDs rejected, and raw values retained for classification. Fixture source calculates A/B/C/invalid-reference expected values, but fixture execution was blocked. ID pairing in `buildEvaluation()` is by active subject identity, so subject-array order does not determine pairs. The working agreement formula remains an external-oracle blocker (TG-P0-003). Position mismatch validity is the scientific policy weakness (TG-P1-001).

## 5. State machine

The transition allow-list rejects the listed illegal transitions and locks require complete active-subject rounds. `SET_RESULT` enforces its next revision. Domain errors are typed for normal workflow. Direct event calls from a compromised local owner remain out of scope, but persisted records are shape/cross-field validated. There is no real route state machine; see TG-P1-004.

## 6. Blinding

Round 2 receives `selectBlindRoundSubjects()` DTOs containing only subject/station/expected position. `RoundPanel` receives `session` too, so structural isolation is not TypeScript-enforced at component boundary, but the Round-2 rendered path does not pass/display R1 values by inspection. R1 is present in browser-resident IndexedDB/application state, as honestly documented; this is normal-workflow blinding, not secrecy. Browser Back/reload/direct-route attack evidence is authored but unexecuted; the test does not cover direct routes because none exist.

## 7. Input validation

Parser accepts unambiguous decimal dot/comma and requires digits before an optional fractional part. It rejects signs, exponent notation, partial numeric strings, `NaN`, `Infinity`, multiple/mixed separators, non-positive values and values outside 30–220 cm. UI uses `inputMode=decimal`, labels/errors, and domain repeat uniqueness prevents duplicate recording. Full corpus/mobile/Enter/blur execution remains absent (TG-P2-002).

## 8. Reference validity

Reference repeatability uses the same TEM formula and strict `<0.4`; invalid reference sets agreement TEM, signed difference and reference verdict to `null`. Results UI withholds agreement. Stored validation rejects contradictory invalid-reference fields. This behavior is well designed but unexecuted here.

## 9. Result staleness

Currentness is `result.inputRevision === session.revision`. Measurement writes null results. Observation/remediation/close deliberately advance a valid result's input revision because they are non-calculation fields; this is a defensible declared policy. Persisted result equality is validated. No live stale-result navigation or multi-tab test ran.

## 10. Persistence

Dexie v1 schema has `sessions`, `audit`, and `meta`. Reads use Zod validation, SHA-256 of stable-key JSON, protocol-hash validation, cross-field integrity, and reject unknown/missing application schema markers when records exist. Physical future IndexedDB `VersionError` is mapped to incompatibility. No migration exists because only schema v1 exists. Browser IndexedDB tests are blocked.

## 11. CAS/concurrency

`saveCAS` checks persisted revision inside a read-write Dexie transaction and audit/session writes share that transaction. It hashes outside the transaction to avoid Web Crypto transaction auto-close. `createLinkedCAS` links a child only with current remediation parent revision. BroadcastChannel is correctly UX-only. Two-page CAS tests are authored but unexecuted. Reset/fast-demo deletion lacks the same CAS boundary and requires the focused coverage in TG-P2-005.

## 12. Protocol snapshot integrity

Every session stores a full profile snapshot/hash/version; repository verifies hash on create/read/list/save. Snapshot hash covers all profile fields through stable serialization. Changing a global object cannot alter stored snapshot. Logical profile validation is schema-level positive/finiteness rather than source-authoritative parity, which is appropriate only for the working profile boundary.

## 13. Subject replacement

Replacement is only allowed before R1 lock; old subject becomes `REPLACED`, its station/history remain, a new station is created, result is invalidated, and revision advances. Source supports the desired provenance behavior. UI offers no replacement workflow, so this is domain capability rather than user-facing product functionality. No browser test ran.

## 14. Equipment/station provenance

Each measurement carries station and position; station references device/subject; store validation checks these links. Station reassignment after a measurement is rejected. There is no automatic conversion. Position deviation is merely flagged, creating the P1 policy concern.

## 15. Re-standardization lineage

New child sessions copy active cohort/protocol/device/stations, begin in DRAFT, retain `parentSessionId`, and clear measurements/results. Linked creation uses parent CAS and does not mutate parent. Idempotency under double click is not guaranteed by a unique parent-child constraint, although button state generally changes only after async completion; add a double-click test/guard after release restoration.

## 16. Offline/PWA

Manifest, local SVG, prompt registration, Workbox glob, navigation fallback and static no-network scan are present. Actual generated precache, warm-cache reload, offline workflow and browser storage persistence are not verified: **BLOCKED** (TG-P1-003).

## 17. Service-worker update safety

`registerType: 'prompt'` is used. Updates are disabled in all active protocol states and only permitted DRAFT/CLOSED. No `skipWaiting` is invoked in app code. The waiting-update browser scenario is authored, unexecuted.

## 18. Reset/recovery

Reset physically deletes then reopens the DB and seeds deterministically; this is deliberately safer for unknown physical schema states. Single-tab reset/reload test is authored. Second-tab, mid-reset, update-waiting and offline behavior are unexecuted (TG-P2-005).

## 19. Privacy

Runtime static scan passed: no feature file/camera/photo/NIK/real child name requirements and synthetic export fields are explicit. Labels are synthetic. No actual export download/browser verification ran.

## 20. Claims/scientific language

Runtime static scan passed with no unsafe positive Kemenkes/WHO certification, diagnosis, AI diagnosis or external URL claims. README and UI visibly preserve synthetic-only, non-certification and oracle-pending boundaries. “WHO/UNICEF-aligned” remains contextual language and must retain the visible working-profile caveat.

## 21. Security/integrity

React rendering avoids explicit `innerHTML`; no import route exists; no localStorage/network endpoints found. SHA-256 supports accidental corruption detection and is not portrayed as malicious-owner tamper-proof. Result recomputation is not performed on storage read (TG-P2-004). No giant-input quota limit exists for local notes, but scope/data scale is small.

## 22. Import/export

Export-only JSON backup has version, synthetic fields and SHA-256 verification helper. There is no import UI/service; import attack claims cannot be marked passed (TG-P2-003).

## 23. Accessibility

Inputs have labels, errors use alert/describedby, focus-visible styles exist, controls have 44px minimums, and status areas use live/status roles. Evidence tabs misuse incomplete tab semantics (TG-P2-001). Dialog focus behavior is not applicable because there are no dialogs. Full automated/manual accessibility execution is blocked.

## 24. Mobile/responsive behavior

CSS starts at `min-width:320px`, has responsive 800/520 layouts, sticky actions and mobile controls. Only authored 390px coverage exists; requested dimensions were not browser-tested (TG-P3-002).

## 25. Test-quality audit

Tests cover important pure formulas and invariants, but are not execution evidence today. M03/M04 are intentionally skipped and correctly labelled. Some tests assert implementation-adjacent DTO fields or fixture output, so they do not replace independent authoritative tests. E2E tests are credible authored scenarios but cannot execute until clean build. No `.only` found; two `.skip` tests are intentional external-oracle placeholders.

## 26. Demo reliability

Cadre C source values match intended numerical fixture by code inspection; the demo starts in R2 with S10 pending, keeps R1 unavailable in normal UI, offers reference fixture, result evidence and lineage. The exact rehearsal is **BLOCKED** by build/dependency failures. Do not demo offline claim on an unverified clean device.

## 27. Judge attack review

Defensible now: explicit state transitions, R2 UI blinding, reference-invalid withholding, synthetic-only/no-diagnosis/no-certification language, and working-profile/oracle honesty. Vulnerable answers: no verified fresh build, no verified offline proof, no authoritative agreement parity, position mismatch can still calculate, and no actual routes despite route-based claims. Differentiation beyond Excel is visible in state/CAS/provenance design, not currently release-proven.

## 28. Tier-A coverage matrix

Legend: PASS requires current execution; BLOCKED means dependencies/environment prevented run; NOT IMPLEMENTED means no product path; WEAK TEST means authored coverage does not fully establish the requirement.

| ID | Requirement | Existing Test | Test Quality | Executed | Pass/Fail | Evidence | Missing Work |
|---|---|---|---|---|---|---|---|
| M01 | TEM zero | unit + smoke | good | no | BLOCKED | formula inspected | rerun |
| M02 | 0.2 TEM | unit + smoke | good | no | BLOCKED | formula inspected | rerun |
| M03 | authoritative A | skipped | intentional blocker | no | BLOCKED | oracle absent | oracle |
| M04 | authoritative B | skipped | intentional blocker | no | BLOCKED | oracle absent | oracle |
| M05 | .599999 pass | unit | good | no | BLOCKED | strict `<` source | rerun |
| M06 | .600 fail | unit | good | no | BLOCKED | strict `<` source | rerun |
| M07 | .799999 pass | unit | good | no | BLOCKED | strict `<` source | rerun |
| M08 | .800 fail | unit | good | no | BLOCKED | strict `<` source | rerun |
| M09 | .399999 valid | unit | good | no | BLOCKED | strict `<` source | rerun |
| M10 | .400 invalid | unit | good | no | BLOCKED | strict `<` source | rerun |
| M11 | cancellation | unit | good | no | BLOCKED | separate bias/agreement source | rerun |
| M12 | systematic disagreement | fixture | implementation-adjacent | no | BLOCKED | fixture source | independent data |
| M13 | rounding trap | unit | good | no | BLOCKED | raw threshold source | rerun |
| M14 | subject order | unit | moderate | no | BLOCKED | identity mapping source | cross-array test |
| M15 | duplicate ID | unit | good | no | BLOCKED | validation source | rerun |
| M16 | missing input | unit | good | no | BLOCKED | validation source | rerun |
| P01 | 9 reject | domain | good | no | BLOCKED | invariant source | rerun |
| P02 | 10 accept | domain | good | no | BLOCKED | invariant source | rerun |
| P03 | composition | domain | good | no | BLOCKED | invariant source | rerun |
| P04 | duplicate subject | domain | good | no | BLOCKED | invariant source | rerun |
| P05 | duplicate station | domain | good | no | BLOCKED | invariant source | rerun |
| P06 | provenance | domain | good | no | BLOCKED | invariant source | rerun |
| P07 | R2 early reject | domain | good | no | BLOCKED | allow-list | rerun |
| P08 | incomplete lock | domain | good | no | BLOCKED | completeness source | rerun |
| P09 | post-lock edit | domain | good | no | BLOCKED | allow-list | rerun |
| P10 | blind DTO | domain | moderate | no | BLOCKED | selector inspected | component structural test |
| P11 | Back blinding | E2E | moderate | no | BLOCKED | authored only | run |
| P12 | direct route blinding | none | absent | no | NOT IMPLEMENTED | no router | clarify/add guard |
| P13 | role collision | domain | good | no | BLOCKED | invariant source | rerun |
| P14 | early calculate | domain | good | no | BLOCKED | workflow source | rerun |
| P15 | invalid ref withheld | fixture/domain | good | no | BLOCKED | evaluator source | rerun |
| P16 | station review | domain | good | no | BLOCKED | invariant source | rerun |
| P17 | snapshot retained | domain | weak | no | WEAK TEST | object-copy assertion | persisted test |
| P18 | new lineage | domain/CAS | moderate | no | BLOCKED | source inspected | double click |
| I01 | integer | unit | partial | no | BLOCKED | parser source | corpus |
| I02 | decimal dot | unit | partial | no | BLOCKED | parser source | corpus |
| I03 | decimal comma | unit | partial | no | BLOCKED | parser source | corpus |
| I04 | whitespace/zero pad | none | absent | no | NOT IMPLEMENTED | parser accepts trim/zero | test |
| I05 | signs/partials | partial unit | weak | no | WEAK TEST | regex source | corpus |
| I06 | nonpositive | unit | partial | no | BLOCKED | parser source | rerun |
| I07 | NaN/Infinity | unit | partial | no | BLOCKED | parser source | rerun |
| I08 | exponent/mixed | partial unit | weak | no | WEAK TEST | regex source | corpus |
| I09 | range | unit | good | no | BLOCKED | parser source | rerun |
| I10 | rapid duplicate | domain + E2E | moderate | no | BLOCKED | source + authored E2E | run |
| D01 | R1 refresh | E2E | good | no | BLOCKED | authored only | run |
| D02 | locked refresh | E2E | good | no | BLOCKED | authored only | run |
| D03 | R2 refresh/blind | E2E | good | no | BLOCKED | authored only | run |
| D04 | reference refresh | E2E | good | no | BLOCKED | authored only | run |
| D05 | result refresh | E2E | good | no | BLOCKED | authored only | run |
| D06 | close/reopen | E2E | good | no | BLOCKED | authored only | run |
| D07 | stale CAS | unit + E2E | good | no | BLOCKED | transaction source | run |
| D08 | malformed store | unit | good | no | BLOCKED | validation source | run |
| D09 | schema mismatch | unit | good | no | BLOCKED | policy source | run |
| D10 | stale result | unit | moderate | no | BLOCKED | equality source | persisted E2E |
| O01 | warm cache | E2E | good | no | BLOCKED | authored only | build/run |
| O02 | offline Home | E2E | good | no | BLOCKED | authored only | build/run |
| O03 | offline rounds | E2E | good | no | BLOCKED | authored only | build/run |
| O04 | offline calculation | E2E | good | no | BLOCKED | authored only | build/run |
| O05 | offline evidence | E2E | good | no | BLOCKED | authored only | build/run |
| O06 | offline lineage | E2E | good | no | BLOCKED | authored only | build/run |
| O07 | offline reopen | E2E | good | no | BLOCKED | authored only | build/run |
| O08 | SW update safe | unit + E2E | moderate | no | BLOCKED | source inspected | generated SW |
| O09 | persist denied | E2E | moderate | no | BLOCKED | optional call source | run |
| O10 | no runtime network | static smoke | good static only | yes | PASS | static smoke output | browser proof |
| S01 | no NIK | static + unit | good static only | yes | PASS | static smoke output | browser review |
| S02 | no real names | static + unit | good static only | yes | PASS | static smoke output | browser review |
| S03 | no photo/camera | static + unit | good static only | yes | PASS | static smoke output | browser review |
| S04 | synthetic export | unit | good | no | BLOCKED | export source | run |
| S05 | no certification | static + unit | good static only | yes | PASS | static smoke output | UI run |
| S06 | no WHO-certified claim | static + unit | good static only | yes | PASS | static smoke output | UI run |
| S07 | no causal blame | static + unit | good static only | yes | PASS | static smoke output | UI run |
| S08 | no cloud/API | static + unit | good static only | yes | PASS | static smoke output | network panel |

## 29. Release blockers

1. P0-001 unresolved lockfile and unavailable registry validation.
2. P0-002 TypeScript composite-project errors.
3. P0-003 missing authoritative external agreement oracle.
4. Node 24 is unavailable in this environment.
5. No successful production build, PWA, unit, persistence, E2E, accessibility, or fixture execution evidence.

## 30. Recommended repair sequence

### Patch Set 1 — P0 scientific/data integrity

Files likely affected: `src/domain/protocol/invariants.ts`, `src/domain/session/transition.ts`, evaluator/result UI, tests. Define position-deviation verdict policy; obtain and add external oracle separately. Tests: mixed-position result behavior; external M03/M04. Risk: scientific-policy decision required. Dependency: none for policy, Node 24 for tests. Commit boundaries: `fix(protocol): gate invalid position` and later `test(science): add authoritative agreement oracle`.

### Patch Set 2 — P0/P1 workflow/blinding

Files likely affected: `src/app/routes.ts`, `src/App.tsx`, E2E. Either remove unused route model/route claims or implement guarded routing; make Round-2 projection boundary explicit. Tests: deep-link/back/forward/reload. Risk: navigation behavior change. Dependency: Patch Set 1 only if verdict view changes. Commit: `fix(workflow): align route model and guards`.

### Patch Set 3 — persistence/offline

Files likely affected: `src/App.tsx`, repository/validation, E2E. Cover reset second-tab and re-standardization double click; consider result recomputation policy. Tests: two-tab reset, stale form action, result integrity. Risk: data recovery. Dependency: working dependency installation. Commit: `test(persistence): harden hostile recovery` then focused fixes.

### Patch Set 4 — accessibility/mobile

Files likely affected: `ResultsPanel.tsx`, CSS, E2E. Fix tab semantics and execute requested viewport matrix. Risk: low. Dependency: working build. Commit: `fix(a11y): make evidence tabs conformant`.

### Patch Set 5 — release/test infrastructure

Files likely affected: `package-lock.json`, `tsconfig.node.json`, `scripts/domain-smoke.mjs`, CI scripts/docs. Regenerate complete lock under Node 24, repair references, harden smoke failure output, then execute all commands. Risk: dependency graph changes; review lock carefully. Dependency: registry + Node 24. Commit boundaries: `build: repair TypeScript project references`; `chore(deps): lock resolved dependency graph`; `test(release): record clean execution evidence`.

### Patch Set 6 — hackathon/demo polish

Files likely affected: docs/demo/judge QA only after all evidence exists. Update claims to exactly match verified state and rehearse Cadre C online/offline on clean laptop/mobile. Risk: claim drift. Dependency: all previous sets. Commit: `docs(release): record verified competition evidence`.

## Release-gate audit

| Gate | Implemented | Verified now | Blockers | Verdict |
|---|---|---|---|---|
| V0.0 scientific oracle | partial working math | no | external oracle | BLOCKED |
| V0.1 domain kernel | yes by source | static only | dependency smoke failure | QUALIFIED |
| V0.2 blinded workflow | authored | no | build/E2E blocked | BLOCKED |
| V0.3 persistence/CAS | authored | no | Dexie tests blocked | BLOCKED |
| V0.4 evidence/results | authored | no | build/tests blocked | BLOCKED |
| V0.5 offline | authored | no | production PWA blocked | BLOCKED |
| V0.6 remediation | authored | no | E2E blocked | BLOCKED |
| V0.7 demo edition | authored | no | build/demo blocked | BLOCKED |
| V0.8 hostile audit | this report | partial | unresolved P0/P1 | FAIL |
| V0.9 release candidate | no | no | all above | FAIL |
| V1.0 competition | no | no | all above | FAIL |

## Phase 5 resolution note — Round-2 structural blinding

The earlier source-review observation at section 16 is resolved by a dedicated `RoundTwoPanel` boundary. The Round-2 presentation component accepts only explicitly constructed `BlindRoundSubjectDTO` records (`subjectId`, `subjectLabel`, `stationId`, `stationLabel`, and `expectedPosition`), completion IDs, and mutation callbacks. It does not receive `Session`, measurements, results, references, repository access, or a database object.

Unit tests verify the exact DTO allow-list, absence of Round-1 values and related accessibility metadata in the Round-2 DOM, and state-machine rejection of entering Round 2 before Round 1 is locked or reopening Round 1 while Round 2 is open. The safe claim remains: **“Round-1 values are not exposed in the normal Round-2 entry workflow.”**

Browser tests for Back, Forward, refresh, reopen, and a second tab were extended but were not completed in the bounded local Playwright invocation; they remain **BLOCKED** pending completed browser execution. This is workflow-level blinding, not cryptographic secrecy.

## Phase 9 resolution — browser workflow and lineage evidence

The previously blocked browser checks were executed against the actual production `dist/` bundle using Playwright `1.63.0` and system Microsoft Edge `154.0.4258.53` (headless, one worker, zero retries). The deterministic local server was used because Vite preview was non-responsive in the earlier Windows transport; its process exited after the suite.

Round-2 Back, Forward, refresh, close/reopen, and second-tab checks passed without exposing Round-1 values. Post-assessment evidence intentionally displayed the recorded Round-1, Round-2, and reference values, confirming that blinding is scoped to entry rather than historical evidence review. Two-tab CAS, reset stale-tab protection, rapid mouse/keyboard measurement submission, and single/two-tab re-standardization races also passed. The latter introduced a focused in-flight UI guard so two rapid local activations cannot overwrite the newly opened child-session view; persistence CAS remains the cross-tab correctness mechanism.

This resolves the workflow-level browser blockers documented above. It does not claim cryptographic secrecy, full offline behavior, accessibility conformance, responsive validation, or external Annex-13/DHS oracle parity.

## Phase 10 resolution — offline, accessibility, and responsive execution

On 2026-10-04, the actual production `dist/` bundle was exercised in Playwright `1.63.0` using system Microsoft Edge `154.0.4258.53` (headless, one worker, zero retries). The generated service worker controlled the warmed page before offline mode was enabled. A full assessment, calculation, evidence review, remediation, linked re-standardization, and same-context close/reopen completed while offline. No external runtime request was required by the exercised workflow.

The app defers a waiting service-worker update during active assessment states: a deliberate waiting worker did not force navigation or discard active Round 1 state. Denied and unavailable `navigator.storage.persist` APIs were also exercised without preventing local use.

The evidence category controls now use ordinary labelled buttons with `aria-pressed`, rather than an incomplete ARIA tab implementation. Keyboard-only browser checks, error association, visible focus, status text, Round-2 accessibility blinding, and basic touch-target sizing passed. Responsive production-browser checks at 320, 360, 390, 412, 768, 1024, and 1440 pixels passed with no page-level horizontal overflow.

These results resolve the previously blocked offline/PWA, evidence-navigation accessibility, and responsive execution findings. Exact external Annex-13/DHS parity remains `EXTERNAL_ORACLE_PARITY_PENDING`.

Fresh-clone repetition from the final Phase 10 commit passed Node-24 dependency installation, typecheck, lint, unit suite, production build, B00–B12, and O01–O10. The browser suites used an isolated loopback port to avoid accidental reuse of a previous local server; the production PWA network assertion now compares request origins dynamically rather than relying on a fixed test port.
