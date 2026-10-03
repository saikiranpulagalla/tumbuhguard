# Protocol sources and scientific boundary

## Source status

The supplied project material defines the product/scientific positioning but does **not** include the authoritative Annex-13/DHS oracle workbook needed to prove exact reference-agreement implementation parity.

Therefore the repository records:

`EXTERNAL_ORACLE_PARITY_PENDING`

No external scientific authority has been fabricated to fill that gap.

## Kemenkes context

Used for the **Indonesian Posyandu / health-cadre practical-skill context** described by the project specification.

Safe use:

- cadre-training context
- practical measurement-skill QA context

Not claimed:

- Kemenkes certification
- official Kemenkes workflow
- Kemenkes authorship/mandate of this competition profile’s exact TEM thresholds

## WHO / UNICEF / DHS context

Used for the **anthropometric measurement-standardization methodology framing** described by the project specification.

Safe positioning:

- “WHO/UNICEF-aligned anthropometry standardization training and QA.”
- “WHO/UNICEF-aligned standardization exercise profile.”

The working reference-agreement implementation uses subject-level trainee/reference means and a quadratic-difference TEM structure because that formula is locked by this project build. It must not be presented as verified Annex-13/DHS parity until an authoritative oracle is supplied and checked.

## TumbuhGuard contribution

TumbuhGuard provides the operational layer:

- guided protocol orchestration
- explicit state/invariant enforcement
- blinded normal Round-2 workflow
- reference-measurer validity gate
- station/device/position provenance
- observation evidence
- revision CAS and recovery integrity
- offline implementation
- remediation and linked re-standardization

TumbuhGuard does **not** claim to have invented TEM or anthropometric standardization.

## Working competition profile

Strict raw-value boundaries:

```text
trainee repeatability TEM < 0.6 cm
reference agreement TEM < 0.8 cm
reference repeatability TEM < 0.4 cm
```

Display rounding never determines classification.

Competition age composition is project-defined for the synthetic demo: five subjects under 24 months and five at/over 24 months. It is not described as an official programme rule.

No automatic ±0.7 cm conversion is implemented. Expected/actual measurement position is preserved as evidence instead.

The `30–220 cm` input range is an application-level competition guardrail for obviously nonsensical length/height entries. It is **not** presented as a WHO, UNICEF, DHS, or Kemenkes programme threshold.
