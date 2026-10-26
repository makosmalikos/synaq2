"""43 BIL10 core tasks: all full source/new conditions official/new solutions
and all215 source/new choices read. Two conceptual tasks and five diagrams remain.
Source36 holiday convention retained in evidence, rewrite explicitly calibrated.
Same author separate computation, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil10-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('j','scripts/editorial/review-bil8-nonvisual.py');J=importlib.util.module_from_spec(sp);sp.loader.exec_module(J);N=J.N;B=J.B;H=J.H;E=J.E;one=J.one
def round_tenth(v):return F(math.floor(v*10+F(1,2)),10)
def volume_ml(s):
 m=re.fullmatch(r'(?:(\d+(?:[.,]\d+)?)\s*л\s*)?(?:(\d+(?:[.,]\d+)?)\s*мл)?',s.strip());assert m and any(m.groups());liters,milliliters=m.groups();return 1000*F((liters or'0').replace(',','.'))+F((milliliters or'0').replace(',','.'))
def ratio(v):return E.calc(H.tex(v))
def elapsed_seconds(v):
 a,b=H.numeric_tokens(v);assert a>=0 and 0<=b<60;return 60*a+b
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i==1:
  divisor=int(one(n))if src else 6;assert src or'Алтыға'in s;vals=[int(v)for v in B.options(r)];out=F(one(v for v in vals if v%divisor==0));assert all((v%6==0)==(v%2==0 and sum(map(int,str(v)))%3==0)for v in vals);p['allOptionRemainders']=[v%divisor for v in vals];p['allOptionDigitSums']=[sum(map(int,str(v)))for v in vals]
 elif i in[3,16,22,25,43]:
  expr=one(parts).removesuffix('= ?').strip();out=N.exact_power_arithmetic(expr);p['entireActualExpressionEvaluated']=True
 elif i==4:
  clock=one(re.findall(r'\d{1,2}:\d{2}',s));hours,minutes=H.numeric_tokens(s.replace(clock,''));out=J.clock_string(N.clock(clock)-60*hours-minutes);p['actualFlightMinutes']=str(60*hours+minutes)
 elif i==5:minutes,hours=n;out=minutes/(60*hours)*100;assert 0<out<100
 elif i==7:
  ratios=[H.numeric_tokens(v.split('=')[1])for v in parts if'='in v];assert len(ratios)==2;[a,b,c],[d,e,f]=ratios;assert min(a,b,c,d,e,f)>0;out=a/c*d/f;p['bothActualRatioTriples']=[list(map(str,v))for v in ratios]
 elif i==8:
  if src:count,mean,removedmean,remaining=n;removed=count-remaining;assert removed==2
  else:count,mean,removedmean,removed,remaining=n;assert count==removed+remaining
  out=(count*mean-removed*removedmean)/remaining;p['wholeRemovedRemainingSums']=list(map(str,[count*mean,removed*removedmean,out*remaining]))
 elif i==10:
  first,second=J.fraction_parts(s,src);gap=n[-1];unread=(1-first)*(1-second);read=1-unread;assert 0<unread<read;out=gap/(read-unread);counts=[first*out,(1-first)*second*out,unread*out];assert all(v.denominator==1 for v in counts)and sum(counts)==out;p['bothReadAndRemainingPageCounts']=list(map(str,counts))
 elif i in[11,18]:
  equation=one(parts);out,z=E.equation(equation);p.update(z)
 elif i==12:
  vals=[N.exact_power_arithmetic(v)for v in B.options(r)];big=max(vals);assert vals.count(big)==1;out=B.options(r)[vals.index(big)];p['allFivePrecedenceExpressionValues']=list(map(str,vals))
 elif i==13:
  seq=n if src else H.numeric_tokens(one(parts));assert len(seq)==6;diff=[b-a for a,b in zip(seq,seq[1:])];second=one(set(b-a for a,b in zip(diff,diff[1:])));assert second>0
  if not src:assert n[0]==second
  out=seq[-1]+diff[-1]+second;p['actualFirstDifferences']=list(map(str,diff));p['constantSecondDifference']=str(second)
 elif i==14:a,b,percent=n;out=(a+b)/(1-percent/100);assert out>0 and out.denominator==1 and out*percent/100==out-a-b
 elif i==15:a,b,c,fee1,fee2=n;out=(b+c)*fee1+(a+c)*fee2;p['twoComplementAttendanceCounts']=list(map(str,[b+c,a+c]));assert out==a*fee2+b*fee1+c*(fee1+fee2)
 elif i==17:
  whole=n[0];a,b=J.fraction_parts(s,src);out=whole*(1-a)*b;assert out.denominator==1 and (whole*a).denominator==1
 elif i==19:
  equation=one(v for v in parts if'='in v);left,right=equation.split('=');f=E.expr(left);want=E.calc(right);valid=[]
  for a,b,c in itertools.combinations(range(10),3):
   if a%2==0 and b%2==1 and f.value({'a':F(a),'b':F(b),'c':F(c)})==want:valid.append((a,b,c))
  assert valid;out=F(one(set(sum(v)for v in valid)));p['all120IncreasingDistinctDigitTriplesChecked']=True;p['allParityEquationSolutions']=[list(v)for v in valid]
 elif i==20:
  values=n if src else H.numeric_tokens(one(parts));assert len(values)==4;out=sum(values)
 elif i==23:
  product=int(one(n));valid=[v for v in range(10,100)if (v//10)*(v%10)==product];assert valid;out=F(len(valid));p['all90TwoDigitIntegersEnumerated']=True;p['allDigitProductWitnesses']=valid
 elif i==24:
  days=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];matches=[j for j,v in enumerate(days)if re.search(r'\b'+v+r'\b',s,re.I)];day=one(matches);clock=one(re.findall(r'\d{1,2}:\d{2}',s));hours=one(H.numeric_tokens(s.replace(clock,'')));elapsedDays=math.floor((N.clock(clock)+60*hours)/1440);out=days[(day+elapsedDays)%7];p['actualWholeDaysIncludingFinalMidnight']=elapsedDays
 elif i==26:
  heavy,light=n;assert min(n)>1;out=heavy*light;fraction=(1-1/light)/(heavy-1/light);assert 0<fraction<1 and fraction*out+(1-fraction)==light;p['feasibleHeavyItemShare']=str(fraction)
 elif i==27:
  per,mentors=n[:2];fraction=one(J.fraction_parts(s,src));gap=n[-1];assert 0<fraction<F(1,2);students=gap/(1-2*fraction);girls=students*fraction;boys=students-girls;out=students/per*mentors;assert all(v.denominator==1 for v in[students,girls,boys,out])and boys-girls==gap;p['actualStudentsGirlsBoys']=list(map(str,[students,girls,boys]))
 elif i==28:
  up,down,final=n;start=final+down-up;out=2*start-1;assert 1<=final<=out and 1<=start+up<=out and start-1==out-start;p['initialAndHighestAndFinalFloors']=list(map(str,[start,start+up,final]))
 elif i==29:out=B.relation(one(parts));p['strictSolutionOperatorBoundary']=[out[0],str(out[1])]
 elif i==30:
  if src:step,first,index=n
  else:first,step,index=n
  assert min(first,step,index)>0 and index.denominator==1;out=first+(index-1)*step;p['oneBasedIndexAndNumberOfIncrements']=list(map(str,[index,index-1]))
 elif i==31:
  first,step,last=n;out=(last-first)/step+1;assert out.denominator==1 and out>0 and first+(out-1)*step==last
 elif i==32:
  h,m,z=map(int,one(re.findall(r'\d{2}:\d{2}:\d{2}',s)).split(':'));assert h<24 and m<60 and z<60;start=3600*h+60*m+z;valid=[]
  for hh,mm,ss in itertools.product(range(24),range(60),range(60)):
   if len(set(f'{hh:02}{mm:02}{ss:02}'))==1:valid.append(3600*hh+60*mm+ss)
  deltas=[(t-start)%86400 for t in valid if(t-start)%86400>0];out=F(min(deltas));p['all86400ClockDisplaysEnumerated']=True;p['allEqualDigitClockSeconds']=valid;p['nextSameDigitDisplaySeconds']=(start+int(out))%86400
 elif i==33:
  low,high,divisor=map(int,n);assert 0<low<high and divisor>0;valid=[v for v in range(low,high+1)if v%divisor==0];out=F(len(valid));assert out==high//divisor-(low-1)//divisor;p['allDivisibleIntegersInInclusiveRange']=valid
 elif i==34:
  expr=one(parts);ratioNums=H.numeric_tokens(expr);oneunit,den=ratioNums;distance=n[0];assert oneunit==1 and den>0;out=distance*100000/den;p['exerciseMapScaleNotClaimAboutActualCityDistance']=True
 elif i==36:
  if src:
   equivalent,holiday,year=n;assert year==365;officialExact=equivalent*(year+holiday)/year;literalCalendar=equivalent*year/(year-holiday);out=round_tenth(officialExact);p.update(sourceOfficialAddsHolidayCountForOnlyEquivalentTwentyYears=True,sourceOfficialExactYearValue=str(officialExact),alternativeActualCalendarYearModelExact=str(literalCalendar),alternativeActualCalendarYearModelRounded=str(round_tenth(literalCalendar)),sourceUnstatedHolidayCountingConventionClarifiedInRewrite=True)
  else:
   equivalent,year,actualYear,holiday=n;assert year==actualYear and 0<holiday<year;exact=equivalent*year/(year-holiday);out=round_tenth(exact);p['actualEquivalentWorkDays']=str(equivalent*year);p['actualWorkDaysPerCalendarYear']=str(year-holiday);p['exactCalendarYearsBeforeTenthRounding']=str(exact)
 elif i==38:
  a,b,c=H.numeric_tokens(one(parts));out=c/(a+b);assert min(a,b,c)>0
 elif i==39:
  first,second=n;middle=second;initial=middle-first;out=2*middle;assert initial>=0 and initial+first+second==out;p['initialIntermediateFinalCounts']=list(map(str,[initial,middle,out]))
 elif i==40:
  fractions=J.fraction_parts(s,src);a,b=fractions;assert a+b<1;total=n[-1];groups=[a,b,1-a-b];weights=[1,2,3];mean=sum(f*w for f,w in zip(groups,weights));out=total/mean;counts=[out*f for f in groups];assert all(v.denominator==1 for v in counts)and sum(v*w for v,w in zip(counts,weights))==total;p['allStudentGroupCounts']=list(map(str,counts));p['allNotebookAllocations']=list(map(str,[v*w for v,w in zip(counts,weights)]))
 elif i==42:
  if src:mean=one(n);friends=2;assert'екі досының'in s
  else:friends,mean=n
  out=(friends+1)*mean;p['actualPersonCount']=str(friends+1)
 elif i==44:out=one(n)
 elif i==45:
  mass,first,targetPercent=n;initial=mass*first/100;out=(mass*targetPercent/100-initial)/(1-targetPercent/100);assert mass>0 and 0<first<targetPercent<100 and out>0 and (initial+out)/(mass+out)==targetPercent/100;p['initialSaltFinalSaltFinalSolutionMass']=list(map(str,[initial,initial+out,mass+out]))
 elif i==46:
  if src:
   cars,adults,kids=n;carW,adultW,mainW,extraW=map(F,[4,2,2,2]);gonecars,goneadults,gonekids=map(F,[1,2,1]);assert'бір көлікке'in s and'екі ересек самокатқа'in s
  else:cars,adults,kids,carW,adultW,mainW,extraW,gonecars,goneadults,gonekids=n
  assert cars>=gonecars and adults>=goneadults and kids>=gonekids;initial=cars*carW+adults*adultW+kids*(mainW+extraW);gone=gonecars*carW+goneadults*adultW+gonekids*mainW;out=initial-gone;assert out==(cars-gonecars)*carW+(adults-goneadults)*adultW+(kids-gonekids)*(mainW+extraW)+gonekids*extraW;p['initialGoneRetainedExtraWheels']=list(map(str,[initial,gone,gonekids*extraW]))
 elif i==47:
  young,old,mother=n;shift=mother-young-old;assert shift>0;out=young+shift;assert mother+shift==out+old+shift;p['actualUniformAgeUnderstatement']=str(shift);p['allActualAges']=list(map(str,[out,old+shift,mother+shift]))
 elif i==48:percent,value=n;out=2*value/(percent/100);assert 0<percent<100
 elif i==49:liters,count=n;assert min(n)>0;out=1000*liters/count
 elif i==50:count,excess,kg=n;assert min(n)>0;out=(1000*kg-excess)/count;assert out>0 and out*count+excess==1000*kg
 else:raise AssertionError(i)
 p['exactTarget']=str(out);return out,p

def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))==5 and r['answer']in opts
 if i==4:assert r['answer']==out;p['allClockOptions']=list(map(str,[N.clock(v)for v in opts]))
 elif i in[7,38]:vals=list(map(ratio,opts));assert len(set(vals))==5 and vals.count(out)==1 and ratio(r['answer'])==out;p['allExactOptionRatios']=list(map(str,vals))
 elif i==12:assert r['answer']==out;p['uniqueGreatestActualExpression']=out
 elif i==24:assert r['answer']==out
 elif i==29:vals=list(map(B.relation,opts));assert len(set(vals))==5 and vals.count(out)==1 and B.relation(r['answer'])==out;p['allStrictOptionRelations']=[[op,str(v)]for op,v in vals]
 elif i==32:vals=list(map(elapsed_seconds,opts));assert len(set(vals))==5 and vals.count(out)==1 and elapsed_seconds(r['answer'])==out;p['allElapsedTimeOptionSeconds']=list(map(str,vals))
 elif i==44:vals=list(map(volume_ml,opts));assert len(set(vals))==5 and vals.count(out)==1 and volume_ml(r['answer'])==out;p['allMixedVolumeOptionMilliliters']=list(map(str,vals))
 else:p.update(B.checked_choices(r,out))
 return out,p

CHANGES={1:[],3:[('(7/12)','(9/12)')],4:[('18:10','19:10')],5:[('18 минут','24 минут')],7:[('4 : 7 : 9','5 : 7 : 9')],8:[('мәні 24','мәні 26')],10:[('48-ге кем','60-қа кем')],11:[('= (2 +','= (3 +')],12:[],13:[('3; 8; 15; 24; 35; 48','4; 9; 16; 25; 36; 49')],14:[('18 жетекші','25 жетекші')],15:[('3500 теңге','4000 теңге')],16:[('8572','8574')],17:[('60 моншақ','80 моншақ')],18:[('8.4 − x','9.4 − x')],19:[('= 53','= 57')],20:[('0.264','0.364')],22:[('7.2 ×','8.2 ×')],23:[('көбейтіндісі 18','көбейтіндісі 16')],24:[('1220 сағат','1244 сағат')],25:[('«9 +','«10 +')],26:[('масса 3 есе','масса 4 есе')],27:[('90-ға артық','120-ға артық')],28:[('7-қабатқа','8-қабатқа')],29:[('x − 2','x − 3')],30:[('28-өрнекке','29-өрнекке')],31:[('404 моншақ','408 моншақ')],32:[('08:24:37','08:25:37')],33:[('150-ге','160-қа')],34:[('1800 км','2250 км')],36:[('22 × 365','23 × 365')],38:[('7 : 5 : 2','7 : 5 : 3')],39:[('18 бетбелгі','20 бетбелгі')],40:[('78 дәптер','104 дәптер')],42:[('массасы 64 кг','массасы 70 кг')],43:[('4 × 10','5 × 10')],44:[('6075 мл','6085 мл')],45:[('80 кг','100 кг')],46:[('6 автомобиль','7 автомобиль')],47:[('жасын 51','жасын 52')],48:[('0.14 болатын','0.21 болатын')],49:[('4.8 литр','6.4 литр')],50:[('5.1 кг','5.9 кг')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==1:d['options'][-1]='763992';d['answer']='763992';return d
 if i==12:d['options'][1]='5 × 3 × 2 + 1';d['answer']=d['options'][1];return d
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i);assert old!=new,(i,old,new)
 if i==4:delta=N.clock(new)-N.clock(old);d['options']=[J.clock_string(N.clock(v)+delta)for v in d['options']];d['answer']=new
 elif i in[7,38]:d['options']=[str(ratio(v)+new-old)+' : 1'for v in d['options']];d['answer']=str(new)+' : 1'
 elif i==24:d['options']=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма'];assert new in d['options'];d['answer']=new
 elif i==29:d['options']=[f'x {op} ({v+new[1]-old[1]})'for op,v in map(B.relation,d['options'])];d['answer']=d['options'][-1]
 elif i==32:
  values=[elapsed_seconds(v)+new-old for v in d['options']];d['options']=[f'{int(v)//60} минут {int(v)%60} секунд'for v in values];d['answer']=d['options'][3]
 elif i==44:d['options']=[B.decimal(volume_ml(v)+new-old)+' мл'for v in d['options']];d['answer']=d['options'][3]
 else:d['options']=[str(B.scalar(v)+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==43;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and not q['svg']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);d=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'INVALID'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve(d,i)
  except Exception as e:raise AssertionError(('validchanged',i))from e
  proof['validChangedActualInputAnswer']=d['answer'];proof['oldKeyRejectedCorrectChangedInputAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and((before[-1].isascii()and before[-1].isalpha())or before[-1]in'!<>:◆⊕_'):continue
   if r['solution'][match.end():].lstrip().startswith(('!',':')):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions, official/new solutions and all215source/newchoices read. Actual printed givens independently recomputed using exact rational arithmetic, original constraints, finite digits/exponents/age/filling assignments, strict inequalities, exact rounding and time/area/volume conversions. All43 changed actual input canaries reject old keys and accept recomputed answers. Same author computational review, not another human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':43,'sourceOptionsRead':215,'rewrittenOptionsRead':215,'wrongKeysRejected':43,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':43,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':43,'remainingBIL10Tasks':[2,6,9,21,35,37,41],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
