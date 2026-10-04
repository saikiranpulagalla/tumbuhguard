# TumbuhGuard Standardize — Devpost Copy

## Project Name

TumbuhGuard Standardize

## Tagline

Offline practical anthropometry standardization that validates the measurer, not just the measurement.

## Problem Background

Digitally recording an anthropometric value does not prove that it was measured reliably. A measurer can be consistent with themself yet still disagree systematically with a qualified reference. Practical quality assessment therefore needs to validate the assessment workflow, not just store a number.

## Solution

TumbuhGuard Standardize is an offline-first protocol runner for practical length/height anthropometry standardization. It guides a supervisor through blinded repeats, qualified-reference comparison, protocol checks, evidence review, remediation and linked re-standardization.

## Key Innovation

TumbuhGuard does not claim to invent TEM. It operationalizes established measurement-quality concepts in a protocol-enforced workflow: locked Round 1, structurally blinded Round 2, reference-validity checks, position-validity withholding, provenance, stale-write protection and result recomputation.

## How It Works

Setup → Round 1 → lock → blinded Round 2 → qualified-reference repeats → evidence → calculation → result → remediation / linked re-standardization.

Cadre C demonstrates the core insight: repeatability is approximately 0.071 cm, while agreement with the qualified reference is approximately 0.849 cm. The measurer is consistent, but requires re-standardization.

## Technology

React 19, TypeScript, Vite, Dexie / IndexedDB, Zod, Workbox PWA, Web Crypto, BroadcastChannel, Vitest and Playwright.

## Offline Design

After one successful online load caches the application shell, the complete workflow—including rounds, calculation, evidence, remediation, linked re-standardization and close/reopen—works without network connectivity.

## Privacy

The competition build uses synthetic subjects only. It requires no real child names, NIK, photographs, cloud account or remote API. Assessment state is stored locally in browser storage.

## Scientific Methodology and Boundary

The application implements a WHO/UNICEF-aligned anthropometry standardization workflow. It is not an official Kemenkes certification system, is not WHO-certified, and does not diagnose stunting or any medical condition. Exact independent DHS/Annex-13 oracle parity remains `EXTERNAL_ORACLE_PARITY_PENDING`.

## Impact

TumbuhGuard sits at the intersection of health, education and social good: it helps supervisors assess whether practical measurement skills are reliable before measurements are trusted operationally.

## Limitations

This is a synthetic-data, length/height-only competition prototype. Official deployment requires programme validation and approval. Corrupt historical records fail closed; reference DTO narrowing and deployment base-path configuration remain future hardening items.

## AI-use Disclosure

AI coding assistants supported implementation, testing, review and adversarial QA. The TumbuhGuard application itself contains no AI/LLM inference.

## Repository / Verification Evidence

Current release: `v1.0.1`. The verified release includes 129 passing unit tests with 2 intentional external-oracle skips, 36 passing browser tests, O01–O10 offline/PWA verification, clean-clone verification and `npm audit` reporting 0 vulnerabilities.
