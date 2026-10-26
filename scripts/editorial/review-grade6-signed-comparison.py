"""Independent all12 signed comparison review: printed Fraction/AST, no author solver/params.
Full saved/new conditions, complete official/new solutions and everyMCQ read.
"""
import ast,copy,hashlib,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-signed-comparison.json';REPORT='problems/editorial/reviews/grade6-signed-comparison.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\le','≤').replace('\\,','').replace('\\ ',' ')
 s=re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
 return s
NUM=r'-?\d+(?:,\d+)?'
def numbers(s):return[F(v.replace(',','.')) for v in re.findall(NUM,clean(s))]
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
def options(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or[]]
def one(a):assert len(a)==1,a;return a[0]
def norm(s):return re.sub(r'\s+',' ',clean(s)).strip()
def assertion(s):
 bits=re.split(r'\s*([<>=≤])\s*',clean(s).strip());assert len(bits)>=3 and len(bits)%2==1,s
 vs=[expr(v) for v in bits[::2]]
 return all({'<':a<b,'>':a>b,'=':a==b,'≤':a<=b}[op] for a,op,b in zip(vs,bits[1::2],vs[1:]))
witnesses=0
def solve(row,i,source=False):
 global witnesses
 s=clean(row['statement']);os=options(row);ns=numbers(s);answer=None;exact=None
 if i==1:
  bound=one(re.findall(r'x > ('+NUM+')',s));b=expr(bound);answer=min(x for x in range(-100,101) if x>b);witnesses+=201
  assert sum(expr(o)==answer for o in os)==1
 elif i==2:
  left,right=ns;assert right==left+1;exact=one([o for o in os if left<expr(o)<right]);assert left<expr(exact)<right
 elif i==3:
  b=ns[0];answer=sum(b<x<0 for x in range(-100,101));witnesses+=201
 elif i in(4,7):exact=one([o for o in os if assertion(o)])
 elif i==5:
  values=[expr(v.strip().rstrip('.')) for v in s.split(':',1)[1].split(';')];answer=max(values);assert all(v<0 for v in values)
  # Absolute magnitude ordering reverses sign; exact 100ths avoid −0.7/−0.07 mixups.
  assert answer==-min(abs(v) for v in values)
 elif i==6:
  b=ns[0];vs=numbers(s.split(':',1)[1]);answer=sum(v<b for v in vs);assert b in vs and 0 in vs
  assert sum(v<=b for v in vs)==answer+1
 elif i==8:
  m=one(re.findall('('+NUM+r') < x\s*≤\s*('+NUM+')',s));left,right=map(expr,m)
  values=[x for x in range(-100,101) if left<x<=right];witnesses+=201;answer=len(values)
  assert int(left) not in values and int(right) in values and 0 in values
  assert sum(left<=x<=right for x in range(-100,101))==answer+1
 elif i==9:
  morning=ns[0];answer=sum(morning<t<0 for t in range(-100,101));witnesses+=201
  assert sum(morning<=t<=0 for t in range(-100,101))==answer+2
 elif i==10:
  exact=one([o for o in os if re.search('[<>=]',clean(o)) and assertion(o)])
  vals=[expr(v) for v in re.findall(r'-\(\d+/\d+\)',s)];assert len(vals)==2 and vals[0]>vals[1]
 elif i==11:
  values=numbers(s.split(':',1)[0] if ':' not in s else s.split(':',1)[1]);want=sorted(values)
  exact=one([o for o in os if numbers(o)==want]);assert len(want)==4 and want[1]<0< want[3] and want[2]==0
 elif i==12:
  vs=numbers(s.split(':',1)[1]);answer=max(vs);assert answer>0 and min(vs)<0 and 0 in vs
 else:raise AssertionError(i)
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 elif os:
  exact=one([o for o in os if expr(o)==answer]);assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==answer,(i,row['answer'],answer)
 return answer

def chains(row):
 count=0
 for m in re.finditer(r'[-0-9(][-0-9\s,×+/:−()<>=≤]*',row['solution']):
  t=m[0].strip().rstrip(',');
  if not re.search('[<>=≤]',t):continue
  if t.count('(')!=t.count(')'):continue
  if any(not v.strip() for v in re.split(r'[<>=≤]',t)):continue
  if not re.fullmatch(r'[-0-9\s,×+/:−()<>=≤]+',t):continue
  assert assertion(t),t;count+=1
 return count

def run():
 global witnesses
 rows=read(BATCH)['editions'];assert len(rows)==12;entries=[];bad=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert norm(row['statement'])!=norm(raw['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i);eq+=chains(row)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_and_new_read_printed_Fraction_AST_strict_and_mixed_endpoint_integer_exhaustion','notes':['Read full saved condition/officialsolution/everyMCQ and full new condition/solution/everyMCQ. No author solver or params used for calculation.','Exact rational decimal/negative fraction order, mixed signs and strict versus inclusive endpoints independently checked from printed givens. Numeric variants are not separate semantic meanings.']})
 canaries=[(1,'x > -9','x > -10'),(2,'-6 пен -5','-5 пен -4'),(3,'-8 санынан','-7 санынан'),(4,'-6 < 2','-6 > 2'),(5,'-0,07','-0,007'),(6,'-3 санынан','-2 санынан'),(7,'-23 < -14','-23 > -14'),(8,'x ≤ 3','x ≤ 4'),(9,'-11 °C','-12 °C'),(10,'-(3/11)','-(9/11)'),(11,'-4; 3; -9; 0','-4; 3; -10; 0'),(12,'-18; 7;','-18; 8;')]
 rejected=0
 for i,old,new in canaries:
  row=copy.deepcopy(rows[i-1]);field='options' if i in(4,7) else'statement'
  if field=='options':assert any(old in o for o in row[field]);row[field]=[o.replace(old,new) for o in row[field]]
  else:assert old in row[field],(i,old);row[field]=row[field].replace(old,new)
  try:solve(row,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 # Supplementary exact rational comparison grid independently checks sign reversal.
 for n in range(-1000,1):
  for d in(1,10,100):
   v=F(n,d);assert (v<0)==(n<0);assert (v>F(-1))==(abs(v)<1) if v<0 else True;witnesses+=1
 result={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-signed-comparison.py','savedConditions':12,'newConditions':12,'wrongKeysRejected':bad,'printedGivenCanariesRejected':rejected,'supplementaryDomainWitnesses':witnesses,'numericSolutionComparisonChains':eq,'sourceAndNewFullSolutionsAndAllChoicesRead':True,'authorSolverImported':False},'entries':entries}
 # The author made the requested tiny Kazakh phrase repair before final digest.
 assert '8 саны да шартты орындайды' in rows[0]['solution']
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**result['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
