"""All11full frozen/newnonvisualconditions and complete official/newsolutions
read. Fourvisualsourcequestions remain separate, not counted here. Same root
author separate exact computational review, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo6-spring-grade4-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('spring4','scripts/editorial/review-femo4-spring-grade4.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);T=G.T;P=G.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def coin_step(state):
 a,b=state;assert a>0 and b>0 and (a+b)%2==1;assert(a%2==0)!=(b%2==0)
 result=(a//2,b+a//2)if a%2==0 else(a+b//2,b//2);assert min(result)>0 and sum(result)==a+b;return result

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  ds=list(map(int,n));assert len(ds)==4 and min(ds)>0;out=F(math.lcm(*ds));valid=[k for k in range(1,int(out)+1)if all(k%d==0 for d in ds)];assert valid==[int(out)];proof={'allFourActualDivisors':ds,'allPositiveIntegersThroughLCMChecked':int(out),'noSmallerCommonPositiveMultiple':True,'leastCommonMultipleTarget':str(out)}
 elif i==2:return G.solve(r,1,src)
 elif i==3:
  part=H.math_parts(s,src)[0];value=exact(part);terms=H.numeric_tokens(part);assert value.denominator==1 and value>=0;out=value%10;units=(terms[0]%10-sum(t%10 for t in terms[1:]))%10;assert units==out;proof={'fullPrintedExpressionValue':str(value),'allActualExpressionTerms':list(map(str,terms)),'negativeUnitsBorrowingHandledByModulo10':True,'directFullIntegerEqualsUnitsMod10':True,'lastDigitTarget':str(out)}
 elif i==4:
  if src:km,laps=n
  else:laps,km=n
  assert km>0 and laps>0;perimeter=km*1000/laps;side=perimeter/4;out=side*side;assert 4*side*laps==1000*km;proof={'fullLapCount':str(laps),'allRunningDistanceKm':str(km),'oneLapPerimeterMeters':str(perimeter),'squareSideMeters':str(side),'areaSquareMetersTarget':str(out)}
 elif i==5:
  whole,mixedBoys,sameGirls=n;assert whole%2==sameGirls%2==0;sameBoyCount=whole-2*mixedBoys-sameGirls;assert sameBoyCount>=0 and sameBoyCount%2==0;out=sameBoyCount+mixedBoys;girls=mixedBoys+sameGirls;assert out+girls==whole;desks=[mixedBoys,sameGirls/2,sameBoyCount/2];assert sum(desks)*2==whole;proof={'allSeatsOccupied':str(whole),'mixedGirlPairBoyPairSeatPairs':list(map(str,desks)),'girlCount':str(girls),'boyCountTarget':str(out)}
 elif i==6:
  if src:assert'Бірінші және соңғы цифрларының қосындысы'in s;mult=F(1)
  else:mult=one(n)
  valid=[x for x in range(100,1000)if mult*(x//100)+x%10==(x//10)%10];out=F(len(valid));byFirst={a:sum(x//100==a for x in valid)for a in range(1,10)};assert out==sum(byFirst.values());proof={'all900ThreeDigitNumbersChecked':900,'actualFirstDigitMultiplier':str(mult),'allMatchingNumbers':valid,'countsByNonzeroFirstDigit':byFirst,'zeroUnitsAndRepeatedDigitsRemainAllowed':True,'matchingNumberCountTarget':str(out)}
 elif i==7:
  start,end,count,divisor=map(int,n);assert start==1 and end==count and divisor>0;displacements={j:int(j%2==0)-int(j%divisor==0)for j in range(1,end+1)};stayed=[j for j,d in displacements.items()if d==0];both=[j for j in stayed if j%2==0 and j%divisor==0];neither=[j for j in stayed if j%2 and j%divisor];assert sorted(both+neither)==stayed;out=F(len(stayed));assert out==end-end//2-end//divisor+2*(end//math.lcm(2,divisor));proof={'allNumberedStudentNetDisplacementsChecked':end,'allReturningBothInstructionNumbers':both,'allNeitherInstructionNumbers':neither,'bothInstructionsAppliedWhenBothHold':True,'stationaryCountTarget':str(out)}
 elif i==11:
  subtract,mult,add,divisor=n;assert mult>0 and divisor>0 and mult*divisor!=1;out=(mult*divisor*subtract+add)/(mult*divisor-1);intended=(out-subtract)*mult;mistaken=(out+add)/divisor;assert intended==mistaken and out>0;proof={'allFourPrintedOperationInputs':list(map(str,n)),'intendedResult':str(intended),'mistakenResult':str(mistaken),'originalNumberTarget':str(out)}
 elif i==13:
  a,b,moves=map(int,n);start=a,b;seen={};states=[];state=start
  while state not in seen:seen[state]=len(states);states.append(state);state=coin_step(state)
  prefix=seen[state];period=len(states)-prefix;index=moves if moves<len(states)else prefix+(moves-prefix)%period;result=states[index];direct=start
  for j in range(moves):direct=coin_step(direct)
  assert direct==result;out=F(result[0]);proof={'wholeOddCoinTotal':a+b,'allStatesBeforeFirstRepeat':[list(s)for s in states],'cyclePrefix':prefix,'cycleLength':period,'moves':moves,'finalBothCounts':list(result),'directAllMovesEqualCyclePrediction':True,'everyMoveUniqueEvenHolderAndWholeCoinsConserved':True,'firstPersonCoinsTarget':str(out)}
 elif i==14:
  digits=list(map(int,n));assert len(digits)==len(set(digits))==6 and all(1<=d<=9 for d in digits);values=[10*a+b for a,b in itertools.permutations(digits,2)];hits={a:[b for b in values if a!=b and a%b==0]for a in values};hits={a:bs for a,bs in hits.items()if bs};out=F(sum(hits));assert len(values)==30;proof={'all30DistinctDigitTwoDigitNumbersConstructed':30,'allDifferentDivisorPairsChecked':30*29,'allQualifyingNumbersAndOtherDivisors':hits,'selfDivisionExcluded':True,'noQualifyingNumberCountedTwice':True,'sumQualifyingNumbersTarget':str(out)}
 elif i==15:
  lag,lead=n;assert min(lag,lead)>0 and s.count('екі есе')>=2;out=F(4,3)*(lead+2*lag);other=out-lag;switch=out/2;assert 0<switch<other;firstFinish=switch+(1-F(1,2))/(2/out);otherAtSwitch=switch/other;otherFinish=switch+(1-otherAtSwitch)/(F(1,2)/other);assert out-other==lag and otherFinish-firstFinish==lead and 0<otherAtSwitch<1;assert firstFinish==3*out/4 and otherFinish==2*other-out/2;proof={'actualOriginalLagAndChangedLead':list(map(str,[lag,lead])),'originalWholeTimesFirstOther':list(map(str,[out,other])),'oneSharedGlobalSwitchTime':str(switch),'bothPositionsAtSwitch':list(map(str,[F(1,2),otherAtSwitch])),'bothPositiveRemainingDistances':True,'actualChangedFinishTimes':list(map(str,[firstFinish,otherFinish])),'sameSwitchInstantRatherThanEachOwnHalfway':True,'bothOriginalRaceConstraintsMatched':True,'firstOriginalFullTimeTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('9 және 12','9 және 15'),2:('936 тұрғын','937 тұрғын'),3:(' − 6»',' − 5»'),4:('9 км','12 км'),5:('40 орынның','42 орынның'),6:('2 есесі','3 есесі'),7:('36','40'),11:('15','30'),13:('2026 жүріс','2027 жүріс'),14:('7 және 8','7 және 9'),15:('6 минут бұрын','9 минут бұрын')}[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==11;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and not q['images']and q['solution'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==4 and not r.get('options')and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All11full nonvisualsource/newconditions and complete official/newsolutions read. ExhaustiveLCMminimum, universalselftruth, wholeinteger vsnegativeunitmod10, actuallapunitarea, fullpairedseatpartition, all900digitnumbers, everyinstructionnetdisplacement, allprintedwrongoperations, completecoinorbitandall2026directmoves, all870differentdivisorpairs and bothpiecewiserunnersnormalizedpositions/distances atonesharedglobalmoment independentlychecked. Fourvisualquestionsstillseparate. Same root author not separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':11,'fullSourceNewConditionsAndSolutionsRead':11,'sourceKeysNotCaptured':11,'wrongKeysRejected':11,'printedSemanticCanariesRejected':11,'nativeFractions':native['fractions'],'nativeFigures':0,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':11,'knownModelIdsReused':1,'visualSourceQuestionsStillSeparate':[8,9,10,12],'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
