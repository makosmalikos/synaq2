"""All12remaining full source/new conditions and full official/new solutions,
all12MCQsets read. Same root author exact printed-data recomputation, no separate
human reviewer. Everypoint of everycoordinate pair option is substituted; all
function poles excluded via original expression evaluation, everyargument valid.
Nine numeric evaluations intentionally shareone model,12editions only3models.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-functions-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('controls1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;plain=K.plain;opts=K.opts

def point_pairs(s):
 p=plain(s).strip();chunks=[];depth=0;start=None
 for j,c in enumerate(p):
  if c=='(':
   if depth==0:start=j
   depth+=1
  elif c==')':
   depth-=1;assert depth>=0
   if depth==0:chunks.append(p[start:j+1]);start=None
  elif depth==0:assert c in' ,'
 assert depth==0 and len(chunks)==2;return tuple(K.pair(c)for c in chunks)

def solve(r,w,i,src=False):
 parts=H.math_parts(r['statement'],src);proof={};parse=E.calc
 if i==1:
  target=one(parts);l,right=plain(target).split('=');[a,b],c=E.affine('('+l+')-('+right+')',('x','y'));assert b;out=-a/b;intercept=-c/b;assert(E.expr(l)-E.expr(right)).equals(E.number(b)*(E.expr('y')-E.number(out)*E.expr('x')-E.number(intercept)));proof={'slopeTarget':str(out),'intercept':str(intercept),'universalYFormMatchesOriginalEquation':True}
 elif i in[2,13]:
  target=one(parts);l,right=plain(target).split('=');assert l.strip()=='y';[a],b=E.affine(right);parse=point_pairs;out=parse(r['answer']);assert all(E.calc(right,{'x':x})==y for x,y in out);validOptions=[];optionPoints=[]
  for option in opts(r):
   points=parse(option);truth=[E.calc(right,{'x':x})==y for x,y in points];validOptions.append(all(truth));optionPoints.append({'points':[[str(x),str(y)]for x,y in points],'pointMembership':truth})
  assert sum(validOptions)==1;correctIndex=validOptions.index(True);assert parse(opts(r)[correctIndex])==out;proof={'slope':str(a),'intercept':str(b),'allEightOptionPoints':optionPoints,'correctOptionIndex':correctIndex,'bothPointsRequiredNotOnlyOne':True,'answerChecked':True}
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[correctIndex]
  return proof
 else:
  assert len(parts)==2;definition,call=map(plain,parts);left,formula=definition.split('=');assert left.replace(' ','')=='f(x)';assert call.startswith('f(')and call.endswith(')');argument=E.calc(call[2:-1]);out=E.calc(formula,{'x':argument});rational=E.expr(formula);assert set(rational.d)<={(),('x',)}and rational.d.get(('x',));pole=-rational.d.get((),F(0))/rational.d[('x',)];assert argument!=pole
  try:E.calc(formula,{'x':pole})
  except ZeroDivisionError:pass
  else:raise AssertionError('Original denominator pole not excluded')
  # Separate direct rational polynomial evaluation confirms original AST substitution.
  assert rational.value({'x':argument})==out;proof={'printedFormula':formula,'argument':str(argument),'uniqueForbiddenPole':str(pole),'originalASTAndExactRationalPolynomialAgree':True,'originalDenominatorPoleRejected':True,'suppliedArgumentAllowed':True,'exactFunctionValueTarget':str(out)}
 assert parse(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True
 values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourOptionValues']=list(map(str,values))
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
 if i in[1,4,8,9,10,11]:
  signflipIndex={1:0,4:0,8:0,9:3,10:3,11:2}[i];assert values[signflipIndex]==-out
 return proof

def mutation(r,w,i):
 pairs={1:('6 × x','8 × x'),2:('4 − 2 × x','5 − 2 × x'),3:('(6/(x − 2))','(9/(x − 2))'),4:('5 × x','6 × x'),5:('(7,5/(x − 7))','(10,5/(x − 7))'),7:('(0,08/x)','(0,16/x)'),8:('(6/(3 × x − 2))','(8/(3 × x − 2))'),9:('5 × x','6 × x'),10:('(8/(x − 6))','(16/(x − 6))'),11:('x + 3 −','x + 4 −'),12:('4 × x','5 × x'),13:('−3,5 × x − 2','−3,5 × x − 3')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==12;entries=[];evidence=[];missing=mcqs=equalities=0
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
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('solution equality',w,i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All12remaining full source/new conditions, full official/new solutions andall12MCQsets read. Universal affine-slope identity; all16source/new optionpoint pairs with eachpoint individuallychecked; ninesource/new exact function values, original AST versus rationalpolynomial and alloriginaldenominator poles tested. Same root author, no separate human reviewer;12editions3models only.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':12,'fullSourceNewConditionsAndSolutionsRead':12,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':12,'printedSemanticCanariesRejected':12,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':12,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
