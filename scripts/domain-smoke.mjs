import assert from 'node:assert/strict';

const pairs = [{subjectId:'a',first:80,second:79.8},{subjectId:'b',first:90,second:89.8}];
const sumSquares = pairs.reduce((s,p)=>s+(p.first-p.second)**2,0);
const tem = Math.sqrt(sumSquares/(2*pairs.length));
assert.ok(Math.abs(tem - 0.1414213562373095) < 1e-12);
const rows=[{traineeMean:81,referenceMean:80},{traineeMean:79,referenceMean:80}];
const bias=rows.reduce((s,r)=>s+r.traineeMean-r.referenceMean,0)/rows.length;
const agreement=Math.sqrt(rows.reduce((s,r)=>s+(r.traineeMean-r.referenceMean)**2,0)/(2*rows.length));
assert.equal(bias,0);
assert.ok(agreement > 0.7);
console.log(JSON.stringify({tem,bias,agreement},null,2));
