"""All12saved/new conditions, full official/new solutions and tencompleteMCQsets
read. Exact same-author printed-data computations use geometric-series rational
limit and independent long-division cycles, whole sequential percentage stages,
all modulus roots, symbolic pi coefficient and universal strict half-line,
original parameter midpoint, weighted payment and explicit whole-percent base.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-control15';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;plain=K.plain;scalar=K.scalar;opts=K.opts
def cycle(value):
 whole=value.numerator//value.denominator;rem=value.numerator%value.denominator;seen={};digits=[]
 while rem not in seen and rem:
  seen[rem]=len(digits);digit,rem=divmod(rem*10,value.denominator);digits.append(str(digit))
 assert rem;start=seen[rem];return whole,''.join(digits[:start]),''.join(digits[start:])
def pi_coeff(s):return E.calc(re.sub(r'\s*см\s*\^?3\s*$','',plain(s)).replace('π','p').replace('\\pi','p'),{'p':F(1)})
def halfline(s):
 p=plain(s);l,op,r=re.split(r'([<>])',p);assert l.strip()=='x';return(op,E.calc(r))
def money(s):
 values=H.numeric_tokens(s);assert len(values)==3;return tuple(values)
def solve(r,w,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);parse=scalar;proof={}
 if i<=5:
  whole,pre,rep=one(re.findall(r'(\d+)[,.](\d*)\((\d+)\)',plain(one(parts))if src else s));a,b=int(pre or'0'),int(pre+rep);m,k=len(pre),len(rep);fraction=F(b-a,10**m*(10**k-1));out=F(int(whole))+fraction;decoded=cycle(out);assert decoded==(int(whole),pre,rep),(i,decoded,(whole,pre,rep));proof={'whole':int(whole),'nonperiodDigits':pre,'periodDigits':rep,'geometricSeriesNumerator':b-a,'geometricSeriesDenominator':10**m*(10**k-1),'exactFractionTarget':str(out),'independentLongDivisionCycleMatchesPrinted':True}
 elif i==6:
  percentages=re.findall(r'(\d+)%',s);assert len(percentages)==3;up,down,last=map(F,percentages);final=H.numeric_tokens(s)[-1];factors=[1+up/100,1-down/100,1+last/100];assert min(factors)>0;out=final/math.prod(factors);stages=[out]
  for factor in factors:stages.append(stages[-1]*factor)
  assert stages[-1]==final;proof={'threeSequentialMultipliers':list(map(str,factors)),'allFourSpeedStages':list(map(str,stages)),'initialSpeedTarget':str(out)}
 elif i==7:
  inside,right=one(re.findall(r'^\|([^|]+)\|\s*=\s*(.+)$',plain(one(parts))));[a],b=E.affine(inside,('x',));radius=E.calc(right);assert a and radius>0;out=tuple(sorted([(radius-b)/a,(-radius-b)/a]));assert all(abs(E.calc(inside,{'x':v}))==radius for v in out);parse=K.roots;proof={'allRealRoots':list(map(str,out)),'bothBranchesChecked':True,'radius':str(radius)}
 elif i==8:
  # Extract fractions as complete mathematical parts rather than separate digits.
  if src:radius=H.numeric_tokens(s)[0];fraction=E.calc(one(parts))
  else:radius=H.numeric_tokens(s)[0];fraction=E.calc(one(re.findall(r'\(\d+/\d+\)',s)))
  assert radius>0 and 0<fraction<1;height=radius/fraction;out=radius**2*height;parse=pi_coeff;assert height*fraction==radius;proof={'radius':str(radius),'radiusFractionOfHeight':str(fraction),'height':str(height),'volumePiCoefficientTarget':str(out),'piKeptExact':True}
 elif i==9:
  l,op,rhs=re.split(r'([<>])',plain(one(parts)));[a],b=E.affine('('+l+')-('+rhs+')');assert a;bound=-b/a
  if a<0:op='<'if op=='>'else'>'
  out=(op,bound);parse=halfline;assert E.calc(l,{'x':bound})==E.calc(rhs,{'x':bound});proof={'globalLinearDifferenceCoefficient':str(a),'globalLinearDifferenceConstant':str(b),'strictHalfLine':[op,str(bound)],'boundaryExcluded':True,'constantNonzeroDenominatorsOnly':True}
 elif i==10:
  school,girls=map(F,re.findall(r'(\d+)%',s));boys=100-girls;assert 0<school<100 and 0<girls<100;out=school*boys/100;parse=lambda t:E.calc(plain(t).replace('%','').replace(chr(92),''));proof={'gradePercentOfSchool':str(school),'boysPercentInsideGrade':str(boys),'boysPercentOfWholeSchoolTarget':str(out),'wholeSchoolNotGradeDenominator':True}
 elif i==11:
  a,b,c,total=n;times=[a,b,c];rates=[1/t for t in times];out=tuple(total*v/sum(rates)for v in rates);parse=money;assert sum(out)==total and len(set(v*t for v,t in zip(out,times)))==1;proof={'soloTimesHours':list(map(str,times)),'exactRateWeights':list(map(str,rates)),'totalPayment':str(total),'orderedPaymentsTarget':list(map(str,out)),'equalPayTimesProductAndConservedTotal':True}
 elif i==12:
  if src:coords=[one(re.findall(r'^[ABC]\((.*)\)$',plain(p)))for p in parts[:3]]
  else:coords=parts
  middle,left,right=coords;equation='2*('+plain(middle)+')=('+plain(left)+')+('+plain(right)+')';root,linear=E.equation(equation);values=[E.calc(p,{'x':root})for p in coords];B,A,C=values;assert B==(A+C)/2 and A!=C;out=abs(A-C);proof={'uniqueParameter':str(root),'coordinateB':str(B),'coordinateA':str(A),'coordinateC':str(C),'ACLengthTarget':str(out),'midpointAndNonnegativeDistanceVerified':True}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True
 if opts(r):
  values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesEvaluated']=True
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
  if i==1:
   digit=int(proof['periodDigits']);assert values==[F(digit,9),F(digit,99),F(digit,10),F(1,digit)]
  if i==3:
   whole=proof['whole'];pre=int(proof['nonperiodDigits']);joined=pre*10+int(proof['periodDigits']);assert values==[whole+F(joined,99),out,whole+F(joined,90),whole+F(pre,10)]
  if i==4:
   whole=proof['whole'];joined=int(proof['nonperiodDigits']+proof['periodDigits']);assert values==[whole+F(joined,999),whole+F(joined,900),whole+F(joined,990),out]
  if i==7:
   lo,hi=out;assert values==[out,(hi,),(-hi,hi),(-hi,-lo)]
  if i==8:assert values==[radius**3*fraction,radius**3,out,radius**2*fraction.denominator]
  if i==9:assert values==[('<',bound),('>',-bound),('>',1/bound),out]
  if i==10:assert values[0]==school*girls/100 and values[3]==boys
 return proof

def mutation(r,w,i):
 pairs={1:('0,(8)','0,(7)'),2:('6,(47)','6,(46)'),3:('3,4(2)','3,4(3)'),4:('8,5(27)','8,5(28)'),5:('2,(352)','2,(353)'),6:('108 км/сағ','135 км/сағ'),7:('− 0,6','− 1,2'),8:('12 см','15 см'),9:('−x + 4','−x + 5'),10:('75%','80%'),11:('33000 теңгелік','44000 теңгелік'),12:('4 × x + 2','4 × x + 3')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==12;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and (not q.get('svg') or (w=='W15' and i==7 and all('width="0.333em"' in v and 'viewBox="0 0 333 2400"' in v for v in q['svg'])));answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and not r.get('image')and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,w,i)]:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError):pass
   else:raise AssertionError(('canary accepted',w,i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and (before[-1]==':' or before[-1].isascii()and before[-1].isalpha()):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('solution equality',w,i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All12full source/new conditions, full official/new solutions and10completeMCQsets read. Exact geometric-series fraction independently confirmed by longdivision cycle; fullmodulus roots, universal strict inequality, exactpi volume, allpercent stages, whole-schoolbase, inverse-time payment and midpoint/distance verified. Same author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':12,'fullSourceNewConditionsAndSolutionsRead':12,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':12,'printedSemanticCanariesRejected':12,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':12,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
