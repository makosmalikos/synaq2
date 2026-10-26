"""All15full remaining frozen/new conditions, full official/new solutions and
all15MCQsets read. Same root author separately recomputes printed expressions,
all reciprocal/scaled-modulus branches in original equation, zero domain and
last operator by actual expression AST postorder, not numerical coincidence.
"""
import ast,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-arithmetic2to5-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
P=module('arithmetic1','scripts/editorial/review-collection-arithmetic1-remainder.py');K=P.K;E=K.E;H=E.H;one=H.one;opts=K.opts;plain=P.plain;exact=P.exact

def roots(s):
 if s.strip().lower()=='шешімі жоқ':return()
 p=plain(s);p=re.sub(r'x_\d\s*=\s*','',p);return tuple(sorted(exact(v)for v in re.split(r'[;,]',p)))
def constant_abs(s):
 s=plain(s);steps=[]
 while'|'in s:
  found=False
  for m in re.finditer(r'(?=(\|([^|]+)\|))',s):
   try:v=E.calc(m[2])
   except(AssertionError,SyntaxError,ValueError,ZeroDivisionError):continue
   steps.append({'signed':str(v),'absolute':str(abs(v))});s=s[:m.start()]+'('+str(abs(v))+')'+s[m.start()+len(m[1]):];found=True;break
  if not found:break
 return s,steps

def solve(r,w,i,src=False):
 parts=H.math_parts(r['statement'],src);parse=exact;proof={}
 if(w,i)==('A4',11):
  target=plain(one(parts));node=ast.parse(H.arithmetic_text(target),mode='eval').body;labels={ast.Add:'Қосу',ast.Sub:'Азайту',ast.Mult:'Көбейту',ast.Div:'Бөлу'};ops=[]
  def postorder(n):
   if isinstance(n,ast.BinOp):postorder(n.left);postorder(n.right);ops.append(labels[type(n.op)])
   elif isinstance(n,ast.UnaryOp):postorder(n.operand)
   else:assert isinstance(n,ast.Constant)
  postorder(node);assert ops;out=ops[-1];assert out==labels[type(node.op)];parse=lambda t:t.strip();proof={'postorderOperations':ops,'actualRootOperator':type(node.op).__name__,'lastOperationTarget':out,'notInferredFromFinalNumericValue':True}
 elif(w,i)in[('A3',21),('A4',25)]:
  # Barex in the prose is outside equation; only the full equation is selected.
  target=one(p for p in parts if'='in p);converted,steps=constant_abs(target);inside=one(re.findall(r'\|([^|]+)\|',converted));l,rhs=converted.replace('|'+inside+'|','z').split('=');[a],b=E.affine('('+l+')-('+rhs+')',('z',));assert a;radius=-b/a;assert radius>0;candidates=[]
  for sign in[-1,1]:
   root,p=E.equation(inside+'='+str(sign*radius));assert E.calc(inside,{'x':root})==sign*radius;z=abs(E.calc(inside,{'x':root}));assert E.calc(l,{'z':z})==E.calc(rhs,{'z':z});candidates.append(root)
  out=tuple(sorted(candidates));assert len(set(out))==2;parse=roots;proof={'isolatedPositiveRadius':str(radius),'allOriginalEquationRoots':list(map(str,out)),'constantABSsteps':steps,'bothBranchesSubstitutedIntoOriginal':True}
  if w=='A3':
   assert 0 not in out
   try:E.calc(inside,{'x':F(0)})
   except ZeroDivisionError:pass
   else:raise AssertionError('x0 reciprocal domain lost')
   proof['zeroExcludedByOriginalReciprocalDenominator']=True
 else:
  expression='('+parts[0]+')÷('+parts[1]+')'if(w,i)==('A3',28)and not src else one(parts);expression=re.sub(r'=\s*\?\s*$','',expression);converted,steps=P.reduce_numeric_abs(expression);out=E.calc(converted);proof={'allABSsteps':steps,'convertedFullExpression':converted,'exactTarget':str(out),'allDenominatorsEvaluatedNonzero':True}
 assert parse(r['answer'])==out,(w,i,src,proof,r['answer']);proof['answerChecked']=True
 values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesEvaluated']=True
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
 if(w,i)==('A3',21):lo,hi=out;assert values==[out,tuple(sorted([1/lo,1/hi])),(lo,1/hi),()]
 if(w,i)==('A4',25):lo,hi=out;assert values==[(lo,),(hi,),(),out]
 if(w,i)==('A4',27):
  target=one(parts);converted,steps=P.reduce_numeric_abs(target);assert values[2]==out+2*F(3,7)if src else values[2]==out+F(4,5)
 if(w,i)==('A5',11):assert values[1]==-values[0]
 return proof

def mutation(r,w,i):
 pairs={('A2',19):('(9/14)','(11/14)'),('A2',23):('(4 + (1/2))','(5 + (1/2))'),('A2',27):('(4 + (1/5))','(5 + (1/5))'),('A3',3):('(6 + (3/4))','(7 + (3/4))'),('A3',8):('(1/8)','(3/8)'),('A3',12):('0,24','0,36'),('A3',17):('9,4','10,4'),('A3',21):('(18/x)','(24/x)'),('A3',28):('(7 + (1/5))','(8 + (1/5))'),('A4',3):('2 − 8','3 − 8'),('A4',11):('(−4) + (','(−4) × ('),('A4',25):('| + 3 =','| + 4 ='),('A4',27):('(3/8)','(5/8)'),('A5',11):('−3,5','−4,5'),('A5',21):('|3,5|','|4,5|')};a,b=pairs[w,i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images'];answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and not r.get('image')and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,w,i)]:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError):pass
   else:raise AssertionError(('canary accepted',w,i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('solution equality',w,i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15full source/new conditions, complete official/new solutions/all15MCQsets read. Exact full nativeABS/fraction arithmetic, original nonzero domain and bothreciprocal/scaledmodulus root branches; actualASTlastoperator postorder checked. Known partial/reciprocal/sign/externalminus distractors checked. Same author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':15,'printedSemanticCanariesRejected':15,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
