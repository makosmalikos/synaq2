import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { transformWithOxc } from '../frontend/node_modules/vite/dist/node/index.js';
const require=createRequire(new URL('../frontend/package.json',import.meta.url)),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync(new URL('../frontend/src/ParentReport.jsx',import.meta.url),'utf8');
const transformed=await transformWithOxc(source,'ParentReport.jsx');
const code=transformed.code.replace(/^import ["'][^"']+\.css["'];\s*/gm,'').replace(/from ["']([^"']+)["']/g,(_,name)=>`from ${JSON.stringify(name.startsWith('.')?new URL('../frontend/src/'+name,import.meta.url).href:pathToFileURL(require.resolve(name)).href)}`);
const {default:ParentReport}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const render=(extra={})=>renderToStaticMarkup(React.createElement(ParentReport,{child:{name:'Демо'},summary:{topics:[]},lang:'ru',...extra}));

test('failed diagnostic history has an explicit retry state instead of claiming no diagnostic exists',()=>{
 const page=render({diagnosticsReady:false,onRetry(){}});
 assert.match(page,/role="alert"/);assert.match(page,/Диагностика пока недоступна/);assert.match(page,/Повторить загрузку/);
 assert.doesNotMatch(page,/Познакомимся с сильными сторонами/);
});
test('a confirmed empty diagnostic history keeps its normal first-step message',()=>{
 const page=render({diagnosticsReady:true});assert.match(page,/Познакомимся с сильными сторонами/);assert.doesNotMatch(page,/Диагностика пока недоступна/);
});
