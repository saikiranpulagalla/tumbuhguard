# Final hostile audit — RC.4

Executed on 2026-10-04 against the production `dist/` bundle using Playwright 1.63.0 and system Microsoft Edge 154.0.4258.53 (headless, one worker, zero retries). The audit uses browser tests where a browser interaction is material and the executed unit/persistence suite for deterministic storage and mathematical invariants.

| ID | Scenario | Result | Executed evidence |
|---|---|---|---|
| H01 | Refresh after a measurement save | PASS | `e2e/recovery.spec.ts` D01 restores exactly one recorded Round-1 value after reload. |
| H02 | Back during entry | PASS | `e2e/blinded-round.spec.ts` verifies Back/Forward cannot reopen editable Round 1 or reveal Round-1 values. |
| H03 | Offline save | PASS | `e2e/pwa-offline.spec.ts` records both complete measurement rounds after `context.setOffline(true)`. |
| H04 | Reset during active workflow | PASS | `e2e/hostile.spec.ts` resets an active Round 1 and reloads deterministic Home; reset/CAS tests cover stale active views. |
| H05 | Reset + stale second tab | PASS | `e2e/concurrency.spec.ts` B08 rejects the stale write and reloads to Home; IndexedDB CAS is network-independent. |
| H06 | Derived result after source change | PASS | `tests/persistence/result-integrity.test.ts` rejects recomputation mismatch and preserves source data for recalculation. |
| H07 | Protocol snapshot after reload | PASS | protocol snapshot/hash tests in the executed domain and persistence suite. |
| H08 | Wrong position with good metrics | PASS | `tests/domain/position-validity.test.ts` withholds verdict despite passing raw metrics. |
| H09 | Invalid reference with good trainee repeatability | PASS | Invalid Reference fixture and reference-validity tests withhold agreement. |
| H10 | Signed-bias cancellation | PASS | Cadre B fixture demonstrates approximately zero signed difference with failed repeatability. |
| H11 | Raw threshold versus rounded display | PASS | calculation boundary tests classify raw values before display rounding. |
| H12 | Persistence denial while offline | PASS | O09 denies/misses `storage.persist`; O01–O07 completes the offline workflow. |
| H13 | Waiting worker during active assessment | PASS | O08 installs a waiting worker and confirms no forced navigation or active-state loss. |
| H14 | Linked-child offline reopen | PASS | O07 closes and reopens offline after linked-session creation, resuming the child setup session. |
| H15 | Malformed local records | PASS | `tests/persistence/schema.test.ts` and integrity tests reject invalid shape, enum, revision, hash, and store invariants. |
| H16 | Tampered result with recomputed hash | PASS | result-integrity regression rejects stale derived values with `RESULT_INTEGRITY_MISMATCH`. |
| H17 | Rapid and two-tab child creation | PASS | B11/B12 create exactly one child and reject the stale parent revision. |
| H18 | 320px measurement flow | PASS | responsive R320 test performs real setup/Round-1 entry and checks overflow, reachable controls, and decimal input mode. |
| H19 | Keyboard workflow | PASS | A03 uses Tab/Enter/Space for representative setup, measurement, demo, and Round-2 actions without a focus trap. |
| H20 | Required network leak | PASS | O01–O10 completes after warm-cache offline transition with no cross-origin required runtime request. |

## Dependency advisory triage

`npm audit` initially reported Vite 7.1.7 (high), Vitest 4.0.0 (critical), and transitive `@vitest/mocker` (moderate). Vite was updated to 7.3.6 and Vitest to 4.1.11, the non-major fixed versions named by npm. `@testing-library/dom` 10.4.2 is now explicit because it is a required peer of the existing React testing library; the update otherwise made that peer unavailable. Final `npm audit` reports **0 vulnerabilities**.

The Vite advisory concerned development-server file exposure on Windows; it is build-time tooling and is not shipped in the browser bundle. The Vitest and mocker advisories concerned the test/UI server and mock redirect handling; they are test-only and not shipped. They were nevertheless remediated because compatible fixed versions were available.

## Scientific and claims boundary

The software workflow is verified against its declared competition profile. Exact external DHS/Annex-13 oracle parity remains `EXTERNAL_ORACLE_PARITY_PENDING`; no WHO, Kemenkes, official-certification, diagnosis, or tamper-proof claim is made.
