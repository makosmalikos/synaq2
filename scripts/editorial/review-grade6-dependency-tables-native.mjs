// External observer of actual MathText SSR MathML; no author models/params.
import fs from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
import {transformWithOxc} from '../../frontend/node_modules/vite/dist/node/index.js';import {editionHash} from './edition-review.mjs';
const require=createRequire(new URL('../../frontend/package.json',import.meta.url)),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync(new URL('../../frontend/src/components/MathText.jsx',import.meta.url),'utf8'),transformed=await transformWithOxc(source,'MathText.jsx');
const code=transformed.code.replace(/^import "\.\/MathText\.css";\s*/m,'').replace(/from "([^"]+)"/g,(all,specifier)=>{const target=specifier==='../mathPresentation.js'?new URL('../../frontend/src/mathPresentation.js',import.meta.url).href:pathToFileURL(require.resolve(specifier)).href;return `from ${JSON.stringify(target)}`;});
const{default:MathText}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64')),rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade6-dependency-tables.json',import.meta.url),'utf8')).editions;
console.log(JSON.stringify(rows.map(r=>({editionId:r.editionId,sha256:editionHash(r),html:renderToStaticMarkup(React.createElement(MathText,{text:r.statement}))}))));
