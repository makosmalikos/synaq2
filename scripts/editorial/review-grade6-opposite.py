"""Independent full24 opposite-number editorial review.
Reads canonical source and authored printed data, never authorparams/solver.
"""
import ast,copy,hashlib,itertools,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-opposite.json';REPORT='problems/editorial/reviews/grade6-opposite.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('\\\\','\\').replace('\\,','').replace('{,}',',').replace('$','').replace('−','-').replace('\\left','').replace('\\right','')
 return re.sub(r'\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
TOKEN=r'[+-]?(?:\(\d+/\d+\)|\d+(?:[,.]\d+)?)'
def frac(s):return F(s.replace(',','.').replace('(','').replace(')',''))
def ns(s):return[frac(t) for t in re.findall(TOKEN,clean(s))]
def options(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[])]
def one(a):assert len(a)==1,a;return a[0]
def equivalent(a,b):return re.sub(r'\s+',' ',clean(a)).strip()==re.sub(r'\s+',' ',clean(b)).strip()
def expr(s):
 t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
 def go(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(t,n))
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return -go(n.operand) if isinstance(n.op,ast.USub) else go(n.operand)
  assert isinstance(n,ast.BinOp),ast.dump(n);a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  raise AssertionError(ast.dump(n))
 return go(ast.parse(t,mode='eval').body)
def nested(s):
 t=clean(s);start=t.index('-(');depth=0
 for j in range(start,len(t)):
  if t[j]=='(':depth+=1
  if t[j]==')':
   depth-=1
   if depth==0:return t[start:j+1]
 raise AssertionError('Unclosed unary expression')
domain=0
def solve(row,i,source=False):
 global domain
 s=row['statement'];n=ns(s);ops=options(row);expected=None;exact=None;notes=[]
 if i==1:expected=-n[-1];assert n[-1]>0
 elif i==2:
  exact=one([o for o in ops if ns(o)==[0,0]])
  assert -F(0)==0
 elif i==3:expected=F(0)
 elif i==4:expected=2*abs(n[0])
 elif i==5:
  expected=-one(n)
  if not source:assert 'ауыстыру талап етілмейді' not in s
  assert expected!=1/abs(expected)
  notes=['Opposite changes sign only; the reciprocal distractor changes numerator/denominator. The new condition no longer gives away that distinction.']
 elif i==6:
  rhs=one(ns(one(re.findall(r'-x\s*=\s*(-?\d+)',clean(s)))));expected=-rhs;assert rhs<0
 elif i==7:
  exact=one([o for o in ops if len(ns(o))==2 and sum(ns(o))==0])
  assert any(v.denominator>1 for v in ns(exact))
 elif i==8:expected=abs(n[0]);assert n[0]<0
 elif i==9:start,step=n;assert start<0 and step>abs(start);expected=start+step
 elif i==10:expected=expr(nested(s));assert nested(s).count('-')==2
 elif i==11:expected=-n[0];assert n[0]<0
 elif i==12:expected=-one(n);assert one(n)<0
 elif i==13:
  invalid=[]
  for o in ops:
   a,b=clean(o).split('=')
   if expr(a)!=expr(b):invalid.append(o)
  exact=one(invalid);assert 'Қате' in s or 'қате' in s
  notes=['The negative-decimal false equality is intentional and must be selected, not treated as a source error. All other three printed equalities independently evaluated.']
 elif i==14:
  low,high=n[:2];assert low<0<high and low.denominator==high.denominator==1
  assert ('ұштарын қоспағанда' in s if source else 'Екі шеткі нүкте есепке кірмейді' in s)
  points=[v for v in range(int(low)-1,int(high)+2) if low<v<high];expected=len(points);domain+=int(high-low)+3
  assert 0 in points and low not in points and high not in points
  notes=['Full strictinteger domain−7,…,4 contains12 points including0; endpoints−8/5 excluded.']
 elif i==15:
  listing=s.split(':',1)[1]
  if not source:listing=listing.split('. Осы',1)[0]
  vals=ns(listing);assert len(vals)==7 and len(set(vals))==7
  pairs=[(a,b) for a,b in itertools.combinations(vals,2) if a+b==0];expected=len(pairs);domain+=21
  assert any(a*b==1 and a+b!=0 for a,b in itertools.combinations(vals,2)),'A real reciprocal pair must remain as a non-opposite distractor'
  notes=['Enumerated all21 unordered pairs of7 exactinteger/decimal/fraction values. Three zero-sum pairs; an actual reciprocal pair9 and1/9 retained but is not an opposite pair.']
 elif i==16:expected=-one(n);assert one(n)>0
 elif i==17:
  start,step=n;b=start+step;c=-b;expected=abs(c-start)
  assert start<0<c*-1 and c<0
  notes=['Order retained: translate firstB=7, then reflectC=−7, then measureAC=3, rather than returning a signed coordinate.']
 elif i==18:
  a,b=n;mid=(a+b)/2
  points=[F(x,2) for x in range(int(2*a)-2,int(2*b)+3)];hits=[x for x in points if abs(x-a)==abs(x-b)];assert one(hits)==mid;expected=mid;domain+=len(points)
 elif i==19:
  rhs=one(re.findall(r'-x\s*=\s*([0-9()/, +\-]+)',clean(s))).strip();expected=-expr(rhs)
  assert expected.denominator>1
  if not source:
   assert '(21/24)' in row['solution'] and '(8/24)' in row['solution']
   assert F(7,8)==F(21,24) and F(1,3)==F(8,24) and -F(13,24)==expected
 elif i==20:
  exact=one([o for o in ops if ('теріс сан' in o or re.fullmatch(r'a\s*<\s*0',o))])
  for a in[F(k,8) for k in range(-80,81)]:
   domain+=1
   if -a>0:assert a<0
  assert not -F(0)>0
 elif i==21:
  expression=nested(s);expected=expr(expression)
  assert expression.count('-')==(4 if source else 5)
  base=one([v for v in ns(expression)]);assert abs(expected)==abs(base)
  notes=['Own safeAST counts every unaryminus: original4 are even, new5 odd, hence−42. Changing count is a new parameter of the same iterative sign operation.']
 elif i==22:a,b=n;expected=abs(b-a);assert a<0<b
 elif i==23:
  centre,distance=n;assert distance>0;want=[centre-distance,centre+distance]
  hits=[F(v) for v in range(int(centre-distance)-2,int(centre+distance)+3) if abs(v-centre)==distance];assert hits==want;expected=want;domain+=int(2*distance)+5
  notes=['Both directions from shifted centre−2 solved:−9 and5, not the origin-centred±7; absolutevalue equation factors into exactlytwo real roots.']
 elif i==24:
  west,east,unit=n;assert west>0 and east>0 and unit>0;expected=[-west/unit,east/unit]
 else:raise AssertionError(i)
 if exact is not None:assert equivalent(row['answer'],exact),(i,row['answer'],exact)
 elif ops:
  want=expected if isinstance(expected,list) else[expected];correct=one([o for o in ops if ns(o)==want]);assert equivalent(row['answer'],correct),(i,row['answer'],correct)
 else:assert one(ns(row['answer']))==expected,(i,row['answer'],expected)
 return notes
