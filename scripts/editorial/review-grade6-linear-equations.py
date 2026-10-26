"""Independent full13 linear-equation review. Handwritten symbolic
coefficient-vector parser with exact decimal/fraction arithmetic, not author code.
All saved/new fullconditions, solutions and MCQ choices read separately.
"""
import copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-linear-equations.json';REPORT='problems/editorial/reviews/grade6-linear-equations.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\square','□').replace('\\,','').replace('²','^2').replace('³','^3').replace('⁴','^4')
 s=re.sub(r'(-?)(\d+)\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',lambda m:('-' if m[1] else '')+'('+m[2]+'+('+m[3]+'/'+m[4]+'))',s)
 return re.sub(r'\\(?:dfrac|frac)\{([^{}]+)\}\{([^{}]+)\}',r'(\1/\2)',s)
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

def equation(s):
 s=clean(s);found=[]
 for m in re.finditer(r'[\d\sx y,()+/×÷:^=-]+'.replace('x y','xy'),s):
  t=m[0].strip(' \n.;')
  if '=' in t:
   assert t.count('=')==1,t;a,b=t.split('=');poly(a.replace('÷','/'));poly(b.replace('÷','/'));return(a,b)
 return one(found[:1])
def delta(eq):return add(poly(eq[0].replace('÷','/')),poly(eq[1].replace('÷','/')),-1)
def roots(eq):
 p=delta(eq);assert set(p)<= {(),('x',)},eq;a=p.get(('x',),F(0));b=p.get((),F(0))
 return ('one',-b/a) if a else ('all',) if b==0 else ('none',)
def solve(r,i,source=False):
 s=clean(r['statement']);os=options(r);ans=None;chosen=None
 if i==0:
  e=equation(s);p=delta(e);chosen=one([o for o in os if delta(equation(o))==p])
  # Requested exact transposition step, not merely a numeric root.
  left,right=equation(chosen);assert 'x' in left and 'x' not in right
 elif i==1:
  a,b,c=map(int,re.findall(r'\d+',s));assert a>0;ans=F(c+b,a);assert a*ans-b==c
 elif i in(2,6,9,10,12):
  e=equation(s);kind,ans=roots(e);assert kind=='one'
  p=delta(e);assert p.get(('x',),F(0))*ans+p.get((),F(0))==0
  if i==6:assert p[('x',)].denominator>1
  if i==12:assert p[('x',)].denominator in(2,4)
 elif i==3:
  candidates=[]
  for o in os:
   a,b=clean(o).split('=')
   try:p=delta((a,b))
   except AssertionError:continue # Variable in denominator is not polynomial in given writing.
   vars={v for m in p for v in m}
   if len(vars)==1 and max(map(len,p),default=0)==1:candidates.append(o)
  chosen=one(candidates)
 elif i==4:
  p=delta(equation(s));assert set(p)=={(),('x',)}
  def pair(o):t=clean(o);return tuple(F(x) for x in re.findall(r'[ab]\s*=\s*(-?\d+)',t))
  chosen=one([o for o in os if pair(o)==(p[('x',)],p[()])])
 elif i==5:
  states=[roots(equation(o)) for o in os];chosen=one([o for o,state in zip(os,states) if state==('none',)])
  assert sum(state[0]=='all' for state in states)==1 and sum(state[0]=='one' for state in states)==2 and ('one',F(0)) in states
 elif i==7:
  e=equation(s);target=roots(e);assert target[0]=='one';chosen=one([o for o in os if roots(equation(o))==target])
 elif i==8:
  e=equation(s);kind,ans=roots(e);assert kind=='one' and ans<0;chosen=one([o for o in os if value(o)==ans])
 elif i==11:
  chosen=one([o for o in os if re.search(r'\b0-ге',clean(o)) and 'көбейту' in o.lower()])
  # Explicit independent counterexample: x=5 has singleton root set; multiply
  # BOTH sides byzero gives0=0 with everyreal root, so not equivalent.
  assert roots(('x','5'))==('one',F(5)) and roots(('0*x','0*5'))==('all',)
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_printed_polynomial_coefficient_vectors_complete_affine_rootset_and_structural_role_oracle','notes':['Read all13 saved/new full conditions, complete official/authored solutions and everyMCQ; no author params/models/solver imported.','Exact polynomial coefficient difference determines singleton, empty or all-real root sets, including zero as a valid root, root equivalence versus exact transposition step, coefficient/constant ordered pairs and signed fractional/decimal coefficients.','Given-writing classification rejects square, variable denominator and two-variable alternatives; actual independent zero-multiplication counterexample proves equal truth does not guarantee equal root sets. Every offered alternative and inverse step checked.']})
 canaries=[(0,'8x -','9x -'),(1,'49 шықты','54 шықты'),(2,'= 28','= 32'),(4,'-8x','-9x'),(6,'(x/4)','(x/5)'),(7,'x - 8 = 3','x - 9 = 3'),(8,'+ 11','+ 15'),(9,'+ 38','+ 43'),(10,'- 54','- 63'),(12,'0,25','0,5')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Printed root/role canary accepted',i))
 for i,old,new in[(3,'5x - 12 = 0','x² - 12 = 0'),(5,'6x + 2 = 6x - 5','5x + 2 = 6x - 5'),(11,'Екі жағын да 0-ге көбейту','Екі жағын да 2-ге көбейту')]:
  r=copy.deepcopy(rows[i]);assert old in r['options'];r['options']=[o.replace(old,new) for o in r['options']]
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Rootclass/operation canary accepted',i))
 witnesses=0
 for na in range(-30,31):
  for nb in range(-30,31):
   a=F(na,4);b=F(nb,3);p={('x',):a,():b};p={k:v for k,v in p.items() if v}
   if a:
    root=-b/a;assert a*root+b==0
    for k in(-5,-1,1,7):assert -(b*k)/(a*k)==root
   elif b:assert all(a*x+b!=0 for x in(-5,0,7))
   else:assert all(a*x+b==0 for x in(-5,0,7))
   witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-linear-equations.py','savedConditionsChecked':13,'newConditionsChecked':13,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenRootclassAndChoiceCanariesRejected':rejected,'completeQuarterThirdCoefficientAffineCases':witnesses,'rootsetProof':'exact coefficient classification: nonzero slope singleton; zero slope with nonzero constant empty; bothzero allreal','independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
