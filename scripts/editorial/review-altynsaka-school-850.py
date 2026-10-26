"""All14full frozen/newconditions and complete official/newsolutions, all13source
and13newMCQoptions read. Same root author separate exact computational check,
not another humanreviewer. Sequence officialrule made explicit ratherthan
claiming a uniquely forced unstated pattern.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-school-850';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('schoolEB1','scripts/editorial/review-altynsaka-school-eb1.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;K=P.K;H=P.H;one=H.one;exact=P.exact
SOURCE='problems/sources/zerek/collections/85095b7a-6b31-40d4-921c-e575bbfb1a90.json'
def options(r):return[exact(H.tex(o['text']if isinstance(o,dict)else o))for o in r['options']]
def question(i):return one(q for q in json.loads((ROOT/SOURCE).read_text())['questions']if q['number']==i)

def solve(r,i,src=False):
 s=r['statement'];clean=re.sub(r'\$\^2\$|²','',s);n=H.numeric_tokens(clean)
 if i==1:
  a,b=n;assert a>b>0;perimeter=2*(a+b);side=perimeter/4;old=a*b;new=side**2;out=new-old;assert 4*side==perimeter and out==(a-b)**2/4;proof={'actualRectangleSidesMeters':list(map(str,n)),'unchangedFencePerimeter':str(perimeter),'newSquareSide':str(side),'oldAndNewAreas':list(map(str,[old,new])),'areaIncreaseEqualsQuarterSquaredSideDifference':True,'areaIncreaseTarget':str(out)}
 elif i==2:
  distance,gap=n;assert distance%gap==0;positions=list(range(0,int(distance)+1,int(gap)));out=F(len(positions));opts=options(r);intervals=distance/gap;assert opts==[intervals-1,intervals,intervals+1,intervals+2]and sum(v==out for v in opts)==1;proof={'actualRoadLengthAndSpacing':list(map(str,n)),'allTreePositionsBothEndpointsIncluded':positions,'allFourOriginalIntervalCountDistractorRolesPreserved':True,'treeCountTarget':str(out)}
 elif i==3:
  if src:minutes,first,second,third,last=map(int,n);assert(first,second,third,last)==(1,2,3,minutes);step=1
  else:minutes,first,step=map(int,n)
  speeds=[first+j*step for j in range(minutes)];legs=[F(speed*1000,60)for speed in speeds];out=sum(legs);assert out==F(minutes*(2*first+(minutes-1)*step)*1000,120);proof={'actualMinuteCountFirstSpeedStep':[minutes,first,step],'allActualMinuteSpeedsKmPerHour':speeds,'allMinuteDistancesMeters':list(map(str,legs)),'minuteWiseDistanceSumEqualsArithmeticSeriesUnitConversion':True,'totalDistanceMetersTarget':str(out)}
 elif i==4:
  factorials=list(map(int,re.findall(r'(\d+)!',s)));a,b=factorials[-2:];assert a>b>=1;out=F(math.factorial(a),math.factorial(b));after=math.prod(range(b+1,a+1));assert out==after;assert src or'«(A/B)»'in s;proof={'actualNumeratorDenominatorFactorials':[a,b],'fullBigIntegerFactorials':[str(math.factorial(a)),str(math.factorial(b))],'allUncancelledFactorSequence':list(range(b+1,a+1)),'directFactorialQuotientEqualsCancellationProduct':True,'factorialQuotientTarget':str(out)}
 elif i==5:
  percent,difference=n;rate=F(1,4)-percent/100;assert rate>0 and difference>0;number=difference/rate;assert number.denominator==1 and number>0;out=F(sum(map(int,str(int(number)))));assert number/4-percent*number/100==difference;proof={'actualQuarterPercentageAndDifference':list(map(str,n)),'uniqueWholeOriginalNumber':str(number),'quarterAndPercentDifferenceRechecked':True,'originalNumberDigitSumTarget':str(out)}
 elif i==6:
  normalized=s.replace('$','').replace('\\%','%');sizes=list(map(int,re.findall(r'(\d+)\s*оқушы',normalized)));percentages=list(map(int,re.findall(r'(\d+)%',normalized)));a,b=sizes;boysA,girlsB=percentages;girls=[a*(100-F(boysA))/100,F(b)*girlsB/100];assert all(v.denominator==1 for v in girls);out=100*sum(girls)/(a+b);assert 0<=out<=100;proof={'actualGroupSizes':sizes,'firstBoyPercentSecondGirlPercent':percentages,'bothWholeGirlCounts':list(map(str,girls)),'combinedGirlsAndAllStudents':[str(sum(girls)),a+b],'weightedByStudentCountsRatherThanMeanOfPercentages':True,'combinedGirlPercentTarget':str(out)}
 elif i==7:
  days,total,second,mult=n;assert days==3 and mult>1;third=(total-mult*second)/(mult+1);first=total-second-third;assert first>0 and third>0 and first.denominator==third.denominator==1;assert first+second==mult*(second+third);out=first;proof={'allActualDaysTotalSecondMultiplier':list(map(str,n)),'allThreeDayCounts':list(map(str,[first,second,third])),'bothOverlappingTwoDayTotalsAndWholeSumVerified':True,'firstDayCountTarget':str(out)}
 elif i==8:
  if src:pairs=[(int(a),int(b))for a,b in re.findall(r'\\dfrac\{(\d+)\}\{(\d+)\}',s)];base,step,index=2,4,7
  else:pairs=[(int(a),int(b))for a,b in re.findall(r'\((\d+)/(\d+)\)',s)];step=int(one(re.findall(r'бөлім (\d+)-ке',s)));index=int(one(re.findall(r'(\d+)-мүшесін',s)));base=F(pairs[0][1],pairs[0][0])
  values=[F(a,b)for a,b in pairs];assert len(values)==6 and all(v==F(j+1,base+step*j)for j,v in enumerate(values));out=F(index,base+step*(index-1));opts=options(r);assert sum(v==out for v in opts)==1
  if not src:
   q=question(8);original=[F(int(a),int(b))for a,b in re.findall(r'\\dfrac\{(\d+)\}\{(\d+)\}',q['statement'])];sourceOpts=options(q);assert values==[v/(1+v)for v in original]and opts==[v/(1+v)for v in sourceOpts]
  proof={'allSixActualReducedTerms':list(map(str,values)),'allSixUnreducedNumerators':list(range(1,7)),'allSixUnreducedDenominators':[str(base+step*j)for j in range(6)],'actualNumeratorStep':1,'actualDenominatorStep':step,'actualRequestedIndex':index,'allActualMCQFractionValues':list(map(str,opts)),'allSourceTermsAndOptionsMappedByTOverOnePlusTPreservingOrder':not src,'officialLinearNumeratorDenominatorRuleExplicitInRewrite':not src,'indexedFractionTarget':str(out)}
 elif i==9:
  childAgo,fatherAgo,a,b,now=n;oldFather=now-fatherAgo;oldChild=oldFather*a/b;out=oldChild+childAgo;assert oldFather>oldChild>=0 and out<now and out.denominator==1;assert(out-childAgo)/(now-fatherAgo)==a/b;proof={'allActualPastTimesFractionCurrentFather':list(map(str,n)),'fatherAgeAtHisSpecifiedPastMoment':str(oldFather),'daughterAgeAtHerDifferentPastMoment':str(oldChild),'differentPastTimesKeptSeparate':True,'currentDaughterAgeTarget':str(out)}
 elif i==10:
  definition=re.sub(r'[()\s]','',H.tex(s).replace('\\circledcirc','⊙'));assert'a⊙b=a/b+b/a'in definition
  a,b,c=n;assert a*b*c!=0;operation=lambda x,y:x/y+y/x;inner=operation(a,b);out=operation(inner,c);assert inner!=0 and out>=2;proof={'actualThreeDecimalOperands':list(map(str,n)),'exactInnerResult':str(inner),'exactOuterBothReciprocalTerms':list(map(str,[inner/c,c/inner])),'actualReciprocalSumDefinitionParsed':True,'noBinaryFloatingPointUsed':True,'nestedOperationTarget':str(out)}
 elif i==11:
  start,high=int(n[0]),int(n[1]);digit=int(n[-1]);assert start==1 and 0<=digit<=9;written=''.join(str(v)for v in range(start,high+1));out=F(written.count(str(digit)));byPlace=collections.Counter()
  for v in range(start,high+1):
   for place,char in enumerate(str(v)[::-1]):
    if int(char)==digit:byPlace[10**place]+=1
  assert out==sum(byPlace.values());proof={'actualInclusiveBoundsAndTargetDigit':[start,high,digit],'allWrittenNumbers':high,'occurrencesByPlaceValue':dict(byPlace),'concatenatedCountEqualsEveryPositionCount':True,'repeatedTargetDigitsWithinOneNumberCountedSeparately':True,'digitOccurrenceCountTarget':str(out)}
 elif i==12:
  ratio=one(n);assert ratio>1;out=(ratio-1)/(ratio+1);opts=options(r);assert all(0<t<1 for t in opts)and sum(t==out for t in opts)==1;computed=[(1+t)/(1-t)for t in opts];assert one(t for t,v in zip(opts,computed)if v==ratio)==out
  if not src:sourceOpts=options(question(12));assert opts==[(1+t)/(3-t)for t in sourceOpts]
  stock=out.denominator*2;given=stock*out;left,right=stock-given,stock+given;assert min(left,right)>0 and all(v.denominator==1 for v in[given,left,right])and right/left==ratio;proof={'actualRequiredReceiverToGiverRatio':str(ratio),'allActualTransferMCQFractions':list(map(str,opts)),'resultingReceiverToGiverRatiosForEveryOption':list(map(str,computed)),'allSourceOptionRatioRolesMappedByPlusOne':not src,'concreteWholeStockTransferGiverReceiverWitness':list(map(str,[F(stock),given,left,right])),'equalInitialStockAndConservedWholeTotalVerified':True,'fractionOfGiversOriginalStockTarget':str(out)}
 elif i==13:
  digits=list(map(int,n[:-1]));divisor=int(n[-1]);assert len(digits)==len(set(digits))==4 and divisor>0;required=set(digits);valid=[]
  for ds in itertools.product(digits,repeat=5):
   if ds[0]and set(ds)==required:
    v=int(''.join(map(str,ds)))
    if v%divisor==0:valid.append(v)
  direct=[v for v in range(10000,100000)if set(map(int,str(v)))==required and v%divisor==0];assert sorted(valid)==direct and valid;out=F(min(valid));proof={'allFourActualRequiredAllowedDigits':digits,'actualDivisor':divisor,'all1024FivePositionDigitTuplesChecked':4**5,'all90000FiveDigitNumbersAlsoChecked':90000,'bothAllowedOnlyAndEachAtLeastOnceEnforced':True,'allMatchingCandidates':sorted(valid),'zeroLeadingDigitRejected':True,'minimumMatchingFiveDigitNumberTarget':str(out)}
 elif i==14:
  number=int(one(n));odd=number;twos=0
  while odd%2==0:odd//=2;twos+=1
  divisors=set()
  for d in range(1,math.isqrt(number)+1):
   if number%d==0:
    for v in[d,number//d]:
     if v%2:divisors.add(v)
  assert min(divisors)==1 and max(divisors)==odd and odd*2**twos==number;out=F(1+odd);proof={'actualWholeInteger':number,'allPotentialDivisorsThroughSquareRootChecked':math.isqrt(number),'removedPowerOfTwo':twos,'allPositiveOddDivisors':sorted(divisors),'largestOddPartEqualsExhaustiveDivisorMaximum':True,'smallestPlusLargestOddDivisorTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('72 м','80 м'),2:('96 м','104 м'),3:('6 минут','9 минут'),4:('A = 10!','A = 11!'),5:('9-ға артық','12-ге артық'),6:('50%-ы қыз','75%-ы қыз'),7:('132 есеп','135 есеп'),8:('7-мүшесін','8-мүшесін'),9:('50 жаста','55 жаста'),10:('⊙ 4.25»','⊙ 8.5»'),11:('250-ге','260-ға'),12:('5 есе көп','6 есе көп'),13:('0, 1, 4, 8 цифрларынан','0, 1, 4, 7 цифрларынан'),14:('160160160','224224224')}[i];assert a in r['statement'];bad={**r,'statement':r['statement'].replace(a,b)}
 if i==2:bad['options']=['12','13','14','15']
 return bad

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14 and {r['params']['number']for r in rows}==set(range(1,15));entries=[];evidence=[];equalities=0;changedAnswers={1:'784',2:'14',3:'1500',4:'990',5:'8',6:'75',7:'84',8:'(4/19)',9:'24',10:'(5/2)',11:'117',12:'(5/7)',13:'10047',14:'7007008'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']
  if q['options']:answer=one(o['text']for o in q['options']if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer'])
  else:answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip();assert q['sourceAnswer']is None
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('changedvalidinput',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndRecomputedChangedKeyAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('image')and r['statement']!=q['statement'];assert len(r.get('options',[]))==len(q['options']);assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All14full source/newconditions and completeofficial/newsolutions, all13source/newMCQoptions read. Fixedperimeterareaidentity, everytreeposition/bothendpoints/all4MCQroles, everyminuteactualspeed/unitdistance, fullbigintfactorialscrosscancellation, quarterpercentnumberanddigitsum, wholeweightedgirlcounts, bothoverlappingdaytotals, everyreducedfractionterm andorder-preservingtransformofall4sequenceoptions, differentpastagetimes, exactnestedreciprocaloperation, everydigitpositioncrossconcatenation, everytransferoptionfinalratio/wholeintegerwitness andratio+1transform, all1024allowedtuplescross90000fivedigitnumbers, andfullsqrtodddivisorenumerationcrossremovealltwos checked. Everyvalidchangedinputrejectsoldkeyandacceptscorrectchangedkey. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options??[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'fullSourceNewConditionsAndSolutionsRead':14,'capturedOpenKeys':11,'capturedMCQKeys':3,'sourceMCQOptionsRead':13,'rewrittenMCQOptionsRead':13,'wrongKeysRejected':14,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':14,'nativeFractions':native['fractions'],'nativeFigures':0,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':14,'bothFractionMCQTransformationsPreserveOriginalOptionRoles':True,'ambiguousUnstatedSequenceRuleMadeExplicit':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
