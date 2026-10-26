"""Independent full12 saved/new percent-change editorial review.
Actual printed Fraction AST and mass/unit/base ledgers, no authorparams/solver.
All complete source/new conditions, solutions and every MCQ read.
"""
import ast,copy,hashlib,json,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-percent-changes.json'
REPORT='problems/editorial/reviews/grade6-percent-changes.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\,','').replace('\\%','%')
 s=re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
 return s.replace('³','**3').replace('^','**')
def expr(s):
 t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(t,n))
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return -walk(n.operand) if isinstance(n.op,ast.USub) else walk(n.operand)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  if isinstance(n.op,ast.Pow):assert b.denominator==1 and 0<=b<=3;return a**int(b)
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def one(xs):assert len(xs)==1,xs;return xs[0]
def numbers(s):return [F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:,\d+)?',clean(s))]
def number(s):return one(numbers(s))
def os(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def solve(r,i,source=False):
 s=clean(r['statement']);ns=numbers(s);options=os(r);value=None;chosen=None
 if i==0:
  p=one(ns);assert 0<p<100;value=1+p/100
  assert number(options[1])==p/100 and number(options[3])==1-p/100
 elif i==1:
  p,m,added=ns if source else [ns[1],ns[0],ns[2]];assert 0<p<100 and m>0 and added>0
  oldSalt=m*p/100;newSalt=oldSalt+added;newMass=m+added;value=newSalt/newMass*100
  assert newSalt<=newMass and value>p
  assert number(options[2])==newSalt
  if not source:assert number(options[1])==added/m*100
 elif i==2:
  p,new=ns;value=new/(1+p/100)
  assert number(options[1])==new*(1-p/100) and number(options[2])==new*(1+p/100)
 elif i==3:
  assert 'таза су' in s
  chosen=one([o for o in options if o=='тұздың массасы'])
  # Conservation: adding water w>0 changes(S,W) to(S,W+w). S is identical;
  # total increases and S/(S+W+w)<S/(S+W) for S>0. Check printed example too.
  example=r['solution'].split('Мысалы',1)[1];v=numbers(example)
  if source:
   m,p,salt,water,salt2,percent=v;assert salt==salt2==m*p/100 and percent==salt/(m+water)*100
  else:
   m,p,salt,water,salt2,newMass,percent=v;assert salt==salt2==m*p/100 and newMass==m+water and percent==salt/newMass*100
 elif i==4:
  p,q=ns;assert p==q and 0<p<100;factor=(1-p/100)*(1+q/100);value=(1-factor)*100
  assert value==p*p/100 and value>0
  chosen=one([o for o in options if numbers(o)==[value] and 'арзандады' in o])
 elif i in(5,6,11):
  initial,p,*extra=ns
  if i==5:
   if source:assert extra==[2]
   else:assert not extra and 'Екі жылдан' in s
  else:assert extra==[p]
  factor=1-p/100 if i==6 else 1+p/100
  stage=initial*factor;value=stage*factor
  assert stage.denominator==value.denominator==1
  assert value!=initial*(1+(-2 if i==6 else 2)*p/100)
 elif i==7:
  initial,p,*extra=ns
  if source:assert extra==[3]
  else:assert not extra and 'Үш жылдан' in s
  value=initial*(1+p/100)**3;chosen=one([o for o in options if expr(o)==value])
  t=clean(chosen).replace(',','.').replace('×','*');node=ast.parse(t,mode='eval').body
  assert isinstance(node,ast.BinOp) and isinstance(node.op,ast.Mult)
  assert isinstance(node.right,ast.BinOp) and isinstance(node.right.op,ast.Pow)
  assert expr(ast.get_source_segment(t,node.left))==initial
  assert expr(ast.get_source_segment(t,node.right.left))==1+p/100
  assert expr(ast.get_source_segment(t,node.right.right))==3
  assert expr(options[0])==initial*(1+3*p/100)
  assert expr(options[1])==initial*(1+p/100)*3
  assert expr(options[3])==initial*(p/100)**3
 elif i==8:
  initial,p,q=ns;value=initial*p/100*q/100
 elif i==9:
  p,q=ns;value=p*q/100
  assert number(options[0])==q and number(options[1])==p-q and number(options[2])==p+q
  if not source:assert 'ҚЫЗДАРДЫҢ' in s and 'бүкіл сыныптың' in s
 elif i==10:
  p,q=ns;value=((1+p/100)*(1+q/100)-1)*100
  assert value==p+q+p*q/100 and number(options[0])==p+q
 else:raise AssertionError(i)
 if chosen is None and options:chosen=one([o for o in options if number(o)==value])
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert number(r['answer'])==value,(i,r['answer'],value)
 return value
def chains(r):
 count=0
 for m in re.finditer(r'[0-9(\-][0-9\s,×+/:−()=³\-]*',r['solution'].replace('%','')):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if any(not b.strip() or re.search(r'[+×:/−-]\s*$',b) for b in bits):continue
  vs=[expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count
def run():
 rows=read(BATCH)['editions'];assert len(rows)==12;entries=[];bad=eq=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']])
  assert cap['status']=='captured' and raw['checked'] and raw['solution'] and not raw.get('images')
  assert norm(raw['statement']).lower()!=norm(r['statement']).lower();solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(r,i);eq+=chains(r)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_actual_printed_exact_Fraction_base_mass_conservation_sequential_changes_and_expression_role_AST','notes':['Read all saved/new conditions, complete official/authored solutions and every MCQ; no author params or solver imported.','Asked multiplier/original amount/final amount/net percent/expression retained. Pure-salt addition changes both masses; pure-water addition preserves salt mass.','New/current base on every stage, down-then-up loss, compound two/three changes, whole-class nested shares and integer population ledgers independently recomputed. Hypothetical math, no claimed actual financial terms.']})
 canaries=[(0,'18%','19%'),(1,'80 г таза тұз','81 г таза тұз'),(2,'246400','246512'),(3,'тұздың массасы','судың массасы'),(4,'20%','30%'),(5,'500000','500100'),(6,'2500','1250'),(7,'750000','760000'),(8,'800','900'),(9,'80%','60%'),(10,'25%','20%'),(11,'6400','8000')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);field='options' if i==3 else 'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field];r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed/role canary accepted',i))
 # Numeric equality cannot substitute for the requested expression role.
 wrong=copy.deepcopy(rows[7]);wrong['answer']='944784'
 try:solve(wrong,7)
 except AssertionError:rejected+=1
 else:raise AssertionError('Numeric amount accepted as expression')
 witnesses=0
 for p in range(1,100):
  for q in range(1,100):
   f=F(p,100);g=F(q,100)
   assert (1-f)*(1+f)==1-f*f
   assert (1+f)*(1+g)-1==f+g+f*g
   assert (1+f)**2-(1+2*f)==f*f
   assert (1-f)**2-(1-2*f)==f*f;witnesses+=1
 for mass in range(1,101):
  for p in range(1,100):
   salt=F(mass*p,100);water=mass-salt;added=F(3,2)
   assert salt/(mass+added)<salt/mass and water+added>water
   newSalt=salt+added;assert newSalt/(mass+added)>salt/mass
   assert (newSalt/(mass+added))*(mass+added)==newSalt;witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-percent-changes.py','savedConditionsChecked':12,'newConditionsChecked':12,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivensAndRequestedExpressionCanariesRejected':rejected,'exactRationalChangeAndConservationWitnesses':witnesses,'numericSolutionEqualityChains':eq,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':12,'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
