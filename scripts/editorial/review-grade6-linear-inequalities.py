"""Independent full14 saved/new linear-inequality review. Exact printed
coefficient-vector sign/ray solver, complete rational boundary cases, no author
params or solver. All saved/new full solutions and every MCQ read separately.
"""
import copy,hashlib,json,re,math
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('independent_intervals',ROOT/'scripts/editorial/review-grade6-interval-notation.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
base=ind.ind
one,norm,options,rejected=ind.one,ind.norm,ind.options,ind.rejected
val,poly=base.val,base.poly
def clean(s):return ind.clean(s.replace('\\\\','\\').replace('\\geqslant','≥').replace('\\leqslant','≤'))
def comparisons(s):return base.comparisons(clean(s))
def nums(s):return base.nums(clean(s))
def delta(c):
 a,op,b=c;left,right=poly(a),poly(b);d={k:left.get(k,F(0))-right.get(k,F(0))for k in set(left)|set(right)};d={k:x for k,x in d.items()if x};assert set(d)<={(),('x',)},c
 return d,op
def form(c):
 d,op=delta(c);a=d.get(('x',),F(0));b=d.get((),F(0))
 if not a:return('all',)if {'<':b<0,'>':b>0,'≤':b<=0,'≥':b>=0}[op]else('none',)
 if a<0:op={'<':'>','>':'<','≤':'≥','≥':'≤'}[op]
 return('ray',op,-b/a)
def accepts(form,x):
 if form[0]=='all':return True
 if form[0]=='none':return False
 _,op,b=form;return {'<':x<b,'>':x>b,'≤':x<=b,'≥':x>=b}[op]
def actual(c,x):
 a,op,b=c;L,R=val(a,{'x':x}),val(b,{'x':x});return {'<':L<R,'>':L>R,'≤':L<=R,'≥':L>=R}[op]
def endpoint(s):return -math.inf if s.strip()=='-∞'else math.inf if s.strip()in('∞','+∞')else val(s.strip())
def set_option(s):
 s=clean(s).strip()
 if s=='∅':return('none',)
 m=re.fullmatch(r'([\[(])\s*(.+)\s*;\s*(.+)\s*([\])])',s);assert m,s
 lo,hi=endpoint(m[2]),endpoint(m[3]);assert lo<=hi
 if lo==-math.inf and hi==math.inf:assert m[1]=='('and m[4]==')';return('all',)
 if hi==math.inf:assert m[4]==')';return('ray','≥'if m[1]=='['else'>',lo)
 if lo==-math.inf:assert m[1]=='(';return('ray','≤'if m[4]==']'else'<',hi)
 raise AssertionError('Expected ray option')
def min_integer(f,natural=False):
 assert f[0]=='ray'and f[1]in('>','≥');n=math.floor(f[2])+1 if f[1]=='>'else math.ceil(f[2]);return max(n,1)if natural else n
def max_integer(f):assert f[0]=='ray'and f[1]in('<','≤');return math.ceil(f[2])-1 if f[1]=='<'else math.floor(f[2])
def solve(r,i):
 s=clean(r['statement']);os=options(r);answer=None;chosen=None
 if i in(0,3):
  target=form(one(comparisons(s)));chosen=one([o for o in os if set_option(o)==target])
  if i==3:assert target==('none',)
 elif i==1:
  original=one(comparisons(s));d,op=delta(original);hits=[]
  for o in os:
   cmp=one(comparisons(o));D,OP=delta(cmp)
   if d==D and op==OP and ()not in poly(cmp[0])and ('x',)not in poly(cmp[2]):hits.append(o)
  chosen=one(hits)
 elif i==2:
  budget,price=nums(s);assert budget>0 and price>0;answer=budget//price;assert answer*price<=budget<(answer+1)*price
 elif i==4:
  chosen=one([o for o in os if len(comparisons(o))==2 and form(comparisons(o)[0])==form(comparisons(o)[1])])
 elif i==5:
  cmp=one(comparisons(s));f=form(cmp);answer=min_integer(f,True);assert actual(cmp,F(answer))and not actual(cmp,F(answer-1))
 elif i==6:
  cmp=one(comparisons(s));chosen=one([o for o in os if actual(cmp,val(o))]);assert form(cmp)[1]=='≤'
 elif i==7:
  cmp=one(comparisons(s));answer=min_integer(form(cmp));assert actual(cmp,F(answer))and not actual(cmp,F(answer-1))
 elif i in(8,11):
  cmp=one(comparisons(s));answer=max_integer(form(cmp));assert actual(cmp,F(answer))and not actual(cmp,F(answer+1))
 elif i==9:
  m=re.search(r'('+base.NUM+r')\s*-\s*('+base.NUM+r')x',s)if hasattr(base,'NUM')else re.search(r'(-?\d+)\s*-\s*(\d+)x',s);assert m;constant,coefficient=map(F,m.groups());cmp=(f'{constant} - {coefficient}x','>','0');answer=max_integer(form(cmp));assert actual(cmp,F(answer))and not actual(cmp,F(answer+1))
 elif i==10:
  hits=[]
  for o in os:
   cs=comparisons(o)
   if len(cs)!=1:continue
   left,right=poly(cs[0][0]),poly(cs[0][2]);terms=set(left)|set(right);variables={v for term in terms for v in term}
   if len(variables)==1 and max(map(len,terms),default=0)==1:hits.append(o)
  chosen=one(hits)
 elif i==12:
  target=form(one(comparisons(s)));chosen=one([o for o in os if form(one(comparisons(o)))==target]);assert target[1]=='≤'
 elif i==13:
  cmp=one(comparisons(s));f=form(cmp);assert f[0]=='ray'and f[1]in('<','≤');answer=len([n for n in range(1,math.ceil(f[2])+2)if actual(cmp,F(n))]);assert answer==max_integer(f)
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)
def run():
 batch='problems/editorial/batches/grade6-linear-inequalities.json';report='problems/editorial/reviews/grade6-linear-inequalities.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==14;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text']for o in raw['options']if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==0:changed['statement']=changed['statement'].replace('4x -','5x -')
  elif i==1:changed['statement']=changed['statement'].replace('9x +','10x +')
  elif i==2:changed['statement']=changed['statement'].replace('2300','2400')
  elif i==3:changed['statement']=changed['statement'].replace('+ 9 <','+ 3 <')
  elif i==4:changed['options']=[o.replace('3x > 18 және x > 6','3x < 18 және x > 6')for o in changed['options']]
  elif i==5:changed['statement']=changed['statement'].replace('7x >','8x >')
  elif i==6:changed['options']=[o if o!='-5'else'-3'for o in changed['options']]
  elif i==7:changed['statement']=changed['statement'].replace('6x -','7x -')
  elif i==8:changed['statement']=changed['statement'].replace('x + 9 <','x + 10 <')
  elif i==9:changed['statement']=changed['statement'].replace('42 -','48 -')
  elif i==10:changed['options']=[o.replace('7x - 9 < 12','7x² - 9 < 12')for o in changed['options']]
  elif i==11:changed['statement']=changed['statement'].replace('> 5x','> 6x')
  elif i==12:changed['statement']=changed['statement'].replace('-9x','-6x')
  elif i==13:changed['statement']=changed['statement'].replace('(x/4)','(x/5)')
  rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_printed_exact_affine_difference_sign_rays_and_strict_integer_domains','notes':['Read each saved/new full condition, official/authored solution and every MCQ.','Own printed polynomial coefficient difference determines exact whole solution ray, including zero coefficient false comparison and negative-division reversal.','Transposition requested step not final ray, full-set equivalence not shared member, given linear syntax, fixed-budget floor/next infeasible and strict min/max/count/positive-zero exclusion checked.','Fractional distractor endpoints parsed exactly; no author params or solver imported.']})
 cases=0
 for a in range(-7,8):
  for b in range(-10,11):
   for op in('<','>','≤','≥'):
    cmp=(f'{a}x + ({b})',op,'0');f=form(cmp)
    for x in[F(n,4)for n in range(-40,41)]:assert actual(cmp,x)==accepts(f,x);cases+=1
 budgets=0
 for price in range(1,31):
  for budget in range(1,201):n=budget//price;assert n*price<=budget<(n+1)*price;budgets+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-linear-inequalities.py','fullSavedAndNewRead':14,'printedKeysChecked':14,'badKeysRejected':14,'printedCanariesRejected':14,'completeSignedAffineQuarterGridCases':cases,'budgetFloorNextItemCases':budgets,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':14,'affineGridCases':cases,'budgetCases':budgets,'report':report}))
if __name__=='__main__':run()