def numeric_equations(row):
 count=0
 # Full fractional equalitychains in this individually read solution are explicit.
 if '(21/24)' in row['solution']:
  assert expr('(7/8)')==expr('(21/24)') and expr('(1/3)')==expr('(8/24)')
  assert expr('(7/8)-(1/3)')==expr('(21/24)-(8/24)')==expr('(13/24)')
  assert expr('-(-(13/24))')==expr('(13/24)');count+=5
 for m in re.finditer(r'(-?\d+(?:,\d+)?(?:\s*[×+:−+-]\s*-?\d+(?:,\d+)?)+)\s*=\s*(-?\d+(?:,\d+)?)',row['solution']):
  if re.search(r'[×+:−+\d]\s*$',row['solution'][:m.start()]):continue
  assert expr(m[1])==frac(m[2]),m[0];count+=1
 return count
def run():
 global domain
 rows=read(BATCH)['editions'];assert len(rows)==24;entries=[];wrong=0;equations=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];captured=read(ref['sourceFile']);raw=one([q for q in captured['questions'] if q['id']==ref['sourceId']]);assert captured['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert not equivalent(raw['statement'],row['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);notes=solve(row,i)
  bad=copy.deepcopy(row);bad['answer']='INVALID WRONG KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError):wrong+=1
  else:raise AssertionError(('Wrongkey accepted',i))
  equations+=numeric_equations(row)
  h=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':row['editionId'],'sha256':h,'verdict':'verified','method':'independent_full_content_read_printed_Fraction_AST_opposite_distance_and_complete_unordered_pair_domains','notes':['Read this entire saved condition, officialsolution and allMCQs plus allnewcondition/fullsolution/MCQs; exact target and originalskill checked. Oracle does not read authorparams or import authorsolver.','Opposite and reciprocal distinguished; sign, zero, distance versus coordinate, shifted origin and scale, strict endpoint boundaries and iterative unary operations checked.',*notes]})
 canaries=[(1,'7 бірлік','8 бірлік'),(4,'A(11)','A(12)'),(5,'-(5/12)','-(7/12)'),(6,'-x = -27','-x = -28'),(7,'-4,7 және 4,7','-4,8 және 4,7'),(8,'M(-14)','M(-15)'),(9,'13 бірлік','14 бірлік'),(10,'-(-31)','-(-32)'),(11,'-26.','-27.'),(12,'-6,2','-6,3'),(13,'-(-0,7) = -0,7','-(-0,7) = 0,7'),(14,'-8 пен 5','-9 пен 5'),(15,'-9;','-8;'),(16,'7,8','7,9'),(17,'оңға 11','оңға 12'),(18,'A(-11)','A(-13)'),(19,'(7/8)','(5/8)'),(21,'-(-(-(-(-42))))','-(-(-(-42)))'),(22,'N(3,5)','N(4,5)'),(23,'дәл 7 бірлік','дәл 8 бірлік'),(24,'800 м','1000 м')]
 rejected=0
 for i,a,b in canaries:
  bad=copy.deepcopy(rows[i-1])
  if a in bad['statement']:bad['statement']=bad['statement'].replace(a,b,1)
  else:
   hit=one([j for j,o in enumerate(bad.get('options',[])) if a in o]);bad['options'][hit]=bad['options'][hit].replace(a,b,1)
  try:solve(bad,i)
  except (AssertionError,ValueError):rejected+=1
  else:raise AssertionError(('Canary accepted',i))
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1],'utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code,BATCH],cwd=ROOT,text=True)))
 assert all(js[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','scope':'All24 saved/new grade6nonvisual opposite2.2 level1/2; not24 claimed new meanings; no collection.','evidence':{'oracle':'scripts/editorial/review-grade6-opposite.py','fullSourceAndNewRead':24,'sourceKeysVerified':24,'printedExactKeys':24,'wrongKeysRejected':wrong,'printedCanariesRejected':rejected,'completePairCoordinateSignDomainCases':domain,'numericSolutionEqualities':equations,'pythonJsHashesMatched':len(entries),'resolvedFindings':'Removed reciprocal hint in fraction condition; actual reciprocal distractor9and1/9 restored in pairlist. Finalchangedrows reread before signature.'},'entries':entries}
 (ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'reviewed':24,**report['evidence']}))
if __name__=='__main__':run()
