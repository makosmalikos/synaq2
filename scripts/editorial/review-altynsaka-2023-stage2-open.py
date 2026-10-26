"""All15full saved/newopenconditions and complete official/newsolutions read.
Source17illustration20*108=3160iswrong; explicitdelete-even rule and original
target independentlyrecomputed, allnewexamples correct. FiveMCQsseparate.
Same root author separate exact computation, not anotherhumanreviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2023-stage2-open';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('school2023','scripts/editorial/review-altynsaka-2023-school.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;E=P.E;H=P.H;one=H.one;exact=P.exact

def alphametic(left,right,mult):
 letters=list(dict.fromkeys(left+right));assert len(left)==3 and len(right)==4 and len(letters)==5;assert right[0]==left[1]and right[-1]==left[-1];valid=[]
 for ds in itertools.permutations(range(10),5):
  env=dict(zip(letters,ds))
  if env[left[0]]==0 or env[right[0]]==0:continue
  a=int(''.join(str(env[c])for c in left));b=int(''.join(str(env[c])for c in right))
  if a*mult==b:valid.append((a,b))
 direct=[]
 for a in range(100,1000):
  aa=str(a);bb=str(a*mult)
  if len(bb)==4 and aa[1]==bb[0]and aa[-1]==bb[-1]and len(set(aa+bb[1:3]))==5:direct.append((a,a*mult))
 assert sorted(valid)==direct;return F(len(valid)),{'actualLeftRightLetterWords':[left,right],'actualMultiplier':mult,'all30240FiveDistinctDigitAssignmentsChecked':math.perm(10,5),'all900ThreeDigitNumbersAlsoChecked':900,'allValidOriginalNumberProductPairs':[list(v)for v in direct],'bothLeadingDigitsNonzeroAndFiveLettersDistinct':True,'solutionCountTarget':str(len(valid))}

def buses(girls,boys,boyItems,girlItems,count):
 assert count==3 and boyItems>0 and girlItems>boyItems;total=girls*girlItems+boys*boyItems;per=F(total,count);assert per.denominator==1;possible=[]
 for g in range(girls+1):
  b=(per-girlItems*g)/boyItems
  if b.denominator==1 and 0<=b<=boys:possible.append((g,int(b)))
 valid=[(a,b,c)for a,b,c in itertools.product(possible,repeat=3)if sum(v[0]for v in[a,b,c])==girls and sum(v[1]for v in[a,b,c])==boys];assert valid;minimum=min(a[0]for a,b,c in valid);witness=one(v for v in valid if v==min(v for v in valid if v[0][0]==minimum));local=max(0,math.ceil((per-boys*boyItems)/girlItems));assert all(a*girlItems+b*boyItems==per for a,b in witness);return F(minimum),{'actualGirlsBoysBoyItemsGirlItemsBusCount':[girls,boys,boyItems,girlItems,count],'wholeItemTotal':total,'itemsPerBus':str(per),'allPossibleSingleBusGirlBoyPairs':[list(v)for v in possible],'allFeasibleOrderedThreeBusAssignmentsChecked':len(valid),'naiveSingleBusOnlyLowerBound':local,'actualGlobalFeasibleMinimum':minimum,'allThreeBusGirlBoyWitness':[list(v)for v in witness],'allChildrenAndItemsAllocatedWithExactTotals':True,'minimumGirlsTarget':str(minimum)}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==3:
  a,b,divisor=n;valid=[v for v in range(100,1000)if v%divisor==0];largest=max(valid);out=F(largest,2)/(a/b);assert out*a/b==F(largest,2);proof={'actualFractionAndDivisor':list(map(str,n)),'all900ThreeDigitMultiplesChecked':900,'largestThreeDigitMultiple':largest,'recoveredWholeNumberTarget':str(out)}
 elif i==4:
  p,q=n;first=100+p;second=100+q;out=(first-second)/second*100;assert first>second>0 and second*(1+out/100)==first;proof={'actualTwoExcessPercentsOverSameBase':list(map(str,n)),'concreteSameBaseHundredCounts':list(map(str,[first,second])),'comparisonDenominatorIsSecondPersonsStock':True,'relativeExcessPercentTarget':str(out)}
 elif i==5:
  pct,totalTime=n;assert 0<pct<100 and totalTime>1;firstSpeed=pct/100;remaining=1-firstSpeed;timeLeft=totalTime-1;newSpeed=remaining/timeLeft;ratio=newSpeed/firstSpeed;out=(ratio-1)*100;assert ratio>1 and 1+remaining/newSpeed==totalTime;proof={'actualCompletedPercentAndTotalTimeMultiple':list(map(str,n)),'normalizedDistanceAndInitialTime':[1,1],'initialAndRequiredNewSpeeds':list(map(str,[firstSpeed,newSpeed])),'remainingTimeMultiple':str(timeLeft),'speedRatioNotIncreasePercent':str(ratio),'increasePercentTarget':str(out)}
 elif i==7:
  total,divisor=map(int,n);valid=[v for v in range(100,1000)if sum(map(int,str(v)))==total and v%divisor==0];out=F(len(valid));byLast={d:len([v for v in valid if v%10==d])for d in range(10)if any(v%10==d for v in valid)};assert sum(byLast.values())==out;proof={'actualDigitSumAndDivisor':[total,divisor],'all900ThreeDigitNumbersChecked':900,'allMatchingNumbers':valid,'countsByUnitsDigit':byLast,'matchingNumberCountTarget':str(out)}
 elif i==8:
  total,a,b,c=n[:4];assert all(v==total for v in n[4:]);triple=(a+b+c-total)/2;single=total-triple;only=[a-triple,b-triple,c-triple];assert triple>0 and triple.denominator==1 and min(only)>=0 and sum(only)==single;out=single;assert single+3*triple==a+b+c;proof={'actualPopulationAndThreeMembershipCounts':list(map(str,[total,a,b,c])),'tripleOnlyMembers':str(triple),'threeSingleOnlyRegions':list(map(str,only)),'noExactTwoAndEveryPersonInAtLeastOneVerified':True,'onlyOneMembershipCountTarget':str(out)}
 elif i==9:
  if src:prefix=list(map(int,n[:-2]));index,divisor=map(int,n[-2:]);first=prefix[0];mult,add=2,1;assert all(b==2*a+1 for a,b in zip(prefix,prefix[1:]))
  else:mult,add,first,index,divisor=map(int,n)
  assert(mult,add)==(2,1);value=first;remainders=[first%divisor]
  for j in range(1,index):value=mult*value+add;remainders.append((mult*remainders[-1]+add)%divisor)
  out=F(value%divisor);assert out==remainders[-1]and value==(first+1)*2**(index-1)-1;proof={'actualFirstMultiplierAddIndexDivisor':[first,mult,add,index,divisor],'allDirectBigIntegerRecurrenceStepsChecked':index,'exactFinalInteger':str(value),'modularRecurrenceAndIndependentClosedFormAgree':True,'allRemainderSequenceThroughAskedIndex':remainders,'askedRemainderTarget':str(out)}
 elif i==10:
  if src:words=re.findall(r'\\overline\{\\text\{([^}]+)\}\}',s);assert len(words)==4 and words[0]==words[1]==words[2];left,right=words[0],words[3];mult=3
  else:left,right=re.findall(r'overline\(([A-Z]+)\)',s);mult=int(one(n))
  out,proof=alphametic(left,right,mult)
 elif i==12:
  workers,days,quantity,newWorkers,newDays=n;rate=quantity/(workers*days);out=rate*newWorkers*newDays;assert out.denominator==1 and rate>0;proof={'allFiveActualWorkInputs':list(map(str,n)),'exactOneWorkerDayOutput':str(rate),'newWorkerDays':str(newWorkers*newDays),'workOutputTarget':str(out)}
 elif i==13:
  a,b=n;fraction=a/b;assert 0<fraction<1;unit=F(360)/(2+fraction);angles=[unit,unit,unit*fraction];assert sum(angles)==360 and angles[0]==angles[1]and angles[2]/angles[1]==fraction;out=min(angles);proof={'actualThirdToSecondFraction':str(fraction),'allThreeAngles':list(map(str,angles)),'full360EqualFirstTwoAndExactThirdRatioVerified':True,'minimumSectorDegreesTarget':str(out)}
 elif i==14:
  if src:girls,boys,boyItems,girlItems,count=map(int,n)
  else:girls,boys,count,girlItems,boyItems=map(int,n)
  out,proof=buses(girls,boys,boyItems,girlItems,count)
 elif i==15:
  base,coefficient,divisor=n;valid=[x for x in range(10,100)if(base+coefficient*x)%divisor==0];out=F(max(valid));assert all((base+coefficient*x)%divisor!=0 for x in range(int(out)+1,100));proof={'actualBaseCoefficientDivisor':list(map(str,n)),'all90TwoDigitCandidatesChecked':90,'allValidTwoDigitValues':valid,'largestValidTwoDigitValueTarget':str(out)}
 elif i==16:
  total,answered,score,gain,penalty=n[:5];assert all(v==0 for v in n[5:]);assert answered<=total;valid=[c for c in range(int(answered)+1)if c*gain-(answered-c)*penalty==score];correct=one(valid);out=F(correct);assert correct+(answered-correct)+(total-answered)==total;proof={'actualTotalAnsweredScoreGainPenalty':list(map(str,[total,answered,score,gain,penalty])),'allPossibleCorrectCountsChecked':int(answered)+1,'correctWrongSkipped':list(map(str,[F(correct),answered-correct,total-answered])),'allThreeScoringCasesReconstructExactTotal':True,'correctAnswerCountTarget':str(out)}
 elif i==17:
  part=H.math_parts(s,src)[-1];expr=part[1:-1]if src and part.startswith('[')else one(re.findall(r'D\((.*)\)',part));value=exact(H.tex(expr));assert value.denominator==1 and value>0;kept=''.join(ch for ch in str(value.numerator)if int(ch)%2);out=F(int(kept or'0'));proof={'actualFullProductExpression':expr,'actualFullIntegerProduct':str(value),'allOddDigitsKeptInOriginalOrder':kept,'operationAppliedAfterWholeProductNotToIndividualFactors':True,'retainedDigitIntegerTarget':str(out)}
  if src:assert 20*108==2160 and 20*108!=3160;proof['originalBadIllustrativeMultiplicationDetected']=True;proof['correctedOriginalExampleProductAndRetainedDigits']=['2160','1'];proof['explicitSourceDeleteEvenRuleAndCorrectOriginalTargetUsed']=True
  else:
   assert'D(5720) = 57'in s and'D(14 × 25) = D(350) = 35'in s;assert''.join(ch for ch in str(14*25)if int(ch)%2)=='35';proof['bothNewPrintedExamplesCheckedAndConsistent']=True
 elif i==18:
  prime,power=map(int,n);assert prime==2;valid=[]
  for value in range(1000,10000):
   temp=value;exp=0
   while temp%2==0:temp//=2;exp+=1
   if exp==power:valid.append(value)
  out=F(len(valid));low,high=1000,9999;count=lambda divisor:high//divisor-(low-1)//divisor;assert out==count(2**power)-count(2**(power+1));proof={'actualPrimeAndExactExponent':[prime,power],'all9000FourDigitValuationsChecked':9000,'divisibleByPowerCount':count(2**power),'divisibleByNextPowerCount':count(2**(power+1)),'exactValuationCountEqualsDifferenceOfMultiples':True,'fourDigitCountTarget':str(out)}
 elif i==19:
  if src:pairs=[tuple(map(int,p))for p in re.findall(r'\\dfrac\{(\d+)\}\{(\d+)\}',s)];assert len(pairs)==5;firstNum,firstDen=pairs[0];numStep,denStep=pairs[1][0]-firstNum,pairs[1][1]-firstDen;assert all(p==(firstNum+j*numStep,firstDen+j*denStep)for j,p in enumerate(pairs))
  else:firstNum,firstDen,numStep,denStep=map(int,n)
  assert numStep>0 and denStep>0;upper=min((99-firstNum)//numStep,(99-firstDen)//denStep)+1;valid=[]
  for index in range(1,upper+1):
   a,b=firstNum+(index-1)*numStep,firstDen+(index-1)*denStep
   if min(a,b)<10:continue
   if a%10==b%10 and len({a//10,b//10,a%10})==3:valid.append([index,a,b])
  out=F(len(valid));proof={'actualFirstNumeratorDenominatorAndBothSteps':[firstNum,firstDen,numStep,denStep],'allPotentialTwoDigitNumeratorDenominatorIndicesChecked':upper,'allValidIndexUnreducedNumeratorDenominatorTriples':valid,'originalUnreducedTermsKeptInsteadOfReducingFractions':True,'equalUnitsAndThreeDistinctLetterDigitsChecked':True,'matchingUnreducedTermCountTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={3:('64-ке','72-ге'),4:('80% артық','92% артық'),5:('2.5 × t','2 × t'),7:('қосындысы 18','қосындысы 12'),8:('140 оқушының','150 оқушының'),9:('119-мүшесін','120-мүшесін'),10:('× 4 =','× 5 ='),12:('4 шебер 15','8 шебер 15'),13:('(1/2)','(1/4)'),14:('90 ұл','102 ұл'),15:('2026 +','2027 +'),16:('172 ұпай','182 ұпай'),17:('D(18 ×','D(20 ×'),18:('дәл 4 рет','дәл 5 рет'),19:('мүшенің алымы 3,','мүшенің алымы 4,')}[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];ids={3,4,5,7,8,9,10,12,13,14,15,16,17,18,19};assert len(rows)==15 and{r['params']['number']for r in rows}==ids;entries=[];evidence=[];equalities=0;changedAnswers={3:'624',4:'60',5:'200',7:'14',8:'130',9:'1',10:'5',12:'50',13:'40',14:'16',15:'96',16:'29',17:'375',18:'140',19:'2'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and not q['images']and q['solution'];answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('validchangedmath',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('options')and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15fullsource/newconditions and fullsolutions read. Full3digitmultiples anddigitcounts, correctrelativepercentbase andnormalizedmotiontime, everysetregion, fullBigIntrecurrencecrossmodular/closedform, all30240alphameticassignmentscross900numbers, uniformwork, allsectorangles, allfeasibleordered3busintegerallocationsnotjustnaivebound, all90linearcongruencecandidates, allcorrectcounts/skippedscoring, fullproductthenorderedodd-digitfilterwithsourcewrongexampleexplicitlycorrected, all9000exact2valuations and everyfiniteunreducedfractionindex checked. Allvalidchangedinputsrejectoldkeysandacceptrecomputedkeys. FiveMCQsremainseparate. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,overlines=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){overlines++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,overlines}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'capturedOpenKeys':15,'wrongKeysRejected':15,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':15,'nativeFractions':native['fractions'],'nativeOverlines':native['overlines'],'source17WrongExampleCorrected':True,'globalBusMinimumNotNaiveLocalBound':True,'fiveSourceMCQsStillSeparate':[1,2,6,11,20],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
