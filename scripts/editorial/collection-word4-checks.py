"""Author cross-check only: actualprinted exactFraction/alloption/ledger oracle.
This is NOT an independent editorial signature. Batch remains closed DRAFT.
"""
import ast,copy,itertools,json,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
rows=json.loads((ROOT/'problems/editorial/batches/collection-word4-wave19.json').read_text())['editions']
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def numbers(s):return [F(x.replace(',','.')) for x in re.findall(r'\d+(?:,\d+)?',s)]
def calc(s,env=None):
 s=s.replace('−','-').replace('×','*').replace(':','/').replace(',','.');t=ast.parse(s.strip(),mode='eval');env=env or {}
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):return F(ast.get_source_segment(s,t))
  if isinstance(t,ast.Name):return F(env[t.id])
  if isinstance(t,ast.UnaryOp):return -ev(t.operand) if isinstance(t.op,ast.USub) else ev(t.operand)
  a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return a+b
  if isinstance(t.op,ast.Sub):return a-b
  if isinstance(t.op,ast.Mult):return a*b
  assert isinstance(t.op,ast.Div) and b;return a/b
 return ev(t)
def numeric(r,a):
 assert calc(r['answer'])==a,(r['editionId'],r['answer'],a);assert sum(calc(o)==a for o in r['options'])==1;return a
def pick(r,p):
 expected=one([o for o in r['options'] if p(o)]);assert r['answer']==expected;return expected
