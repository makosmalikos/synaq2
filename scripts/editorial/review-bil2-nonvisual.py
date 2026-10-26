"""All29full frozen/newconditions completeofficial/newsolutions andall145
source/newoptions read. Same root author separate exact computation,
not anotherhumanreviewer. Twentyvisualsseparate;source47alreadyverifiedelsewhere.
"""
import ast,collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('b1','scripts/editorial/review-bil1-nonvisual.py');B=importlib.util.module_from_spec(sp);sp.loader.exec_module(B);H=B.H;E=B.E;one=B.one;scalar=B.scalar
def tuple_values(text):
 text=H.tex(text).strip().strip('()');return tuple(E.calc(v)for v in re.split(r'[;,]',text))
def evaluate_chain(text):
 tree=ast.parse(H.arithmetic_text(E.plain(text)),mode='eval').body
 def flatten(node):return flatten(node.left)+[node.right]if isinstance(node,ast.BinOp)and isinstance(node.op,ast.Div)else[node]
 nodes=flatten(tree);values=[E.calc(ast.unparse(n))for n in nodes];assert all(v!=0 for v in values[1:]);running=[values[0]]
 for v in values[1:]:running.append(running[-1]/v)
 assert running[-1]==E.calc(text);return running[-1],{'allActualSuccessiveDivisors':list(map(str,values[1:])),'allActualLeftToRightIntermediateValues':list(map(str,running)),'allOriginalDivisorsNonzero':True}
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);proof={};expected=None
 if i==1:
  eq=one(parts);out,proof=E.equation(eq);left,right=H.tex(eq).split('=');coefficient,constant=E.affine(left);coefficient=-one(coefficient);rhs=E.calc(right);den=(constant-math.floor(constant)).denominator;expected=[constant-coefficient,constant+rhs+F(1,den),constant-coefficient-1,out,rhs];proof['unknownSubtrahendMustBeDividedByActualCoefficient']=str(coefficient)
 elif i==2:
  raw=H.tex(s);triples=[tuple_values(v)for v in re.findall(r'\((\d+\s*[;,]\s*\d+\s*[;,]\s*\d+)\)',raw)];assert len(triples)==4 and[t[0]for t in triples]==[1,2,3,4];first=one({b/a for a,b,c in triples});second=one({c/b for a,b,c in triples});index=F(one(re.findall(r'(\d+)-(?:шы|ші|жақшаны)',s)))if src else F(one(re.findall(r'(\d+)-жақшаны',s)));out=(index,first*index,first*second*index);values=list(map(tuple_values,B.options(r)));expectedTuples=[(index,out[1]-15,out[2]+1),(index,(first-1)*index,(first-1)*second*index),out,(index+2,out[1],out[2]),(index,first*(index+1),first*second*(index+1))];assert values==expectedTuples and tuple_values(r['answer'])==out and len(set(values))==5;return{'allFourActualGivenTriples':[[str(v)for v in t]for t in triples],'twoUniqueConstantSuccessiveMultipliers':list(map(str,[first,second])),'actualAskedIndex':str(index),'targetTriple':list(map(str,out)),'allFiveActualTupleOptions':[[str(v)for v in t]for t in values],'answerChecked':True}
 elif i==3:
  workers,time,total,targetWorkers,target=n;rate=total/workers/time;assert rate>0 and targetWorkers==1;out=target/(rate*targetWorkers);expected=[out+2,out-1,out,out+1,out+3];proof={'actualWorkerTimeTotalTargetWorkersTarget':list(map(str,n)),'oneWorkerPerMinuteRate':str(rate),'originalBatchReplayed':workers*time*rate==total,'minutesTarget':str(out)}
 elif i==4:
  year,*rest=n;ages=rest[:4];target=rest[4];elapsed=(target-sum(ages))/4;assert elapsed.denominator==1 and elapsed>=0;out=year+elapsed;assert sum(v+elapsed for v in ages)==target;expected=[year,out+23,year+2,year+90,out];proof={'actualReferenceYearAgesTarget':list(map(str,n)),'allFutureAges':list(map(str,[v+elapsed for v in ages])),'allFourAnnualIncrementsReplayed':True,'yearTarget':str(out)}
 elif i==5:
  tenge,ruble,ruble2,dollar,dollar2,euro,asked=n;out=asked*dollar2/euro*ruble2/dollar*tenge/ruble;assert min(n)>0;expected=[out*F(5,3),out,out*F(5,4),out/2,out-1000];proof={'actualAllThreePairRatesAndAskedEuro':list(map(str,n)),'allEuroDollarRubleTengeStages':list(map(str,[asked,asked*dollar2/euro,asked*dollar2/euro*ruble2/dollar,out])),'linkedExchangeTarget':str(out),'fictionalGivenRatesNoLiveFinancialRecommendation':True}
 elif i in[6,13]:
  time,count,asked=n;assert min(n)>0;out=time/count*asked;expected=[out+3,asked,out,out-3,out-9]if i==6 else[out,out+18,out+9,out-18,out-9];proof={'actualTimeCountAskedCount':list(map(str,n)),'exactTimePerUnit':str(time/count),'wholeAskedTimeTarget':str(out)}
 elif i==8:
  first,leftFirst,second,leftSecond=n;out=(leftFirst-leftSecond)/(second-first);assert out.denominator==1 and out>0;stock=first*out+leftFirst;assert stock==second*out+leftSecond;expected=[out-2,out+1,out+2,out,out-1];proof={'actualTwoPerPersonRemainders':list(map(str,n)),'sameInitialStockBothDistributions':str(stock),'personCountTarget':str(out)}
 elif i==10:
  a,b,*summands=n;summand=one(set(summands));out=a*b/summand;assert out.denominator==1 and out*summand==a*b;expected=[out/10,out,out*F(2,5),out/25,summand];proof={'actualTwoFactorsAndRepeatedSummand':list(map(str,[a,b,summand])),'wholeProduct':str(a*b),'summandCountTarget':str(out)}
 elif i==12:
  out,proof=evaluate_chain(one(parts));expected=[out+7,1/out,25*out/9,out,9/(25*out)]
 elif i in[14,30]:
  if i==14:a,b,p=n;assert min(a,b)>0;power=2;before=a*b;after=(a*(1+p/100))*(b*(1+p/100))
  else:p=one(n);power=3;before=F(1000);after=before*(1+p/100)**3
  out=100*(after-before)/before;assert out==100*((1+p/100)**power-1);expected=[out,out-8,out-6,2*p,out-2]if i==14 else[out+F(3,5),out,out+F(19,10),out-F(19,5),3*p];proof={'actualPercentEdgeIncrease':str(p),'physicalDimensionPower':power,'actualBeforeAfterMeasure':list(map(str,[before,after])),'relativeGrowthBaseIsOriginalMeasure':True,'growthPercentTarget':str(out)}
 elif i==15:
  eq=one(p for p in parts if'='in p);sides=H.tex(eq).split('=');offset={}
  for term in sides:
   coeff,const=E.affine(term,('P','Q','X','Y','Z'));assert coeff.count(1)==1 and coeff.count(0)==4;offset['PQXYZ'[coeff.index(1)]]=-const
  assert len(offset)==len(set(offset.values()))==5;order=sorted(offset,key=offset.get);values=[re.findall('[PQXYZ]',o)for o in B.options(r)];assert len({tuple(v)for v in values})==5 and all(set(v)==set(offset)and len(v)==5 for v in values);assert values.count(order)==1 and re.findall('[PQXYZ]',r['answer'])==order;witness=max(-v for v in offset.values())+1;assert all(witness+v>0 for v in offset.values());return{'actualOffsetsFromCommonValue':{k:str(v)for k,v in offset.items()},'positiveCommonValueWitness':str(witness),'orderIndependentOfCommonValue':True,'exactIncreasingVariableOrder':order,'allFiveActualOrders':values,'answerChecked':True}
 elif i==16:
  final=one(n);afterFirst=(final+1)/2;out=(afterFirst+1)/2;assert out.denominator==1 and out>=2;points={F(v)for v in range(int(out))};sizes=[len(points)]
  for _ in range(2):p=sorted(points);points|={(a+b)/2 for a,b in zip(p,p[1:])};sizes.append(len(points))
  assert sizes==[out,afterFirst,final];expected=[out-1,out+1,out+2,out,out+3];proof={'actualFinalPointCount':str(final),'bothRefinementsByFullRationalPointSets':sizes,'initialPointCountTarget':str(out)}
 elif i==21:
  target=one(p for p in parts if H.tex(p).startswith('k!'));rhs=target.split('=')[1];product=E.calc(rhs);assert product.denominator==1 and product>1;k=1;f=F(1);factorials=[(k,f)]
  while f<product:k+=1;f*=k;factorials.append((k,f))
  assert f==product;out=F(k);expected=[out,out+2,out+1,out-2,out-1];proof={'actualFourFactorProductExpression':rhs,'wholeProduct':str(product),'allFactorialsThroughFirstAtLeastProduct':[[k,str(v)]for k,v in factorials],'strictlyGrowingPositiveFactorialsProveUniqueIndex':True,'factorialIndexTarget':str(out)}
 elif i==23:
  env={}
  for p in parts[:2]:key,value=map(str.strip,H.tex(p).split('='));env[key]=E.calc(value)
  target=E.expr(parts[-1]);out=target.value(env);coefs,constant=E.affine(parts[-1],('x','y'));assert target.equals(E.expr(str(coefs[0])+'*x+'+str(coefs[1])+'*y+'+str(constant)));expected=[out-7,out-42,out,out-6,out-4];proof={'actualAssignments':{k:str(v)for k,v in env.items()},'exactExpandedCoefficients':list(map(str,coefs+[constant])),'polynomialExpansionEqualsOriginalBeforeSubstitution':True,'expressionValueTarget':str(out)}
 elif i==24:
  firstA,firstB,secondA,secondB=n;priceRatio=(firstB-secondB)/(secondA-firstA);assert priceRatio>0;out=firstA*priceRatio+firstB;assert out==secondA*priceRatio+secondB;expected=[out,out-1,out-3,out-4,out+9];proof={'actualBothBasketCounts':list(map(str,n)),'firstItemPriceInSecondItemUnits':str(priceRatio),'bothWholeBudgetBasketsReplayed':True,'allSecondItemCountTarget':str(out)}
 elif i==26:
  a,b=n;assert min(n)>0;out=2/(1/a+1/b);expected=[(a+b)/2,out+7,out+4,out-3,out];distance=F(math.lcm(int(a),int(b)));assert out==2*distance/(distance/a+distance/b);proof={'actualBothEqualDistanceSpeeds':list(map(str,n)),'fullDistanceOverFullTimeCrossCheck':True,'arithmeticMeanDistractorExplicit':str((a+b)/2),'averageSpeedTarget':str(out)}
 elif i==27:
  if src:power=int(n[0]);base=int(one(set(n[1:])))
  else:base,power=map(int,n)
  cycle=[];v=base%10
  while v not in cycle:cycle.append(v);v=v*base%10
  assert len(cycle)==4 and v==cycle[0];out=F(pow(base,power,10));assert out==int(str(base**power)[-1])==cycle[(power-1)%4];expected=[F(pow(base,power+j,10))for j in[1,2,3]]+[out,F(5)];proof={'actualBaseExponent':[base,power],'completeFourStateLastDigitCycle':cycle,'fullBigIntegerModPowAndCycleAgree':True,'lastDigitTarget':str(out)}
 elif i==28:
  eq=one(parts);out,proof=E.equation(eq.replace('y','x'));assert scalar(B.options(r)[0])==1/out;proof['firstOptionIsReciprocalOfActualRoot']=True;proof['allOtherSourceErrorIntentsNotInvented']=True
 elif i==31:
  heads,legs=n;rabbits=(legs-2*heads)/2;hens=heads-rabbits;out=(hens,rabbits);assert min(out)>=0 and all(v.denominator==1 for v in out);assert 2*hens+4*rabbits==legs;values=[tuple(H.numeric_tokens(o))for o in B.options(r)];assert values==[(hens-4,rabbits+4),(hens-2,rabbits+2),(rabbits+4,hens-4),out,(hens+2,rabbits-2)]and len(set(values))==5 and tuple(H.numeric_tokens(r['answer']))==out;assert all(sum(v)==heads for v in values);return{'actualHeadsAndLegs':list(map(str,n)),'allFiveActualOrderedChickenRabbitOptions':[[str(v)for v in t]for t in values],'allAlternativesKeepWholeHeadsButOnlyOneMatchesLegs':sum(2*a+4*b==legs for a,b in values)==1,'orderedChickenRabbitTarget':list(map(str,out)),'answerChecked':True}
 elif i==32:
  expression=one(parts);out=E.calc(expression);expected=[out-3,out-2,out-1,out+1,out];proof={'actualPrintedNestedExpression':expression,'exactNestedRationalTarget':str(out),'allPrintedConstantDenominatorsEvaluatedWithoutZeroDivision':True}
 elif i==35:
  total,a,b,c=n;unit=total/(a+b+c);assert unit.denominator==1;out=c*unit;assert a*unit+b*unit+out==total;expected=[out-4,a*unit,out,b*unit,total/2];proof={'actualWholeAndThreeRatios':list(map(str,n)),'allThreeWholeCategoryCounts':list(map(str,[a*unit,b*unit,out])),'thirdCategoryTarget':str(out)}
 elif i==36:
  expression=one(p for p in parts if p.count('<')==2);l,middle,u=H.tex(expression).split('<');coef,const=E.affine(middle);coef=one(coef);assert coef>0;low=(E.calc(l)-const)/coef;high=(E.calc(u)-const)/coef;values=list(range(math.floor(low)+1,math.ceil(high)));assert values;out=F(max(values));assert all(E.calc(l)<E.expr(middle).value({'x':F(v)})<E.calc(u)for v in values);assert not(E.calc(l)<E.expr(middle).value({'x':out+1})<E.calc(u));expected=[out,out+4,out-1,out+1,out-2];proof={'actualStrictIntegerBounds':list(map(str,[low,high])),'allIntegerSolutions':values,'firstLargerIntegerRejected':True,'greatestIntegerTarget':str(out)}
 elif i==38:
  years=list(map(int,re.findall(r'\b\d{4}\b',s)));assert len(years)==3;target=n[-1];out=(sum(years)+target)/3;assert out.denominator==1 and out>=max(years);ages=[out-v for v in years];assert sum(ages)==target;expected=[out+5,out+3,out,out-10,out-5];proof={'actualThreeJanuaryFirstBirthYears':years,'actualAskedAgeSum':str(target),'allThreeAgesOnSharedBirthday':list(map(str,ages)),'sharedBirthdayYearTarget':str(out)}
 elif i==39:
  a,b=n;assert min(n)>0;dimensions={(a,b)}
  for _ in range(2):dimensions={(2*x,y)for x,y in dimensions}|{(x,2*y)for x,y in dimensions}
  perimeters=sorted(2*(x+y)for x,y in dimensions);out=max(perimeters);other=2*(4*min(a,b)+max(a,b));expected=[out+2,out-8,out-2,other,out];proof={'actualFoldedSides':list(map(str,n)),'allPossibleTwoAxisUnfoldedDimensions':[[str(v)for v in p]for p in sorted(dimensions)],'allActualCandidatePerimeters':list(map(str,perimeters)),'bothSameAndDifferentFoldAxisSequencesExhausted':True,'maximumOriginalPerimeterTarget':str(out)}
 elif i==42:
  digits=5 if'бес таңбалы'in s else 4 if'төрт таңбалы'in s else 0;assert digits in[4,5];oddFirst=not src and'тақ'in s.split('B —')[0];firstParity=1 if oddFirst else 0;secondParity=1-firstParity
  valid=lambda parity:[v for v in range(10**(digits-1),10**digits)if len(set(str(v)))==digits and all(int(d)%2==parity for d in str(v))];first,second=valid(firstParity),valid(secondParity);a,b=max(first),min(second);out=F(a-b);proof={'actualBothDigitParities':[firstParity,secondParity],'actualRequiredDigitCount':digits,'allPositiveFixedLengthNumbersWithNoLeadingZeroChecked':9*10**(digits-1),'allValidParityCandidateCounts':[len(first),len(second)],'actualLargestAndSmallestNumbers':[a,b],'differenceTarget':str(out)}
 elif i==44:
  pattern=re.findall('[🙂❤😀📝★●▲■]',s);assert len(pattern)==14 and pattern[:7]==pattern[7:];cycle=pattern[:7];first,second=map(int,n);assert second==first+1;out=''.join(cycle[(v-1)%7]for v in[first,second]);normalize=lambda value:''.join(re.findall('[🙂❤😀📝★●▲■]',value));values=list(map(normalize,B.options(r)));assert len(values)==len(set(values))==5 and values.count(out)==1 and normalize(r['answer'])==out;return{'allSevenActualCycleSymbols':cycle,'actualBothOneBasedIndices':[first,second],'actualBothCycleSlots':[(v-1)%7+1 for v in[first,second]],'bothCapturedCycleCopiesAgree':True,'allFiveActualSymbolPairChoices':values,'twoSymbolTarget':out,'answerChecked':True}
 elif i==50:
  if src:pieces=int(one(set(n)));cuts=len(n);assert cuts==4
  else:cuts,pieces=map(int,n)
  assert pieces>=2 and cuts>=1;states=[1]
  for _ in range(cuts):states.append(states[-1]-1+pieces)
  out=F(states[-1]);assert out==1+cuts*(pieces-1);expected=[F(pieces**2),F(cuts*(pieces-1)),out,out+pieces-1,F(cuts*pieces)];proof={'actualOperationsAndNewPiecesPerSelectedPiece':[cuts,pieces],'allForwardTotalPieceCounts':states,'oneOldPieceRemovedBeforeAddingNewPiecesEveryStep':True,'finalPieceCountTarget':str(out)}
 else:raise AssertionError(i)
 proof.update(B.checked_choices(r,out,expected));proof['answerChecked']=True;return proof

