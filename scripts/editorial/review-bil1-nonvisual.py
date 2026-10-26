"""All34full frozen/newconditions completeofficial/newsolutions and all170
source/newMCQoptions read. Same root author separate exact computation,
not anotherhumanreviewer. Sixteen visualquestions remainseparate.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil1-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('eq','scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one;R=E.R
def options(r):return[o['text']if isinstance(o,dict)else o for o in r['options']]
def scalar(s):return H.scalar(re.sub(r'(?<=\d)\s+(?=\d)', '', H.tex(s).split('=')[-1].replace('%','').replace('°','')))
def decimal(v):return str(v.numerator)if v.denominator==1 else str(v.numerator/v.denominator)
def relation(text):
 l,op,r=re.split(r'([<>])',H.tex(text));a,b=E.affine('('+l+')-('+r+')');a=one(a);assert a;return(op if a>0 else'>'if op=='<'else'<',-b/a)
def checked_choices(r,out,expected=None):
 values=list(map(scalar,options(r)));assert len(values)==len(set(values))==5 and values.count(out)==1 and scalar(r['answer'])==out
 if expected is not None:assert values==expected,(values,expected)
 return{'allActualOptionValues':list(map(str,values)),'correctOptionIndex':values.index(out)}
def symbolic(r,target,domain,proof):
 vals=list(map(E.expr,options(r)));assert all(not a.equals(b)for a,b in itertools.combinations(vals,2));matches=[i for i,v in enumerate(vals)if v.equals(target)];assert len(vals)==5 and len(matches)==1 and E.expr(r['answer']).equals(target);assert H.tex(options(r)[one(matches)])==H.tex(r['answer']);proof.update({'allFiveOptionsComparedAsExactRationalPolynomialIdentities':True,'allActualOptions':options(r),'uniqueFormalCorrectOptionIndex':one(matches),'originalNonzeroVariableDomain':domain,'answerChecked':True});return proof

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);proof={};expected=None
 if i==1:
  num,den,a,b,p,q=n;spent=a*q/p+b;remaining=spent*(den-num)/num;out=F(math.floor(remaining));assert 0<num<den and p>0 and q>0 and out<=remaining<out+1;expected=[out-4,out-2,out,out+2,out+4];proof={'spentInSecondItemUnits':str(spent),'remainingInSecondItemUnits':str(remaining),'bothLargestAffordableAndNextUnaffordableVerified':True,'wholeItemCountTarget':str(out)}
 elif i in[2,3,18,39]:
  target=one(parts);out=E.calc(target);proof={'actualPrintedArithmetic':target,'exactRationalValueTarget':str(out)}
  if i==2:expected=[F(math.floor(out)),out,F(1),F(math.ceil(out)),out-1]
  elif i==3:expected=[out,out+1,out+2,out-1,out-2];numbers=list(map(abs,n));assert len(numbers)==4;proof['allNegativeModuli']=list(map(str,numbers));proof['complementaryPairSums']=list(map(str,[numbers[0]+numbers[2],numbers[1]+numbers[3]]));assert -sum(numbers)==out
  elif i==18:expected=[out+8,out,out-1,out-2,out-10];a,b,c,d=n;assert(a-b+c)/d==a/d-b/d+c/d==out
  else:
   digits=str(int(out));assert len(digits)==5;permutation=lambda order:F(int(''.join(digits[j]for j in order)));expected=[permutation([0,1,2,4,3]),out,permutation([0,1,3,2,4]),permutation([0,1,4,3,2]),out-80];powers=re.findall(r'(\d+)\^(\d+)',E.plain(target));assert len(powers)==3 and all(b=='2'for a,b in powers);bases=[F(a)for a,b in powers];assert out==(bases[0]-bases[1])*(bases[0]+bases[1])+bases[2]**2;proof['directSquaresEqualDifferenceOfSquares']=True
 elif i==4:
  km,unit,scale=n;assert unit==1 and min(km,scale)>0;out=km*100000/scale;expected=[5*out,3*out/2,10*out,out,out/2];proof={'actualKilometersAndScaleDenominator':list(map(str,[km,scale])),'allUnitsConvertedToCentimeters':True,'mapCentimetersTarget':str(out)}
 elif i==7:
  a,b,c,total=n;unit=total/(a+b+c);out=b*unit;assert sum(v*unit for v in[a,b,c])==total;expected=[c,out,c*unit,unit,total/3];proof={'actualThreeRatiosAndTotal':list(map(str,n)),'oneShare':str(unit),'allThreeMasses':list(map(str,[a*unit,b*unit,c*unit])),'middleMassTarget':str(out)}
 elif i in[10,20]:
  out,proof=E.equation(one(parts));expected=[2*out,out,-2*out,-out,F(0)]if i==10 else[out/9,out-9,9-out,out,-out]
 elif i==12:
  env={}
  for p in parts[:-1]:key,value=H.tex(p).split('=');env[key.strip()]=E.calc(value)
  assert set(env)=={'x','y','z'};out=E.expr(parts[-1]).value(env);assert out==sum(env.values());x,y,z=[env[k]for k in['x','y','z']];mediant=F(sum(v.numerator for v in[x,y,z]),sum(v.denominator for v in[x,y,z]));expected=[1/y,F(z.numerator,z.numerator+z.denominator),out,z,mediant];proof={'actualAssignedFractions':{k:str(v)for k,v in env.items()},'lcmDenominator':math.lcm(*(v.denominator for v in env.values())),'sumFractionTarget':str(out),'mediantIsNotFractionSum':mediant!=out}
 elif i in[13,17]:
  target=E.expr(one(parts));domain=['x']if i==13 else['x','y'];env={'x':F(2),'y':F(3)};assert target.value(env)==E.expr(r['answer']).value(env)
  for v in domain:
   try:target.value({**env,v:F(0)})
   except ZeroDivisionError:pass
   else:raise AssertionError(('originaldenominatordomain',i,v))
  if i==13:assert target.value({'x':F(2),'y':F(0)})==0
  proof={'actualPrintedOriginalRationalExpression':one(parts),'originalDenominatorZeroCasesIndividuallyRejected':True};return symbolic(r,target,domain,proof)
 elif i==15:
  white,black=n;assert min(n)>0;out=100*white/(white+black);expected=[out-20,out-10,out,out+10,out+20];proof={'actualWhiteBlackCounts':list(map(str,n)),'equalLikelihoodFavorableOverWhole':str(out/100),'probabilityPercentTarget':str(out)}
 elif i==16:
  count=int(one(n));pairs=list(itertools.combinations(range(count),2));out=F(len(pairs));assert out==count*(count-1)/2;expected=[F(count),F(2*count-3),out,out+2,out-2];proof={'actualParticipantCount':count,'allUnorderedMatchesEnumerated':pairs,'pairEnumerationEqualsHalvedDirectedCount':True,'matchCountTarget':str(out)}
 elif i==19:
  actual=relation(one(parts));values=list(map(relation,options(r)));assert len(values)==len(set(values))==5 and values.count(actual)==1 and relation(r['answer'])==actual;op,bound=actual;assert op=='>';coefficient,center,den,add,right=n;expectedRelations=[('<',bound),('>',bound),('>',-bound),('>',center/coefficient),('<',-bound)];assert values==expectedRelations;proof={'actualStrictSolutionOperator':op,'actualStrictBoundary':str(bound),'allFiveActualOptionRelations':[[a,str(b)]for a,b in values],'negativeCoefficientInequalityDirectionReversed':True,'answerChecked':True};return proof
 elif i==21:
  coefficient,a,b,c,d=n;rule=one(p for p in parts if'='in p).split('=')[1];f=E.expr(rule);assert f.equals(E.expr('x+'+str(coefficient)+'*x*y-y'));first=f.value({'x':a,'y':b});second=f.value({'x':c,'y':d});out=first-second;expected=[out-27,out-7,out,second,(a-c)*(b-d)];proof={'actualBilinearCoefficientAndFourOperands':list(map(str,n)),'bothOperationValues':list(map(str,[first,second])),'differenceTarget':str(out)}
 elif i==22:
  area=one(n);count=5;assert'бес'in s;unitArea=area/count;side=math.isqrt(int(unitArea));assert side*side==unitArea;out=F(2*(count+1)*side);expected=[F(5*side),out,F(15*side),F(10*side),F(8*side)];proof={'actualWholeArea':str(area),'actualCongruentSquareCount':count,'squareSide':side,'rectangleSides':[5*side,side],'areaConstraintRechecked':5*side*side==area,'perimeterTarget':str(out)}
 elif i==23:
  first,second,target=parts[:3];a,b=E.affine(first,('x','y'));c,d=E.affine(second,('x','y'));assert a[1]==c[0]==0 and a[0]==c[1]>0;less=F(one(re.findall(r'(\d+)-ке кем',s)));gap=(b-d+less)/a[0];coeff,constant=E.affine(target);assert coeff==[1];out=gap-constant;expected=[out+5,out-3,out+2,out,out+9];assert E.expr(first).value({'x':F(0)})==E.expr(second).value({'y':gap})-less;proof={'actualXBelowY':str(gap),'actualAskedShift':str(constant),'wholeDifferenceConstraintIndependentlySubstituted':True,'askedShortfallTarget':str(out)}
 elif i==25:
  equation=one(p for p in parts if'='in p);left,right=map(E.expr,equation.split('='));assert all(k.count('T')<=1 for k in right.n);coef=R({tuple(v for v in k if v!='T'):value for k,value in right.n.items()if'T'in k},right.d);constant=R({k:value for k,value in right.n.items()if'T'not in k},right.d);target=(left-constant)/coef;assert coef.equals(E.expr('P/'+str(one(n))));proof={'actualPrintedVariableEquation':equation,'symbolicCoefficientOfAskedT':str(one(n)),'nonzeroPDomainExplicitInRewrite':src or'нөлден өзгеше'in s};return symbolic(r,target,['P'],proof)
 elif i==26:
  number,mult,digit=map(int,n);product=number*mult;out=F(str(product).count(str(digit)));hist=collections.Counter(map(int,str(product)));assert out==hist[digit];expected=[out-4,out-3,out-2,out-1,out];proof={'actualMultiplicandMultiplierDigit':[number,mult,digit],'wholeExactProduct':str(product),'allResultDigitFrequencies':dict(hist),'digitCountTarget':str(out)}
 elif i==28:
  equations=E.system(s,True)if src else parts[:2];rows=[]
  for equ in equations:
   l,rhs=equ.split('=');coefs,const=E.affine('('+H.tex(l)+')-('+H.tex(rhs)+')',('x','y','z'));rows.append((coefs,-const))
  (a,c),(b,d)=rows;assert [v-u for u,v in zip(a,b)]==[1,1,1]and a[0]and a[2]==0 and b[2]==1;out=d-c;witness={'x':c/a[0],'y':F(0)};witness['z']=d-b[0]*witness['x'];assert all(E.expr(l).value(witness)==E.expr(rhs).value(witness)for l,rhs in(equ.split('=')for equ in equations));expected=[out+5,out+2,out,out-2,-out];proof={'actualAllSystemCoefficients':[[list(map(str,v)),str(c)]for v,c in rows],'differenceCoefficientsExactlyAskedSum':[1,1,1],'consistentActualSolutionWitness':{k:str(v)for k,v in witness.items()},'sumInvariantForEveryRealSystemSolution':True,'invariantSumTarget':str(out)}
 elif i==31:
  added=one(n);den=3 if'үштен'in s else 4 if'төрттен'in s else 0;assert den>1;out=added/(1-F(1,den));assert out/den+added==out;expected=[added+F(1,den),out,2*added,3*added,4*added];proof={'actualWholeFractionDenominatorAndExcess':[den,str(added)],'wholeMassTarget':str(out),'originalFractionConstraintRechecked':True}
 elif i==33:
  departure,slow,late,fast,early=n;assert 0<slow<fast and min(late,early)>0;distance=(late+early)/60/(1/slow-1/fast);deadline=distance/slow-late/60;assert deadline==distance/fast+early/60>0;out=distance/deadline;expected=[out,out+1,(slow+fast)/2,out+4,out+5];proof={'actualDepartureHourAndSpeedsDelays':list(map(str,n)),'sameRouteDistanceKm':str(distance),'onTimeAvailableHours':str(deadline),'bothLateAndEarlyArrivalConstraintsRechecked':True,'onTimeSpeedTarget':str(out)}
 elif i==34:
  students,teachers,difference=n;groups=difference/(students-teachers);assert groups.denominator==1 and groups>0;out=students*groups;assert out-teachers*groups==difference;expected=[out+5,out-5,out,out+12,out+15];proof={'actualPerGroupStudentsTeachersDifference':list(map(str,n)),'wholeGroupCount':str(groups),'allStudentsTarget':str(out)}
 elif i==35:
  sizeA,priceA,sizeB,priceB,needA,needB=map(int,n);a,b=math.ceil(F(needA,sizeA)),math.ceil(F(needB,sizeB));out=F(a*priceA+b*priceB);assert(a-1)*sizeA<needA<=a*sizeA and(b-1)*sizeB<needB<=b*sizeB;allcosts=[aa*priceA+bb*priceB for aa in range(a+2)for bb in range(b+2)if aa*sizeA>=needA and bb*sizeB>=needB];assert min(allcosts)==out;expected=[out+80,out-priceB,out-70,out-290,out];proof={'actualPackSizesPricesNeeds':[sizeA,priceA,sizeB,priceB,needA,needB],'bothMinimumWholePackCounts':[a,b],'oneFewerPackFailsEachSeparateRequirement':True,'boundedFullFeasibleEnumerationAndPositiveCostMonotonicityProveMinimum':True,'minimumCostTarget':str(out)}
 elif i==37:
  env={};pending=parts[1:]
  while pending:
   left=[];progress=False
   for eq in pending:
    key,expr=map(str.strip,H.tex(eq).split('='));assert re.fullmatch('[A-Z]',key)
    try:value=E.expr(expr).value(env)
    except KeyError:left.append(eq);continue
    env[key]=value;progress=True
   assert progress;pending=left
  assert set(env)==set('MATHSN');lhs,total=H.tex(parts[0]).split('=');assert sum(env[c]for c in'MATH')==E.calc(total);word=one(re.findall(r'([A-Z]+) сөзінің мәнін табыңыз',s));counts=collections.Counter(word);out=sum(env[c]*count for c,count in counts.items());assert out==sum(env[c]for c in word);expected=[out-1,out-2,out,out+1,out-3];proof={'allSixActualLetterValues':{k:str(v)for k,v in env.items()},'initialFourLetterTotalRechecked':True,'actualAskedWord':word,'actualLetterMultiplicities':dict(counts),'dependencyEvaluationAndDirectWholeWordSumAgree':True,'wordValueTarget':str(out)}
 elif i==38:
  price,percent=n;assert 0<percent<100;paid=price*percent/100;out=price-paid;expected=[paid,out-100000,price*F(3,4),out,price-percent*1000];proof={'actualPriceAndPaidPercent':list(map(str,n)),'actuallyPaid':str(paid),'paidPlusRemainderMatchesWholePrice':paid+out==price,'remainingPaymentTarget':str(out)}
 elif i==40:
  first,second,mult=n;out=(first+second)/(mult+1);others=[first-out,second-out];assert min(others)>0 and sum(others)+out==mult*out;expected=[out,out+200,out-300,out-800,out+700];proof={'actualOverlappingSumsAndWholeMultiple':list(map(str,n)),'otherSeparateFirstAndCombinedLastTwoStocks':list(map(str,others)),'bothOriginalOverlappingSumsAndWholeMultipleRechecked':True,'sharedClassMoneyTarget':str(out)}
 elif i==41:
  people,boats=n;assert'бес'in s and'үш'in s;out=(5*boats-people)/2;assert out.denominator==1 and 0<=out<=boats;valid=[v for v in range(int(boats)+1)if 3*v+5*(boats-v)==people];assert valid==[out];expected=[out,2*out,out+1,boats-1,boats-out];proof={'actualPeopleAndWholeBoatCount':list(map(str,n)),'allFeasibleBoatMixtures':valid,'smallerBoatCountTarget':str(out)}
 elif i==43:
  gap,mult,newGap=n;out=(newGap-gap)/(mult-1);small=out-gap;assert out>small and mult*out-small==newGap;expected=[out+F(1,2),out-F(1,5),out,out-F(1,2),out-F(7,5)];proof={'actualOriginalDifferenceMultiplierAndNewDifference':list(map(str,n)),'bothOriginalNumbers':list(map(str,[out,small])),'bothOriginalDifferenceConstraintsRechecked':True,'largerNumberTarget':str(out)}
 elif i==45:
  people,legs=n;chairLegs=legs-2*people;out=4*people-chairLegs;assert 0<=out<=people and 3*out+4*(people-out)+2*people==legs;expected=[out+3,out+4,out+2,out,out+1];proof={'actualPeopleAndCombinedLegs':list(map(str,n)),'peopleLegs':str(2*people),'chairLegs':str(chairLegs),'allLegCategoriesForwardReplayed':True,'threeLegChairCountTarget':str(out)}
 elif i==46:
  outward,less=n;back=outward-less;assert min(outward,back)>0;out=2/(1/outward+1/back);chosenDistance=outward;assert out==2*chosenDistance/(chosenDistance/outward+chosenDistance/back);expected=[back,out,out+10,out+16,out-10];proof={'actualOutwardSpeedAndDecrease':list(map(str,n)),'actualReturnSpeed':str(back),'bothEqualRouteLengthsChosen':str(chosenDistance),'totalDistanceOverTotalTimeEqualsHarmonicMean':True,'averageSpeedTarget':str(out)}
 elif i==48:
  total,first,second=n[:3];assert src and'екі есе'in s or not src and n[3]==2;neither=first+second-total;both=2*neither;out=first-both;partition=[out,second-both,both,neither];assert min(partition)>=0 and sum(partition)==total and both==2*neither and partition[0]+both==first and partition[1]+both==second;expected=[first+neither,out+11,both,second-both,out];proof={'actualTotalFirstSecondCounts':list(map(str,[total,first,second])),'allFourDisjointSetRegions':list(map(str,partition)),'partitionWholeBothMarginalsAndTwiceNeitherRechecked':True,'onlyFirstSubjectTarget':str(out)}
 elif i==49:
  assert n.count(F(360))==1;ratios=[v for v in n if v!=360];assert len(ratios)==4 and min(ratios)>0;angles=[360*v/sum(ratios)for v in ratios];assert sum(angles)==360 and all(0<v<180 for v in angles);out=min(angles);expected=[out,2*out/3,4*out/3,5*out/3,2*out];proof={'allActualFourRatios':list(map(str,ratios)),'allFourAngles':list(map(str,angles)),'convexQuadrilateralAngleDomainVerified':True,'minimumAngleTarget':str(out)}
 else:raise AssertionError(i)
 proof.update(checked_choices(r,out,expected));proof['answerChecked']=True;return proof

def changed(r,i):
 d=copy.deepcopy(r);a,b={1:('пен 9 өшіргіш','пен 11 өшіргіш'),2:('«11 +','«12 +'),3:('−4.25','−5.25'),4:('288 км','324 км'),7:('168 тонна','192 тонна'),10:('14 = 8','14 = 14'),12:('x = (2/3)','x = (1/3)'),13:('5 × x²','10 × x²'),15:('3 ақ','5 ақ'),16:('7 ойыншы','8 ойыншы'),17:('12 × x²','16 × x²'),18:('8888 −','8896 −'),19:('+ 2 < 10','+ 2 < 11'),20:('= −3',' = −4'),21:('x + 3 × x','x + 4 × x'),22:('245 см²','320 см²'),23:('4-ке кем','7-ке кем'),25:('P)/4)','P)/5)'),26:('87654321','7654321'),28:('+ z = 17','+ z = 19'),31:('6 кг','9 кг'),33:('18 км/сағ','24 км/сағ'),34:('90-ға','105-ке'),35:('19 маркер','25 маркер'),37:('T = 61','T = 63'),38:('18%-ын','22%-ын'),39:('+ 2²','+ 3²'),40:('23400 теңге','24800 теңге'),41:('50 оқушы','46 оқушы'),43:('77.6 болады','79.2 болады'),45:('79 аяқ','77 аяқ'),46:('105 км/сағ-қа','126 км/сағ-қа'),48:('34 оқушының','35 оқушының'),49:('4, 5, 7 және 8','3, 5, 7 және 9')}[i];assert a in d['statement'];d['statement']=d['statement'].replace(a,b)
 opts={1:['21','23','25','27','29'],2:['15','15.35','1','16','14.35'],3:['−28','−27','−26','−29','−30'],4:['90 см','27 см','180 см','18 см','9 см'],7:['17 тонна','40 тонна','136 тонна','8 тонна','64 тонна'],10:['1','0.5','−1','−0.5','0'],12:['(5/3)','(4/11)','(158/105)','(4/7)','(8/15)'],13:['(y³/(3 × x))','(y²/(3 × x²))','(y/(4 × x))','((2 × x × y²)/3)','((3 × y³)/x)'],15:['30%','40%','50%','60%','70%'],16:['8','13','28','30','26'],17:['8 × x² × y','8 × x × y²','((4 × y)/(x × y))','((4 × x × y)/(x × y))','8 × x × y'],18:['1010','1002','1001','1000','992'],19:['x < (3/4)','x > (3/4)','x > −(3/4)','x > 3','x < −(3/4)'],20:['(28/9)','19','−19','28','−28'],21:['126','146','153','37','12'],22:['40 см','96 см','120 см','80 см','64 см'],23:['18','10','15','13','22'],25:['((5 × R − S)/P)','((P × R)/5) − S','((5 × R)/P) + S','((5 × R + S)/P)','((5 × R)/P) − S'],26:['2','3','4','5','6'],28:['14','11','9','7','−9'],31:['9.25','12','18','27','36'],33:['28.8','29.8','30','32.8','33.8'],34:['131','121','126','138','141'],35:['2870 теңге','2400 теңге','2720 теңге','2500 теңге','2790 теңге'],37:['118','117','119','120','116'],38:['1760000 теңге','6140000 теңге','6000000 теңге','6240000 теңге','7978000 теңге'],39:['48890','48809','48089','48908','48729'],40:['5600 теңге','5800 теңге','5300 теңге','4800 теңге','6300 теңге'],41:['7','14','8','11','5'],43:['20.1','19.4','19.6','19.1','18.2'],45:['10','11','9','7','8'],46:['84','120','130','136','110'],48:['24','20','10','11','9'],49:['45°','30°','60°','75°','90°']};d['options']=opts[i]
 if i==37:d['statement']=d['statement'].replace('MATH = 80','MATH = 82')
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==34;entries=[];evidence=[];equalities=0;correct={1:'25',2:'15.35',3:'−28',4:'18 см',7:'40 тонна',10:'0.5',12:'(158/105)',13:'((2 × x × y²)/3)',15:'50%',16:'28',17:'8 × x × y²',18:'1002',19:'x > (3/4)',20:'28',21:'153',22:'96 см',23:'13',25:'((5 × R)/P) − S',26:'6',28:'9',31:'12',33:'28.8',34:'126',35:'2790 теңге',37:'119',38:'6240000 теңге',39:'48809',40:'5600 теңге',41:'7',43:'19.6',45:'7',46:'120',48:'9',49:'45°'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},changed(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve({**changed(r,i),'answer':correct[i]},i)
  except Exception as e:raise AssertionError(('validChangedMath',i))from e
  proof['validChangedMathTarget']=correct[i];proof['oldKeyRejectedAndCorrectChangedMathAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==6 and not r.get('image')and r['statement']!=q['statement']and len(r['options'])==5;assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:vals=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vals))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All34fullsource/newconditions completeofficial/newsolutions/all170source/newoptions read. Exactactualprintedrational arithmetic/equations/inequalities, allformalMCQidentities/originaldenominatordomains, strictfloor/ceilpurchaseoptimality, unitconversion/ratio/probability, pairenumeration, repeateddigitproduct/fullfrequency, underdeterminedsystemsumidentity, allletterdependencies/multiplicities, twoarrivalconstraints/equal-routeaveragespeed, two-setsfour-regionpartition andallquadangles checked. All34validchangedinputs rejectoldkeysandacceptrecomputedanswers. Three existingmodelIDs reused. Same root author notanotherhumanreviewer;16visualsseparate.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':34,'fullSourceNewConditionsAndSolutionsRead':34,'sourceOptionsRead':170,'rewrittenOptionsRead':170,'wrongKeysRejected':34,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':34,'symbolicMCQSets':3,'strictInequalityMCQSets':1,'knownModelIdsReused':3,'nativeFigures':0,'visualSourceQuestionsStillSeparate':[5,6,8,9,11,14,24,27,29,30,32,36,42,44,47,50],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':34,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
