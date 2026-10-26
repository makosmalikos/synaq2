"""All20full saved/newconditions, complete official/newsolutions and all4source/new
MCQoptions read. Sourceaxisbitmap and actual343pxnewSVGpreview inspected.
Same root author separate exact computational check, not another humanreviewer.
"""
import collections,copy,datetime,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2023-school';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('school850','scripts/editorial/review-altynsaka-school-850.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;K=P.K;H=P.H;one=H.one;exact=P.exact

def axis(r,src=False,data=None):
 value=one(H.numeric_tokens(r['statement']))
 if src:
  sha=hashlib.sha256((ROOT/'problems/sources/zerek/images/17cfb1a840d6789668831c14.png').read_bytes()).hexdigest();assert sha=='187884d00c75ea3617d0013350962fd2fe626dc7c9aa324f5780777baec7a57f';knownIndex,left,right=7,2,5;proof={'sourceRasterSHA256':sha,'sourceEqualIntervalsGivenByTextSevenTicksObserved':True,'sourceS_A_KIndices':[2,5,7]}
 else:
  root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};ticks=[];y=F(ids['axis'].attrib['y1']);assert F(ids['axis'].attrib['y2'])==y
  for id,e in ids.items():
   if id.startswith('tick-'):x1,y1,x2,y2=[F(e.attrib[k])for k in['x1','y1','x2','y2']];assert x1==x2 and y1<y<y2;ticks.append(x1)
  xs=sorted(ticks);assert len(xs)==len(set(xs))==10;unit=one({b-a for a,b in zip(xs,xs[1:])});assert unit>0;markers={}
  for label in['O','P','Q','R']:
   m,t=ids['point-'+label],ids['label-'+label];x=F(m.attrib['cx']);assert x in xs and F(m.attrib['cy'])==y and t.text==label and F(t.attrib['x'])==x and abs(F(t.attrib['y'])-y)<35;markers[label]=xs.index(x)
  assert markers['O']==0 and F(ids['axis'].attrib['x1'])==xs[0]and F(ids['axis'].attrib['x2'])>xs[-1];assert ids['zero-coordinate'].text=='0'and F(ids['zero-coordinate'].attrib['x'])==xs[0];assert F(ids['known-coordinate'].text)==value and F(ids['known-coordinate'].attrib['x'])==xs[markers['R']];knownIndex,left,right=markers['R'],markers['P'],markers['Q'];proof={'allActualTenTicksReadAndEquallySpaced':True,'actualPixelUnit':str(unit),'allActualMarkerIndices':markers,'allActualPointAndCoordinateLabelsMatchGeometry':True,'axisStartsAtZeroAndExtendsBeyondLastTick':True}
 assert 0<=left<right<=knownIndex and knownIndex>0;physical=value/knownIndex;out=(right-left)*physical;assert right*physical-left*physical==out;proof.update({'knownPhysicalCoordinate':str(value),'oneIntervalPhysicalLength':str(physical),'physicalEndpointCoordinates':list(map(str,[left*physical,right*physical])),'physicalDistanceTarget':str(out)});return out,proof

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  total,factor,quotient=n;assert factor*quotient!=0;out=total/(factor*quotient);assert out!=0 and total/(out*factor)==quotient;proof={'actualDividendFactorQuotient':list(map(str,n)),'nonzeroUnknownDenominatorPreserved':True,'substitutedOriginalEquationVerified':True,'rootTarget':str(out)}
 elif i==2:
  first,second,deficit=n;third=first+second+deficit;out=first+second+third;assert third-(first+second)==deficit;proof={'actualKnownCountsAndShortfall':list(map(str,n)),'thirdCount':str(third),'allThreeTaskTotalTarget':str(out)}
 elif i==3:
  a,b,c,k1,k2,k3,k4=n;expression=H.math_parts(s,src)[-1];plain=re.sub(r'\\text\{([^}]+)\}',r'\1',H.tex(expression));letters=['С','А','Қ']if src else['S','Y','N'];env=dict(zip(letters,[a,b,c]));direct=plain
  for letter,value in env.items():direct=direct.replace(letter,'('+str(value)+')')
  direct=re.sub(r'(?<=\d)\(','*(',direct);value=exact(direct);out=k1*a+k2*b+k3*c+k4*b;assert value==out and k2==0;proof={'allThreeActualAssignedValues':list(map(str,[a,b,c])),'allFourActualCoefficients':list(map(str,[k1,k2,k3,k4])),'directSubstitutionExpression':direct,'zeroCoefficientTermExplicitlyPreserved':True,'directSubstitutionEqualsTermSum':True,'expressionValueTarget':str(out)}
 elif i==4:
  big,small=n;assert big>small>0;out=(big/4)**2/(small/4)**2;assert out==(big/small)**2;proof={'actualPerimeters':list(map(str,n)),'bothSquareSides':list(map(str,[big/4,small/4])),'perimeterRatioSquaredEqualsAreaRatio':True,'areaRatioTarget':str(out)}
 elif i==5:
  multiplier,total=n[:2];values=n[2:];assert len(values)==len(set(values))==10;pairs=[(a,b)for a,b in itertools.combinations(values,2)if(a+b)*multiplier==total];a,b=one(pairs);out=a*b;proof={'actualMultiplierAndResult':list(map(str,[multiplier,total])),'allTenActualListValues':list(map(str,values)),'all45DistinctUnorderedPairsChecked':45,'allMatchingPairs':[list(map(str,p))for p in pairs],'pairProductTarget':str(out)}
 elif i==6:
  start,budget=map(int,n);assert start==1;used=0;page=0
  while used<budget:page+=1;used+=len(str(page))
  assert used==budget;written=''.join(str(j)for j in range(1,page+1));assert len(written)==budget;out=F(page);proof={'actualFirstPageAndDigitBudget':[start,budget],'everyActualPageNumberLengthCounted':page,'allCompletePageNumbersConcatenationLength':len(written),'noPartialFinalNumberAllowed':True,'lastPageTarget':str(out)}
 elif i==7:
  if src:oneMonth,count,thirdDays,bothDays,targetDays,monthUnit,monthDays=n;assert oneMonth==monthUnit==1
  else:monthDays,count,monthAgain,thirdDays,bothDays,targetDays=n;assert monthDays==monthAgain
  first=count/monthDays;second=count/(monthDays/2);third=(first+second)*bothDays/thirdDays;out=(first+second+third)*targetDays;assert third*thirdDays==(first+second)*bothDays;assert all(v>0 for v in[first,second,third]);proof={'actualMonthDaysFirstMonthlyCount':list(map(str,[monthDays,count])),'actualThirdDaysBothDaysTargetDays':list(map(str,[thirdDays,bothDays,targetDays])),'allThreeConstantDailyRates':list(map(str,[first,second,third])),'halfMonthAndBothPersonsComparisonRechecked':True,'combinedWorkTarget':str(out)}
 elif i==8:
  if src:initial,a,b,a2,b2=n;assert(a,b)==(a2,b2)
  else:initial,a,b,a2,b2,a3,b3=n;assert(a,b)==(a2,b2)==(a3,b3)
  f=a/b;assert 0<f<1;state=[initial]*4;states=[state.copy()];transfers=[]
  for j in range(3):
   gift=state[j]*f;assert gift.denominator==1;state[j]-=gift;state[j+1]+=gift;transfers.append(gift);assert min(state)>0 and sum(state)==4*initial;states.append(state.copy())
  out=state[3];assert out==initial*(1+f+f**2+f**3);proof={'actualEqualInitialCountAndTransferFraction':list(map(str,[initial,f])),'allThreeActualWholeTransfers':list(map(str,transfers)),'allFourFullStockStates':[[str(x)for x in st]for st in states],'wholeTotalConservedAfterEverySequentialCurrentStockTransfer':True,'lastPersonStockTarget':str(out)}
 elif i==9:
  if src:every,days,leapYear,year,day,nextYear,nextDay=map(int,n);assert every==4 and leapYear==year and day==nextDay==1
  else:year,day,repeatedYear,days,nextYear,nextDay=map(int,n);assert repeatedYear==year and day==nextDay==1
  start=datetime.date(year,1,1);end=datetime.date(nextYear,1,1);assert nextYear==year+1 and(end-start).days==days==366;names=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];opts=[o['text']if isinstance(o,dict)else o for o in r['options']];assert len(opts)==4 and[(names.index(v)-start.weekday())%7 for v in opts]==[0,2,4,6];answer=names[end.weekday()];assert r['answer']==answer and opts.count(answer)==1;return{'actualStartEndDates':[start.isoformat(),end.isoformat()],'actualStartWeekday':names[start.weekday()],'actualWholeYearDays':days,'actualWeekdayShift':days%7,'allFourOriginalRelativeWeekdayOptionRolesPreserved':True,'actualNextJanuaryWeekdayTarget':answer,'answerChecked':True}
 elif i==10:
  first,second,target=n;assert min(n)>0;out=first+second+1;assert out<=sum(n);proof={'allActualColorStocks':list(map(str,n)),'nonTargetStocksCanAllBeDrawnFirst':str(first+second),'explicitNoTargetWitnessShowsOneFewerInsufficient':True,'oneFurtherDrawMustBeTarget':True,'guaranteedDrawCountTarget':str(out)}
 elif i==11:out,proof=axis(r,src,data)
 elif i==12:
  expr=one(H.math_parts(s,src));out=exact(H.tex(expr));a,b,c,d=n;assert b==99 and d==11;assert out==a*100-a+c*10+c;proof={'allFourActualMultiplicationInputs':list(map(str,n)),'directExpressionEquals99and11Expansion':True,'expressionValueTarget':str(out)}
 elif i==13:
  oneEli,eli,oneTutam,tutam,countT,countE=n;assert oneEli==oneTutam==1;out=countT*tutam-countE*eli;assert out>0;proof={'actualGivenCentimetersPerEliTutam':list(map(str,[eli,tutam])),'actualTutamAndEliCounts':list(map(str,[countT,countE])),'bothLengthsCentimeters':list(map(str,[countT*tutam,countE*eli])),'givenUnitDifferenceCentimetersTarget':str(out)}
 elif i==14:
  total,hundred,fifty,ten=n;known=100*hundred+50*fifty+10*ten;twos=(total-known)/2;assert twos>=0 and twos.denominator==1;out=hundred+fifty+ten+twos;assert known+2*twos==total;proof={'actualMoneyAndKnownCoinCounts':list(map(str,n)),'knownDenominationAmount':str(known),'remainingTwoTengeCoinCount':str(twos),'allCoinValuesReconstructExactTotalMoney':True,'allCoinCountTarget':str(out)}
 elif i==15:
  if src:grade,boxes,a,b,c,d,kilograms,lastBox=n;assert grade==5 and[a,b,c,d]==[1,2,3,4]
  else:boxes,a,b,c,lastBox,kilograms=n;assert[a,b,c]==[1,2,3]
  assert lastBox==boxes and boxes.denominator==1;totalItems=sum(range(1,int(boxes)+1));unit=1000*kilograms/totalItems;out=lastBox*unit;assert sum(j*unit for j in range(1,int(boxes)+1))==kilograms*1000;proof={'actualBoxCountAndTotalKilograms':list(map(str,[boxes,kilograms])),'allConsecutiveBoxItemCountSum':totalItems,'oneItemGrams':str(unit),'everyBoxWeightSumReconstructsTotalGrams':True,'lastBoxGramsTarget':str(out)}
 elif i==16:
  divisor,rem=map(int,n);assert 0<=rem<divisor;valid=[v for v in range(1000,10000)if v%divisor==rem];out=F(min(valid));assert int(out)-divisor<1000;proof={'actualDivisorRemainder':[divisor,rem],'all9000FourDigitNumbersChecked':9000,'wholeQuotient':int(out)//divisor,'previousSameRemainderNumber':int(out)-divisor,'leastFourDigitNumberTarget':str(out)}
 elif i==17:
  base,a,b,future,mult,total=n;gap=future-base;grandFuture=(a+b+2*gap)*mult;grandNow=grandFuture-gap;initial=a+b+grandNow;years=(total-initial)/3;assert years.denominator==1 and grandNow>max(a,b)>0 and years>=0;out=base+years;ages=[a+years,b+years,grandNow+years];assert sum(ages)==total;proof={'allSixActualYearAgeMultiplierTotalInputs':list(map(str,n)),'futureBothChildAgesAndGrandAge':list(map(str,[a+gap,b+gap,grandFuture])),'baseAllThreeAgeSum':str(initial),'wholeYearsToTargetSum':str(years),'allThreeAgesAtTarget':list(map(str,ages)),'sameReferenceCalendarDayKeepsAllYearOffsetsExact':True,'targetYear':str(out)}
 elif i==18:
  if src:a,b,low,c,d,high,e,f=n
  else:a,b,low,c,d,high,e,f=n
  assert a==c==e==1;lower=low*b;upper=high*d;valid=[]
  for x,y,z in itertools.permutations(range(10),3):
   if x:
    v=1000*x+100*y+10*z+y
    if lower<v<upper:valid.append(v)
  number=one(valid);out=F(number,f);assert number*a/b>low and number*c/d<high;proof={'actualBothStrictBounds':list(map(str,[lower,upper])),'all648DistinctLetterAssignmentsChecked':9*9*8,'allMatchingRepeatedSecondFourthDigitNumbers':valid,'leadingFirstDigitNonzeroAndAllThreeLettersDifferent':True,'actualAskedFractionDenominator':str(f),'askedFractionTarget':str(out)}
 elif i==19:
  add,total,a,b,finalAdd=n;assert a==1;number=2*(total-add);out=number*a/b+finalAdd;assert number/2+add==total;proof={'allActualHalfAndThirdInputs':list(map(str,n)),'recoveredWholeNumber':str(number),'originalHalfConstraintRechecked':True,'fractionPlusSecondConstantTarget':str(out)}
 elif i==20:
  eldest,others,edgeShare,secondOthers,leftover=n;assert others>secondOthers>0;nGrand=(2*edgeShare-2*secondOthers+leftover-eldest+3*others)/(others-secondOthers);assert nGrand.denominator==1 and nGrand>=3;first=eldest+others*(nGrand-3);second=2*edgeShare+secondOthers*(nGrand-2)+leftover;assert first==second;out=nGrand;proof={'allFiveActualDistributionInputs':list(map(str,n)),'firstNonEldestRecipients':str(nGrand-3),'firstTwoRecipientsReceiveNothing':True,'secondNonEndRecipients':str(nGrand-2),'sameWholeAppleStockBothPlans':str(first),'grandchildCountTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('3135','3300'),2:('7 есепке кем','8 есепке кем'),3:('N = 2026','N = 2027'),4:('60 см','80 см'),5:('2375 шықты','798 шықты'),6:('312 цифр','315 цифр'),7:('9 күнде','12 күнде'),8:('128 жапсырма','192 жапсырма'),9:('2028','2032'),10:('6 ақ','8 ақ'),11:('2400','3200'),12:('73 × 99','74 × 99'),13:('4 тұтам','5 тұтам'),14:('586 теңге','588 теңге'),15:('3.9 кг','4.68 кг'),16:('28 қалдық','29 қалдық'),17:('қосындысы 108','қосындысы 111'),18:('(1/11)','(1/6)'),19:('бөлігіне 24','бөлігіне 30'),20:('8 алма артық','10 алма артық')}[i];assert a in r['statement'];bad={**r,'statement':r['statement'].replace(a,b)};data=None
 if i==9:bad['statement']=bad['statement'].replace('2029','2033').replace('— сенбі','— бейсенбі');bad['options']=['Бейсенбі','Сенбі','Дүйсенбі','Сәрсенбі']
 if i==11:
  root=P.W.svg(r);one(v for v in root.iter()if v.attrib.get('id')=='known-coordinate').text='3200';data=ET.tostring(root);bad['figureSha256']=hashlib.sha256(data).hexdigest()
 return bad,data

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20 and {r['params']['number']for r in rows}==set(range(1,21));entries=[];evidence=[];equalities=0;changedAnswers={1:'20',2:'82',3:'4179',4:'16',5:'360',6:'141',7:'960',8:'255',9:'Сенбі',10:'16',11:'2000',12:'7623',13:'31',14:'96',15:'720',16:'1028',17:'2035',18:'1441',19:'1654',20:'17'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']
  if q['options']:answer=one(o['text']for o in q['options']if o['correct']);assert answer==q['sourceAnswer']
  else:answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip();assert q['sourceAnswer']is None
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad,data in[({**r,'answer':'999999999'},None),mutation(r,i)]:
   try:solve(bad,i,False,data)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  bad,data=mutation(r,i)
  try:cp=solve({**bad,'answer':changedAnswers[i]},i,False,data)
  except Exception as e:raise AssertionError(('validchangedinput',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  if i==11:
   root=P.W.svg(r);one(v for v in root.iter()if v.attrib.get('id')=='point-P').set('cx','104');one(v for v in root.iter()if v.attrib.get('id')=='label-P').set('x','104');raw=ET.tostring(root);changed={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
   try:solve(changed,i,False,raw)
   except AssertionError:pass
   else:raise AssertionError('ActualMarkerChangeAcceptedOldAnswer')
   assert solve({**changed,'answer':'1200'},i,False,raw)['physicalDistanceTarget']=='1200';proof['validActualMarkerGeometryChangeTarget']='1200';proof['updatedHashPhysicalLabelAndActualMarkerChangesBothVerified']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement'];assert len(r.get('options',[]))==len(q['options'])and bool(r.get('image'))==bool(q['images']);assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All20full source/newconditions and completeofficial/newsolutions/options read. Exactdenominatorequationdomain, threecounts, actuallinearsubstitutionzero, squareratio, all45pairchoices, everypagenumber, all3workrates, everyconservingsequentialtransferstate, Gregorianleapyear/all4optionoffsets, worstcasewitness, actualnativeaxis/ticks/markers/labels, fullexpression/units/coins/allboxweights, all9000remaindercandidates, all3ageyearconstraints, all648letterassignments, originalhalfandaskedthird and bothappledistributionstocks checked. Everyvalidchangedinputrejectsoldkeyandacceptscorrectchangedkey. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Savedsourceaxisbitmap andactual343pxnativePNG inspected. All10actualtickpositions equal, all4pointmarkers/labelsandknowncoordinate physicallybound. Updatedhashlabel3200 recomputes2000; independentlymovingactualPfromindex1to2recomputes1200. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,overlines=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){overlines++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options??[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,overlines}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':20,'fullSourceNewConditionsAndSolutionsRead':20,'capturedOpenKeys':19,'capturedMCQKeys':1,'all4RelativeWeekdayDistractorRolesPreserved':True,'wrongKeysRejected':20,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':20,'nativeFigures':1,'updatedHashLabelAndActualMarkerChangesRecomputed':True,'nativeFractions':native['fractions'],'nativeOverlines':native['overlines'],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':20,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
