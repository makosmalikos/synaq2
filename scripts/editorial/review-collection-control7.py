"""All8full saved/new conditions, complete official/new solutions and all3MCQ
sets read. Same root author separate exact printed-input computation, not separate
human reviewer. Source8SVGs are KaTeX delimiters, not spatial diagrams; dropped.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-control7';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def nums(s):return H.numeric_tokens(re.sub(r'м\$?\^[23]\$?','м',s))
def clean(s):return E.plain(s.replace('\\div','÷'))
def opts(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def volumes(s):
 s=re.sub(r'\s*м\^3\s*$','',clean(s));return tuple(F(x.strip())for x in s.split(';'if';'in s else','))
def roots(s):
 a,b=one(re.findall(r'x\s*=\s*(.+?)[,;]\s*y\s*=\s*(.+)',clean(s)));return E.calc(a),E.calc(b)
def solve(r,i,src=False):
 s=r['statement'];p=H.math_parts(s,src);n=nums(s);proof={};parse=E.calc
 if i==1:
  target=clean(one(p));out,proof=E.equation(target);l,rhs=target.split('=');assert E.calc(l,{'x':out})==E.calc(rhs,{'x':out});proof['originalUncancelledLeftAtRoot']=str(E.calc(l,{'x':out}));proof['originalUncancelledRightAtRoot']=str(E.calc(rhs,{'x':out}));proof['negativeNonintegralMixedRoot']=out<0 and out.denominator!=1
 elif i==2:
  a,b,first,final=n;assert a>0 and b>0 and 0<first<final<100;whole=a+b;firstSolute=a*first/100;totalSolute=whole*final/100;secondSolute=totalSolute-firstSolute;out=secondSolute/b*100;assert 0<out<100 and firstSolute+b*out/100==totalSolute;proof={'wholeMass':str(whole),'firstSolute':str(firstSolute),'secondSolute':str(secondSolute),'totalSolute':str(totalSolute),'secondConcentrationPercent':str(out)}
 elif i==3:
  total,over,under,last=n;plan=(total-over+under-last)/3;actual=[plan+over,plan-under,plan+last];assert min(actual)>0 and sum(actual)==total;out=plan;proof={'sameDailyPlan':str(plan),'allThreeActualDays':list(map(str,actual))}
 elif i==4:
  interval,target=p;lower,var,upper=one(re.findall(r'^(-?\d+)\s*≤\s*([xt])\s*≤\s*(-?\d+)$',clean(interval)));lower,upper=F(lower),F(upper);assert lower<=0<=upper;expr=E.expr(target);assert set(expr.d)=={()}and set(expr.n)=={(),(var,var)};denom=expr.d[()];a=expr.n[(var,var)]/denom;b=expr.n[()]/denom;assert a>0;maxSquare=max(lower*lower,upper*upper);at=lower if lower*lower>=upper*upper else upper;out=a*maxSquare+b;assert E.calc(target,{var:at})==out and all(E.calc(target,{var:t})<=out for t in[lower,upper,F(0)]);proof={'closedRealInterval':[str(lower),str(upper)],'positiveSquareCoefficient':str(a),'largestAbsoluteEndpoint':str(at),'universalAbsoluteBound':str(max(abs(lower),abs(upper))),'maxSquare':str(maxSquare),'allRealNotJustIntegerProof':True,'maximumTarget':str(out)}
 elif i==5:
  times=n[:3];total=n[3];assert len(n)==4;rates=[1/t for t in times];out=tuple(total*rate/sum(rates)for rate in rates);assert sum(out)==total and len(set(v*t for v,t in zip(out,times)))==1;parse=volumes;proof={'allVolumeShares':list(map(str,out)),'sum':str(total),'sameElapsedTimeInvariant':str(out[0]*times[0])}
 elif i==6:
  if src:assert'ширек'in s;part=F(1,4);pct,value=n
  else:frac=one(re.findall(r'\(\d+/\d+\)',s));part=E.calc(frac);pct,value=nums(s.replace(frac,''))
  assert 0<part<1 and 0<pct<100;out=value/(part*pct/100);assert out*part*pct/100==value;proof={'fractionOfWhole':str(part),'percentOfFraction':str(pct),'givenPartValue':str(value),'wholeTarget':str(out)}
 elif i==7:
  elder,young,ratio=n;out=(ratio*young-elder)/(ratio-1);assert ratio>1 and 0<out<young<elder and elder-out==ratio*(young-out);proof={'yearsInPastTarget':str(out),'thenElderAge':str(elder-out),'thenYoungerAge':str(young-out),'bothThenAgesPositive':True}
 elif i==8:
  if src:
   body=one(re.findall(r'\\begin\{cases\}(.*?)\\end\{cases\}',one(p),re.S));equations=re.split(r'\\\\(?:\[[^\]]+\])?',body)
  else:equations=p
  assert len(equations)==2;rows=[]
  for equation in equations:
   l,rhs=clean(equation).split('=');transformed=re.sub(r'\bx\b','(1/a)',l+'-('+rhs+')');transformed=re.sub(r'\by\b','(1/b)',transformed);coeffs,constant=E.affine(transformed,('a','b'));rows.append(coeffs+[-constant])
  (a,b,c),(d,e,f)=rows;det=a*e-b*d;assert det;u=(c*e-b*f)/det;v=(a*f-c*d)/det;assert u and v;out=(1/u,1/v);parse=roots
  for equation in equations:
   l,rhs=clean(equation).split('=');assert E.calc(l,{'x':out[0],'y':out[1]})==E.calc(rhs,{'x':out[0],'y':out[1]})
  proof={'reciprocalLinearSystemDeterminant':str(det),'reciprocalVariables':[str(u),str(v)],'uniqueOriginalX':str(out[0]),'uniqueOriginalY':str(out[1]),'bothOriginalEquationsChecked':True,'zeroXAndZeroYExcluded':True}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,out,r['answer']);proof['answer']=str(out)
 if opts(r):
  values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['everyOptionValue']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
  if i==1:assert values[0]==-out and values[1]==1/out
  if i==5:assert values==[(out[1],out[0],out[2]),out,(out[2],out[1],out[0]),(out[0],out[2],out[1])]
  if i==8:assert values==[out[::-1],out,(1/out[0],1/out[1]),(-out[0],out[1])]
 return proof
def mutation(r,i):
 pairs={1:('3,6 × x','4,2 × x'),2:('450 г','500 г'),3:('225 м³','228 м³'),4:('−5 ≤','−6 ≤'),5:('1520 м³','1710 м³'),6:('84-ке','90-ға'),7:('45, баласы','50, баласы'),8:('(7/12)','(2/3)')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];equalities=missing=mcqs=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images'];assert len(q['svg'])==(2 if i==8 else 0);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip();after=r['solution'][match.end():].lstrip()
   if(before and before[-1].isascii()and before[-1].isalpha())or before.endswith(':')or after.startswith(':'):continue
   sides=[s.strip().rstrip('.,')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8source/new conditions and complete explanations with3MCQsets read. Exact printed-input rational equation and original domain, conserved mixture/day/rate ledgers, ALLreal interval square bound, positive past ages and invertible reciprocal2x2system checked. Same author, not separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){mixed++;walk([n.fraction])}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,mixed}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceKeysNotCaptured':missing,'sourceAndNewMCQSets':mcqs,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':8,'printedSemanticCanariesRejected':8,'nativeFractions':native['fractions'],'nativeMixedNumbers':native['mixed'],'printedSolutionEqualitiesVerified':equalities,'sourceMathGlyphsDroppedNotSpatialFigures':2,'pythonJavaScriptHashesMatched':8,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
