# Tier-A test matrix

Status legend:

- **EXECUTED_NO_DEPS_PASS** — exercised against compiled project source by `node scripts/domain-smoke.mjs` in this environment.
- **AUTHORED_REQUIRES_NPM** — automated Vitest/Playwright coverage exists but cannot be executed here because registry dependencies are unavailable.
- **EXTERNAL_ORACLE_BLOCKED** — cannot be truthfully completed without the authoritative supplied oracle.

## Mathematics

| ID | Coverage | Status |
|---|---|---|
| M01 | identical repeats → TEM 0 | EXECUTED_NO_DEPS_PASS |
| M02 | constant 0.2 difference → ≈0.141421 | EXECUTED_NO_DEPS_PASS |
| M03 | authoritative golden fixture A | EXTERNAL_ORACLE_BLOCKED |
| M04 | authoritative golden fixture B | EXTERNAL_ORACLE_BLOCKED |
| M05–M10 | strict raw threshold boundaries | EXECUTED_NO_DEPS_PASS |
| M11 | signed-difference cancellation does not prove agreement | EXECUTED_NO_DEPS_PASS |
| M12 | systematic shift: repeatable but poor reference agreement | EXECUTED_NO_DEPS_PASS |
| M13 | raw 0.59996 displays 0.600 but passes | EXECUTED_NO_DEPS_PASS |
| M14 | subject order independence | EXECUTED_NO_DEPS_PASS |
| M15 | duplicate subject ID rejected | EXECUTED_NO_DEPS_PASS |
| M16 | empty calculation input typed failure | EXECUTED_NO_DEPS_PASS |

Primary files: `tests/unit/tier-a-math.test.ts`, `tests/unit/calculation.test.ts`, `scripts/domain-smoke.mjs`.

## Protocol / state

| ID | Coverage | Status |
|---|---|---|
| P01–P10 | subject/setup/transition/blinding invariants | AUTHORED_REQUIRES_NPM; setup, illegal transition and blind-DTO non-leak subset executed |
| P11–P12 | browser Back/direct workflow cannot expose R1 during R2 | AUTHORED_REQUIRES_NPM (`e2e/blinded-round.spec.ts`) |
| P13–P18 | role collision, early calculation, invalid reference, station review, protocol snapshot, linked re-standardization | AUTHORED_REQUIRES_NPM; P14/P18 smoke subset executed; replacement preserves old station provenance |

Primary file: `tests/domain/tier-a-protocol.test.ts`.

## Input

| ID | Coverage | Status |
|---|---|---|
| I01–I09 | decimal dot/comma and malformed/range handling | EXECUTED_NO_DEPS_PASS for core parser cases; full assertions authored |
| I10 | duplicate/double submit rejected | EXECUTED_NO_DEPS_PASS for duplicate domain submission; browser double-click path authored (`e2e/hostile.spec.ts`) |

Primary file: `tests/unit/input-tier-a.test.ts`.

## Persistence

| ID | Coverage | Status |
|---|---|---|
| D01–D06 | refresh/close/reopen recovery at critical states | AUTHORED_REQUIRES_NPM (`e2e/recovery.spec.ts`) |
| D07 | stale two-tab save rejected | AUTHORED_REQUIRES_NPM (`tests/persistence/cas.test.ts`, `e2e/concurrency.spec.ts`); linked-child CAS stale-parent case authored |
| D08 | malformed stored record handled safely | AUTHORED_REQUIRES_NPM (`tests/persistence/schema.test.ts`) |
| D09 | missing marker with records, unknown marker, or physically newer IndexedDB version produces safe compatibility failure | Pure schema-policy subset EXECUTED_NO_DEPS_PASS; IndexedDB cases AUTHORED_REQUIRES_NPM (`tests/persistence/schema.test.ts`) |
| D10 | stale result detected | AUTHORED_REQUIRES_NPM (`tests/domain/revision.test.ts` + stored cross-field guard) |

## Offline

| ID | Coverage | Status |
|---|---|---|
| O01–O07 | warm-cache launch through offline re-standardization/recovery | AUTHORED_REQUIRES_NPM (`e2e/offline.spec.ts`) |
| O08 | update checks do not force reload; update policy defers active workflow | Update-policy subset EXECUTED_NO_DEPS_PASS; browser service-worker path AUTHORED_REQUIRES_NPM (`e2e/update.spec.ts`, `tests/domain/update-safety.test.ts`) |
| O09 | persistent-storage denial non-fatal | AUTHORED_REQUIRES_NPM (`e2e/offline.spec.ts`) |
| O10 | core runtime contains no fetch/XHR/WebSocket/axios path | Static release guard authored; browser verification requires npm |

## Privacy / claims

| ID | Coverage | Status |
|---|---|---|
| S01–S03 | no NIK/real child name/photo requirement | AUTHORED_REQUIRES_NPM static claim test |
| S04 | export explicitly synthetic | AUTHORED_REQUIRES_NPM |
| S05–S06 | no prohibited certification claims | AUTHORED_REQUIRES_NPM + release guard |
| S07 | no unsupported causal blame | AUTHORED_REQUIRES_NPM + release guard |
| S08 | no healthcare/cloud/API runtime dependency | Static release guard authored |

Primary file: `tests/claims/privacy-claims.test.ts`.

## Evidence / provenance additions

- Actual measurement position is stored separately from expected position. Deviations are surfaced as evidence and do not trigger an automatic length/height conversion.
- Subject replacement preserves the original subject/station/measurement provenance and assigns the replacement a new station record.
- Stored-record cross-field validation checks protocol snapshot/version consistency, station/device/measurer links, duplicate measurement keys, lock-state completeness and contradictory reference-validity result fields.
- These guards are authored in domain/persistence tests; dependency-free portions are exercised by `scripts/domain-smoke.mjs`.

## Demo fixtures

Actual project source was compiled and executed in this environment:

```text
Cadre A: precision pass, reference valid, agreement pass
Cadre B: precision fail, signed difference = 0
Cadre C: precision TEM 0.070710678..., agreement TEM 0.848528137..., signed difference -1.2
Invalid Reference: referenceValid false, agreement withheld
```

Exact WHO/DHS oracle parity remains `EXTERNAL_ORACLE_PARITY_PENDING`.
