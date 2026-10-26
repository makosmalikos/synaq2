"""All34fullsource/newconditions completeofficial/newsolutions/all170source/new
choices read. Same root author separate exact computation, not anotherhuman
reviewer. Native-letter-symmetry37 and15bitmaptasks remain separate.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('n','scripts/editorial/review-bil3-nonvisual.py');N=importlib.util.module_from_spec(sp);sp.loader.exec_module(N);B=N.B;H=N.H;E=N.E;one=N.one

def gaussian(rows,size):
 a=copy.deepcopy(rows);rank=0
 for col in range(size):
  pivot=next((j for j in range(rank,len(a))if a[j][col]),None)
  if pivot is None:continue
  a[rank],a[pivot]=a[pivot],a[rank];factor=a[rank][col];a[rank]=[v/factor for v in a[rank]]
  for j in range(len(a)):
   if j!=rank:factor=a[j][col];a[j]=[u-factor*v for u,v in zip(a[j],a[rank])]
  rank+=1
 assert rank==size and all(any(row[:size])or row[-1]==0 for row in a);return tuple(a[j][-1]for j in range(size))
def scalar(s):return E.calc(s)
def interval(value):
 t=E.plain(value).replace('\\cup','∪');result=[]
 for part in t.split('∪'):
  part=part.strip();assert part[0]in'(['and part[-1]in')]';left,right=part[1:-1].split(';');low=float('-inf')if left.strip()=='-∞'else E.calc(left);high=float('inf')if right.strip()=='∞'else E.calc(right);assert low<high;lc=part[0]=='[';hc=part[-1]==']';assert low!=float('-inf')or not lc;assert high!=float('inf')or not hc;result.append((low,high,lc,hc))
 return tuple(result)
def interval_text(value):return str(value)
def bound(expr):
 t=H.tex(expr).replace('\\ge','≥').replace('\\le','≤');lhs,op,rhs=re.split(r'(≤|≥|<|>)',t);coef,c=E.affine('('+lhs+')-('+rhs+')');a=one(coef);assert a;value=-c/a
 if a<0:op={'<':'>','>':'<','≤':'≥','≥':'≤'}[op]
 return(float('-inf'),value,False,op=='≤')if op in['<','≤']else(value,float('inf'),op=='≥',False)
def intersect(a,b):
 lo=max(a[0],b[0]);hi=min(a[1],b[1]);assert lo<hi;lc=all(v[2]for v in[a,b]if v[0]==lo);hc=all(v[3]for v in[a,b]if v[1]==hi);return(lo,hi,lc,hc)
def tuple3(value):return tuple(E.calc(v)for v in re.split('[;,]',E.plain(value)))
def root_values(value):return tuple(sorted(E.calc(v)for v in value.split(';')))
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))};out=None
 if i==1:
  a,b,c,d,last=H.numeric_tokens(one(parts));m=(d-b)/(c-a);minus=b-m*a;plus=c-m*b;out=m*d+plus;assert m>1 and minus<0<plus and out*m+minus==last;p.update({'uniqueMultiplierFromEqualFirstThirdCorrections':str(m),'bothAlternatingCorrections':list(map(str,[minus,plus])),'actualAllSixReplayedTerms':list(map(str,[a,b,c,d,out,last]))})
 elif i==5:
  raw=s.translate(str.maketrans({'○':'c','△':'t','☆':'z','□':'q'}));eqs=[v.strip('«» ')for v in raw.splitlines()if'='in v and'?'not in v];assert len(eqs)==4;matrix=[]
  for eq in eqs:
   lhs,rhs=eq.split('=');co,c=E.affine('('+lhs+')-('+rhs+')',('c','t','z','q'));matrix.append(co+[-c])
  values=gaussian(matrix,4);env=dict(zip(['c','t','z','q'],values));asked='t+c-z+q';assert'△ + ○ − ☆ + □'in s;out=E.expr(asked).value(env)
  for eq in eqs:lhs,rhs=eq.split('=');assert E.expr(lhs).value(env)==E.expr(rhs).value(env)
  p['allFourExactSymbolValues']={k:str(v)for k,v in env.items()};p['fullRankFourAndAllPrintedEquationsReplayed']=True
 elif i==6:
  eq=one(v for v in parts if'='in v);plain=E.plain(eq);plain=re.sub(r'\\overline\{([^}]+)\}',r'overline(\1)',plain)
  def number(m):
   st=m[1];assert len(st)==2 and all(c in'AB0123456789'for c in st);return'(10*'+st[0]+'+'+st[1]+')'
  eq=re.sub(r'overline\(([^)]+)\)',number,plain);lhs,rhs=eq.split('=');sol=[]
  for a,b in itertools.product(range(1,10),repeat=2):
   env={'A':F(a),'B':F(b)}
   if E.expr(lhs).value(env)==E.expr(rhs).value(env):sol.append((a,b))
  a,b=one(sol);out=F(abs(10*a+b-(10*b+a)));p.update({'all81PositiveDigitPairsChecked':81,'uniqueActualDigitPair':[a,b],'actualBothReversedNumbers':[10*a+b,10*b+a]})
 elif i==8:
  seq=H.numeric_tokens(one(parts));assert len(seq)==11;matrix=[]
  for j,v in enumerate(seq):k=j//2;q=F(k*(k+1),2);matrix.append(([F(1),F(0),q]if j%2==0 else[F(0),F(1),-q])+[v])
  models=set()
  for subset in itertools.combinations(matrix,3):
   try:a,b,step=gaussian(list(subset),3)
   except AssertionError:continue
   expected=[a+step*(j//2)*(j//2+1)/2 if j%2==0 else b-step*(j//2)*(j//2+1)/2 for j in range(11)];wrong=[j for j,(u,v)in enumerate(zip(seq,expected))if u!=v]
   if len(wrong)==1 and step>0:models.add((a,b,step,wrong[0]))
  a,b,step,j=one(models);assert step.denominator==1
  if not src:assert n[:3]==[step,2*step,3*step]
  out=seq[j];p.update({'uniqueTwoInterleavedQuadraticSequencesAfterOneRepair':list(map(str,[a,b,step])),'actualWrongOneBasedIndex':j+1,'correctReplacementValue':str(a+step*(j//2)*(j//2+1)/2 if j%2==0 else b-step*(j//2)*(j//2+1)/2),'all165ThreePointParameterFitsChecked':165})
 elif i==9:values=list(map(E.calc,B.options(r)));out=min(values)
 elif i==12:
  low,mid,high=H.tex(one(parts)).split('<');co,c=E.affine(mid);a=one(co);assert a>0;lo=(E.calc(low)-c)/a;hi=(E.calc(high)-c)/a;assert lo<hi;out=((lo,hi,False,False),);p.update({'exactStrictBounds':list(map(str,[lo,hi])),'bothEndpointsExcluded':True,'affineMiddleOriginalDenominatorNonzero':True})
 elif i==14:
  slow,fast,laps,full,remaining=n;out=remaining/(full-laps*fast/slow);assert 0<slow<fast and out>0;time=laps*out/slow;assert fast*time==full*out-remaining and (full-1)*out<fast*time<full*out;p['sameTimeBothCyclistDistancesAndFinalPartialLapReplayed']=True
 elif i in[15,46]:out,p2=E.equation(one(parts));p.update(p2)
 elif i==17:
  eq=one(parts);left,right=eq.split('=');root,p2=E.equation(eq.replace('|x|','x'));assert root>0;out=(-root,root)
  for x in out:assert E.expr(left.replace('|x|','('+str(abs(x))+')')).constant()==E.calc(right)
  nums=H.numeric_tokens(eq);numerator,base,coef,value=nums;assert min(numerator,base,coef,value)>0;p.update({'positiveDenominatorForAllRealX':True,'exactNonnegativeModulusValue':str(root),'bothFullOriginalRootsVerified':list(map(str,out))})
 elif i==19:distance,firstSpeed,minutes=n;out=(distance/2)/(minutes/60);assert min(n)>0;p['firstHalfSpeedDoesNotChangeRemainingHalfDistance']=True
 elif i==20:
  expr=H.tex(one(parts)).split('=')[0].strip();a,b,c=one(re.findall(r'([\d.]+)\s*\+\s*([\d.]+)\s*\*\s*([\d.]+)',expr));values=list(map(F,[a,b,c]));rounded=[math.floor(v+F(1,2))for v in values];out=F(rounded[0]+rounded[1]*rounded[2]);p['allActualIndividuallyRoundedPositiveValues']=rounded;p['halfTiesRoundUpBeforeMultiplicationThenAddition']=True
 elif i==21:
  base=E.calc(one(parts))if src else one(N.fractions(s,False));values=list(map(E.calc,B.options(r)));distances=[abs(v-base)for v in values];out=values[one(j for j,v in enumerate(distances)if v==min(distances))];p['allFiveExactDistancesToPrintedTarget']=list(map(str,distances))
 elif i in[22,23,26,42]:out=E.calc(one(parts).split('=')[0]);p['actualFullPrintedArithmeticAndAllOriginalDenominatorsEvaluatedExactly']=True
 elif i==24:total,batch,eggs=n;out=total/batch*eggs;assert out.denominator==1 and total%batch==0
 elif i==25:
  if src:increment=one(n);factor=F(4);assert'төрт есе'in s
  else:increment,factor=n
  root=math.isqrt(int(factor));assert factor.denominator==1 and root*root==factor and root>1;out=increment/(root-1);assert out>0 and(out+increment)**2==factor*out*out;p['bothPhysicalSquareAreasReplayed']=True
 elif i==27:
  first,second,red,required=n;assert first>=0 and second>=0 and 0<required<=red;out=first+second+required;assert out-1==first+second+(required-1);p['oneFewerDrawExplicitWorstCaseRedCount']=str(required-1);p['totalBalls']=str(first+second+red)
 elif i==28:volume,percent=n;out=volume*percent/100
 elif i==29:total,other=n;assert 0<other<total;out=(total-other)/total
 elif i==30:
  assign=one(v for v in parts if'='in v);key,val=H.tex(assign).split('=');val=E.calc(val);out=E.expr(parts[-1]).value({key.strip():val});p['actualFullVariableExpressionSubstituted']=True
 elif i==31:edge=one(n);out=6*edge**2;p['allSixSquareFacesOfNetIncluded']=True
 elif i==32:
  total=int(one(n));pairs=[(a,total-a)for a in range(10,100)if 100<=total-a<=999];assert pairs;out=F(min(abs(a-b)for a,b in pairs));witness=[list(v)for v in pairs if abs(v[0]-v[1])==out];p['allAdmissibleTwoDigitThreeDigitPairsChecked']=len(pairs);p['fullMinimumDifferenceWitnessPairs']=witness
 elif i==33:
  given=tuple3(one(parts));assert len(set(given))==3;out=tuple(sorted(given));p['actualInputValuesSortedExactly']=list(map(str,out))
 elif i==34:
  eqs=E.system(s,src);assert len(eqs)==2;bounds=list(map(bound,eqs));out=(intersect(*bounds),);p['bothActualHalfLineSolutions']=[[str(v)for v in b]for b in bounds];p['bothFullInequalitiesIntersectedWithEndpointFlags']=True
 elif i==35:
  seq=H.numeric_tokens(one(parts));assert len(seq)==15 and seq[:5]==seq[5:10]==seq[10:];index=int(one(re.findall(r'(\d+)-(?:ші|шы)',s)));out=seq[(index-1)%5];p.update({'actualRepeatedFiveNumberBlock':list(map(str,seq[:5])),'allThreeCapturedBlockCopiesAgree':True,'actualOneBasedIndex':index,'oneBasedBlockSlot':(index-1)%5+1})
 elif i==41:values=list(map(E.calc,B.options(r)));out=max(values);p['allFiveActualFullDifferenceValues']=list(map(str,values))
 elif i==44:
  shares=N.fractions(s,src);assert len(shares)==3 and all(0<v<1 for v in shares);out=F(86400)
  for v in shares:out*=v
  p['actualAllThreeSuccessiveDayFractions']=list(map(str,shares));p['exactSecondsPerDay']=86400
 elif i==45:
  dividend,divisor=n;quotient=dividend/divisor;assert quotient.denominator==1;digits=set(str(int(quotient)));values=B.options(r);assert len(values)==5 and all(re.fullmatch(r'\d',v)for v in values[:4]);missing=[v for v in values[:4]if v not in digits];out=F(one(missing))if missing else'Көрсетілген цифрлардың барлығы кездеседі';p.update({'exactWholeLongDivisionQuotient':str(quotient),'allActualQuotientDigits':sorted(digits),'allActualNumericOptionsMissingFromQuotient':missing,'lastAllListedDigitsPresentOptionChecked':not missing})
 elif i==48:child,ratio,future=n;out=child*ratio+child*(future-1);assert ratio>1 and future>1;p['bothAgesIncreaseBySameElapsedYears']=str(child*(future-1))
 elif i==49:clocks=re.findall(r'\d{1,2}:\d{2}',s);assert len(clocks)==2 and clocks[1]=='00:00';out=1440-N.clock(clocks[0]);assert out>0
 elif i==50:total,a,b,c=n;assert min(n)>0;out=total*min(a,b,c)/(a+b+c);p['allThreeProportionalPartLengths']=list(map(str,[total*v/(a+b+c)for v in[a,b,c]]));assert sum(total*v/(a+b+c)for v in[a,b,c])==total
 else:raise AssertionError(i)
 p['exactTarget']=str(out);return out,p

def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 if i in[12,34]:
  vals=list(map(interval,B.options(r)));assert len(vals)==len(set(vals))==5 and vals.count(out)==1 and interval(r['answer'])==out;p['allFiveActualIntervalSets']=[str(v)for v in vals];p['allOpenClosedEndpointAndUnionFlagsChecked']=True
 elif i==17:
  vals=list(map(root_values,B.options(r)));assert len(vals)==len(set(vals))==5 and vals.count(out)==1 and root_values(r['answer'])==out;p['allFiveActualRootSets']=[list(map(str,v))for v in vals]
 elif i==33:
  vals=list(map(tuple3,B.options(r)));assert len(vals)==len(set(vals))==5 and all(sorted(v)==list(out)for v in vals)and vals.count(out)==1 and tuple3(r['answer'])==out;p['allFiveActualThreeElementPermutationsCompared']=True
 elif i==45:assert str(out)==r['answer']and B.options(r).count(r['answer'])==1;p['allFiveMixedNumericAndAllListedDigitsChoiceChecked']=True
 elif i in[9,21,41]:
  vals=list(map(E.calc,B.options(r)));assert len(vals)==len(set(vals))==5 and vals.count(out)==1 and E.calc(r['answer'])==out;p['allFiveActualOptionValues']=list(map(str,vals))
 else:p.update(B.checked_choices(r,F(out)))
 return out,p
CHANGES={1:[('3; 10; 43; 170; ?; 2730','4; 14; 59; 234; ?; 3754')],5:[('= 10','= 12')],6:[('= 112','= 101')],8:[('; 50;','; 52;')],14:[('9 км қалды','12 км қалды')],15:[('= 6 +','= 13 +')],19:[('18 минутта','15 минутта')],20:[('48.5','49.5')],21:[('(1/3)','(2/5)')],22:[('× 60','× 70')],23:[('(2/9)','(4/9)')],24:[('108 печенье','126 печенье')],25:[('8 см','10 см')],26:[('(5/18)','(7/18)')],27:[('3 қызыл шар','4 қызыл шар')],28:[('625 мл','750 мл')],29:[('56 жапсырманың','64 жапсырманың')],30:[('w = 5','w = 6')],31:[('7 см','8 см')],32:[('628','728')],35:[('684-ші','685-ші')],42:[('2031','2032')],44:[('(1/6)','(1/8)')],46:[('(7/20)','(11/20)')],48:[('11 жаста','12 жаста')],49:[('20:47','20:52')],50:[('9.1 м','10.4 м')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==9:d['options'][2]='0.055';d['answer']='0.054';return d
 if i==12:d['statement']=d['statement'].replace('< 6','< 7');d['options']=['(−∞; −22) ∪ (28; ∞)','[−22; 28]','(28; ∞)','(−28; 22)','(−22; 28)'];d['answer']='(−22; 28)';return d
 if i==17:d['statement']=d['statement'].replace('= 8','= 6');d['options']=['3.5','−3.5','−3.5; 3.5','−4.5; 4.5','−5.5; 5.5'];d['answer']='−3.5; 3.5';return d
 if i==33:
  for k in['statement','answer']:d[k]=d[k].replace('(7/5)','(8/5)')
  d['options']=[v.replace('(7/5)','(8/5)')for v in d['options']];return d
 if i==34:d['statement']=d['statement'].replace('(x + 7)','(x + 8)');d['options']=['(−∞; −3)','(−3; 3.5)','(−∞; 3)','(3.5; 4)','(−3; ∞)'];d['answer']='(−∞; −3)';return d
 if i==41:d['options'][0]='0.2 − 8';d['answer']=d['options'][1];return d
 if i==45:d['statement']=d['statement'].replace('4444444440',str(36*123457890));d['options']=['1','3','5','6','Көрсетілген цифрлардың барлығы кездеседі'];d['answer']='6';return d
 for a,b in CHANGES[i]:assert a in d['statement'];d['statement']=d['statement'].replace(a,b)
 old,_=solve(r,i);new,_=solve(d,i,False,False);assert new!=old
 if i==21:d['answer']=one(v for v in d['options']if E.calc(v)==new)
 else:d['options']=[str(B.scalar(v)+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==34;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert not q['images']and not q['svg']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);d=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  new,_=solve(d,i);proof['validChangedActualInputTarget']=str(new);proof['oldKeyRejectedAndCorrectChangedInputAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and(before[-1].isascii()and before[-1].isalpha()):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All34fullsource/newconditions official/newsolutions/all170source/newchoices read. Onlyactualprintedconditions/options drivechecker: uniquealternatingaffinefactor, rank4glyphsystem, all81leadingnonzerodigitpairs, all165interleavedsequenceparameterfits/uniqueone-repair, exactrationalmin/nearest/max, strictdoubleintervals/systemintersection includingallopenclosed/infinity/unionflags, bothmodulusroots withoriginalpositivedenominator, fullmotion/proportion/squarevolumes/period/wholeage/digitquotient andfractional-arithmetic replays. Changedactualinputscanaries rejectoldkeysandacceptfullrecomputedanswers. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':34,'fullSourceNewConditionsAndSolutionsRead':34,'sourceOptionsRead':170,'rewrittenOptionsRead':170,'wrongKeysRejected':34,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':34,'printedSolutionEqualitiesVerified':equalities,'nativeFigures':0,'remainingVisualSourceTasksIncludingNativeLetter37':16,'pythonJavaScriptHashesMatched':34,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
