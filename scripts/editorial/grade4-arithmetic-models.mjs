import assert from 'node:assert/strict';
import {efficientSpecs} from './grade4-efficient-specs.mjs';

// Restricted exact-integer programs, not arbitrary JavaScript or a formula eval.
// Distinct source exercises may share this model. They are numeric exercise
// editions and must not be counted as semantically distinct stories.
const operations=new Set(['+','-','*','/','^']);
export function calculate(tree) {
  if(Object.hasOwn(tree,'value')){
    assert.deepEqual(Object.keys(tree),['value']);
    assert(Number.isSafeInteger(tree.value)&&tree.value>=0&&tree.value<=1e9);
    return BigInt(tree.value);
  }
  assert(operations.has(tree.op));assert.deepEqual(Object.keys(tree).sort(),['left','op','right']);
  const a=calculate(tree.left),b=calculate(tree.right);let answer;
  if(tree.op==='+')answer=a+b;
  if(tree.op==='-'){assert(a>=b,'Grade-4 expression has a negative intermediate');answer=a-b;}
  if(tree.op==='*')answer=a*b;
  if(tree.op==='/'){assert(b>0n&&a%b===0n,'Every division must be exact');answer=a/b;}
  if(tree.op==='^'){assert(Object.hasOwn(tree.right,'value')&&b>=2n&&b<=3n);answer=a**b;}
  assert(answer<=1000000000n,'Intermediate exceeds the grade-4 size bound');
  return answer;
}
const n=value=>String(value).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const rank=tree=>Object.hasOwn(tree,'value')||tree.variable?4:({'+':1,'-':1,'*':2,'/':2,'^':3})[tree.op];
export function formatExpression(tree,parentRank=0,isRight=false,parentOp=null) {
  if(Object.hasOwn(tree,'value'))return n(tree.value);
  if(tree.variable){assert.equal(tree.variable,'x');return 'x';}
  const level=rank(tree);
  let value;
  if(tree.op==='^')value=formatExpression(tree.left,3)+(tree.right.value===2?'²':'³');
  else value=`${formatExpression(tree.left,level,false,tree.op)} ${{'+':'+','-':'−','*':'·','/':':'}[tree.op]} ${formatExpression(tree.right,level,true,tree.op)}`;
  const needs=level<parentRank || isRight&&level===parentRank&&(parentOp==='-'||parentOp==='/'||parentOp==='*'&&tree.op==='/');
  return needs?`(${value})`:value;
}
export function structuralFamily(tree) {
  if(Object.hasOwn(tree,'value')){
    if(tree.value===0)return 'zero';
    if(tree.value===1)return 'one';
    const text=String(tree.value),zeros=text.length-text.replace(/0+$/,'').length;
    return `n${text.length}z${zeros}`;
  }
  return `${tree.op}(${structuralFamily(tree.left)},${tree.op==='^'?tree.right.value:structuralFamily(tree.right)})`;
}
export function renderEdition(row) {
  assert.equal(row.grade,4);assert.equal(row.modelId,'grade4-exact-arithmetic-program');
  assert.deepEqual(Object.keys(row.params),row.params.efficient?['tree','efficient']:['tree']);
  const tree=row.params.tree,answer=calculate(tree).toString(),expression=formatExpression(tree);
  if(row.params.efficient){
    const sourceId=row.sourceRefs?.[0]?.sourceId,expected=efficientParams(sourceId);
    assert.deepEqual(row.params,expected,'Efficient arithmetic must use explicitly authored strategy-preserving givens');
    const efficient=row.params.efficient;
    for(const proof of efficient.proofExpressions)assert.equal(calculate(parseSourceExpression(proof)).toString(),answer,'An efficient identity changes the value');
    const native=text=>text.replace(/\d+/g,n).replaceAll('*',' · ').replaceAll('/',' : ').replaceAll('-',' − ').replaceAll('+',' + ');
    return {answer,statement:`Тиімді топтастыру немесе ыңғайлы жіктеу қолданып есептеңдер: ${native(efficientSpecs[sourceId].expression)}.`,
      solution:`${efficient.explanation} ${native(efficientSpecs[sourceId].expression)} = ${efficient.proofExpressions.map(native).join(' = ')}. Жауабы: ${n(answer)}.`};
  }
  const steps=[];
  function visit(node){
    if(Object.hasOwn(node,'value'))return;
    visit(node.left);visit(node.right);
    const calculation=`${formatExpression(node)} = ${n(calculate(node))}`;
    if(!steps.includes(calculation))steps.push(calculation);
  }
  visit(tree);
  assert(steps.length>0&&steps.length<=12);
  let prompt='Амалдардың орындалу ретін сақтап, өрнекті есептеңдер';
  if(tree.op==='*'&&rank(tree.left)===4&&rank(tree.right)===4)prompt='Көбейтіндіні есептеп, нәтижесін жазыңдар';
  if(tree.op==='/'&&rank(tree.left)===4&&rank(tree.right)===4)prompt='Қалдықсыз бөлуді орындап, бөліндіні жазыңдар';
  const statement=`${prompt}: ${expression}.`;
  const present=new Set();
  const collect=node=>{if(!Object.hasOwn(node,'value')){present.add(node.op);collect(node.left);collect(node.right);}};
  collect(tree);
  const names=[['^','дәрежеге шығару'],['*','көбейту'],['/','бөлу'],['+','қосу'],['-','азайту']].filter(([op])=>present.has(op)).map(([,name])=>name);
  const solution=`Бұл өрнекте ${names.join(', ')} амалдары қолданылады.${expression.includes('(')?' Жақша ішіндегі амалдар алдымен орындалады.':''} Есептеу қадамдары: ${steps.join('; ')}. Жауабы: ${n(answer)}.`;
  return {statement,answer,solution};
}
export function verifyEdition(row) {
  const rendered=renderEdition(row);
  for(const key of ['statement','answer','solution'])assert.equal(row[key],rendered[key],`${row.editionId}: ${key} differs from its exact program`);
  assert(row.sourceRefs?.length===1&&row.adaptationChanges?.length>=2);
  return {answer:rendered.answer,checks:['restricted operation tree','BigInt exact arithmetic','all intermediate divisions exact','no negative intermediate','statement and solution bound to the same tree','native notation without TeX']};
}

