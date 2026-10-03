import { access, readFile } from 'node:fs/promises';
const required=['README.md','package.json','package-lock.json','src/App.tsx','src/domain/calculation/tem.ts','src/domain/session/transition.ts','src/data/repositories/session-repository.ts','public/manifest.webmanifest','docs/claims-matrix.md','docs/protocol-sources.md','docs/test-evidence.md','e2e/blinded-round.spec.ts'];
for(const path of required) await access(path);
const pkg=JSON.parse(await readFile('package.json','utf8'));
if(pkg.engines?.node!=='>=24 <25') throw new Error('Node 24 engine lock missing');
const claims=await readFile('docs/claims-matrix.md','utf8');
if(!claims.includes('EXTERNAL_ORACLE_PARITY_PENDING')) throw new Error('Scientific parity boundary missing');
console.log(`release-check: ${required.length} required artifacts present; scientific boundary present`);
