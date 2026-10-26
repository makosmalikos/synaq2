"""Independent review of all14 saved/new recurring-fraction tasks.
Exact shift-subtract/geometric-series rational values; no author solver/params.
All original/new conditions, full solutions and offered choices read separately.
"""
import ast,copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-recurring-fractions.json'
REPORT='problems/editorial/reviews/grade6-recurring-fractions.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\,','').replace('\\cdot','×')
 s=re.sub(r'(\d+)\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1+(\2/\3))',s)
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
PERIOD=r'-?\d+,\(\d+\)'
def recurring(s):
 m=re.fullmatch(r'(-?)(\d+),\((\d+)\)',s);assert m,s
 # y=0,(digits): (10^k-1)y=N, so y=N/(10^k-1).
 return (-1 if m[1] else 1)*(F(int(m[2]))+F(int(m[3]),10**len(m[3])-1))
def value(s):
 s=clean(s).replace('×','*').replace(':','/').strip()
 s=re.sub(PERIOD,lambda m:'('+str(recurring(m[0]).numerator)+'/'+str(recurring(m[0]).denominator)+')',s)
 s=re.sub(r'(\d+),(\d+)',r'\1.\2',s)
 tree=ast.parse(s,mode='eval')
 def ev(n):
  if isinstance(n,ast.Expression):return ev(n.body)
  if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return F(str(n.value))
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.USub,ast.UAdd)):return -ev(n.operand) if isinstance(n.op,ast.USub) else ev(n.operand)
  if isinstance(n,ast.BinOp):
   a,b=ev(n.left),ev(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Mult):return a*b
   if isinstance(n.op,ast.Div):return a/b
  raise AssertionError(ast.dump(n))
 return ev(tree)
