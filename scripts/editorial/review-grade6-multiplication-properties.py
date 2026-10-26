"""Independent full13 saved/new multiplication-property editorial review.
Own printed Fraction AST and exact polynomial identity/structural role oracle.
All fullconditions, complete solutions and MCQs read; no author solver/params.
"""
import ast,copy,hashlib,json,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-multiplication-properties.json'
REPORT='problems/editorial/reviews/grade6-multiplication-properties.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\square','□').replace('\\,','')
 for tag in ('\\left','\\right','\\big'):s=s.replace(tag,'')
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
def python(s):return re.sub(r'(?<=\d)(?=[a-z])','*',clean(s).replace(',','.').replace('×','*').replace(':','/')).strip()
def tree(s):return ast.parse(python(s),mode='eval').body
def polynomial(s):
 t=python(s)
 def add(a,b,sign=1):
  out=a.copy()
  for key,v in b.items():out[key]=out.get(key,F(0))+sign*v
  return {k:v for k,v in out.items() if v}
 def walk(n):
  if isinstance(n,ast.Constant):return {():F(ast.get_source_segment(t,n))} if n.value else {}
  if isinstance(n,ast.Name):return {(n.id,):F(1)}
  if isinstance(n,ast.UnaryOp):
   assert isinstance(n.op,(ast.UAdd,ast.USub));v=walk(n.operand);return {k:-x for k,x in v.items()} if isinstance(n.op,ast.USub) else v
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return add(a,b)
  if isinstance(n.op,ast.Sub):return add(a,b,-1)
  if isinstance(n.op,ast.Mult):
   out={}
   for k,v in a.items():
    for l,w in b.items():key=tuple(sorted(k+l));out[key]=out.get(key,F(0))+v*w
   return {k:v for k,v in out.items() if v}
  if isinstance(n.op,ast.Div):assert set(b)=={()};return {k:v/b[()] for k,v in a.items()}
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def expr(s):
 p=polynomial(s);assert not p or set(p)=={()},s;return p.get((),F(0))
def os(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def one(xs):assert len(xs)==1,xs;return xs[0]
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def math_prompt(s):return clean(s).split(':')[-1].split('Жауапқа')[0].strip().rstrip('.')
def leaves(n):
 if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Mult):return leaves(n.left)+leaves(n.right)
 return [ast.dump(n,include_attributes=False)]
def commutative(s):
 left,right=map(tree,clean(s).split('='))
 return isinstance(left,ast.BinOp) and isinstance(right,ast.BinOp) and isinstance(left.op,ast.Mult) and isinstance(right.op,ast.Mult) and ast.dump(left.left)==ast.dump(right.right) and ast.dump(left.right)==ast.dump(right.left) and ast.dump(left.left)!=ast.dump(left.right)
