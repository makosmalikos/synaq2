"""All17full frozen/newnonvisualconditions, complete official/newsolutions and
all49source/all49newMCQoptions read. Threevisualquestions4/8/15separate.
Two existing modelIDs reused. Same root author separate exact computation,
not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-practice5-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('stage1','scripts/editorial/review-altynsaka-2022-stage1-core.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;E=P.E;H=P.H;one=H.one;exact=P.exact
sp=importlib.util.spec_from_file_location('clockwork','scripts/editorial/review-altynsaka-school-eb1.py');D=importlib.util.module_from_spec(sp);sp.loader.exec_module(D)
opts=lambda r:[o['text']if isinstance(o,dict)else o for o in r['options']]
def option_value(text):return H.scalar(H.tex(text).split('=')[-1])
def numeric_options(r,out):
 values=list(map(option_value,opts(r)));assert len(values)==len(set(values))and values.count(out)==1 and option_value(r['answer'])==out;return values

def sum_cycle(a,b,index):
 pair=(a,b);seen={};states=[]
 while pair not in seen:seen[pair]=len(states);states.append(pair);pair=(pair[1],sum(pair)%10)
 prefix=seen[pair];period=len(states)-prefix;pos=index-1;location=pos if pos<len(states)else prefix+(pos-prefix)%period;out=F(states[location][0]);seq=[a,b]
 while len(seq)<index:seq.append((seq[-1]+seq[-2])%10)
 assert out==seq[index-1];return out,{'actualInitialDigitsAndOneBasedIndex':[a,b,index],'allActualPairStatesBeforeRepeat':[list(v)for v in states],'cyclePrefix':prefix,'cycleLength':period,'directAllTermsEqualPairStatePrediction':True,'allDirectDigitsThroughAskedIndex':seq,'indexedLastDigitTarget':str(out)}

def city(r):
 s=r['statement'];claims=re.findall(r'(?:^|\n)([^\n:]+):\s*«([^»]+)»',s);names=[a for a,b in claims];cities=opts(r);assert len(claims)==len(set(names))==len(set(cities))==5;rules=[]
 for actor,text in claims:
  pieces=text.split(', ал ');assert len(pieces)==2;pair=[]
  for piece in pieces:
   who=actor if'Мен'in piece else one(v for v in names if v in piece);place=one(v for v in cities if v in piece);pair.append((who,place))
  rules.append(pair)
 solutions=[]
 for order in itertools.permutations(cities):
  env=dict(zip(names,order));truths=[[env[who]==place for who,place in pair]for pair in rules]
  if all(sum(row)==1 for row in truths):solutions.append((env,truths))
 env,truths=one(solutions);asked=one(re.findall(r'([^\s]+) қай қаладан',s));assert asked in names and r['answer']==env[asked];return{'actualFiveActors':names,'actualFiveCities':cities,'allTenParsedActorCityClaims':rules,'all120CityBijectionsChecked':math.factorial(5),'uniqueCityAssignment':env,'allFiveActualTruthPairs':truths,'everySpeakerExactlyOneTrueOneFalseVerified':True,'askedPerson':asked,'cityTarget':env[asked],'answerChecked':True}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);values=None;special=False
 if i==1:
  equation=one(H.math_parts(s,src));out,proof=E.equation(H.tex(equation));sub,factor,a,b=n;values=numeric_options(r,out);assert values==[out-sub,out,out+6,out-6];proof.update({'actualSubtractorMultiplierRHSFactors':list(map(str,n)),'allFourOriginalIntermediateCorrectPlusMinusSixRolesPreserved':True,'rootTarget':str(out)})
 elif i==2:
  odd=not src and'тақ'in s;assert src and'жұп'in s or not src and('тақ'in s or'жұп'in s);allowed={d for d in range(10)if d%2==int(odd)};valid=[v for v in range(1000,10000)if len(set(str(v)))==4 and all(int(d)in allowed for d in str(v))];out=F(max(valid));values=numeric_options(r,out);a,b,c,d=map(int,values);correct=str(int(out));assert all(all(int(ch)in allowed for ch in str(v))for v in[a,b,c,d]);assert len(set(str(a)))<4 and len(set(str(b)))==4 and b<out and set(str(d))==set(correct)and d<out;proof={'actualDigitParity':'odd'if odd else'even','actualAllowedDigits':sorted(allowed),'all9000FourDigitCandidatesChecked':9000,'validDistinctDigitCandidateCount':len(valid),'allFourRepeatLowerSelectionCorrectWrongOrderRolesPreserved':True,'maximumFourDigitNumberTarget':str(out)}
 elif i==3:
  perimeter,mult=n;width=perimeter/(2*(1+mult));out=mult*width;values=numeric_options(r,out);assert values==[width,2*width,out-5,out];assert 2*(out+width)==perimeter and out/width==mult;proof={'actualPerimeterAndLongShortMultiplier':list(map(str,n)),'bothPhysicalSidesCm':list(map(str,[out,width])),'allFourWidthDoubleWidthMinusFiveCorrectRolesPreserved':True,'longSideCmTarget':str(out)}
 elif i==5:
  base,power=map(int,n);out=F(pow(base,power,10));whole=base**power;assert int(str(whole)[-1])==out;cycle=[];v=base%10
  while v not in cycle:cycle.append(v);v=v*base%10
  assert len(cycle)==4 and v==cycle[0]and out==cycle[(power-1)%len(cycle)];values=numeric_options(r,out);assert values==[out,*[x for x in cycle if x!=out]];proof={'actualBaseAndExponent':[base,power],'allFourPowerLastDigitsInOrder':cycle,'directBigIntegerLastDigitEqualsModPowAndCompleteCycle':True,'fullIntegerDecimalDigitCount':len(str(whole)),'allFourSourceCorrectThenOtherCycleDigitRolesPreserved':True,'lastDigitTarget':str(out)}
 elif i==6:
  numbers=list(map(int,n));prime=lambda x:x>1 and all(x%d for d in range(2,math.isqrt(x)+1));valid=[v for v in numbers if prime(v)];out=F(len(valid));values=numeric_options(r,out);assert values==[out-1,out,out+1,out+2];proof={'allSixActualGivenNumbers':numbers,'allExactPrimalitiesCheckedThroughSquareRoot':True,'allPrimeMembers':valid,'primeCountTarget':str(out)}
 elif i==7:
  if src:prefix=list(map(int,n));assert prefix==[j*(j+1)for j in range(1,6)];shift,index=1,6
  else:shift,index=map(int,n);assert E.expr(one(H.math_parts(s,False))).equals(E.expr('n*(n+'+str(shift)+')'))
  out=F(index*(index+shift));values=numeric_options(r,out);assert values==[out-2,out,index**2,out+2];proof={'actualAddedIndexOffsetAndAskedIndex':[shift,index],'allFirstFiveIndexProductTerms':[j*(j+shift)for j in range(1,6)],'originalOfficialIndexLawExplicitInRewrite':True,'allFourOriginalMinusTwoCorrectSquarePlusTwoRolesPreserved':True,'askedProductTermTarget':str(out)}
 elif i==9:return city(r)
 elif i==10:
  a,b=map(int,n);g=math.gcd(a,b);allCommon=[d for d in range(1,min(a,b)+1)if a%d==b%d==0];assert max(allCommon)==g;rows,cols=a//g,b//g;out=F(rows*cols);assert rows*g==a and cols*g==b and out*g*g==a*b;values=numeric_options(r,out);assert values==[g,4*out,out+25,out,2*out];proof={'actualRectangleDimensions':[a,b],'allCommonIntegerSquareSides':allCommon,'largestCommonSquareSide':g,'wholeSquareRowsColumns':[rows,cols],'reducedCoprimeSideRatioProvesNoLargerRealCommonGridMeasure':math.gcd(rows,cols)==1,'allSourceGCDQuarterAreaPlus25CorrectDoubleCountRolesPreserved':True,'maximumSquareTileCountTarget':str(out)}
 elif i==11:
  a,c,mult=n;assert mult==3 and a<c;distance=c-a;first=distance/(1+mult);out=a+first;assert c-out==mult*(out-a);values=numeric_options(r,out);assert values==[a+distance/8,out,a+distance/3,a+distance/2,a+3*distance/4];proof={'actualEndpointsAndBCtoABMultiple':list(map(str,n)),'wholeSegmentAndFirstSegmentLengths':list(map(str,[distance,first])),'pointStrictlyBetweenAndExactLengthRatioVerified':True,'allFiveOriginalSegmentFractionDistractorRolesPreserved':True,'internalPointCoordinateTarget':str(out)}
 elif i==12:
  count=int(one(n));increments=[1]
  for k in range(1,count+1):increments.append(increments[-1]+k)
  intersections=[(-(a+b),-a*b)for a,b in itertools.combinations(range(1,count+1),2)];assert len(set(intersections))==math.comb(count,2)and all(-2*count-2<x<2 and-count*count-1<y<count*count+1 for x,y in intersections);out=F(increments[-1]);assert out==1+count+math.comb(count,2);values=numeric_options(r,out);assert values==[out-6,out-1,out-10,out+10,out];proof={'actualLineCount':count,'allRegionCountsByAddedLine':increments,'exactGeneralPositionLineFamilyHasAllPairIntersectionsInsideRectangle':True,'allIntersectionsDistinctNoTripleConcurrency':True,'allFiveOriginalRegionOffsetRolesPreserved':True,'regionCountTarget':str(out)}
 elif i==13:
  target=one(v for v in H.math_parts(s,src)if'<'in v);l,middle,u=H.tex(target).split('<');coef,constant=E.affine(middle);coef=one(coef);assert coef>0;low=(exact(l)-constant)/coef;high=(exact(u)-constant)/coef;valid=list(range(max(1,math.floor(low)+1),math.ceil(high)));out=F(sum(valid));assert valid and all(exact(l)<E.expr(middle).value({'x':F(v)})<exact(u)for v in valid);assert not(exact(l)<E.expr(middle).value({'x':F(valid[0]-1)})<exact(u))and not(exact(l)<E.expr(middle).value({'x':F(valid[-1]+1)})<exact(u));values=numeric_options(r,out);assert values==[out-25,out,out-15,out+15,out+30];proof={'actualBothStrictSolutionBounds':list(map(str,[low,high])),'allNaturalSolutions':valid,'bothOutsideNeighborsRejected':True,'allFiveOriginalAnswerOffsetRolesPreserved':True,'sumNaturalSolutionsTarget':str(out)}
 elif i==14:
  product=int(one(n));valid=[v for v in range(100,1000)if math.prod(map(int,str(v)))==product];out=F(min(valid));proof={'actualRequiredDigitProduct':product,'all900ThreeDigitNumbersChecked':900,'allMatchingThreeDigitNumbers':valid,'leastDigitProductNumberTarget':str(out)}
 elif i==16:
  add,result,subtract=n;number=3*(result-add);assert number>0 and number/3+add==result;out=number/5-subtract;proof={'actualThirdAddResultFifthSubtract':list(map(str,n)),'recoveredWholeNumber':str(number),'originalThirdConstraintVerified':True,'fifthMinusConstantTarget':str(out)}
 elif i==17:
  if src:prefix=list(map(int,n));assert len(prefix)==6 and all(prefix[j]==sum(prefix[j-2:j])%10 for j in range(2,6))and'елуінші'in s;a,b=prefix[:2];index=50
  else:a,b,index=map(int,n)
  out,proof=sum_cycle(a,b,index)
 elif i==18:
  a,b,c=map(int,one(re.findall(r'(\d{2}):(\d{2}):(\d{2})',s.replace('$','').replace('{:}',':'))));out,proof=D.next_clock(a,b,c)
 elif i==19:
  mult=int(one(n));valid=[v for v in range(10,100)if v==mult*sum(map(int,str(v)))];out=F(one(valid));proof={'actualDigitSumMultiple':mult,'all90TwoDigitNumbersChecked':90,'allMatchingNumbers':valid,'uniqueTwoDigitNumberTarget':str(out)}
 elif i==20:
  first,last,divisor=int(n[0]),int(n[1]),int(n[-1]);assert first==1;valid=[(a,b)for a,b in itertools.combinations(range(first,last+1),2)if(a+b)%divisor==0];out=F(len(valid));groups={d:[v for v in range(first,last+1)if v%divisor==d]for d in range(divisor)};byResidue=sum(math.comb(len(vs),2)if d==(divisor-d)%divisor else len(vs)*len(groups[(divisor-d)%divisor])for d,vs in groups.items()if d<=(divisor-d)%divisor);assert out==byResidue;proof={'actualInclusiveRangeAndDivisor':[first,last,divisor],'allUnorderedDistinctPairsChecked':math.comb(last-first+1,2),'allValidPairs':[list(v)for v in valid],'fullPairEnumerationEqualsRemainderClassCount':True,'unorderedPairCountTarget':str(out)}
 else:raise AssertionError(i)
 if i not in[1,2,3,5,6,7,10,11,12,13]:assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer'])
 if values is not None:proof['allActualOptionValues']=list(map(str,values))
 proof['answerChecked']=True;return proof

def mutation(r,i):
 d=copy.deepcopy(r);s=d['statement'];changes={1:('x − 19','x − 21'),2:('түгел тақ','түгел жұп'),3:('96 см','112 см'),5:('2031-дәрежесі','2032-дәрежесі'),6:('85, 89, 93','85, 91, 93'),7:('n + 2','n + 3'),9:('Мәдина қай қаладан','Ерасыл қай қаладан'),10:('120 × 168','144 × 168'),11:('C(117)','C(141)'),12:('7 түзу','8 түзу'),13:('< 90','< 94'),14:('көбейтіндісі 48','көбейтіндісі 56'),16:('біріне 30','біріне 35'),17:('75-мүшесін','76-мүшесін'),18:('14:27:38','14:28:38'),19:('9 есе','6 есе'),20:('15-ке','16-ға')};a,b=changes[i];assert a in s;d['statement']=s.replace(a,b)
 replacements={1:['46','67','73','61'],2:['8864','8640','8642','6842'],3:['14 см','28 см','37 см','42 см'],5:['1','3','9','7'],6:['1','2','3','4'],7:['52','54','36','56'],10:['24','168','67','42','84'],11:['36','51','61','81','111'],12:['31','36','27','47','37'],13:['230','255','240','270','285']}
 if i in replacements:d['options']=replacements[i]
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];ids=set(range(1,21))-{4,8,15};assert len(rows)==17 and{r['params']['number']for r in rows}==ids;entries=[];evidence=[];equalities=0;optionCount=0;mcqs=0;changedAnswers={1:'67',2:'8642',3:'42 см',5:'1',6:'2',7:'54',9:'Семей',10:'42',11:'51',12:'37',13:'255',14:'178',16:'237',17:'8',18:'966',19:'54',20:'24'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']
  if q['options']:answer=one(o['text']for o in q['options']if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer']);mcqs+=1;optionCount+=len(q['options'])
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All17fullsource/newconditions and completeofficial/newsolutions/all49source+49newMCQoptions read. Exactoriginalequation/alloptionroles, all9000distinctparitynumbers, rectangleperimeter, fullBigIntpowerlastdigitcrosscompletecycle, trialprimality, explicitquadraticindexrule, all10actualcityclaims/all120bijections, completecommongridmeasures, exactinternalpoint/all5segmentfractions, generalpositionlinewitness, fullstrictnaturalbounds, all900productnumbers, recoveredwhole, complete100statepaircyclecrossdirectterms, everyclocksecondcrossindependentcandidatepatternminimum, all90digitmultiples andallunorderedpairscrossmodclasses checked. TwoexistingmodelIDsreused, threevisualsseparate. Allvalidchangedinputsrejectoldkeysandacceptcorrectkeys. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':17,'fullSourceNewConditionsAndSolutionsRead':17,'capturedOpenKeys':6,'capturedMCQKeys':mcqs,'sourceOptionsRead':optionCount,'rewrittenOptionsRead':sum(len(r.get('options',[]))for r in rows),'wrongKeysRejected':17,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':17,'knownModelIdsReused':2,'nativeFigures':0,'visualSourceQuestionsStillSeparate':[4,8,15],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':17,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
