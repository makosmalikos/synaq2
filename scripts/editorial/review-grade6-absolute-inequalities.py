"""Independent full13 saved/new absolute inequality review.
Own exact printed affine absolute predicate and complete real-line boundary-cell
partition; interval unions OR, double inequalities AND. No author params/solver.
All saved/new full conditions/solutions and every choice read before signing.
"""
import copy,hashlib,json,re,math
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('own_linear_inequality',ROOT/'scripts/editorial/review-grade6-linear-inequalities.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
one,norm,options,rejected,val=ind.one,ind.norm,ind.options,ind.rejected,ind.val
NUM=r'[+-]?\d+(?:[.,]\d+)?'
def clean(s):return ind.clean(s)
def absolute(s):
 m=re.search(r'\|([^|]+)\|\s*([<>≤≥])\s*('+NUM+r')',clean(s));assert m,s
 p=ind.poly(m[1]);assert set(p)<={(),('x',)};a,b=p.get(('x',),F(0)),p.get((),F(0));r=F(m[3].replace(',','.'));assert a!=0
 return a,b,m[2],r
def abs_accept(c,x):
 a,b,op,r=c;n=abs(a*x+b);return {'<':n<r,'>':n>r,'≤':n<=r,'≥':n>=r}[op]
def boundaries(c):
 a,b,op,r=c;center=-b/a;return sorted({center,*([(r-b)/a,(-r-b)/a]if r>=0 else[])})
def cells(endpoints):
 e=sorted(set(endpoints));assert e
 return sorted(set(e+[(a+b)/2 for a,b in zip(e,e[1:])]+[e[0]-1,e[-1]+1]))
def option_interval(o):
 s=ind.ind.clean(o)
 if s=='∅':return lambda x:False,[]
 ts=ind.ind.intervals(s);assert len(ts)==len(s.split('∪'))and all(ind.ind.valid(t)for t in ts),(o,ts)
 return lambda x:any(ind.ind.member(t,x)for t in ts),[x for t in ts for x in(t[1],t[2])if math.isfinite(x)]
def option_comparison(o):
 groups=[ind.comparisons(part)for part in clean(o).split('немесе')];assert all(groups)
 ends=[]
 for cs in groups:
  for c in cs:
   f=ind.form(c)
   if f[0]=='ray':ends.append(f[2])
 return lambda x:any(all(ind.actual(c,x)for c in cs)for cs in groups),ends
def choose_equivalent(r,c,comparison=False):
 hits=[]
 for o in options(r):
  fn,ends=option_comparison(o)if comparison else option_interval(o)
  if all(fn(x)==abs_accept(c,x)for x in cells(boundaries(c)+ends)):hits.append(o)
 return one(hits)
def bounded_integers(c,natural=False):
 a,b,op,r=c;assert op in('<','≤')and r>=0
 ends=boundaries(c);lo,hi=math.floor(min(ends))-1,math.ceil(max(ends))+1
 return[x for x in range(max(lo,1)if natural else lo,hi+1)if abs_accept(c,F(x))]
def solve(r,i):
 s=clean(r['statement']);os=options(r);answer=None;chosen=None
 if i==3:
  chosen=one([o for o in os if not any(abs_accept(absolute(o),x)for x in cells(boundaries(absolute(o))))]);assert 'шешімі жоқ'in s
  states=[]
  for o in os:
   c=absolute(o);xs=cells(boundaries(c));states.append(('empty'if not any(abs_accept(c,x)for x in xs)else'all'if all(abs_accept(c,x)for x in xs)else'singleton'if c[2]=='≤'and c[3]==0 else'some'))
  assert sorted(states)==['all','empty','singleton','some']
 else:
  c=absolute(s)
  if i in(0,6,9,12):chosen=choose_equivalent(r,c)
  elif i in(1,2,5):answer=len(bounded_integers(c,i==5));assert('натурал'in s.lower())==(i==5)
  elif i==4:chosen=one([o for o in os if abs_accept(c,val(o))]);assert len(bounded_integers(c))>1
  elif i==7:answer=max(bounded_integers(c));assert 'үлкен'in s.lower()and not abs_accept(c,F(answer+1))
  elif i==8:
   assert c[2]=='>'and c[3]>0;limit=math.ceil(max(boundaries(c)))+2;answer=min(x for x in range(1,limit+1)if abs_accept(c,F(x)));assert not abs_accept(c,F(answer-1))and 'натурал'in s.lower()
  elif i==10:
   assert c[2]=='≤'and c[3]>0;answer=min(x for x in boundaries(c)if abs_accept(c,x));assert not abs_accept(c,answer-F(1,1000));assert 'кіші'in s.lower()
  elif i==11:chosen=choose_equivalent(r,c,True)
  else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)

