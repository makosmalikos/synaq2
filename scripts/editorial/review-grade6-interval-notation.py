"""Independent full12 saved/new interval notation review. Literal endpoint/bracket
parser and exact point membership partition, no author params or solver imports.
Complete saved/new solutions and every option read before hash signature.
"""
import copy,hashlib,json,re,math
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('independent_ineq',ROOT/'scripts/editorial/review-grade6-numeric-inequalities.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
val,nums,one,norm,comparisons,truth,options,rejected=ind.val,ind.nums,ind.one,ind.norm,ind.comparisons,ind.truth,ind.options,ind.rejected
def clean(s):return ind.clean(s).replace('\\infty','∞').replace('\\cup','∪').replace('\\cap','∩').replace('\\varnothing','∅').replace('\\{','{').replace('\\}','}').replace('\\,',' ')
TOKEN=r'[+-]?(?:\d+(?:[.,]\d+)?|∞)';PAT=r'([\[(])\s*('+TOKEN+r')\s*;\s*('+TOKEN+r')\s*([\])])'
def endpoint(s):return -math.inf if s=='-∞' else math.inf if s in('∞','+∞') else F(s.replace(',','.'))
def intervals(s):return[(m[1],endpoint(m[2]),endpoint(m[3]),m[4]) for m in re.finditer(PAT,clean(s))]
def valid(t):return t[1]<=t[2] and(t[1]!=-math.inf or t[0]=='(') and(t[2]!=math.inf or t[3]==')')
def member(t,x):assert valid(t);return (t[1]<x or(t[0]=='[' and t[1]==x))and(x<t[2]or(t[3]==']' and t[2]==x))
def points(ts):
 ends=sorted({n for t in ts for n in(t[1],t[2]) if math.isfinite(n)})
 if not ends:return[F(0)]
 return sorted(set(ends+[(a+b)/2 for a,b in zip(ends,ends[1:])]+[ends[0]-1,ends[-1]+1]))
def finite_integers(t,natural=False):
 assert math.isfinite(t[1])and math.isfinite(t[2]);return[x for x in range(math.floor(t[1])-1,math.ceil(t[2])+2)if member(t,F(x))and(not natural or x>=1)]
def option_set(o):
 s=clean(o).strip()
 if s=='∅':return lambda x:False,[]
 m=re.fullmatch(r'\{\s*('+TOKEN+r')\s*\}',s)
 if m:
  n=endpoint(m[1]);return lambda x:x==n,[('[',n,n,']')]
 ts=intervals(s)
 if len(ts)!=1 or not valid(ts[0]):return None,[]
 return lambda x:member(ts[0],x),ts
def pick_set(os,predicate,original):
 hits=[]
 for o in os:
  fn,ts=option_set(o)
  if fn is not None and all(fn(x)==predicate(x)for x in points(original+ts)):hits.append(o)
 return one(hits)
def solve(r,i):
 s=clean(r['statement']);os=options(r);chosen=None;answer=None
 if i==0:answer=len(finite_integers(one(intervals(s))))
 elif i==1:
  lo,hi=nums(s)[:2];t=('[',lo,hi,')');chosen=pick_set(os,lambda x:member(t,x),[t])
 elif i==2:
  m=re.search(r'\[\s*('+TOKEN+r')\s*;\s*a\]',s);assert m;lo=endpoint(m[1]);count=nums(s)[1];answer=lo+count-1;assert len(finite_integers(('[',lo,answer,']')))==count
 elif i in(3,4):
  members=finite_integers(one(intervals(s)));answer=max(members)if i==3 else min(members)
 elif i==5:
  t=one(intervals(s));name='сәуле'if math.isinf(t[1])or math.isinf(t[2])else'кесінді'if t[0]=='['and t[3]==']'else'интервал'if t[0]=='('and t[3]==')'else'жартылай интервал';chosen=one([o for o in os if norm(o)==name])
 elif i in(6,8):
  cs=comparisons(s);assert len(cs)==(1 if i==6 else 2);allbounds=[val(a)for a,_,b in cs if a!='x']+[val(b)for a,_,b in cs if b!='x'];original=[('[',min(allbounds),max(allbounds),']')];chosen=pick_set(os,lambda x:all(truth(c,{'x':x})for c in cs),original)
 elif i==7:
  t=one(intervals(s));answer=t[2]-t[1];assert answer>=0
 elif i==9:
  t=one(intervals(s));chosen=one([o for o in os if member(t,val(o))])
 elif i==10:answer=len(finite_integers(one(intervals(s)),True))
 elif i==11:
  t=one(intervals(s));hits=[]
  for o in os:
   cs=comparisons(o)
   if len(cs)==1 and all(truth(cs[0],{'x':x})==member(t,x)for x in points([t])):hits.append(o)
  chosen=one(hits)
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)
def run():
 batch='problems/editorial/batches/grade6-interval-notation.json';report='problems/editorial/reviews/grade6-interval-notation.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==12;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text']for o in raw['options']if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==0:changed['statement']=changed['statement'].replace('[-6;','(-6;')
  elif i==1:changed['statement']=changed['statement'].replace('-7 саны','-8 саны')
  elif i==2:changed['statement']=changed['statement'].replace('14 бүтін','15 бүтін')
  elif i==3:changed['statement']=changed['statement'].replace('; 12)','; 13)')
  elif i==4:changed['statement']=changed['statement'].replace('(6,4;','(7,4;')
  elif i==5:changed['statement']=changed['statement'].replace('; 9]','; 9)')
  elif i==6:changed['statement']=changed['statement'].replace('≥','>')
  elif i==7:changed['statement']=changed['statement'].replace('; 12]','; 13]')
  elif i==8:changed['statement']=changed['statement'].replace('-6 < x','-6 ≤ x')
  elif i==9:changed['options']=[o if o!='6'else'7'for o in changed['options']]
  elif i==10:changed['statement']=changed['statement'].replace('; 8)','; 9)')
  elif i==11:changed['statement']=changed['statement'].replace('; -3)','; -3]')
  rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_literal_endpoint_bracket_parser_exact_cell_partition_and_integer_enumeration','notes':['Read all saved/new complete conditions, official/authored solutions and every MCQ.','Literal finite/ray membership and infinity-open-bracket validity checked against full endpoint/midpoint/tail partition, not author params.','Integer count versus length, unknown closed endpoint, min/max, decimal ceiling, N starting1 and included/excluded endpoint targets checked.']})
 cases=0
 for lo in range(-5,6):
  for hi in range(lo+1,6):
   for left in'([':
    for right in')]':
     t=(left,F(lo),F(hi),right);members=finite_integers(t);formula=hi-lo+1-(left=='(')-(right==')');assert len(members)==formula
     for x in[F(n,2)for n in range(-14,15)]:assert member(t,x)==((x>=lo if left=='['else x>lo)and(x<=hi if right==']'else x<hi));cases+=1
 assert not valid(('[',-math.inf,F(0),']'));assert not valid(('[',F(0),math.inf,']'));assert valid(('(',-math.inf,F(0),']'));assert valid(('[',F(0),math.inf,')'))
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-interval-notation.py','fullSavedAndNewRead':12,'printedKeysChecked':12,'badKeysRejected':12,'printedCanariesRejected':12,'completeBracketIntegerAndHalfGridCases':cases,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':12,'bracketGridCases':cases,'report':report}))
if __name__=='__main__':run()
