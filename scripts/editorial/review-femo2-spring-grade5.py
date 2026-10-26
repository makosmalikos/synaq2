"""All10full source/new conditions, full official/new solutions/all2MCQsets
read. Same root author separate exact computations, no separatehumanreviewer.
Everyfour-digit candidate, allninety two-digit insertions, everypositive number
under globallyproved truthdomain bound, every9000/90000 digitfrequency case,
allcube cells and constructive row/column incidences checked. Factorialminimum
includes all lowerindices; original mass/pair-age/awake-distance conservation.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo2-spring-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('controls1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;opts=K.opts

def scalar(s):return E.calc(re.sub(r'\\frac([0-9])([0-9])',r'(\1/\2)',s))

def solve(r,w,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parse=scalar;proof={}
 if i==1:
  divisor,remainder=map(int,n);assert 0<=remainder<divisor;values=[v for v in range(1000,10000)if v%divisor==remainder];out=F(len(values));firstK=math.ceil(F(1000-remainder,divisor));lastK=math.floor(F(9999-remainder,divisor));assert len(values)==lastK-firstK+1 and values[0]==divisor*firstK+remainder and values[-1]==divisor*lastK+remainder;proof={'allFourDigitValuesChecked':9000,'firstMatchingValue':values[0],'lastMatchingValue':values[-1],'firstK':firstK,'lastK':lastK,'exactProgressionCountMatchesFullEnumeration':True,'countTarget':len(values)}
 elif i==2:
  before,after=n;assert s.count('жартысын')==3;remaining=F(1,2)**3;honey=(before-after)/(1-remaining);container=before-honey;assert honey>0 and container>0 and container+honey*remaining==after;out=container;proof={'threeRemainingFractions':'1/2,1/4,1/8','initialHoneyMass':str(honey),'emptyContainerMassTarget':str(container),'initialWholeMass':str(before),'finalWholeMass':str(after),'bothMassConservationEquationsChecked':True}
 elif i==3:
  divisors=list(map(int,n[:4]));assert len(set(divisors))==4 and min(divisors)>1;factorial=1;j=0;failed=[]
  while True:
   j+=1;factorial*=j;bad=[d for d in divisors if factorial%d]
   if not bad:break
   failed.append({'index':j,'nondividingDivisors':bad});assert j<=max(divisors)
  assert len(failed)==j-1 and all(v['nondividingDivisors']for v in failed)and all(math.factorial(j)%d==0 for d in divisors);out=F(j);proof={'allFourDivisors':divisors,'everyLowerIndexHasFailedDivisor':failed,'leastFactorialIndexTarget':j,'allDivisorsDivideChosenFactorial':True}
 elif i==4:
  a,b,c,edge=n;counts=[v/edge for v in[a,b,c]];assert all(v.denominator==1 and v>=3 for v in counts);counts=list(map(int,counts));faceCounts=collections.Counter()
  for cell in itertools.product(*(range(v)for v in counts)):faceCounts[sum(x==0 or x==bound-1 for x,bound in zip(cell,counts))]+=1
  shell=sum(v for faces,v in faceCounts.items()if faces>0);formula=math.prod(counts)-math.prod(v-2 for v in counts);assert shell==formula;out=F(shell)*edge;proof={'cubeCountsAlongThreeAxes':counts,'allCubePositionsChecked':math.prod(counts),'cubeCountsByExposedFaceCount':dict(faceCounts),'exactOuterShellCubeCount':shell,'oneCubeHeightCm':str(edge),'towerHeightCmTarget':str(out),'noDoubleCountingEdgesCorners':True}
 elif i==5:
  divisor,inserted,multiplier=map(int,n);word=one(re.findall(r'жүздік цифрының (\w+) еселенгенін',s));coefficient={'екі':2,'үш':3}[word];pairs=[(a,b)for a,b in itertools.product(range(1,10),range(10))if 100*a+10*inserted+b+coefficient*a==multiplier*(10*a+b)];values=[10*a+b for a,b in pairs if(10*a+b)%divisor==0];out=F(one(values));a,b=divmod(int(out),10);assert 100*a+10*inserted+b+coefficient*a==multiplier*out;proof={'all90TwoDigitPairsChecked':90,'allCandidatesBeforeDivisibilityFilter':[10*a+b for a,b in pairs],'divisibilityFilter':divisor,'uniqueOriginalNumberTarget':str(out),'insertedDigit':inserted,'addedHundredsMultiple':coefficient,'finalOriginalMultiple':multiplier,'placeValueEquationAndFinalCheck':True}
 elif i==6:
  participants,degree,catches=map(int,n);items=F(participants*degree,catches);assert items.denominator==1 and items>=degree>0;items=int(items);rows=[[(j*degree+t)%items for t in range(degree)]for j in range(participants)];assert all(len(set(row))==degree for row in rows);columns=collections.Counter(v for row in rows for v in row);assert set(columns)==set(range(items))and set(columns.values())=={catches};out=F(items);proof={'participantCount':participants,'distinctChoicesPerParticipant':degree,'wholeIncidenceCount':participants*degree,'allConstructiveRowChoices':rows,'allColumnCounts':[columns[j]for j in range(items)],'biregularIncidenceFeasibilityConstructed':True,'itemCountTarget':items}
 elif i==7:
  divisor,bound=map(int,n);upper=max(99,bound);truth={v:(10<=v<=99,v%divisor==0,v<=bound,math.isqrt(v)**2==v,v%2==1)for v in range(1,upper+1)};valid=[v for v,t in truth.items()if sum(t)==4];allTrue=[v for v,t in truth.items()if all(t)];out=tuple(valid);parse=lambda t:tuple(sorted(H.numeric_tokens(t)));assert all(sum(truth[v])==4 for v in out);proof={'globalSearchUpperBound':upper,'proofAboveBoundAtLeastTwoFalse':'n>max(99,bound) violates both two-digit and upper-bound claims','allPositiveDomainValuesChecked':upper,'allExactlyFourTrueNumbers':valid,'allFiveTrueExcluded':allTrue,'allValidTruthVectors':{v:truth[v]for v in valid},'fullNaturalDomainNotArbitrarySample':True}
 elif i==8:
  first,past,second,future,third=n;AB=first;BC=second+2*past;AC=third-2*future;a=(AB+AC-BC)/2;b=AB-a;c=BC-b;assert min(a,b,c)>0 and min(b,c)>past and a+b==first and b-past+c-past==second and a+future+c+future==third and all(v.denominator==1 for v in[a,b,c]);out=a;proof={'allThreePresentAges':[str(a),str(b),str(c)],'presentPairSums':list(map(str,[AB,BC,AC])),'allOriginalPastPresentFutureConditionsChecked':True,'firstPersonsPresentAgeTarget':str(out)}
 elif i==9:
  low,high=map(int,n);word=one(re.findall(r'кемінде (\w+) цифры',s));threshold={'үш':3,'төрт':4}[word];length=len(str(low));assert high==10**length-1 and low==10**(length-1);values=[];multiplicities=collections.Counter()
  for value in range(low,high+1):
   count=max(collections.Counter(str(value)).values());multiplicities[count]+=1
   if count>=threshold:values.append(value)
  out=F(len(values));proof={'allRangeValuesChecked':high-low+1,'digitLength':length,'atLeastRepeatedDigitThreshold':threshold,'countByMaximumDigitMultiplicity':dict(multiplicities),'allQualifyingValues':values,'leadingZerosExcludedByRealIntegerRange':True,'countTarget':len(values)}
  if threshold==length-1:
   allEqual=9;zeroRepeated=9;nonzeroRepeated=9*(8+(length-1)*9);assert len(values)==allEqual+zeroRepeated+nonzeroRepeated;proof['disjointCombinatorialCount']={'allEqual':allEqual,'repeatedZeroOnly':zeroRepeated,'repeatedNonzeroOnly':nonzeroRepeated}
 elif i==10:
  if src:assert s.count('жартыс')==2;initial,ratio=F(1,2),F(1,2)
  else:fracs=re.findall(r'\(\d+/\d+\)',s);assert len(fracs)==2;initial,ratio=map(E.calc,fracs)
  assert 0<initial<1 and ratio>0;sleep=(1-initial)/(1+ratio);after=ratio*sleep;out=1-sleep;assert initial+sleep+after==1 and out==initial+after and min(sleep,after)>0;proof={'initialAwakeFraction':str(initial),'remainingComparedToAsleepFraction':str(ratio),'asleepFraction':str(sleep),'lastAwakeFraction':str(after),'wholeDistanceConserved':True,'totalAwakeFractionTarget':str(out)}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True
 if opts(r):
  values=[parse(v)for v in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesChecked']=True
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
  if i==7:assert values[0]==tuple(sorted(list(out)+allTrue))and values[3]==tuple(v for v in out if math.isqrt(v)**2!=v)
  if i==10:assert values==[initial+(1-initial)*ratio,initial,out,initial+sleep]
 return proof

def mutation(r,w,i):
 pairs={1:('қалдығы 4','қалдығы 3'),2:('18 кг','25 кг'),3:('18, 19 сандарының','18, 23 сандарының'),4:('17 см','18 см'),5:('4-ке бөлінеді','5-ке бөлінеді'),6:('30 оқушының','45 оқушының'),7:('60-тан','70-тен'),8:('48','50'),9:('кемінде төрт','кемінде үш'),10:('(1/3)','(1/4)')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];missing=mcqs=equalities=0
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All10full source/new conditions and full official/new solutions/every2MCQset read. Fullfour-digit enumeration, factorial lowerindices, allcube coordinates, all90digitpairs, constructive distinct row/column incidence, globallybounded fullnatural truthdomain, original time-shift ages, all9000/90000digitcounts and exactwholeawake conservation verified. Same root author no separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
