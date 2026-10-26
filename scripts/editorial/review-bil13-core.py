"""Full40 saved/new conditions, official/new solutions and185saved/new choices read.
Exact actual-input recomputation; same author separate computational checker,
not a separate human. Sources9/31 are offered-choice problems; source32 includes
its official youngest-boy interpretation, made explicit in the new condition.
Source37 positional reference replaced with stable arithmetic comparison.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil13-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-bil12-core.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);J=C.J;N=C.N;B=C.B;H=C.H;E=C.E;one=C.one;G=C.G;coords=C.coords;coord_text=C.coord_text
def plain(s):return E.plain(s).replace('\\ge','≥').replace('\\le','≤').replace('\\qquad','').replace('{*}','□')
def scalar(s):return B.scalar(plain(s).replace('\\%','%'))
def tup(s):return tuple(H.numeric_tokens(s))
def equation_rows(parts):
 rows=[]
 for eq in parts:
  l,r=eq.split('=');co,c=E.affine('('+l+')-('+r+')',('x','y'));rows.append([*co,-c])
 return rows

def chain(s):
 chunks=re.split(r'(≤|<)',plain(s));assert len(chunks)==5;lo,op1,mid,op2,hi=chunks;return E.calc(lo),mid,E.calc(hi),op1=='≤',op2=='≤'
def pointparts(parts):return [coords(re.sub(r'^[A-Z]','',v))for v in parts if';'in v]
def line(a,b):
 dx=b[0]-a[0];dy=b[1]-a[1];assert dx or dy;return[dy,-dx,dy*a[0]-dx*a[1]]
def assignments(s):
 matches=re.findall(r'([xy])\s*=\s*([^;,$]+)',plain(s));d={v:E.calc(x.strip())for v,x in matches};assert set(d)=={'x','y'};return d

def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);opts=B.options(r);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i in[1,3,25]:out=N.exact_power_arithmetic(one(parts));p['wholeOriginalExpressionExactRationalArithmetic']=str(out)
 elif i==2:
  block,divisor=map(int,n);digitSum=sum(map(int,str(block)));out=F(divisor//math.gcd(digitSum,divisor));assert all(int(str(block)*k)%divisor for k in range(1,int(out)));assert int(str(block)*int(out))%divisor==0;p['allShorterConcatenationsRejected']=int(out)-1
 elif i==4:
  digits=list(map(int,n[:5]))if src else list(map(int,H.numeric_tokens(one(parts))));assert len(digits)==len(set(digits))==5;valid=[v for v in itertools.permutations(digits)if v[0]!=0];out=F(len(valid));p['all120DigitPermutationsTested']=True;p['leadingZeroRejectedCount']=120-len(valid)
 elif i==5:total,wheat=n;assert total>wheat>0;barley=(total-wheat)/2;out=100*barley/total;p['actualBarleyHectares']=str(barley)
 elif i==6:water,sugar,salt,soda=n;assert min(n)>0;out=100*sugar/sum(n);p['actualTotalMixtureMass']=str(sum(n))
 elif i==7:out,z=E.equation(one(v for v in parts if'='in v));p.update(z);p['proportionOriginalDenominatorsChecked']=True
 elif i==8:
  expression,rhs=one(parts).split('=');inside=expression.strip().strip('|');co,c=E.affine(inside,('x',));a=one(co);k=E.calc(rhs);assert a and k>0;roots=[(sign*k-c)/a for sign in[-1,1]];assert len(set(roots))==2 and all(abs(E.expr(inside).value({'x':v}))==k for v in roots);out=sum(roots);p['bothOriginalAbsoluteEquationRoots']=list(map(str,roots))
 elif i==9:
  comparisons=[x.strip()for x in plain(one(parts)).split(';')]if src else list(map(plain,parts));assert len(comparisons)==3
  def valid(ds):
   for expr,d in zip(comparisons,ds):
    l,op,h=re.split(r'([<>])',expr.replace('□',str(d)));a,b=E.calc(l),E.calc(h)
    if not(a<b if op=='<'else a>b):return False
   return True
  validTuples=[v for v in itertools.product(range(10),repeat=3)if valid(v)];out=one(tup(v)for v in opts if tup(v)in validTuples);p['all1000DigitTriplesEnumerated']=True;p['allGloballyValidDigitTriples']=[list(v)for v in validTuples];p['uniquenessRequiredOnlyAmongOfferedOptions']=True
 elif i==10:
  eqs=E.system(s,True)if src else parts;bounds=[C.C.affine_relation(plain(v))for v in eqs];assert all(op=='≤'for op,b in bounds);out=((float('-inf'),min(b for op,b in bounds),False,True),);p['bothClosedUpperBounds']=list(map(str,[b for op,b in bounds]))
 elif i in[11,12]:out=E.expr(one(parts));p['completeFormalAffineIdentity']=True
 elif i==13:
  rows=equation_rows(parts);a,b=rows;det=a[0]*b[1]-a[1]*b[0]
  if det==0:assert a[0]*b[2]!=b[0]*a[2]or a[1]*b[2]!=b[1]*a[2];out=one(v for v in opts if'параллель'in v.lower());p['parallelDistinctNotCoincident']=True
  else:
   x,y=G.gaussian(rows,2);assert x and y;out='I'if x>0 and y>0 else'II'if x<0<y else'III'if x<0 and y<0 else'IV';p['actualUniqueIntersection']=list(map(str,[x,y]))
 elif i==14:
  expr=plain(one(parts));left,right=expr.split('≤');before,inside,after=left.split('|');factor=E.calc(before.rstrip().rstrip('*× '));offset=E.calc(after);co,c=E.affine(inside,('x',));assert factor>0 and one(co);limit=(E.calc(right)-offset)/factor;out='Шешімі жоқ'if limit<0 else'1'if limit==0 else'Шексіз көп';p['attainableMinimumLeftAndAbsoluteUpperLimit']=list(map(str,[offset,limit]))
 elif i==15:headstart,cycle,time=n;out=cycle-headstart/time;assert cycle>out>0 and(cycle-out)*time==headstart
 elif i==16:
  eqs=E.system(s,True)if src else parts;eqs=[re.sub(r'^\[2mm\]\s*','',v.strip()).rstrip(',. ')for v in eqs];rows=[]
  for eq in eqs:
   l,rr=eq.split('=');f=E.expr(l);v=f.value({'x':F(1),'y':F(1)});a=f.value({'x':F(1,2),'y':F(1)})-v;b=f.value({'x':F(1),'y':F(1,2)})-v;c=v-a-b;assert f.equals(E.expr(f'({a})/x+({b})/y+({c})'));rows.append([a,b,E.calc(rr)-c])
  uv=G.gaussian(rows,2);assert all(uv);out=tuple(1/v for v in uv);assert all(E.expr(eq.split('=')[0]).value(dict(zip(['x','y'],out)))==E.calc(eq.split('=')[1])for eq in eqs);p['reciprocalSubstitutionFormallyProvedOriginalSystemReplayed']=True;p['actualReciprocalRoots']=list(map(str,uv))
 elif i==17:
  l,rr=one(v for v in parts if'>'in v).split('>');f=E.expr(l);bound=E.calc(rr);out=one(v for v in opts if f.value(assignments(v))>bound);p['allOfferedLeftValues']=[str(f.value(assignments(v)))for v in opts]
 elif i==18:
  fractions=[E.calc(v)for v in parts];assert len(fractions)==3 and all(0<v<1 for v in fractions);balance=n[0];history=[]
  for f in fractions:balance*=1-f;history.append(str(balance))
  out=100*balance/n[0];p['allActualSuccessiveRemainingBalances']=history
 elif i==19:mean,known=n;out=2*mean-known
 elif i==20:
  hour,minute,first=n;together=hour+minute/60;assert 0<together<first;out=1/(1/together-1/first);assert 1/out+1/first==1/together;p['exactCombinedHours']=str(together)
 elif i==21:
  lo,mid,hi,lc,hc=chain(parts[0]);assert mid.strip()=='x'and lo<hi;f=E.expr(parts[1]);co,c=E.affine(parts[1],('x',));a=one(co);assert a<0;out=((f.value({'x':hi}),f.value({'x':lo}),hc,lc),);p['actualDomainEndpointFlags']=[lc,hc];p['decreasingMapSwapsBoundsAndFlags']=True
 elif i==22:
  if src:count=5;median,mean=n;assert'бес бағасы'in s
  else:count=int(one(re.findall(r'шкалада (\d+) бағасы',s)));mean=E.calc(one(re.findall(r'Орташа мәні ([^,]+)',s)));median=F(one(re.findall(r'медианасы (\d+)',s)))
  def valid(v):return len(v)==count and all(1<=x<=5 for x in v)and sum(v)/count==mean and sorted(v)[count//2]==median and v.count(F(5))>max(v.count(F(x))for x in range(1,5))
  patterns=[v for v in itertools.combinations_with_replacement(range(1,6),count)if valid(v)];out=one(tup(v)for v in opts if valid(tup(v)));p['completeAdmissibleGradeMultisets']=[list(v)for v in patterns];p['allGradeMultisetsEnumerated']=math.comb(count+4,4)
 elif i in[23,24]:
  pts=pointparts(parts)
  if i==23:assert len(pts)==4;rows=[line(*pts[:2]),line(*pts[2:])];out=G.gaussian(rows,2);assert all(row[0]*out[0]+row[1]*out[1]==row[2]for row in rows)
  else:
   assert len(pts)==3;a,b,k=pts;assert (b[0]-a[0])*(k[1]-a[1])!=(k[0]-a[0])*(b[1]-a[1]);assert a[0]*k[0]<0;ax,ay,rhs=line(a,k);assert ay;out=(F(0),rhs/ay);p['triangleNoncollinearAndYInterceptInsideSide']=True
  p['actualCoordinateResult']=list(map(str,out))
 elif i==26:
  ratio,delay,laterRatio,delay2,laterRatio2=n;child=delay*(laterRatio-1)/(ratio-laterRatio);mother=ratio*child;assert child>0 and child.denominator==mother.denominator==1 and mother+delay==laterRatio*(child+delay)and mother+delay2==laterRatio2*(child+delay2);out=(child,mother);p['allThreeAgeRatioConstraintsReplayed']=True
 elif i==27:
  if src:assert'Екі апельсин'in s;f,m,k=F(2),F(1),F(1)
  else:f,m,k=n
  fruit=(m+k)/(f-m);out=fruit+1;assert fruit>0 and f*fruit==m*out+k;p['fruitNormalizedSmallUnitAndMelon']=list(map(str,[fruit,F(1),out]))
 elif i==28:
  total,forward,back=n;first=total/2+forward-back;second=total-first;assert min(first-forward,second+forward-back)>=0 and first-forward+back==second+forward-back and first.denominator==second.denominator==1;out=(first,second);p['bothSequentialTransfersReplayed']=True
 elif i==29:
  light,heavy,factor=n;contents=(heavy-light)/(factor-1);out=light-contents;assert contents>0 and out>0 and out+factor*contents==heavy;p['actualLightHeavyContentsAndTare']=list(map(str,[contents,factor*contents,out]))
 elif i==30:
  total,factor=n;small=total/(factor+1);out=(factor*small,small);assert min(out)>0 and all(v.denominator==1 for v in out)and sum(out)==total
 elif i==31:
  shots,score,tens=n[:3];remaining=int(shots-tens);subtotal=score-10*tens;valid=[v for v in itertools.product(range(remaining+1),repeat=3)if sum(v)==remaining and sum(a*b for a,b in zip(v,[7,8,9]))==subtotal and(src or min(v)>0)];out=one(tup(v)for v in opts if tup(v)in valid);p['allAdmissibleHitCountTriples']=[list(v)for v in valid];p['sourceOnlyOfferedUniquenessNativeExplicitPositiveHits']=True
 elif i==32:
  ages=list(map(int,n[:4]));divisor=int(n[4]);valid=[v for v in itertools.permutations(ages)if v[1]!=min(ages)and v[3]>v[1]and(v[3]+v[2])%divisor==0];out=one(valid);p['all24AgePermutationsTested']=True;p['actualUniqueAgeOrder']=list(out);p['sourceYoungestKindergartenBoyInterpretationMadeExplicit']=True
 elif i==33:
  days=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];given=one(j for j,d in enumerate(days)if re.search(r'\b'+d.lower()+r'\b',s.lower()));offset=int(one(n));today=(given+offset-2)%7;out=days[(today-1)%7];assert(today+2-offset)%7==given;p['actualTodayAndDayAfterTomorrow']=[days[today],days[(today+2)%7]]
 elif i==34:
  low,high,digit=map(int,n);numbers=[str(v)for v in range(low,high+1)];out=F(sum(v.count(str(digit))for v in numbers));p['allNumbersAndOccurrences']=[[int(v),v.count(str(digit))]for v in numbers if str(digit)in v]
 elif i==35:
  names=list(dict.fromkeys(re.findall(r'\b[А-ЯӘҒҚҢӨҰҮҺІ][а-яәғқңөұүһі]+(?:ов|ев)\b',s)));assert len(names)==3
  husband,brother=one(re.findall(r'\b([А-ЯӘҒҚҢӨҰҮҺІ][а-яәғқңөұүһі]+(?:ов|ев)) ([А-ЯӘҒҚҢӨҰҮҺІ][а-яәғқңөұүһі]+(?:ов|ев))тың',s));valid=set()
  for cash,controller,manager in itertools.permutations(names):
   for heights in itertools.permutations(names):
    if cash!=brother and heights[0]==cash and heights.index(husband)>heights.index(controller):valid.add((cash,controller,manager))
  out=one(valid);p['allRoleHeightPermutationPairsTested']=36;p['uniqueCashierControllerManager']=list(out)
 elif i==36:
  if src:a,b,gap=F(3),F(1),one(n);assert'Үш'in s and'бір шардан'in s
  else:a,b,gap=n
  out=gap/(a-b);assert a>b>0 and out>0 and a*out-b*out==gap
 elif i==37:
  if src:values=[F(7),F(len('ШОКОЛАД')),F(7),one(H.numeric_tokens(opts[-1]))];p['sourceRainbowSevenColorSchoolConventionAndIndex37NotReused']=True
  else:values=[N.exact_power_arithmetic(v)for v in opts]
  desired=F(7)if src else one(n);out=one(v for v,x in zip(opts,values)if x!=desired);p['allActualChoiceValues']=list(map(str,values))
 elif i==38:
  phrase=one(re.findall(r'«([^»]+)»',s));letters=sorted({v.upper()for v in phrase if v.isalpha()});out=F(len(letters));p['allDistinctUnicodeLetters']=letters
 elif i==39:ahead,hour,minute,behind=n;assert 0<=minute<60;out=(hour*60+minute-ahead-behind)%1440;p['actualTrueAndSecondClockMinutes']=list(map(str,[(hour*60+minute-ahead)%1440,out]))
 elif i==40:
  add,factor,add2,factor2,result=n;assert factor and factor2;out=(result/factor2-add2)/factor-add;assert ((out+add)*factor+add2)*factor2==result;p['fullForwardOperationReplay']=True
 else:raise AssertionError(i)
 if i not in[11,12]:p['exactTarget']=str(out)
 return out,p

def option_value(v,i,src=False,r=None):
 if i in[11,12]:return E.expr(v)
 if i==10:return G.interval(v)
 if i==21:
  if src:
   lo,mid,hi,lc,hc=chain(v);assert E.expr(mid).equals(E.expr(H.math_parts(r['statement'],True)[1]));return((lo,hi,lc,hc),)
  return G.interval(v)
 if i in[9,22,26,28,30,31,32]:return tup(v)
 if i in[16,23,24]:return coords(v)if';'in v else None
 if i==35:
  d=dict((a.lower(),b)for a,b in re.findall(r'(кассир|бақылаушы|меңгеруші)\s*[—–-]\s*([А-ЯӘҒҚҢӨҰҮҺІ][а-яәғқңөұүһі]+(?:ов|ев))',v,re.I));assert len(d)==3;return tuple(d[k]for k in['кассир','бақылаушы','меңгеруші'])
 if i==39:h,m=tup(v);return h*60+m
 if i in[13,14,17,33,37]:return v
 return scalar(v)
def solve(r,i,src=False):
 out,p=target(r,i,src);opts=B.options(r);assert len(opts)==len(set(opts))in[4,5]and r['answer']in opts;values=[option_value(v,i,src,r)for v in opts]
 if i in[11,12]:assert all(not a.equals(b)for a,b in itertools.combinations(values,2));assert sum(v.equals(out)for v in values)==1 and option_value(r['answer'],i).equals(out)
 else:assert values.count(out)==1 and option_value(r['answer'],i,src,r)==out,(i,out,r['answer'],values)
 p['allActualOptionsCompared']=len(values);return out,p

CHANGES={1:[('−4.6','−5.6')],2:[('2024','2025')],3:[('(2 +','(3 +')],4:[('0; 2','1; 2')],5:[('120 гектарына','100 гектарына')],6:[('15 г қант','20 г қант')],7:[('= 7/1.8','= 9/1.8')],8:[('x + 4','x + 5')],9:[('77.24','77.14')],10:[('≥ 20','≥ 24')],11:[('+ 31','+ 32')],12:[('+ 7','+ 8')],13:[('− 4 × y','− 5 × y')],14:[('≤ −90','≤ −18')],15:[('15 км','18 км')],16:[('(7/12)','(5/12)'),('(17/12)','(13/12)')],17:[('> 35','> 55')],18:[('(2/3)','(1/2)')],19:[('9.6','10.1')],20:[('4 сағат 30','5 сағат 0')],21:[('x < 10','x < 12')],22:[('Орташа мәні 4,','Орташа мәні (27/7),')],23:[('P(0; 7)','P(0; 8)'),('Q(10; 2)','Q(10; 3)')],24:[('A(−3; 4)','A(−3; 5)'),('K(9; −4)','K(9; −3)')],25:[('1 − (1/11)','1 − (2/11)')],26:[('8 жылдан','12 жылдан'),('36 жылдан','54 жылдан')],27:[('1 қараөріктей','2 қараөріктей')],28:[('20 көгершін','24 көгершін')],29:[('400 г','450 г')],30:[('36 үшбұрыш','42 үшбұрыш')],31:[('96 ұпай','100 ұпай')],32:[('Балалар 16,','Балалар 17,')],33:[('сейсенбі','бейсенбі')],34:[('85-ке','95-ке')],35:[('Есенов Төлегеновтың','Қанатов Төлегеновтың')],36:[('21 теңгеге','30 теңгеге')],37:[],38:[('«МАТЕМАТИКА»','«МАТЕМАТИКА ЖӘНЕ ЛОГИКА»')],39:[('18 минутқа','23 минутқа')],40:[('1455 шықты','1575 шықты')]}
def changed(r,i):
 d=copy.deepcopy(r)
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 if i==9:d['options'][2]='1; 1; 8'
 if i==17:d['options'][3]='x = 14; y = −8'
 if i==22:d['options'][0]='1; 3; 4; 4; 5; 5; 5'
 if i==31:d['options'][3]='1; 2; 3'
 if i==37:d['options'][0]='16 ÷ 2';d['options'][3]='3 + 4'
 old,_=target(r,i);new,_=target(d,i)
 if i in[11,12]:assert not old.equals(new);d['options']=['('+v+') + 1'for v in d['options']];d['answer']=d['options'][r['options'].index(r['answer'])];return d
 assert old!=new,(i,old,new)
 if i in[9,13,14,17,22,31,33,35,37]:d['answer']=one(v for v in d['options']if option_value(v,i,False,d)==new)
 elif i==10:
  delta=new[0][1]-old[0][1];translate=lambda v:tuple((a+delta if math.isfinite(float(a))else a,b+delta if math.isfinite(float(b))else b,lc,hc)for a,b,lc,hc in v);d['options']=[C.interval_string(translate(G.interval(v)))for v in d['options']];d['answer']=C.interval_string(new)
 elif i==21:
  delta=new[0][0]-old[0][0];translate=lambda v:tuple((a+delta,b,lc,hc)for a,b,lc,hc in v);d['options']=[C.interval_string(translate(G.interval(v)))for v in d['options']];d['answer']=C.interval_string(new)
 elif i in[16,23,24]:
  def shift(v):return coord_text(tuple(x+new[j]-old[j]for j,x in enumerate(coords(v))))if';'in v else v
  d['options']=[shift(v)for v in d['options']];d['answer']=coord_text(new)
 elif i in[26,28,30,32]:d['options']=['; '.join(str(v[j]+new[j]-old[j])for j in range(len(new)))for v in map(tup,d['options'])];d['answer']='; '.join(map(str,new))
 elif i==39:d['options']=[str((option_value(v,i)+new-old)//60)+' сағ '+str((option_value(v,i)+new-old)%60)+' мин'for v in d['options']];d['answer']=one(v for v in d['options']if option_value(v,i)==new)
 else:d['options']=[str(scalar(v)+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==40;entries=[];evidence=[];equalities=0;sourceCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and(not q['svg']or i==16 and all('width="0.8889em" height="0.316em"'in v for v in q['svg']));key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);sourceCount+=len(q['options']);assert len(q['options'])==len(r['options'])
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full saved/new conditions official/new solutions and all185saved/newchoices read. Actual input exact rational arithmetic, formal identity proofs, original-constraint replay and exhaustive finite searches. All40 changed actual inputs reject old keys and accept recomputed answers. Same author separate computation, not another human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert sourceCount==185
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':40,'sourceOptionsRead':185,'rewrittenOptionsRead':185,'wrongKeysRejected':40,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':40,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':40,'remainingBIL13Tasks':[],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
