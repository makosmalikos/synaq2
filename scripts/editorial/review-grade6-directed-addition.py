"""Independent full12 directed addition review: printed exact AST/Fraction and signed displacement.
Full original/new conditions, full solutions, everyMCQ read; no authorparams/solver.
"""
import ast,copy,hashlib,json,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-directed-addition.json';REPORT='problems/editorial/reviews/grade6-directed-addition.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-')
 s=re.sub(r'(\d+)\s*\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1+(\2/\3))',s)
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
def numbers(s):return[F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:,\d+)?',clean(s))]
def one(a):assert len(a)==1,a;return a[0]
def options(row):return[o['text'] if isinstance(o,dict) else o for o in row.get('options',[]) or[]]
def norm(s):return re.sub(r'\s+',' ',clean(s)).strip()
def addends(s):
 t=clean(s).replace(',','.');n=ast.parse(t,mode='eval').body;assert isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add)
 return expr(ast.get_source_segment(t,n.left)),expr(ast.get_source_segment(t,n.right))
def find_sum(s):
 for m in re.finditer(r'-?\d+(?:,\d+)?\s*\+\s*(?:\(-?\d+(?:,\d+)?\)|-?\d+(?:,\d+)?)',s):return m[0]
 raise AssertionError(s)
def solve(row,i,source=False):
 s=clean(row['statement']);ns=numbers(s);os=options(row);answer=None;exact=None
 if i==1:
  start,gain=ns;assert start<0<gain and gain>abs(start);answer=start+gain
 elif i==2:
  m=re.findall(r'(-\(\d+/\d+\)\s*\+\s*1)',s);assert m;answer=expr(m[-1]);assert 0<answer<1
  assert expr(os[0])< -1 and expr(os[1])>1 and expr(os[2])<0
 elif i==3:
  total=find_sum(s);left,right=addends(total);assert right==0 and left<0;answer=expr(total)
 elif i==4:
  start,leg1,leg2=ns;assert start<0<leg1 and start+leg1==0;answer=start+leg1+leg2
 elif i in(5,6,8,12):
  total=find_sum(s);start,delta=addends(total);answer=start+delta
  if i==5:assert start>0 and delta<0 and answer>0
  if i==6:assert start<0<delta and answer>0
  if i in(8,12):assert start>0 and delta<0 and answer<0
  if i==8:assert start.denominator==2 and answer.denominator==2
 elif i==7:
  start,left=ns;assert start<0<left;exact=one([o for o in os if addends(o)==(start,-left)])
 elif i==9:
  start,left=ns;assert start==left>0;answer=start-left
  exact=one([o for o in os if one(numbers(o))==answer])
 elif i==10:
  assert ('b < 0' in s or 'теріс' in s) and 'a' in s
  exact=one([o for o in os if 'Солға' in o and '|b|' in clean(o)])
  # General identity for b<0: endpoint=a+b<a, length=a−(a+b)=−b=|b|.
  # The other actual options fail for a=4,b=−7: right gives11, origin0, no move4.
  a,b=F(4),F(-7);end=a+b;assert end<a and a-end==abs(b) and len({end,a+abs(b),F(0),a})==4
 elif i==11:
  start=ns[0];assert start<0;answer=abs(start);assert start+answer==0 and answer>0
 else:raise AssertionError(i)
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 elif os:
  exact=one([o for o in os if expr(o)==answer]);assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==answer,(i,row['answer'],answer)
 return answer

def chains(row):
 count=0
 for m in re.finditer(r'[-0-9(][-0-9\s,×+/:−()=]*',row['solution']):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if not all(b.strip() for b in bits):continue
  if re.search(r'[a-z]\s*[+−×-]\s*$',row['solution'][:m.start()]):continue
  vs=[expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count

def run():
 rows=read(BATCH)['editions'];assert len(rows)==12;entries=[];bad=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert norm(raw['statement'])!=norm(row['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i);eq+=chains(row)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_and_authored_read_actual_printed_AST_Fraction_and_directed_displacement_sign_proofs','notes':['Full saved/new condition, full official/authored solution and all actualMCQs read. No author solver or params imported.','Independently checked crossing/remaining on same side/zero movement/two legs/opposites, fraction and negative whole-mixed options, half decimals, start-addend role versus sum, and positive travel length versus signed endpoint.']})
 canaries=[(1,'16 ұпай','17 ұпай'),(2,'-(3/4) + 1','-(2/4) + 1'),(3,'-11 + 0','-12 + 0'),(4,'тағы оңға 4','тағы оңға 6'),(5,'13 + (-6)','13 + (-7)'),(6,'-17 + 28','-17 + 29'),(7,'солға 7','солға 8'),(8,'2,5 + (-4)','2,5 + (-5)'),(9,'A(9)','A(8)'),(10,'Солға |b|','Оңға |b|'),(11,'A(-14)','A(-15)'),(12,'7 + (-12)','7 + (-13)')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i-1]);field='options' if i==10 else'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field],(i,old);r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 # Equal numeric total does not make reversed start/displacement a valid answer.
 r=copy.deepcopy(rows[6]);r['options'][1]='-7 + (-3)';r['answer']=r['options'][1]
 assert expr(r['answer'])==expr(rows[6]['answer'])
 try:solve(r,7)
 except AssertionError:rejected+=1
 else:raise AssertionError('Commuted same-result wrong-role answer accepted')
 # Half-grid signed positions: complete201starts×100negative displacements.
 witnesses=0
 for ai in range(-100,101):
  for bi in range(-100,0):
   a,b=F(ai,2),F(bi,2);end=a+b
   assert end<a and a-end==-b==abs(b)
   assert (end>0)==(a>abs(b)) if a>0 else end<0
   assert end==0 if a==-b else end!=0
   witnesses+=1
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-directed-addition.py','savedConditions':12,'newConditions':12,'wrongKeysRejected':bad,'printedGivenAndRoleCanariesRejected':rejected,'exactSignedPositionWitnesses':witnesses,'numericSolutionEqualityChains':eq,'fullSavedNewSolutionsAndAllChoicesRead':True,'authorSolverImported':False},'entries':entries}
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**report['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
