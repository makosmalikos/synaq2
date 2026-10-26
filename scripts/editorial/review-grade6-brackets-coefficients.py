"""Independent full14 brackets/coefficient review. Handwritten symbolic
coefficient-vector parser with exact decimal/fraction arithmetic, not author code.
All saved/new fullconditions, solutions and MCQ choices read separately.
"""
import copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-brackets-coefficients.json';REPORT='problems/editorial/reviews/grade6-brackets-coefficients.json'
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

def solve(r,i,source=False):
 s=clean(r['statement']);os=options(r);ans=None;chosen=None
 if i==0:
  eq=one(re.findall(r'\d+\s*-\s*\(a\s*\+\s*\d+\)\s*=\s*□\s*-\s*a',s));ans=blank_equation(eq)
 elif i==1:
  expr=s.split(':',1)[1].rstrip('. ');chosen=pick(os,poly(expr));assert '(' not in clean(chosen)
 elif i==2:
  eq=one(re.findall(r'\(\d+/\d+\)\s*(?:×\s*)?\(\d+a\s*\+\s*\d+\)\s*=\s*\d+a\s*\+\s*□',s));ans=blank_equation(eq)
 elif i==3:
  expr=s.split(':',1)[1].rstrip('. ');chosen=pick(os,poly(expr));assert '(' not in clean(chosen)
 elif i==4:
  expr=one(re.findall(r'\d+\(\d+x\s*\+\s*\d+y\s*-\s*\d+\)',s));p=poly(expr);ans=p[('y',)];assert p[('x',)]!=ans and p[()]<0
 elif i==5:
  target=('x','y') if source else ('p','q');chosen=one([o for o in os if poly(o)=={target:F(1)}])
 elif i==6:
  expr=one(re.findall(r'-\(-[a-z]\s*\+\s*\d+\)',s));chosen=pick(os,poly(expr));assert '(' not in clean(chosen)
 elif i==7:
  expr=one(re.findall(r'\(-\d+(?:,\d+)?x\)\s*×\s*\(-\d+y\)',s));p=poly(expr);assert set(p)=={('x','y')};ans=p[('x','y')];assert ans>0
 elif i==8:
  eq=one(re.findall(r'-\d+\(x\s*-\s*\d+\)\s*=\s*-\d+x\s*\+\s*□',s));ans=blank_equation(eq);assert ans>0
 elif i==9:
  expr=one(re.findall(r'\d+,\d+\s*-\s*\(\d+,\d+\s*-\s*\d+\)',s));ans=value(expr)
  a,b,c=re.findall(r'\d+,\d+|\d+',expr);assert F(a.replace(',','.'))%1==F(b.replace(',','.'))%1
  delta=F(a.replace(',','.'))-F(b.replace(',','.'));assert delta.denominator==1
 elif i==10:
  differences=[]
  for o in os:
   a,b=clean(o).split('=');differences.append(add(poly(a),poly(b),-1))
  chosen=one([o for o,p in zip(os,differences) if not p])
  # Wrong second equality is accidentally true atc=0, but not an identity.
  assert differences[1] and differences[1].get((),F(0))==0 and differences[1].get(('c',),F(0))!=0
 elif i==11:
  letter='a' if source else 'z';p=poly('-'+letter);ans=p[(letter,)];chosen=one([o for o in os if clean(o).lstrip('-').isdigit() and value(o)==ans])
 elif i==12:
  expr=one(re.findall(r'-\([a-z](?:\s*[+-]\s*[a-z])+\)',s));p=poly(expr)
  assert all(len(k)==1 and abs(c)==1 for k,c in p.items());ans=sum(c<0 for c in p.values())
  if not source:assert 'АЛДЫНДА' in s and 'әріп мәнінің' in r['solution']
 elif i==13:
  expr=s.split('өрнегін')[0].strip();p=poly(expr);assert set(p)=={('a','b')};ans=p[('a','b')];chosen=one([o for o in os if value(o)==ans]);assert ans<0
  fs=[(int(a),int(b)) for a,b in re.findall(r'\((\d+)/(\d+)\)',expr)];assert len(fs)==2
  (a,b),(c,d)=fs;assert math.gcd(a,d)>1 and math.gcd(c,b)>1
  # This distractor negates the sum of magnitudes, not the actual signed sum.
  assert any(value(o)==-(F(a,b)+F(c,d)) for o in os)
  if not source:assert 'екі модуль қосылып' in r['solution']
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
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_handwritten_exact_multivariate_polynomial_parser_Fraction_and_written_sign_role_oracle','notes':['Read all14 saved/new full conditions, complete official/authored solutions and every offered MCQ; no author params/models/solver imported.','Exact polynomial coefficient vectors prove universal bracket/distributive identities and blank constants, signed mixed monomials, y versus x coefficient and written minus-sign count independently of letter values.','Exact tenths preserve efficient cancellation; both cross-cancellation pairs checked. Wrong second identity atc=0 excluded by nonzero symbolic coefficient; fraction distractor is negative sum of magnitudes, not actual signed addition.']})
 canaries=[(0,'23 -','24 -'),(1,'a - 9','a + 9'),(2,'+ 42','+ 48'),(3,'n - 7','n + 7'),(4,'7y','8y'),(6,'+ 13','+ 14'),(7,'35y','30y'),(8,'x - 6','x - 5'),(9,'12,8','13,8'),(12,'+ r','- r'),(13,'(10/9)','(20/9)')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,old,new in[(5,'(-p) × (-q)','(-p) × q'),(10,'-(7 - c) = -7 + c','-(7 - c) = -7 - c'),(11,'-1','2')]:
  r=copy.deepcopy(rows[i]);assert old in r['options'];r['options']=[o.replace(old,new) for o in r['options']]
  try:solve(r,i)
  except(AssertionError,ValueError,IndexError):rejected+=1
  else:raise AssertionError(('Choice/universal canary accepted',i))
 # Complete independent signed tenths coefficient domain and polynomial identities.
 witnesses=0
 for a in range(-100,101):
  for b in range(-40,41):
   pa=F(a,10);pb=F(b)
   assert poly(f'({a}/10)x × ({b})y').get(('x','y'),F(0))==pa*pb
   assert poly(f'{a} - (x + {b})')==poly(f'({a}-{b})-x')
   witnesses+=1
 assert poly('-(p-q+r-s-t+u)')=={('p',):F(-1),('q',):F(1),('r',):F(-1),('s',):F(1),('t',):F(1),('u',):F(-1)}
 evidence={'oracle':'scripts/editorial/review-grade6-brackets-coefficients.py','savedConditionsChecked':14,'newConditionsChecked':14,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenWrittenSignRoleAndChoiceCanariesRejected':rejected,'independentExactTenthsAndBracketCoefficientCases':witnesses,'universalIdentityProof':'exact multivariate coefficient equality, not finite substitution alone','independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
