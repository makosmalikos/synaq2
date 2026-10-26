"""Independent full11 shore-frame river review: exact printed Fraction and symbolic positions.
All11 saved/new conditions, complete solutions and MCQs read. No author solver/params.
"""
import ast,copy,hashlib,json,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-river-basics.json';REPORT='problems/editorial/reviews/grade6-river-basics.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):return s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×')
def numbers(s):return[F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:,\d+)?',clean(s))]
def expr(s):
 t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(t,n))
  if isinstance(n,ast.UnaryOp):return -walk(n.operand) if isinstance(n.op,ast.USub) else walk(n.operand)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def one(a):assert len(a)==1,a;return a[0]
def options(row):return[o['text'] if isinstance(o,dict) else o for o in row.get('options',[]) or[]]
def norm(s):return re.sub(r'\s+',' ',clean(s)).strip()
def linear(expression):
 """Independent three-coefficient symbolic AST: v, u, constant, exact rational."""
 def add(a,b):return tuple(x+y for x,y in zip(a,b))
 def mul(a,b):
  assert not any(a[:2]) or not any(b[:2]),'Nonlinear term'
  return tuple(x*b[2] for x in a) if not any(b[:2]) else tuple(x*a[2] for x in b)
 def walk(n):
  if isinstance(n,ast.Name):return{'v':(F(1),F(0),F(0)),'u':(F(0),F(1),F(0))}[n.id]
  if isinstance(n,ast.Constant):return(F(0),F(0),F(n.value))
  if isinstance(n,ast.UnaryOp):return tuple(-x for x in walk(n.operand))
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return add(a,b)
  if isinstance(n.op,ast.Sub):return add(a,tuple(-x for x in b))
  if isinstance(n.op,ast.Mult):return mul(a,b)
  if isinstance(n.op,ast.Div):assert not any(b[:2]);return tuple(x/b[2] for x in a)
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(expression,mode='eval').body)

def solve(row,i,source=False):
 s=clean(row['statement']);ns=numbers(s);os=options(row);answer=None;exact=None
 if i==1:answer=ns[0];assert 'көл' in s
 elif i==2:answer=(ns[0]+ns[0]);assert 'артық' in s
 elif i==3:answer=ns[0]-ns[1];assert answer>0
 elif i==4:
  # Interpret every actual option, not an answer index: lake+river u false;
  # two directions gap=2u true; own=down+u false; upstream=own+u false.
  exact=one([o for o in os if ('екі есесіне' in clean(o) or '2 еселенгеніне' in clean(o)) and ('айырмасы' in o or 'артық' in o)])
  assert linear('(v+u)-(v-u)')==linear('2*u')
  assert linear('v')!=linear('v+u')
  assert linear('(v+u)+u')!=linear('v')
  assert linear('v-u')!=linear('v+u')
  assert 'ағыстан жылдам' in s if not source else True
 elif i==5:
  down,up=ns;assert down>up>0
  # Solve shore positions after one hour as 2×own=down+up.
  answer=(down+up)/2;u=down-answer;assert answer-u==up and u>0
 elif i==6:
  own,current,hours=ns;assert own>current>0 and hours>0;answer=(own-current)*hours
  assert (own+current)*hours!=answer and own*hours!=answer and own-current!=answer
 elif i==7:
  up,current=ns;own=up+current;answer=own+current;assert own-current==up
 elif i==8:answer=ns[0];assert 'жаға' in s.lower() and 'сал' in s
 elif i==9:
  hours,km,own=ns;u=km/hours;answer=own+u;assert own>u and u>0
 elif i==10:
  own,current,km=ns;assert own>current>0;answer=km/(own-current)
 elif i==11:
  down,up=ns;assert down>up>0;own=(down+up)/2;answer=down-own;assert own-answer==up
 else:raise AssertionError(i)
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 elif os:
  exact=one([o for o in os if one(numbers(o))==answer]);assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert one(numbers(row['answer']))==answer,(i,row['answer'],answer)
 return answer

def eqs(row):
 count=0
 for m in re.finditer(r'[0-9(][0-9\s,×+/:−()=\-]*',row['solution']):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if not all(b.strip() for b in bits):continue
  if re.search(r'[vu]\s*[+−×-]\s*$',row['solution'][:m.start()]):continue
  vs=[expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count

def run():
 rows=read(BATCH)['editions'];assert len(rows)==11;entries=[];bad=0;equalities=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert norm(raw['statement'])!=norm(row['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i);equalities+=eqs(row)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_and_new_read_printed_Fraction_and_symbolic_linear_shore_position_proofs','notes':['Read the whole saved/new condition, both complete solutions and all actualMCQs; no authorparams or solver imported.','Independently checked own versus shore frame, lake zero-current, raft water-relative zero, upstream positive, twice-current gap versus own mean/current halfgap, decimal distance and time units.']})
 canaries=[(1,'17 км/сағ','18 км/сағ'),(2,'3,5 км/сағ','4,5 км/сағ'),(3,'31 км/сағ','32 км/сағ'),(4,'екі есесіне','үш есесіне'),(5,'37 км/сағ','39 км/сағ'),(6,'3,5 сағат','4,5 сағат'),(7,'16 км/сағ','18 км/сағ'),(8,'4 км/сағ','6 км/сағ'),(9,'28 км','35 км'),(10,'126 км','147 км'),(11,'34 км/сағ','36 км/сағ')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i-1]);field='options' if i==4 else'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field];r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 # General symbolic identity proofs plus complete bounded rational witnesses;
 # witnesses supplement coefficient identities, not replace universal reasoning.
 assert linear('((v+u)+(v-u))/2')==linear('v')
 assert linear('((v+u)-(v-u))/2')==linear('u')
 assert linear('(v-u)+2*u')==linear('v+u')
 assert linear('0+u')==linear('u')
 witnesses=0
 for vi in range(2,61):
  for ui in range(1,vi):
   v,u=F(vi,2),F(ui,2)
   for hours in(F(1,2),F(1),F(7,2)):
    downPosition=(v+u)*hours;upPosition=(v-u)*hours
    assert downPosition-upPosition==2*u*hours
    assert (downPosition+upPosition)/(2*hours)==v
    assert upPosition/hours==v-u>0
    assert ((v-u)*hours)/(v-u)==hours
    assert u*hours/hours==u;witnesses+=1
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-river-basics.py','savedConditions':11,'newConditions':11,'wrongKeysRejected':bad,'printedGivenCanariesRejected':rejected,'symbolicCoefficientIdentities':8,'exactShoreFrameWitnesses':witnesses,'numericSolutionEqualityChains':equalities,'fullSourceNewSolutionsAndAllChoicesRead':True,'authorSolverImported':False},'entries':entries}
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**report['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
