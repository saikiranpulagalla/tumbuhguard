import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { BUILD_INFO } from '../src/app/build-info';
import { WORKING_STANDARDIZATION_PROFILE, WORKING_STANDARDIZATION_PROFILE_HASH } from '../src/domain/protocol/profile';
import { DEMO_FIXTURES, evaluateDemoFixture } from '../src/fixtures/demo';

const required = [
  'README.md','package.json','package-lock.json','src/App.tsx','src/domain/calculation/tem.ts',
  'src/domain/session/transition.ts','src/data/repositories/session-repository.ts','public/manifest.webmanifest',
  'public/icons/icon.svg','public/demo/demo-seed.json','docs/claims-matrix.md','docs/protocol-sources.md',
  'docs/test-evidence.md','docs/demo-script.md','docs/judge-qa.md','e2e/blinded-round.spec.ts',
  'e2e/offline.spec.ts','e2e/recovery.spec.ts','e2e/concurrency.spec.ts','e2e/update.spec.ts','e2e/hostile.spec.ts','e2e/accessibility.spec.ts',
  'docs/hostile-audit.md','scripts/domain-smoke.mjs','scripts/static-smoke.mjs',
];
for (const path of required) await access(path);

if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error(`Release validation requires Node 24 LTS; observed ${process.version}`);

const pkg = JSON.parse(await readFile('package.json','utf8')) as { version?:string; engines?:{node?:string}; scripts?:Record<string,string> };
if (pkg.engines?.node !== '>=24 <25') throw new Error('Node 24 engine lock missing');
if (pkg.version !== BUILD_INFO.version) throw new Error('Build/package version mismatch');
if (!BUILD_INFO.buildId || /dev|placeholder|unknown/i.test(BUILD_INFO.buildId)) throw new Error(`Release build ID invalid: ${BUILD_INFO.buildId}`);
for (const script of ['typecheck','lint','test','e2e','build']) if (!pkg.scripts?.[script]) throw new Error(`Required npm script missing: ${script}`);

const lock=JSON.parse(await readFile('package-lock.json','utf8')) as { lockfileVersion?:number; packages?:Record<string,unknown> };
if (lock.lockfileVersion !== 3 || !lock.packages) throw new Error('package-lock.json is not a supported npm lockfile');
const root=(lock.packages[''] ?? {}) as { dependencies?:Record<string,string>; devDependencies?:Record<string,string> };
const declared={...(root.dependencies??{}),...(root.devDependencies??{})};
for (const dependency of Object.keys(declared)) {
  if (!Object.prototype.hasOwnProperty.call(lock.packages,`node_modules/${dependency}`)) throw new Error(`package-lock.json is not fully resolved: ${dependency} entry missing`);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,stable(item)]));
  return value;
}
const protocolHash=createHash('sha256').update(JSON.stringify(stable(WORKING_STANDARDIZATION_PROFILE))).digest('hex');
if (protocolHash !== WORKING_STANDARDIZATION_PROFILE_HASH) throw new Error(`Protocol hash mismatch: ${protocolHash}`);

for (const fixture of Object.values(DEMO_FIXTURES)) {
  if (fixture.synthetic !== true || fixture.rows.length !== 10) throw new Error(`Synthetic fixture invalid: ${fixture.fixtureId}`);
  for (const row of fixture.rows) for (const value of [row.r1,row.r2,row.ref1,row.ref2]) if (!Number.isInteger(value*10)) throw new Error(`Demo fixture precision drifted beyond one decimal: ${fixture.fixtureId}/${row.id}`);
}
const cadreC=evaluateDemoFixture('cadre-c-systematic-low');
if (Math.abs(cadreC.precisionTEM-0.07071067811865475)>1e-9 || Math.abs((cadreC.referenceTEM??0)-0.848528137423857)>1e-9 || Math.abs((cadreC.signedDifference??0)+1.2)>1e-9) {
  throw new Error('Cadre C deterministic oracle drifted');
}
const invalid=evaluateDemoFixture('invalid-reference');
if (invalid.referenceValid || invalid.referenceTEM!==null || invalid.referencePass!==null) throw new Error('Invalid-reference suppression drifted');

const publicSeed=JSON.parse(await readFile('public/demo/demo-seed.json','utf8')) as { dataMode?:string; synthetic?:boolean; fixtures?:Array<{synthetic?:boolean}> };
if (publicSeed.dataMode!=='SYNTHETIC' || publicSeed.synthetic!==true || !publicSeed.fixtures?.length || publicSeed.fixtures.some(item=>item.synthetic!==true)) {
  throw new Error('Public demo seed lacks explicit synthetic metadata');
}
if (JSON.stringify(publicSeed.fixtures) !== JSON.stringify(Object.values(DEMO_FIXTURES))) {
  throw new Error('Public demo seed drifted from source fixtures');
}

async function collect(root:string):Promise<string[]> {
  const out:string[]=[];
  for(const entry of await readdir(root,{withFileTypes:true})) {
    const path=join(root,entry.name);
    if(entry.isDirectory()) out.push(...await collect(path));
    else if(/\.(ts|tsx|html|json)$/.test(entry.name)) out.push(path);
  }
  return out;
}
const runtimeFiles=[...await collect('src'),'index.html','public/manifest.webmanifest'];
const runtime=(await Promise.all(runtimeFiles.map(async path=>`\n/* ${path} */\n${await readFile(path,'utf8')}`))).join('\n');
const positiveBanned=[/Kemenkes certified/i,/WHO certified cadre/i,/is an official Kemenkes certification/i,/AI diagnosis/i,/stunting diagnosis/i];
for(const pattern of positiveBanned) if(pattern.test(runtime)) throw new Error(`Banned runtime claim: ${pattern}`);
for(const pattern of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\bWebSocket\s*\(/,/\baxios\b/]) if(pattern.test(runtime)) throw new Error(`Core runtime network dependency found: ${pattern}`);

const claims=await readFile('docs/claims-matrix.md','utf8');
if(!claims.includes('EXTERNAL_ORACLE_PARITY_PENDING')) throw new Error('Scientific parity boundary missing');
if(!claims.includes('Application-level revision history with integrity checks')) throw new Error('Safe integrity wording missing');
if(!claims.includes('Round-1 values are not exposed')) throw new Error('Safe blinding wording missing');

const manifest=JSON.parse(await readFile('public/manifest.webmanifest','utf8')) as {name?:string;icons?:Array<{src?:string}>};
if(manifest.name!=='TumbuhGuard Standardize' || !manifest.icons?.some(icon=>icon.src==='/icons/icon.svg')) throw new Error('Manifest/static icon metadata invalid');

console.log(JSON.stringify({
  releaseCheck:'PASS',
  buildId:BUILD_INFO.buildId,
  protocolHash,
  fixtureCount:Object.keys(DEMO_FIXTURES).length,
  requiredArtifacts:required.length,
  externalOracleParity:'EXTERNAL_ORACLE_PARITY_PENDING',
},null,2));
