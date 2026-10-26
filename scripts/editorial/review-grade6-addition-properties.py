"""Independent full14 addition-properties review: numeric Fraction AST, syntax and affine identities.
All saved/new full conditions/solutions/everyMCQ read. No author solver/params imported.
"""
import ast,copy,hashlib,json,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-addition-properties.json';REPORT='problems/editorial/reviews/grade6-addition-properties.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\left','').replace('\\right','').replace('\\square','□')
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
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def statementnorm(s):return norm(s).lower()
def printed_sum(s):
 s=clean(s)
 if ':' in s:s=s.split(':',1)[1]
 if 'қосынды' in s:s=s.split('қосынды',1)[0]
 if '. Жауапқа' in s:s=s.split('. Жауапқа',1)[0]
 return s.strip().rstrip('.')
def affine(s):
 t=re.sub(r'(\d)([ab])',r'\1*\2',clean(s)).replace('×','*').replace(',','.').strip()
 def walk(n):
  if isinstance(n,ast.Name):return {'a':(F(1),F(0),F(0)),'b':(F(0),F(1),F(0))}[n.id]
  if isinstance(n,ast.Constant):return(F(0),F(0),F(n.value))
  if isinstance(n,ast.UnaryOp):return tuple(-v for v in walk(n.operand))
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return tuple(x+y for x,y in zip(a,b))
  if isinstance(n.op,ast.Sub):return tuple(x-y for x,y in zip(a,b))
  if isinstance(n.op,ast.Mult):
   assert not any(a[:2]) or not any(b[:2]);return tuple(v*b[2] for v in a) if not any(b[:2]) else tuple(v*a[2] for v in b)
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def identity(o):
 a,b=norm(o).split('=');return affine(a)==affine(b)
def syntax(n):
 if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add):return('+',syntax(n.left),syntax(n.right))
 return('number',expr(ast.unparse(n)))
def property_role(o):
 a,b=norm(o).split('=');assert expr(a)==expr(b),'All numerical identity options must be true'
 lhs,rhs=map(lambda s:syntax(ast.parse(s.strip(),mode='eval').body),(a,b))
 if lhs[0]==rhs[0]=='+' and lhs[1][0]==lhs[2][0]==rhs[1][0]==rhs[2][0]=='number' and lhs[1]==rhs[2] and lhs[2]==rhs[1] and lhs[1]!=lhs[2]:return'commutative'
 if lhs[0]==rhs[0]=='+' and lhs[1][0]=='+' and rhs[2][0]=='+' and (lhs[1][1],lhs[1][2],lhs[2])==(rhs[1],rhs[2][1],rhs[2][2]):return'associative'
 return'other'

def solve(row,i,source=False):
 s=clean(row['statement']);os=options(row);answer=None;exact=None
 if i==2:
  exact=one([o for o in os if not identity(o)]);left,right=map(affine,norm(exact).split('='));assert left!=(right)
  # Both original a and new2a versions hold at a=0, so claim is not universal,
  # not "never true". A nonzero a supplies a valid counterexample.
  assert left[2]==right[2] and left[1]==right[1]==0 and left[0]!=right[0]
 elif i in(4,12):
  wanted='associative' if i==4 else'commutative';exact=one([o for o in os if property_role(o)==wanted]);assert {property_role(o) for o in os}>={'associative','commutative','other'}
 elif i==5:
  values=numbers(printed_sum(s));assert len(values)==3;eligible=[]
  for o in os:
   vs=numbers(o)
   if len(vs)!=2:continue
   assert all(v in values for v in vs);assert vs[0]!=vs[1]
   if sum(vs)%10==0:eligible.append(o)
  exact=one(eligible)
 elif i==7:
  a,b=map(int,numbers(s));assert a<0<b;answer=sum(range(a,b+1));assert b==-a+1
  assert sum(range(a,b))==0 and sum(range(a+1,b+1))!=answer
 elif i==11:
  a,b,right=numbers(s);answer=a+b-right;assert a<0<b and right==b and answer==a
 elif i==14:exact=one([o for o in os if expr(o)==0])
 else:
  total=printed_sum(s);answer=expr(total);vs=numbers(total)
  if i==1:assert vs[0]==-vs[1] and vs[2]<0 and answer==vs[2]
  if i==3:
   fractions=[expr(v) for v in re.findall(r'-?\(\d+/\d+\)',total)];assert len(fractions)==3 and fractions[0]==-fractions[2] and answer==fractions[1]
  if i==6:assert (vs[0]+vs[2]).denominator==1 and vs[0]<0 and vs[2]<0 and vs[1]>0 and vs[3]>0
  if i==8:assert (vs[0]+vs[2]).denominator==1 and answer<0 and vs[1]>0
  if i==9:assert vs[0]+vs[2]==-100
  if i==10:assert vs[0]==-vs[2] and answer==vs[1]
  if i==13:assert vs[0]>0>vs[1] and vs[2]>0>vs[3]
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 elif os:
  exact=one([o for o in os if expr(o)==answer]);assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==answer,(i,row['answer'],answer)
 return answer

