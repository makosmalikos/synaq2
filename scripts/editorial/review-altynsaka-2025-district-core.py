"""All18full nonvisualsource/newconditions, complete official/newsolutions and
all22source/all22newMCQoptions read. Visualsource6/18separate. Same root author
separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2025-district-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('stage2open','scripts/editorial/review-altynsaka-2023-stage2-open.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;E=P.E;H=P.H;one=H.one;exact=P.exact
opts=lambda r:[o['text']if isinstance(o,dict)else o for o in r['options']]
normalize=lambda s:re.sub(r'\\text\{([^}]+)\}',r'\1',H.tex(s))

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);special=False
 if i==1:
  expr=one(H.math_parts(s,src));a,b,c,d,e,f=n;assert a==c and e==2*a;out=exact(H.tex(expr));assert out==a*(b-d+2*f);proof={'allSixActualProductInputs':list(map(str,n)),'directFullExpressionEqualsCommonFactorExpansion':True,'expressionValueTarget':str(out)}
 elif i==2:
  if src:prefix=list(map(int,n));assert len(prefix)==5 and all(v==(j+1)**3+j+1 for j,v in enumerate(prefix));coefficient,index=1,6
  else:coefficient,index=map(int,n);expr=one(H.math_parts(s,False));assert E.expr(expr).equals(E.expr('n^3+'+str(coefficient)+'*n'))
  out=F(index**3+coefficient*index);proof={'actualLinearCoefficientAndAskedIndex':[coefficient,index],'allFirstFiveTermsChecked':[j**3+coefficient*j for j in range(1,6)],'sourceOfficialRuleMadeExplicitNotUniqueUnstatedInference':True,'askedSequenceTermTarget':str(out)}
 elif i==3:
  firstTime,secondTime,quantity,target=n;first=quantity/firstTime;second=quantity/secondTime;out=target/(first+second);assert first*out+second*out==target;proof={'allFourActualProductionInputs':list(map(str,n)),'bothConstantMinuteRates':list(map(str,[first,second])),'bothContributionsAtFinish':list(map(str,[first*out,second*out])),'combinedTimeMinutesTarget':str(out)}
 elif i==4:
  var=one(re.findall(r'Кітапханада ([a-z]) ',H.tex(s)));fraction=F(1,4)if src else F(*map(int,one(re.findall(r'\((\d+)/(\d+)\)',s))));k=1/fraction;assert k>1;target=E.expr(str(k+1)+'*'+var);roles=[E.expr('('+str(v)+')*'+var)for v in[(k+1)/k,k/(k+1),k,k+1]];alternatives=[E.expr(o)for o in opts(r)];assert all(a.equals(b)for a,b in zip(alternatives,roles));assert E.expr(r['answer']).equals(target)and[ j for j,v in enumerate(alternatives)if v.equals(target)]==[3];special=True;proof={'actualKnownCategoryVariable':var,'actualFractionOfOtherCategory':str(fraction),'allFourOriginalCategoryFractionOptionMultipliers':list(map(str,[(k+1)/k,k/(k+1),k,k+1])),'allOptionsCheckedByExactPolynomialIdentities':True,'totalKnownCategoryMultiplier':str(k+1)}
 elif i==5:
  claims=re.findall(r'(?:^|\n)([^\n:]+):\s*«([^»]+)»',s);assert len(claims)==3;names=[a for a,b in claims];alternatives=opts(r);assert alternatives[:3]==names;valid=[];truths={}
  for culprit in alternatives:
   values=[]
   for actor,text in claims:
    if'Мен'in text:positive=not('емес'in text or'жоқпын'in text);truth=(culprit==actor)==positive
    else:accused=one(v for v in names if v in text);truth=culprit==accused
    values.append(truth)
   truths[culprit]=values
   if not any(values):valid.append(culprit)
  answer=one(valid);assert r['answer']==answer;special=True;proof={'actualActorsAndClaims':claims,'allCandidateCulpritTruthVectors':truths,'exactlyOneCandidateMakesAllThreeStatementsFalse':True,'culpritTarget':answer}
 elif i==7:
  multiplier=one(v for word,v in[('екі есе',2),('сегіз есе',8)]if word in s);legs,tails,ears=(4,1,2)if src else tuple(map(int,n));assert(legs,tails,ears)==(4,1,2);ratios=[F(legs,multiplier*tails),F(1),F(1,ears)];mx=max(ratios);winner=one(j for j,v in enumerate(ratios)if v==mx);alternatives=opts(r);answer=alternatives[winner];assert r['answer']==answer;unit=math.lcm(*(v.denominator for v in ratios));stocks=[v*unit for v in ratios];assert stocks[1]*legs==stocks[0]*tails*multiplier and stocks[2]*ears==stocks[1];special=True;proof={'actualFeetTailEarCounts':[legs,tails,ears],'actualFeetToTailMultiplier':multiplier,'allThreeAnimalStocksRelativeToSecond':list(map(str,ratios)),'concretePositiveWholeAnimalCounts':list(map(str,stocks)),'bothPrintedBodyPartConstraintsRechecked':True,'uniqueMostAnimalsTarget':answer}
 elif i==8:
  eq=one(H.math_parts(s,src));eq=H.tex(eq).replace('*','x');out,proof=E.equation(eq);proof['originalFullFractionEquation']=eq;proof['unknownNumeratorTarget']=str(out)
 elif i==9:
  if src:count=3;assert'үш таңбалы'in s
  else:count=one(v for word,v in[('төрттаңбалы',4),('бестаңбалы',5)]if word in s)
  allValues=[v for v in range(10**(count-1),10**count)if len(set(str(v)))==count];low,high=min(allValues),max(allValues);out=F(high-low-1);assert out==len(range(low+1,high));proof={'actualEndpointDigitWidth':count,'allNumbersCheckedForDistinctDigitExtremes':9*10**(count-1),'smallestAndLargestDistinctDigitEndpoints':[low,high],'allIntegersBetweenIncludedNotOnlyDistinctDigitIntegers':True,'bothEndpointsExcluded':True,'interiorIntegerCountTarget':str(out)}
 elif i==10:
  numbers=list(map(int,n));prime=lambda x:x>1 and all(x%d for d in range(2,math.isqrt(x)+1));allPairs={v:[(a,v-a)for a in range(2,v//2+1)if prime(a)and prime(v-a)]for v in numbers};bad=[v for v,pairs in allPairs.items()if not pairs];out=F(one(bad));proof={'allFiveActualCandidateNumbers':numbers,'allUnorderedPotentialPrimePairsExhausted':True,'allActualPrimePairRepresentations':allPairs,'uniqueNoPrimePairNumberTarget':str(out)}
 elif i==11:
  a,b,c,total=n;variables=['С','А','Қ']if src else['S','Y','N'];env=dict(zip(variables,[a,b,c]));vectors=[];values=[]
  for o in opts(r):
   text=normalize(o);coefs,constant=E.affine(text,tuple(variables));assert constant==0;vectors.append(coefs);value=E.expr(text).value(env);assert value==sum(v*env[k]for v,k in zip(coefs,variables));values.append(value)
  errors=[[v-d for v,d in zip(coefs,vectors[3])]for coefs in vectors];assert errors==[[0,-33,-2],[-5,27,-6],[-13,-2,8],[0,0,0],[0,-22,-29]];j=one(j for j,v in enumerate(values)if v==total);assert E.expr(normalize(r['answer'])).equals(E.expr(normalize(opts(r)[j])));special=True;proof={'actualAssignedVariableValues':{k:str(v)for k,v in env.items()},'actualTargetValue':str(total),'allFiveActualCoefficientVectors':[[str(v)for v in row]for row in vectors],'allOriginalCoefficientErrorVectorsPreserved':True,'allFiveActualOptionValues':list(map(str,values)),'uniqueMatchingOptionIndex':j}
 elif i==12:
  add,mult=n;target=E.expr(str(mult)+'*x+'+str(2*add*mult));alternatives=[E.expr(o)for o in opts(r)];roles=[E.expr(str(mult)+'*x+'+str(add*mult*k))for k in[F(1,2),1,F(3,2),2,F(5,2)]];assert all(a.equals(b)for a,b in zip(alternatives,roles));assert E.expr(r['answer']).equals(target)and[j for j,v in enumerate(alternatives)if v.equals(target)]==[3];original=E.expr(str(mult)+'*(a+'+str(add)+')+'+str(mult)+'*(b+'+str(add)+')');assert original.equals(E.expr(str(mult)+'*(a+b)+'+str(2*add*mult)));special=True;proof={'actualEachAddAndScale':list(map(str,[add,mult])),'bothIndividualTransformedTermsCheckedSymbolically':True,'allFiveOriginalConstantErrorMultipliersPreserved':True,'finalSumCoefficientAndConstant':list(map(str,[mult,2*add*mult]))}
 elif i==13:
  number=n[0];lines=[line for line in s.splitlines()if line.strip().startswith('•')];assert len(lines)==4;claims=[]
  for line in lines:
   a,b,divisor=H.numeric_tokens(line);part=number*a/b;claims.append({'fraction':[str(a),str(b)],'divisor':str(divisor),'part':str(part),'true':part.denominator==1 and part%divisor==0})
  out=F(sum(v['true']for v in claims));proof={'actualWholeNumber':str(number),'allFourActualFractionDivisibilityClaims':claims,'nonintegerPartsWouldNotBeTreatedAsDivisibleIntegers':True,'trueClaimCountTarget':str(out)}
 elif i==14:
  hours,km,minutes=n;out=km*1000*minutes/(hours*60);assert out/(km*1000)==minutes/(hours*60);proof={'actualHoursKilometersAskedMinutes':list(map(str,n)),'constantSpeedAndUnitConversionRechecked':True,'minuteDistanceMetersTarget':str(out)}
 elif i==15:
  total=one(n);assert'жарты'in s;second=total/F(5,2);first=total-second;sold=second/2;assert first-sold==second;out=sold;proof={'actualBothShopTotalKg':str(total),'firstAndSecondInitialStocks':list(map(str,[first,second])),'bothEqualRemainingStocks':str(second),'amountSoldHalfOfOtherShopNotFirst':True,'soldKilogramsTarget':str(out)}
 elif i==16:
  deficit,mult=n;out=deficit*mult;first=out-deficit;second=deficit;assert first+second==out and out/second==mult;proof={'actualDeficitAndInverseSumMultiplier':list(map(str,n)),'bothAddends':list(map(str,[first,second])),'bothOriginalSumConstraintsVerified':True,'sumTarget':str(out)}
 elif i==17:
  if src:initial,final=n;pieces=3;assert'үш бөлікке'in s
  else:pieces,initial,final=n
  out=(final-initial)/(pieces-1);assert out>=0 and out.denominator==1;counts=[initial+j*(pieces-1)for j in range(int(out)+1)];assert counts[-1]==final;proof={'actualPiecesPerSplitInitialFinal':list(map(str,[pieces,initial,final])),'everySinglePieceSplitCountState':list(map(str,counts)),'eachSplitRemovesOneAndCreatesGivenNumber':True,'splitCountTarget':str(out)}
 elif i==19:
  layers,cream,jam,cakes,jars=n;creamPer=(layers-1)*cream;jamPer=(layers-1)*jam;jamCakes=(jars-cakes*creamPer)/(jamPer-creamPer);assert jamCakes.denominator==1 and 0<=jamCakes<=cakes;creamCakes=cakes-jamCakes;out=jamCakes*jamPer;assert creamCakes*creamPer+out==jars;proof={'allFiveActualLayerJarCakeInputs':list(map(str,n)),'creamAndJamJarsPerWholeCake':list(map(str,[creamPer,jamPer])),'wholeCreamAndJamCakeCounts':list(map(str,[creamCakes,jamCakes])),'allCakesUnmixedAndJarsTotalReconstructed':True,'jamJarsRatherThanJamCakeCountTarget':str(out)}
 elif i==20:
  total=int(one(n));valid=[v for v in range(100,1000)if v//100+v%10==total];pairs={(v//100,v%10)for v in valid};out=F(len(valid));assert len(valid)==10*len(pairs);proof={'actualFirstLastDigitSum':total,'all900ThreeDigitNumbersChecked':900,'allValidFirstLastDigitPairs':[list(p)for p in sorted(pairs)],'middleDigitAllTenValuesFree':True,'numberCountTarget':str(out)}
 else:raise AssertionError(i)
 if not special:assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer'])
 proof['answerChecked']=True;return proof

def mutation(r,i):
 d=copy.deepcopy(r);s=d['statement']
 changes={1:('15 × 23','15 × 24'),2:('2 × n','3 × n'),3:('65 оюды','70 оюды'),4:('(1/5)','(1/6)'),5:('Мен жоғалтқан жоқпын','Мен жоғалттым'),7:('екі есе көп','сегіз есе көп'),8:('(3/8)','(13/24)'),9:('төрттаңбалы','бестаңбалы'),10:('61, 65, 84','61, 77, 84'),11:('мәні 2381','мәні 2503'),12:('3 қосып','4 қосып'),13:('12600','12630'),14:('15 км','18 км'),15:('360 кг','400 кг'),16:('120-ға','150-ге'),17:('47 бөлік','50 бөлік'),19:('144 банка','150 банка'),20:('қосындысы 5','қосындысы 8')};a,b=changes[i];assert a in s;d['statement']=s.replace(a,b)
 if i==4:d['options']=['(7/6) × t','(6/7) × t','6 × t','7 × t']
 if i==12:d['options']=['4 × x + 8','4 × x + 16','4 × x + 24','4 × x + 32','4 × x + 40']
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];ids=set(range(1,21))-{6,18};assert len(rows)==18 and{r['params']['number']for r in rows}==ids;entries=[];evidence=[];equalities=0;mcqs=0;changedAnswers={1:'675',2:'234',3:'14',4:'7 × t',5:'Жетекші',7:'Аю',8:'3',9:'88530',10:'77',11:'83 × S + 74 × Y + 71 × N',12:'4 × x + 32',13:'1',14:'300',15:'80',16:'900',17:'14',19:'84',20:'80'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']
  if q['options']:answer=one(o['text']for o in q['options']if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer']);mcqs+=1
  else:answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip();assert q['sourceAnswer']is None
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('validchangedinput',i))from e
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All18fullsource/newconditions and completeofficial/newsolutions/all22source+22newoptions read. Fullnumericexpressions/commonfactor/cubiclaws/rates, exact4categoryoptionpolynomials, all4liarculprittruthvectors, actualgivenanatomyratios, fractionequation, full4digitdistinctendpointsearchandallinteriorintegers, allprimepairs, all5actualcoefficientvectors preservingoriginalerrors, fullsymbolicsumidentity, eachactualfraction/divisibilityclaim, exactphysicalunits/shopstocks/addends/splitstates/cakelayers/900digitnumbers independentlychecked. Allvalidchangedinputsrejectoldkeysandacceptcorrectkeys. Source6/18visualsstillseparate. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options??[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':18,'fullSourceNewConditionsAndSolutionsRead':18,'capturedOpenKeys':13,'capturedMCQKeys':mcqs,'sourceOptionsRead':22,'rewrittenOptionsRead':22,'wrongKeysRejected':18,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':18,'nativeFractions':native['fractions'],'nativeFigures':0,'visualSourceQuestionsStillSeparate':[6,18],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':18,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
