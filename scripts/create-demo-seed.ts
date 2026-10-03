import { writeFile } from 'node:fs/promises';
import { DEMO_FIXTURES } from '../src/fixtures/demo';

const seed = {
  dataMode: 'SYNTHETIC',
  synthetic: true,
  fixtures: Object.values(DEMO_FIXTURES),
};
await writeFile('public/demo/demo-seed.json', JSON.stringify(seed, null, 2) + '\n');
console.log('Wrote public/demo/demo-seed.json');