def chains(row):
 count=0
 for m in re.finditer(r'[-0-9(][-0-9\s,×+/:−()=]*',row['solution']):
  t=m[0].strip().rstrip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if any(not b.strip() or re.search(r'[+×:/−-]\s*$',b) for b in bits):continue
  if re.search(r'[a-z]\s*[+−×-]\s*$',row['solution'][:m.start()]):continue
  vs=[expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count

def run():
 rows=read(BATCH)['editions'];assert len(rows)==14;entries=[];bad=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert statementnorm(raw['statement'])!=statementnorm(row['statement']),'Case-only source wording is not a new statement'
  solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i);eq+=chains(row)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_actual_printed_Fraction_AST_syntactic_property_role_affine_identity_and_integer_pairing_proofs','notes':['Whole saved/new conditions, full official/authored solutions and everyMCQ read. No authorparams or solver imported.','Every numeric property identity option is true; selection independently uses AST grouping/order role, not numeric truth. Affine coefficient comparison distinguishes non-universal2a from an identity while preserving a=0 exception.']})
 canaries=[(1,'+ 18,4','+ 19,4'),(2,'= 2a','= 0'),(3,'+ (3/8).','+ (4/8).'),(4,'(-6 + 11) + (-5) = -6 + (11 + (-5))','-6 + 11 = 11 + (-6)'),(5,'(-13)','(-12)'),(6,'(-0,65)','(-0,75)'),(7,'13 санына','14 санына'),(8,'-4,8','-4,9'),(9,'-35','-34'),(10,'-57 + 86','-58 + 86'),(11,'-18 + 41','-19 + 41'),(12,'-9 + 7 = 7 + (-9)','-9 + 0 = -9'),(13,'38 + (-14)','39 + (-14)'),(14,'-11 + 4 + 7','-12 + 4 + 7')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i-1]);field='options' if i in(2,4,12,14) else'statement'
  if field=='options':assert any(old in o for o in r[field]),(i,old);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field],(i,old);r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed/role canary accepted',i))
 witnesses=0
 for a in range(-20,21):
  for b in range(-20,21):
   for c in range(-5,6):
    x,y,z=F(a,7),F(b,11),F(c,13);assert x+y==y+x and (x+y)+z==x+(y+z) and x+(-x)==0 and x+0==x;witnesses+=1
 assert 'екеуін де теріс' in rows[0]['solution']
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-addition-properties.py','savedConditions':14,'newConditions':14,'wrongKeysRejected':bad,'printedGivenAndSyntacticRoleCanariesRejected':rejected,'exactRationalPropertyWitnesses':witnesses,'numericSolutionEqualityChains':eq,'fullSavedNewSolutionsAndEveryChoiceRead':True,'authorSolverImported':False,'reviewedWordingFixes':'Two property-recognition questions independently reworded beyond uppercase; negative-pair misconception says both negative.'},'entries':entries}
 if '--write' in __import__('sys').argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),**report['evidence']},ensure_ascii=False))
if __name__=='__main__':run()
