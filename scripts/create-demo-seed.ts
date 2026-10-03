import { writeFile } from 'node:fs/promises';
import { createDemoSession, demoMeasurements } from '../src/fixtures/demo';
const session = createDemoSession();
const seed = { ...session, measurements: demoMeasurements(session) };
await writeFile('public/demo/demo-seed.json', JSON.stringify(seed, null, 2) + '\n');
console.log('Wrote public/demo/demo-seed.json');
