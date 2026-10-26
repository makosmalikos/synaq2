"""All15full frozen/newconditions, complete official/newsolutions and all10MCQ
options read. Separate exact computational check by same author, not a second
humanreviewer. Officialprimepattern stated explicitly to remove ambiguity.
"""
import collections,copy,datetime,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-school-eb1';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('winter4','scripts/editorial/review-femo7-winter-grade4.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;K=P.K;H=P.H;one=H.one;exact=P.exact

def recurrence(a,b,index):
 seq=[a,b];states={};pair=(a,b);j=0
 while pair not in states:states[pair]=j;pair=(pair[1],pair[0]*pair[1]%10);j+=1
 prefix=states[pair];period=j-prefix
 while len(seq)<max(index,prefix+2*period+2):seq.append(seq[-1]*seq[-2]%10)
 assert all(seq[t]==seq[t+period]for t in range(prefix,len(seq)-period));out=seq[index-1];predicted=seq[index-1 if index-1<prefix else prefix+(index-1-prefix)%period];assert out==predicted;return F(out),{'actualInitialPair':[a,b],'actualOneBasedIndex':index,'allPairStatesBeforeRepeat':[[x,y]for x,y in states],'cyclePrefix':prefix,'cycleLength':period,'cycleTerms':seq[prefix:prefix+period],'allDirectTermsToIndexChecked':index,'directAllStepsEqualsPairCyclePrediction':True,'indexedDigitTarget':str(out)}

