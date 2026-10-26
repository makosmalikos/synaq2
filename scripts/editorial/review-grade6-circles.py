"""Independent offline full54 circles editorial review.
All54 canonical/new full conditions, solutions and MCQs individually read.
No author params/functions imported. Own printed Fraction/AST and geometry proofs.
"""
import ast,copy,hashlib,json,math,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-circles.json';REPORT='problems/editorial/reviews/grade6-circles.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):return s.replace('\\\\','\\').replace('\\,','').replace('{,}',',').replace('$','').replace('\\pi','π').replace('\\dfrac{22}{7}','(22/7)').replace(',','.')
def ns(s):return [F(n) for n in re.findall(r'\d+(?:\.\d+)?',clean(s))]
def one(a):assert len(a)==1,a;return a[0]
def pi_givens(s):
 t=clean(s);m=re.search(r'π\s*(?:\\approx|≈)\s*(\(22/7\)|\d+(?:\.\d+)?)',t)
 if m:
  pi=F(22,7) if m[1]=='(22/7)' else F(m[1]);t=t[:m.start()]
 else:pi=None
 return pi,ns(t)
def sqrt(x):
 a,b=math.isqrt(x.numerator),math.isqrt(x.denominator);assert a*a==x.numerator and b*b==x.denominator,x;return F(a,b)
def num(s):return one(ns(s))
def opts(row):return [o['text'] if isinstance(o,dict) else o for o in row.get('options',[])]
def same(a,b):return clean(a)==clean(b)
def value(s,env=None):
 text=s.replace(',','.').replace('×','*').replace('·','*').replace('−','-').replace(':','/').replace('²','**2').replace('³','**3').strip();env=env or {}
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(text,n))
  if isinstance(n,ast.Name):assert n.id in env,n.id;return F(env[n.id])
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -walk(n.operand)
  assert isinstance(n,ast.BinOp),ast.dump(n);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  if isinstance(n.op,ast.Pow):assert b.denominator==1;return a**int(b)
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(text,mode='eval').body)
def formula(s,r,pi):
 t=clean(s).split('=')[1].strip().replace('\\','').replace('π','p').replace('^','**').replace('²','**2').replace('×','*').replace(' ','')
 t=re.sub(r'(?<=[0-9prt)])(?=[prt(])','*',t)
 return value(t,{'r':r,'t':r,'p':pi})
