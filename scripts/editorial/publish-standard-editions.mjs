import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {editionHash} from './edition-review.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const groups=[['core','core-models.mjs'],['fractions','fraction-models.mjs'],['geometry','geometry-models.mjs']];
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const sourceCache=new Map();
async function sourceReference(ref) {
 assert.ok(typeof ref.sourceFile==='string' && (ref.sourceFile.startsWith('problems/sources/zerek/') || /^frontend\/src\/zerek\w+Questions\.js$/.test(ref.sourceFile)),'Reference must be in the offline archive');
 assert.equal(path.resolve(root,ref.sourceFile).startsWith(root),true,'Reference escaped the repository');
 if(!sourceCache.has(ref.sourceFile)){
  if(ref.sourceFile.endsWith('.json'))sourceCache.set(ref.sourceFile,read(ref.sourceFile).questions);
  else {const mod=await import(pathToFileURL(path.join(root,ref.sourceFile)).href);sourceCache.set(ref.sourceFile,Object.values(mod).find(Array.isArray));}
 }
 const source=sourceCache.get(ref.sourceFile)?.find(q=>(q.sourceContentId||q.id)===ref.sourceId);
 assert.ok(source,'Missing archived source reference '+ref.sourceId);
 return {source,hash:editionHash(source)};
}
export async function prepareStandardEditions() {
 const questions=[],records=[],seen=new Set(),models=new Set();
 for(const [group,verifierFile] of groups){
  const file=`problems/editorial/synaq-standard-${group}.json`;
  const container=read(file),rows=Array.isArray(container)?container:container.editions;
  assert.ok(Array.isArray(rows)&&rows.length,'Missing editorial group '+group);
  const reviews=read(`problems/editorial/reviews/${group}.json`);
  const approved=new Map((Array.isArray(reviews)?reviews:reviews.entries).map(r=>[r.editionId,r]));
  const {verifyEdition}=await import(new URL(verifierFile,import.meta.url));
  for(const row of rows){
   assert.match(row.editionId,/^[a-z0-9-]+$/);
   assert.ok([4,5,6].includes(row.grade));
   assert.ok(['basic','medium','hard'].includes(row.difficulty));
   const review=approved.get(row.editionId);
   assert.equal(review?.verdict,'verified','Independent review is required: '+row.editionId);
   assert.equal(review.sha256,editionHash(row),'Edited after review: '+row.editionId);
   const proof=verifyEdition(row);assert.equal(String(proof.answer),row.answer);
   assert.ok(proof.checks?.length,'Missing independent checks');
   assert.ok(row.statement.trim() && row.solution.trim() && row.answer.trim());
   assert.doesNotMatch(row.statement+row.solution,/[\\$]|\[Image:|\[SVG/,'Unrendered source notation');
   assert.ok(row.sourceRefs?.length && row.adaptationChanges?.length>=2);
   const refs=[];
   for(const ref of row.sourceRefs){
    const {source,hash}=await sourceReference(ref);
    assert.notEqual(clean(row.statement),clean(source.statement),'Original wording cannot be published as an edition');
    refs.push({...ref,sha256:hash});
   }
   if(row.image){
    assert.match(row.image,/^\/figures\/synaq-editions\/[a-z0-9-]+\.svg$/,'Only original SYNAQ edition diagrams allowed');
    const bytes=fs.readFileSync(path.join(root,'frontend/public',row.image));
    assert.equal(sha(bytes),row.figureSha256,'Figure changed after review');
    assert.equal(row.figureReview?.status,'verified');
    assert.match(bytes.toString(),/<svg[^>]+viewBox=/);
    assert.doesNotMatch(bytes.toString(),/<image\b|<script\b|<foreignObject\b|data:image|(?:href|onload|onclick)=/i);
   }
   const id='synaq_adapted_'+row.editionId.replaceAll('-','_');
   assert.ok(!seen.has(id),'Duplicate edition id');seen.add(id);models.add(row.modelId);
   const question={id,school:'Математика',subject:'math',lang:'kk',grade:row.grade,topic:row.topic,difficulty:row.difficulty,practiceOnly:true,
    minimumPlan:'pro',editorialStatus:'verified',sourceProvider:'zerek',sourceAdapted:true,
    statement:row.statement,answer:row.answer,solution:row.solution,...(row.image?{image:row.image}:{})};
   if(row.options){assert.equal(new Set(row.options).size,row.options.length);assert.equal(row.options.filter(x=>x===row.answer).length,1);question.options=row.options;}
   questions.push(question);
   records.push({id,editionId:row.editionId,modelId:row.modelId,editorialFile:file,reviewedEditionSha256:review.sha256,
    independentReview:review,verification:proof,sourceRefs:refs,adaptationChanges:row.adaptationChanges,
    ...(row.image?{figure:{image:row.image,sha256:row.figureSha256,newDrawing:true}}:{})});
  }
 }
 return {questions,report:{schemaVersion:1,date:'2026-10-23',status:'verified_editorial_batch',
  access:{publicName:'Standard',minimumInternalPlan:'pro',includedHigherPlans:['mentor'],excluded:['free','standard (retired)']},
  summary:{verifiedEditions:questions.length,distinctModels:models.size,newFigures:questions.filter(q=>q.image).length,originalSourceTasksPublished:0},
  scope:'This is the first reviewed authored batch. The larger source archive remains closed; source references are not a claim that every captured original has been rewritten.',
  sourceCollection:'Stopped by user at 9645 source occurrences. No further collection is scheduled.',records}};
}
function atomicWrite(relative,value){const filename=path.join(root,relative);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename+'.next',JSON.stringify(value,null,2)+'\n');fs.renameSync(filename+'.next',filename);}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const {questions,report}=await prepareStandardEditions();
 if(process.argv.includes('--check')){
  assert.deepEqual(read('backend/data/synaqAdaptedQuestions.json'),questions,'Server Standard bank is stale');
  assert.deepEqual(read('problems/reviews/synaq-standard-editions.json'),report,'Editorial report is stale');
 }else if(process.argv.includes('--write')){
  atomicWrite('backend/data/synaqAdaptedQuestions.json',questions);
  atomicWrite('problems/reviews/synaq-standard-editions.json',report);
 }else throw Error('Use --write or --check');
 console.log(JSON.stringify(report.summary));
}