def changed(r,i):
 d=copy.deepcopy(r);a,b={1:('(7 + (3/19))','(8 + (3/19))'),2:('12-жақшаны','13-жақшаны'),3:('36 дәнді','44 дәнді'),4:('112 болады','116 болады'),5:('10 евроға','12 евроға'),6:('35 секіруге','40 секіруге'),8:('34 жапсырма','40 жапсырма'),10:('360 ×','420 ×'),12:('«3 ÷','«4 ÷'),13:('21 минутта','24 минутта'),14:('25%-ға','30%-ға'),15:('P − 4','P − 9'),16:('21 нүкте','25 нүкте'),21:('20 × 14 ×','20 × 126 ×'),23:('x = −3','x = −4'),24:('9 жапсырмаға','12 жапсырмаға'),26:('72 км/сағ','96 км/сағ'),27:('47 рет','48 рет'),28:('(12 + (3/5))','(14 + (2/5))'),30:('20%-ға','25%-ға'),31:('112 аяқ','116 аяқ'),32:('«9 −','«10 −'),35:('110 адам','132 адам'),36:('(x/8)','(x/10)'),38:('114 болады','120 болады'),39:('5 × 7','5 × 8'),42:('бес таңбалы','төрт таңбалы'),44:('120- және 121','122- және 123'),50:('4 рет','5 рет')}[i];assert a in d['statement'];d['statement']=d['statement'].replace(a,b)
 choices={1:['(5 + (3/19))','(14 + (15/19))','(4 + (3/19))','(10/19)','(6 + (11/19))'],2:['(13; 50; 196)','(13; 52; 156)','(13; 65; 195)','(15; 65; 195)','(13; 70; 210)'],3:['13 мин','10 мин','11 мин','12 мин','14 мин'],4:['2025','2063','2027','2115','2040'],5:['12600','7560','9450','3780','6560'],6:['67','40','64','61','55'],8:['10','13','14','12','11'],10:['1400','14000','5600','560','72'],12:['11','(1/4)','(100/9)','4','(9/100)'],13:['160 мин','178 мин','169 мин','142 мин','151 мин'],14:['69%','61%','63%','60%','67%'],15:['P < Q < X < Y < Z','Y < Q < X < P < Z','Y < Z < X < P < Q','Y < Q < X < Z < P','P < Z < X < Q < Y'],16:['6','8','9','7','10'],21:['9','11','10','7','8'],23:['57','22','64','58','60'],24:['33','32','30','29','42'],26:['72 км/сағ','71 км/сағ','68 км/сағ','61 км/сағ','64 км/сағ'],27:['2','4','8','6','5'],28:['(1 + (1/9))','(1 + (7/20))','(19/20)','(20/37)','(9/10)'],30:['95.9125%','95.3125%','97.2125%','91.5125%','75%'],31:['тауық — 22, қоян — 20','тауық — 24, қоян — 18','тауық — 20, қоян — 22','тауық — 26, қоян — 16','тауық — 28, қоян — 14'],32:['5','6','7','9','8'],35:['20','60','24','48','66'],36:['8','12','7','9','6'],38:['2033','2031','2028','2018','2023'],39:['76 см','66 см','72 см','56 см','74 см'],42:['9998','2222','7707','4047','4972'],50:['36','25','26','31','30']}
 if i in choices:d['options']=choices[i]
 return d
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==29;entries=[];evidence=[];equalities=0;correct={1:'(10/19)',2:'(13; 65; 195)',3:'11 мин',4:'2040',5:'7560',6:'64',8:'12',10:'14000',12:'4',13:'160 мин',14:'69%',15:'Y < Q < X < Z < P',16:'7',21:'9',23:'64',24:'33',26:'64 км/сағ',27:'6',28:'(9/10)',30:'95.3125%',31:'тауық — 26, қоян — 16',32:'8',35:'24',36:'8',38:'2028',39:'74 см',42:'7707',44:'▲■',50:'26'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert not q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},changed(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve({**changed(r,i),'answer':correct[i]},i)
  except Exception as e:raise AssertionError(('validChangedMath',i))from e
  proof['validChangedMathTarget']=correct[i];proof['oldKeyRejectedAndCorrectChangedInputAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:vals=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vals))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All29fullsource/newconditions completeofficial/newsolutions/all145source/newMCQoptions read. Actualprintedmixedfraction/equation/rationalchain/nesteddenominators, all4givenindexedtriples/constantmultipliers, equalunitrates, all4ageincrements/3sharedbirthdays, fictionalexchangeratiochain, two-stockdistributions, nonlineararea-volumegrowth, all5symbolicorders, fulltwo-rational-midpointinsertions, monotonefactorialinventory, exactpolynomialsubstitution, twoshoppingbasketreplay, equal-distanceharmonicmean, fullpowerlastdigitcycles, orderedheadlegcounts, allstrictintegers/allunfoldingaxes, allfixedlengthparitynumbers/leadingzero, fullsymbolcycle andallpiecesplitstates checked. All29validchangedinputs rejectoldkeysandacceptrecomputedanswers. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':29,'fullSourceNewConditionsAndSolutionsRead':29,'sourceOptionsRead':145,'rewrittenOptionsRead':145,'wrongKeysRejected':29,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':29,'knownModelIdsReused':1,'nativeFigures':0,'remainingVisualQuestionCount':20,'source47AlreadyVerifiedElsewhere':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':29,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