def next_clock(h,m,s):
 start=h*3600+m*60+s;assert 0<=h<24 and 0<=m<60 and 0<=s<60
 display=lambda t:f'{t//3600:02d}{t//60%60:02d}{t%60:02d}'
 good=lambda t:max(collections.Counter(display(t)).values())>=5
 candidates=set()
 for digit in'0123456789':
  for pos,other in itertools.product(range(6),'0123456789'):
   ds=[digit]*6;ds[pos]=other;a,b,c=int(''.join(ds[:2])),int(''.join(ds[2:4])),int(''.join(ds[4:]));
   if a<24 and b<60 and c<60:candidates.add(a*3600+b*60+c)
 assert all(good(t)for t in candidates);elapsed=next(k for k in range(1,86401)if good((start+k)%86400));expected=min((t-start)%86400 or 86400 for t in candidates);assert elapsed==expected;target=(start+elapsed)%86400;return F(elapsed),{'actualStart24HourSeconds':start,'actualStartDisplay':display(start),'allEarlierSecondsChecked':elapsed-1,'nextMatchingDisplay':display(target),'allDistinctValidSixDigitFiveSameClockCandidates':len(candidates),'fullSecondScanEqualsIndependentDigitPatternCandidateMinimum':True,'strictlyNextAndMidnightWrapHandled':True,'elapsedSecondsTarget':str(elapsed)}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  a,b=map(int,one(re.findall(r'(\d+)\s*<\s*x\s*<\s*(\d+)',H.tex(s))));valid=list(range(max(1,a+1),b));out=F(sum(valid));assert a not in valid and b not in valid;proof={'actualStrictBounds':[a,b],'allNaturalSolutions':valid,'bothEndpointsExcluded':True,'naturalSolutionSumTarget':str(out)}
 elif i==2:
  gap,fast,slow=n;assert gap>0 and fast>slow>0;out=gap/(fast-slow);first=fast*out;second=slow*out;assert first==gap+second;proof={'actualGapFastSlow':list(map(str,n)),'bothActualTraveledDistances':list(map(str,[first,second])),'catchupPositionsEqualWithFastInitiallyBehind':True,'catchupHoursTarget':str(out)}
 elif i==3:
  q,sv,a,b,c,d=n;assert b==sv and a+c==d;expression=H.math_parts(s,src)[-1];expanded=H.tex(expression).replace('s','('+str(sv)+')').replace('q','('+str(q)+')');expanded=re.sub(r'(?<=\d)\(', '*(',expanded);value=exact(expanded);out=a*sv+b*c+d*q;assert out==value==d*(sv+q);proof={'actualVariableValuesAndAllCoefficients':list(map(str,n)),'directSubstitutionExpression':expanded,'factorizationCommonMultiplier':str(d),'directSubstitutionEqualsFactoredExpression':True,'expressionValueTarget':str(out)}
 elif i==4:
  cleaned=s.replace('$','').replace('{:}',':');times=[tuple(map(int,m))for m in re.findall(r'(\d{1,2}):(\d{2})',cleaned)];start,end=times;assert'өртінші'in s;breakTime=int(n[-1]);elapsed=(end[0]*60+end[1])-(start[0]*60+start[1]);assert elapsed>0;out=F(elapsed-3*breakTime,4);assert out>0 and out.denominator==1 and 4*out+3*breakTime==elapsed;proof={'actualStartEndClockTimes':[list(start),list(end)],'wholeElapsedMinutes':elapsed,'exactlyThreeBreaksForFourEqualLessons':True,'allBreakMinutes':3*breakTime,'lessonMinutesTarget':str(out)}
 elif i==5:
  a,b,c,d,target=n;firstDifference=b-a;secondDifference=d-c;out=target-firstDifference-secondDifference;assert out>0;proof={'allFiveActualAgeInputs':list(map(str,n)),'bothConstantAgeGaps':list(map(str,[firstDifference,secondDifference])),'agesAtTargetMoment':list(map(str,[out,target-secondDifference,target])),'youngestTargetAge':str(out)}
 elif i==6:
  base=int(one(n));opts=[int(o['text']if isinstance(o,dict)else o)for o in r['options']];assert len(opts)==5 and len(set(opts))==5;results=[base-v for v in opts];assert all(1000<=v<=9999 for v in results);original=str(base);masks=[[a!=b for a,b in zip(original,str(v))]for v in results];roles=[[True,False,False,False],[True,True,True,False],[True,True,True,True],[True,True,False,True],[True,False,True,True]];assert masks==roles;out=F(one(v for v,mask in zip(opts,masks)if mask==[True,False,True,True]));proof={'actualFourDigitOriginal':base,'allFiveActualOptionSubtractions':[[v,result]for v,result in zip(opts,results)],'actualThousandHundredTenUnitChangeMasks':masks,'allFiveOriginalDistractorPositionRolesPreserved':True,'exactlyOneHundredsOnlyUnchangedOption':True,'correctSubtrahendTarget':str(out)}
 elif i==7:
  if src:day,index=map(int,n);year,month=2022,3;assert'сәрсенбі'in s;requiredWeekday=2
  else:year,day,index=map(int,n);month=4;assert'дүйсенбі'in s;requiredWeekday=0
  date=datetime.date(year,month,day);assert date.weekday()==requiredWeekday;start=date;workdays=[]
  while len(workdays)<index:
   if date.weekday()<5:workdays.append(date)
   date+=datetime.timedelta(days=1)
  last=workdays[-1];monthNames={3:'наурыз',4:'сәуір'};answer=f'{last.day} {monthNames[last.month]}';opts=[o['text']if isinstance(o,dict)else o for o in r['options']];assert len(opts)==5 and sum(o==answer for o in opts)==1;days=[int(one(H.numeric_tokens(o)))for o in opts];assert all(b-a==1 for a,b in zip(days,days[1:]));assert r['answer']==answer;return{'actualOpeningDate':start.isoformat(),'actualOpeningWeekday':start.weekday(),'actualRequestedInclusiveWorkday':index,'allCountedWorkingDates':[d.isoformat()for d in workdays],'allFiveConsecutiveDateOptionsRead':opts,'weekendsExcludedOpeningCountedAsDayOne':True,'calendarDateTarget':answer,'answerChecked':True}
 elif i==8:
  plain=H.tex(s);index=int(one(re.findall(r'(\d+)-мүш',plain)))
  if src:prefix=list(map(int,H.numeric_tokens(H.math_parts(s,True)[-1])));a,b=prefix[:2]
  else:a,b=map(int,one(re.findall(r'Алғашқы екі мүше (\d+) және (\d+)',s)));prefix=list(map(int,H.numeric_tokens(one(re.findall(r'Тізбек (.*?) түрінде',s)))))
  direct=[a,b]
  while len(direct)<len(prefix):direct.append(direct[-1]*direct[-2]%10)
  assert prefix==direct;out,proof=recurrence(a,b,index);proof['everyPrintedPrefixTermRechecked']=prefix
 elif i==9:
  cleaned=re.sub(r'\$\^2\$|²','',s);values=H.numeric_tokens(cleaned);total=int(values[0]);X,rem=divmod(total,10000);Y,Z=divmod(rem,100);assert 0<=Y<100 and 0<=Z<100 and X*10000+Y*100+Z==total;out=F(X+Y+Z);proof={'actualAreaSquareCentimeters':total,'canonicalMeterDecimeterCentimeterComponents':[X,Y,Z],'bothRemaindersInZeroTo99AndReconstructionChecked':True,'componentSumTarget':str(out)}
 elif i==10:
  equation=H.tex(one(H.math_parts(s,src)));left,right=equation.split('=');terms=list(map(int,H.numeric_tokens(left)));assert len(terms)==9 and all(b-a==1 for a,b in zip(terms,terms[1:]))and left.count('x')==1;rhs=exact(right);out=rhs-sum(terms);assert sum(terms)+out==rhs;proof={'allNineActualConsecutiveTerms':terms,'knownTermsSum':sum(terms),'actualRHSValue':str(rhs),'substitutedBothSidesEqual':True,'equationRootTarget':str(out)}
 elif i==11:
  clean=s.replace('$','').replace('{:}',':');h,m,sec=map(int,one(re.findall(r'(\d{2}):(\d{2}):(\d{2})',clean)));out,proof=next_clock(h,m,sec)
 elif i==12:
  digits=list(map(int,n));assert len(digits)==len(set(digits))and all(0<=d<=9 for d in digits);values=[100*a+10*b+c for a,b,c in itertools.permutations(digits,3)if a!=0];direct=[x for x in range(100,1000)if len(set(str(x)))==3 and all(int(d)in digits for d in str(x))];assert sorted(values)==direct;out=F(len(values));assert out==sum(d!=0 for d in digits)*(len(digits)-1)*(len(digits)-2);proof={'allActualAllowedDigits':digits,'all900ThreeDigitNumbersAlsoChecked':900,'allMatchingDistinctDigitNumbers':sorted(values),'zeroLeadingDigitExplicitlyExcluded':True,'choiceProductEqualsFullEnumeration':True,'threeDigitNumberCountTarget':str(out)}
 elif i==13:
  a,remA,b,remB=n;students=(remA-remB)/(b-a);assert students>0 and students.denominator==1;out=a*students+remA;assert out==b*students+remB;proof={'allFourActualDistributionInputs':list(map(str,n)),'sameWholeStudentCount':str(students),'bothDistributionsUseSameStock':True,'initialPaperCountTarget':str(out)}
 elif i==14:
  product=int(one(n));valid=[x for x in range(100,1000)if math.prod(map(int,str(x)))==product];out=F(min(valid));assert all(math.prod(map(int,str(x)))!=product for x in range(100,int(out)));proof={'actualDigitProduct':product,'all900ThreeDigitNumbersChecked':900,'allMatchingThreeDigitNumbers':valid,'allSmallerThreeDigitNumbersRejected':True,'leastThreeDigitNumberTarget':str(out)}
 elif i==15:
  numbers=list(map(int,H.numeric_tokens(H.math_parts(s,True)[0]if src else s)));prime=lambda v:v>1 and all(v%d for d in range(2,math.isqrt(v)+1));bad=[v for v in numbers if not prime(v)];out=F(one(bad));factors={v:[d for d in range(2,math.isqrt(v)+1)if v%d==0]for v in numbers};assert all(factors[v]for v in bad);proof={'allActualListedNumbers':numbers,'allTrialDivisorsThroughIntegerSquareRoot':factors,'allNonprimeEntries':bad,'officialPrimeClassificationRuleExplicitRatherThanClaimingUniqueUnstatedPattern':True,'singleNonprimeTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('2035','2036'),2:('420 км','455 км'),3:('q = 27','q = 28'),4:('12:18','12:22'),5:('Дина 18 жаста','Дина 19 жаста'),6:('8253 санынан','9354 санынан'),7:('18-жұмыс','19-жұмыс'),8:('2027-мүшені','2028-мүшені'),9:('507624 см²','507625 см²'),10:('70 × 6','80 × 6'),11:('12:34:56','12:35:56'),12:('және 9 цифрларынан','және 0 цифрларынан'),13:('31 парақ','36 парақ'),14:('көбейтіндісі 18','көбейтіндісі 24'),15:('19, 21, 23','19, 25, 23')}[i];assert a in r['statement'];bad={**r,'statement':r['statement'].replace(a,b)}
 if i==6:bad['options']=[*r['options'][:-1],'4965']
 return bad

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15 and {r['params']['number']for r in rows}==set(range(1,16));entries=[];evidence=[];equalities=0;changedAnswers={1:'10165',2:'13',3:'3060',4:'42',5:'11',6:'4965',7:'30 сәуір',8:'9',9:'151',10:'165',11:'2115',12:'48',13:'60',14:'138',15:'25'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']
  if q['options']:answer=one(o['text']for o in q['options']if o['correct']);assert answer==q['sourceAnswer']
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15full source/newconditions, complete official/newsolutions andall10MCQoptions read. Strictnaturalbounds, exactcatchuppositions, directsubstitutioncrosscommonfactor, allfourlessonsthreebreaks, allagegaps, everyfour-positionmaskofallfiveoptions, actualGregorianweekdaydatecount, completeproduct-last-digitpaircycleandall2027steps, canonicalunitquotients/remainders, allnineequationterms, allsecondsbeforenextclockeventcrossfullindependentdigitpatterngeneration, all9003digitcandidatesforchoices/productminimum, bothpaperdistributions andfulltrialdivisorprimeclassification checked. Everyvalidchangedinput rejectsoldkeyandacceptscorrectchangedkey. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'capturedOpenKeys':13,'capturedMCQKeys':2,'all10SourceNewOptionsRead':True,'all5SubtractionDistractorMasksPreserved':True,'wrongKeysRejected':15,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':15,'nativeFigures':0,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'ambiguousUnstatedPrimePatternRuleMadeExplicit':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
