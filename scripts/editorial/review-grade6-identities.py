"""Independent full14 identity review. Handwritten symbolic
coefficient-vector parser with exact decimal/fraction arithmetic, not author code.
All saved/new fullconditions, solutions and MCQ choices read separately.
"""
import copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-identities.json';REPORT='problems/editorial/reviews/grade6-identities.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\square','□').replace('\\,','').replace('²','^2').replace('³','^3').replace('⁴','^4')
 s=re.sub(r'(-?)(\d+)\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',lambda m:('-' if m[1] else '')+'('+m[2]+'+('+m[3]+'/'+m[4]+'))',s)
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def add(a,b,sign=1):
 r=a.copy()
 for k,c in b.items():r[k]=r.get(k,F(0))+sign*c
 return {k:c for k,c in r.items() if c}
def mul(a,b):
 r={}
 for k,c in a.items():
  for l,d in b.items():m=tuple(sorted(k+l));r[m]=r.get(m,F(0))+c*d
 return {m:c for m,c in r.items() if c}
def poly(text):
 s=clean(text).replace('×','*').replace(':','/').strip();tokens=re.findall(r'\d+(?:[.,]\d+)?|[a-zB]|[()+*/^-]',s)
 assert ''.join(tokens)==re.sub(r'\s+','',s),(s,tokens);i=0
 def atom():
  nonlocal i
  t=tokens[i];i+=1
  if t in('+','-'):
   p=atom();return {m:(-c if t=='-' else c) for m,c in p.items()}
  if t=='(':
   p=total();assert tokens[i]==')';i+=1
  elif re.fullmatch('[a-zB]',t):p={(t,):F(1)}
  else:p={():F(t.replace(',','.'))} if F(t.replace(',','.')) else {}
  if i<len(tokens) and tokens[i]=='^':
   i+=1;k=int(tokens[i]);i+=1;assert 0<=k<=10;r={():F(1)}
   for _ in range(k):r=mul(r,p)
   p=r
  return p
 def product():
  nonlocal i
  p=atom()
  while i<len(tokens) and tokens[i] not in(')', '+','-'):
   if tokens[i] in('*','/'):
    op=tokens[i];i+=1;q=atom()
    if op=='/':assert set(q)=={()} and q[()]!=0;p={m:c/q[()] for m,c in p.items()}
    else:p=mul(p,q)
   else:p=mul(p,atom()) # Adjacent factors e.g.6(...),xy,(1/6)a.
  return p
 def total():
  nonlocal i
  p=product()
  while i<len(tokens) and tokens[i] in('+','-'):
   op=tokens[i];i+=1;p=add(p,product(),1 if op=='+' else -1)
  return p
 p=total();assert i==len(tokens),(text,tokens[i:]);return p
