# V0.8 hostile-audit checklist

No feature additions belong in this gate. Each item is mapped to a guard or automated test; browser-dependent entries remain unexecuted in the current registry-blocked environment.

| Attack | Defensive behavior / evidence |
|---|---|
| refresh | IndexedDB recovery; `e2e/recovery.spec.ts` |
| browser back / forward | state-driven UI; Round-1 data absent from blind DTO; `e2e/blinded-round.spec.ts` |
| double click / duplicate submit | domain duplicate-measurement invariant + CAS; browser path authored in `e2e/hostile.spec.ts` |
| decimal comma | parser normalizes one unambiguous comma |
| malformed input | parser rejects empty/NaN/Infinity/mixed separators/range violations |
| duplicate subject | setup invariant rejects duplicate active IDs |
| invalid reference | agreement verdict withheld |
| station change | post-measurement station replacement raises `STATION_CHANGE_REQUIRES_REVIEW` |
| two tabs | revision CAS rejects stale writer; BroadcastChannel warns only |
| offline | production PWA Playwright journey authored |
| service-worker update | prompt registration + active-state update deferral |
| DB corruption | Zod schema validation + SHA-256 consistency check |
| stale result | cross-field stored validation + UI current-result guard |
| replacement subject | old measurement history retained; active selection switches to replacement |
| mobile layout | 390×844 Playwright overflow check + mobile CSS |
| keyboard operation | labeled form fields, focus-visible CSS, keyboard E2E |
| reset | deletes/reopens the physical local DB then reconstructs deterministic synthetic seed; reload path authored in `e2e/hostile.spec.ts` |
| fresh install | repository creates default synthetic seed when local DB is empty |
| old/unknown schema | explicit `SCHEMA_INCOMPATIBLE`; missing marker with existing data and physically newer IndexedDB schema are not silently accepted |
