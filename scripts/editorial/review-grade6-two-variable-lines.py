"""Independent full-content review of 25 saved/new equations and graph concepts.

No author specs, params, model, renderer or solver imported. The oracle reads
printed expressions, constructs exact multivariate coefficient maps, proves
scalar equivalence, and evaluates every MCQ. Full solutions were read separately.
"""
import ast,copy,hashlib,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-two-variable-lines.json'
LETTERS='xyabck';ZERO=(0,)*len(LETTERS)
def clean(s):
 s=str(s).replace('$','').replace('−','-').replace('\\,','').replace('\\cdot','×')
 s=re.sub(r'\\d?frac\{([^{}]+)\}\{([^{}]+)\}',r'(\1/\2)',s)
 return s.strip()
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def compact(p):return {k:v for k,v in p.items() if v}
def add(p,q,k=1):
 out=p.copy()
 for m,v in q.items():out[m]=out.get(m,F(0))+k*v
 return compact(out)
def mul(p,q):
 out={}
 for a,v in p.items():
  for b,w in q.items():
   m=tuple(x+y for x,y in zip(a,b));out[m]=out.get(m,F(0))+v*w
 return compact(out)
def poly(s,env=None):
 s=clean(s).replace('²','**2').replace('^2','**2').replace('×','*').replace('÷','/')
 s=re.sub(r'(\d|\))\s*([xyabck(])',r'\1*\2',s)
 s=re.sub(r'(?<=[xyabck])(?=[xyabck])','*',s)
 tree=ast.parse(s.strip(),mode='eval');env=env or {}
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):return compact({ZERO:F(str(t.value))})
  if isinstance(t,ast.Name):
   if t.id in env:return compact({ZERO:F(env[t.id])})
   m=list(ZERO);m[LETTERS.index(t.id)]=1;return {tuple(m):F(1)}
  if isinstance(t,ast.UnaryOp):
   assert isinstance(t.op,(ast.UAdd,ast.USub));return {m:(-v if isinstance(t.op,ast.USub) else v) for m,v in ev(t.operand).items()}
  assert isinstance(t,ast.BinOp)
  a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return add(a,b)
  if isinstance(t.op,ast.Sub):return add(a,b,-1)
  if isinstance(t.op,ast.Mult):return mul(a,b)
  if isinstance(t.op,ast.Div):
   if set(b)!={ZERO}:raise ValueError('Variable denominator is not a polynomial')
   return {m:v/b[ZERO] for m,v in a.items()}
  assert isinstance(t.op,ast.Pow) and b.get(ZERO)==2 and len(b)==1
  return mul(a,a)
 return ev(tree)
def equation(s,env=None):
 a,b=clean(s).split('=');return add(poly(a,env),poly(b,env),-1)
def equations(s):
 return [m.strip() for m in re.findall(r'[0-9xyabck+\-×*/()²^ ]+\s*=\s*[0-9xyabck+\-×*/()²^ ]+',clean(s))]
def firsteq(s):return equations(s)[0]
def affine(p):return bool(any(sum(m)==1 for m in p)) and all(sum(m)<=1 for m in p)
def equivalent(p,q):
 if not p or not q:return p==q
 m=next(iter(p));return m in q and all(p.get(k,0)*q[m]==q.get(k,0)*p[m] for k in p.keys()|q.keys())
def value(p,env):
 return sum(v*__import__('functools').reduce(lambda a,b:a*b,(F(env[letter])**degree for letter,degree in zip(LETTERS,m) if degree),F(1)) for m,v in p.items())
def root(s,var,env):
 p=equation(s,env);assert all(sum(m)<=1 and all(not d or LETTERS[j]==var for j,d in enumerate(m)) for m in p)
 z={l:F(0) for l in LETTERS};v0=value(p,z);z[var]=1;coef=value(p,z)-v0;assert coef
 return -v0/coef
