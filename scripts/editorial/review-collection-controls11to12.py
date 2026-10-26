"""All13full source/new conditions, full official/new explanations and4MCQsets
read. Same root author separate exact printed-data computation, not separate
human reviewer. Factorial shortcut checked against all ten digits and exact
factorial; minimum valuations and all35counterfeit positions; zero-inclusive
linear identity, formal nested parity and complete root sets verified.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-controls11to12';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
E=module('equations','scripts/editorial/review-collection-equations12.py');C=module('coins','scripts/editorial/review-collection-control8.py');H=E.H;one=H.one
def plain(s):return E.plain(s.replace('\\div','÷'))
def scalar(s):
 p=plain(s);m=re.fullmatch(r'\s*(-?\d+(?:\.\d+)?)\s*(?:кг|м|км)?\s*',p);return F(m[1])if m else E.calc(p)
def options(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def root_set(s):
 values=H.numeric_tokens(s);assert len(values)in[1,2];return tuple(sorted(set(values)))
def v5(n):
 count=0;p=5
 while p<=n:count+=n//p;p*=5
 return count
def solve(r,w,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);parse=scalar;proof={}
 if(w,i)==('W11',1):
  factorial,word=one(re.findall(r'^(\d+)!\s*=\s*(.+)$',plain(one(p))));factorial=int(factorial)
  if word.startswith('overline('):word=one(re.findall(r'overline\(([0-9a]+)\)',word));unknown='a'
  else:unknown='*'
  assert word.count(unknown)==1 and factorial>=9;value=math.factorial(factorial);assert value%9==0;actual=[d for d in range(10)if int(word.replace(unknown,str(d)))==value];digitSum=sum(int(c)for c in word if c.isdigit());shortcut=[d for d in range(10)if(digitSum+d)%9==0];assert actual==shortcut;out=F(one(actual));proof={'factorialIndex':factorial,'exactFactorial':str(value),'printedPattern':word,'knownDigitSum':digitSum,'allTenDigitsChecked':10,'exactAndMod9CandidateSetsAgree':actual}
 elif(w,i)==('W11',2):
  if src:planned,actual,extra,oneBus,empty=n;assert oneBus==1
  else:planned,actual,extra,empty=n
  assert planned>actual>empty>0;initialBuses=(actual*extra-empty)/(planned-actual);out=planned*initialBuses;newBuses=initialBuses+extra;assert initialBuses.denominator==newBuses.denominator==out.denominator==1 and min(initialBuses,newBuses)>0;assert actual*newBuses-out==empty;proof={'initialFullBuses':str(initialBuses),'actualBuses':str(newBuses),'actualTotalSeats':str(actual*newBuses),'lastBusPassengers':str(actual-empty),'allPeopleTarget':str(out)}
 elif(w,i)==('W11',3):
  divisor=int(one(n));power=0;rest=divisor
  while rest%5==0:rest//=5;power+=1
  assert rest==1 and power>0;k=1
  while v5(k)<power:k+=1
  out=F(k);assert math.factorial(k)%divisor==0 and math.factorial(k-1)%divisor!=0;proof={'requiredPowerOfFive':power,'allLowerIndexValuations':[v5(j)for j in range(k)],'minimalIndexValuation':v5(k),'previousIndexValuation':v5(k-1),'minimalIndex':k,'directFactorialDivisibilityAgrees':True}
 elif(w,i)==('W11',4):
  equation,target=p;left,right=plain(equation).split('=');difference=E.expr(left)-E.expr(right);goal=E.expr(target);variables=('x','y')if src else('p','q');coeffs,constant=E.affine('('+left+')-('+right+')',variables);targetCoeffs,targetConstant=E.affine(target,variables);k=targetCoeffs[0]/coeffs[0];assert all(a==k*b for a,b in zip(targetCoeffs,coeffs));out=(goal-difference*E.number(k)).constant();assert out==targetConstant-k*constant;zero={v:F(0)for v in variables};assert E.calc(left,zero)==E.calc(right,zero)and E.calc(target,zero)==out;proof={'exactTargetMultipleOfEquationDifference':str(k),'universalConstantDifference':str(out),'bothVariablesZeroAllowedAndChecked':True,'noDivisionByVariableUsed':True}
 elif(w,i)==('W11',5):
  target=one(p);out=E.calc(target);q=E.expr(target);assert set(q.n)<={()}and set(q.d)<={()};proof={'wholeExactNestedExpression':str(out),'positiveMagnitude':str(-out),'negativeDenominatorEffectPreserved':out<0}
 elif(w,i)==('W11',6):
  removed=one(n)
  if src:assert s.startswith('Төрт жәшік');count=4
  else:assert s.startswith('Бес дорба');count=5
  out=count*removed/(count-1);remainder=out-removed;assert remainder>0 and count*remainder==out;proof={'containerCount':count,'removedPerContainer':str(removed),'originalPerContainerTarget':str(out),'remainingPerContainer':str(remainder),'allRemaindersSumOneOriginal':True}
 elif(w,i)==('W11',7):
  total=int(one(n));minimum,paths=C.coin_tree(total);out=F(minimum);assert 3**(minimum-1)<total<=3**minimum;proof={'coinCount':total,'allCounterfeitDecisionPaths':paths,'everyCounterfeitLocationIdentified':True,'optimalWorstCaseWeighings':minimum,'oneFewerOutcomeCapacity':3**(minimum-1),'matchingLowerBoundAndConstructiveStrategy':True}
 elif(w,i)==('W12',1):
  total=int(one(n))
  if src:inner=one(re.findall(r'-a-\(b-a\)',plain(p[0]).replace(' ','')))
  else:inner=one(p)
  internal=plain(inner).count('-');external=total-internal;assert internal==3 and external>=0;out=E.expr(inner)*E.number((-1)**external);parse=E.expr;proof={'innerMinusSigns':internal,'totalMinusSigns':total,'externalUnaryNegations':external,'externalParity':external%2,'expandedAnswerNumerator':{str(k):str(v)for k,v in out.n.items()},'fullSymbolicIdentityNotSingleSample':True}
 elif(w,i)==('W12',2):
  inside,radius=one(re.findall(r'\|([^|]+)\|\s*=\s*(\d+)',plain(one(p))));variable='x'if src else't';[a],b=E.affine(inside,(variable,));radius=F(radius);assert a and radius>0;out=tuple(sorted([(radius-b)/a,(-radius-b)/a]));parse=root_set;assert all(abs(E.calc(inside,{variable:v}))==radius for v in out);proof={'allRealRoots':list(map(str,out)),'bothAbsoluteBranchesRequired':True}
 elif(w,i)==('W12',3):
  speed,delayMinutes,percent=n;newSpeed=speed*(1+percent/100);delay=delayMinutes/60;out=delay/(1/speed-1/newSpeed);assert min(speed,delay,percent)>0;planned=out/speed;actual=delay+out/newSpeed;assert planned==actual;proof={'newSpeed':str(newSpeed),'departureDelayHours':str(delay),'wholeJourneyDistanceTarget':str(out),'plannedHours':str(planned),'actualIncludingDelayHours':str(actual),'wholeTripNotHalfTrip':True}
 elif(w,i)==('W12',4):
  if src:assert s.count('бестен үш')==3 and'жиырма жеті'in s;fractions=[F(3,5)]*3;value=F(27)
  else:fracs=re.findall(r'\(\d+/\d+\)',s);assert len(fracs)==3;fractions=list(map(E.calc,fracs));bare=s
  if not src:
   for text in fracs:bare=bare.replace(text,'')
   value=one(H.numeric_tokens(bare))
  assert all(0<f<1 for f in fractions);product=math.prod(fractions);out=value/product;stages=[out]
  for part in fractions:stages.append(stages[-1]*part)
  assert stages[-1]==value and all(v.denominator==1 for v in stages);proof={'allThreeFractions':list(map(str,fractions)),'allFourWholeValueStages':list(map(str,stages)),'initialWholeTarget':str(out),'threeNestedPartsPreserved':True}
 elif(w,i)==('W12',5):
  if src:total,overall,knownMean=n;assert'төртеуінің'in s and'қалған төрт'in s;knownCount=F(4)
  else:total,overall,knownCount,knownMean=n
  remaining=total-knownCount;assert 0<knownCount<total;whole=total*overall;knownSum=knownCount*knownMean;out=(whole-knownSum)/remaining;assert out>0 and knownSum+remaining*out==whole;proof={'totalCount':str(total),'knownCount':str(knownCount),'remainingCount':str(remaining),'wholeHeightSum':str(whole),'knownHeightSum':str(knownSum),'remainingGroupMeanTarget':str(out)}
 elif(w,i)==('W12',6):
  first,second,third,penultimate,last,given=n;assert[first,second,third]==[1,2,3]and penultimate==last-1;last,given=int(last),int(given);total=sum(range(1,last+1));assert total==last*(last+1)//2;out=F(math.gcd(total,given));assert total%out==given%out==0 and math.gcd(int(total/out),int(given/out))==1;proof={'lastTerm':last,'allConsecutiveTermsSummed':last,'wholeSum':total,'otherInteger':given,'GCDTarget':str(out),'quotientsCoprimeChecked':True}
 else:raise AssertionError((w,i))
 equal=lambda a,b:a.equals(b)if isinstance(a,E.R)else a==b;assert equal(parse(r['answer']),out),(w,i,src,out,r['answer']);proof['answer']='universal polynomial'if isinstance(out,E.R)else str(out)
 if options(r):
  values=[parse(o)for o in options(r)];assert len(values)==4 and all(not equal(a,b)for a,b in itertools.combinations(values,2));matches=[j for j,v in enumerate(values)if equal(v,out)];assert len(matches)==1;proof['correctOptionIndex']=one(matches)
  if isinstance(out,E.R):proof['everyOptionEquivalentToTarget']=[v.equals(out)for v in values]
  else:proof['everyOptionValue']=list(map(str,values))
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
  if(w,i)==('W11',5):denominator=F(11 if src else 13);numerator=-out/denominator;assert values==[-out,out,-numerator/denominator,-numerator/denominator**2]
  if(w,i)==('W12',2):negRoot,posRoot=out;assert values==[out,(posRoot,),(-posRoot,-negRoot),(-negRoot,posRoot)]
 return proof
def mutation(r,w,i):
 pairs={('W11',1):('3a2880','36a880'),('W11',2):('36 орынды','40 орынды'),('W11',3):('625-ке','3125-ке'),('W11',4):('10 × q − 14 × p','10 × q − 14 × p + 2'),('W11',5):('47 ×','48 ×'),('W11',6):('12 кг','16 кг'),('W11',7):('20 монетаның','30 монетаның'),('W12',1):('2026','2027'),('W12',2):('= 15','= 18'),('W12',3):('30 минут','45 минут'),('W12',4):('64-ке','72-ге'),('W12',5):('30 м','32 м'),('W12',6):('3600','3500')};a,b=pairs[w,i];assert a in r['statement'],(w,i,a);q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==13;entries=[];evidence=[];equalities=mcqs=missing=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and not q['svg'];answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(options(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(options(r))==len(options(q))and not r.get('image')and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,w,i)]:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('semantic canary accepted',w,i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip().rstrip('.,')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',w,i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All13full source/new conditions and complete official/new solutions/every4MCQset read. Exact full digit/factorial valuations, bus/container integer conservation, zero-inclusive linear identity, nested symbolic minus parity, complete absolute root sets, whole-trip delay and all35fake-coin locations with constructive strategy+optimal bound checked. Same author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,bars=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){bars++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,bars}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 coins=one(e for e in evidence if e['editionId'].endswith('-w11-7'));coinCases=sum(len(coins[k]['allCounterfeitDecisionPaths'])for k in['savedSource','rewritten']);summary={'verified':13,'fullSourceNewConditionsAndSolutionsRead':13,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':13,'printedSemanticCanariesRejected':13,'nativeFractions':native['fractions'],'nativeOverlines':native['bars'],'allSourceAndNewCoinLocationsChecked':coinCases,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':13,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
