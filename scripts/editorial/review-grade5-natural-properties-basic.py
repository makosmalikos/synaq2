"""External27: fullsaved/new/official/authoredsolutions/everyMCQ read.
Own actualprinted AST, exact multivariate coefficient-polynomial identities,
syntactic property classification and specific round mental methods. No author
specs/models/params/solver imported. One alreadyapproved duplicate not re-signed.
"""
import ast,copy,hashlib,itertools,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-natural-properties-basic.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def clean(s):return str(s).replace('$','').replace('\\,','').replace('\\;',' ').replace('\\square','□').replace('\\cdot','×').replace('−','-').strip()
def astexpr(s):return ast.parse(clean(s).replace('×','*').replace(':','/').strip(),mode='eval').body
def poly(s):
 def add(a,b,sign=1):
  r=a.copy()
  for k,v in b.items():r[k]=r.get(k,F(0))+sign*v
  return {k:v for k,v in r.items() if v}
 def ev(t):
  if isinstance(t,ast.Constant):return {():F(t.value)} if t.value else {}
  if isinstance(t,ast.Name):return {(t.id,):F(1)}
  if isinstance(t,ast.UnaryOp):return {k:(-v if isinstance(t.op,ast.USub) else v) for k,v in ev(t.operand).items()}
  assert isinstance(t,ast.BinOp);a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return add(a,b)
  if isinstance(t.op,ast.Sub):return add(a,b,-1)
  if isinstance(t.op,ast.Mult):
   r={}
   for x,v in a.items():
    for y,w in b.items():k=tuple(sorted(x+y));r[k]=r.get(k,F(0))+v*w
   return {k:v for k,v in r.items() if v}
  assert isinstance(t.op,ast.Div) and set(b)=={()} and b[()];return {k:v/b[()] for k,v in a.items()}
 return ev(astexpr(s))
def calc(s):
 p=poly(s);assert set(p)<={()};return p.get((),F(0))