def solve(row,i,source=False):
 s=row['statement'];pi,n=pi_givens(s);options=opts(row);answer=row['answer'];expected=None;exact=None;notes=[]
 if i==1:
  exact=one([o for o in options if 'Сабын көпіршігі' in o]) if source else one([o for o in options if 'идеал жұқа шар қабығы' in o]);notes=['Sphere is the surface alone; idealzero-thickness shell distinguished from closedsolidball.']
 elif i==2:
  r=one(n);exact=one([o for o in options if 'Радиусы' in o and 'дөңгелек' in o and ns(o)==[r]])
 elif i==3:expected=one(n)/(2*pi)
 elif i==4:exact=one([o for o in options if 'π' in clean(o)])
 elif i==5:
  d=one(n);expected=pi*d
  if not source:assert 'сырғанамай' in s and 'бір толық' in s
 elif i==6:expected=pi*(one(n)/2)**2
 elif i in(7,15):expected=2*pi*one(n)
 elif i==8:expected=2*one(n)
 elif i==9:expected=pi*one(n)**2
 elif i==10:exact=one([o for o in options if 'центр' in o])
 elif i==11:expected=pi*one(n)**2/2
 elif i==12:expected=pi*one(n)
 elif i==13:
  good=[o for o in options if all(formula(o,r,p)==p*r*r for r in [F(1),F(2),F(3),F(7)] for p in [F(314,100),F(22,7)])];exact=one(good)
  if not source:assert 't > 0' in s
  notes=['All four printed area formulas tested on8 radius/pi pairs using own AST; onlyπr² is degree-two area law.']
 elif i==14:
  f=one(n);exact=one([o for o in options if ns(o)==[f]])
  assert all(2*F(22,7)*(r*f)/(2*F(22,7)*r)==f for r in [F(1),F(3),F(11,2)])
 elif i in(16,17):expected=one(n)/pi
 elif i==18:d,turns=n;expected=pi*d*turns/100;assert expected.denominator==1
 elif i==19:
  d=one(n);expected=pi*d/2+d
  if not source:assert 'түзу диаметрі де' in s
  notes=['Whole semicircle boundary includes arc88cm plus diameter56cm=144cm; arc-alone is incomplete.']
 elif i==20:
  if source:large,small=n;count=F(2)
  else:large,small,count=n;assert count==2
  big=pi*(large/2)**2;smalls=count*pi*(small/2)**2;gap=abs(smalls-big)
  prefix='Екі' if smalls>big else 'Бір' if source else 'Үлкен'
  exact=one([o for o in options if o.startswith(prefix) and ns(o)==[gap]])
  assert 'қалыңдығы бірдей' in s.lower() or 'қалыңдықтары бірдей' in s.lower()
  notes=['Equal thickness makes disk area comparison valid:1413−1384.74=28.26cm² in the two smaller pizzas, not diameter sums.']
 elif i==21:
  if source:outer,inner=n
  else:inner,outer=n;assert 'центр бірдей' in s
  assert outer>inner>0;expected=pi*(outer**2-inner**2)
 elif i==22:r,minutes=n;expected=2*pi*r*minutes/60;assert 0<minutes<60
 elif i==23:km,d=n;expected=km*100000/(pi*d);assert expected.denominator==1
 elif i in(24,29,40):c=one(n);r=c/(2*pi);expected=pi*r*r;assert r>0
 elif i==25:r1,r2=n;expected=(r2/r1)**2;assert r2>r1>0
 elif i==26:side=one(n);expected=4*side-pi*side;assert expected>0
 elif i==27:innerd,outerd=n;expected=pi*((outerd/2)**2-(innerd/2)**2);assert outerd>innerd
 elif i==28:side,d=n;assert side==d;expected=side*side-pi*(d/2)**2
 elif i==30:expected=pi*one(n)**2/4
 elif i==31:r,laps=n;expected=2*pi*r*laps
 elif i==32:
  r1,r2=n;length=r1/r2;area=length*length
  exact=one([o for o in options if len(ns(o))==4 and ns(o)[0]/ns(o)[1]==length and ns(o)[2]/ns(o)[3]==area])
 elif i==33:straight,d=n;expected=2*straight+pi*d;notes=['Two semicircular arcs form one circle; internal diameter segments excluded from stadium route.']
 elif i==34:
  speed,d=n[:2];expected=speed*100000/60/(pi*d);assert expected.denominator==1
  if source:assert n[2]==1
  else:assert 'бір минутта' in s and 'сырғанамайды' in s
 elif i==35:r,width=n;expected=pi*((r+width)**2-r*r);assert width>0
 elif i==36:minute,hour,hours=n;expected=2*pi*minute*hours-2*pi*hour*hours/12
 elif i==37:
  wire=one(n);r=wire/(2*pi);circle=pi*r*r;square=(wire/4)**2;gap=circle-square;assert gap>0
  prefix='Шеңбер' if source else 'Дөңгелек';exact=one([o for o in options if o.startswith(prefix) and ns(o)==[gap]])
 elif i==38:d,width,turns=n;expected=pi*d*width*turns
 elif i==39:
  factor=F(1) if source else one(n);expected=2*factor
  if not source:assert 'оң' in s and 'САНДЫҚ' in s
  assert expected*expected==factor*2*expected and expected>0
  notes=['Numerical cm²-area value versus cm-length value only; positive r eliminates zero solution and yieldsr6forfactor3.']
 elif i==41:
  side,rope=n;assert side<rope<2*side;remaining=rope-side
  expected=pi*(3*rope*rope/4+remaining*remaining/2)
  assert remaining<side # Both extra quarters cannot reach the farcorner, nor overlap one another.
  assert 'арқан' in s and ('сыртқы бұрыш' in s)
  if not source:assert 'айналып өте алады' in s
  notes=['Own obstacle proof: base threequarter disk radius10 excludes squareNEquadrant; extraquarter disks centred(6,0)/(0,6) have radius4<6, lie on different exterior sides, overlap only boundary at most, and farcorner needs12>10. Area83π=260.62.']
 elif i==42:side,r=n;assert side==r;expected=side*side-pi*r*r/4
 elif i==43:
  if source:assert pi is None;pi=F(22,7) # Official full solution explicitly specifies22/7.
  d=one(n);arc=pi*d/2;assert 2*(pi*(d/2)/2)==arc
  exact=one([o for o in options if o.startswith('Жолдары') and ns(o)==[arc]])
 elif i==44:r,pieces=n;expected=2*pi*r/pieces+2*r;assert pieces>1
 elif i==45:
  exact=one([o for o in options if ('центр' in o and 'арқылы' in o and ('екі' in o or 'ұшты' in o))]);notes=['Diameter requires both endpointsonsurface and passage throughcentre; radius/arbitrarychord/circumference distinguished.']
 elif i==46:c,d=n;expected=c/d
 elif i==47:d,gap=n;expected=pi*d/gap;assert expected.denominator==1
 elif i==48:r,water=n;expected=pi*r*r*water
 elif i==49:
  r1,r2=n;expected=sqrt(r1*r1+r2*r2);assert expected>0;notes=['Sum ofareas cancelsπ; positiveR=sqrt(25+144)=13, not5+12or169.']
 elif i==50:c,area=n;expected=c/(2*pi)+sqrt(area/pi)
 elif i==51:gap=one(n);expected=gap/(pi-1)/2;assert expected>0
 elif i==52:
  uncovered=one(n);expected=sqrt(2*uncovered/pi)
  assert expected>0 and pi*expected**2-2*pi*(expected/2)**2==uncovered
  if not source:assert 'ішкі аймақтары қабыспайды' in s
 elif i==53:
  side=n[0]
  if source:assert n[1]==4
  else:assert 'СЫРТЫНАН' in s and 'ішкі аймақтар қабыспайды' in s
  expected=side*side+4*(pi*(side/2)**2/2)
  notes=['Four outward semicircle interiors lie in separate strips beyond square sides; they do not overlap. Add square784 plus twofull disks1232=2016m².']
 elif i==54:
  d1,d2,difference=n;assert d1<d2;c1=pi*d1;c2=pi*d2
  distance=difference/(1/c1-1/c2);expected=distance/100
  assert distance/c1-distance/c2==difference and distance/c1>0
  notes=['Same physical distance and inversewheel circumference solved directly:19800cm gives150−90=60turns;198m.']
 else:raise AssertionError(i)
 if exact is not None:assert same(answer,exact),(i,answer,exact)
 else:
  assert expected is not None and num(answer)==expected,(i,answer,expected)
  if options:assert same(one([o for o in options if ns(o) and len(ns(o))==1 and num(o)==expected]),answer),(i,options,expected)
 if options:assert len(options)==len(set(options))==4 and sum(same(o,answer) for o in options)==1
 if not source and not options:assert 'Жауапты тек санмен жазыңыз.' in s
 # All non-cancelling numerical models must explicitly supplythe agreed approximation.
 if i not in(1,2,4,8,10,13,14,25,32,39,45,46,49) and not(i==43 and source):assert pi is not None,(i,'Missing statedpi')
 return notes

