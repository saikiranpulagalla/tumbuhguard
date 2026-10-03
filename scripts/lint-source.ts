import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function filesUnder(root: string): Promise<string[]> {
  const out: string[]=[];
  for (const entry of await readdir(root,{withFileTypes:true})) {
    const path=join(root,entry.name);
    if (entry.isDirectory()) out.push(...await filesUnder(path));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(path);
  }
  return out;
}

const files=[...await filesUnder('src'),...await filesUnder('tests'),...await filesUnder('e2e')];
const failures:string[]=[];
for (const file of files) {
  const body=await readFile(file,'utf8');
  body.split('\n').forEach((line,index)=>{
    if (/\s+$/.test(line)) failures.push(`${file}:${index+1}: trailing whitespace`);
    if (line.includes('\t')) failures.push(`${file}:${index+1}: tab character`);
    if (line.includes('@ts-ignore')) failures.push(`${file}:${index+1}: @ts-ignore is not allowed`);
  });
  if (/\bas any\b/.test(body)) failures.push(`${file}: unsafe "as any" cast`);
}
if (failures.length) throw new Error(`Source hygiene failed:\n${failures.join('\n')}`);
console.log(`lint-source: ${files.length} source/test files checked`);
