"""Independent all12 opposite-sign sums: actual printed Fraction/AST and signed ledgers.
Full saved/new condition, full official/new solution and everyMCQ read; no authorsolver.
"""
import ast,copy,hashlib,json,math,re
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-opposite-sign-sums.json';REPORT='problems/editorial/reviews/grade6-opposite-sign-sums.json'
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
def one(a):assert len(a)==1,a;return a[0]
def numbers(s):return[F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:,\d+)?',clean(s))]
def options(row):return[o['text'] if isinstance(o,dict) else o for o in row.get('options',[]) or[]]
def norm(s):return re.sub(r'\s+',' ',clean(s)).strip()
def printed_sum(s):
 s=clean(s)
 if ':' in s:s=s.split(':',1)[1]
 if 'қосынды' in s:s=s.split('қосынды',1)[0]
 if '. Жауапқа' in s:s=s.split('. Жауапқа',1)[0]
 return s.strip().rstrip('.')
def addends(s):
 t=clean(s).replace(',','.');n=ast.parse(t,mode='eval').body;assert isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add)
 return expr(ast.get_source_segment(t,n.left)),expr(ast.get_source_segment(t,n.right))
def solve(row,i,source=False):
 s=clean(row['statement']);os=options(row);answer=None;exact=None
 if i==6:
  exact=one([o for o in os if expr(o)<0]);assert any(expr(o)==0 for o in os)
  assert all(a*b<0 for a,b in map(addends,os))
 elif i==9:
  a,b=addends(printed_sum(s));total=a+b;assert a<0<b
  exact=one([o for o in os if norm(o)==('теріс' if total<0 else 'оң' if total>0 else 'қосынды нөл')])
 elif i==11:
  start,topup=numbers(s);assert start<0<topup and topup>abs(start);answer=start+topup
  assert answer>0 and answer+abs(start)==topup
 else:
  total=printed_sum(s);a,b=addends(total);assert a*b<0;answer=expr(total)
  assert (answer<0)==(abs(a if a<0 else b)>abs(a if a>0 else b))
  if i==1:assert a<0<b and answer<0
  if i==2:
   n1,d1,n2,d2=map(int,one(re.findall(r'-\((\d+)/(\d+)\)\s*\+\s*\((\d+)/(\d+)\)',total)))
   assert d1!=d2 and 0<n1<d1 and 0<n2<d2
   cross=-n1*d2+n2*d1;denom=d1*d2;g=math.gcd(abs(cross),denom)
   assert g>1 and answer==F(cross,denom) and answer<0
   chosen=one([o for o in os if expr(o)==answer]);nn,dd=map(int,one(re.findall(r'\((\d+)/(\d+)\)',clean(chosen))))
   assert math.gcd(nn,dd)==1 and F(-nn,dd)==answer
   if not source:assert 'Ортақ бөлім 10' in row['solution'] and '5 санына қысқартсақ' in row['solution']
  if i==3:assert -1<a<0<b and answer.denominator==1 and answer>0 and b%1==abs(a)%1
  if i==4:
   assert a>0>b and abs(b)>a and a%1>abs(b)%1
   assert answer<0 and answer==-(abs(b)-a)
   assert (10*a).denominator==(10*abs(b)).denominator==1
   assert int(10*a)%10>int(10*abs(b))%10
  if i==5:assert a>0>b and abs(b)<10 and answer>0
  if i==7:assert 0<a<100 and -100<b<=-10 and a%10<abs(b)%10 and answer>0
  if i==8:assert a<0<b and answer>0
  if i==10:assert -100<a<=-10 and b>=100 and answer>0
  if i==12:assert a<0<b and abs(a)%1==b%1 and answer.denominator==1 and answer>0
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 elif os:
  exact=one([o for o in os if expr(o)==answer]);assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==answer,(i,row['answer'],answer)
 return answer

def chains(row):
 count=0
 for m in re.finditer(r'[-0-9(][-0-9\s,×+/:−()=<>]*',row['solution']):
  t=m[0].strip().rstrip(',');t=re.split(r',(?=\s)',t)[0]
  if not re.search('[=<>]',t) or t.count('(')!=t.count(')'):continue
  bits=re.split(r'([=<>])',t)
  if any(not b.strip() for b in bits[::2]):continue
  if any(re.search(r'[+×:/−-]\s*$',b) for b in bits[::2]):continue
  if re.search(r'[a-z]\s*[+−×-]\s*$',row['solution'][:m.start()]):continue
  vs=[expr(b) for b in bits[::2]];assert all({'=':a==b,'<':a<b,'>':a>b}[op] for a,op,b in zip(vs,bits[1::2],vs[1:])),t;count+=1
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
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_actual_printed_Fraction_AST_unlike_denominator_reduction_decimal_borrowing_and_signed_balance_ledger','notes':['Entire saved/new conditions, full official/authored solutions and all actualMCQs read. No author solver or params imported.','Independently checked opposite-sign magnitude order, common-denominator final reduction, decimal borrowing/cancellation, result versus expression versus sign, positive topup balance and whole mixed-number fraction cancellation.']})
 canaries=[(1,'-19 + 11','-19 + 12'),(2,'(1/5)','(2/5)'),(3,'4,8','5,8'),(4,'6,8','6,7'),(5,'31 + (-9)','31 + (-8)'),(6,'-17 + 8','-17 + 18'),(7,'58 + (-39)','59 + (-39)'),(8,'-8 + 21','-8 + 22'),(9,'-13 + 6','-13 + 16'),(10,'-47 + 120','-48 + 120'),(11,'800 тг','900 тг'),(12,'(5 + (2/5))','(6 + (2/5))')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i-1]);field='options' if i==6 else'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field],(i,old);r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 witnesses=0
 for ai in range(1,101):
  for bi in range(1,101):
   for den in(1,10,100):
    a,b=-F(ai,den),F(bi,den);total=a+b
    assert (total>0)==(abs(b)>abs(a)) and (total<0)==(abs(a)>abs(b)) and (total==0)==(abs(a)==abs(b))
    assert abs(total)==abs(abs(a)-abs(b));witnesses+=1
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-opposite-sign-sums.py','savedConditions':12,'newConditions':12,'wrongKeysRejected':bad,'printedGivenCanariesRejected':rejected,'exactOppositeSignWitnesses':witnesses,'numericSolutionEqualityComparisonChains':eq,'fullSavedNewSolutionsAndEveryChoiceRead':True,'authorSolverImported':False},'entries':entries}
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**report['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
