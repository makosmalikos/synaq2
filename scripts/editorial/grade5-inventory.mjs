/** Offline-only accounting. Captures are immutable; this script writes only grade5 batch coverage. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {editionHash} from './edition-review.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const sourceDir='problems/sources/zerek/courses';
const hasContent=v=>Array.isArray(v)?v.length>0:typeof v==='string'?v.trim().length>0:v&&typeof v==='object'?Object.keys(v).length>0:Boolean(v);
export function grade5Sources(){
 const rows=[];
 for(const name of fs.readdirSync(path.join(root,sourceDir)).filter(n=>/^5-math-.*\.json$/.test(n)).sort()){
  const relative=sourceDir+'/'+name,data=JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
  if(data.status!=='captured'||!Array.isArray(data.questions))continue;
  data.questions.forEach((q,index)=>rows.push({sourceId:q.id,sourceFile:relative,sourceIndex:index,sourceSha256:editionHash(q),sourceTopic:data.topic,sourceTitle:data.title,level:data.level,nonvisual:!hasContent(q.images)&&!hasContent(q.svg)&&!/<(?:img|svg)\b/i.test(q.statementHtml||''),checked:q.checked===true,hasAnswer:!!q.sourceAnswer,raw:q}));
 }
 return rows;
}
export function inventory(){
 const all=grade5Sources(),nonvisual=all.filter(q=>q.nonvisual),authored=new Map();
 for(const name of fs.readdirSync(path.join(root,'problems/editorial/batches')).filter(n=>/^grade5-.*\.json$/.test(n)&&n!=='grade5-inventory.json')){
  const data=JSON.parse(fs.readFileSync(path.join(root,'problems/editorial/batches',name),'utf8'));
  for(const row of data.editions||[])for(const ref of row.sourceRefs||[]){if(authored.has(ref.sourceId))throw Error('Source assigned twice: '+ref.sourceId);authored.set(ref.sourceId,{editionId:row.editionId,modelId:row.modelId,status:row.editorialStatus});}
 }
 const groups=new Map();
 for(const q of nonvisual){let g=groups.get(q.sourceTopic);if(!g){g={sourceTopic:q.sourceTopic,title:q.sourceTitle,nonvisualSources:0,authored:0,awaitingRewrite:0,submodels:{},exactStatementGroups:new Map(),numericMaskedGroups:new Map()};groups.set(q.sourceTopic,g);}g.nonvisualSources++;
  const edit=authored.get(q.sourceId);if(edit){g.authored++;g.submodels[edit.modelId]=(g.submodels[edit.modelId]||0)+1;}else g.awaitingRewrite++;
  const exact=q.raw.statement.normalize('NFKC').replace(/\s+/g,' ').trim();for(const [map,key] of [[g.exactStatementGroups,exact],[g.numericMaskedGroups,exact.replace(/\d+(?:[.,]\d+)?/g,'#')]]){if(!map.has(key))map.set(key,[]);map.get(key).push(q.sourceId);}
 }
 const records=nonvisual.map(({raw,...q})=>({...q,...(authored.get(q.sourceId)||{status:'draft',draftReason:'Awaiting a source-specific authored condition, solution, parameter proof and independent review.'})}));
 return {schemaVersion:1,grade:5,scope:'Only immutable, already captured canonical grade5 courses. No network or new collection. An authored row is not publishable until independently reviewed.',sourceOccurrences:all.length,uniqueSourceIds:new Set(all.map(q=>q.sourceId)).size,nonvisualSources:nonvisual.length,visualSourcesOutsideScope:all.length-nonvisual.length,authored:authored.size,awaitingRewrite:nonvisual.length-authored.size,independentReviewSignedByThisScript:false,semanticUniqueness:'Numeric-masked duplicate groups are only lexical diagnostics, never proof of different mathematical meanings.',groups:[...groups.values()].sort((a,b)=>{const x=a.sourceTopic.split('-').map(Number),y=b.sourceTopic.split('-').map(Number);return x[0]-y[0]||x[1]-y[1];}).map(({exactStatementGroups,numericMaskedGroups,...g})=>({...g,exactDuplicateGroups:[...exactStatementGroups.values()].filter(a=>a.length>1),numericMaskedDuplicateGroups:[...numericMaskedGroups.values()].filter(a=>a.length>1)})),records};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const data=inventory();fs.writeFileSync(path.join(root,'problems/editorial/batches/grade5-inventory.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({nonvisual:data.nonvisualSources,authored:data.authored,awaitingRewrite:data.awaitingRewrite,topics:data.groups.length}));}
