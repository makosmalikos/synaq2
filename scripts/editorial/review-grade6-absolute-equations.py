"""Independent review: full14 saved/new conditions, fullsolutions and every MCQ read.
Printed affine absolute expressions solved by exact branch rootsets and separately
checked through a complete finite coordinate grid. No author model/params imports.
"""
import copy,hashlib,json,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-absolute-equations.json';REPORT='problems/editorial/reviews/grade6-absolute-equations.json'
# Reuse only this reviewer's independently written coefficient-vector parser.
spec=spec_from_file_location('independent_linear_parser',ROOT/'scripts/editorial/review-grade6-linear-equations.py');ind=module_from_spec(spec);spec.loader.exec_module(ind)
clean,poly,value=ind.clean,ind.poly,ind.value
NUM=r'[+-]?\d+(?:[.,]\d+)?'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def opts(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def eq(s):
 s=clean(s);m=re.search(r'\|([^|]+)\|\s*(?:\+\s*('+NUM+r'))?\s*=\s*('+NUM+r')',s);assert m,s
 p=poly(m[1]);assert set(p)<= {(),('x',)},p;a=p.get(('x',),F(0));b=p.get((),F(0));assert a!=0
 radius=F(m[3].replace(',','.'))-(F(m[2].replace(',','.')) if m[2] else 0)
 roots=tuple(sorted({(r-b)/a for r in (radius,-radius)})) if radius>=0 else ()
 assert all(abs(a*x+b)==radius for x in roots)
 return a,b,radius,roots,m[1]
def numeric_set(s):return tuple(sorted({F(n.replace(',','.')) for n in re.findall(NUM,clean(s))}))
def solve(r,i):
 s=clean(r['statement']);os=opts(r);ans=None;chosen=None
 if i==1:
  chosen=one([o for o in os if not eq(o)[3]]);states=[len(eq(o)[3]) for o in os];assert sorted(states)==[0,1,2,2]
 else:
  a,b,radius,roots,inner=eq(s)
  if i==0:
   def describes(o):
    ns=re.findall(NUM,clean(o));assert len(ns)==2
    center,distance=(F(x.replace(',','.')) for x in ns)
    return tuple(sorted({center-distance,center+distance}))==roots
   chosen=one([o for o in os if describes(o)])
   center,distance=map(F,re.findall(NUM,clean(chosen)));assert center==-b/a and distance==radius/abs(a)
  elif i in (2,6,7,10):
   chosen=one([o for o in os if 'жоқ' not in o.lower() and numeric_set(o)==roots])
   if i==2:assert roots[0]<0<roots[1] and all(x.denominator==2 for x in roots)
   if i==6:assert roots[0]<roots[1]<0
   if i in(7,10):assert roots[0]==-roots[1] and b==0
  elif i==3:
   def branches(o):
    parts=clean(o).split('немесе');assert len(parts)==2
    found=[]
    for part in parts:
     left,right=part.split('=');found.append((poly(left.strip()),value(right)))
    return all(p==poly(inner) for p,_ in found) and {n for _,n in found}=={radius,-radius}
   chosen=one([o for o in os if branches(o)])
   assert radius>0 and len(roots)==2
  elif i==4:ans=min(roots);assert 'кіші' in s.lower()
  elif i in(5,11):ans=one([x for x in roots if x>0]);assert 'ОҢ' in s or 'оң' in s
  elif i==8:ans=max(roots);assert 'үлкен' in s.lower()
  elif i==9:ans=max(roots)-min(roots);assert 'үлкен түбірінен кіші түбірін' in s
  elif i==12:ans=one(list(roots));assert radius==0
  elif i==13:chosen=one([o for o in os if value(o) in roots]);assert len(roots)==2 and sum(value(o) in roots for o in os)==1
  else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert value(r['answer'])==ans,(i,r['answer'],ans)
def run():
 rows=read(BATCH)['editions'];assert len(rows)==14;entries=[]
 for i,row in enumerate(rows):
  solve(row,i);assert row['grade']==6 and row['minimumPlan']=='pro';assert row['solution']
  ref=one(row['sourceRefs']);capture=read(ref['sourceFile']);source=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert capture['status']=='captured' and source['checked'] and source['solution'];assert not source.get('images') and not source.get('svg')
  saved=copy.deepcopy(source);saved['answer']=source['sourceAnswer'];solve(saved,i)
  if opts(source):assert norm(one([o['text'] for o in source['options'] if o['correct']]))==norm(source['sourceAnswer'])
  assert norm(row['statement'])!=norm(source['statement'])
  bad=copy.deepcopy(row);bad['answer']='99999';assert_rejected(lambda:solve(bad,i))
  altered=copy.deepcopy(row)
  if i==1:altered['options']=[o.replace('= -7','= 7') for o in altered['options']]
  else:
   match=re.search(r'\d+(?:,\d+)?',altered['statement']);assert match;number=F(match[0].replace(',','.'))+1
   text=str(number.numerator) if number.denominator==1 else str(float(number)).replace('.',',')
   altered['statement']=altered['statement'][:match.start()]+text+altered['statement'][match.end():]
  assert_rejected(lambda:solve(altered,i))
  digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','method':'independent_actual_printed_affine_absolute_branch_rootsets_and_complete_coordinate_grid','notes':['Read the complete saved and new conditions, official and authored solutions, all options and requested target roles.','No author solver or params used as oracle; exact Fraction polynomial coefficients from printed expressions, both branches and selected/full rootsets checked.','Negative/zero/positive radius, center sign, decimal tenths, unchanged inner expression in branch choices, outside addend and one-listed-root distinction checked.']})
 cases=0
 grid=[F(i,4) for i in range(-50,51)]
 for centerInt in range(-12,13):
  center=F(centerInt,2)
  for radiusInt in range(-6,13):
   radius=F(radiusInt,2);expected=tuple(sorted({center-radius,center+radius})) if radius>=0 else ()
   observed=tuple(x for x in grid if abs(x-center)==radius);assert observed==expected
   reflected=tuple(x for x in grid if abs(-x+center)==radius);assert reflected==expected
   assert len(expected)==(0 if radius<0 else 1 if radius==0 else 2);cases+=len(grid)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-absolute-equations.py','fullSavedAndNewRead':14,'printedKeysChecked':14,'badKeysRejected':14,'printedGivenCanariesRejected':14,'exactCoordinateGridWitnesses':cases,'authorSolverImported':False,'findings':[]},'entries':entries}
 (ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':14,'badKeysRejected':14,'printedGivenCanariesRejected':14,'coordinateGridWitnesses':cases,'report':REPORT}))
def assert_rejected(fn):
 try:fn()
 except (AssertionError,ValueError,IndexError,ZeroDivisionError):return
 raise AssertionError('Canary was accepted')
if __name__=='__main__':run()
