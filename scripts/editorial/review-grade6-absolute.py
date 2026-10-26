"""Independent full11 absolute-value editorial review, own printed Fraction/AST.
Positive/zero/negative RHS cases proved from the two sign branches of |x|.
No authorparams or solver imported; full source/new conditions/solutions/MCQs read.
"""
import ast,copy,hashlib,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-absolute.json';REPORT='problems/editorial/reviews/grade6-absolute.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('\\\\','\\').replace('$','').replace('{,}',',').replace('\\,','').replace('−','-').replace('\\left','').replace('\\right','')
 s=re.sub(r'(\d+)\s*\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1+(\2/\3))',s)
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
def expr(s):
 t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
 def walk(a):
  if isinstance(a,ast.Constant):return F(ast.get_source_segment(t,a))
  if isinstance(a,ast.UnaryOp):assert isinstance(a.op,(ast.USub,ast.UAdd));return -walk(a.operand) if isinstance(a.op,ast.USub) else walk(a.operand)
  assert isinstance(a,ast.BinOp),ast.dump(a);x,y=walk(a.left),walk(a.right)
  if isinstance(a.op,ast.Add):return x+y
  if isinstance(a.op,ast.Sub):return x-y
  if isinstance(a.op,ast.Mult):return x*y
  if isinstance(a.op,ast.Div):return x/y
  raise AssertionError(ast.dump(a))
 return walk(ast.parse(t,mode='eval').body)
def modulus_expr(s):
 t=clean(s)
 def repl(m):
  v=abs(expr(m[1]));return f'({v.numerator}/{v.denominator})'
 t=re.sub(r'\|([^|]+)\|',repl,t);assert '|' not in t,t;return expr(t)
def args(s):return[expr(t) for t in re.findall(r'\|([^|]+)\|',clean(s))]
def opts(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[])]
def one(xs):assert len(xs)==1,xs;return xs[0]
def normal(s):return re.sub(r'\s+',' ',clean(s)).strip()
def roots(rhs):
 # Definition branch proof: for x>=0,|x|=x; for x<0,|x|=−x.
 a=[rhs] if rhs>=0 else[];b=[-rhs] if rhs>0 else[];out=set(a+b)
 assert all(abs(v)==rhs for v in out)
 return out
