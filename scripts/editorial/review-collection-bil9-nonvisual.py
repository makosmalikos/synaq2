"""49 saved BIL9 sources and rewritten conditions/full solutions/all MCQs read.
Same root authored conditions and this separate exact computation; no separate
human or agent reviewer. Answers computed from printed inputs, not JS specs or
params. Source sequence/font/lift ambiguity documented rather than concealed.
"""
import ast,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-bil9-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('rational',ROOT/'scripts/editorial/review-grade5-expression-language.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
def one(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tex(s):
 s=str(s).replace('{,}',',').replace('$','').replace('−','-').replace('\\,','').replace('\\;','').replace('\\ ',' ')
 # Mixed numerals must be recognized before the fraction macro is replaced.
 s=re.sub(r'(\d+)\\(?:d?frac)\{(\d+)\}\{(\d+)\}',r'(\1+(\2/\3))',s)
 def braces(s,i):
  assert s[i]=='{';depth=1;j=i+1
  while depth:
   assert j<len(s)
   if s[j]=='{':depth+=1
   if s[j]=='}':depth-=1
   j+=1
  return s[i+1:j-1],j
 while re.search(r'\\(?:d?frac)\{',s):
  m=re.search(r'\\(?:d?frac)\{',s);a,j=braces(s,m.end()-1);b,k=braces(s,j);s=s[:m.start()]+'(('+tex(a)+')/('+tex(b)+'))'+s[k:]
 for a,b in [('\\cdot','*'),('\\times','*'),('×','*'),('÷','/'),(':','/'),('\\left',''),('\\right',''),('\\bigl',''),('\\bigr',''),('\\le','≤'),('\\infty','∞')]:s=s.replace(a,b)
 s=re.sub(r'(?<=\d),(?=\d)', '.',s)
 return s.strip()
def numeric_tokens(s):
 s=tex(s);s=re.sub(r'(?<=\d)\s+(?=\d{3}(?:\D|$))','',s)
 return[F(n)for n in re.findall(r'(?<![\d.])-?\d+(?:\.\d+)?',s)]
def arithmetic_text(s):
 s=tex(s);s=re.sub(r'(\d+\.\d+)',lambda m:'('+str(F(m[0]).numerator)+'/'+str(F(m[0]).denominator)+')',s)
 s=re.sub(r'(?<=[\dA-Za-z)])(?=[A-Za-z(])','*',s)
 return s.strip()
def expr(s,env=None):return H.expr(arithmetic_text(s),env)
def calc(s,env=None):return expr(s,env).constant()
def opts(r):return[o['text']if isinstance(o,dict)else o for o in r['options']]
def canon(s):return re.sub(r'\s+','',tex(s))
def math_parts(s,src):return re.findall(r'\$([^$]+)\$',s)if src else re.findall('«([^»]+)»',s)
def main_math(s,src):return one(math_parts(s,src))
def scalar(s):
 s=tex(s);m=re.match(r'\s*(-?\d+(?:\.\d+)?)(?:\s|$|[а-яА-Я²])',s)
 return F(m[1])if m else calc(s)
def pick(r,pred):
 answer=one(o for o in opts(r)if pred(o));assert canon(r['answer'])==canon(answer),(r['answer'],answer);return answer
def numeric(r,out):return pick(r,lambda o:scalar(o)==out)
def affine(e):
 q=expr(e);assert set(q.d)=={()}and set(q.n)<= {(),('x',)}
 return q.n.get(('x',),F(0))/q.d[()],q.n.get((),F(0))/q.d[()]
def linear_root(e):
 l,r=tex(e).split('=');a,b=affine('('+l+')-('+r+')');assert a;return-b/a

def tables(s,source):
 if source:
  return[[[x.strip()for x in row.split('&')]for row in block.split('\\\\')]for block in re.findall(r'\\begin\{array\}\{ccc\}(.*?)\\end\{array\}',s)]
 blocks=re.findall(r'(?:^|\n)((?:\|[^\n]+\|\n?){5})',s)
 return[[[x.strip()for x in line.split('|')[1:-1]]for line in b.splitlines()[2:]]for b in blocks]

def geometry(svg=None):
 p=ROOT/'frontend/public/figures/synaq-editions/collection-bil9-glyphs.svg';raw=p.read_bytes()if svg is None else svg
 root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 600 150';ns={'s':'http://www.w3.org/2000/svg'};glyphs={g.attrib['id']:g for g in root.findall('.//s:g[@id]',ns)};assert set(glyphs)==set('ATOSV')
 def points(e):return[tuple(F(n)for n in p.split(','))for p in e.attrib['points'].split()]
 def segments(g):
  out=set()
  for e in g.findall('s:polyline',ns):
   ps=points(e);out|={tuple(sorted((a,b)))for a,b in zip(ps,ps[1:])}
  return out
 def reflect(p,n,c):
  scale=2*(n[0]*p[0]+n[1]*p[1]-c)/(n[0]**2+n[1]**2)
  return(p[0]-scale*n[0],p[1]-scale*n[1])
 def symmetric(edges,n,c):return {tuple(sorted((reflect(a,n,c),reflect(b,n,c))))for a,b in edges}==edges
 axes={}
 for letter in'ATV':
  edges=segments(glyphs[letter]);assert edges and symmetric(edges,(F(1),F(0)),F(0));axes[letter]='vertical'
 ellipse=one(glyphs['O'].findall('s:ellipse',ns));assert {k:F(ellipse.attrib[k])for k in['cx','cy','rx','ry']}=={'cx':0,'cy':0,'rx':22,'ry':28};axes['O']='vertical and horizontal'
 edges=segments(glyphs['S']);degree={}
 for edge in edges:
  for p in edge:degree[p]=degree.get(p,0)+1
 endpoints=[p for p,n in degree.items()if n==1];assert len(endpoints)==2
 a,b=endpoints;dx,dy=b[0]-a[0],b[1]-a[1]
 # Any reflection of this open polyline either fixes both endpoints or swaps
 # them. Those give exactly the endpoint line and its perpendicular bisector.
 candidates=[((dy,-dx),dy*a[0]-dx*a[1]),((dx,dy),(dx*(a[0]+b[0])+dy*(a[1]+b[1]))/2)]
 assert all(not symmetric(edges,n,c)for n,c in candidates),'S acquired a reflection axis'
 axes['S']='none; both exhaustive endpoint-axis candidates rejected'
 return {'count':4,'actualGeometryAxes':axes,'sha256':hashlib.sha256(raw).hexdigest()}

def solve(r,i,source=False):
 s=r['statement'];n=numeric_tokens(s);proof={'printedNumbers':list(map(str,n))};out=None
 if i==1:
  seq=one(p for p in math_parts(s,source)if'?'in p);vs=[F(k)for k in re.findall(r'\d+',tex(seq))];assert len(vs)==5
  a,b,c,d,z=vs;ratio=b/a;assert c==b*ratio and d==c*ratio;out=d*ratio;assert out*ratio==z
 elif i==2:
  ts=tables(s,source);assert len(ts)==2 and all(len(t)==3 for t in ts);known=[sum(map(F,row))for t in ts for row in t if all(x not in{'a','b'}for x in row)];assert len(set(known))==1;total=one(set(known));unknowns={}
  for t in ts:
   for row in t:
    for v in['a','b']:
     if v in row:assert v not in unknowns;unknowns[v]=total-sum(F(x)for x in row if x!=v)
  assert set(unknowns)=={'a','b'};out=sum(unknowns.values());proof['filledUnknowns']={k:str(v)for k,v in unknowns.items()}
 elif i==3:
  p,part=n;out=part*100/p*2;proof['restoredWhole']=str(out/2)
 elif i in{5,6}:
  clocks=re.findall(r'(\d{1,2}):(\d{2})',s);speed=[F(k)for k in re.findall(r'(\d+)\s*км/сағ',s)];assert len(speed)==2
  if source:assert 'Жарты сағаттан'in s;start=F(60*int(clocks[0][0])+int(clocks[0][1]));delay=F(30)
  else:assert len(clocks)==2;times=[F(60*int(h)+int(m))for h,m in clocks];start=times[0];delay=times[1]-times[0]
  head=speed[0]*delay/60
  if i==5:out=head
  else:
   ahead=F(one(re.findall(r'(\d+)\s*км\s+(?:озып|алда)',s)));time=(head+ahead)/(speed[1]-speed[0]);clock=start+delay+60*time;assert clock.denominator==1;h,m=divmod(int(clock),60);expected=f'{h:02d}:{m:02d}';proof['answer']=pick(r,lambda o:o==expected);proof['positions']=[str(speed[0]*(time+delay/60)),str(speed[1]*time)];return proof
 elif i==7:
  if source:c,total=map(int,re.search(r'\\overline\{(\d)Y\}\s*=\s*(\d+)',s).groups())
  else:c,total=map(int,re.search(r'overline\((\d)Y\)\s*=\s*(\d+)',s).groups())
  candidates=[(x,y)for x in range(1,10)for y in range(x+1,10)if 10*x+y+10*c+y==total];x,y=one(candidates);out=F(9*(y-x));proof['allDigitSolutions']=candidates
 elif i==8:
  seq=one(p for p in math_parts(s,source)if len(numeric_tokens(p))==10);vs=numeric_tokens(seq)
  def ap(xs):return len(set(b-a for a,b in zip(xs,xs[1:])))==1
  candidates=[]
  for pos in range(10):
   parity=pos%2;fixed=[(k,vs[2*k+parity])for k in range(5)if 2*k+parity!=pos]
   (j,u),(k,v)=fixed[:2];step=(v-u)/(k-j);first=u-step*j
   if all(first+step*t==value for t,value in fixed)and ap(vs[1-parity::2]):
    replacement=first+step*(pos//2)
    if replacement!=vs[pos]:candidates.append((pos,replacement))
  if source:
   assert not candidates and vs[0]==11;answer=pick(r,lambda o:scalar(o)==vs[4]);return {**proof,'answer':answer,'finding':'Official solution checks18→16,22→20,etc but does not constrain first11. Two-full-AP interpretation has more than one error. Rewritten condition explicitly defines both APs and a single error; not treated as fully verified original rule.'}
  pos,replacement=one(candidates);out=vs[pos];proof['uniqueCorrection']={'index':pos+1,'replaceWith':str(replacement)}
 elif i==9:
  values=[scalar(o)for o in opts(r)];out=min(values);proof['allMCQValues']=list(map(str,values))
 elif i==10:
  count1,short,count2,left=n;out=(short+left)/(count1-count2);cash=count2*out+left;assert count1*out-cash==short;proof['cashLedger']=list(map(str,[cash,count1*out,count2*out]))
 elif i in{11,15}:
  equation=main_math(s,source);out=linear_root(equation);l,rr=tex(equation).split('=');assert calc(l,{'x':out})==calc(rr,{'x':out});proof['substitutionBothSides']=str(calc(l,{'x':out}))
 elif i==12:
  lo,e,hi=tex(main_math(s,source)).split('<');a,b=affine(e);assert a>0;lo=(calc(lo)-b)/a;hi=(calc(hi)-b)/a
  proof['answer']=pick(r,lambda o:canon(o)==f'({lo};{hi})');proof['openBoundaries']=list(map(str,[lo,hi]));return proof
 elif i==13:
  p,price=n if source else n[::-1];out=price*p/100;proof['paidPriceDistractor']=str(price-out);assert any(scalar(o)==price-out for o in opts(r))
 elif i==14:
  v1,v2,laps,extra=n;time=extra/(v2-v1);out=v1*time/laps;assert v2*time-v1*time==extra;proof['commonTime']=str(time)
 elif i==16:
  a,b,limit=n if source else[n[0],n[2],n[1]];assert source or n[1]==n[3];sets=[[d for d in range(1,int(limit))if int(x)%d==0]for x in[a,b]];out=F(sum(sets[0])-sum(sets[1]));proof['completeBoundedDivisorSets']=sets
 elif i==17:
  a,b,c,d=n;mag=(a/d-b)/c;assert mag>0 and b>0 and c>0
  proof['answer']=pick(r,lambda o:sorted(numeric_tokens(o))==[-mag,mag]);proof['allRealRoots']=list(map(str,[-mag,mag]));return proof
 elif i in{18,20,22,23,26,30,42}:
  e=main_math(s,source)if i!=30 else one(p for p in math_parts(s,source)if'='not in p)
  if i==20:
   values=numeric_tokens(e);assert len(values)==3;rounded=[math.floor(x+F(1,2))for x in values];out=F(rounded[0]+rounded[1]*rounded[2]);proof['roundedOperands']=rounded
  elif i==30:
   x=F(one(re.findall(r'x\s*=\s*(\d+)',s)));out=calc(e,{'x':x})
  else:out=calc(e)
  proof['printedExpression']=e
 elif i==19:
  distance,unused,minutes=n;out=(distance/2)/(minutes/60);assert out*minutes/60==distance/2
 elif i==21:
  target=calc(main_math(s,True)if source else one(re.findall(r'\(\d+/\d+\)',s)));distances=[abs(scalar(o)-target)for o in opts(r)];best=min(distances);proof['answer']=pick(r,lambda o:abs(scalar(o)-target)==best);proof['allExactDistances']=list(map(str,distances));return proof
 elif i==24:
  total,each,eggs=n;out=total/each*eggs;assert out.denominator==1
 elif i==25:
  increase,ratio=[n[0],F(9)]if source and 'тоғыз есе'in s else n;scale=math.isqrt(int(ratio));assert scale*scale==ratio;out=increase/(scale-1);assert(out+increase)**2==ratio*out**2
 elif i==27:
  blue,white,black,wanted=n;assert 0<wanted<=black;out=blue+white+wanted;assert out<=blue+white+black
  # Enumerate all count triples at N and N-1, not just a formula assertion.
  def distributions(total):return[(a,b,total-a-b)for a in range(int(blue)+1)for b in range(int(white)+1)if 0<=total-a-b<=black]
  assert all(c>=wanted for a,b,c in distributions(out))and any(c<wanted for a,b,c in distributions(out-1));proof['minimalityAndSufficiencyByAllCountTriples']=True
 elif i==28:
  total,p=n;out=total*p/100
 elif i==29:
  total,other=n;out=(total-other)/total
 elif i==31:
  edge=F(one(re.findall(r'(\d+)\s*см',s)));out=6*edge**2
 elif i==32:
  total=one(n);pairs=[(a,int(total)-a)for a in range(10,100)if 100<=total-a<=999];assert pairs;out=F(min(b-a for a,b in pairs));proof['minimizingPair']=one((a,b)for a,b in pairs if b-a==out)
 elif i==33:
  values=[calc(p)for p in tex(main_math(s,source)).split(';')]if not source else [calc(p)for p in tex(main_math(s,True)).split(',')]
  expected=sorted(values);assert len(expected)==3 and len(set(expected))==3;proof['answer']=pick(r,lambda o:[calc(p)for p in tex(o).split(';')]==expected);proof['orderedExactValues']=list(map(str,expected));return proof
 elif i==34:
  if source:
   block=one(re.findall(r'\\begin\{cases\}(.*?)\\end\{cases\}',s));es=block.split('\\\\')
  else:es=math_parts(s,False)
  assert len(es)==2;bounds=[]
  for e in es:
   l,op,rr=re.split(r'(>|≤)',tex(e));a,b=affine('('+l+')-('+rr+')');assert a>0;bounds.append((op,-b/a))
  assert bounds[0][0]=='>'and bounds[1][0]=='≤'and bounds[0][1]>=bounds[1][1],bounds
  proof['answer']=pick(r,lambda o:o=='Шешімі жоқ');proof['incompatibleBounds']=[(op,str(b))for op,b in bounds];return proof
 elif i==35:
  if source:seq=one(p for p in math_parts(s,True)if len(numeric_tokens(p))>5);cycle=numeric_tokens(seq)[:5];index=F(one(re.findall(r'(\d+)-шы',s)))
  else:cycle=numeric_tokens(one(math_parts(s,False)));index=F(one(re.findall(r'(\d+)-ші',s)))
  assert len(cycle)==5 and index.denominator==1;out=cycle[(int(index)-1)%len(cycle)]
 elif i==36:
  lower,upper=n;values=[k for k in range(math.floor(lower)-1,math.ceil(upper)+1)if lower<k<upper];out=F(len(values));proof['allStrictInteriorIntegers']=values
 elif i==37:
  if source:
   assert re.search(r'H\s+M\s+O\s+K\s+X',s);out=F(5);proof['sourceQualification']='Official answer assumes ideal block glyphs; exact font outlines absent. Rewritten glyph paths explicitly define the geometry.'
  else:
   assert 'кемінде бір симметрия осі'in s;proof.update(geometry());out=F(proof['count'])
 elif i==38:
  prefix=one(re.findall(r'(\d+)(?:\*|□)',s));candidates=[d for d in range(10)if int(prefix+str(d))%3==0 and int(prefix+str(d))%5==0];out=F(one(candidates));proof['all10DigitsChecked']=True
 elif i==39:
  seq=one(p for p in math_parts(s,source)if'?'in p);a,b,c,d=numeric_tokens(seq);assert b!=a;factor=(c-b)/(b-a);offset=b-factor*a;assert factor*c+offset==d;out=factor*d+offset;proof['affineRule']=[str(factor),str(offset)]
 elif i==40:
  raw,product,new=n;out=new*product/raw
 elif i==41:
  values=[calc(o)for o in opts(r)];maximum=max(values);proof['answer']=pick(r,lambda o:calc(o)==maximum);proof['allExactValues']=list(map(str,values));return proof
 elif i==43:
  initial,years,future=n;child=years*(future-1)/(initial-future);mother=child*initial;assert child>0 and mother+years==future*(child+years);proof['answer']=pick(r,lambda o:numeric_tokens(o)==[mother,child]);proof['currentAges']=list(map(str,[mother,child]));return proof
 elif i==44:
  parts=math_parts(s,source)if source else re.findall(r'\(\d+/\d+\)',s);assert len(parts)==3;out=F(86400)
  for p in parts:out*=calc(p)
 elif i==45:
  dividend,divisor=n[:2];q,rem=divmod(int(dividend),int(divisor));assert 0<=rem<divisor and divisor*q+rem==dividend;missing=[o for o in opts(r)if o.isdigit()and o not in str(q)];proof['answer']=pick(r,lambda o:o in missing);proof['division']={'quotient':q,'remainder':rem,'digits':sorted(set(str(q)))}
  steps=[];carry=0;digits=''
  for char in str(int(dividend)):
   carry=carry*10+int(char);digit,remain=divmod(carry,int(divisor));steps.append([carry,digit,remain]);digits+=str(digit);carry=remain
  assert int(digits)==q and carry==rem;proof['longDivisionSteps']=steps;return proof
 elif i==46:
  perimeter,deltaAB,deltaAC=n;x=(perimeter-deltaAB-deltaAC)/3;sides=[x,x+deltaAB,x+deltaAC];out=max(sides);assert min(sides)>0 and sum(sides)==perimeter and all(sum(sides)-a>a for a in sides);proof['sideLengths']=list(map(str,sides))
 elif i==47:
  total=one(n);assert re.search(r'кемінде бір (?:түйме қызыл|мысық қара)',s,re.I);assert 'кез келген екі'in s or 'Қай екі'in s
  valid=[red for red in range(1,int(total)+1)if red*(red-1)//2==0];out=F(one(valid));proof['allPossibleCountsChecked']=int(total)
 elif i==48:
  if source:people,dest1,dest2=n;assert people==2;start=1;proof['sourceQualification']='Official solution assumes constant speed fromfloor1 and ignores all stops/door overhead; those assumptions explicit in rewrite.'
  else:start,dest1,dest2=n;assert 'тұрақты'in s and 'аялдау есептелмейді'in s
  out=(dest2-start)/(dest1-start)
 elif i==49:
  boys,goodB,girlP,totalP=n;gp=girlP/100;tp=totalP/100;girls=(goodB-tp*boys)/(tp-gp);total=boys+girls;assert girls>=0 and girls.denominator==1 and(gp*girls).denominator==1 and total*tp==goodB+gp*girls;out=total;proof['cohortLedger']=list(map(str,[boys,girls,goodB,gp*girls,total*tp]))
 elif i==50:
  if source:p0,p1,mass=n
  else:mass,p0,p1=n
  initial=mass*1000;dry=initial*(100-p0)/100;final=dry*100/(100-p1);out=final-initial;assert dry==final*(100-p1)/100;proof['massLedger']=list(map(str,[initial,dry,final,out]))
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out);proof['exactResult']=str(out);return proof

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutate(r,i):
 b=copy.deepcopy(r);s=b['statement']
 if i in{9,41}:b['options'][b['options'].index(b['answer'])]='0,99'if i==9 else'0,3 − 9';return b
 if i==37:b['statement']=s.replace('кемінде бір симметрия осі','кемінде екі симметрия осі');return b
 if i==34:b['statement']=s.replace('≤ 7 + x','≤ 100 + x');return b
 if i==47:b['statement']=s.replace('Кемінде бір','Кемінде екі');return b
 replacements={1:('5; 10','6; 10'),2:('| 6 | 9 | 5 |','| 7 | 9 | 5 |'),3:('0,15','0,16'),5:('92 км','96 км'),6:('9 км алда','10 км алда'),7:('= 146','= 148'),8:('13; 20','12; 20'),10:('18000','21000'),11:('− 3»','− 4»'),12:('−4 <','−5 <'),13:('14%','15%'),14:('6 км артық','8 км артық'),15:('= 6 +','= 7 +'),16:('54 санының','55 санының'),17:('(60/','(80/'),18:('(27 ÷','(36 ÷'),19:('45 минутта','40 минутта'),20:('73,6','74,6'),21:('(3/4)','(1/2)'),22:('0,38','0,39'),23:('(4/7) +','(5/7) +'),24:('96 печенье','112 печенье'),25:('9 см','12 см'),26:('(5/12)','(7/12)'),27:('7 көк','8 көк'),28:('44%','48%'),29:('50-і','40-ы'),30:('x = 4','x = 6'),31:('7 см','8 см'),32:('512','514'),33:('(9/7); (3/5); (7/10)','(9/7); (4/5); (7/10)'),35:('943-ші','944-ші'),36:('−31,4','−32,4'),38:('73453','73454'),39:('2; 10','3; 10'),40:('45 кг','60 кг'),42:('2031 −','2032 −'),43:('9 есесіне','12 есесіне'),44:('(1/8)','(1/4)'),45:('536270381','38259'),46:('49 см','52 см'),48:('1-қабаттан','2-қабаттан'),49:('54 ұл','55 ұл'),50:('4,3 т','8,6 т')}
 a,c=replacements[i];assert a in s;b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==49;entries=[];evidence=[];canaries=0;equations=0
 for r in rows:
  i=int(one(r['sourceRefs'])['sourceId']);ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in source['questions']if q['number']==i);assert i!=4 and not q.get('images')and not q.get('svg')and len(q['options'])==5
  assert q['statement']and q['solution']and q['sourceAnswer'];q={**q,'answer':q['sourceAnswer']}
  assert canon(one(o['text']for o in q['options']if o['correct']))==canon(q['answer'])
  try:original=solve(q,i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  try:rewritten=solve(r,i)
  except Exception as e:raise AssertionError(('REWRITE',i))from e
  assert len(opts(r))==len(set(opts(r)))==5 and opts(r).count(r['answer'])==1;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]',r['statement']+r['solution'])
  # Every displayed new numerical equality is separately evaluated, including
  # fraction/mixed/nested operands. Symbolic chains are checked at solved x.
  for clause in re.split(r'[;\n]|(?<!\d)\.\s',r['solution']):
   for chunk in clause.split(':')[-1:]:
    if'='not in chunk:continue
    terms=chunk.split('=');values=[]
    for t in terms:
     t=t.strip().rstrip('.,');t=re.sub(r'\s+(?:км/сағ|км|сағат|теңге|см²|см|кг|мл|секунд)\s*$','',t)
     # First term may have prose prefix; only parse a suffix beginning after
     # punctuation or an explicit prose colon, never the tail of a formula.
     if not re.fullmatch(r'[0-9x\s.,()+*/−×÷-]+',t):values=[];break
     try:values.append(calc(t,{'x':F(rewritten['exactResult'])}if i in{11,15}else None))
     except(Exception):values=[];break
    if len(values)>=2:assert len(set(values))==1,('solution equality',i,chunk,values);equations+=len(values)-1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError,ZeroDivisionError):pass
  else:raise AssertionError(('wrong key accepted',i))
  bad=mutate(r,i)
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError,ZeroDivisionError):canaries+=1
  else:raise AssertionError(('semantic canary accepted',i))
  entry={'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'full source/new conditions/solutions/all5MCQs; exact Fraction rational arithmetic, exhaustive digit/divisor/count/interval enumeration, exact geometry, units and ledgers; same root, no separate human reviewer','notes':[json.dumps(rewritten,ensure_ascii=False)]}
  if i==37:entry['figureReview']={'status':'verified','sha256':geometry()['sha256'],'method':'Actual SVG polylines/ellipse reflected in exact Fraction coordinates; all4 positive glyph axes and both exhaustive endpoint-based possible S axes checked. Native343px visual inspected.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':original,'rewritten':rewritten})
 # Figure mutation must break geometry, not merely a data label.
 svg=(ROOT/'frontend/public/figures/synaq-editions/collection-bil9-glyphs.svg').read_bytes();assert b'-24,28 0,-28 24,28'in svg
 try:geometry(svg.replace(b'-24,28 0,-28 24,28',b'-24,28 1,-28 24,28'))
 except AssertionError:pass
 else:raise AssertionError('Asymmetric A figure accepted')
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;const counts={};function walk(ns){for(const n of ns){counts[n.type]=(counts[n.type]||0)+1;if(n.type==='fraction'){walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='table')for(const row of n.rows)for(const cell of row)walk(cell);else if(n.content)walk(n.content);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),counts}));"
 checks=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(checks['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert checks['counts']['table']==2 and checks['counts']['overline']>=3 and checks['counts']['mixed']>=6
 summary={'verified':49,'allSourceNewConditionsSolutionsMCQsRead':49,'wrongKeysRejected':49,'printedSemanticCanariesRejected':canaries,'newSolutionEqualitiesVerified':equations,'pythonJavaScriptHashesMatched':49,'nativeRendering':checks['counts'],'originalFigures':1,'geometryCanaryRejected':True,'separateHumanReviewer':False,'resolvedSourceAmbiguities':[8,37,45,48]}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
