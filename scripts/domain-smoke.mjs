import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root=process.cwd();
const out=mkdtempSync(join(tmpdir(),'tumbuhguard-domain-'));
const sources=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())walk(path);else if(entry.name.endsWith('.ts'))sources.push(path)}}
walk(join(root,'src/domain'));
sources.push(join(root,'src/app/workflow.ts'),join(root,'src/fixtures/demo.ts'));
const compile=spawnSync('tsc',['--strict','--noUncheckedIndexedAccess','--exactOptionalPropertyTypes','--target','ES2022','--module','CommonJS','--moduleResolution','Node','--lib','ES2022,DOM','--outDir',out,...sources],{encoding:'utf8'});
if(compile.status!==0){process.stderr.write(compile.stdout);process.stderr.write(compile.stderr);process.exit(compile.status??1)}

const require=createRequire(import.meta.url);
const calc=require(join(out,'domain/calculation/index.js'));
const evaluator=require(join(out,'domain/protocol/evaluator.js'));
const profile=require(join(out,'domain/protocol/profile.js'));
const parser=require(join(out,'domain/schemas/measurement-input.js'));
const transitionModule=require(join(out,'domain/session/transition.js'));
const invariants=require(join(out,'domain/protocol/invariants.js'));
const blindSelectors=require(join(out,'domain/session/selectors.js'));
const restandardization=require(join(out,'domain/session/restandardization.js'));
const fixtures=require(join(out,'fixtures/demo.js'));
const workflow=require(join(out,'app/workflow.js'));
const { repeatabilityTEM, referenceAgreementTEM, signedMeanDifference }=calc;
const { evaluateStandardization, passesStrictThreshold }=evaluator;
const { WORKING_STANDARDIZATION_PROFILE }=profile;
const { transition }=transitionModule;

const close=(actual,expected,tol=1e-9)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);
const pairForTem=(id,tem)=>({subjectId:id,first:100,second:100-tem*Math.sqrt(2)});
const validRef=pairForTem('S01',0.1);

assert.equal(repeatabilityTEM([{subjectId:'S01',first:80,second:80}]),0);
close(repeatabilityTEM([{subjectId:'S01',first:80,second:79.8},{subjectId:'S02',first:90,second:89.8}]),0.1414213562373095,1e-12);
assert.equal(passesStrictThreshold(0.599999,0.6),true);
assert.equal(passesStrictThreshold(0.6,0.6),false);
assert.equal(passesStrictThreshold(0.399999,0.4),true);
assert.equal(passesStrictThreshold(0.4,0.4),false);
assert.equal(passesStrictThreshold(0.799999,0.8),true);
assert.equal(passesStrictThreshold(0.8,0.8),false);
const rawBoundary=0.59996; assert.equal(rawBoundary.toFixed(3),'0.600'); assert.equal(passesStrictThreshold(rawBoundary,0.6),true);
const cancel=[{subjectId:'S01',traineeMean:81,referenceMean:80},{subjectId:'S02',traineeMean:79,referenceMean:80}];
assert.equal(signedMeanDifference(cancel),0); close(referenceAgreementTEM(cancel),Math.sqrt(0.5),1e-12);
assert.throws(()=>repeatabilityTEM([])); assert.throws(()=>repeatabilityTEM([{subjectId:'x',first:80,second:80.1},{subjectId:'x',first:81,second:81.1}]));
const ordered=[{subjectId:'S01',first:80,second:79.8},{subjectId:'S02',first:90,second:89.6}];
const reversed=[ordered[1],ordered[0]]; close(repeatabilityTEM(ordered),repeatabilityTEM(reversed));
assert.deepEqual(parser.parseMeasurementInput('80,2'),{ok:true,valueCm:80.2});
for(const rawInput of ['', '0', '-1', 'NaN', 'Infinity', '80,2,3','999']) assert.equal(parser.parseMeasurementInput(rawInput).ok,false,rawInput);

const a=fixtures.evaluateDemoFixture('cadre-a-good'); assert.equal(a.precisionPass,true); assert.equal(a.referencePass,true);
const b=fixtures.evaluateDemoFixture('cadre-b-cancellation'); assert.equal(b.precisionPass,false); close(b.signedDifference,0);
const c=fixtures.evaluateDemoFixture('cadre-c-systematic-low'); close(c.precisionTEM,0.07071067811865475); close(c.referenceTEM,0.848528137423857); close(c.signedDifference,-1.2); assert.equal(c.referencePass,false);
const invalid=fixtures.evaluateDemoFixture('invalid-reference'); assert.equal(invalid.referenceValid,false); assert.equal(invalid.referenceTEM,null); assert.equal(invalid.referencePass,null);

const draft=fixtures.createDemoSession();
invariants.assertSetupIntegrity(draft);
const blind=blindSelectors.selectBlindRoundSubjects(draft); assert.equal(Object.prototype.hasOwnProperty.call(blind[0],'round1Value'),false);
const setup=transition(draft,{type:'VALIDATE_SETUP'}); assert.equal(setup.state,'SETUP_VALID');
assert.throws(()=>transition(draft,{type:'OPEN_ROUND_2'}));
const round1=transition(setup,{type:'OPEN_ROUND_1'});
const station=round1.stations[0];
const m={id:'smoke-m1',sessionId:round1.id,measurerId:round1.trainee.id,subjectId:station.subjectId,stationId:station.id,round:1,valueCm:80.2,position:station.expectedPosition,revision:0,recordedAt:'2026-10-03T01:00:00Z'};
const once=transition(round1,{type:'RECORD_MEASUREMENT',measurement:m});
assert.throws(()=>transition(once,{type:'RECORD_MEASUREMENT',measurement:{...m,id:'smoke-m1-duplicate'}}));
assert.throws(()=>workflow.calculateSession(draft));
const parent={...draft,state:'REMEDIATION',revision:9};
const child=restandardization.createRestandardizationSession(parent,'child-smoke','2026-10-03T01:00:00Z');
assert.equal(child.parentSessionId,parent.id); assert.equal(child.state,'DRAFT'); assert.equal(child.measurements.length,0); assert.equal(parent.state,'REMEDIATION');

console.log(JSON.stringify({
  status:'PASS',
  compiledSourceFiles:sources.length,
  cadreA:{precisionTEM:a.precisionTEM,referenceTEM:a.referenceTEM},
  cadreB:{precisionTEM:b.precisionTEM,signedDifference:b.signedDifference},
  cadreC:{precisionTEM:c.precisionTEM,referenceTEM:c.referenceTEM,signedDifference:c.signedDifference},
  invalidReference:{referenceValid:invalid.referenceValid,referenceTEM:invalid.referenceTEM},
  externalOracleParity:'EXTERNAL_ORACLE_PARITY_PENDING',
},null,2));
rmSync(out,{recursive:true,force:true});
