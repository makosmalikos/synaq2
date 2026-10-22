import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const css=fs.readFileSync(new URL('../frontend/src/platform-fonts.css',import.meta.url),'utf8');
const root=new URL('../frontend/public/fonts/platform/',import.meta.url);
test('cabinet fonts are self-hosted WOFF2 with Kazakh/Cyrillic coverage, licenses and bounded total size',()=>{
 assert.doesNotMatch(css,/@import|https?:\/\//);
 const sources=JSON.parse(fs.readFileSync(new URL('sources.json',root),'utf8'));
 let bytes=0;
 for(const family of ['Geologica','Golos Text','Lora','IBM Plex Mono']){
  const blocks=[...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map(x=>x[0]).filter(x=>x.includes(`'${family}'`));
  assert.ok(blocks.length>=3,family);
  assert.ok(blocks.some(x=>x.includes('U+0460-052F')),`${family}: Kazakh extensions`);
  assert.ok(blocks.some(x=>x.includes('U+0400-045F')),`${family}: Cyrillic`);
  for(const block of blocks)assert.match(block,/font-display: optional/);
 }
 for(const [,file] of css.matchAll(/url\('\/fonts\/platform\/([^']+)'\)/g)){
  const data=fs.readFileSync(new URL(file,root));bytes+=data.length;
  assert.equal(data.subarray(0,4).toString(),'wOF2',file);
  const source=sources.find(x=>x.file===file);assert.ok(source,file);
  assert.equal(createHash('sha256').update(data).digest('hex'),source.sha256,file);
 }
 assert.ok(bytes<320000,`All platform font subsets: ${bytes} bytes`);
 for(const name of ['geologica','golos-text','lora','ibm-plex-mono'])assert.match(fs.readFileSync(new URL(`${name}-LICENSE.txt`,root),'utf8'),/SIL OPEN FONT LICENSE/i);
});
