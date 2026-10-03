# Claims matrix

| Claim | Status | Evidence in repository |
|---|---|---|
| Round-2 normal workflow hides Round-1 values | Implemented | `BlindRoundSubjectDTO`, selector, UI copy, claim test |
| Stale concurrent writes are rejected | Implemented | revision CAS in `SessionRepository` |
| BroadcastChannel is correctness-independent | Implemented | channel only warns; repository CAS enforces correctness |
| Existing session uses snapshotted protocol | Implemented in model | `protocolSnapshot`, `protocolVersion`, `protocolHash` |
| Result revision must equal session revision | Implemented | transition and invariant |
| Reference agreement withheld when reference repeatability fails | Implemented | evaluator + results UI |
| Core workflow needs no runtime network after cached load | Designed/implemented via PWA shell | Requires browser E2E verification after dependency install |
| IndexedDB survives browser restart | Storage architecture implemented | Requires browser E2E verification after dependency install |
| Application history is tamper-proof | **Not claimed** | Wording restricted to application-level revision history with integrity checks |
| WHO/DHS Annex-13 exact agreement parity | **Not claimed** | `EXTERNAL_ORACLE_PARITY_PENDING` |
| Official Kemenkes certification workflow | **Not claimed** | README/UI/docs disclaimer |