export function efficientParams(sourceId){
  const spec=efficientSpecs[sourceId];assert(spec,`No reviewed efficiency strategy for source ${sourceId}`);
  return {tree:parseSourceExpression(spec.expression),efficient:{explanation:spec.explanation,proofExpressions:spec.proofExpressions}};
}

export function parseSourceExpression(tex,variable=null) {
  let text=tex.replaceAll('\\left','').replaceAll('\\right','').replaceAll('\\,','').replaceAll('\\;','').replaceAll('\\!','').replaceAll('\\cdot','*').replaceAll('\\times','*').replaceAll('\\div','/').replace(/[−]/g,'-').replace(/×|·/g,'*').replace(/÷|:/g,'/').replace(/[{}]/g,c=>c==='{'?'(':')').replace(/\s+/g,'');
  if(variable){assert(/^[a-z]$/.test(variable));text=text.replaceAll(variable,'x');}
  assert((variable?/^[0-9x()+*/^\-]+$/:/^[0-9()+*/^\-]+$/).test(text),'Only whole-number arithmetic is supported');
  const tokens=text.match(/\d+|x|[()+*/^\-]/g)||[];let index=0;
  const pop=()=>tokens[index++],peek=()=>tokens[index];
  function atom(){const token=pop();if(token==='('){const node=sum();assert.equal(pop(),')');return node;}if(variable&&token==='x')return {variable:'x'};assert(/^\d+$/.test(token||''));return {value:Number(token)};}
  function power(){let a=atom();if(peek()==='^'){pop();a={op:'^',left:a,right:atom()};}return a;}
  function product(){let a=power();while(peek()==='*'||peek()==='/')a={op:pop(),left:a,right:power()};return a;}
  function sum(){let a=product();while(peek()==='+'||peek()==='-')a={op:pop(),left:a,right:product()};return a;}
  const tree=sum();assert.equal(index,tokens.length);if(!variable)calculate(tree);return tree;
}