witnesses=0
def solve(row,i,source=False):
 global witnesses
 s=row['statement'];options=opts(row);expected=None;exact=None;notes=[]
 if i==1:
  rhs=expr(one(re.findall(r'\|x\|\s*=\s*(-?\d+)',clean(s))));expected=len(roots(rhs))
  assert expected==(2 if rhs>0 else 1 if rhs==0 else 0)
  for k in range(-720,721):
   v=F(k,60);assert(abs(v)==rhs)==(v in roots(rhs));witnesses+=1
  notes=['Two sign branches exhaust all real roots when target11>0:−11and11;0would give one root, negative RHS no root. Gridchecks are supplementary witnesses, not proof over reals.']
 elif i==2:
  a,b=args(s);assert a<0<b;expected=abs(a)+abs(b)
 elif i==3:
  rhs=expr(one(re.findall(r'\(\d+/\d+\)',clean(s))));want=roots(rhs);assert len(want)==2
  def values(o):return{expr(t.replace('тек','').replace('ғана','').strip()) for t in o.split('және')}
  exact=one([o for o in options if values(clean(o))==want]);assert rhs!=1/rhs
  notes=['Allsolutions are±7/12; both single-root options incomplete and±12/7 is reciprocal, not equal-distance.']
 elif i==4:
  a,b=args(s);assert b!=0;expected=abs(a)/abs(b)
 elif i==5:
  value=one(args(s));assert value<0 and abs(value)>1;expected=abs(value)
  assert expected.denominator>1
  notes=['Negative mixed value is−(4+3/8), not−4+3/8. Modulus keeps whole and fractional parts together and yields35/8=4+3/8.']
 elif i==6:
  value=one(args(s));expected=abs(value);assert expected.denominator==100 and value<0
  if not source:assert 'жүзден 9 үлес' in row['solution']
  notes=['Exact9/100 preserves hundredths. FinalKazakh solution explicitly says жүзден9үлес, avoiding confusing hundredths with hundreds.']
 elif i==7:
  parsed=[(o,expr(one(re.findall(r'\|x\|\s*=\s*([-0-9,]+)',clean(o))))) for o in options]
  exact=one([o for o,v in parsed if not roots(v)]);assert any(v==0 for _,v in parsed) and any(v>0 for _,v in parsed)
  assert roots(F(0))=={F(0)} and len(roots(F(7,10)))==2
 elif i==8:
  exact=one([o for o in options if modulus_expr(clean(o).split('=')[0])==expr(clean(o).split('=')[1])])
 elif i==9:expected=abs(one(args(s)))
 elif i==10:expected=abs(expr(one(re.findall(r'-\d+',clean(s)))))
 elif i==11:
  exact=one([o for o in options if 'қарама-қарсы' in o])
  for k in range(-600,0):
   v=F(k,60);assert abs(v)==-v and abs(v)>0 and abs(v)!=v;witnesses+=1
  notes=['For allnegative reals definition gives|x|=−x>0;600exactrational witnesses corroborate the rule, rather than implying only integer values.']
 else:raise AssertionError(i)
 if exact is not None:assert normal(row['answer'])==normal(exact),(i,row['answer'],exact)
 elif options:
  exact=one([o for o in options if expr(o)==expected]);assert normal(row['answer'])==normal(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==expected,(i,row['answer'],expected)
 return notes
def eqs(row):
 count=0
 for m in re.finditer(r'[|0-9(\-][|0-9\s×+/:−(),=\-]*',row['solution']):
  t=m[0].strip().strip(',');t=re.split(r',(?=\s)',t)[0]
  if '=' not in t or t.count('|')%2:continue
  bits=t.split('=')
  if not all(b.strip() for b in bits):continue
  values=[modulus_expr(b) for b in bits];assert all(v==values[0] for v in values),t;count+=1
 return count
def run():
 global witnesses
 rows=read(BATCH)['editions'];assert len(rows)==11;entries=[];wrong=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];c=read(ref['sourceFile']);raw=one([q for q in c['questions'] if q['id']==ref['sourceId']]);assert len(c['questions'])==16 and c['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert normal(raw['statement'])!=normal(row['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);notes=solve(row,i)
  bad=copy.deepcopy(row);bad['answer']='INVALID WRONG KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError):wrong+=1
  else:raise AssertionError(('Wrongkeyaccepted',i))
  eq+=eqs(row)
  h=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':row['editionId'],'sha256':h,'verdict':'verified','method':'independent_full_saved_and_authored_read_printed_Fraction_AST_and_modulus_sign_branch_exhaustion','notes':['Read this entire saved condition, officialsolution and allMCQs, plus the whole newcondition/fullsolution/everyMCQ. No authorparams or solver imported.','Checked positive/zero/negative modulus regimes, positive distances versus signed values, decimalplace, wholemixed sign, reciprocal versus opposite and completeness of allrootchoices.',*notes]})
 canaries=[(1,'= 11','= 0'),(2,'|-14|','|-15|'),(3,'(7/12)','(5/12)'),(4,'|-42|','|-48|'),(5,'4 + (3/8)','5 + (3/8)'),(6,'|-0,09|','|-0,9|'),(7,'|x| = -5','|x| = 5'),(8,'|-3,6| = 3,6','|-3,6| = -3,6'),(9,'|-17|','|-18|'),(10,'-263 санының','-264 санының')]
 rejected=0
 for i,a,b in canaries:
  bad=copy.deepcopy(rows[i-1])
  if a in bad['statement']:bad['statement']=bad['statement'].replace(a,b,1)
  else:
   j=one([j for j,o in enumerate(bad.get('options',[])) if a in o]);bad['options'][j]=bad['options'][j].replace(a,b,1)
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Printedcanaryaccepted',i))
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1],'utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code,BATCH],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','scope':'All11 nonvisual originals/neweditions from saved16question grade6absolute2.4level1; not12 and not11 claimed newmeanings.','evidence':{'oracle':'scripts/editorial/review-grade6-absolute.py','fullSavedAndNewRead':11,'sourceKeysVerified':11,'printedExactKeys':11,'wrongKeysRejected':wrong,'printedCanariesRejected':rejected,'supplementaryExactRationalWitnesses':witnesses,'numericSolutionEqualities':eq,'pythonJsHashesMatched':len(entries),'resolvedFinding':'Final0.09solution explicitly says жүзден9үлес; other10rows unchanged. Original4c46official wrongexample−8+5=3was read but not copied; newsolution correct.'},'entries':entries}
 (ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'reviewed':11,**report['evidence']}))
if __name__=='__main__':run()