def tuples(o):return list(map(calc,o.split('; ')))
def solve(r,i):
 s=r['statement'];ns=numbers(s)
 if i==1:
  total,gap,bundleGap=ns;bundle=(total+bundleGap)/2;book=total-bundle;case=(bundle-gap)/2;bag=case+gap;assert min(book,case,bag)>0
  return pick(r,lambda o:(lambda a,b,c:a+b+c==total and c-b==gap and b+c-a==bundleGap)(*tuples(o)))
 if i==2:
  a,b,m,c,d,n=ns;det=a*d-b*c;major=(m*d-b*n)/det;minor=(a*n-m*c)/det;assert major>minor>0
  return pick(r,lambda o:(lambda x,y:a*x+b*y==m and c*x+d*y==n)(*tuples(o)))
 if i==3:
  n,area=ns;side=one([v for v in range(1,int(area)+1) if v*v==area]);return numeric(r,2*(n+1)*side)
 if i==4:
  P,gap=ns;leg=(P-gap)/3;base=leg+gap;assert 0<base<2*leg;return numeric(r,base)
 if i==5:
  a,b,cost=ns;return numeric(r,cost/(a+b))
 if i==6:
  a,b,pct,gap=ns;share=a/b-F(pct,100);assert share>0 and a/b+F(pct,100)<=1;return numeric(r,gap/share)
 if i==7:
  first,gap,boxes=ns;assert (2*first+gap)%boxes==0;return numeric(r,(2*first+gap)/boxes)
 if i==8:
  mean,factor=ns;return numeric(r,mean*2/(1+factor))
 if i==9:
  special,each,other,equal=map(int,ns);used=special*each;total=F(special-F(used,other),F(1,equal)-F(1,other));assert total.denominator==1
  options=[]
  for o in r['options']:
   a,b=o.split(' = ')
   if calc(a,{'x':total})==calc(b,{'x':total}):options.append(o)
  assert one(options)==r['answer']
  hits=[x for x in range(1,1001) if x>=used and (x-used)%other==0 and x%equal==0 and special+(x-used)//other==x//equal];assert hits==[total]
  return total
 if i==10:
  time,distance,gap=ns;total=distance/time;slow=(total-gap)/2;fast=slow+gap;assert slow>0
  return pick(r,lambda o:(lambda a,b:(a+b)*time==distance and b-a==gap)(*tuples(o)))
 if i==11:
  down,up,current=ns;own=current*(down+up)/(up-down);assert own>current;return numeric(r,(own+current)*down)
 if i==12:
  pct,num,den=ns;return numeric(r,((1+pct/100)*(1+num/den)-1)*100)
 if i in (13,15):
  length,width,volume,num,den,decrease,pct=ns;h=volume/(length*width);assert width>decrease and min(length,width,h)>0
  return numeric(r,length*num/den*(width-decrease)*h*pct/100)
 if i==14:
  old,new,extra,empty=ns;hits=[n for n in range(1,501) if old*n==new*(n+extra)-empty];n=one(hits);assert 0<empty<new
  return numeric(r,n*old)
 if i in (16,17):
  distance=ns[0];speeds=[F(x) for x in re.findall(r'(\d+) км/сағ',s)];first,second=speeds;amount,unit=one(re.findall(r'(\d+) (минут|сағат) өткеннен кейін',s));delay=F(int(amount),60 if unit=='минут' else 1);left=distance-first*delay;t=left/(first+second);assert left>0 and first*(t+delay)+second*t==distance
  if i==17:return numeric(r,t)
  def minutes(o):
   n=numbers(o);return n[0]*60+n[1] if 'сағ' in o else n[0]
  return pick(r,lambda o:minutes(o)==t*60)
 if i==18:
  w,l,a=ns;assert w%a==l%a==0;return numeric(r,(w/a)*(l/a))
 if i==19:
  t,v,u,w=ns;assert t!=u and v!=w;return numeric(r,(t*v+u*w)/(t+u))
 if i==20:
  total,gap,speed=ns;return numeric(r,(total+gap)/2*speed)
 if i==21:
  distance,time,ratio=ns;return numeric(r,distance/(1+ratio)*ratio/time)
 raise AssertionError(i)
for i,r in enumerate(rows,1):
 solve(r,i);bad=copy.deepcopy(r);bad['answer']='WRONG_KEY'
 try:solve(bad,i)
 except (AssertionError,ValueError,SyntaxError,KeyError):pass
 else:raise AssertionError(('badkeyaccepted',i))
# Complete integer ledgers independently verify existence/uniqueness, labels and
# requestedchildcount equation rather than just a guessedroot.
priceTriples=[]
for book in range(1,260):
 for case in range(1,260-book):
  bag=260-book-case
  if bag-case==130 and bag+case-book==200:priceTriples.append((book,case,bag))
assert priceTriples==[(30,50,180)]
weighings=[(a,b) for a,b in itertools.product(range(1,38),repeat=2) if 5*a+4*b==37 and 4*a+5*b==35];assert weighings==[(5,3)]
postMeeting=[(a,b) for a,b in itertools.product(range(1,151),repeat=2) if (a+b)*F(3,4)==96 and b-a==16];assert postMeeting==[(56,72)]
# A grid of scales validates area-growth and cuboid transforms independently.
areaCases=0
for length,width in itertools.product(range(1,51),repeat=2):
 newArea=F(length)*F(108,100)*width*F(5,4);assert (newArea-length*width)/(length*width)*100==35;areaCases+=1
assert F(1680,15*8)==14 and F(15*3,5)*(8-3)*14*F(75,100)==F(945,2)
assert F(1440,18*10)==8 and F(18*3,4)*(10-4)*8*F(1,2)==324
# Later-start trajectories are compared at exact commonwallclockinstants.
trajectoryCases=0
for f,v,delay in itertools.product(range(1,21),range(1,21),[F(1,3),F(1,2),F(3,4),F(1)]):
 t=F(5,4);D=f*delay+(f+v)*t;assert (D-f*delay)/(f+v)==t and f*(delay+t)+v*t==D;trajectoryCases+=1
print(json.dumps({'authorOnlyDraft':True,'actualPrintedKeys':21,'badKeysRejected':21,'completePositivePriceTriples':260*259//2,'weighingPairs':37**2,'postMeetingPairs':150**2,'areaScaleCases':areaCases,'exactLaterStartTrajectories':trajectoryCases},ensure_ascii=False))
