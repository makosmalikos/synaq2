import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {transformWithOxc} from '../frontend/node_modules/vite/dist/node/index.js';
import {fetchPrivateFigure,isPrivateFigure,MAX_FIGURE_BYTES} from '../frontend/src/privateFigures.js';
const qid='synaq_adapted_geometry_courtyard_corner';
function fixture(){const auth={currentUser:{uid:'child-a',getIdToken:async()=> 'not-a-real-token'}};return{auth,loadAuth:async()=>({auth})};}
test('protected figures use POST Bearer and binary blobs, without URL tokens, public fetch or shared cache',async()=>{
 const f=fixture(),calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return new Response('<svg/>',{headers:{'Content-Type':'image/svg+xml'}});};
 const blob=await fetchPrivateFigure(qid,{...f,fetcher});assert.equal(await blob.text(),'<svg/>');assert.equal(blob.type,'image/svg+xml');
 assert.equal(calls[0].url,'/api/learning');assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.headers.Authorization,'Bearer not-a-real-token');assert.deepEqual(JSON.parse(calls[0].options.body),{action:'figure',qid});
 await fetchPrivateFigure(qid,{...f,fetcher});assert.equal(calls.length,2,'There is no persistent cross-user blob cache');
 assert.equal(isPrivateFigure('/figures/synaq-editions/a.svg'),true);assert.equal(isPrivateFigure('/figures/bil_v1_q14.svg'),false);
});
test('figure client rejects denied/non-SVG/oversized responses and switched or aborted identities',async()=>{
 for(const response of [new Response('{}',{status:403}),new Response('HTML',{headers:{'Content-Type':'text/html'}}),new Response('<svg/>',{headers:{'Content-Type':'image/svg+xml','Content-Length':String(MAX_FIGURE_BYTES+1)}}),new Response(new Uint8Array(MAX_FIGURE_BYTES+1),{headers:{'Content-Type':'image/svg+xml'}})]){
  await assert.rejects(fetchPrivateFigure(qid,{...fixture(),fetcher:async()=>response}),/figure-unavailable/);
 }
 const f=fixture();await assert.rejects(fetchPrivateFigure(qid,{...f,fetcher:async()=>{f.auth.currentUser={uid:'child-b'};return new Response('<svg/>',{headers:{'Content-Type':'image/svg+xml'}});}}),/figure-unavailable/);
 const g=fixture();g.auth.currentUser.getIdToken=async()=>{g.auth.currentUser=null;return 'token';};let fetched=false;await assert.rejects(fetchPrivateFigure(qid,{...g,fetcher:async()=>{fetched=true;}}));assert.equal(fetched,false);
 const controller=new AbortController();controller.abort();await assert.rejects(fetchPrivateFigure(qid,{...fixture(),signal:controller.signal,fetcher:async()=>{throw Error('must not fetch');}}));
});
test('render component never renders a protected public src and owns cancellation, retry and URL disposal',()=>{
 const code=fs.readFileSync(new URL('../frontend/src/components/QuestionFigure.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(code,/<img\s+src=\{src\}/);assert.match(code,/URL\.revokeObjectURL/);assert.match(code,/controller\.abort\(\)/);assert.match(code,/setRetry/);assert.match(code,/loaded\?\.source===src&&loaded\?\.questionId===questionId/);
 const loader=fs.readFileSync(new URL('../frontend/src/privateFigures.js',import.meta.url),'utf8');assert.doesNotMatch(loader,/^import.*firebase/m);assert.match(loader,/import\('\.\/firebase\.js'\)/);
});

test('real React first paint hides protected sources while public diagrams keep their existing URLs',async()=>{
 const require=createRequire(new URL('../frontend/package.json',import.meta.url)),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const source=fs.readFileSync(new URL('../frontend/src/components/QuestionFigure.jsx',import.meta.url),'utf8')
  .replace("import { useLang } from '../i18n.jsx';","const useLang=()=>({lang:'ru'});");
 const transformed=await transformWithOxc(source,'QuestionFigure.jsx');
 const code=transformed.code.replace(/^import ["']\.\/QuestionFigure\.css["'];\s*/m,'').replace(/from "([^"]+)"/g,(_all,specifier)=>{
  const target=specifier==='../privateFigures.js'?new URL('../frontend/src/privateFigures.js',import.meta.url).href:pathToFileURL(require.resolve(specifier)).href;
  return 'from '+JSON.stringify(target);
 });
 const {default:Figure}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const protectedHtml=renderToStaticMarkup(React.createElement(Figure,{src:'/figures/synaq-editions/secret.svg',questionId:qid}));
 assert.doesNotMatch(protectedHtml,/<img|synaq-editions|secret\.svg/);assert.match(protectedHtml,/role="status"/);
 const publicHtml=renderToStaticMarkup(React.createElement(Figure,{src:'/figures/bil_v1_q14.svg'}));
 assert.match(publicHtml,/<img src="\/figures\/bil_v1_q14\.svg"/);
});
