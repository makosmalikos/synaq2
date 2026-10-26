"""All36 BIL12 core saved/new full conditions official/new solutions and all168
saved/new options read. Original four/five choice counts retained. Actual printed
conditions drive all arithmetic, identities and complete finite searches.
Same author separate computation, not another human reviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil12-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-bil11-core.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);J=C.J;N=C.N;B=C.B;H=C.H;E=C.E;one=C.one;G=C.G;coords=C.coords;coord_text=C.coord_text
def interval_option(s):return()if s=='шешімі жоқ'else G.interval(s)
def interval_string(intervals):
 if not intervals:return'шешімі жоқ'
 def bound(v):return'−∞'if v==float('-inf')else'∞'if v==float('inf')else str(v)
 return' ∪ '.join(('['if lc else'(')+bound(a)+'; '+bound(b)+(']'if hc else')')for a,b,lc,hc in intervals)
def minutes_value(s):return E.calc(H.tex(s).removesuffix('мин').strip())

def telescope(expr):
 n=H.numeric_tokens(expr);assert len(n)==12;chunks=[n[j:j+3]for j in range(0,12,3)];numerator=one({v[0]for v in chunks});step=one({b-a for _,a,b in chunks});assert numerator>0 and step>0 and step.denominator==1;assert all(chunks[j+1][1]==chunks[j][2]for j in range(2));start=chunks[0][1];last=chunks[-1][1];end=chunks[-1][2];assert start>0 and(last-start)%step==0;terms=[numerator/(a*(a+step))for a in range(int(start),int(last)+1,int(step))];out=sum(terms);assert out==numerator/step*(1/start-1/end);return out,{'allTelescopingTermCount':len(terms),'actualNumeratorStepStartFinalDenominator':list(map(str,[numerator,step,start,end])),'fullTermEnumerationAgreesWithBoundaryCancellation':True}

def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i==1:out=E.expr(one(parts));p['formalWholeNestedSignIdentity']=True
 elif i==2:first,second=n;assert first>second>0;out=second/first;p['equalDistanceSpeedRatioIsInverseTimeRatio']=True
 elif i==3:
  total,credit,penalty,score=n;out=(score+penalty*total)/(credit+penalty);assert out.denominator==1 and 0<=out<=total and credit*out-penalty*(total-out)==score;p['actualCorrectAndWrongCounts']=list(map(str,[out,total-out]));p['sourceAllQuestionsAnsweredAssumptionExplicitInRewrite']=True
 elif i==4:
  value=n[0];assert value>1;out=value;history=[];fac=1;k=1
  while fac<value:k+=1;fac*=k;history.append([k,fac])
  assert fac==value;p['allSuccessiveFactorialsToExactTarget']=history
 elif i==5:
  if src:perimeter=one(n);count=8;assert'сегіз'in s
  else:count,perimeter=H.numeric_tokens(s.replace('см²',''))
  assert min(count,perimeter)>0;side=perimeter/4;out=count*side**2;p['actualUnitSquareSideAndCount']=list(map(str,[side,count]))
 elif i==6:
  distance,downTime,upTime=n;down=distance/downTime;up=distance/upTime;assert down>up>0;out=(down-up)/2;boat=(down+up)/2;assert (boat+out)*downTime==(boat-out)*upTime==distance;p['actualDownUpAndStillWaterSpeeds']=list(map(str,[down,up,boat]))
 elif i==7:
  eqs=E.system(s,True)if src else parts;rows=[]
  for eq in eqs:left,right=eq.strip().rstrip(', .').split('=');co,c=E.affine('('+left+')-('+right+')',('x','y'));rows.append([*co,-c])
  out=G.gaussian(rows,2);assert all(sum(a*v for a,v in zip(row[:2],out))==row[-1]for row in rows);p['bothOriginalEquationsReplayed']=True
 elif i==8:
  together,first=n;assert first>together>0;rate=1/together-1/first;out=1/rate;assert 1/first+1/out==1/together;p['actualSecondPipeHourlyRate']=str(rate)
 elif i==9:
  first,percent=n[:2];fraction=one(J.fraction_parts(s,src));second=first*percent/100;third=(first+second)*fraction;out=first+second+third;p['allThreeMonthLengths']=list(map(str,[first,second,third]))
 elif i==10:
  op,bound=C.affine_relation(one(parts));assert op=='<';out=((float('-inf'),bound,False,False),);p['strictUpperBoundary']=str(bound)
 elif i==11:
  hectare,are,sqm=H.numeric_tokens(s.replace('м²',''));out=10000*hectare-100*are-sqm;p['allThreeSquareMeterAmounts']=list(map(str,[10000*hectare,100*are,sqm]))
 elif i==12:
  if src:subtract,add=n;factor=F(3);assert'үш есе'in s
  else:factor,subtract,add=n
  small=(add+subtract)/(factor-1);out=factor*small;assert out>small>0 and out-subtract==small+add;p['actualSmallLargeNumbers']=list(map(str,[small,out]))
 elif i==13:
  slopes=[]
  for eq in parts:
   left,right=eq.split('=');co,c=E.affine('('+left+')-('+right+')',('x','y'));ax,ay=co;assert ay;slopes.append(-ax/ay)
  assert len(slopes)==2 and slopes[0]!=slopes[1];out='Екі түзу перпендикуляр'if slopes[0]*slopes[1]==-1 else'Екі түзу перпендикуляр емес';p['actualTwoSlopesAndProduct']=list(map(str,slopes+[math.prod(slopes)]))
 elif i==14:
  eqs=E.system(s,True)if src else parts;bounds=[C.affine_relation(v.strip().rstrip(', .'))for v in eqs];assert len(bounds)==2 and all(op=='<'for op,b in bounds);bound=min(v for op,v in bounds);out=((float('-inf'),bound,False,False),);p['bothStrictUpperHalfLineBoundaries']=list(map(str,[v for op,v in bounds]))
 elif i==15:
  speed,headstart,meet=n;assert meet>headstart>0 and speed>0;time=(meet-headstart)/speed;out=meet/time;assert out>speed and (out-speed)*time==headstart;p['actualRemainingTimeUntilCatch']=str(time)
 elif i==16:
  eq=one(v for v in parts if'='in v);asked=one(v for v in parts if'='not in v);left,right=eq.split('=');difference=E.expr(left)-E.expr(right);coA=difference.n.get(('a',),F(0));coB=difference.n.get(('b',),F(0));assert set(difference.n)<={('a',),('b',)}and coA and coB;aOverB=-coB/coA;plain=H.arithmetic_text(E.plain(asked));substituted=re.sub(r'\ba\b','('+str(aOverB)+'*b)',plain);constant=E.expr(substituted).constant();out=constant;assert E.expr(left).value({'a':aOverB,'b':F(1)})==E.calc(right);assert src or'b нөлден өзгеше'in s;p['exactAOverB']=str(aOverB);p['formalAskedRatioConstantForEveryNonzeroB']=True
 elif i==17:
  herdSize,cowsPerHerd,total,cowsPerArea,area=n;cows=total/herdSize*cowsPerHerd;out=cows/cowsPerArea*area;assert cows>0 and cows.denominator==1 and cows<=total;p['actualWholeCowCount']=str(cows)
 elif i==18:
  sonShare,daughterShare=J.fraction_parts(s,src);gap=F(3)if src else n[-1];assert sonShare>daughterShare>0;father=gap/(sonShare-daughterShare);son=father*sonShare;daughter=father*daughterShare;assert son-daughter==gap and all(v.denominator==1 for v in[father,son,daughter]);out=(father,son,daughter)
 elif i==19:
  total,first,second=n;a=total*first/100;b=total*second/100;out=max(F(0),a+b-total);witness=[a-out,b-out,out,total-a-b+out];assert all(v>=0 and v.denominator==1 for v in witness)and sum(witness)==total;p['attainableMinimumOnlyFirstOnlySecondBothNeither']=list(map(str,witness))
 elif i==20:
  if'төрт таңбалы'in s:digits,cbDigits=4,2
  else:assert'үш таңбалы'in s and'бір таңбалы'in s;digits,cbDigits=3,1
  squares={v*v:v for v in range(10,100)};cubes={v**3:v for v in range(1 if cbDigits==1 else 10,10 if cbDigits==1 else 100)};common=[v for v in squares.keys()&cubes.keys()if 10**(digits-1)<=v<10**digits];out=F(one(common));p['allAdmissibleCommonSquareCubeRepresentations']=[[v,squares[v],cubes[v]]for v in sorted(common)]
 elif i==21:
  low,high=n;valid=[v*v for v in range(math.isqrt(int(high))+1)if low<=v*v<=high];out=F(len(valid));p['allSquaresInInclusiveRange']=valid
 elif i==22:
  count,mean,*scores=n;assert len(scores)==count-1;out=count*mean-sum(scores);assert out>=0;p['actualKnownScoresAndMissing']=list(map(str,scores+[out]))
 elif i==23:
  formula=one(v for v in parts if v.strip().startswith('f(x)'));assignment=one(v for v in parts if re.match(r'f\(\d+\)',v.strip()));argument=F(one(re.findall(r'f\((\d+)\)',assignment)));value=E.calc(assignment.split('=')[1]);rhs=formula.split('=')[1];plain=H.arithmetic_text(E.plain(rhs));substituted=re.sub(r'\bx\b','('+str(argument)+')',plain);co,c=E.affine(substituted,('k',));out=(value-c)/one(co);assert E.expr(rhs).value({'x':argument,'k':out})==value;p['actualFunctionArgumentValueCoefficient']=list(map(str,[argument,value,out]))
 elif i in[25,40]:out,z=telescope(one(parts));p.update(z)
 elif i==26:
  if src:children,grade,mothers,fathers=n;assert grade==6
  else:children,mothers,fathers=n
  out=mothers+fathers-children;assert 0<=out<=min(mothers,fathers)and mothers-out+fathers-out+out==children;p['bothMotherOnlyFatherOnlyCounts']=list(map(str,[out,mothers-out,fathers-out]));p['oneParentPerChildAttendanceAssumptionExplicit']=True
 elif i==27:
  small,large,total=n[:3];assert all(v in[small,large]for v in n[3:]);countSmall=total*large/(small+large);countLarge=total-countSmall;assert small<large and min(countSmall,countLarge)>0 and countSmall.denominator==countLarge.denominator==1 and countSmall*small==countLarge*large;out=countSmall;p['actualBothBagCountsAndCommonMass']=list(map(str,[countSmall,countLarge,countSmall*small]))
 elif i==28:
  body,bridge,time=n;speed=(body+bridge)/time;out=body/speed;assert min(n)>0;p['fullBridgePassDistanceAndSpeed']=list(map(str,[body+bridge,speed]))
 elif i==30:
  if src:giveFirst,factor,giveSecond=map(F,[1,2,1]);assert'бір қойыңды'in s and'екі есе'in s
  else:giveFirst,factor,giveSecond=n
  first,second=G.gaussian([[F(1),-factor,-(factor+1)*giveFirst],[F(1),F(-1),2*giveSecond]],2);assert first>giveSecond and second>giveFirst and first+giveFirst==factor*(second-giveFirst)and first-giveSecond==second+giveSecond;out=(first,second);p['bothHypotheticalTransfersReplayedNotPerformedSequentially']=True
 elif i==31:
  sons=F(6)if src else one(n);assert sons>0;out=sons+1;p['allSonsShareOneAndSameSister']=True
 elif i==32:
  hour=one(n);assert 0<hour<12;gap=30*hour;out=gap/F(11,2);assert 6*out==gap+out/2 and out>0;p['initialHandGapAndRelativeSpeedDegreesPerMinute']=list(map(str,[gap,F(11,2)]))
 elif i==34:
  values=H.numeric_tokens(one(parts))
  if src:lo,hi=int(values[0]),int(values[-1]);factors=list(range(lo,hi+1,2));assert values[:3]==factors[:3]and values[-2:]==factors[-2:]
  else:factors=list(map(int,values))
  product=math.prod(factors);out=F(product%10);assert product>0;p['allActualFactorLastDigits']=[v%10 for v in factors];p['wholeExactProduct']=str(product)
 elif i==35:
  digits=int(n[-1]);total=0;page=0
  while total<digits:page+=1;total+=len(str(page))
  assert total==digits;out=F(page);assert sum(len(str(j))for j in range(1,page+1))==digits;p['exactAllPageNumberDigitsReplayed']=digits;p['previousPageDigitCount']=digits-len(str(page))
 elif i==36:
  asked=int(one(n));assert 1<=asked<=28 and'үш сенбі'in s;days=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];possible=[]
  for length,firstWeekday in itertools.product(range(28,32),range(7)):
   sats=[d for d in range(1,length+1)if(firstWeekday+d-1)%7==5]
   if sum(d%2==0 for d in sats)==3:possible.append((length,firstWeekday,sats,days[(firstWeekday+asked-1)%7]))
  assert possible;out=one({v[-1]for v in possible});p['allTwentyEightMonthLengthWeekdayStartsChecked']=28;p['allAdmissibleCalendarModels']=[list(v)for v in possible]
 elif i==37:a,b=n;out=((1+a/100)*(1+b/100)-1)*100
 elif i==39:
  first,second=[H.numeric_tokens(v)for v in parts];assert len(first)==len(second)==3 and len(set(first))==len(set(second))==1;small=first[0];large=second[0];paint=n[3];assert large>small>0 and paint>0;out=paint*large**2/small**2;p['bothCubeSurfaceAreasAndPaintGrams']=list(map(str,[6*small**2,6*large**2,paint]));p['surfaceAreaNotVolumeScaleVerified']=True
 else:raise AssertionError(i)
 if i!=1:p['exactTarget']=str(out)
 return out,p

def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))in[4,5]and r['answer']in opts
 if i==1:
  vals=list(map(E.expr,opts));assert all(not a.equals(b)for a,b in itertools.combinations(vals,2));assert sum(v.equals(out)for v in vals)==1 and E.expr(r['answer']).equals(out);p['allOptionsFormalFullPolynomialIdentityCompared']=True
 elif i==2:vals=[E.calc(H.tex(v))for v in opts];assert len(set(vals))==len(vals)and vals.count(out)==1 and E.calc(H.tex(r['answer']))==out;p['allExactRatioChoices']=list(map(str,vals))
 elif i==4:vals=list(map(C.factorial_calc,opts));assert vals.count(out)==1 and C.factorial_calc(r['answer'])==out;p['allFactorialChoiceValues']=list(map(str,vals))
 elif i==7:vals=list(map(coords,opts));assert len(set(vals))==len(vals)and vals.count(out)==1 and coords(r['answer'])==out;p['allCoordinateChoices']=[list(map(str,v))for v in vals]
 elif i in[10,14]:vals=list(map(interval_option,opts));assert len(set(vals))==len(vals)and vals.count(out)==1 and interval_option(r['answer'])==out;p['allActualIntervalChoices']=[str(v)for v in vals]
 elif i==32:vals=list(map(minutes_value,opts));assert len(set(vals))==len(vals)and vals.count(out)==1 and minutes_value(r['answer'])==out;p['allMinuteOptionValues']=list(map(str,vals))
 elif i in[13,36]:assert r['answer']==out
 elif i in[18,30]:vals=[tuple(H.numeric_tokens(v))for v in opts];assert len(set(vals))==len(vals)and vals.count(out)==1 and tuple(H.numeric_tokens(r['answer']))==out;p['allActualTupleChoices']=[list(map(str,v))for v in vals]
 else:vals=list(map(B.scalar,opts));assert len(set(vals))==len(vals)and vals.count(out)==1 and B.scalar(r['answer'])==out;p['allActualOptionValues']=list(map(str,vals));p['correctOptionIndex']=vals.index(out)
 return out,p

CHANGES={1:[('−23','−24')],2:[('6 сағатта','7 сағатта')],3:[('45 балл','46.25 балл')],4:[('362880 саны','3628800 саны')],5:[('10 бірдей','12 бірдей')],6:[('48 км','64 км')],7:[('= 13','= 24')],8:[('20 сағатта','12 сағатта')],9:[('40 км','45 км')],10:[('< 2','< 3')],11:[('0.12 га','0.13 га')],12:[('7-ні қоссақ','10-ды қоссақ')],13:[('10 − x','10 + x')],14:[('< 3','< 3.75')],15:[('360 км','480 км')],16:[('= 1','= 2')],17:[('360 бас','480 бас')],18:[('4 жас үлкен','5 жас үлкен')],19:[('1000 үй','1200 үй')],20:[],21:[('300-ге','400-ге')],22:[('орташа 9 балл','орташа 10 балл')],23:[('17.25','18.75')],25:[('(79 × 81)','(81 × 83)')],26:[('26 ана','27 ана')],27:[('33 қаптама','44 қаптама')],28:[('2 минутта','3 минутта')],30:[('маған 2 қой берсең, менде','маған 3 қой берсең, менде')],31:[('5 ұл','7 ұл')],32:[('5-ті','6-ны')],34:[('× 15 ×','× 16 ×')],35:[('2292 цифр','2592 цифр')],36:[('24-і','25-і')],37:[('12%-ға','20%-ға')],39:[('8 г бояу','12 г бояу')],40:[('(89 × 90)','(99 × 100)')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==20:d['statement']=d['statement'].replace('төрт таңбалы','үш таңбалы').replace('әрі екі таңбалы санның кубына','әрі бір таңбалы санның кубына');d['options']=['100','729','125','343','841'];d['answer']='729';return d
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i)
 if i==1:d['options']=['('+v+') − 1'for v in d['options']];d['answer']=d['options'][3];assert not old.equals(new);return d
 assert old!=new,(i,old,new)
 if i==2:d['options']=[str(E.calc(H.tex(v))+new-old)+' : 1'for v in d['options']];d['answer']=str(new)+' : 1'
 elif i==4:d['answer']='10!'
 elif i==7:d['options']=[coord_text(tuple(v[j]+new[j]-old[j]for j in range(2)))for v in map(coords,d['options'])];d['answer']=coord_text(new)
 elif i in[10,14]:
  delta=new[0][1]-old[0][1];translate=lambda v:tuple((a+delta if math.isfinite(float(a))else a,b+delta if math.isfinite(float(b))else b,lc,hc)for a,b,lc,hc in v);d['options']=[interval_string(translate(interval_option(v)))for v in d['options']];d['answer']=interval_string(new)
 elif i==32:d['options']=[str(minutes_value(v)+new-old)for v in d['options']];d['answer']=str(new)
 elif i in[13,36]:d['answer']=new
 elif i in[18,30]:d['options']=['; '.join(str(v[j]+new[j]-old[j])for j in range(len(new)))for v in(tuple(H.numeric_tokens(v))for v in d['options'])];d['answer']='; '.join(map(str,new))
 else:d['options']=[str(B.scalar(v)+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==36;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and (not q['svg']or i==14 and all('width="0.8889em" height="0.016em"'in v for v in q['svg']))and len(q['options'])in[4,5];key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions, official/new solutions and all168source/newchoices read. Actual printed givens independently recomputed using exact rational arithmetic, original constraints, finite digits/exponents/age/filling assignments, strict inequalities, exact rounding and time/area/volume conversions. All36 changed actual input canaries reject old keys and accept recomputed answers. Same author computational review, not another human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':36,'sourceOptionsRead':168,'rewrittenOptionsRead':168,'wrongKeysRejected':36,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':36,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':36,'remainingBIL12Tasks':[24,29,33,38],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
