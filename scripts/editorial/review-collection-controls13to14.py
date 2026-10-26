"""Full15frozen conditions, full official solutions, sixcomplete MCQsets and
allrewritten conditions/solutions/options read. Exact printed-data recomputation
by same root author, no separate human reviewer. Universal symbolic checks for
consecutive blocks and absolute affine distances, complete scaled modulus roots,
variable-denominator exclusions and reciprocal-system uniqueness included.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-controls13to14';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
E=module('equations','scripts/editorial/review-collection-equations12.py');H=E.H;one=H.one
def plain(s):return E.plain(s.replace('\\div','÷'))
def scalar(s):return E.calc(re.sub(r'\s*(?:км/сағ|сағ|см|кг|км)\s*$','',plain(s)).strip())
def opts(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def roots(s):
 p=plain(s);terms=re.split(r'немесе|;',p);values=[]
 for t in terms:
  assert'x='in t.replace(' ','');values.append(scalar(t.split('=')[1]))
 assert len(set(values))==len(values);return tuple(sorted(values))
def polynomial_key(p):return tuple(sorted((str(k),str(v))for k,v in p.n.items())),tuple(sorted((str(k),str(v))for k,v in p.d.items()))
def abs_key(s,var):
 p=plain(s).strip()
 if p.startswith('|'):
  assert p.endswith('|');[a],b=E.affine(p[1:-1],(var,));
  if a==0:return('constant',str(abs(b)))
  if a<0:a,b=-a,-b
  return('absoluteAffine',str(a),str(b))
 return('constant',str(E.calc(p)))
def triple(s,var):
 parts=[re.sub(r'^\s*\d+\)\s*','',v)for v in s.split(';')];assert len(parts)==3;return tuple(abs_key(v,var)for v in parts)
def pair(s):
 p=plain(s).strip();assert p[0]=='('and p[-1]==')';a,b=p[1:-1].split(';');return(E.calc(a),E.calc(b))
def solve(r,w,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);parse=scalar;proof={}
 if(w,i)==('W13',1):
  a,b,c,d=n;weights=[a/b,F(1),d/c];angles=[360*v/sum(weights)for v in weights];assert all(0<x<180 for x in angles)and len(set(angles))==3;out=sorted(angles)[1];assert angles[0]/angles[1]==a/b and angles[1]/angles[2]==c/d and sum(angles)==360;proof={'threeCentralAngles':list(map(str,angles)),'wholeCircle':360,'middleTarget':str(out)}
 elif(w,i)==('W13',2):
  master,apprentice,shared=n;assert min(master,apprentice,shared)>0;done=shared*(1/master+1/apprentice);assert 0<done<1;alone=(1-done)*apprentice;out=shared+alone;assert shared/master+out/apprentice==1;proof={'sharedHours':str(shared),'workDoneTogether':str(done),'apprenticeAloneHours':str(alone),'totalApprenticeHoursTarget':str(out),'fullWorkConserved':True}
 elif(w,i)==('W13',3):
  factor,inside,right=one(re.findall(r'^(\d+)\s*\*?\s*\|([^|]+)\|\s*=\s*(\d+)$',plain(one(parts))));factor,right=F(factor),F(right);[a],b=E.affine(inside,('x',));assert factor>0 and right>0 and a;radius=right/factor;out=tuple(sorted([(radius-b)/a,(-radius-b)/a]));parse=roots;assert all(factor*abs(E.calc(inside,{'x':v}))==right for v in out);proof={'allRoots':list(map(str,out)),'bothBranchesCheckedInOriginal':True,'radiusAfterDivision':str(radius),'unscaledWrongRoots':list(map(str,sorted([(right-b)/a,(-right-b)/a])))}
 elif(w,i)==('W13',4):
  assert n[0:2]==[1,2]and n[3:5]==[1,2];high,low=int(n[2]),int(n[5]);assert high>low>=2;out=F(sum(range(1,high+1))-sum(range(1,low+1)));assert out==sum(range(low+1,high+1))==(high+low+1)*(high-low)//2;proof={'uncancelledFirst':low+1,'uncancelledLast':high,'uncancelledCount':high-low,'differenceTarget':str(out)}
 elif(w,i)==('W13',5):
  # The extra5is the place-count adjective in rewritten condition.
  digits=list(map(int,n));assert len(digits)==5 and len(set(digits))==5 and all(0<=v<=9 for v in digits);values=[sum(d*10**(4-j)for j,d in enumerate(p))for p in itertools.permutations(digits)if p[0]!=0];assert len(values)==len(set(values));out=F(len(values));proof={'printedDigits':digits,'allPermutationsEnumerated':120,'validFiveDigitCount':len(values),'zeroLeadingValuesExcluded':120-len(values)}
 elif(w,i)==('W13',6):
  if src:v1,v2,distance=n
  else:distance,v1,v2=n
  assert min(distance,v1,v2)>0;out=2*distance/(distance/v1+distance/v2);assert out==2*v1*v2/(v1+v2);proof={'wholeDistance':str(2*distance),'wholeHours':str(distance/v1+distance/v2),'wholeDistanceOverWholeTimeTarget':str(out),'notArithmeticMean':out!=(v1+v2)/2}
 elif(w,i)==('W13',7):
  lake,up=n;own=1/lake;current=own-1/up;down=own+current;assert own>current>0;out=1/down;proof={'stillWaterSpeedNormalized':str(own),'currentSpeedNormalized':str(current),'upstreamSpeedNormalized':str(own-current),'downstreamHoursTarget':str(out)}
 elif(w,i)==('W13',8):
  special,others,added,newEach=n;assert special>others>0 and newEach>others;count=(special-others+added)/(newEach-others);out=special+(count-1)*others;assert count.denominator==out.denominator==1 and count>1 and out+added==count*newEach;proof={'recipientCount':str(count),'firstDistribution':str(special+(count-1)*others),'secondDistribution':str(count*newEach),'initialItemsTarget':str(out)}
 elif(w,i)==('W14',1):
  length,outer=n;edgeSum=2*(length-outer);middleSum=length-edgeSum;assert edgeSum>0 and middleSum>0;out=middleSum/2;# General symbolic proof, no assumedequalparts.
  a=E.expr('a');b=E.expr('b');c=E.expr('c');d=E.expr('d');whole=a+b+c+d;edgeMid=a*E.number(F(1,2))+b+c+d*E.number(F(1,2));innerMid=(b+c)*E.number(F(1,2));assert(innerMid-(edgeMid-whole*E.number(F(1,2)))).equals(E.number(F(0)));proof={'outerTwoLengthsSum':str(edgeSum),'innerTwoLengthsSum':str(middleSum),'innerMidpointDistanceTarget':str(out),'universalFourUnequalLengthsIdentity':True}
 elif(w,i)==('W14',2):
  k,following,following2=map(int,n);assert following==k and following2==2*k;var='N'if src else'S';out=(E.expr(var)+E.number(F(k*k)),E.expr('2*'+var)+E.number(F(3*k*k)));parse=lambda text:tuple(E.expr(re.sub(r'^\s*\d+\)\s*','',t))for t in text.split(';'));proof={'originalBlockSize':k,'nextBlockOffset':k*k,'nextDoubleBlockOffset':3*k*k,'allStartingNaturalValuesCoveredByLinearIdentity':True}
 elif(w,i)==('W14',3):
  equation=plain(one(parts));lft,rgt=equation.split('=');diff=E.expr(lft)-E.expr(rgt);assert set(diff.n).issubset({(),('x',)});a=diff.n.get(('x',),F(0));b=diff.n.get((),F(0));assert a;out=-b/a;assert E.calc(lft,{'x':out})==E.calc(rgt,{'x':out});assert set(diff.d).issubset({(),('x',)}) and diff.d.get(('x',));domainRoot=-diff.d.get((),F(0))/diff.d[('x',)];assert out!=domainRoot
  try:E.calc(lft,{'x':domainRoot})
  except ZeroDivisionError:pass
  else:raise AssertionError('Original denominator domain lost')
  proof={'uniqueLinearNumeratorRoot':str(out),'excludedOriginalDenominatorRoot':str(domainRoot),'bothOriginalSidesEqual':str(E.calc(lft,{'x':out})),'noCrossMultiplicationExtraneousRoot':True}
 elif(w,i)==('W14',4):
  distance,current,percent=n;own=current/(percent/100);assert 0<current<own and distance>0;down=distance/(own+current);up=distance/(own-current);out=down+up;proof={'ownSpeed':str(own),'downHours':str(down),'upHours':str(up),'roundTripHoursTarget':str(out),'positiveUpstreamSpeed':str(own-current)}
 elif(w,i)==('W14',5):
  a,b,c,edge=n;counts=[a/edge,b/edge,c/edge];assert all(v.denominator==1 and v>0 for v in counts);out=math.prod(counts);assert out==a*b*c/edge**3;proof={'integerCountsOnThreeAxes':list(map(str,counts)),'wholeVolume':str(a*b*c),'oneCubeVolume':str(edge**3),'cubeCountTarget':str(out)}
 elif(w,i)==('W14',6):
  if src:coords=[one(re.findall(r'^[ABC]\((.*)\)$',plain(p)))for p in parts[:3]];var='x'
  else:coords=parts;var='t'
  assert len(coords)==3;deltas=['('+coords[a]+')-('+coords[b]+')'for a,b in[(0,1),(0,2),(1,2)]];out=tuple(abs_key('|'+p+'|',var)for p in deltas);parse=lambda text:triple(text,var);proof={'globalAbsoluteAffineDistances':out,'distanceNonnegativeForEveryRealParameter':True,'bothSignBranchesAndRootsCoveredAlgebraically':True}
 elif(w,i)==('W14',7):
  if src:raw=one(parts);raw=re.sub(r'\\begin\{cases\}|\\end\{cases\}','',raw);equations=re.split(r'\\\\\[4pt\]',raw);assert len(equations)==2
  else:equations=parts
  coefficients=[];rhs=[]
  for eq in equations:
   l,rt=plain(eq).split('=');l=l.replace('((x))','(x)').replace('((y))','(y)');# substitute reciprocal variables, retain exact printed coefficients
   transformed=re.sub(r'\(\((\d+)\)/\(([xy])\)\)',lambda m:m[1]+'*'+('u'if m[2]=='x'else'v'),l)if src else re.sub(r'\((\d+)/([xy])\)',lambda m:m[1]+'*'+('u'if m[2]=='x'else'v'),l)
   coeff,c=E.affine(transformed,('u','v'));coefficients.append(coeff);rhs.append(E.calc(rt)-c)
  (a,b),(c,d)=coefficients;e,f=rhs;det=a*d-b*c;assert det;u=(e*d-b*f)/det;v=(a*f-e*c)/det;assert u and v;out=(1/u,1/v);parse=pair
  for eq in equations:
   l,rt=plain(eq).split('=');assert E.calc(l,{'x':out[0],'y':out[1]})==E.calc(rt,{'x':out[0],'y':out[1]})
  proof={'reciprocalCoefficientDeterminant':str(det),'nonzeroReciprocals':list(map(str,[u,v])),'orderedXYTarget':list(map(str,out)),'allOriginalEquationsChecked':2,'uniqueAndBothVariablesNonzero':True}
 else:raise AssertionError((w,i))
 def equal(a,b):
  if isinstance(a,E.R):return a.equals(b)
  if isinstance(a,tuple)and a and isinstance(a[0],E.R):return len(a)==len(b)and all(x.equals(y)for x,y in zip(a,b))
  return a==b
 assert equal(parse(r['answer']),out),(w,i,src,proof,r['answer']);proof['answerChecked']=True
 if opts(r):
  values=[parse(o)for o in opts(r)];assert len(values)==4 and all(not equal(a,b)for a,b in itertools.combinations(values,2));matches=[j for j,v in enumerate(values)if equal(v,out)];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesEvaluated']=True
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
  if(w,i)==('W13',2):assert values[0]==alone and values[3]==master
  if(w,i)==('W13',3):assert values[0]==(max(out),)and values[1]==tuple(sorted(-v for v in out))and values[2]==tuple(map(F,proof['unscaledWrongRoots']))
  if(w,i)==('W14',6):assert values[3][:-1]==out[:-1]and values[3][-1]==('constant',str(-F(out[-1][-1])))
  if(w,i)==('W14',7):assert values==[(out[1],out[0]),(out[0],-out[1]),(out[0],1/out[1]),out]
 return proof

def mutation(r,w,i):
 pairs={('W13',1):('7:8','7:9'),('W13',2):('8 сағат','6 сағат'),('W13',3):('= 24','= 48'),('W13',4):('799','899'),('W13',5):('2, 3, 5, 7, 9','0, 3, 5, 7, 9'),('W13',6):('72 км/сағ','96 км/сағ'),('W13',7):('12 сағат','16 сағат'),('W13',8):('19 жапсырма','21 жапсырма'),('W14',1):('34 см','35 см'),('W14',2):('5 натурал','6 натурал'),('W14',3):('÷ 4»','÷ 5»'),('W14',4):('28,8 км','36 км'),('W14',5):('14 см','16 см'),('W14',6):('4 × t + 7','4 × t + 8'),('W14',7):('= 4,5','= 5,5')};a,b=pairs[w,i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and (not q.get('svg') or (w=='W14' and i==7 and len(q['svg'])==2 and all('M384 0 H504 V316 H384z' in v and 'width="0.8889em"' in v for v in q['svg'])));answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15full saved/new conditions, fullofficial/new solutions and every6MCQset read; exact printed-data independent recomputation. Symbolic allreal affine absolute distances/block sums, complete modulus roots, denominator domain exclusion, reciprocal determinant and conservation/whole-trip/permutation enumerations checked. Same author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':15,'printedSemanticCanariesRejected':15,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