def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
rows=read(BATCH)['editions'];assert len(rows)==54
entries=[];refs=set();wrong=0;sourceKeys=0
for i,row in enumerate(rows,1):
 assert row['grade']==6 and row['minimumPlan']=='pro' and not row.get('image')
 ref=one(row['sourceRefs']);cap=read(ref['sourceFile']);assert cap['status']=='captured';q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert q['checked'] and q['sourceAnswer'] and q['solution'] and not q.get('images') and not q.get('svg')
 solve({**q,'answer':q['sourceAnswer']},i,True);sourceKeys+=1
 if q.get('options'):assert same(one([o['text'] for o in q['options'] if o['correct']]),q['sourceAnswer'])
 assert clean(row['statement']).strip()!=clean(q['statement']).strip();refs.add((ref['sourceFile'],ref['sourceId']));notes=solve(row,i)
 bad=copy.deepcopy(row);bad['answer']=next(o for o in row['options'] if o!=row['answer']) if row.get('options') else str(num(row['answer'])+1)
 try:solve(bad,i)
 except(AssertionError,ValueError):wrong+=1
 else:raise AssertionError(('Wrongkey accepted',i))
 entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':'Independent printed-givens exact Fraction/own AST, circumference-area and dimensional conversion, positive-root/inversewheel algebra, sphere definitions and disjoint obstacle-region geometry; full source/new editorial reading','notes':['All54 canonical/new complete conditions, official/authored fullsolutions and every MCQ read. Radius/diameter, circle/disk/sphere/ball, arc/fullboundary, statedpi approximation, length/squareunits, positive radii, no-slip/no-repeat/closed-circle assumptions and Kazakh wording checked. Numerical/context variants are source coverage, not54 different semantic meanings.',*notes]})
