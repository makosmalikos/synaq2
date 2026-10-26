import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {calculate,formatExpression,structuralFamily,parseSourceExpression,renderEdition,verifyEdition,efficientParams} from './grade4-arithmetic-models.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'problems/editorial/batches/grade4-inventory.json'),'utf8'));
const core=JSON.parse(fs.readFileSync(path.join(root,'problems/editorial/batches/grade4-core-wave1.json'),'utf8')).editions;
const prior=new Set(core.flatMap(q=>q.sourceRefs.map(ref=>ref.sourceId)));
const rows=[],decisions=[],cache=new Map();
const scalar=tex=>{const t=String(tex).replace(/\$/g,'').replace(/\\[,;!]/g,'').replace(/\s/g,'');assert(/^\d+$/.test(t));return BigInt(t);};
const directPrompt=/^(?:Өрнектің мәнін табыңдар|өрнегінің мәнін табыңдар|Тиімді тәсілмен есептеңдер|Есептеңдер|есептеңдер|Бағанмен есептеңдер|Бағанмен көбейтіңдер|Бұрышпен бөліңдер|Бөліндіні табыңдар|бөліндісін табыңдар|көбейтіндісінің мәнін таңдаңдар|көбейтіндісінің мәнін табыңдар|көбейтіндісін табыңдар|айырмасын табыңдар|қосындысын табыңдар)[.:,\s]*$/;
function randomSource(seed){let state=parseInt(seed.slice(0,8),16)>>>0;return max=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)%max;};}
function mutateInteger(value,random){
  if(value===0||value===1||/^10*$/.test(String(value)))return value;
  return Number([...String(value)].map(d=>d==='0'?'0':String(1+random(9))).join(''));
}
function rewrite(tree,random){
  if(Object.hasOwn(tree,'value'))return {value:mutateInteger(tree.value,random)};
  if(tree.op==='^')return {op:'^',left:rewrite(tree.left,random),right:tree.right};
  const left=rewrite(tree.left,random),right=rewrite(tree.right,random);
  if(tree.op==='/'&&Object.hasOwn(tree.left,'value')){
    const quotient=Number(calculate(tree)),newQuotient=mutateInteger(quotient,random),newLeft=Number(calculate(right))*newQuotient;
    assert(String(newLeft).length===String(tree.left.value).length,'Retain the dividend digit count');
    return {op:'/',left:{value:newLeft},right};
  }
  return {op:tree.op,left,right};
}
const fingerprints=new Set(core.map(q=>q.statement));
for(const record of inventory.records){
  if(prior.has(record.sourceId)||record.existingEditionIds.length)continue;
  if(!cache.has(record.sourceFile))cache.set(record.sourceFile,JSON.parse(fs.readFileSync(path.join(root,record.sourceFile),'utf8')));
  const capture=cache.get(record.sourceFile),q=capture.questions.find(q=>q.id===record.sourceId);
  assert(capture.status==='captured'&&q?.checked);
  const parts=[...q.statement.matchAll(/\$([^$]+)\$/g)];
  if(parts.length!==1)continue;
  const prose=q.statement.replace(parts[0][0],'').trim();
  if(!directPrompt.test(prose))continue;
  try{
    const original=parseSourceExpression(parts[0][1]),sourceAnswer=scalar(q.sourceAnswer);
    assert.equal(calculate(original),sourceAnswer,'Source key disagrees with the full arithmetic condition');
    const correct=(q.options||[]).filter(choice=>choice.correct);
    if(correct.length)assert(correct.length===1&&scalar(correct[0].text)===sourceAnswer,'Source options disagree with the source key');
    const random=randomSource(q.id);let chosen;
    const efficient=q.statement.includes('Тиімді тәсілмен');
    if(efficient){
      const params=efficientParams(q.id),draft={editionId:`grade4-arithmetic-${q.id}`,modelId:'grade4-exact-arithmetic-program',grade:4,params,sourceRefs:[{sourceFile:record.sourceFile,sourceId:q.id}]};
      chosen={tree:params.tree,params,rendered:renderEdition(draft)};
    }
    for(let attempt=0;!chosen&&attempt<10000;attempt++){
      try{
        const tree=rewrite(original,random);calculate(tree);
        assert.equal(structuralFamily(tree),structuralFamily(original),'Retain digit counts, trailing zeros and zero/one identities');
        if(JSON.stringify(tree)===JSON.stringify(original))continue;
        const draft={editionId:`grade4-arithmetic-${q.id}`,modelId:'grade4-exact-arithmetic-program',grade:4,params:{tree}};
        const rendered=renderEdition(draft);
        if(fingerprints.has(rendered.statement))continue;
        chosen={tree,rendered};break;
      }catch{/* Unsupported numeric candidate stays unselected, not falsely checked. */}
    }
    assert(chosen,'No suitable exact rewrite found within the finite search');
    const row={
      editionId:`grade4-arithmetic-${q.id}`,modelId:'grade4-exact-arithmetic-program',grade:4,topic:'num',
      difficulty:/level1\.json$/.test(record.sourceFile)?'easy':/level2\.json$/.test(record.sourceFile)?'medium':'hard',
      params:chosen.params||{tree:chosen.tree},sourceRefs:[{sourceFile:record.sourceFile,sourceId:q.id}],
      adaptationChanges:[
        'Сандық деректер өзгертілді; өрнек пен оның шешімі жаңа деректерден қайта құрылды.',
        'Сандық деректердің разрядтар саны мен амалдардың байланысы сақталды; жаңа өрнектегі барлық бөлу қалдықсыз орындалатыны тексерілді.',
        'Шарт пен шешім таза нативті таңбалармен жазылды, скан не HTML қажет емес.'
      ],
      relationToSource:'Numeric arithmetic edition preserving the source operation skill. Shared operator forms are not counted as semantically unique stories.',
      sourceSkillFamily:structuralFamily(original),editorialStatus:'draft',reviewStatus:'awaiting_independent_review',
      ...chosen.rendered,
    };
    if(efficient)row.adaptationChanges=[
      'Тиімді есептеудің нақты тәсілі бастапқы шарт пен шешімнен оқылып сақталды: дөңгелек жұп, ортақ көбейткіш, өтемдеу немесе қосындыны бөлу.',
      'Осы тәсілге қажет педагогикалық тұрақтылар сақталды; қалған деректер қолмен таңдалып өзгертілді, барлық теңмәнді түрлендіру қайта тексерілді.',
      'Жаңа шешім тиімді түрлендірулердің толық теңдіктер тізбегін көрсетеді; бұл кездейсоқ сандарды алмастыру емес.'
    ];
    row.calculationVerification={method:'exact_integer_operation_tree',...verifyEdition(row)};
    rows.push(row);fingerprints.add(row.statement);
    decisions.push({sourceId:q.id,sourceFile:record.sourceFile,status:'authored_draft',editionId:row.editionId,sourceExpression:formatExpression(original),sourceKeyVerified:true,newSkillFamily:structuralFamily(chosen.tree),answerUnchanged:BigInt(row.answer)===sourceAnswer});
  }catch(error){decisions.push({sourceId:q.id,sourceFile:record.sourceFile,status:'draft_unsupported',reason:error.message});}
}
const families={};for(const row of rows)families[row.sourceSkillFamily]=(families[row.sourceSkillFamily]||0)+1;
const content={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'Exact arithmetic editions of already saved canonical grade-4 nonvisual exercises. Numeric variants remain separate exercises, not distinct stories.',summary:{editions:rows.length,sourceOccurrencesReferenced:rows.length,structuralSkillFamilies:Object.keys(families).length,independentlyReviewed:0},families,editions:rows};
const evidence={schemaVersion:1,decisionCount:decisions.length,decisions};
for(const [name,value]of[['grade4-arithmetic-wave2.json',content],['grade4-arithmetic-evidence.json',evidence]]){
  const target=path.join(root,'problems/editorial/batches',name),text=JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
}
console.log(JSON.stringify({editions:rows.length,structuralSkillFamilies:Object.keys(families).length,unsupported:decisions.filter(x=>x.status==='draft_unsupported').length,checks:'passed'}));