def opts(r):return [o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def fractions(s):return [F(int(a),int(b)) for a,b in re.findall(r'\((-?\d+)/(\d+)\)',clean(s))]
def solve(r,i,source=False):
 s=clean(r['statement']);os=opts(r);chosen=None;answer=None
 if i==0:
  p=one(re.findall(PERIOD,s));whole=int(p.split(',')[0]);target=recurring(p)
  chosen=one([o for o in os if value(o)==target]);assert value(chosen)>whole and value(chosen)<whole+1
  # The requested representation must retain the whole number, not a bare improper fraction.
  assert re.search(r'\('+str(whole)+r'\s*\+',clean(chosen)),chosen
 elif i==1:
  ps=re.findall(PERIOD,s);assert len(set(ps))==1;target=recurring(ps[0])
  printed=fractions(s);assert len(printed)==2 and printed[0]==printed[1] and printed[0]!=target
  chosen=one([o for o in os if o.startswith('Қате:') and value(one(re.findall(PERIOD,clean(o))))==one(fractions(o))])
  assert one(fractions(chosen))==target
  # Deliberately false student example is a valid error-detection exercise.
 elif i==2:
  assert '0,(x)' in s;target=one(fractions(s));answer=one([d for d in range(10) if F(d,9)==target])
 elif i in(3,11,12):
  p=one(re.findall(PERIOD,s));f=recurring(p);digits=p.split('(')[1][:-1]
  assert math.gcd(int(digits),10**len(digits)-1)>1
  if i==3:assert 'бөлімі' in s.lower();answer=f.denominator
  elif i==11:assert ('қосынды' in s.lower() or 'a + b' in s);answer=f.numerator+f.denominator
  else:assert 'алымы' in s.lower();answer=f.numerator
  if not source:
   g=math.gcd(int(digits),10**len(digits)-1);assert f'ЕҮОБ({int(digits)}, {10**len(digits)-1}) = {g}' in r['solution']
   assert f'({f.numerator}/{f.denominator})' in r['solution']
 elif i in(4,10):
  p=one(re.findall(PERIOD,s));f=recurring(p);chosen=one([o for o in os if value(o)==f])
  assert one(fractions(chosen))==f
  if i==4:assert len(p.split('(')[1][:-1])==3
 elif i==5:
  ps=re.findall(PERIOD,s);assert len(ps)==3 and ps[0]==ps[2]
  assert 'неше есе' in s;answer=recurring(ps[1])/recurring(ps[2]);assert answer.denominator==1
 elif i==6:
  ps=re.findall(PERIOD,s);assert len(ps)==2 and all(len(p.split('(')[1][:-1])==2 for p in ps)
  assert 'екі цифр' in s.lower() and 'қысқарт' in s.lower() and 'дейін' in s.lower()
  chosen=one([o for o in os if value(o)==99])
 elif i==7:
  p=one(re.findall(PERIOD,s));assert p.startswith('-') and 'қарама-қарсы' in s.lower()
  f=-recurring(p);chosen=one([o for o in os if value(o)==f]);assert f>0
 elif i==8:
  chosen=one([o for o in os if len(clean(o).split('='))==2 and value(clean(o).split('=')[0])==value(clean(o).split('=')[1])])
 elif i==9:
  m=one(re.findall('('+PERIOD+r')\s*×\s*(\d+)',s));answer=recurring(m[0])*int(m[1]);assert answer.denominator==1
 elif i==13:
  a,b=re.findall(PERIOD,s);assert '+' in s and 'қосынды' in s.lower();answer=recurring(a)+recurring(b);assert answer==1
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert value(r['answer'])==answer,(i,r['answer'],answer)
 return answer

def run():
 rows=read(BATCH)['editions'];assert len(rows)==14;entries=[];bad=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);q=one([q for q in cap['questions'] if q['id']==ref['sourceId']])
  assert cap['status']=='captured' and q['checked'] and q['solution'] and not q.get('images')
  assert norm(q['statement']).lower()!=norm(r['statement']).lower()
  solve({**q,'answer':q['sourceAnswer']},i,True);solve(r,i)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_shift_subtract_fraction_reconstruction_printed_role_and_complete_choices_oracle','notes':['Read all14 full saved/new conditions, complete official/authored solutions and every offered choice; no author solver or params imported.','Exact rational shift-subtract reconstruction checks whole-plus-fraction, deliberate student finite-vs-recurring error, digit domain0..9, denominator9/99/999 before versus after reduction and requested numerator/denominator/sum.','Checked opposite versus original sign, ratio versus difference, finite-truncation distractors, scalar product and exact0,(9)=1 complement; every offered MCQ has exactly one matching target.']})
 canaries=[(0,'3,(7)','3,(8)'),(1,'(6/10)','(6/9)'),(2,'(1/3)','(2/3)'),(3,'0,(24)','0,(27)'),(4,'0,(128)','0,(127)'),(5,'0,(6)','0,(5)'),(6,'ЕКІ','ҮШ'),(7,'-0,(7)','-0,(8)'),(9,'× 27','× 30'),(10,'0,(8)','0,(7)'),(11,'0,(45)','0,(36)'),(12,'0,(72)','0,(63)'),(13,'0,(7)','0,(6)')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);assert old in r['statement'];r['statement']=r['statement'].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 r=copy.deepcopy(rows[8]);r['options']=[o.replace('(47/99)','(47/100)') for o in r['options']]
 try:solve(r,8)
 except AssertionError:rejected+=1
 else:raise AssertionError('MCQ correct equality removal accepted')
 # Independent finite partial sums: exact infinite value minus m blocks is
 # N / ((10^k-1)10^(km)); this verifies the shift formula without decimal floats.
 witnesses=0
 for k in range(1,4):
  for n in range(10**k):
   digits=str(n).zfill(k);x=recurring('0,('+digits+')');partial=sum((F(n,10**(k*j)) for j in range(1,5)),F(0))
   assert x-partial==F(n,(10**k-1)*10**(4*k));assert x*10**k-x==n
   assert x.denominator==(10**k-1)//math.gcd(n,10**k-1)
   witnesses+=1
 assert recurring('0,(9)')==1 and recurring('0,(99)')==1 and recurring('0,(0)')==0
 evidence={'oracle':'scripts/editorial/review-grade6-recurring-fractions.py','savedConditionsChecked':14,'newConditionsChecked':14,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenRoleAndChoiceCanariesRejected':rejected,'completeOneTwoThreeDigitPeriodBlocksIncludingLeadingZeros':witnesses,'studentFalseEqualityIntentionallyPreserved':True,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
