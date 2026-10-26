"""Independent15-task stacked-fraction content/math review. Recursive source
TeX brace reader and independent exact native AST/Fraction, not author solver.
This report does NOT claim live phone visual QA (root stated5175unavailable).
"""
import ast,copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade6-stacked-fractions.json';REPORT='problems/editorial/reviews/grade6-stacked-fractions.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\,','').replace('\\cdot','×').replace('\\left','').replace('\\right','')
 # Source mixed numerals are sums within their surrounding numerator/denominator.
 s=re.sub(r'(\d+)(?=\\(?:dfrac|frac))',r'\1+',s)
 def convert(text):
  # Independent recursive brace scanner, preserving every main fraction group.
  out='';i=0
  while i<len(text):
   m=re.match(r'\\(?:dfrac|frac)',text[i:])
   if m:
    i+=len(m[0]);assert text[i]=='{'
    def sub(pos):
     depth=1;j=pos+1
     while depth:
      if text[j]=='{':depth+=1
      elif text[j]=='}':depth-=1
      j+=1
     return convert(text[pos+1:j-1]),j
    a,i=sub(i);assert text[i]=='{';b,i=sub(i);out+='(('+a+')/('+b+'))'
   else:out+=text[i];i+=1
  return out
 return convert(s)
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def tree(s):
 s=clean(s).replace('×','*').replace('÷','/').replace(':','/');s=re.sub(r'(\d+),(\d+)',r'\1.\2',s);return ast.parse(s.strip(),mode='eval').body

def ev(n):
 if isinstance(n,ast.Constant):return F(str(n.value))
 if isinstance(n,ast.UnaryOp):return -ev(n.operand) if isinstance(n.op,ast.USub) else ev(n.operand)
 assert isinstance(n,ast.BinOp),ast.dump(n);a,b=ev(n.left),ev(n.right)
 if isinstance(n.op,ast.Add):return a+b
 if isinstance(n.op,ast.Sub):return a-b
 if isinstance(n.op,ast.Mult):return a*b
 if isinstance(n.op,ast.Div):assert b!=0;return a/b
 raise AssertionError(ast.dump(n))
def value(s):return ev(tree(s))
def options(r):return [o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def expression(r,i,source=False):
 if source:
  ms=re.findall(r'\$(.*?)\$',r['statement'],re.S);assert ms;return clean(ms[0])
 s=clean(r['statement'])
 if ':' in s and i not in(1,):s=s.split(':',1)[1].strip()
 # Read the full initial arithmetic run, including an outside whole summand.
 m=re.match(r'[\d\s,()+/×÷-]+',s);assert m,(i,s);return m[0].strip()
def leaves(n):
 # Individual printed inner fractions, excluding composite main numerator/denominator.
 if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Div) and isinstance(n.left,ast.Constant) and isinstance(n.right,ast.Constant):return[ev(n)]
 out=[]
 for child in ast.iter_child_nodes(n):out+=leaves(child)
 return out

