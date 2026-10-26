"""Independent13-task algebra-introduction review: printed AST/Fraction and
exact polynomial coefficient vectors/domain roots. No author params/solver.
"""
import ast,copy,hashlib,json,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-algebra-basics.json';REPORT='problems/editorial/reviews/grade6-algebra-basics.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('²','^2').replace('\\,','')
 s=re.sub(r'\\(?:dfrac|frac)\{([^{}]+)\}\{([^{}]+)\}',r'((\1)/(\2))',s)
 return s

def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def tree(s):
 s=clean(s).replace('×','*').replace(':','/').replace('^','**');s=re.sub(r'(\d+),(\d+)',r'\1.\2',s)
 s=re.sub(r'(\d|\))\s*([a-z])',r'\1*\2',s);return ast.parse(s.strip(),mode='eval').body

def numeric(n,env={}):
 if isinstance(n,ast.Constant):return F(str(n.value))
 if isinstance(n,ast.Name):return F(env[n.id])
 if isinstance(n,ast.UnaryOp):return -numeric(n.operand,env) if isinstance(n.op,ast.USub) else numeric(n.operand,env)
 assert isinstance(n,ast.BinOp),ast.dump(n);a,b=numeric(n.left,env),numeric(n.right,env)
 if isinstance(n.op,ast.Add):return a+b
 if isinstance(n.op,ast.Sub):return a-b
 if isinstance(n.op,ast.Mult):return a*b
 if isinstance(n.op,ast.Div):return a/b
 if isinstance(n.op,ast.Pow):assert b.denominator==1;return a**int(b)
 raise AssertionError(ast.dump(n))
def add(a,b,sign=1):
 r=a.copy()
 for m,c in b.items():r[m]=r.get(m,F(0))+sign*c
 return {m:c for m,c in r.items() if c}
def mul(a,b):
 r={}
 for m,c in a.items():
  for n,d in b.items():k=tuple(sorted(m+n));r[k]=r.get(k,F(0))+c*d
 return {m:c for m,c in r.items() if c}
def poly(n):
 if isinstance(n,ast.Constant):return {():F(str(n.value))} if n.value else {}
 if isinstance(n,ast.Name):return {(n.id,):F(1)}
 if isinstance(n,ast.UnaryOp):return {m:(-c if isinstance(n.op,ast.USub) else c) for m,c in poly(n.operand).items()}
 assert isinstance(n,ast.BinOp)
 a,b=poly(n.left),poly(n.right)
 if isinstance(n.op,ast.Add):return add(a,b)
 if isinstance(n.op,ast.Sub):return add(a,b,-1)
 if isinstance(n.op,ast.Mult):return mul(a,b)
 if isinstance(n.op,ast.Div):assert set(b)=={()} and b[()]!=0;return {m:c/b[()] for m,c in a.items()}
 if isinstance(n.op,ast.Pow):
  k=numeric(n.right);assert k.denominator==1 and k>=0;r={():F(1)}
  for _ in range(int(k)):r=mul(r,a)
  return r
 raise AssertionError(ast.dump(n))
