"""All10full frozen/newconditions and complete official/newsolutions read.
No sourcefigures/options. Same root author separate exact computational check,
not anotherhumanreviewer. Existing productrank modelID retained.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo4-spring-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('grade4','scripts/editorial/review-femo4-spring-grade4.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);T=G.T;P=G.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  expression=H.math_parts(s,src)[-1];pairs=re.findall(r'\\mathrm\{([A-Za-z]{2})\}',expression)if src else re.findall(r'overline\(([A-Za-z]{2})\)',expression);assert len(pairs)==2;letters=''.join(pairs);assert len(set(letters))==4;remaining=re.sub(r'\\mathrm\{[A-Za-z]{2}\}|overline\([A-Za-z]{2}\)','',expression);constant=one(H.numeric_tokens(remaining));maximum=None;witnesses=[];tested=0
  for digits in itertools.permutations(range(10),4):
   a,b,c,d=digits
   if not a or not c:continue
   tested+=1;value=10*a+b+10*c+d+constant
   if maximum is None or value>maximum:maximum=value;witnesses=[digits]
   elif value==maximum:witnesses.append(digits)
  assert tested==4032;out=maximum;assert out==183+constant;proof={'actualTwoLetterWords':pairs,'printedAddedConstant':str(constant),'all4032DistinctDigitsTwoNonzeroLeadingAssignmentsChecked':tested,'allMaximumDigitWitnesses':witnesses,'maximumValueTarget':str(out)}
 elif i==2:
  if src:assert n[6:]==[1,1]
  else:assert'Бір дәптер мен бір қарындаштың'in s
  a,b,p,d,e,q=n[:6];det=a*e-b*d;assert det!=0;priceX=(p*e-b*q)/det;priceY=(a*q-p*d)/det;assert min(priceX,priceY)>0 and a*priceX+b*priceY==p and d*priceX+e*priceY==q;out=priceX+priceY;copies=a+d;assert copies==b+e and out==(p+q)/copies;proof={'allSixPurchaseInputs':list(map(str,[a,b,p,d,e,q])),'bothPositiveUnitPrices':list(map(str,[priceX,priceY])),'bothOriginalPurchaseEquationsMatched':True,'equalCopiesAfterAddingPurchases':str(copies),'oneEachTotalTarget':str(out)}
 elif i==3:
  if src:assert'екі есе үлкен'in s;past,future,total=n;ratio=F(2)
  else:past,ratio,future,total=n
  assert past>0 and future>0 and ratio>1;nowTotal=total-2*future;younger=(nowTotal+(ratio-1)*past)/(ratio+1);out=nowTotal-younger;assert younger>past and out>younger and out-past==ratio*(younger-past)and out+future+younger+future==total;assert out.denominator==younger.denominator==1;proof={'currentBothAgeSum':str(nowTotal),'currentOlderYounger':list(map(str,[out,younger])),'pastBothAgesPositive':True,'pastOlderYounger':list(map(str,[out-past,younger-past])),'futureBothAges':list(map(str,[out+future,younger+future])),'bothOriginalAgeConstraintsMatched':True,'currentOlderTarget':str(out)}
 elif i==4:
  a,b=n;out=a+b-100;parts=[a-out,b-out,out];assert 0<a<=100 and 0<b<=100 and min(parts)>=0 and sum(parts)==100;proof={'actualTwoActivityPercentages':list(map(str,n)),'fullUnionPercent':100,'disjointOnlyAOnlyBBothPercentages':list(map(str,parts)),'bothPercentTarget':str(out)}
 elif i==5:
  if src:assert'үш еселенгенін'in s;multiplier=F(3)
  else:multiplier=one(n)
  assert multiplier>0;values=[]
  for a,b in itertools.product(range(1,10),range(10)):
   original=10*a+b;reversed=10*b+a
   if original+multiplier*(a+b)==reversed:values.append(original)
  out=F(len(values));assert all(x+multiplier*sum(map(int,str(x)))==int(str(x)[::-1])for x in values);proof={'actualDigitSumMultiplier':str(multiplier),'all90TwoDigitNumbersIncludingZeroUnitsChecked':90,'allOriginalNumbersMatchingFullReversal':values,'matchingCountTarget':str(out)}
 elif i==6:
  limit=int(one(n));oddPredicate='тақ'in s;assert oddPredicate or'жұп'in s;values=[x for x in range(1,limit+1)if not(x>limit or(x%2==1 if oddPredicate else x%2==0))];out=F(len(values));proof={'positiveNaturalsStartAt1':True,'allNaturalCandidatesThrough':limit,'aboveBoundFirstOrClauseAlwaysTrue':True,'printedParityPredicate':'odd'if oddPredicate else'even','allWholeOrStatementFalseNumbers':values,'falseStatementCountTarget':str(out)}
 elif i==7:
  bodyCm,bridgeM,speedCmPerMinute=n;assert min(n)>0;bridgeCm=100*bridgeM;distance=bridgeCm+bodyCm;out=distance/speedCmPerMinute;assert out*speedCmPerMinute-bodyCm==bridgeCm;proof={'bodyLengthCm':str(bodyCm),'bridgeLengthCm':str(bridgeCm),'headTravelFromEntryUntilTailExitCm':str(distance),'actualSpeedCmPerMinute':str(speedCmPerMinute),'fullCrossingMinutesTarget':str(out),'tailActuallyClearsFarBridgeEnd':True}
 elif i==8:
  total=int(one(n));edge=1
  while edge**3<total:edge+=1
  assert edge**3==total;painted=0;unpainted=0;hist=collections.Counter()
  for cube in itertools.product(range(edge),repeat=3):
   boundary=0
   for axis in range(3):
    for direction in[-1,1]:
     isPainted=cube[axis]==(0 if direction==-1 else edge-1);painted+=isPainted;unpainted+=not isPainted;boundary+=isPainted
   hist[boundary]+=1
  assert painted+unpainted==6*total and painted==6*edge*edge and unpainted==6*edge*edge*(edge-1);out=F(unpainted,painted);assert out==edge-1;proof={'actualSmallCubeCount':total,'edgeCount':edge,'allOrientedSmallCubeFacesChecked':total*6,'actualPaintedFaces':painted,'actualUnpaintedFaces':unpainted,'actualCubieCountByPaintedFaceCount':dict(hist),'internalSharedFaceCountedSeparatelyForEachCubie':True,'unpaintedToPaintedRatioTarget':str(out)}
 elif i==9:
  word=one(set(v.lower()for v in re.findall(r'[Тт]өрттаңбалы|[Бб]естаңбалы|[Үү]штаңбалы',s)));length={'төрттаңбалы':4,'бестаңбалы':5,'үштаңбалы':3}[word];values=range(10**(length-1),10**length);odd=[x for x in values if x%2];allOdd=[x for x in values if all(int(d)%2 for d in str(x))];assert len(odd)==9*10**(length-2)*5 and len(allOdd)==5**length and all(x%2 for x in allOdd);out=F(len(odd)-len(allOdd));proof={'allFixedLengthNaturalNumbersChecked':9*10**(length-1),'digitLength':length,'oddNumberCount':len(odd),'allOddDigitNumberCount':len(allOdd),'secondSetSubsetOfFirst':True,'differenceTarget':str(out)}
 elif i==10:return G.solve(r,10,src)
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('+ 37','+ 41'),2:('480 теңге','690 теңге'),3:('68 болады','76 болады'),4:('65%-ы','75%-ы'),5:('6 есесін','3 есесін'),6:('45-тен','49-дан'),7:('4 м көпірмен','5,1 м көпірмен'),8:('216 бірдей','343 бірдей'),9:('Бестаңбалы','Үштаңбалы'),10:('84 саны','48 саны')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==9:q['statement']=q['statement'].replace('бестаңбалы','үштаңбалы')
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and not q['images']and q['solution'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('options')and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All10full frozen/newconditions and complete official/newsolutions read. All4032distinctdigitassignments withtwoleadingnonzero constraints/maxwitnesses, exactpositivepricepair bothtransactions andsum, bothpast/futureageconditions, fullpercentagepartition, all90digitreversals, negatedwholeORforallboundedpositivenaturals withabovebound proof, fullbodybridgeendpointunitconversion, everyorientedfaceofall216/125smallcubes, all90k/9kodd-digitdomains/formulas andfullproduct/numbertieordering independentlychecked. Same root author not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,bars=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){bars++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,bars}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':10,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFractions':native['fractions'],'nativeOverlines':native['bars'],'nativeFigures':0,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'existingModelIdsReused':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
