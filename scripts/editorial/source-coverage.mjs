// Accounting for the frozen archive. This report never publishes questions.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {editionHash} from './edition-review.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const ORIGINAL_MODULES=[
 ['zerekReviewedQuestions.js','zerekReviewedQuestions'],
 ['zerekImportedQuestions.js','zerekImportedQuestions'],
 ['zerekCourseQuestions.js','zerekCourseQuestions'],
 ['zerekCourseExpansionQuestions.js','zerekCourseExpansionQuestions'],
];
const tally=values=>values.reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{});
const read=async(root,file)=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const refKey=ref=>`${ref.sourceFile}#${ref.sourceId}`;
const hasVisual=q=>Boolean(q.images?.length||q.svg?.length||q.image||q.options?.some(o=>o.images?.length||o.svg?.length||o.image));
const collectionId=url=>String(url||'').match(/\/tests\/([a-f0-9-]+)(?:[/?#]|$)/i)?.[1];

export function reconcileEditorialCoverage(sources,aliases,verified,drafts,duplicates) {
 const byKey=new Map(sources.map(row=>[row.key,{...row,verifiedEditions:[],draftEditions:[]}]));
 const unresolved=[];
 for(const [rows,field] of [[verified,'verifiedEditions'],[drafts,'draftEditions']]) {
  for(const row of rows) for(const ref of row.sourceRefs||[]) {
   const keys=aliases.get(refKey(ref));
   if(!keys?.size){unresolved.push({editionId:row.editionId||row.id,ref});continue;}
   for(const key of keys) {
    const target=byKey.get(key);
    assert.ok(target,'Alias points outside the frozen source registry');
    const id=row.editionId||row.id;
    if(!target[field].includes(id))target[field].push(id);
   }
  }
 }
 // A duplicate becomes covered only after its actual original has a verified edition.
 // Repeated source IDs alone do not turn a draft into a completed adaptation.
 const inherited=(key,seen=new Set())=>{
  if(seen.has(key))return [];
  seen.add(key);
  const row=byKey.get(key);
  if(row?.verifiedEditions.length)return row.verifiedEditions;
  const parents=duplicates.get(key)||[];
  return [...new Set(parents.filter(parent=>parent!==key).flatMap(parent=>inherited(parent,new Set(seen))))];
 };
 for(const row of byKey.values()) {
  row.verifiedEditions.sort();row.draftEditions.sort();
  const viaDuplicate=row.verifiedEditions.length?[]:inherited(row.key);
  row.status=row.verifiedEditions.length?'linked_verified_edition':viaDuplicate.length?'duplicate_with_verified_edition':row.draftEditions.length?'draft_edition':'pending_adaptation';
  if(viaDuplicate.length)row.duplicateVerifiedEditions=viaDuplicate.sort();
 }
 return {records:[...byKey.values()].sort((a,b)=>a.key.localeCompare(b.key)),unresolved};
}

export async function collectEditorialSourceCoverage(root=ROOT) {
 const sources=[],aliases=new Map(),legacyAliases=new Map();
 const addAlias=(key,sourceKey)=>{
  if(!aliases.has(key))aliases.set(key,new Set());
  aliases.get(key).add(sourceKey);
 };
 const coursesById=new Map(),collectionsByNumber=new Map();
 const catalog=await read(root,'problems/sources/zerek/catalog.json');
 for(const entry of catalog.collections) {
  const id=collectionId(entry.path);
  assert.ok(id,'Invalid canonical collection path');
  const file=`problems/sources/zerek/collections/${id}.json`,capture=await read(root,file);
  assert.equal(capture.sourceReviewCaptured,true);
  assert.equal(capture.questions.length,entry.questionCount);
  for(const q of capture.questions) {
   const key=`collection:${id}:${q.number}`;
   const sourceId=String(q.number),gradeMatch=String(capture.title).match(/([1-9])\s*[-–]?\s*(?:сынып|класс)/i);
   sources.push({key,kind:'collection',sourceFile:file,sourceId,sourceNumber:q.number,
    sourceSha256:editionHash(q),title:capture.title,school:entry.school,
    ...(gradeMatch?{sourceGrade:Number(gradeMatch[1])}:{}),visual:hasVisual(q)});
   collectionsByNumber.set(`${id}:${q.number}`,key);
   addAlias(`${file}#${sourceId}`,key);
  }
 }
 const directory='problems/sources/zerek/courses';
 for(const name of (await fs.readdir(path.join(root,directory))).sort()) {
  if(!/^[456]-math-.+-level(?:[123]|test)\.json$/.test(name))continue;
  const file=`${directory}/${name}`,capture=await read(root,file);
  if(capture.status!=='captured')continue;
  assert.ok([4,5,6].includes(capture.grade));
  assert.equal(capture.questions.length,capture.expected);
  for(const q of capture.questions) {
   assert.equal(q.checked,true);
   const key=`course:${name}:${q.id}`;
   sources.push({key,kind:'course',sourceFile:file,sourceId:q.id,sourceSha256:editionHash(q),
    grade:capture.grade,level:capture.level,title:capture.title,visual:hasVisual(q)});
   addAlias(`${file}#${q.id}`,key);
   if(!coursesById.has(q.id))coursesById.set(q.id,[]);
   coursesById.get(q.id).push({key,url:capture.url,grade:capture.grade});
  }
 }
 for(const [filename,exportName] of ORIGINAL_MODULES) {
  const file=`frontend/src/${filename}`,module=await import(pathToFileURL(path.join(root,file)).href);
  for(const q of module[exportName]) {
   let keys;
   if(q.sourceContentId) {
    const candidates=(coursesById.get(q.sourceContentId)||[]).filter(r=>r.grade===q.grade);
    const exact=candidates.filter(r=>r.url===q.sourceUrl);
    keys=(exact.length?exact:candidates).map(r=>r.key);
   }else{
    const key=collectionsByNumber.get(`${collectionId(q.sourceUrl)}:${q.sourceNumber}`);
    keys=key?[key]:[];
   }
   assert.ok(keys.length,'Original module is not linked to a captured occurrence: '+q.id);
   legacyAliases.set(q.id,new Set(keys));
   for(const key of keys)addAlias(`${file}#${q.sourceContentId||q.id}`,key);
  }
 }
 const duplicates=new Map();
 const dispositions=await read(root,'problems/sources/zerek/import-dispositions.json');
 for(const row of dispositions.records.filter(r=>r.status==='duplicate')) {
  const key=collectionsByNumber.get(`${row.collection}:${row.number}`);
  if(key)duplicates.set(key,[...(legacyAliases.get(row.duplicateOf)||[])]);
 }
 const expansion=await read(root,'problems/sources/zerek/courses/expansion-dispositions.json');
 for(const row of expansion.records.filter(r=>r.status==='duplicate')) {
  const key=`course:${row.file}:${row.sourceContentId}`;
  if(sources.some(r=>r.key===key))duplicates.set(key,[...(legacyAliases.get(row.duplicateOf)||[])]);
 }
 const approved=await read(root,'problems/reviews/synaq-standard-editions.json');
 const published=await read(root,'backend/data/synaqAdaptedQuestions.json');
 const liveIds=new Set(published.map(q=>q.id));
 const verified=approved.records.filter(r=>liveIds.has(r.id));
 const verifiedEditionIds=new Set(verified.map(r=>r.editionId));
 const drafts=[],batchDirectory='problems/editorial/batches';
 let batchFiles=[];
 try {batchFiles=await fs.readdir(path.join(root,batchDirectory));}catch(error){if(error.code!=='ENOENT')throw error;}
 for(const name of batchFiles.filter(n=>n.endsWith('.json')).sort()) {
  const file=`${batchDirectory}/${name}`,data=await read(root,file);
  const rows=Array.isArray(data)?data:data.editions;
  if(!Array.isArray(rows))continue;
  for(const row of rows)if(row.editionId&&Array.isArray(row.sourceRefs)&&!verifiedEditionIds.has(row.editionId))drafts.push(row);
 }
 const result=reconcileEditorialCoverage(sources,aliases,verified,drafts,duplicates);
 assert.equal(sources.length,9645,'The user froze collection at 9645 source occurrences');
 assert.equal(new Set(sources.map(r=>r.key)).size,sources.length);
 const statuses=tally(result.records.map(r=>r.status));
 return {schemaVersion:1,collectionStopped:true,pushOnHoldUntilFullEditorialCompletion:true,
  summary:{capturedSourceOccurrences:sources.length,byKind:tally(sources.map(r=>r.kind)),
   byStatus:statuses,verifiedLocalEditions:published.length,draftEditions:drafts.length,
   fullyProcessed:result.records.every(r=>['linked_verified_edition','duplicate_with_verified_edition'].includes(r.status))&&result.unresolved.length===0},
  counting:'Source links show which captured conditions have a reviewed curriculum edition. They do not prove 9645 different meanings. Numerical variants are retained; exact duplicates require an explicit original link. Drafts never count as verified.',
  unresolvedReferences:result.unresolved,records:result.records};
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const report=await collectEditorialSourceCoverage();
 assert.equal(report.unresolvedReferences.length,0,'Unresolved editorial source reference');
 if(process.argv.includes('--write')) {
  const destination=path.join(ROOT,'problems/editorial/source-coverage.json');
  await fs.writeFile(destination+'.next',JSON.stringify(report,null,2)+'\n');
  await fs.rename(destination+'.next',destination);
 }
 console.log(JSON.stringify(report.summary));
 if(process.argv.includes('--require-complete')&&!report.summary.fullyProcessed)process.exitCode=1;
}