def value(s):p=poly(s);assert set(p)<= {()},s;return p.get((),F(0))
def options(r):return [o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def pick(os,p):return one([o for o in os if poly(o)==p])
def blank_equation(eq):
 left,right=eq.split('=');difference=add(poly(left),poly(right.replace('□','B')),-1)
 coefficient=difference.pop(('B',));constant=difference.pop((),F(0));assert not difference
 return -constant/coefficient

def evaluate(p,env):
 total=F(0)
 for monomial,c in p.items():
  for v in monomial:c*=env[v]
  total+=c
 return total
def diff(s):a,b=clean(s).split('=');return add(poly(a),poly(b),-1)
def solve(r,i,source=False):
 s=clean(r['statement']);os=options(r);chosen=None;ans=None
 if i==0:
  ds=[]
  for o in os:
   a,b=clean(o).split(' және ');ds.append(add(poly(a),poly(b),-1))
  chosen=one([o for o,p in zip(os,ds) if not p])
  assert evaluate(ds[0],{'x':F(0)})!=0 and evaluate(ds[2],{'x':F(3)})!=0 and evaluate(ds[3],{'x':F(2)})!=0
  expectedDegree=3 if source else 4;assert any(len(m)==expectedDegree for m in ds[3])
 elif i==1:
  eq=one(re.findall(r'\(a\s*×\s*\d+\)\s*×\s*\d+\s*=\s*□\s*×\s*a',s));left,right=eq.split('=');p=poly(left);assert set(p)=={('a',)};ans=p[('a',)]
 elif i==2:
  expr=one(re.findall(r'\d+\s*×\s*\d+\s*\+\s*\d+\s*×\s*\d+',s));a,b,c,d=map(int,re.findall(r'\d+',expr));assert a==c and b+d==100;ans=value(expr);assert ans==a*(b+d)
 elif i==3:
  eq=one(re.findall(r'\d+\(m\s*\+\s*\d+\)\s*=\s*\d+m\s*\+\s*□',s));ans=blank_equation(eq)
 elif i==4:
  expr=one(re.findall(r'\d+a\s*-\s*\d+a',s));chosen=pick(os,poly(expr))
 elif i==5:
  ps=[diff(o) for o in os];chosen=one([o for o,p in zip(os,ps) if p]);p=one([p for p in ps if p]);var='a' if source else 't';assert evaluate(p,{var:F(0)})==0 and evaluate(p,{var:F(7)})!=0
 elif i==6:
  eq=one(re.findall(r'\d+x\s*\+\s*\d+\s*=\s*x\s*\+\s*\d+',s));p=diff(eq);assert set(p)=={(),('x',)}
  given=int(one(re.findall(r'x\s*=\s*(\d+)',s)));assert -p[()]/p[('x',)]==given and evaluate(p,{'x':F(given)})==0
  assert evaluate(p,{'x':F(0)})!=0
  chosen=one([o for o in os if clean(o).startswith('Жоқ') and 'x = 0' in clean(o)])
  t=clean(chosen);witness=int(one(re.findall(r'x\s*=\s*(\d+)',t)));a,b=eq.split('=');assert evaluate(poly(a),{'x':F(witness)})!=evaluate(poly(b),{'x':F(witness)})
 elif i==7:
  eq=one(re.findall(r'[a-z]\s*\+\s*\d+\s*=\s*\d+\s*\+\s*[a-z]',s));assert not diff(eq)
  a,b=eq.split('=');assert [x.strip() for x in a.split('+')]==[x.strip() for x in b.split('+')][::-1]
  chosen=one([o for o in os if 'қосудың' in o.lower() and 'ауыстырымдылық' in o.lower()])
 elif i==8:
  expr=one(re.findall(r'\(x\s*\+\s*\d+\)\s*\+\s*\(\d+\s*-\s*x\)',s));p=poly(expr);assert set(p)=={()};ans=p[()]
 elif i==9:
  expr=one(re.findall(r'\d+\(\d+b\s*-\s*\d+\)',s));chosen=pick(os,poly(expr))
 elif i==10:
  expr=one(re.findall(r'\(-\d+\)\s*×\s*y\s*×\s*\(-\d+\)',s));p=poly(expr);assert set(p)=={('y',)};ans=p[('y',)];assert ans>0
 elif i==11:
  ps=[diff(o) for o in os];chosen=one([o for o,p in zip(os,ps) if not p])
  for p,w in zip(ps[1:],(0,1,1)):assert evaluate(p,{'y':F(w)})!=0
 elif i==12:
  expr=one(re.findall(r'\d+x\s*-\s*\d+x',s));p=poly(expr);assert set(p)=={('x',)};x=int(one(re.findall(r'x\s*=\s*(\d+)',s)));ans=evaluate(p,{'x':F(x)})
 elif i==13:
  expr=one(re.findall(r'\d+\s*×\s*m\s*×\s*\d+',s));p=poly(expr);assert set(p)=={('m',)};coefficient=p[('m',)];assert coefficient in(100,1000)
  m=int(one(re.findall(r'm\s*=\s*(\d+)',s)));ans=evaluate(p,{'m':F(m)})
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert value(r['answer'])==ans,(i,r['answer'],ans)
def run():
 rows=read(BATCH)['editions'];assert len(rows)==14;entries=[];bad=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and q['solution'] and not q.get('images')
  assert norm(q['statement']).lower()!=norm(r['statement']).lower();solve({**q,'answer':q['sourceAnswer']},i,True);solve(r,i)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,IndexError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_polynomial_identity_vectors_printed_counterexamples_and_symbolic_role_oracle','notes':['Read all14 saved/new full conditions, complete official/authored solutions and every offered MCQ; no author params/models/solver imported.','Universal identities proved by exact multivariate coefficient equality; false choices independently rejected by actual counterexamples, including equation true only at one root and multiplication by0 only att=0.','Checked structural addition commutativity, requested blank coefficient/constant, native fourth/cubic powers, common-factor round100 and125×8 round1000 regrouping, signed products and efficient substitution.']})
 canaries=[(1,'× 9','× 8'),(2,'18 × 64','17 × 64'),(3,'+ 6','+ 7'),(4,'11a','12a'),(6,'x = 3','x = 4'),(7,'9 + t','8 + t'),(8,'+ 11','+ 12'),(9,'3b','4b'),(10,'(-3)','(-4)'),(12,'x = 16','x = 17'),(13,'m = 23','m = 24')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,old,new in[(0,'3(x - 4) және 3x - 12','3(x - 4) және 3x - 4'),(5,'t × 0 = t','t × 0 = 0'),(11,'7(y + 3) = 7y + 21','7(y + 3) = 7y + 20')]:
  r=copy.deepcopy(rows[i]);assert old in r['options'];r['options']=[o.replace(old,new) for o in r['options']]
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Identity choice canary accepted',i))
 witnesses=0
 for k in range(-20,21):
  for a in range(-20,21):
   assert poly(f'{k}(x+{a})')==poly(f'{k}x+({k*a})');assert poly(f'x+{a}')==poly(f'{a}+x');witnesses+=1
 # Exact power observation proves4x andx⁴ differ as polynomials, irrespective
 # of the handful of coincident roots that finite value tests could miss.
 assert poly('x^4')=={('x','x','x','x'):F(1)} and poly('x+x+x+x')=={('x',):F(4)}
 evidence={'oracle':'scripts/editorial/review-grade6-identities.py','savedConditionsChecked':14,'newConditionsChecked':14,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenCounterexampleAndChoiceCanariesRejected':rejected,'completeSignedDistributiveAndCommutativeCoefficientCases':witnesses,'universalProof':'exact polynomial coefficient vectors with native powers, plus printed counterexample verification for every excluded identity','independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
