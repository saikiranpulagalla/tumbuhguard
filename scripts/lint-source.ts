import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function filesUnder(root: string): Promise<string[]> {
  const out: string[]=[];
  for (const entry of await readdir(root,{withFileTypes:true})) {
    const path=join(root,entry.name);
    if (entry.isDirectory()) out.push(...await filesUnder(path));
    else if (/\.(ts|tsx|css|mjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}

const files=[...await filesUnder('src'),...await filesUnder('tests'),...await filesUnder('e2e'),...await filesUnder('scripts')];
const failures:string[]=[];
const forbiddenTsIgnore='@ts-'+'ignore';
const unsafeAny=new RegExp('\\bas '+'any\\b');
for (const file of files) {
  const body=await readFile(file,'utf8');
  body.split('\n').forEach((line,index)=>{
    if (/\s+$/.test(line)) failures.push(`${file}:${index+1}: trailing whitespace`);
    if (line.includes('\t')) failures.push(`${file}:${index+1}: tab character`);
    if (line.includes(forbiddenTsIgnore)) failures.push(`${file}:${index+1}: ${forbiddenTsIgnore} is not allowed`);
  });
  if (unsafeAny.test(body)) failures.push(`${file}: unsafe type-erasing cast`);
}
if (failures.length) throw new Error(`Source hygiene failed:\n${failures.join('\n')}`);
console.log(`lint-source: ${files.length} source/test files checked`);