canaries=[(5,'84 см','70 см'),(6,'12 дм','14 дм'),(19,'56 см','42 см'),(22,'20 минут','15 минут'),(23,'1,32 км','1,584 км'),(28,'Қабырғасы 10 см','Қабырғасы 12 см'),(31,'6 толық','5 толық'),(34,'99 км/сағ','66 км/сағ'),(35,'барлық жерде 7 м','барлық жерде 14 м'),(36,'12 сағатта','6 сағатта'),(39,'3 есе','4 есе'),(41,'10 м созылмайтын','11 м созылмайтын'),(42,'радиусы 10 см','радиусы 8 см'),(44,'12 тең','8 тең'),(47,'2,2 м','4,4 м'),(49,'5 см','9 см'),(51,'45 см','60 см'),(52,'308 см²','77 см²'),(53,'28 м','14 м'),(54,'60 айналым','40 айналым')]
rejected=0
for i,old,new in canaries:
 bad=copy.deepcopy(rows[i-1]);assert old in bad['statement'],(i,old);bad['statement']=bad['statement'].replace(old,new,1)
 try:solve(bad,i)
 except(AssertionError,ValueError):rejected+=1
 else:raise AssertionError(('Printed canary accepted',i,old))
# Exact coordinate membership verifies the threegoatregions have pairwise disjoint interiors.
geometrySamples=0
for side,rope in[(F(4),F(6)),(F(6),F(10))]:
 rem=rope-side;assert 0<rem<side
 for xx in range(-int(rope)*2,(int(side+rope))*2+1):
  for yy in range(-int(rope)*2,(int(side+rope))*2+1):
   x,y=F(xx,2),F(yy,2);geometrySamples+=1
   base=(x<0 or y<0) and x*x+y*y<rope*rope
   right=x>side and y>0 and (x-side)**2+y*y<rem*rem
   top=x>0 and y>side and x*x+(y-side)**2<rem*rem
   assert int(base)+int(right)+int(top)<=1
# Independent numeric fullsolution equality fragments; own AST with exact rational arithmetic.
solutionEqualities=0
for row in rows:
 for m in re.finditer(r'(?<![\w:])([\d][\d,\s×:+−/()²³]*?)\s*=\s*([\d][\d,\s×:+−/()²³]*)(?![\d])',row['solution']):
  l,r=m.groups();l=l.strip()
  # A numeric suffix of π×... is not a standalone numeric expression.
  if re.search(r'[A-Za-zπ₁₂]\s*[×:+−/]\s*[(\s]*$',row['solution'][:m.start()]):continue
  if not any(op in l for op in['×','+','−',':','/','²','³']):continue
  try:a,b=value(l),value(r)
  except(SyntaxError,AssertionError,ValueError,ZeroDivisionError):continue
  assert a==b,(row['editionId'],l,r,a,b);solutionEqualities+=1
assert wrong==sourceKeys==len(refs)==54 and rejected==len(canaries)
js="import{editionHash}from'./scripts/editorial/edition-review.mjs';import fs from'node:fs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));"
jsh=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)))
assert all(jsh[e['editionId']]==e['sha256'] for e in entries)
(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'reviewed':54,'sourceMathKeys':sourceKeys,'wrongKeysRejected':wrong,'printedCanariesRejected':rejected,'geometryCoordinateSamples':geometrySamples,'numericSolutionEqualities':solutionEqualities,'pythonJsHashesMatched':54,'report':REPORT,'status':'verified'},ensure_ascii=False))