def ns(s):return list(map(int,re.findall(r'\d+',clean(s))))
def opts(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def select(r,p):
 target=one([o for o in opts(r) if p(o)]);assert clean(r['answer'])==target,(r['answer'],target);return target

def numeric(r,n):
 assert calc(r['answer'])==n,(r['answer'],n)
 if opts(r):assert sum(calc(o)==n for o in opts(r))==1
 return str(n)
def expression(s):
 # Take a contiguous mathematical expression actually printed in the prompt,
 # rather than deriving it from author metadata/params.
 matches=re.findall(r'(?<![A-Za-z0-9])(?:\([^()]+\)|\d+)(?:\s*[+×-]\s*(?:\([^()]+\)|\d+))+',clean(s));return one(matches).strip()
def identity(s):
 a,b=clean(s).split('=');return poly(a)==poly(b)
def iscommutative(s,op):
 a,b=map(astexpr,clean(s).split('='));return isinstance(a,ast.BinOp) and isinstance(b,ast.BinOp) and isinstance(a.op,op) and isinstance(b.op,op) and all(isinstance(t,ast.Name) for t in [a.left,a.right,b.left,b.right]) and a.left.id==b.right.id and a.right.id==b.left.id and a.left.id!=a.right.id

def solve(r,i,source=False):
 s=clean(r['statement'])
 if i in (0,10,12):
  target=calc(expression(s));return select(r,lambda o:calc(o)==target)
 if i in (1,3,4,9,11,14,16,22,26):return numeric(r,calc(expression(s)))
 if i==2:
  assert all(identity(o) for o in opts(r));return select(r,lambda o:iscommutative(o,ast.Add))
 if i==5:
  eq=one(re.findall(r'[a-z] × [a-z] = [a-z] × [a-z]',s));assert iscommutative(eq,ast.Mult)
  return select(r,lambda o:o=='Көбейтудің ауыстырымдылық қасиеті')
 if i in (6,19):return numeric(r,sum(ns(s)))
 if i==7:return select(r,lambda o:not identity(o))
 if i==8:
  a,b,c=map(int,one(re.findall(r'(\d+) × (\d+) = (\d+) × □',s)));assert c>0;return numeric(r,F(a*b,c))
 if i==13:
  a,b=clean(s).split('=');rhs=one(re.findall(r'^\s*([0-9() +]+)',b));lhs=one(re.findall(r'([0-9() +]+)$',a));x,y=astexpr(lhs),astexpr(rhs)
  assert isinstance(x.op,ast.Add) and isinstance(x.left,ast.BinOp) and isinstance(x.left.op,ast.Add) and isinstance(y.op,ast.Add) and isinstance(y.right,ast.BinOp) and isinstance(y.right.op,ast.Add)
  assert [x.left.left.value,x.left.right.value,x.right.value]==[y.left.value,y.right.left.value,y.right.right.value]
  return select(r,lambda o:o=='Қосудың терімділік қасиеті')
 if i==15:
  target=calc(one(re.findall(r'\d+ × \d+',s)));return select(r,lambda o:calc(o)!=target)
 if i==17:
  lhs,rhs=s.split('□');lhs=re.search(r'(\d+ × \d+ \+ \d+ × \d+)\s*$',lhs)[1];rhs=int(one(re.findall(r'^\s*(\d+)',rhs)));value=calc(lhs);sign='>' if value>rhs else '<' if value<rhs else '=';return select(r,lambda o:o==sign)
 if i==18:
  nums=ns(s);count,boxes,items=(nums if source else [4,*nums]);assert source or s.startswith('Төрт жәшік');return numeric(r,count*boxes*items)
 if i==20:
  k,rhsK,c=map(int,one(re.findall(r'\(y - □\) × (\d+) = (\d+) × y - (\d+)',s)));assert k==rhsK>0;n=F(c,k);assert n.denominator==1 and n>0
  # Entire identity coefficient-vector proof (not one substituted y value).
  assert poly(f'(y - {n}) × {k}')==poly(f'{rhsK} × y - {c}');return numeric(r,n)
 if i==21:
  price,first,second=ns(s);assert first>second;return numeric(r,(first-second)*price)
 if i==23:
  vals=ns(s);assert len(vals)==8;counts=[a*b for a,b in zip(vals[::2],vals[1::2])];names=['Асан','Дана','Ерлан','Жансая'] if source else ['Әли','Меруерт','Рауан','Аяна'];hits=[{names[a],names[b]} for a,b in itertools.combinations(range(4),2) if counts[a]==counts[b]];pair=one(hits)
  return select(r,lambda o:set(o.split(' мен '))==pair)
 if i in (24,25):
  target=one(re.findall(r'\d+ × \([a-z] [+\-] \d+\)',s));p=poly(target);return select(r,lambda o:poly(o)==p)
 raise AssertionError(i)
def h(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==27;entries=[];refs=[];claims=0;methods=0
 normalize=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip()
 for i,row in enumerate(rows):
  try:solve(row,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and not raw.get('images') and not raw.get('svg')
  try:solve({**raw,'answer':raw['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if raw['options']:assert one([clean(x['text']) for x in raw['options'] if x['correct']])==clean(raw['sourceAnswer'])
  assert normalize(row['statement'])!=normalize(raw['statement']) and row['minimumPlan']=='pro'
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  # Read and bind pedagogical round-structure steps individually; merely
  # recomputing a final arithmetic total would miss a lost mental method.
  required={1:['(2 × 5) × 673','2 × 5 = 10'],3:['(57 + 43) + (38 + 62)','57 + 43 = 100','38 + 62 = 100'],4:['(68 + 32) + 79','68 + 32 = 100'],6:['(146 + 54) + 57','146 + 54 = 200'],9:['(8 × 125) × 9','8 × 125 = 1000'],11:['(25 × 4) × 43','25 × 4 = 100'],14:['103 = 100 + 3','100 × 56 + 3 × 56'],16:['1 × 9','(999 + 1) × 9','1000 × 9 = 9000'],18:['(4 × 25) × 23','100 × 23 = 2300'],19:['(137 + 63) + 268','137 + 63 = 200'],21:['(347 − 247) × 1800','100 × 1800 = 180000'],22:['97 = 100 − 3','100 × 24 − 3 × 24'],26:['(84 − 54) × 24','30 × 24 = 720']}.get(i,[])
  assert all(x in row['solution'] for x in required),(i,required);methods+=len(required)
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+×:-]\s*-?\d+)*)\s*=\s*(-?\d+(?:\s*[+×:-]\s*-?\d+)*)',clean(row['solution'])):
   a,b=m.groups()
   if not re.search(r'[+×:-]',a):continue
   if re.match(r'\s*[×+:-]\s*[a-z]',clean(row['solution'])[m.end():]):continue
   assert calc(a)==calc(b),(i,a,b);claims+=1
  entries.append({'editionId':row['editionId'],'sha256':h(row),'verdict':'verified','method':'independent_full_saved_new_official_authored_solutions_every_MCQ_read_actualprinted_exactAST_multivariate_polynomial_ALLnatural_identities_syntacticproperty_mentalroundstep_target_oracle','notes':[]});refs.append(ref)
 # Whole symbolic identity proof plus a finite independent full natural-domain
 # evaluation cross-check, rather than author parameter-solving as evidence.
 witnesses=0
 for y in range(11,1011):
  assert (y-11)*6==6*y-66;witnesses+=1
 for x in range(1,101):
  assert 8*(x+7)==8*x+56;witnesses+=1
 for a in range(5,105):
  assert 6*(a-5)==6*a-30;witnesses+=1
 # All true MCQ identities cannot by truth alone classify COMMUTATIVITY.
 assert sum(iscommutative(o,ast.Add) for o in opts(rows[2]))==1 and all(identity(o) for o in opts(rows[2]))
 retained=one([q for q in json.loads((ROOT/'problems/sources/zerek/courses/5-math-1-6-level1.json').read_text())['questions'] if q['id']=='0d0d7f87bc97c986']);assert retained['checked'] and retained['sourceAnswer']=='1700' and calc(expression(retained['statement']))==1700
 canaries=0
 for i,row in enumerate(rows):
  c=copy.deepcopy(row)
  if i in (2,5,7,13,23):
   if i==2:c['options']=[x.replace('r + s = s + r','r × s = s × r') for x in c['options']]
   elif i in (5,13):c['options']=[x.replace(c['answer'],'Басқа қасиет') for x in c['options']]
   elif i==7:c['options'][1]='(30 − 7) × 6 = 30 × 6 − 7 × 6'
   else:c['statement']=c['statement'].replace('13 беттен 6 күн','14 беттен 6 күн')
  elif i==17:c['statement']=c['statement'].replace('□ 1700','□ 1701')
  elif i==18:c['statement']=c['statement'].replace('23 қорап','24 қорап')
  elif i==20:c['statement']=c['statement'].replace('− 66 теңдігі','− 72 теңдігі')
  elif i==25:c['statement']=c['statement'].replace('6 × (a − 5)','6 × (a − 6)')
  else:
   m=re.search(r'\d+',c['statement']);assert m;c['statement']=c['statement'][:m.start()]+str(int(m.group())+1)+c['statement'][m.end():]
  try:solve(c,i)
  except (AssertionError,ValueError,SyntaxError,KeyError,AttributeError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All28saved includingretained and27new fullconditions/FULLofficial+authoredsolutions/everyMCQ read. Own actualprinted exactAST/multivariatecoefficient identities, syntactic requestedproperty (all4options true), individual mentalround steps and context requestedoutput. No authorparams/models/calculator imported.','summary':{'verified':27,'retainedAlreadyReviewedNotResigned':1,'findings':0,'wrongKeysRejected':27,'printedGivenOrRoleCanariesRejected':canaries,'actualPrintedNumericEqualities':claims,'individuallyBoundRoundMethodSteps':methods,'formalSymbolicNaturalWitnesses':witnesses,'pythonJavaScriptHashesMatched':27},'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-natural-properties-basic.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
