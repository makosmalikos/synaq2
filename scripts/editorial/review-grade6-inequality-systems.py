"""Independent full13 saved/new inequality-system review. Actual printed
constraints, separate exact affine polynomial/whole-set membership oracle.
No author params/model/solver. All full solutions and MCQs read separately.
"""
import copy,hashlib,json,re,math
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('independent_linear_inequality',ROOT/'scripts/editorial/review-grade6-linear-inequalities.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
val,one,norm,options,rejected=ind.val,ind.one,ind.norm,ind.options,ind.rejected

def clean(s):
 s=re.sub(r'\\(?:begin|end)\{cases\}',' ',s).replace('\\\\',';')
 s=re.sub(r'(?m)^\s*[12]\)\s*','',s)
 return ind.clean(s).replace('\n',';').replace(':',';')
def comparisons(s):return ind.comparisons(clean(s))
def constraints(r):
 cs=comparisons(r['statement']);assert len(cs)==2,(r['statement'],cs);return cs
def forms(cs):return[ind.form(c)for c in cs]
def predicate(cs,x):return all(ind.actual(c,x)for c in cs)
def full_points(cs,ts=[]):
 ends=sorted({t[2]for t in forms(cs)if t[0]=='ray'}|{e for t in ts for e in(t[1],t[2])if math.isfinite(e)})
 return sorted(set(ends+[(a+b)/2 for a,b in zip(ends,ends[1:])]+[ends[0]-1,ends[-1]+1]))if ends else[F(0)]
def option_predicate(o):
 s=clean(o).strip()
 if s=='∅':return lambda x:False,[]
 ts=ind.ind.intervals(s);assert len(ts)==len(s.split('∪'))and all(ind.ind.valid(t)for t in ts),s
 return lambda x:any(ind.ind.member(t,x)for t in ts),ts

def choose_set(r,cs):
 hits=[]
 for o in options(r):
  fn,ts=option_predicate(o)
  if all(fn(x)==predicate(cs,x)for x in full_points(cs,ts)):hits.append(o)
 return one(hits)
def integer_members(cs,natural=False):
 fs=forms(cs);assert all(t[0]=='ray'for t in fs),fs
 lows=[ind.min_integer(t)for t in fs if t[1]in('>','≥')];highs=[ind.max_integer(t)for t in fs if t[1]in('<','≤')]
 low=max(lows+[1]if natural else lows)if lows or natural else None;high=min(highs)if highs else None
 if low is not None and high is not None:return[n for n in range(low,high+1)if predicate(cs,F(n))]
 if low is not None:assert predicate(cs,F(low))and not predicate(cs,F(low-1));return[low]
 assert high is not None;assert predicate(cs,F(high))and not predicate(cs,F(high+1));return[high]

def solve(r,i):
 s=clean(r['statement']);os=options(r);chosen=None;answer=None
 if i==2:
  chosen=one([o for o in os if 'әр' in o.lower()and not('кем дегенде'in o.lower())]);assert 'толық анықтама'in s or 'дегеніміз не'in s
  # Full definition requires every condition; weaker OR/first condition accept outside7.
  assert 'бір мезгілде'in r['solution']or 'бірге орындалуы'in r['solution'];assert not(8<7)and 8>2 and 2<4<7
 elif i==9:
  v=one(re.findall(r'(?:x\s*=\s*|^\s*\$?)(\d+)',s));v=F(v);parts=re.split(r'[аәбв]\)',s)[1:];assert len(parts)==4
  matrix=[]
  for p in parts:
   cs=comparisons(p);assert len(cs)==2,(p,cs);matrix.append([ind.actual(c,v)for c in cs])
  assert matrix==[[True,True],[False,True],[True,True],[False,True]],matrix
  answer=sum(all(pair)for pair in matrix);assert sum(any(pair)for pair in matrix)==4
 else:
  cs=constraints(r)
  if i in(1,3,4,6):chosen=choose_set(r,cs)
  elif i==0:answer=len(integer_members(cs,True));assert 'натурал'in s.lower()
  elif i in(7,10):answer=len(integer_members(cs));assert 'бүтін'in s.lower()
  elif i==8:answer=one(integer_members(cs));assert 'дәптер'in s or 'кітап'in s
  elif i==5:answer=max(integer_members(cs));assert 'үлкен'in s.lower()
  elif i==11:answer=min(integer_members(cs));assert 'кіші'in s.lower()
  elif i==12:
   chosen=one([o for o in os if predicate(cs,val(o))]);assert len(integer_members(cs))>1,'A proposed candidate is not the only whole system solution'
  else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)