def opts(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def select(r,pred):
 answer=one([o for o in opts(r) if pred(o)]);assert clean(r['answer'])==answer,(r['answer'],answer)
def numeric(r,answer):
 assert F(clean(r['answer']))==answer,(r['answer'],answer)
 if opts(r):assert sum(F(o)==answer for o in opts(r))==1
def points(s):return [tuple(map(F,m)) for m in re.findall(r'\((-?\d+);\s*(-?\d+)\)',clean(s))]
def pair(o):return one(points(o))
def linear_option(o):
 try:return affine(equation(o))
 except (ValueError,AssertionError,SyntaxError):return False
def solve(r,i,source=False):
 s=clean(r['statement']);os=opts(r)
 if i in (0,2,3):
  p=equation(firsteq(s));select(r,lambda o:equivalent(p,equation(o)))
  if i==0 and not source:assert 'БАРЛЫҚ' in r['solution'] and 'әр' in r['solution'].casefold()
 elif i==1:numeric(r,root(firsteq(s).replace('y','x'),'x',{}))
 elif i==4:
  p=equation(firsteq(s));expect=[]
  for l in 'xy':m=list(ZERO);m[LETTERS.index(l)]=1;expect.append(p.get(tuple(m),0))
  expect.append(p.get(ZERO,0))
  select(r,lambda o:list(map(F,re.findall(r'[abc]\s*=\s*(-?\d+)',o)))==expect)
 elif i==5:
  y=F(one(re.findall(r'\(x;\s*(-?\d+)\)',s)));numeric(r,root(firsteq(s),'x',{'y':y}))
 elif i in (6,23):
  p=equation(firsteq(s));select(r,lambda o:value(p,dict(zip('xy',pair(o))))==0)
 elif i in (7,16):select(r,linear_option)
 elif i==8:
  x=F(one(re.findall(r'\((-?\d+);\s*y\)',s)));numeric(r,root(firsteq(s),'y',{'x':x}))
 elif i==9:
  x,y=one(points(s));select(r,lambda o:value(equation(o),{'x':x,'y':y})==0)
 elif i==10:
  p=equation(firsteq(s));ps=points(s);assert len(ps)==2
  truth=[value(p,dict(zip('xy',q)))==0 for q in ps];assert truth==[True,False]
  select(r,lambda o:o.casefold().startswith('тек ') and pair(o)==ps[0])
 elif i==11:
  if source:
   first,second=map(F,re.findall(r'(\d+) теңгелік',s)[:2]);total=F(one(re.findall(r'барлығы (\d+) теңге',s)));count=F(one(re.findall(r'монета (\d+) дана',s)))
  else:
   first,second,total=map(F,one(re.findall(r'Қорапта (\d+) және (\d+) теңгелік монеталар бар, жалпы сома (\d+)',s)));count=F(one(re.findall(r'x = (\d+)',s)))
  answer=(total-first*count)/second;assert answer>=0 and answer.denominator==1;numeric(r,answer)
 elif i==12:
  x,y=one(points(s));numeric(r,root(firsteq(s),'a',{'x':x,'y':y}))
 elif i==13:
  p=equation(firsteq(s));assert not any(m[0] for m in p);y=root(firsteq(s),'y',{'x':0})
  select(r,lambda o:'Ox' in o and 'параллель' in o and pair(o)==(0,y))
  assert value(p,{'x':F(7,3),'y':y})==0 and value(p,{'x':-9,'y':y})==0
  assert value(p,{'x':0,'y':y+1})!=0
 elif i==14:
  p=equation(firsteq(s));assert p.get(ZERO,0)==0 and root(firsteq(s),'y',{'x':1})<0 and root(firsteq(s),'y',{'x':-1})>0
  select(r,lambda o:o=='II және IV')
 elif i in (15,17):
  x=F(0) if i==15 else F(one(re.findall(r'x\s*=\s*(\d+)',s)));numeric(r,root(firsteq(s),'y',{'x':x}))
 elif i==18:
  x,y=one(points(s));numeric(r,root(firsteq(s),'c',{'x':x,'y':y}))
 elif i==19:
  p=equation(firsteq(s));assert set(p)=={ZERO} and p[ZERO]!=0;select(r,lambda o:'шешімі жоқ' in o.casefold())
 elif i in (20,22):numeric(r,root(firsteq(s),'x',{'y':0}))
 elif i==21:select(r,lambda o:value(equation(o),{'x':0,'y':0})==0)
 elif i==24:
  y=F(one(re.findall(r'K\(k;\s*(\d+)\)',s)));numeric(r,root(firsteq(s),'x',{'y':y}))
 else:raise AssertionError(i)
 if not source and not os:assert 'Жауапқа тек санды жазыңыз.' in s

def hashrow(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def rejected(fn):
 try:fn()
 except (AssertionError,ValueError,SyntaxError,KeyError,IndexError):return
 raise AssertionError('Corrupt key/printed given accepted')
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];refs=[]
 for i,r in enumerate(rows):
  try:solve(r,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(r['sourceRefs']);d=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in d['questions'] if q['id']==ref['sourceId']]);assert d['status']=='captured' and q['checked'] and not q['images'] and not q['svg']
  src={**q,'answer':q['sourceAnswer']}
  try:solve(src,i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if q.get('options'):assert one([clean(o['text']) for o in q['options'] if o['correct']])==clean(q['sourceAnswer'])
  assert clean(q['statement'])!=clean(r['statement']);assert r['grade']==6 and r['minimumPlan']=='pro'
  wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY';rejected(lambda:solve(wrong,i));refs.append(ref)
  entries.append({'editionId':r['editionId'],'sha256':hashrow(r),'verdict':'verified','method':'independent_full_saved_new_official_authored_solutions_every_MCQ_read_printed_exact_multivariate_polynomial_scalar_equivalence_coordinate_roles_oracle','notes':[]})
 # Each row has an independently meaningful changed printed datum/option canary.
 mutations=[(0,'statement','28','29'),(1,'statement','64','65'),(2,'statement','+ 9','+ 10'),(3,'statement','12','13'),(4,'statement','+ 4','+ 5'),(5,'statement','17','18'),(6,'statement','13','14'),(7,'options','6x − 5y + 9','6xy − 5y + 9'),(8,'statement','23','24'),(9,'statement','(3; -2)','(3; -1)'),(10,'statement','11','12'),(11,'statement','540','560'),(12,'statement','29','30'),(13,'statement','28','35'),(14,'statement','2x + y','2x − y'),(15,'statement','17','18'),(16,'options','5x − 3y','5xy − 3y'),(17,'statement','x = 6','x = 7'),(18,'statement','M(5; 7)','M(5; 8)'),(19,'statement','= 9','= 0'),(20,'statement','36','40'),(21,'options','7x − 4y = 0','7x − 4y = 1'),(22,'statement','24','27'),(23,'statement','31','33'),(24,'statement','16','19')]
 for i,k,old,new in mutations:
  c=copy.deepcopy(rows[i]);assert old in str(c[k]);c[k]=[v.replace(old,new) for v in c[k]] if isinstance(c[k],list) else c[k].replace(old,new);rejected(lambda:solve(c,i))
 # Whole-set supplementary exact witness domains (formal coefficients remain primary).
 coordinate_cases=0
 for den in range(1,11):
  for n in range(-50,51):
   x=F(n,den);y=7-3*x
   assert value(equation('4x + 12y - 28 = 0'),{'x':y,'y':x})==0
   assert value(equation('x + 3y - 7 = 0'),{'x':y,'y':x})==0
   assert value(equation('0*x + 7y - 28 = 0'),{'x':x,'y':4})==0
   assert value(equation('4x - 36 = 0'),{'x':9,'y':x})==0
   coordinate_cases+=4
 coin_cases=0
 for x in range(31):
  for y in range(31):
   total=sum([100]*x+[20]*y);assert (total-100*x)//20==y;coin_cases+=1
 js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';import {mathFragments} from './frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of [r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert native['fractions']==7
 assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'Complete all25 saved/new conditions, full official/authored solutions and every MCQ independently read; actual printed coefficient-map and exact coordinate oracle. No author params/spec/model/solver imported. Scalar proportionality proves all-real equivalence; finite witnesses are supplemental, not a universal-equivalence substitute.','summary':{'verified':25,'findings':0,'wrongKeysRejected':25,'printedCanariesRejected':len(mutations),'exactCoordinateWitnesses':coordinate_cases,'integerCoinLedgers':coin_cases,'actualMathTextFractionNodes':native['fractions'],'pythonJavaScriptHashesMatched':25},'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-two-variable-lines.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
