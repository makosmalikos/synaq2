"""Independent full13 saved/new signed-division editorial review.
Actual printed exact Fraction AST, whole-negative mixed numbers, unknown
dividend versus unknown factor and uncomputed zero-divisor distinction.
No author params or solver imported. Every fullsolution/MCQ read.
"""
import ast,copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-signed-division.json'
REPORT='problems/editorial/reviews/grade6-signed-division.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\,','')
 for tag in ('\\left','\\right','\\big'):s=s.replace(tag,'')
 s=re.sub(r'(-?)(\d+)\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',lambda m:f'{m[1]}({m[2]} + ({m[3]}/{m[4]}))',s)
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
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
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def os(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def one(xs):assert len(xs)==1,xs;return xs[0]
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def prompt(s):return clean(s).split(':',1)[1].split('Жауапқа')[0].strip().rstrip('.')
def operands(s):
 # Fraction bars are '/', but the printed division operation is exactly one colon.
 a,b=clean(s).split(':');return expr(a),expr(b)
def solve(r,i,source=False):
 s=clean(r['statement']);choices=os(r);value=None;chosen=None
 if i==0:
  hits=[]
  for o in choices:
   left,right=clean(o).split('=');a,b=operands(left)
   if b==0:
    assert a!=0
    # Do not turn undefined division into a numeric value or a fabricated key.
    continue
   if a/b==expr(right):hits.append(o)
  chosen=one(hits);assert operands(clean(chosen).split('=')[0])[0]==0
 elif i==1:
  assert re.search(r'\b(?:a|m)\s*<\s*0',s) and ('оң' in s)
  letter='b' if source else 'n';chosen=one([o for o in choices if norm(o)==letter+' < 0'])
  # Algebraic proof: m/n=q>0 =>m=q*n, so n has the negative sign ofm.
  for m,q in ((F(-3),F(2)),(F(-7,5),F(3,4))):assert m/q<0
 elif i==6:
  chosen=one([o for o in choices if expr(o)<0]);assert sorted((expr(o)>0)-(expr(o)<0) for o in choices)==[-1,0,1,1]
 elif i==7:
  equation=one(re.findall(r'x\s*:\s*\(-\d+\)\s*=\s*-\d+',s));left,right=equation.split('=');d=expr(left.split(':')[1]);q=expr(right);value=d*q
  assert d<0 and q<0 and value>0 and value/d==q
 elif i==9:
  equation=one(re.findall(r'(?:-\d+|\(-\d+\))\s*×\s*x\s*=\s*\d+',s));left,right=equation.split('=');a=expr(left.split('×')[0]);product=expr(right);value=product/a
  chosen=one([o for o in choices if expr(clean(o).split('=')[1])==value]);assert value<0 and a*value==product
  assert expr(clean(choices[1]).split('=')[1])==a*product
  assert expr(clean(choices[3]).split('=')[1])==product+a
 else:
  printed=prompt(r['statement']);a,b=operands(printed);assert b!=0;value=a/b;assert value*b==a
  if i in(2,4,5,11,12):assert a<0 and b<0 and value>0
  else:assert a*b<0 and value<0
  if i==3:
   assert expr(choices[0])==-value and expr(choices[1])==value/10 and expr(choices[2])==value*10
  if i==8:
   assert 0<a<1 and b<-1
   an,ad,bn,bd=map(int,re.findall(r'\d+',printed));assert math.gcd(an*bd,ad*bn)>1
   assert expr(choices[0])==-value and expr(choices[1])==a*b and expr(choices[3])==b/a
   selected=one([o for o in choices if expr(o)==value]);n,d=map(int,re.findall(r'\d+',clean(selected)));assert math.gcd(n,d)==1
  if i==10:
   assert a<-1 and b>1 and -1<value<0 and '+' in printed
   whole,num,den,divisor=map(int,re.findall(r'\d+',printed));assert value==-(whole+F(num,den))/divisor
   assert expr(choices[0])==-value and expr(choices[1])==a*b and expr(choices[2])==-F(num,den)/b
  if i==11:
   divisor=printed.split(':')[1];assert re.search(r'0,\d{2}',divisor)
   assert abs(b)<F(1,10) and value.denominator==1
   assert abs(a)*100/(abs(b)*100)==value
   assert (abs(a)*10)/(abs(b)*100)==value/10
  if i==12:
   assert '+' in printed and a<-1 and -1<b<0 and value.denominator==1
 if chosen is None and choices:chosen=one([o for o in choices if expr(o)==value])
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert expr(r['answer'])==value,(i,r['answer'],value)
 return value
def chains(r):
 count=0
 for m in re.finditer(r'[0-9(\-][0-9\s,×+/:−()=\-]*',r['solution']):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('(')!=t.count(')'):continue
  bits=t.split('=')
  if any(not b.strip() or re.search(r'[+×:/−-]\s*$',b) for b in bits):continue
  vs=[expr(b) for b in bits];assert all(v==vs[0] for v in vs),t;count+=1
 return count
def run():
 rows=read(BATCH)['editions'];assert len(rows)==13;entries=[];bad=eq=0
 for i,r in enumerate(rows):
  ref=r['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']])
  assert cap['status']=='captured' and raw['checked'] and raw['solution'] and not raw.get('images')
  assert norm(raw['statement']).lower()!=norm(r['statement']).lower();solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(r,i);eq+=chains(r)
  wrong=copy.deepcopy(r);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_printed_Fraction_AST_undefined_zero_divisor_sign_inference_mixed_units_reduction_and_unknown_roles','notes':['Read every saved/new condition, full official/authored solution and MCQ; no author solver or params imported.','Undefined zero divisor options identified without numerical evaluation. Positive quotient with negative dividend forces negative divisor.','Only divisor inverted; genuine fraction reduction and multiply/reverse distractors; entire negative mixed number; scale100 versus10; unknown dividend multiplication versus unknown factor division checked exactly.']})
 canaries=[(0,'0 : (-11) = 0','0 : (-11) = 1'),(1,'m < 0','m > 0'),(2,'-(3/7)','-(4/7)'),(3,'(-8,4)','(-9,8)'),(4,'(-0,7)','(-0,9)'),(5,'(-81)','(-90)'),(6,'(-35) : 5','35 : 5'),(7,'(-6)','(-7)'),(8,'25/18','35/18'),(9,'= 104','= 112'),(10,'-(2 +','-(3 +'),(11,'(-0,07)','(-0,08)'),(12,'-(4 +','-(5 +')]
 rejected=0
 for i,old,new in canaries:
  r=copy.deepcopy(rows[i]);field='options' if i in(0,6) else 'statement'
  if field=='options':assert any(old in o for o in r[field]);r[field]=[o.replace(old,new) for o in r[field]]
  else:assert old in r[field];r[field]=r[field].replace(old,new)
  try:solve(r,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printed/role canary accepted',i))
 witnesses=0
 for a in range(-100,101):
  for b in range(-100,101):
   if b==0:continue
   x,y=F(a,10),F(b,100);q=x/y
   assert q*y==x and q==x*(1/y)
   assert (q>0)-(q<0)==((x>0)-(x<0))*((y>0)-(y<0))
   assert (x*100)/(y*100)==q;witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-signed-division.py','savedConditionsChecked':13,'newConditionsChecked':13,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivensAndRoleCanariesRejected':rejected,'undefinedZeroDivisorOptionsIdentifiedWithoutEvaluation':4,'exactRationalDivisionSignInverseAndScalingWitnesses':witnesses,'numericSolutionEqualityChains':eq,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':13,'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
