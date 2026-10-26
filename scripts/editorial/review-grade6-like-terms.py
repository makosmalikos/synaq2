"""Independent full13 like-term review. Handwritten symbolic
coefficient-vector parser with exact decimal/fraction arithmetic, not author code.
All saved/new fullconditions, solutions and MCQ choices read separately.
"""
import copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-like-terms.json';REPORT='problems/editorial/reviews/grade6-like-terms.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\square','□').replace('\\,','')
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
 s=clean(text).replace('×','*').replace(':','/').strip();tokens=re.findall(r'\d+(?:[.,]\d+)?|[a-zB]|[()+*/-]',s)
 assert ''.join(tokens)==re.sub(r'\s+','',s),(s,tokens);i=0
 def atom():
  nonlocal i
  t=tokens[i];i+=1
  if t in('+','-'):
   p=atom();return {m:(-c if t=='-' else c) for m,c in p.items()}
  if t=='(':
   p=total();assert tokens[i]==')';i+=1;return p
  if re.fullmatch('[a-zB]',t):return {(t,):F(1)}
  return {():F(t.replace(',','.'))} if F(t.replace(',','.')) else {}
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
 result=F(0)
 for monomial,c in p.items():
  for v in monomial:c*=env[v]
  result+=c
 return result
def same_monomial(s):
 p=poly(s);assert len(p)==1,s;return one(list(p))
def uncombined_terms(s):
 # The offered non-like choices are sums with no parentheses; split signed
 # printed terms BEFORE coefficient combination, preserving repeated constants.
 s=clean(s);assert '(' not in s and ')' not in s
 return re.findall(r'[+-]?[^+-]+',s)
def solve(r,i,source=False):
 s=clean(r['statement']);os=options(r);chosen=None;ans=None
 patterns={0:r'\d+,\d+y\s*\+\s*\d+,\d+y',1:r'\d+b\s*-\s*\d+b\s*\+\s*\d+b',2:r'-x\s*\+\s*\d+x\s*-\s*\d+x',3:r'\d+c\s*-\s*\d+\s*\+\s*\d+c\s*\+\s*\d+',4:r'\d+p\s*-\s*\d+,\d+\s*\+\s*q\s*-\s*\d+,\d+',5:r'\(\d+/\d+\)m\s*\+\s*\(\d+/\d+\)m',7:r'\d+a\s*-\s*a',10:r'\d+k\s*-\s*\d+k\s*-\s*k',11:r'-\d+x\s*-\s*\d+x',12:r'\d+a\s*\+\s*\d+b\s*-\s*\d+a\s*\+\s*b'}
 if i in patterns:
  expr=one(re.findall(patterns[i],s));p=poly(expr)
  if i==0:
   y=int(one(re.findall(r'y\s*=\s*(\d+)',s)));assert set(p)=={('y',)};ans=evaluate(p,{'y':F(y)})
  elif i==1:assert set(p)=={('b',)};ans=p[('b',)]
  elif i in(3,4):ans=p[()];assert any(m for m in p)
  elif i==10:assert set(p)=={('k',)};ans=p[('k',)]
  else:chosen=pick(os,p)
  if i==5:
   (a,b),(c,d)=[(int(a),int(b)) for a,b in re.findall(r'\((\d+)/(\d+)\)',expr)]
   vals=[poly(o)[('m',)] for o in os];assert F(a+c,b+d) in vals and F(a,b)-F(c,d) in vals and F(a*c,b*d) in vals
  if i==2 and not source:
   assert '2x' in os;assert poly(expr.replace('-x +',''))==poly('2x')
 elif i==6:
  candidates=[]
  for o in os:
   ms=[same_monomial(t) for t in uncombined_terms(o)]
   if len(set(ms))==len(ms):candidates.append(o)
  chosen=one(candidates);assert same_monomial('ab')==same_monomial('ba')
 elif i==8:
  candidates=[]
  for o in os:
   a,b=clean(o).split(' және ')
   if same_monomial(a)==same_monomial(b):candidates.append(o)
  chosen=one(candidates)
 elif i==9:
  amounts=[int(x) for x in re.findall(r'(\d+)a',s)];assert len(amounts)==2
  p=poly(f'a+{amounts[0]}a-{amounts[1]}a');assert set(p)=={('a',)};ans=p[('a',)]
  if not source:assert 'a > 0' in s and 'неше есе' in s
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert value(r['answer'])==ans,(i,r['answer'],ans)
def run():
 rows=read(BATCH)['editions'];assert len(rows)==13;entries=[];bad=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and q['solution'] and not q.get('images')
  assert norm(q['statement']).lower()!=norm(r['statement']).lower();solve({**q,'answer':q['sourceAnswer']},i,True);solve(r,i)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,IndexError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  notes=['Read all13 saved/new full conditions, complete official/authored solutions and every offered MCQ; no author solver or params imported.','Exact polynomial vectors with constant empty monomial and sorted letter factors check signed coefficient versus complete term/value, ab=ba likeness, fractional and decimal arithmetic and requested ratio with positive initial amount.','Offered terms inspected before combination to preserve repeated constants; complete offered distractors verified, including add-numerators/denominators, subtraction and multiplication alternatives.']
  if i==2:notes.append('Raw official comment incorrectly called3x the result of ignoring initial-x; actual raw result would2x. Raw remains unchanged; new7x-5x=2x diagnostic is arithmetically correct.')
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_polynomial_vectors_original_signed_terms_and_printed_Fraction_oracle','notes':notes})
 canaries=[(0,'y = 10','y = 11'),(1,'12b','13b'),(2,'7x','8x'),(3,'+ 19','+ 20'),(4,'5,6','5,7'),(5,'(3/4)','(1/4)'),(7,'8a','9a'),(9,'5a','6a'),(10,'15k','16k'),(11,'-4x','-5x'),(12,'9a','10a')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,old,new in[(6,'4x + 5y - 8','4x + 5x - 8'),(8,'-9m және 1,8m','-9m және 1,8n')]:
  r=copy.deepcopy(rows[i]);assert old in r['options'];r['options']=[o.replace(old,new) for o in r['options']]
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Monomial choice canary accepted',i))
 witnesses=0
 for a in range(-40,41):
  for b in range(-40,41):
   for c in(-7,0,9):
    p=poly(f'({a}/10)x + ({b}/10)x + {c}')
    assert p.get(('x',),F(0))==F(a+b,10) and p.get((),F(0))==c;witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-like-terms.py','savedConditionsChecked':13,'newConditionsChecked':13,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenAndMonomialRoleCanariesRejected':rejected,'independentExactSignedTenthsCoefficientCases':witnesses,'knownRawDiagnosticCommentNotCopied':True,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