def run():
 batch='problems/editorial/batches/grade6-absolute-inequalities.json';report='problems/editorial/reviews/grade6-absolute-inequalities.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==13;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text']for o in raw['options']if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==0:changed['statement']=changed['statement'].replace('x + 2','x + 3')
  elif i==1:changed['statement']=changed['statement'].replace('< 4','< 5')
  elif i==2:changed['statement']=changed['statement'].replace('≤ 6','≤ 7')
  elif i==3:changed['options']=[o.replace('|x| < -3','|x| > -3')for o in changed['options']]
  elif i==4:changed['statement']=changed['statement'].replace('≤','<')
  elif i==5:changed['statement']=changed['statement'].replace('≤ 9','≤ 10')
  elif i==6:changed['statement']=changed['statement'].replace('≥','>')
  elif i==7:changed['statement']=changed['statement'].replace('< 3','< 4')
  elif i==8:changed['statement']=changed['statement'].replace('> 12','≥ 12')
  elif i==9:changed['statement']=changed['statement'].replace('> 5','≥ 5')
  elif i==10:changed['statement']=changed['statement'].replace('≤','<')
  elif i==11:changed['statement']=changed['statement'].replace('x - 4','x - 5')
  elif i==12:changed['statement']=changed['statement'].replace('< 8','≤ 8')
  assert changed!=r;rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_actual_printed_affine_absolute_exact_real_line_boundary_partition_and_integer_domains','notes':['Read every saved/new full condition, official/authored full solution and every MCQ.','Own exact Fraction affine inner expression and literal interval/union or linear comparison options checked on complete center/endpoints/midpoints/tails partition; exterior OR is not impossible AND.','Negative/zero target empty/all/singleton, strict/closed both endpoints, full integer count includingzero versus natural1, selected boundary versus full set, integer maximum versus closed real minimum and weaker one-sided consequence checked.','No author params or solver imported; source official keys independently recomputed.']})
 cases=0
 for a in[-3,-2,-1,1,2,3]:
  for b in range(-5,6):
   for radius in range(-4,13):
    r=F(radius,2)
    for op in('<','>','≤','≥'):
     c=(F(a),F(b),op,r);center=-F(b,a)
     for x in[F(n,3)for n in range(-18,19)]:
      direct=abs_accept(c,x);distance=abs(x-center);effective=r/abs(a);expected={'<':distance<effective,'>':distance>effective,'≤':distance<=effective,'≥':distance>=effective}[op];assert direct==expected;cases+=1
 integers=0
 for center in range(-15,16):
  for radius in range(1,15):
   strict=(F(1),F(-center),'<',F(radius));closed=(F(1),F(-center),'≤',F(radius));assert len(bounded_integers(strict))==2*radius-1;assert len(bounded_integers(closed))==2*radius+1;integers+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-absolute-inequalities.py','fullSavedAndNewRead':13,'printedKeysChecked':13,'badKeysRejected':13,'printedCanariesRejected':13,'signedAffineNegativeZeroPositiveRadiusThirdGridCases':cases,'completeShiftedStrictClosedIntegerDomains':integers,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':13,'affineRadiusGridCases':cases,'integerDomains':integers,'report':report}))
if __name__=='__main__':run()
