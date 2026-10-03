# Test evidence

## Verified in this build environment

- Node runtime available: `v22.16.0` (locked target is Node 24 LTS; target-runtime parity is **not verified** here).
- Global TypeScript compiler: `5.8.3`.
- Pure calculation/domain TypeScript compiled with strict flags.
- Executed local math smoke check:
  - constant 0.2 cm paired difference -> TEM `0.141421356237...`
  - alternating +1/-1 trainee/reference differences -> signed difference `0`, agreement error `0.707106781186...`
- Deterministic fixture verified by compiled JS:
  - trainee TEM `0.141421356237...`
  - reference repeatability TEM `0.070710678118...`
  - working agreement TEM `0`

## Not verified in this environment

The npm registry was unreachable (`EAI_AGAIN registry.npmjs.org`), so project dependencies could not be installed. Consequently these commands are authored but **not claimed as passed** here:

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`

The committed `package-lock.json` is a bootstrap lock manifest only; npm could not hydrate/validate its full transitive metadata without registry access. Under Node 24 LTS with registry access, run `npm install` once to regenerate a complete lock, commit that regenerated lock, then use `npm ci` for all subsequent verification. Do not treat the current lock as release-validated.
