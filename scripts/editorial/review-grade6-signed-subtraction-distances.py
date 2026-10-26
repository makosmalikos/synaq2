"""Independent full24 saved/new subtraction/distance review.
Own actual-printed Fraction/modulus AST, ordered-addend role and distance sign branches.
No authorparams/solver imported. All fullconditions, complete solutions and everyMCQ read.
"""
import ast,copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-signed-subtraction-distances.json';REPORT='problems/editorial/reviews/grade6-signed-subtraction-distances.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\left','').replace('\\right','')
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
def expr(s):
 t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(t,n))
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.UAdd,ast.USub));return -walk(n.operand) if isinstance(n.op,ast.USub) else walk(n.operand)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def modulus_expr(s):
 def repl(m):
  v=abs(expr(m[1]));return f'({v.numerator}/{v.denominator})'
 t=re.sub(r'\|([^|]+)\|',repl,clean(s));assert '|' not in t;return expr(t)
def one(xs):assert len(xs)==1,xs;return xs[0]
def numbers(s):return[F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:,\d+)?',clean(s))]
def options(row):return[o['text'] if isinstance(o,dict) else o for o in row.get('options',[]) or[]]
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def math_start(s):
 s=clean(s)
 for marker in('айырм','өрнег','мәні'):
  if marker in s:s=s.split(marker,1)[0]
 return s.strip().rstrip('.')
def addends(s):
 t=clean(s).replace(',','.');n=ast.parse(t,mode='eval').body;assert isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add)
 return expr(ast.get_source_segment(t,n.left)),expr(ast.get_source_segment(t,n.right))
def coordinate_values(s):
 s=clean(s);out=[]
 for m in re.finditer(r'\b[A-Z]\s*\(',s):
  start=m.end();depth=1;i=start
  while depth:
   assert i<len(s);depth+=int(s[i]=='(')-int(s[i]==')');i+=1
  out.append(expr(s[start:i-1]))
 return out

def distance(a,b):
 # Definition proof: if a<=b then b−a; otherwise a−b. Both equal|a−b|.
 d=b-a if a<=b else a-b;assert d>=0 and d==abs(a-b)==abs(b-a);return d

def solve(row,i,source=False):
 s=clean(row['statement']);os=options(row);answer=None;exact=None
 if i==1:
  a,b=numbers(s);assert a>0 and b>0
  exact=one([o for o in os if addends(o)==(a,-b)]);assert expr(exact)==a-b
 elif i in(2,3,4,5,7,8,9,11,12):
  total=math_start(s);answer=expr(total)
  if i in(2,5,7):assert answer>0
  if i in(4,8,9,11):assert answer<0
  if i==3:
   assert 0<answer<1 and expr(os[2])==1/answer and expr(os[0])==-answer
  if i==8:assert answer.denominator==1
  if i==11:
   f1,f2=re.findall(r'\((\d+)/(\d+)\)',total);a,b=map(int,f1);c,d=map(int,f2);assert b==d and c>a and math.gcd(c-a,b)>1
   chosen=one([o for o in os if expr(o)==answer]);num,den=map(int,one(re.findall(r'\((\d+)/(\d+)\)',clean(chosen))));assert math.gcd(num,den)==1 and F(-num,den)==answer
  if i==12:assert answer==0
 elif i in(6,21):
  a,b=numbers(s);answer=distance(a,b);assert a*b<0
  if i==21 and not source:assert 'ШАРТТЫ' in s and not any(name in s for name in('Қарағие','Хан Тәңірі'))
 elif i in(10,13,14,16,17,18,19,22):
  a,b=coordinate_values(s);answer=distance(a,b)
  if i in(10,22):assert a<b<0 and answer!=abs(a)+abs(b)
  else:assert a*b<0 and answer==abs(a)+abs(b)
  if i==13:assert answer.denominator==1 and abs(a).denominator>1 and b.denominator>1
  if i in(16,17):assert answer.denominator==1
 elif i==15:
  center=one(coordinate_values(s));center2,d=numbers(s);assert center==center2 and d>0;roots={center-d,center+d}
  # The two real branches x>=center and x<center exhaust |x−center|=d.
  assert len(roots)==2 and all(distance(x,center)==d for x in roots)
  exact=one([o for o in os if set(numbers(o))==roots])
 elif i==20:
  # Independent definition proof across the two possible endpoint orders.
  exact=one([o for o in os if re.sub(r'\s+','',clean(o))=='|a-b|'])
  for a,b in((F(-3),F(3)),(F(1),F(4)),(F(2),F(2))):
   expected=distance(a,b)
   if a==b:assert expected==0
  assert F(-3)+F(3)!=distance(F(-3),F(3))
  assert abs(F(-3))-abs(F(3))!=distance(F(-3),F(3))
  assert F(1)-F(4)<0
 elif i==23:
  def true(o):
   left,right=norm(o).split('=');return modulus_expr(left)==modulus_expr(right)
  exact=one([o for o in os if true(o)]);a,b=numbers(s);assert a<0<b;assert distance(a,b)==distance(b,a)
 elif i==24:
  a,b=coordinate_values(s);expected=distance(a,b);exact=one([o for o in os if modulus_expr(o)==expected]);assert norm(exact).startswith('|') and norm(exact).endswith('|')
 else:raise AssertionError(i)
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 elif os:
  exact=one([o for o in os if expr(o)==answer]);assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==answer,(i,row['answer'],answer)
 return answer

