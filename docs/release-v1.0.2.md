# TumbuhGuard Standardize v1.0.2

Release candidate: 1.0.2.

This patch narrows local session creation to explicit home-template, ordinary-root, linked-continuation, and synthetic fast-demo paths. It also rejects unknown persisted fields before they can be normalized away and recovers safely when a tab attempts to save a locally deleted session.

The candidate retains the declared competition protocol profile and deterministic calculation behavior. `EXTERNAL_ORACLE_PARITY_PENDING` remains unchanged: this release does not claim independent DHS/Annex-13 oracle parity.

Accepted hardening limitations remain: fail-closed isolation of corrupt historical records, reference-entry DTO narrowing, and deployment base-path configuration pending a chosen deployment target. `NOT_OBSERVED` and failed-session closure semantics remain documented product-policy decisions.

Final verification evidence is recorded only after the candidate completes its primary and clean-clone release matrix.