def solve(r,i,source=False):
 s=clean(r['statement']);options=os(r);value=None;chosen=None
 if i in(0,1,3,5,7,9,12):
  printed=math_prompt(r['statement']);value=expr(printed)
  factors=[expr(piece) for piece in printed.split('×')]
  if i in(0,12):assert abs(factors[0]*factors[2])==1 and abs(factors[0]).denominator!=abs(factors[2]).denominator
  if i==1:assert factors[0]*factors[2]==-100
  if i==3:
   assert factors[2]==0 and value==0;ignored=factors[0]*factors[1]*factors[3]
   assert expr(options[0])==ignored and expr(options[2])==-ignored
  if i==5:assert len(factors)==4 and all(f<0 for f in factors) and factors[0]*factors[2]==1 and factors[3]==-1
  if i==7:
   assert len(factors)==5 and sum(f<0 for f in factors)==3 and all(f!=0 for f in factors)
   chosen=one([o for o in options if o=='теріс']);assert value<0
  if i==9:assert factors[0]*factors[2]==10
 elif i==2:
  printed=one(re.findall(r'\(-\d+\)\s*×\s*\(-\d+b\)',s));p=polynomial(printed);assert set(p)=={('b',)};value=p[('b',)]
  assert 'k' in s and 'k' in clean(r['solution'])
 elif i==4:
  printed=math_prompt(r['statement']);p=polynomial(printed);assert set(p)=={('a',)} and p[('a',)]<0
  chosen=one([o for o in options if polynomial(o)==p]);assert len(polynomial(options[3]))==1 and () in polynomial(options[3])
  coeffs=list(map(int,re.findall(r'-?\d+',printed)));assert polynomial(options[1])=={('a',):F(sum(coeffs))}
 elif i==6:
  printed=one(re.findall(r'\(-\d+\)\s*×\s*\d+\s*×\s*\d+',s));value=expr(printed)
  chosen=one([o for o in options if expr(o)!=value]);assert expr(chosen)==-value
  baseLeaves=sorted(leaves(tree(printed)))
  assert all(sorted(leaves(tree(o)))==baseLeaves for o in options if o!=chosen)
 elif i==8:
  left=one(re.findall(r'\(-\d+\)\s*×\s*\d+\s*=',s)).rstrip('= ').strip();right=one(re.findall(r'(\d+)\s*×\s*□',s));value=expr(left)/F(right)
 elif i==10:
  identity=s.split('теңдігінде')[0].strip() if not source else s.split(':',1)[1].strip().rstrip('?')
  a,b=map(tree,identity.split('='));assert polynomial(identity.split('=')[0])==polynomial(identity.split('=')[1])
  assert leaves(a)==leaves(b)
  assert isinstance(a,ast.BinOp) and isinstance(a.left,ast.BinOp) and isinstance(a.left.op,ast.Mult)
  assert isinstance(b,ast.BinOp) and isinstance(b.right,ast.BinOp) and isinstance(b.right.op,ast.Mult)
  assert not isinstance(a.right,ast.BinOp) and not isinstance(b.left,ast.BinOp)
  chosen=one([o for o in options if o=='көбейтудің терімділік қасиеті'])
 elif i==11:
  for o in options:
   left,right=clean(o).split('=');assert polynomial(left)==polynomial(right),o
  chosen=one([o for o in options if commutative(o)])
 else:raise AssertionError(i)
 if chosen is None and options:chosen=one([o for o in options if expr(o)==value])
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert expr(r['answer'])==value,(i,r['answer'],value)
 return value
def chains(r):
 count=0
 for m in re.finditer(r'[0-9(\-][0-9\s,×+/:−()=\-]*',r['solution']):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if any(not b.strip() or re.search(r'[+×:/−-]\s*$',b) for b in bits):continue
  # Do not read the numeric tail of a symbolic equation such as7b =(-7)×b.
  before=r['solution'][:m.start()]
  if re.search(r'[a-z]\s*[=×]\s*$',before):continue
  vs=[expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count
def run():
 rows=read(BATCH)['editions'];assert len(rows)==13;entries=[];bad=eq=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']])
  assert cap['status']=='captured' and raw['checked'] and raw['solution'] and not raw.get('images')
  assert norm(raw['statement']).lower()!=norm(r['statement']).lower();solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(r,i);eq+=chains(r)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_actual_printed_Fraction_AST_polynomial_identity_and_syntactic_property_roles','notes':['Read all saved/new conditions, full official/authored solutions and all MCQs; no authorparams or solver imported.','Preserved efficient1/10/100 pairs, sign parity/zero, coefficient versus literal expression, sign-changing non-equivalence and signed missing factor.','Exact polynomial expansion verifies every general identity; structural AST distinguishes commutativity from associativity, even when all alternatives are mathematically true.']})
 canaries=[(0,'31','32'),(1,'(-13)','(-14)'),(2,'(-7b)','(-8b)'),(3,'× 0 ×','× 1 ×'),(4,'(-7a)','(-8a)'),(5,'(-11)','(-12)'),(6,'25 × 17 × 4','(-25) × 17 × 4'),(7,'(-4)','4'),(8,'(-9)','(-8)'),(9,'23','24'),(10,'(6 × 7)','(7 × 6)'),(11,'p × q = q × p','p × q = p × q'),(12,'(-43)','(-44)')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);field='options' if i in(6,11) else 'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field];r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed/role canary accepted',i))
 witnesses=0
 for a in range(-20,21):
  for b in range(-20,21):
   for c in range(-10,11):
    x,y,z=F(a,4),F(b,5),F(c,2)
    assert (x*y)*z==x*(y*z) and x*y==y*x and x*(y+z)==x*y+x*z
    assert (x*y*z>0)-(x*y*z<0)==((x>0)-(x<0))*((y>0)-(y<0))*((z>0)-(z<0));witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-multiplication-properties.py','savedConditionsChecked':13,'newConditionsChecked':13,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivensAndSyntacticRoleCanariesRejected':rejected,'exactRationalGroupingSignWitnesses':witnesses,'numericSolutionEqualityChains':eq,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':13,'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
