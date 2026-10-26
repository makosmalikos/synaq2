import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {privateContentBoundary,privateContentPath} from '../frontend/privateContent.js';

test('Vite dev and preview guards close direct, @fs, raw, encoded and source-JS bypasses',()=>{
 for(const hook of ['configureServer','configurePreviewServer']){
  let middleware;privateContentBoundary()[hook]({middlewares:{use(fn){middleware=fn;}}});
  for(const url of ['/figures/synaq-editions/a.svg','/public/figures/synaq-editions/a.svg','/@fs/Users/project/frontend/public/figures/synaq-editions/a.svg?raw','/figures/x/../synaq-editions/a.svg','/%66igures/%73ynaq-editions/a.svg','/figures%252fsynaq-editions/a.svg','/%5cfigures%5csynaq-editions%5ca.svg','/figures%255csynaq-editions%255ca.svg','/src%255czerekQuestions.js%253Fraw','/@fs%5cproject%5cbackend%5cdata%5csynaqAdaptedQuestions.json','/FIGURES/SYNAQ-EDITIONS/a.svg','/src/zerekQuestions.js?raw','/src/zerekQuestions.js%253Fraw','/src/zerekCourseExpansionQuestions.js?url','/@fs/project/backend/data/synaqAdaptedQuestions.json','/@fs/project/problems/sources/zerek/capture.json']){
   let next=false;const response={setHeader(){},end(v){this.body=v;}};middleware({url},response,()=>next=true);assert.equal(next,false,url);assert.equal(response.statusCode,404,url);assert.equal(response.body,'Not found');
  }
  for(const url of ['/api/learning','/figures/bil_v1_q14.svg','/src/PlatformApp.jsx','/assets/index.js']){let next=false;middleware({url},{},()=>next=true);assert.equal(next,true,url);}
 }
});
test('build copier excludes all paid/original SVGs, removes stale deploy copies and preserves editorial originals',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'synaq-figure-build-'));
 try{
  const pub=path.join(tmp,'public'),dist=path.join(tmp,'dist');await fs.mkdir(path.join(pub,'figures'),{recursive:true});
  await fs.writeFile(path.join(pub,'figures/free.svg'),'<svg>free</svg>');
  for(const name of ['synaq-editions','zerek','zerek-courses']){await fs.mkdir(path.join(pub,'figures',name));await fs.writeFile(path.join(pub,'figures',name,'private.svg'),'<svg>private</svg>');await fs.mkdir(path.join(dist,'figures',name),{recursive:true});await fs.writeFile(path.join(dist,'figures',name,'stale.svg'),'stale');}
  const plugin=privateContentBoundary();plugin.configResolved({root:tmp,publicDir:pub,build:{outDir:'dist'}});await plugin.closeBundle();
  assert.equal(await fs.readFile(path.join(dist,'figures/free.svg'),'utf8'),'<svg>free</svg>');
  for(const name of ['synaq-editions','zerek','zerek-courses']){await assert.rejects(fs.stat(path.join(dist,'figures',name)));assert.equal(await fs.readFile(path.join(pub,'figures',name,'private.svg'),'utf8'),'<svg>private</svg>');}
  const context={error(message){throw Error(message);}};assert.throws(()=>plugin.resolveId.call(context,'../public/figures/synaq-editions/private.svg',path.join(tmp,'src/main.js')),/authenticated API/);assert.throws(()=>plugin.load.call(context,path.join(pub,'figures/synaq-editions/private.svg')+'?raw'),/authenticated API/);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