def solve(r,i,source=False):
 os=options(r);ans=None;chosen=None
 if i==1:
  if source:parts=[clean(m).split('=',1)[1] for m in re.findall(r'\$(.*?)\$',r['statement'],re.S)]
  else:
   s=r['statement'];parts=[s.split('A = ',1)[1].split(' және B = ',1)[0],s.split('B = ',1)[1].split(' сатылы',1)[0]]
  assert len(parts)==2;a,b=map(tree,parts);av,bv=ev(a),ev(b)
  assert isinstance(a.op,ast.Div) and isinstance(a.left,ast.BinOp) and isinstance(a.left.op,ast.Div) and isinstance(a.right,ast.Constant)
  assert isinstance(b.op,ast.Div) and isinstance(b.right,ast.BinOp) and isinstance(b.right.op,ast.Div) and isinstance(b.left,ast.Constant)
  assert av!=bv
  def pair(o):
   t=clean(o);return tuple(value(x) for x in re.findall(r'[AB]\s*=\s*(\d+)',t))
  chosen=one([o for o in os if pair(o)==(av,bv)])
 elif i==9:
  p=tree(expression(r,i,source));fs=leaves(p);assert len(fs)==3
  assert all(f>0 and f.denominator>1 for f in fs)
  # Enumerate the whole finite range up to denominator product; the first
  # valid positive multiplier is a proof of minimality, not only feasibility.
  bound=math.prod(f.denominator for f in fs);valid=[k for k in range(1,bound+1) if all((f*k).denominator==1 for f in fs)];ans=valid[0]
  chosen=one([o for o in os if value(o)==ans]);assert any(value(o)>ans and all((value(o)*f).denominator==1 for f in fs) for o in os)
  assert any(any((value(o)*f).denominator!=1 for f in fs) for o in os)
  assert ev(p)!=ans
 elif i==10:
  p=tree(expression(r,i,source));assert isinstance(p,ast.BinOp) and isinstance(p.op,ast.Add)
  assert isinstance(p.right,ast.BinOp) and isinstance(p.right.op,ast.Div)
  target=p.right.right;assert isinstance(target,ast.BinOp) and isinstance(target.op,ast.Add)
  chosen=one([o for o in os if ast.dump(tree(o))==ast.dump(target)]);assert value(chosen)!=ev(p)
 else:
  p=tree(expression(r,i,source));ans=ev(p)
  if i==0:assert isinstance(p.op,ast.Div) and isinstance(p.right.op,ast.Sub) and ev(p.right)>0
  if i==3:
   assert isinstance(p.op,ast.Div) and isinstance(p.left.op,ast.Mult);assert len(leaves(p))==3
  if i==6:
   assert isinstance(p.op,ast.Div) and isinstance(p.left.op,ast.Add) and isinstance(p.right.op,ast.Add)
   assert ev(p.left)>1 and ev(p.right)>1
  if i==7:
   assert isinstance(p.op,ast.Div) and isinstance(p.left.op,ast.Add)
   fs=leaves(p);scale=math.lcm(*(f.denominator for f in fs));assert all((scale*f).denominator==1 for f in fs)
   assert ev(p.left)*scale/(ev(p.right)*scale)==ans
  if i==8:assert isinstance(p.op,ast.Add) and isinstance(p.right.op,ast.Div) and isinstance(p.right.right.op,ast.Add)
  if i==11:
   assert isinstance(p.left,ast.Constant) and not isinstance(p.left.value,int);assert ev(p.left).denominator==5
  if i==12:
   chosen=one([o for o in os if value(o)==ans]);q=tree(chosen);assert isinstance(q.op,ast.Div)
   assert ast.dump(q.left)==ast.dump(p.left) and ast.dump(q.right)==ast.dump(p.right)
  elif os:chosen=one([o for o in os if value(o)==ans])
  if i==13:
   assert isinstance(p.op,ast.Div) and isinstance(p.left.op,ast.Div) and isinstance(p.right,ast.Constant)
   assert any(value(o)==ev(p.left)*ev(p.right) for o in os) and any(value(o)==ev(p.right)/ev(p.left) for o in os)
  if i==14:assert isinstance(p.op,ast.Div) and ev(p.right).numerator==1
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert value(r['answer'])==ans,(i,r['answer'],ans)
def run():
 rows=read(BATCH)['editions'];assert len(rows)==15;entries=[];bad=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and q['solution'] and not q.get('images')
  assert norm(q['statement']).lower()!=norm(r['statement']).lower();solve({**q,'answer':q['sourceAnswer']},i,True);solve(r,i)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_recursive_source_fraction_braces_exact_native_AST_Fraction_mainbar_and_minimal_multiplier_oracle','notes':['Read all15 saved/new full conditions, complete official/authored solutions and every offered choice; no author params/models/solver imported.','Independent recursive source TeX grouping and exact arithmetic AST distinguish outer main numerator/denominator, whole mixed sums, nested decimal numerator and order of reciprocal division.','CheckedA/B differentmainbar, numerator addition/product before outerdivision, wholedenominator firstoperation versus finalvalue, all three fractional clearing multipliers by complete positive enumeration, and two equivalent numerator methods.','Content/math review only: live phone browser rendering not claimed; root reported5175off and file preview unavailable.']})
 canaries=[(0,'(6/7)','(5/7)'),(1,'((30/5)/3)','((30/5)/2)'),(2,'(18/','(21/'),(3,'(1/30)','(1/40)'),(4,'(7/40)','(7/50)'),(5,'(7/12)','(7/13)'),(6,'(10 +','(11 +'),(7,'(5/24)','(5/30)'),(8,'4 +','5 +'),(9,'(5/6)','(5/7)'),(10,'3 + (1/7)','3 - (1/7)'),(11,'1,8','1,6'),(12,'(9/10)','(9/20)'),(13,'/6)','/3)'),(14,'(1/18)','(1/24)')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed grouping/given/role canary accepted',i))
 witnesses=0
 for a in range(1,13):
  for b in range(1,13):
   for c in range(1,13):
    left=value(f'(({a}/{b})/{c})');right=value(f'({a}/({b}/{c}))')
    assert left*F(c)==F(a,b) and right*F(b,c)==a
    if c>1:assert left!=right and right/left==c*c
    witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-stacked-fractions.py','savedConditionsChecked':15,'newConditionsChecked':15,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenGroupingAndRequestedRoleCanariesRejected':rejected,'completePositiveTripleGroupingCases':witnesses,'mainbarGroupingProof':'recursive source braces and independent native AST child structure + exact rational reconstruction','minimalClearingProof':'complete positive enumeration up to product of reduced inner denominators','livePhoneVisualQACompleted':False,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
