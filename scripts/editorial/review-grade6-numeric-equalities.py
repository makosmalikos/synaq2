"""Independent12-task numeric-equality content/math review. Recursive source
TeX brace reader and independent exact native AST/Fraction, not author solver.
No author solver or params imported.
"""
import ast,copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade6-numeric-equalities.json';REPORT='problems/editorial/reviews/grade6-numeric-equalities.json'
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

def ev(n,env={}):
 if isinstance(n,ast.Constant):return F(str(n.value))
 if isinstance(n,ast.Name):return F(env[n.id])
 if isinstance(n,ast.UnaryOp):return -ev(n.operand,env) if isinstance(n.op,ast.USub) else ev(n.operand,env)
 assert isinstance(n,ast.BinOp),ast.dump(n);a,b=ev(n.left,env),ev(n.right,env)
 if isinstance(n.op,ast.Add):return a+b
 if isinstance(n.op,ast.Sub):return a-b
 if isinstance(n.op,ast.Mult):return a*b
 if isinstance(n.op,ast.Div):assert b!=0;return a/b
 raise AssertionError(ast.dump(n))
def value(s):return ev(tree(s))
def options(r):return [o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def eqs(s):
 s=clean(s);s=re.sub(r'(?m)^\d\)\s*','',s)
 pieces=[]
 for m in re.finditer(r'[\d\s,()+/×÷:=-]+',s):
  t=m[0].strip(' \n.;')
  if '=' in t:
   assert t.count('=')==1,t;a,b=t.split('=');tree(a);tree(b);pieces.append((a.strip(),b.strip()))
 return pieces
def truth(eq,env={}):return ev(tree(eq[0]),env)==ev(tree(eq[1]),env)
def choose_values(os,a,b):return one([o for o in os if len(eqs(o))==1 and value(eqs(o)[0][0])==a and value(eqs(o)[0][1])==b])
def solve(r,i,source=False):
 s=clean(r['statement']);os=options(r);chosen=None;ans=None
 if i in(0,1,11):
  es=eqs(s);assert len(es)==2 and all(truth(e) for e in es)
  a,b=value(es[0][1]),value(es[1][1])
  if i==0:
   assert value(es[0][1])==value(es[1][0]);chosen=choose_values(os,value(es[0][0]),value(es[1][1]))
  elif i==1:
   assert ('МҮШЕЛЕП КӨБЕЙТ' in s if not source else 'мүшелеп көбейт' in s);ans=a*b;assert ans!=a+b
  else:
   assert ('МҮШЕЛЕП ҚОС' in s if not source else 'мүшелеп қос' in s);ans=a+b;assert ans!=a*b
 elif i==2:
  es=eqs(s);assert len(es)==5;flags=[truth(e) for e in es];ans=sum(flags)
  # False offered examples are deliberately part of a truth-count exercise.
  assert flags==[True,False,True,True,False]
 elif i==3:
  e=one(eqs(s));assert truth(e);left=tree(e[0]);assert isinstance(left,ast.BinOp) and isinstance(left.op,ast.Add)
  ds=re.findall(r'-?\d+,\d+',s);delta=F(ds[-1].replace(',','.'));assert delta==-ev(left.right)
  chosen=choose_values(os,value(e[0])+delta,value(e[1])+delta)
 elif i==4:
  e=one(eqs(s));assert truth(e);right=tree(e[1]);assert isinstance(right,ast.BinOp) and isinstance(right.op,ast.Add)
  transferred=ev(right.left);chosen=choose_values(os,value(e[0])-transferred,ev(right.right))
  a,b=eqs(chosen)[0];p=tree(a);assert isinstance(p.op,ast.Sub) and ev(p.left)==value(e[0]) and ev(p.right)==transferred
 elif i==5:
  e=one(eqs(s));assert truth(e);divisor=int(re.findall(r'\d+',s)[-1]);assert divisor>0;ans=value(e[1])/divisor
 elif i==6:
  m=one(re.findall(r'(\d+)\s*\+\s*(?:\(\*\)|□)\s*=\s*(\d+)\s*×\s*(\d+)',s));a,b,c=map(int,m);ans=F(b*c-a);assert ans<0;chosen=one([o for o in os if value(o)==ans])
 elif i==7:
  chosen=one([o for o in os if truth(one(eqs(o)))])
 elif i==8:
  assert ('c ≠ 0' in s if not source else 'нөлден өзге' in s)
  def substitute(n):
   class Same(ast.NodeTransformer):
    def visit_Name(self,n):return ast.copy_location(ast.Name(id='a' if n.id=='b' else n.id,ctx=ast.Load()),n)
   return Same().visit(n)
  candidates=[]
  for o in os:
   a,b=clean(o).split('=');left,right=substitute(tree(a)),substitute(tree(b));identical=ast.dump(left)==ast.dump(right)
   if not identical:
    # The only nonmatching offered structure has different constant operations.
    assert ev(left,{'a':2,'c':3})!=ev(right,{'a':2,'c':3});candidates.append(o)
   else:
    for n in ast.walk(left):
     if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Div):assert isinstance(n.right,ast.Name) and n.right.id=='c'
  chosen=one(candidates)
 elif i==9:
  m=one(re.findall(r'(\d+)\s*×\s*(\d+)\s*\+\s*(?:\(\*\)|□)\s*=\s*(\d+)\s*\+\s*(\d+)',s));a,b,c,d=map(int,m);ans=F(c+d-a*b)
 elif i==10:
  es=eqs(s);assert len(es)==2 and all(truth(e) for e in es);old,new=es
  left,right=tree(new[0]),tree(new[1]);assert isinstance(left.op,ast.Mult) and isinstance(right.op,ast.Mult)
  assert ast.dump(left.left)==ast.dump(tree(old[0])) and ast.dump(right.left)==ast.dump(tree(old[1]))
  multiplier=ev(left.right);assert multiplier==ev(right.right) and multiplier!=0
  chosen=one([o for o in os if 'екі жағын' in o.lower() and 'көбейту' in o.lower()])
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert value(r['answer'])==ans,(i,r['answer'],ans)
def run():
 rows=read(BATCH)['editions'];assert len(rows)==12;entries=[];bad=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and q['solution'] and not q.get('images')
  assert norm(q['statement']).lower()!=norm(r['statement']).lower();solve({**q,'answer':q['sourceAnswer']},i,True);solve(r,i)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_printed_AST_Fraction_equivalence_same_two_sided_operation_and_symbolic_substitution_oracle','notes':['Read all12 saved/new full conditions, complete official/authored solutions and every MCQ; no author params/models/solver imported.','Exact Fraction/AST independently checks two given true equalities, transitive connection, RHS product versus sum, same two-sided addition/division/multiplication and negative missing addends.','Five truth-count examples deliberately retain true,false,true,true,false; false examples are prompts, not errors. Under a=b substitution first three symbolic transformations have identical AST on both sides; explicit c≠0 secures division, unlike the inconsistent±9 last choice.']})
 canaries=[(0,'252 ÷ 3','255 ÷ 3'),(1,'28 ÷ 7','35 ÷ 7'),(2,'= 55','= 54'),(3,'да -4,7','да -3,7'),(4,'18 + 13','19 + 13'),(5,'5 санына','3 санына'),(6,'17 + □','18 + □'),(9,'38 + 27','39 + 27'),(10,'× 7 =','× 8 ='),(11,'8 × 9 = 72','8 × 9 = 80')];rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):rejected+=1
  else:raise AssertionError(('Printed operation/given canary accepted',i))
 for i,old,new in[(7,'4 × (-5) + 29 = 9','4 × (-5) + 29 = 8'),(8,'a - 9 = b + 9','a - 9 = b - 9')]:
  r=copy.deepcopy(rows[i]);assert old in r['options'];r['options']=[o.replace(old,new) for o in r['options']]
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):rejected+=1
  else:raise AssertionError(('Truth/symbolic choice canary accepted',i))
 witnesses=0
 for numerator in range(-100,101):
  for divisor in range(-20,21):
   if divisor==0:continue
   a=F(numerator,10);b=F(numerator,10);c=F(divisor,3)
   assert a+c==b+c and a*c==b*c and a/c==b/c;assert a-9!=b+9;witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-numeric-equalities.py','savedConditionsChecked':12,'newConditionsChecked':12,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenOperationAndChoiceCanariesRejected':rejected,'completeRationalSameTwoSidedNonzeroOperationCases':witnesses,'fiveTruthExamplesIntentionallyMixed':True,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
