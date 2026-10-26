"""All8remaining full frozen/new conditions/full official/new solutions and
all8complete MCQsets read. Same-author exact arithmetic with nesting-safe ABS
reductions; every real branch and rejection checked in original modulus equation.
Source16shorthand7×1isvalid atx3as1=(3−2); no false typo diagnosis.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-arithmetic1-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;opts=K.opts
def plain(s):return K.plain(re.sub(r'\\(?:big|Big)(?:l|r)?','',s))
def reduce_numeric_abs(s):
 s=plain(s);steps=[]
 while'|'in s:
  candidates=[]
  for match in re.finditer(r'(?=(\|([^|]+)\|))',s):
   try:value=E.calc(match[2])
   except(AssertionError,SyntaxError,ValueError,ZeroDivisionError):continue
   candidates.append((match.start(),match.start()+len(match[1]),match[2],value))
  start,end,inside,value=one(candidates[:1]);replacement=abs(value);steps.append({'inside':inside,'signedValue':str(value),'absoluteValue':str(replacement)});s=s[:start]+'('+str(replacement)+')'+s[end:]

 return s,steps
def exact(s):s,steps=reduce_numeric_abs(s);return E.calc(s)
def set_parse(s):
 if s.strip()=='Шешімі жоқ':return()
 p=plain(s).strip()
 if p.startswith('(')and p.endswith(')'):
  depth=0;whole=True
  for j,c in enumerate(p):
   if c=='(':depth+=1
   elif c==')':depth-=1
   if depth==0 and j<len(p)-1:whole=False;break
  if whole:p=p[1:-1]
 return tuple(sorted(exact(t)for t in p.split(';')))
def solve(r,w,i,src=False):
 s=r['statement'];parts=H.math_parts(s,src);proof={};parse=exact
 if i in[1,3,8,26]:
  expression=one(parts);converted,steps=reduce_numeric_abs(expression);out=E.calc(converted);proof={'allNestedABSsteps':steps,'exactLeftAssociativeExpression':converted,'exactTarget':str(out)}
 elif i in[12,19,24]:
  expression=plain(one(parts));inside,rhs=one(re.findall(r'^\|([^|]+)\|\s*=\s*(.+)$',expression));[a],b=E.affine(inside);[c],d=E.affine(rhs);roots=[];branches=[]
  for sign in[1,-1]:
   coeff=sign*a-c;constant=sign*b-d;assert coeff;root=-constant/coeff;inner=E.calc(inside,{'x':root});right=E.calc(rhs,{'x':root});valid=sign*inner>=0 and right>=0 and abs(inner)==right
   if valid:roots.append(root)
   branches.append({'insideSign':sign,'candidate':str(root),'inside':str(inner),'right':str(right),'validInOriginal':valid})
  out=tuple(sorted(set(roots)));parse=set_parse
  if c==0 and d<0:assert not out;proof['negativeRightMakesAllRealValuesImpossible']=True
  proof.update({'allTwoRealBranches':branches,'allValidRealRoots':list(map(str,out)),'everyCandidateCheckedInOriginal':True})
 elif i==16:
  assert len(parts)==2;roots=[];coefs=[];checks=[]
  for eq in parts:
   converted,steps=reduce_numeric_abs(eq);root,p=E.equation(converted);l,right=converted.split('=');assert E.calc(l,{'x':root})==E.calc(right,{'x':root});roots.append(root);coefs.append(steps);checks.append(str(E.calc(l,{'x':root})))
  out=sum(roots);proof={'twoUniqueEquationRoots':list(map(str,roots)),'sumRootsTarget':str(out),'bothOriginalEquationSubstitutionsChecked':True,'constantABSsteps':coefs,'leftSidesAtRoots':checks}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True
 values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativeValues']=list(map(str,values))
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
 if i==3:assert values[1]==-1/out and values[2]==1/out
 if i==8:assert values==[3*out,2*out,out,F(3,2)*out]
 if i==19:
  valid=one(out);invalid=one(F(b['candidate'])for b in proof['allTwoRealBranches']if not b['validInOriginal']);assert values[1]==out and values[2]==tuple(sorted([-invalid,valid]))and values[3]==tuple(sorted([invalid,valid]))
 return proof

def mutation(r,w,i):
 pairs={1:('−12','−14'),3:('(7/20)','(9/20)'),8:('× 3 ×','× 6 ×'),12:('= −(2 + (1/3))','= (2 + (1/3))'),16:('9 × (x − 4)','9 × (x − 5)'),19:('3 × x + 8','3 × x + 9'),24:('= −5','= 5'),26:('(3/8)','(5/8)')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and all('width="0.333em"'in v and 'viewBox="0 0 333 'in v for v in q.get('svg',[]));answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8full frozen/new conditions and full official/new solutions/all8MCQsets read. Exact nesting-safe ABS arithmetic and fraction leftassociativity, bothlinear roots and sum, everyreal absolute-affine branch and spuriouscandidate substitution checked. Source16validshorthand7×1=(7×(3−2))recognized. Same root author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':8,'printedSemanticCanariesRejected':8,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
