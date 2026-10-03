# Judge Q&A

## Why not Excel?
Excel can calculate the result. TumbuhGuard manages whether the result was produced through a valid assessment workflow: blinded repeat measurement, protocol-state enforcement, reference validity, evidence provenance, recovery, remediation and re-standardization.

## Did you invent TEM?
No. TEM and anthropometric standardization predate this project. The contribution is operational workflow integrity around the assessment.

## Is this an official Kemenkes system?
No. It is designed as a proposed practical QA workflow for the Posyandu cadre-training context. Official deployment would require programme validation and approval.

## Is this WHO certified?
No. The prototype uses anthropometric standardization concepts and a working competition profile. Exact external-oracle parity for the reference-agreement calculation remains `EXTERNAL_ORACLE_PARITY_PENDING`.

## What does “blinded” mean here?
Workflow blinding, not cryptographic secrecy against a developer with unrestricted DevTools access. Round-1 values are not exposed by the normal Round-2 entry DTO or interface.

## Why trust local history?
Do not treat it as tamper-proof. It is application-level revision history with CAS stale-write prevention and SHA-256 consistency checks intended for corruption/export integrity, not defense against a malicious device owner.