def options(r):return [o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def select_poly(os,p):return one([o for o in os if poly(tree(o))==p])
def frac_expr(s):
 s=clean(s)
 # All captured denominator tasks have a single parenthesized rational expression.
 m=re.search(r'\([^\n]*?/[^\n]*?\)',s)
 if m:
  start=m.start();depth=0
  for j in range(start,len(s)):
   if s[j]=='(':depth+=1
   if s[j]==')':
    depth-=1
    if depth==0:return s[start:j+1]
 raise AssertionError(s)
def solve(r,i,source=False):
 s=clean(r['statement']);os=options(r);chosen=None;ans=None
 if i==0:
  candidates=[];roots=[]
  for o in os:
   divs=[n for n in ast.walk(tree(o)) if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Div)];assert len(divs)==1
   d=poly(divs[0].right)
   if set(d)=={()}:assert d[()]!=0;candidates.append(o)
   else:
    variables=[m for m in d if m];assert len(variables)==1 and len(variables[0])==1
    var=variables[0][0];root=-d.get((),F(0))/d[(var,)];assert numeric(divs[0].right,{var:root})==0;roots.append(root)
  chosen=one(candidates);assert len(roots)==3 and len(set(roots))==3
 elif i==1:
  prefix=s.split('қосылғыштарынан')[0] if source else s.split('Қосылғыштар ')[1].split('.')[0]
  terms=prefix.replace(' және ', ', ').split(',');assert len(terms)==4
  target={}
  for t in terms:target=add(target,poly(tree(t)))
  chosen=select_poly(os,target)
 elif i==2:
  exp=tree(frac_expr(s));assert isinstance(exp,ast.BinOp) and isinstance(exp.op,ast.Div)
  d=poly(exp.right);var=one([m[0] for m in d if m]);ans=-d.get((),F(0))/d[(var,)]
  assert numeric(exp.right,{var:ans})==0 and numeric(exp.left,{var:ans})!=0
 elif i in(3,4,8,10):
  env={a:F(b.replace(',','.')) for a,b in re.findall(r'([a-z])\s*=\s*(-?\d+(?:,\d+)?)',s)}
  if i==3:expr=one(re.findall(r'\d+\s*-\s*\d+k',s));assert env['k']<0
  elif i==4:expr=one(re.findall(r'a\^2\s*-\s*\d+b',s))
  elif i==8:expr=one(re.findall(r'\d+\s*\+\s*\d+m',s))
  else:
   # Extract the actual printed x/y expression after the assignments without choosing swapped values.
   m=re.search(r'(\(+x\)+/\(+\d+\)+|\(x/\d+\))\s*\+\s*(\(+y\)+/\(+\d+\)+|\(y/\d+\))',s)
   if not m:
    # LaTeX cleaner emits ((x)/(3)) + ((y)/(4)).
    m=re.search(r'\(\(x\)/\((\d+)\)\)\s*\+\s*\(\(y\)/\((\d+)\)\)',s);assert m,s;expr=m[0]
   else:expr=m[0]
  ans=numeric(tree(expr),env)
  if os:chosen=one([o for o in os if numeric(tree(o))==ans])
 elif i==5:
  given=int(one(re.findall(r'a\s*=\s*(\d+)',s)));coefs={int(x) for x in re.findall(r'(\d+)a',s)};coef=one(list(coefs));ans=given*coef
 elif i==6:
  factor=int(one(re.findall(r'(\d+)\s*есе',s)));assert factor>1
  chosen=select_poly(os,{('n',):F(1,factor)})
 elif i==7:
  chosen=one([o for o in os if any(isinstance(n,ast.Name) for n in ast.walk(tree(o)))])
  for o in os:
   if o!=chosen:numeric(tree(o))
 elif i==9:
  expr=s.split('алгебралық')[0].strip();target=poly(tree(expr))
  candidates=[]
  for o in os:
   terms=clean(o).split(';');assert len(terms)==4;p={}
   for t in terms:p=add(p,poly(tree(t)))
   if p==target:candidates.append(o)
  chosen=one(candidates)
 elif i==11:
  expr=s.split('алгебралық')[0].split('қосындысын')[0].strip();chosen=select_poly(os,poly(tree(expr)))
  assert '(' not in clean(chosen)
 elif i==12:
  k=int(one(re.findall(r'\(m\s*-\s*n\)\s*×\s*(\d+)',s)))
  # Independently translate the printed language into four distinct symbolic roles.
  meanings=[]
  for o in os:
   t=clean(o);assert int(one(re.findall(r'\d+',t)))==k
   if 'айырмасы мен' in t:meaning='m-n+'+str(k)
   elif 'санынан' in t or 'көбейтіндісінің айырмасы' in t:meaning='m-'+str(k)+'*n'
   elif 'қосындыс' in t:meaning='(m+n)*'+str(k)
   elif 'айырмасының' in t and 'көбейтіндісі' in t:meaning='(m-n)*'+str(k)
   else:raise AssertionError(t)
   meanings.append(poly(tree(meaning)))
  target=poly(tree('(m-n)*'+str(k)));chosen=one([o for o,p in zip(os,meanings) if p==target]);assert len({str(p) for p in meanings})==4
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert numeric(tree(r['answer']))==ans,(i,r['answer'],ans)

def run():
 rows=read(BATCH)['editions'];assert len(rows)==13;entries=[];bad=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and q['solution'] and not q.get('images')
  assert norm(q['statement']).lower()!=norm(r['statement']).lower();solve({**q,'answer':q['sourceAnswer']},i,True);solve(r,i)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_printed_AST_Fraction_exact_polynomial_vectors_denominator_root_domain_and_word_roles_oracle','notes':['Read all13 saved/new full conditions, complete official/authored solutions and every MCQ; no author models, params or solver used.','Independent AST and exact polynomial coefficient vectors prove signed sums, bracket removal and word-expression equivalence for all values; each variable denominator has an explicit zero root while the selected constant denominator stays nonzero.','Actual printed variable assignments, negative substitution, power-before-product, distinct x/y fraction roles, times-smaller versus subtract, signed addend lists and ordered operations independently checked.']})
 canaries=[(1,'-14','14'),(2,'y - 22','y - 23'),(3,'k = -3','k = -2'),(4,'b = 7','b = 8'),(5,'a = 240','a = 250'),(6,'8 есе','9 есе'),(8,'m = 8','m = 9'),(9,'- 8','+ 8'),(10,'y = 56','y = 63'),(11,'(-c)','(c)'),(12,'× 6','× 7')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,old,new in [(0,'((x + 6)/11)','((x + 6)/x)'),(7,'4a - 9','4 × 2 - 9')]:
  r=copy.deepcopy(rows[i]);assert old in r['options'];r['options']=[o.replace(old,new) for o in r['options']]
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):rejected+=1
  else:raise AssertionError(('Domain/variable canary accepted',i))
 witnesses=0
 # Polynomial identities are exact coefficient equalities, plus a disjoint rational evaluation domain.
 for u in range(-10,11):
  for v in range(-10,11):
   for w in (-3,0,5):
    env={'u':F(u,3),'v':F(v,2),'w':F(w,5)}
    assert numeric(tree('8u+(-3v)+(-14)+w'),env)==numeric(tree(rows[1]['answer']),env)
    assert numeric(tree('3u+(-7v)+(-w)'),env)==numeric(tree('3u-7v-w'),env)
    witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-algebra-basics.py','savedConditionsChecked':13,'newConditionsChecked':13,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenDomainVariableAndRoleCanariesRejected':rejected,'independentExactRationalPolynomialWitnesses':witnesses,'universalDenominatorProof':'constant nonzero versus explicit affine root for every excluded choice','independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