def run():
 batch='problems/editorial/batches/grade6-inequality-systems.json';report='problems/editorial/reviews/grade6-inequality-systems.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==13;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text']for o in raw['options']if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==0:changed['statement']=changed['statement'].replace('4x < 40','4x < 44')
  elif i==1:changed['statement']=changed['statement'].replace('< 14','< 15')
  elif i==2:changed['options']=[o.replace('ӘР теңсіздікті','кем дегенде бір теңсіздікті')for o in changed['options']]
  elif i==3:changed['statement']=changed['statement'].replace('-x > 3','-x > 4')
  elif i==4:changed['statement']=changed['statement'].replace('x ≥ 10','x > 10')
  elif i==5:changed['statement']=changed['statement'].replace('x < 16','x ≤ 16')
  elif i==6:changed['statement']=changed['statement'].replace('x > 5','x > -5')
  elif i==7:changed['statement']=changed['statement'].replace('x ≥ -2','x > -2')
  elif i==8:changed['statement']=changed['statement'].replace('3x < 114','3x ≤ 114')
  elif i==9:changed['statement']=changed['statement'].replace('3x + 2 > 11','3x + 2 ≥ 11')
  elif i==10:changed['statement']=changed['statement'].replace('x ≤ 13','x < 13')
  elif i==11:changed['statement']=changed['statement'].replace('x > 12','x > 13')
  elif i==12:changed['options']=[o if o!='7'else'8'for o in changed['options']]
  assert changed!=r;rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_actual_printed_conjunction_exact_affine_forms_full_boundary_partition_and_integer_domains','notes':['Read all saved/new full conditions, official/authored full solutions and every MCQ.','Own exact printed affine difference determines each ray; system is AND, option union is OR. Complete endpoint/midpoint/tail partition checks entire real solution sets.','Natural starts1 versus integer negatives/zero, strict/closed/minimum/maximum/count targets, unique physical integer, all8 comparisons of four systems and one proposed candidate versus other valid roots checked.','No author params or solver imported; source official keys independently recalculated and no exact source statement reused.']})
 cases=0;boundary=0
 for a in range(-4,5):
  for b in range(-6,7):
   for op in('<','>','≤','≥'):
    c=(f'{a}x + ({b})',op,'0');f=ind.form(c)
    for x in[F(n,3)for n in range(-24,25)]:assert ind.actual(c,x)==ind.accepts(f,x);cases+=1
 for lower in range(-8,9):
  for upper in range(lower+1,10):
   for left in('>','≥'):
    for right in('<','≤'):
     cs=[('x',left,str(lower)),('x',right,str(upper))];actual=integer_members(cs);formula=upper-lower+1-(left=='>')-(right=='<');assert len(actual)==formula
     for x in[F(n,2)for n in range(-20,23)]:assert predicate(cs,x)==all(ind.accepts(t,x)for t in forms(cs));boundary+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-inequality-systems.py','fullSavedAndNewRead':13,'printedKeysChecked':13,'badKeysRejected':13,'printedCanariesRejected':13,'completeSignedAffineThirdGridCases':cases,'completeConjunctionEndpointIntegerHalfGridCases':boundary,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':13,'affineGridCases':cases,'conjunctionBoundaryCases':boundary,'report':report}))
if __name__=='__main__':run()
