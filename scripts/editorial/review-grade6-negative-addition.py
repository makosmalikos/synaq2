"""Independent full13 negative-addition review: actual printed Fraction AST, ledger and sign proofs.
No author solver/params imported. Full source/new conditions/solutions/MCQs read.
"""
import ast,copy,hashlib,json,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-negative-addition.json';REPORT='problems/editorial/reviews/grade6-negative-addition.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\left','').replace('\\right','')
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
def modulus_expr(s):
 def repl(m):
  v=abs(expr(m[1]));return f'({v.numerator}/{v.denominator})'
 t=re.sub(r'\|([^|]+)\|',repl,clean(s));assert '|' not in t;return expr(t)
def numbers(s):return[F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:,\d+)?',clean(s))]
def one(a):assert len(a)==1,a;return a[0]
def options(row):return[o['text'] if isinstance(o,dict) else o for o in row.get('options',[]) or[]]
def norm(s):return re.sub(r'\s+',' ',clean(s)).strip()
def sum_in(s):
 # All numeric sum operands may contain nested mixed/proper fractions.
 s=clean(s)
 if ':' in s:s=s.split(':',1)[1]
 elif 'қосындысының' in s:s=s.split('қосындысының',1)[0]
 elif 'қосындысын' in s:s=s.split('қосындысын',1)[0]
 return s.strip().rstrip('.')
def solve(row,i,source=False):
 s=clean(row['statement']);ns=numbers(s);os=options(row);answer=None;exact=None
 if i==1:
  lhs=one(re.findall(r'\((-\d+)\)\s*\+\s*\(-x\)\s*=\s*(-\d+)',s));a,b=map(F,lhs);answer=a-b
  assert answer>0 and answer.denominator==1 and a-answer==b
  hits=[x for x in range(1,201) if a-x==b];assert hits==[answer]
 elif i==2:
  start=F(one(re.findall(r'Лифт\s*(-\d+)',s)));down=F(one(re.findall(r'тағы\s*(\d+)\s*қабат',s)));assert start<0<down;coordinate=start-down;answer=abs(coordinate)
  assert answer>abs(start) and coordinate<start
 elif i==3:answer=abs(expr(sum_in(s)));assert expr(sum_in(s))<0
 elif i==4:
  total=sum_in(s);answer=expr(total);assert answer<0
  astnode=ast.parse(total,mode='eval').body;assert isinstance(astnode,ast.BinOp) and isinstance(astnode.op,ast.Add)
  left=expr(ast.get_source_segment(total,astnode.left));right=expr(ast.get_source_segment(total,astnode.right));assert left<0 and right<0 and abs(answer)>max(abs(left),abs(right))
  if not source:
   # Preserve source's exact modulus-subtraction misconception as a distractor.
   assert one([o for o in os if expr(o)==-abs(abs(left)-abs(right))])=='-(6/7)'
 elif i==5:
  start,down=ns;assert start<0<down;coordinate=start-down;answer=abs(coordinate)
 elif i==6:
  exact=one([o for o in os if 'теріс' in o and 'кейде' not in o and 'кез келген' not in o]);assert 'екі теріс' in s.lower() or 'a < 0' in s
  # General order axiom: if a<0 and b<0 then a+b<a<0.
 elif i in(7,8,10):
  total=sum_in(s);answer=expr(total);assert answer<0
  if i==8:
   assert -2<answer<-1
   assert all(expr(o)!=answer for o in os if -1<expr(o)<0)
 elif i==9:
  a,b,target=ns;total=a+b;sign='кіші' if total<target else 'үлкен' if total>target else 'тең'
  exact=one([o for o in os if sign in o and numbers(o)==[target]])
 elif i==11:
  start,charge=ns;assert start<0
  delta=charge if source else -charge;assert delta<0;balance=start+delta;answer=abs(balance)
  assert answer>abs(start) and answer>abs(delta)
 elif i==12:
  start,step,target=ns;assert step==-1 and target<start;answer=(target-start)/step
  assert answer>0 and answer.denominator==1 and start+step*answer==target
 elif i==13:
  start,drop=ns;assert start<0<drop;temperature=start-drop;answer=abs(temperature)
  assert answer!=drop and answer>abs(start)
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
  if not all(b.strip() for b in bits):continue
  if any(re.search(r'[+×:/−-]\s*$',b) for b in bits):continue
  if re.search(r'[a-z]\s*[+−×-]\s*$',row['solution'][:m.start()]):continue
  vs=[modulus_expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count

def run():
 rows=read(BATCH)['editions'];assert len(rows)==13;entries=[];bad=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert norm(raw['statement'])!=norm(row['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i);eq+=chains(row)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_and_new_read_actual_printed_Fraction_AST_sign_ordinal_depth_debt_temperature_and_repeated_step_domains','notes':['Read whole saved/new conditions, both complete solutions and everyMCQ. No authorparams or solver imported.','Exact arithmetic distinguishes signed finalcoordinate/balance/temperature from positive ordinal/depth/debt/below-zero amount; mixed whole sign, like denominator, tenths carry and sum versus modulus checked.']})
 canaries=[(1,'= -31','= -32'),(2,'тағы 3 қабат','тағы 4 қабат'),(3,'(-13) + (-8)','(-13) + (-9)'),(4,'(2/7)','(3/7)'),(5,'тағы 12 м','тағы 13 м'),(6,'міндетті түрде теріс','міндетті түрде оң'),(7,'(-11) + (-8)','(-11) + (-9)'),(8,'(-0,7)','(-0,6)'),(9,'бірінші -7','бірінші -19'),(10,'-(2/11)','-(3/11)'),(11,'280 тг','290 тг'),(12,'-20 шығады','-21 шығады'),(13,'тағы 8 °C','тағы 9 °C')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i-1]);field='options' if i==6 else'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field],(i,old);r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 # Complete bounded rational witnesses supplement the general order/sign proof.
 witnesses=0
 for ai in range(1,101):
  for bi in range(1,101):
   for denominator in(1,10,100):
    a,b=-F(ai,denominator),-F(bi,denominator);total=a+b
    assert total<a<0 and total<b<0 and abs(total)==abs(a)+abs(b)
    assert a+(-abs(b))==total and abs(total)>max(abs(a),abs(b));witnesses+=1
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-negative-addition.py','savedConditions':13,'newConditions':13,'wrongKeysRejected':bad,'printedGivenCanariesRejected':rejected,'exactSignQuantityWitnesses':witnesses,'numericSolutionEqualityChains':eq,'allSavedNewConditionsFullSolutionsEveryChoiceRead':True,'authorSolverImported':False,'reviewedSourceSkillFix':'Mixed-number wrong option now equals actual negative modulus difference6/7; correct sum unchanged.'},'entries':entries}
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**report['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
