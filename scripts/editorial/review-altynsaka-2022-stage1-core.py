"""All19full frozen/newnonvisualconditions and complete official/newsolutions,
all8source/newtimeMCQoptions read. Source18framevisualseparate. Same root
author separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2022-stage1-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('district','scripts/editorial/review-altynsaka-2025-district-core.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;E=P.E;H=P.H;one=H.one;exact=P.exact
opts=lambda r:[o['text']if isinstance(o,dict)else o for o in r['options']]
def clocks(s):return[60*int(a)+int(b)for a,b in re.findall(r'(\d{1,2}):(\d{2})',s.replace('$','').replace('{:}',':'))]
def clock_answer(r,minutes,offsets):
 values=[one(clocks(o))for o in opts(r)];assert values==[minutes+v for v in offsets]and values.count(minutes)==1 and one(clocks(r['answer']))==minutes;return values

def money(mult,last):
 state=[last]*3;back=[state.copy()]
 for giver in[2,1,0]:
  before=state.copy();spent=F(0)
  for j in range(3):
   if j!=giver:before[j]=state[j]/mult;spent+=state[j]-before[j]
  before[giver]=state[giver]+spent;assert all(v>0 and v.denominator==1 for v in before)and sum(before)==sum(state);state=before;back.append(state.copy())
 initial=state.copy();forward=[state.copy()]
 for giver in range(3):
  after=state.copy();spent=F(0)
  for j in range(3):
   if j!=giver:after[j]=mult*state[j];spent+=after[j]-state[j]
  after[giver]-=spent;assert min(after)>=0 and sum(after)==sum(initial);state=after;forward.append(state.copy())
 assert forward==back[::-1]and state==[last]*3;return initial[0],{'actualReceiverMultiplierAndFinalEachStock':list(map(str,[mult,last])),'allThreeInitialStocks':list(map(str,initial)),'allFourReverseStates':[[str(v)for v in a]for a in back],'allFourForwardStates':[[str(v)for v in a]for a in forward],'everyMoveIntegerNonnegativeAndWholeMoneyConserved':True,'fullForwardReplayMatchesReverseReconstruction':True,'firstInitialMoneyTarget':str(initial[0])}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);special=False
 if i==1:
  diff,total=n;out=(total-diff)/2;older=out+diff;assert 0<out<older and out.denominator==older.denominator==1 and older+out==total;proof={'actualAgeDifferenceAndTotal':list(map(str,n)),'motherDaughterAges':list(map(str,[older,out])),'daughterAgeTarget':str(out)}
 elif i==2:
  a,b,c,d=n;assert a==2*c;expr=one(H.math_parts(s,src));out=exact(H.tex(expr));assert out==c*(2*b+d);proof={'allFourActualProductInputs':list(map(str,n)),'fullExpressionEqualsCommonHalfFactorExpansion':True,'expressionValueTarget':str(out)}
 elif i==3:
  start=one(clocks(s));clean=re.sub(r'\d{1,2}:\d{2}','',s.replace('$','').replace('{:}',':'));lesson,brk,count=map(int,H.numeric_tokens(clean));elapsed=lesson*count+brk*(count-1);out=start+elapsed;values=clock_answer(r,out,[-160,-150,0,brk]);special=True;proof={'actualStartLessonBreakLessonCount':[start,lesson,brk,count],'actualBreakCount':count-1,'allLessonAndBreakMinutes':elapsed,'allFourOriginalTimeOffsetRolesPreserved':True,'allFourOptionClockMinutes':values,'endClockMinutesTarget':out,'noBreakAfterLastLessonIncluded':True}
 elif i==4:
  total=int(one(n));prime=lambda x:x>1 and all(x%d for d in range(2,math.isqrt(x)+1));pairs=[(a,total-a)for a in range(2,total//2+1)if prime(a)and prime(total-a)];a,b=one(pairs);out=F(a*b);assert a+b==total and total%2 and a==2;proof={'actualOddPrimeSum':total,'allPotentialUnorderedPrimePairsChecked':total//2-1,'allPrimePairs':pairs,'bothPrimalitiesCheckedThroughSquareRoots':True,'primeProductTarget':str(out)}
 elif i==5:
  train,speed,bridge=n;v=speed*1000/3600;distance=bridge*1000+train;out=distance/v;assert v*out-train==bridge*1000;proof={'actualTrainMetersSpeedKmPerHourBridgeKm':list(map(str,n)),'speedMetersPerSecond':str(v),'frontDistanceUntilTailExits':str(distance),'frontEntryToTailExitTargetSeconds':str(out)}
 elif i==6:
  slow,late,fast,early=n;assert 0<slow<fast and late>0 and early>0;distance=((late+early)/60)/(1/slow-1/fast);deadline=distance/slow-late/60;assert deadline==distance/fast+early/60 and deadline>0;out=distance/deadline;assert slow<out<fast;proof={'actualSlowLateFastEarly':list(map(str,n)),'uniqueTripDistanceKm':str(distance),'availableDeadlineTimeHours':str(deadline),'bothActualTravelTimesHours':list(map(str,[distance/slow,distance/fast])),'bothLateAndEarlyConstraintsRecheckedAtSameDeparture':True,'requiredOnTimeSpeedTarget':str(out)}
 elif i==7:
  mult,last=n;assert mult>1;out,proof=money(mult,last)
 elif i==8:
  first,last=map(int,[exact(v)for v in H.math_parts(s,True)]if src else n);out=F(first+last-1);assert first>=1 and last>=1;proof={'actualPositionsFromBothEnds':[first,last],'peopleBeforeSelfAfter':[first-1,1,last-1],'selfCountedExactlyOnce':True,'linePeopleCountTarget':str(out)}
 elif i==9:
  give1,give2,total=n;third=(total-2*give1-4*give2)/3;second=third+2*give2;first=second+2*give1;assert third>0 and all(v.denominator==1 for v in[first,second,third]);assert first+second+third==total and first-give1==second+give1 and second-give2==third+give2;out=third;proof={'actualTwoIndependentCounterfactualGiftsAndTotal':list(map(str,n)),'allThreeOriginalStocks':list(map(str,[first,second,third])),'bothCounterfactualTransfersIndividuallyRecheckedFromOriginalStocks':True,'thirdOriginalStockTarget':str(out)}
 elif i==10:
  a,b,c,total=n;unit=total/(a+b+c);stocks=[a*unit,b*unit,c*unit];assert all(v.denominator==1 for v in stocks)and sum(stocks)==total;out=stocks[2];proof={'actualThreeRatiosAndWholeTotal':list(map(str,n)),'allThreeWholeContributions':list(map(str,stocks)),'sameDurationConstantRateRatiosAndTotalVerified':True,'thirdContributionTarget':str(out)}
 elif i==11:
  length,*gaps=map(int,n);assert len(gaps)==3;positions=[list(range(0,length+1,gap))for gap in gaps];assert all(pos[-1]==length for pos in positions);out=F(sum(len(pos)for pos in positions));proof={'actualRoadLengthAndThreeRowGaps':[length,*gaps],'allSeparateRowTreeCounts':[len(pos)for pos in positions],'firstAndLastTreeIncludedInEveryRow':True,'treesAtSameLongitudinalPositionInDifferentRowsCountSeparately':True,'wholeTreeCountTarget':str(out)}
 elif i==12:
  head,mult=n;assert head>0 and mult>1;out=head/(mult-1);assert mult*out==head+out;proof={'actualHeadstartAndFasterSpeedMultiple':list(map(str,n)),'timeMeasuredAfterFasterLeaves':True,'sameOriginSameDirectionAndCatchupPositionsRechecked':True,'catchupMinutesTarget':str(out)}
 elif i==13:
  start,high,divisor=map(int,n);assert start==1 and divisor==5;valid=[v for v in range(1,high+1)if sum(map(int,str(v)))%divisor==0];blocks=high//10;blockCounts=[sum(sum(map(int,str(10*j+d)))%divisor==0 for d in range(10))for j in range(blocks)];assert all(v==2 for v in blockCounts);tail=[v for v in range(10*blocks,high+1)if sum(map(int,str(v)))%divisor==0];out=F(len(valid));assert out==sum(blockCounts)-1+len(tail);proof={'actualInclusiveBoundAndDigitSumDivisor':[high,divisor],'allPositiveNumbersChecked':high,'allCompleteTenNumberBlockCountsVerifiedTwo':blocks,'zeroInInitialCompleteBlockExplicitlyRemoved':True,'allFinalPartialBlockHits':tail,'directEnumerationEqualsIndependentBlockAndTailCount':True,'matchingDigitSumCountTarget':str(out)}
 elif i==14:
  low,high,mult,count=n;cost=(mult*low-high)/(mult-1);assert 0<cost<low<high and high-cost==mult*(low-cost);out=count*cost;proof={'actualBothSalePricesProfitMultiplierQuantity':list(map(str,n)),'oneItemOriginalCost':str(cost),'bothPositiveProfits':list(map(str,[low-cost,high-cost])),'profitRatherThanSalePriceMultiplierUsed':True,'wholePurchaseCostTarget':str(out)}
 elif i==15:
  normal,fast=clocks(s);mult=int(one(re.findall(r'(\d+)\s*есе',H.tex(s))));saved=normal-fast;travel=F(saved)/(1-F(1,mult));out=F(normal)-travel;assert out+travel/mult==fast and out+travel==normal and out.denominator==1;values=clock_answer(r,int(out),[-15,0,5,30]);special=True;proof={'actualNormalFastArrivalClockMinutes':[normal,fast],'actualFasterMultiplier':mult,'originalTravelMinutes':str(travel),'sameDepartureBothArrivalConstraintsVerified':True,'allFourOriginalAnswerTimeOffsetRolesPreserved':True,'allFourOptionClockMinutes':values,'departureClockMinutesTarget':int(out)}
 elif i==16:
  children,wheels=n;young=wheels-2*children;school=children-young;assert min(young,school)>=0 and all(v.denominator==1 for v in[young,school])and 3*young+2*school==wheels;out=school;proof={'actualTotalChildrenWheels':list(map(str,n)),'threeWheelAndTwoWheelChildCounts':list(map(str,[young,school])),'oneBikePerChildAndExactWheelTotalVerified':True,'schoolChildCountTarget':str(out)}
 elif i==17:
  equation=one(H.math_parts(s,src));out,proof=E.equation(H.tex(equation));proof['fullOriginalEquation']=equation;proof['unknownSubtrahendTarget']=str(out)
 elif i==19:
  values=list(map(int,n[:-1]));divisor=int(n[-1]);assert len(values)==len(set(values))==6;valid=[(a,b)for a,b in itertools.combinations(values,2)if(a+b)%divisor==0];out=F(len(valid));groups={d:[v for v in values if v%divisor==d]for d in range(divisor)};byResidue=sum(math.comb(len(vs),2)if d==(divisor-d)%divisor else len(vs)*len(groups[(divisor-d)%divisor])for d,vs in groups.items()if d<=(divisor-d)%divisor);assert out==byResidue;proof={'actualSixValuesAndDivisor':[values,divisor],'all15UnorderedDistinctPairsChecked':15,'allValidPairs':[list(v)for v in valid],'residueGroups':groups,'directPairEnumerationEqualsRemainderGroupCounting':True,'validPairCountTarget':str(out)}
 elif i==20:
  nn=H.numeric_tokens(re.sub(r'\$\^2\$|²','',s));deltaL,incAreaL,deltaW,incAreaW,*last=nn;assert deltaL==deltaW and last and all(v==deltaL for v in last);width=incAreaL/deltaL;length=incAreaW/deltaW;out=(length+deltaL)*(width+deltaL);assert(length+deltaL)*width-length*width==incAreaL and length*(width+deltaW)-length*width==incAreaW;proof={'allActualSideIncreaseAndAreaIncreaseInputs':list(map(str,nn)),'bothOriginalRectangleSides':list(map(str,[length,width])),'bothChangesComparedIndependentlyToOriginalRectangle':True,'bothNewSides':list(map(str,[length+deltaL,width+deltaL])),'newAreaTarget':str(out)}
 else:raise AssertionError(i)
 if not special:assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer'])
 proof['answerChecked']=True;return proof

def mutation(r,i):
 d=copy.deepcopy(r);s=d['statement'];changes={1:('29 жас','31 жас'),2:('2046 × 32','2046 × 33'),3:('7-сабақ','8-сабақ'),4:('қосындысы 109','қосындысы 115'),5:('250 м','400 м'),6:('40 км/сағ','30 км/сағ'),7:('1600 теңге','2000 теңге'),8:('19-орында','20-орында'),9:('236 алма','266 алма'),10:('84 есеп','96 есеп'),11:('1200 м','1800 м'),12:('20 минут','24 минут'),13:('2500-ге','2510-ге'),14:('75 жинақты','80 жинақты'),15:('08:30-да','08:20-да'),16:('56 дөңгелек','58 дөңгелек'),17:('+ 18 =','+ 22 ='),19:('4-ке бөлінетін','5-ке бөлінетін'),20:('40 см²','48 см²')};a,b=changes[i];assert a in s;d['statement']=s.replace(a,b)
 if i==3:d['options']=['12:20','12:30','15:00','15:10']
 if i==15:d['options']=['07:25','07:40','07:45','08:10']
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==19 and{r['params']['number']for r in rows}==set(range(1,21))-{18};entries=[];evidence=[];equalities=0;mcqs=0;changedAnswers={1:'24',2:'104346',3:'15:00',4:'226',5:'100',6:'40',7:'3250',8:'27',9:'70',10:'40',11:'1353',12:'6',13:'501',14:'64000',15:'07:40',16:'14',17:'1531',19:'3',20:'320'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']
  if q['options']:answer=one(o['text']for o in q['options']if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer']);mcqs+=1
  else:answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip();assert q['sourceAnswer']is None
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('validchangedmath',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('image')and r['statement']!=q['statement']and len(r.get('options',[]))==len(q['options']);assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All19fullsource/newconditions and completeofficial/newsolutions/all8timeMCQoptions read. Exactage/commonfactor, everylessonandonlyinterveningbreaks/alltimeoffsets, allprimepairs, frontentrytail-exittrainunits, bothlate/earlyconstraints, allfourreverseANDforwardconservingmoney states, linepositions, independentcounterfactualstocks, allthreeproportions/treepositionrows, sameorigindirectioncatchup, allpositivebounddigitcounts crosscompleteblocks+tailwithzeroexcluded, positiveprofitcost, botharrival/departuretimes, allcyclewheelcounts, fulloriginalequation, all15unorderedpairs crossremaindergroups andbothindependentrectangleareachanges checked. Allvalidchangedinputsrejectoldkeysandacceptcorrectkeys. Visualsource18separate. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options??[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':19,'fullSourceNewConditionsAndSolutionsRead':19,'capturedOpenKeys':17,'capturedMCQKeys':mcqs,'sourceTimeOptionsRead':8,'rewrittenTimeOptionsRead':8,'wrongKeysRejected':19,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':19,'nativeFractions':native['fractions'],'nativeFigures':0,'sourceVisual18StillSeparate':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':19,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
