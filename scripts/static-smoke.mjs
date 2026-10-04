import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root=process.cwd();
const read=(path)=>readFileSync(join(root,path),'utf8');
const required=[
  'README.md','package.json','package-lock.json','vite.config.ts','src/App.tsx','src/app/build-info.ts',
  'src/app/update-controller.ts','src/domain/calculation/tem.ts','src/domain/session/transition.ts',
  'src/data/repositories/session-repository.ts','public/manifest.webmanifest','public/icons/icon.svg',
  'public/demo/demo-seed.json','docs/claims-matrix.md','docs/protocol-sources.md','docs/release-v1.0.2.md',
  'e2e/blinded-round.spec.ts','e2e/offline.spec.ts','e2e/recovery.spec.ts','e2e/concurrency.spec.ts',
  'e2e/update.spec.ts','e2e/hostile.spec.ts','e2e/accessibility.spec.ts',
];
for(const path of required) assert.equal(existsSync(join(root,path)),true,`missing ${path}`);

const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.engines?.node,'>=24 <25');
for(const script of ['typecheck','lint','test','e2e','build']) assert.equal(typeof pkg.scripts?.[script],'string',`missing npm script ${script}`);

const lock=JSON.parse(read('package-lock.json'));
assert.equal(lock.lockfileVersion,3);
const lockRoot=lock.packages?.[''];
assert.ok(lockRoot,'lockfile root missing');
assert.deepEqual(lockRoot.dependencies,pkg.dependencies,'lockfile root dependencies drifted');
assert.deepEqual(lockRoot.devDependencies,pkg.devDependencies,'lockfile root devDependencies drifted');
const direct=[...Object.keys(pkg.dependencies??{}),...Object.keys(pkg.devDependencies??{})];
const unresolved=direct.filter(name=>!Object.prototype.hasOwnProperty.call(lock.packages??{},`node_modules/${name}`));

const buildInfo=read('src/app/build-info.ts');
const buildVersion = buildInfo.match(/version:\s*'([^']+)'/)?.[1];
const buildId = buildInfo.match(/buildId:\s*'([^']+)'/)?.[1];
assert.equal(buildVersion,pkg.version,'application build version must match package version');
assert.ok(buildId && !/dev|placeholder|unknown|rc/i.test(buildId),'build ID must identify a release build');
assert.match(buildInfo,/dataMode:\s*'SYNTHETIC'/);
assert.match(buildInfo,/scientificParity:\s*'EXTERNAL_ORACLE_PARITY_PENDING'/);

const manifest=JSON.parse(read('public/manifest.webmanifest'));
assert.equal(manifest.name,'TumbuhGuard Standardize');
assert.ok(manifest.icons?.some(icon=>icon.src==='/icons/icon.svg'));
const vite=read('vite.config.ts');
assert.match(vite,/registerType:\s*'prompt'/);
assert.match(vite,/demo\/demo-seed\.json/);
assert.match(vite,/globPatterns:/);
assert.match(vite,/navigateFallback:\s*'index\.html'/);

const seed=JSON.parse(read('public/demo/demo-seed.json'));
assert.equal(seed.dataMode,'SYNTHETIC');
assert.equal(seed.synthetic,true);
assert.equal(seed.fixtures.length,4);
for(const fixture of seed.fixtures) assert.equal(fixture.synthetic,true,fixture.fixtureId);

function collect(dir){
  const out=[];
  for(const entry of readdirSync(join(root,dir),{withFileTypes:true})){
    const relative=join(dir,entry.name);
    if(entry.isDirectory()) out.push(...collect(relative));
    else if(/\.(ts|tsx|css|html|json|webmanifest)$/.test(entry.name)) out.push(relative);
  }
  return out;
}
const runtimeFiles=[...collect('src'),'index.html','public/manifest.webmanifest','public/demo/demo-seed.json'];
const runtime=runtimeFiles.map(path=>`\n/* ${path} */\n${read(path)}`).join('\n');
for(const pattern of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\bWebSocket\s*\(/,/\baxios\b/]) assert.doesNotMatch(runtime,pattern,`runtime network API ${pattern}`);
for(const pattern of [/https?:\/\//i,/Kemenkes certified/i,/WHO certified cadre/i,/is an official Kemenkes certification/i,/AI diagnosis/i,/stunting diagnosis/i]) assert.doesNotMatch(runtime,pattern,`unsafe runtime content ${pattern}`);

const featureText=collect('src/features').map(read).join('\n');
for(const pattern of [/\bNIK\b/i,/type=["']file["']/i,/\bcamera\b/i,/\bphoto\b/i,/child\s+name/i]) assert.doesNotMatch(featureText,pattern,`competition PII/media field ${pattern}`);

const claims=read('docs/claims-matrix.md');
for(const safe of [
  'EXTERNAL_ORACLE_PARITY_PENDING',
  'Application-level revision history with integrity checks',
  'Round-1 values are not exposed',
  'Designed as a proposed practical QA workflow for the Posyandu cadre-training context',
]) assert.match(claims,new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));

const readme=read('README.md');
for(const requiredText of ['all demo data are synthetic','no medical diagnosis','no AI','official certification']) assert.ok(readme.toLowerCase().includes(requiredText.toLowerCase()),`README missing boundary: ${requiredText}`);

console.log(JSON.stringify({
  status:'PASS',
  requiredArtifacts:required.length,
  runtimeFilesScanned:runtimeFiles.length,
  syntheticFixtureCount:seed.fixtures.length,
  runtimeNetworkCalls:'none found',
  runtimeRemoteUrls:'none found',
  competitionPiiMediaInputs:'none found',
  unsafePositiveRuntimeClaims:'none found',
  declaredNodeEngine:pkg.engines.node,
  observedNode:process.version,
  lockfileResolved:unresolved.length===0,
  unresolvedDirectLockEntries:unresolved,
  note:unresolved.length?'Static smoke passes, but the npm release gate remains blocked until registry-backed npm ci resolves and commits the lockfile.':'Lockfile contains resolved direct package entries.',
},null,2));
