import assert from 'node:assert/strict';
import {calculate,formatExpression,structuralFamily} from './grade4-arithmetic-models.mjs';

const whole=(a,b)=>{assert(b!==0n&&a%b===0n,'Inverse division must be exact');return a/b;};
export function unknownCount(tree){return tree.variable?1:Object.hasOwn(tree,'value')?0:unknownCount(tree.left)+unknownCount(tree.right);}
export function substitute(tree,x){
  if(tree.variable){assert.equal(tree.variable,'x');return {value:Number(x)};}
  if(Object.hasOwn(tree,'value'))return tree;
  return {op:tree.op,left:substitute(tree.left,x),right:substitute(tree.right,x)};
}
export function solveEquation(left,right){
  assert.equal(unknownCount(left)+unknownCount(right),1,'Exactly one unknown occurrence required');
  const unknownSide=unknownCount(left)?left:right,knownSide=unknownCount(left)?right:left;
  const steps=[];
  function invert(tree,target){
    assert(target>=0n&&target<=1000000000n);
    if(tree.variable)return target;
    const isLeft=unknownCount(tree.left)>0,branch=isLeft?tree.left:tree.right,known=calculate(isLeft?tree.right:tree.left);
    let next,transformation;
    if(tree.op==='+'){next=target-known;transformation=`${target} − ${known}`;}
    else if(tree.op==='-'){next=isLeft?target+known:known-target;transformation=isLeft?`${target} + ${known}`:`${known} − ${target}`;}
    else if(tree.op==='*'){assert(known!==0n,'Zero multiplication cannot determine one unique unknown');next=whole(target,known);transformation=`${target} : ${known}`;}
    else if(tree.op==='/'){
      if(isLeft){assert(known>0n);next=target*known;transformation=`${target} · ${known}`;}
      else {assert(target>0n,'Zero quotient cannot determine a unique denominator');next=whole(known,target);assert(next>0n);transformation=`${known} : ${target}`;}
    }else throw new Error('Unsupported inverse operation');
    assert(next>=0n&&next<=1000000000n);
    steps.push(`${formatExpression(branch)} = ${transformation} = ${next}`);
    return invert(branch,next);
  }
  const answer=invert(unknownSide,calculate(knownSide));
  assert.equal(calculate(substitute(left,answer)),calculate(substitute(right,answer)));
  return {answer:answer.toString(),steps};
}
export function equationFamily(tree){return tree.variable?'x':Object.hasOwn(tree,'value')?structuralFamily(tree):`${tree.op}(${equationFamily(tree.left)},${equationFamily(tree.right)})`;}
export function renderEdition(row){
  assert.equal(row.modelId,'grade4-inverse-operation-equation');assert.equal(row.grade,4);
  assert.deepEqual(Object.keys(row.params),['left','right']);
  const {left,right}=row.params,solved=solveEquation(left,right);
  const lhs=formatExpression(left),rhs=formatExpression(right);
  const leftValue=calculate(substitute(left,BigInt(solved.answer))),rightValue=calculate(substitute(right,BigInt(solved.answer)));
  return {statement:`${lhs} = ${rhs} теңдігі дұрыс болатындай x санын табыңдар.`,answer:solved.answer,
    solution:`Кері амалдар арқылы белгісізі бар бөлікті біртіндеп бөліп аламыз: ${solved.steps.join('; ')}. Тексеру үшін x орнына ${solved.answer} қоямыз: сол жақ ${leftValue}, оң жақ ${rightValue}. Екі жақ тең, сондықтан x = ${solved.answer}.`};
}
export function verifyEdition(row){
  const output=renderEdition(row);for(const key of ['answer','statement','solution'])assert.equal(row[key],output[key],`${row.editionId}: ${key} is not bound to the equation`);
  assert(row.sourceRefs?.length===1&&row.adaptationChanges?.length>=2);
  return {answer:output.answer,checks:['one occurrence of the unknown','inverse operations exact','nonzero factors and denominators','unique nonnegative whole-number solution','substitution makes both sides exactly equal','statement and solution bound to both equation trees']};
}