def chains(row):
 count=0
 for m in re.finditer(r'[|0-9(\-][|0-9\s,×+/:−()=\-]*',row['solution']):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('|')%2 or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if any(not b.strip() or re.search(r'[+×:/−-]\s*$',b) for b in bits):continue
  if re.search(r'[a-z]\s*[+−×-]\s*$',row['solution'][:m.start()]):continue
  vs=[modulus_expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count

def run():
 rows=read(BATCH)['editions'];assert len(rows)==24;entries=[];bad=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert norm(raw['statement']).lower()!=norm(row['statement']).lower();solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i);eq+=chains(row)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_actual_printed_Fraction_modulus_AST_ordered_addend_role_and_two_real_distance_branch_proofs','notes':['Read entire saved/new conditions, complete official/authored solutions and all actualMCQs; no authorparams or solver imported.','Exact signed subtraction versus nonnegative distance, proper fraction reciprocal/reduction, tenths, both-negative/opposite-side/reversed endpoints, two real point solutions and generic coincident0 formula checked.','Adapted geographical heights explicitly hypothetical, no fabricated named-landmark elevation fact.']})
 canaries=[(1,'8 − 15','9 − 15'),(2,'(-43)','(-44)'),(3,'(3/11)','(4/11)'),(4,'-4,6','-4,7'),(5,'(-14)','(-15)'),(6,'+5 м','+6 м'),(7,'(-37)','(-38)'),(8,'-3,7','-3,8'),(9,'-12 − 5','-13 − 5'),(10,'C(-17)','C(-18)'),(11,'(3/10)','(4/10)'),(12,'-13 − (-13)','-13 − (-14)'),(13,'K(-(5/6))','K(-(7/6))'),(14,'E(-3,2)','E(-3,3)'),(15,'дәл 5 бірлік','дәл 6 бірлік'),(16,'A(-4,5)','A(-5,5)'),(17,'M(3,6)','M(3,7)'),(18,'P(-21)','P(-22)'),(19,'B(4)','B(5)'),(20,'|a − b|','|a + b|'),(21,'+6420 м','+6421 м'),(22,'C(-13)','C(-14)'),(23,'|-9 − 2| = |2 − (-9)|','|-9 − 2| = |2 − 9|'),(24,'A(-6)','A(-7)')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i-1]);field='options' if i in(20,23) else'statement'
  if field=='options':assert any(old in o for o in r[field]),(i,old);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field],(i,old);r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed/role canary accepted',i))
 # Same sum, wrong starting-addend role is rejected separately.
 r=copy.deepcopy(rows[0]);r['options'][0]='-15 + 8';r['answer']=r['options'][0];assert expr(r['answer'])==expr(rows[0]['answer'])
 try:solve(r,1)
 except AssertionError:rejected+=1
 else:raise AssertionError('Wrong first-addend role accepted')
 witnesses=0
 for ai in range(-50,51):
  for bi in range(-50,51):
   for den in(1,2,10,100):
    a,b=F(ai,den),F(bi,den);d=distance(a,b);assert d==distance(b,a);assert d==0 if a==b else d>0
    assert a-b==a+(-b) and (a-b)+b==a;witnesses+=1
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-signed-subtraction-distances.py','savedConditions':24,'newConditions':24,'wrongKeysRejected':bad,'printedGivenAndRoleCanariesRejected':rejected,'exactSignedEndpointWitnesses':witnesses,'numericSolutionEqualityChains':eq,'fullSavedNewConditionsSolutionsEveryChoiceRead':True,'authorSolverImported':False},'entries':entries}
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**report['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
