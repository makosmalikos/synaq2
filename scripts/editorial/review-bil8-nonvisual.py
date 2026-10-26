"""All43 saved/new full conditions, official/new solutions and all215 saved/new
choices read. Actual printed data control exact arithmetic and exhaustive finite
searches. Same author separate computational review, not another human reviewer.
Seven source diagram questions remain separate.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil8-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('j','scripts/editorial/review-bil7-nonvisual.py');J=importlib.util.module_from_spec(sp);sp.loader.exec_module(J);N=J.N;B=J.B;H=J.H;E=J.E;one=J.one

def fraction_parts(s,src):return [E.calc(v)for v in re.findall(r'\\dfrac\{\d+\}\{\d+\}',s)]if src else [E.calc(v)for v in re.findall(r'\(\d+/\d+\)',s)]
def clock_string(v):assert v.denominator==1;return f'{int(v)//60:02}:{int(v)%60:02}'
def operation(s,src,nested):
 parts=H.math_parts(s,src);eq=one(p for p in parts if'='in p);rhs=eq.split('=')[1];f=E.expr(rhs);asked=one(p for p in parts if'='not in p and re.search(r'\d',p) and ('◆'in p or'⊕'in p or'\\diamond'in p or'\\oplus'in p));args=H.numeric_tokens(asked);assert len(args)==(3 if nested else 2);out=f.value({'a':args[0],'b':args[1]});stages=[out]
 if nested:out=f.value({'a':out,'b':args[2]});stages.append(out)
 return out,{'actualOperationPolynomial':rhs,'actualOperands':list(map(str,args)),'allNestedEvaluationStages':list(map(str,stages))}
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i==1:
  vals=fraction_parts(s,src);assert len(vals)==5 and len(set(vals))==5 and min(vals)>0;out=min(vals);assert all(out.numerator*v.denominator<=v.numerator*out.denominator for v in vals);p['allFiveExactFractions']=list(map(str,vals))
 elif i==2:a,b,c=n;out=(a-c)/b;assert out.denominator==1 and out>0 and a-b*out==c
 elif i==3:heads,legs=n;four=(legs-2*heads)/2;out=heads-four;assert min(four,out)>0 and out.denominator==1 and 4*four+2*out==legs;p['fourLeggedAndBirdCount']=list(map(str,[four,out]))
 elif i==4:
  a,c=F(n[0]),F(n[-1]);portion=one(fraction_parts(s,src));contents=(a-c)/portion;out=(a-contents)*1000;assert out>0 and contents>0 and contents*(1-portion)+out/1000==c;p['actualContentAndContainerKg']=list(map(str,[contents,out/1000]))
 elif i==5:
  first,second,both=n;offset=first+second-both;realfirst=first-offset;out=second-offset;assert min(realfirst,out)>0 and realfirst+out+offset==both;p['actualOffsetAndTwoTrueMasses']=list(map(str,[offset,realfirst,out]))
 elif i==6:
  expr=one(parts);inside,op,limit=re.fullmatch(r'\|([^|]+)\|\s*([<])\s*(.*)',expr).groups();coef,c=E.affine(inside);a=one(coef);bound=E.calc(limit);assert a>0 and bound>0;lo=(-bound-c)/a;hi=(bound-c)/a;valid=list(range(math.floor(lo)+1,math.ceil(hi)));out=F(sum(valid));assert all(abs(E.expr(inside).value({'x':F(v)}))<bound for v in valid)and abs(E.expr(inside).value({'x':F(valid[0]-1)}))>=bound and abs(E.expr(inside).value({'x':F(valid[-1]+1)}))>=bound;p['allIntegerSolutions']=valid;p['strictBounds']=list(map(str,[lo,hi]))
 elif i==8:
  area=n[0];ratio=one(v for v in parts if'='in v).split('=')[1];a,b=H.numeric_tokens(ratio);out=area*b/(a+b);assert min(area,a,b)>0;p['commonHeightAreaPartition']=list(map(str,[area-out,out]))
 elif i==9:
  gap,year,mult=n;young=gap/(mult-1);old=young+gap;assert young>0 and old==mult*young;out=year-old;p['actualYoungerOlderTownAges']=list(map(str,[young,old]))
 elif i==11:
  eq=one(v for v in parts if'='in v);eq=re.sub(r'\\overline\{([^}]+)\}',r'overline(\1)',eq);pats=re.findall(r'overline\(([0-9A-Z]+)\)',eq);assert len(pats)==2;masked=re.sub(r'overline\([^)]+\)','',eq);multipliers=H.numeric_tokens(masked);assert len(multipliers)==2;valid=[]
  def val(pattern,b):return int(pattern.replace('B',str(b)))
  for b in range(10):
   if pats[1][0]=='B'and not b:continue
   if val(pats[0],b)*multipliers[0]==multipliers[1]*val(pats[1],b):valid.append(b)
  out=F(one(valid));p['allTenDigitAssignmentsWithLeadingZeroExclusion']=True;p['actualReversedPatternsAndMultipliers']=[pats,list(map(str,multipliers))]
 elif i==12:
  up,down=n;factor=(1+up/100)*(1-down/100);assert factor>1;out=(factor-1)*100;p['multiplicativeAreaFactor']=str(factor)
 elif i==13:
  first,second,rate1,rate2=n;out=(first-second)/(rate1-rate2);left1=first-rate1*out;left2=second-rate2*out;assert out>0 and out.denominator==1 and left1==left2>=0;p['bothRemainingStocks']=list(map(str,[left1,left2]))
 elif i==14:
  eq=one(v for v in parts if'='in v);number=int(E.calc(eq.split('=')[1]));factors=J.prime_factors(number);g=math.gcd(*factors.values());exponents=[b for b in range(1,g+1)if g%b==0];witness=[]
  for b in exponents:
   a=math.prod(prime**(power//b)for prime,power in factors.items());assert a**b==number;witness.append([a,b])
  assert all(any(power%b for power in factors.values())for b in range(1,number.bit_length()+1)if b not in exponents);out=F(sum(exponents));p['primeFactorPowers']=factors;p['allNaturalPowerRepresentations']=witness
 elif i in[15,28]:out,z=operation(s,src,i==15);p.update(z)
 elif i in[16,19,32,35,42]:out=N.exact_power_arithmetic(one(parts));p['exactOriginalExpressionEvaluated']=True
 elif i==18:
  clock=one(re.findall(r'\d{1,2}:\d{2}',s));start=N.clock(clock);tail=s.split(clock,1)[1];walk,hours,mins=H.numeric_tokens(tail);out=clock_string(start+2*walk+60*hours+mins);p['allJourneyMinutes']=str(2*walk+60*hours+mins)
 elif i==20:
  eq=one(v for v in parts if'='in v);asked=one(v for v in parts if'='not in v and re.search(r'\d',v));left,right=eq.split('=');coef,c=E.affine('('+left+')-('+right+')',('y',));y=-c/one(coef);assert E.expr(left).value({'y':y})==E.calc(right);out=E.expr(asked).value({'y':y});p['actualEquationRoot']=str(y)
 elif i==21:
  eq=one(v for v in parts if re.search(r'[TU]_1\s*=',v));initial=E.calc(eq.split('=')[1]);rule=one(v for v in parts if'='in v and v!=eq).split('=')[1];rhs=re.sub(r'[TU]_(?:\{n-1\}|\(n[−-]1\))','previous',rule);rhs=rhs.replace('n','n');index=int(H.numeric_tokens(parts[-1])[0]);assert 2<=index<=8;current=initial;rows=[str(current)]
  for j in range(2,index+1):current=N.exact_power_arithmetic(rhs.replace('previous',f'({current})').replace('n',str(j)));rows.append(str(current))
  out=current;p['allRecurrenceStages']=rows
 elif i==24:
  a,b=fraction_parts(s,src);out=1-a-b;assert 0<a<1 and 0<b<1 and out>0 and out+a+b==1
 elif i==25:
  expr=one(parts);fs=fraction_parts(expr,src);assert len(fs)==4;initial=H.numeric_tokens(expr)[0];a,b=fs[0].numerator,fs[0].denominator;end=fs[-1];assert b==a+1 and fs[1]==F(a+1,b+1)and fs[2]==F(a+2,b+2)and end.denominator==end.numerator+1;out=initial
  for j in range(a,end.numerator+1):out/=F(j,j+1)
  assert out==initial*end.denominator/a;p['allSuccessiveFractionDivisionsCount']=end.numerator-a+1
 elif i==27:monthly,annual=n;assert monthly*12>annual>0;out=12*monthly-annual
 elif i==29:
  if src:first,second=F(1,2),F(1,3);assert'жартысын'in s and'үштен бірін'in s
  else:first,second=fraction_parts(s,False)
  final=n[-1];out=final/(1-first)/(1-second);assert out*(1-first)*(1-second)==final and 0<first<1 and 0<second<1;p['bothRemainingFractions']=list(map(str,[1-first,1-second]))
 elif i==30:index=one(n);assert index.denominator==1 and index>0;out=2*index
 elif i==31:
  exact=N.exact_power_arithmetic(one(parts));out=F(math.floor(exact*100+F(1,2)),100);assert out-F(1,200)<=exact<out+F(1,200);p['exactValueBeforeHundredthRounding']=str(exact)
 elif i==33:
  equations=[v for v in parts if'='in v];assert len(equations)==2;triangles=[]
  for eq in equations:
   left,right=eq.split('=');coef,c=E.affine('('+left+')-('+right+')',('x','y'));a,b=coef;assert a>0 and b>0 and c<0;triangles.append((-c/a,-c/b))
  assert triangles[0][0]<triangles[1][0]and triangles[0][1]<triangles[1][1];areas=[a*b/2 for a,b in triangles];out=areas[1]-areas[0];p['actualAxisIntercepts']=[list(map(str,v))for v in triangles];p['bothTriangleAreas']=list(map(str,areas))
 elif i==34:
  clock=one(re.findall(r'\d{1,2}:\d{2}',s));start=N.clock(clock);others=s.replace(clock,'');numbers=H.numeric_tokens(others)
  if src:distance,train1,speed1,train2,speed2=numbers;assert train1==1 and train2==2
  else:distance,speed1,speed2=numbers
  minutes=60*distance/(speed1+speed2);out=clock_string(start+minutes);assert speed1*minutes/60+speed2*minutes/60==distance;p['actualTravelMinutes']=str(minutes)
 elif i==36:
  angles=[F(v)for v in re.findall(r'(\d+)\s*(?:°|\^\\circ)',s)];assert len(angles)==3 and all(0<v<180 for v in angles);out=360-sum(angles);assert 0<out<180;p['allFourAngles']=list(map(str,angles+[out]))
 elif i==38:
  total,cash,worked=n;daily=cash/(total-worked);out=worked*daily;assert min(total,cash,worked)>0 and total>worked and total*daily==cash+out;p['actualDayRateAndGiftPrice']=list(map(str,[daily,out]))
 elif i==39:
  vals=H.numeric_tokens(one(parts));lo,hi=int(vals[0]),int(vals[-1]);seq=list(range(lo,hi+1,2));assert len(seq)%2==0 and vals[:6]==seq[:6]and vals[-2:]==seq[-2:];out=F(sum((-1)**j*v for j,v in enumerate(seq)));assert out==-len(seq);p['allAlternatingOddTermsCount']=len(seq)
 elif i==40:
  volume=one(H.numeric_tokens(re.sub(r'³|²','',s)));a=math.isqrt(int(volume));a=next(v for v in range(1,a+2)if v**3==volume);out=F(6*a*a);p['actualWholeCubeEdge']=a;assert F(a)**3==volume
 elif i==41:whole,first,second=n;out=whole*first*second/10000
 elif i==43:
  a,b=fraction_parts(s,src);capacity=n[-1]if src else n[0];assert 0<b<a<1;out=capacity*(a-b);p['actualBeginningAndEndingFuel']=list(map(str,[capacity*a,capacity*b]))
 elif i==44:
  first,second=map(int,n);out=F(second);cases=[]
  for emptyfirst in range(first+1):
   fullsecond=emptyfirst
   if fullsecond<=second:cases.append(emptyfirst+(second-fullsecond))
  assert cases and set(cases)=={second};p['allAdmissibleFillingAssignmentsCount']=len(cases);p['allEmptyContainerTotals']=sorted(set(cases))
 elif i==45:length,tunnel,speed=n;assert min(n)>0;out=(length+tunnel)/speed
 elif i==46:
  kilometers,pace,total=n;assert kilometers==1 and pace>0;exact=total/pace;out=F(math.floor(exact));assert out<=exact<out+1;p['exactDistanceBeforeCountingWholeKilometers']=str(exact)
 elif i==47:old,new=n;assert old>new>0;out=(old-new)/old*100
 elif i==48:
  a,b,c,future=n;assert a>b>c>0 and future>a;elapsed=future-a;ages=[a+elapsed,b+elapsed,c+elapsed];out=sum(ages)/3;p['allFutureAges']=list(map(str,ages))
 elif i==49:out=B.relation(one(parts));p['strictSolutionOperatorAndBoundary']=[out[0],str(out[1])]
 elif i==50:
  total,product=n;pairs=[(a,total-a)for a in range(1,int(total))if a*(total-a)==product and a>total-a];old,young=one(pairs);out=old-young;assert old+young==total and old*young==product;p['uniqueOlderYoungerPair']=list(map(str,[old,young]))
 else:raise AssertionError(i)
 p['exactTarget']=str(out);return out,p

def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))==5 and r['answer']in opts
 if i in[18,34]:assert r['answer']==out;assert len(set(N.clock(v)for v in opts))==5;p['allFiveClockOptionsMinutes']=[str(N.clock(v))for v in opts]
 elif i==49:vals=list(map(B.relation,opts));assert len(set(vals))==5 and vals.count(out)==1 and B.relation(r['answer'])==out;p['allFiveStrictSolutionRelations']=[[a,str(b)]for a,b in vals]
 else:
  checked=r
  if i==36 and src:checked={**r,'options':[re.sub(r'\^\\circ','°',v)for v in opts],'answer':re.sub(r'\^\\circ','°',r['answer'])}
  p.update(B.checked_choices(checked,out))
 return out,p

CHANGES={1:[('(15/32)','(14/32)')],2:[('8888','8976')],3:[('64 жануар','65 жануар')],4:[('4.2 кг','4.5 кг')],5:[('2.2 кг','2.3 кг')],6:[('5 × x','4 × x')],8:[('84 см²','100 см²')],9:[('1980','1990')],11:[('× 28 = 82 ×','× 38 = 83 ×')],12:[('40%-ға','50%-ға')],13:[('210 моншақ','216 моншақ')],14:[('= 256','= 64')],15:[(') ◆ 6',') ◆ 7')],16:[('6^','7^')],18:[('10:15','11:15')],19:[('(1/4)','(5/16)')],20:[('= 15','= 19')],21:[('U_1 = 7','U_1 = 8')],24:[('(2/7)','(3/7)')],25:[('(15/16)','(16/17)')],27:[('ай сайын 900 теңге','ай сайын 1000 теңге')],28:[('7 ⊕ 5','8 ⊕ 5')],29:[('2400 теңгесі','3000 теңгесі')],30:[('42-мүшесін','43-мүшесін')],31:[('4 − 11','4 − 12')],32:[('(1/6)','(1/7)')],33:[('= 24','= 30')],34:[('900 км','1000 км')],35:[('809','810')],36:[('110°','111°')],38:[('300000','360000')],39:[('119 − 121','123 − 125')],40:[('2197','2744')],41:[('320 санының','400 санының')],42:[('18^','24^')],43:[('90 литрлік','120 литрлік')],44:[('12 стақан','14 стақан')],45:[('3150 м','3870 м')],46:[('60 минутта','68 минутта')],47:[('24000 теңгеге','22400 теңгеге')],48:[('36 жасқа','39 жасқа')],49:[('x − 4','x − 5')],50:[('31, көбейтіндісі 210','32, көбейтіндісі 231')]}
def changed(r,i):
 d=copy.deepcopy(r)
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i);assert old!=new,(i,old,new)
 if i==1:d['options']=[v.replace('(15/32)','(14/32)')for v in d['options']];d['answer']='(14/32)'
 elif i in[18,34]:
  delta=N.clock(new)-N.clock(old);d['options']=[clock_string(N.clock(v)+delta)for v in d['options']];d['answer']=new
 elif i==49:
  d['options']=[f'x {op} ({bound+new[1]-old[1]})'for op,bound in map(B.relation,d['options'])];d['answer']=d['options'][0]
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
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':43,'sourceOptionsRead':215,'rewrittenOptionsRead':215,'wrongKeysRejected':43,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':43,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':43,'remainingBIL8BitmapTasks':[7,10,17,22,23,26,37],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
