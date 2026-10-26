import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {parseSourceExpression} from './grade4-arithmetic-models.mjs';
import {solveEquation,equationFamily,renderEdition,verifyEdition} from './grade4-equation-models.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json');
const existing=read('problems/editorial/batches/grade4-core-wave1.json').editions;
const prior=new Set(existing.flatMap(q=>q.sourceRefs.map(ref=>ref.sourceId)));
const cache=new Map(),editions=[],decisions=[];
const scalar=tex=>{const t=String(tex).replace(/\$/g,'').replace(/\\[,;!]/g,'').replace(/\s/g,'');assert(/^\d+$/.test(t));return t.replace(/^0+(?=\d)/,'');};
function randomSource(seed){let state=parseInt(seed.slice(0,8),16)>>>0;return max=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)%max;};}
function mutate(tree,random){
  if(tree.variable)return tree;
  if(Object.hasOwn(tree,'value')){
    if(tree.value<=1||/^10*$/.test(String(tree.value)))return tree;
    return {value:Number([...String(tree.value)].map(d=>d==='0'?'0':String(1+random(9))).join(''))};
  }
  return {op:tree.op,left:mutate(tree.left,random),right:tree.op==='^'?tree.right:mutate(tree.right,random)};
}
const statements=new Set(existing.map(q=>q.statement));
for(const record of inventory.records){
  if(prior.has(record.sourceId)||record.existingEditionIds.length)continue;
  if(!cache.has(record.sourceFile))cache.set(record.sourceFile,read(record.sourceFile));
  const capture=cache.get(record.sourceFile),q=capture.questions.find(q=>q.id===record.sourceId);
  const matches=[...q.statement.matchAll(/\$([^$]+)\$/g)];
  if(matches.length!==1||!/^Теңдеуді шешіңдер[.:,\s]*$/.test(q.statement.replace(matches[0][0],'').trim()))continue;
  try{
    assert(capture.status==='captured'&&q.checked);
    const tex=matches[0][1],variables=[...new Set(tex.replace(/\\[a-zA-Z]+/g,'').match(/[a-z]/g)||[])];
    assert(variables.length===1&&tex.split('=').length===2,'Exactly one variable and one equality required');
    const [leftText,rightText]=tex.split('='),left=parseSourceExpression(leftText,variables[0]),right=parseSourceExpression(rightText,variables[0]);
    const original=solveEquation(left,right);assert.equal(original.answer,scalar(q.sourceAnswer),'Original equation and key must agree');
    const correct=(q.options||[]).filter(choice=>choice.correct);if(correct.length)assert(correct.length===1&&scalar(correct[0].text)===original.answer);
    const random=randomSource(q.id);let chosen;
    for(let attempt=0;attempt<12000;attempt++){
      try{
        const params={left:mutate(left,random),right:mutate(right,random)};
        assert.equal(equationFamily(params.left),equationFamily(left),'Retain left-side digit/zero/one structure');
        assert.equal(equationFamily(params.right),equationFamily(right),'Retain right-side digit/zero/one structure');
        if(JSON.stringify(params)===JSON.stringify({left,right}))continue;
        const solved=solveEquation(params.left,params.right);
        assert(solved.answer.length===original.answer.length,'Retain the grade-4 solution magnitude');
        const rendered=renderEdition({modelId:'grade4-inverse-operation-equation',grade:4,params});
        if(statements.has(rendered.statement))continue;
        chosen={params,rendered};break;
      }catch{/* A nonintegral, negative, or ambiguous numeric candidate is rejected. */}
    }
    assert(chosen,'No exact whole-number rewrite in the finite search');
    const row={editionId:`grade4-equation-${q.id}`,modelId:'grade4-inverse-operation-equation',grade:4,topic:'eq',
      difficulty:/level1\.json$/.test(record.sourceFile)?'easy':/level2\.json$/.test(record.sourceFile)?'medium':'hard',params:chosen.params,
      sourceRefs:[{sourceFile:record.sourceFile,sourceId:q.id}],adaptationChanges:[
        'Теңдеудің сандық деректері өзгертілді; белгісізді табу шарты қазақша қайта жазылды.',
        'Кері амалдар арқылы жаңа бүтін шешім табылып, жаңа теңдеудің екі жағына қойып тексерілді.',
        'Амалдардың реті және белгісіздің орналасу дағдысы сақталды; дайын жауап не шешім көшірілмеді.'
      ],relationToSource:'Numeric equation edition retaining the location of the unknown and inverse-operation skill. Numeric variants are not distinct semantic stories.',
      sourceSkillFamily:`${equationFamily(left)}=${equationFamily(right)}`,editorialStatus:'draft',reviewStatus:'awaiting_independent_review',...chosen.rendered};
    row.calculationVerification={method:'exact_inverse_operations_and_substitution',...verifyEdition(row)};
    editions.push(row);statements.add(row.statement);decisions.push({sourceId:q.id,sourceFile:record.sourceFile,status:'authored_draft',editionId:row.editionId,sourceKeyVerified:true});
  }catch(error){decisions.push({sourceId:q.id,sourceFile:record.sourceFile,status:'draft_unsupported',reason:error.message});}
}
const families={};for(const row of editions)families[row.sourceSkillFamily]=(families[row.sourceSkillFamily]||0)+1;
for(const [name,value]of[
  ['grade4-equations-wave3.json',{schemaVersion:1,status:'draft_awaiting_independent_review',scope:'Saved canonical grade-4 nonvisual single-unknown equations; numeric exercises, not a claim of semantically unique stories.',summary:{editions:editions.length,sourceOccurrencesReferenced:editions.length,structuralSkillFamilies:Object.keys(families).length,independentlyReviewed:0},families,editions}],
  ['grade4-equations-evidence.json',{schemaVersion:1,decisions}],
]){
  const target=path.join(root,'problems/editorial/batches',name),text=JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
}
console.log(JSON.stringify({editions:editions.length,structuralSkillFamilies:Object.keys(families).length,unsupported:decisions.filter(q=>q.status==='draft_unsupported').length,checks:'passed'}));
