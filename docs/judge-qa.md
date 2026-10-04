# Judge Q&A

## Why not Excel?

Excel can calculate the result. TumbuhGuard manages whether the result was produced through a valid assessment workflow: blinded repeated measurement, protocol-state enforcement, reference validity, evidence provenance, recovery, remediation and re-standardization.

## What about ENA / DHS standardization tools?

ENA and established survey workflows already perform anthropometric standardization calculations; TumbuhGuard does not claim to invent that measurement science. The competition problem is operationalizing a practical Posyandu cadre-training QA workflow with blinded entry, protocol-state enforcement, reference validity, provenance, offline recovery, remediation and re-standardization.

Exact Annex-13/DHS reference-agreement parity remains `EXTERNAL_ORACLE_PARITY_PENDING` until the authoritative oracle is supplied and audited.

## Did TumbuhGuard invent TEM?

No. TEM and anthropometric standardization predate this project. TumbuhGuard’s contribution is operational workflow integrity around the assessment.

## Is this an official Kemenkes system?

No. It is designed as a proposed practical QA workflow for the Posyandu cadre-training context. Official deployment would require Kemenkes/programme validation and approval.

## Is this WHO certified?

No. The project uses WHO/UNICEF-aligned anthropometry standardization training/QA framing from the supplied specification. It does not certify a cadre, and exact external-oracle parity for the working reference-agreement formula is pending.

## Why is Cadre C important?

Cadre C is highly repeatable but has systematic disagreement against the qualified reference. It demonstrates the core insight: precision alone is not sufficient evidence of agreement.

## Why show signed mean difference if it can cancel?

Because direction is useful descriptive evidence, but the interface explicitly states that signed mean difference is not a substitute for agreement. Cadre B demonstrates cancellation: the signed mean can be approximately zero while repeatability is poor.

## What happens if the reference measurer is inconsistent?

The app still shows trainee repeatability but suppresses the trainee/reference agreement verdict. It reports that reference agreement is unavailable because the reference-measurer repeatability gate did not meet the selected profile.

## What does “blinded” mean here?

Workflow blinding, not cryptographic secrecy against a malicious device owner with unrestricted DevTools. Round-1 values are absent from the normal Round-2 DTO and interface.

## What protects two open tabs?

Revision compare-and-swap in IndexedDB. BroadcastChannel only warns the other tab; it is not part of correctness. A stale write is rejected with `STALE_REVISION`.

## Is local history tamper-proof?

No. The safe claim is **application-level revision history with integrity checks**. SHA-256 is used for consistency/corruption/export integrity, not defense against a malicious owner of the same device.

## Does it work offline?

Yes. After the application has loaded once and its shell is cached, we verified the assessment, calculation, evidence, remediation and linked re-standardization workflow offline, including close and reopen. A first-ever uncached launch is not claimed to work offline.

## Does it use AI?

No. The competition build is deterministic and uses no AI/LLM/computer-vision component.
