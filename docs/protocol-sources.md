# Protocol sources and scientific boundary

## Status

The repository intentionally separates the **working competition profile** from claims of authoritative formula parity.

`EXTERNAL_ORACLE_PARITY_PENDING`

The supplied build environment did not contain an Annex-13/DHS oracle workbook or other project source material proving exact reference-agreement implementation parity. Therefore this prototype **does not claim** that its working reference-agreement formula reproduces a WHO, UNICEF, DHS, or Kemenkes official calculator.

## Safe positioning

- Designed as a proposed practical QA workflow for the Posyandu cadre-training context.
- WHO/UNICEF-aligned anthropometry standardization training and QA.
- Not an official Kemenkes certification system.
- Not a WHO-certified cadre workflow.

## Working thresholds

The competition profile uses strict raw-value comparisons:

- trainee repeatability TEM `< 0.6 cm`
- trainee/reference agreement TEM `< 0.8 cm`
- reference repeatability TEM `< 0.4 cm`

Display rounding never determines pass/fail.

## Formula implemented with verified local tests

Repeatability TEM:

`TEM = sqrt(sum(d_i^2) / (2N))`

where `d_i` is the difference between repeated measurements for the same subject ID.

The reference-agreement implementation currently applies the same quadratic-difference structure to trainee/reference subject means. This is a **project working formula only** pending oracle parity verification.

Signed mean difference is descriptive evidence only and is tested specifically for cancellation.
