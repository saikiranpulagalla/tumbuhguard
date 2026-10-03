import { DEMO_FIXTURES, evaluateDemoFixture } from '../src/fixtures/demo';

const tolerance = 1e-9;
const close = (actual: number | null, expected: number) => actual !== null && Math.abs(actual - expected) <= tolerance;

for (const fixture of Object.values(DEMO_FIXTURES)) {
  if (fixture.synthetic !== true) throw new Error(`${fixture.fixtureId}: synthetic metadata missing`);
  if (fixture.rows.length !== 10) throw new Error(`${fixture.fixtureId}: expected 10 rows`);
}

const a = evaluateDemoFixture('cadre-a-good');
if (!a.precisionPass || !a.referenceValid || a.referencePass !== true) throw new Error('Cadre A expected pass/pass/valid');

const b = evaluateDemoFixture('cadre-b-cancellation');
if (b.precisionPass || !b.referenceValid || Math.abs(b.signedDifference ?? Number.NaN) > tolerance) throw new Error('Cadre B cancellation fixture drifted');

const c = evaluateDemoFixture('cadre-c-systematic-low');
if (!close(c.precisionTEM, 0.07071067811865475)) throw new Error(`Cadre C repeatability drifted: ${c.precisionTEM}`);
if (!close(c.referenceTEM, 0.848528137423857)) throw new Error(`Cadre C agreement drifted: ${c.referenceTEM}`);
if (!close(c.signedDifference, -1.2)) throw new Error(`Cadre C signed difference drifted: ${c.signedDifference}`);
if (!c.precisionPass || c.referencePass !== false || !c.referenceValid) throw new Error('Cadre C expected precision pass + reference disagreement');

const invalid = evaluateDemoFixture('invalid-reference');
if (invalid.referenceValid || invalid.referenceTEM !== null || invalid.referencePass !== null || invalid.signedDifference !== null) {
  throw new Error('Invalid-reference fixture must suppress agreement and signed difference');
}

console.log(JSON.stringify({
  cadreA: a,
  cadreB: b,
  cadreC: c,
  invalidReference: invalid,
}, null, 2));
