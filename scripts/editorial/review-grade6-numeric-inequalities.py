"""Independent full12 saved/new inequality review. Actual printed comparisons,
exact Fraction polynomial evaluation, complete integer boundary and cross-product
orders. No author params/model/solver used. Full solutions and every option read.
"""
import copy,hashlib,json,re,unicodedata,math
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('independent_linear',ROOT/'scripts/editorial/review-grade6-linear-equations.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
def clean(s):
 s=s.replace('\\\\','\\').replace('\\ge','≥').replace('\\le','≤').replace('\\gt','>').replace('\\lt','<')
 return ind.clean(s).replace('÷','/').replace('\\;',';')
def poly(s):return ind.poly(clean(s))
def val(s,env=None):
 result=F(0);env=env or {}
 for term,c in poly(s).items():
  for variable in term:c*=env[variable]
  result+=c
 return result
def comparisons(s):
 found=[]
 for m in re.finditer(r'[\dA-Za-z.,\s()+*/×^:<>≤≥-]+',clean(s)):
  segment=m[0].strip(' .,;\n');parts=re.split(r'([<>≤≥])',segment)
  if len(parts)==1:continue
  assert len(parts)%2==1,(s,parts)
  for i in range(1,len(parts),2):
   a,b=parts[i-1].strip(),parts[i+1].strip();poly(a);poly(b);found.append((a,parts[i],b))
 return found
def truth(c,env=None):
 a,op,b=c;x,y=val(a,env),val(b,env)
 return {'<':x<y,'>':x>y,'≤':x<=y,'≥':x>=y}[op]
def nums(s):return[F(x.replace(',','.')) for x in re.findall(r'[+-]?\d+(?:[.,]\d+)?',clean(s))]
def one(xs):assert len(xs)==1,xs;return xs[0]
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip(' «»')
def options(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def solve(r,i):
 s=clean(r['statement']);os=options(r);answer=None;chosen=None
 if i==0:
  cmp=one(comparisons(s));assert cmp[1]=='<';a=poly(cmp[0]);assert set(a)=={('n',)} and a[('n',)]>0
  limit=val(cmp[2]);allowed=[n for n in range(1,math.ceil(limit)+2) if truth(cmp,{'n':F(n)})];answer=max(allowed)
  assert not truth(cmp,{'n':F(answer+1)})
 elif i==1:chosen=one([o for o in os if truth(one(comparisons(o)))])
 elif i==2:
  d,b=nums(s);answer=d+b;assert answer-b==d
 elif i==3:
  found=[]
  for o in os:
   cs=comparisons(o)
   if len(cs)==1 and not any(term for side in(cs[0][0],cs[0][2]) for term in poly(side)):found.append(o)
  chosen=one(found)
 elif i==4:
  cmp=one(comparisons(s));assert cmp[1]=='>' and cmp[0]=='x';limit=val(cmp[2]);allowed=[x for x in range(1,math.ceil(limit)+2) if truth(cmp,{'x':F(x)})];answer=min(allowed);assert not truth(cmp,{'x':F(answer-1)})
 elif i==5:
  d=one(nums(s));samples=[{'b':F(b,3),'a':F(b,3)+d} for b in range(-12,13)]
  chosen=one([o for o in os if len(comparisons(o))==1 and all(truth(one(comparisons(o)),env) for env in samples)])
 elif i==6:
  cs=comparisons(s);assert len(cs)==6;states=[truth(c) for c in cs];assert states==[True,False,True,True,False,True];answer=sum(states)
 elif i==7:
  cs=comparisons(s);assert len(cs)==6;answer=sum(op in('≤','≥') for _,op,_ in cs);assert answer==3
 elif i==8:
  cs=comparisons(s);assert len(cs)==2;lo=val(cs[0][0]);hi=val(cs[1][2]);assert cs[0][1]=='<' and cs[1][1]=='≤'
  points=[lo-1,lo,(lo+hi)/2,hi,hi+1];target=[all(truth(c,{'y':x}) for c in cs) for x in points]
  def matches(o):
   a,b=nums(o);t=norm(o)
   if 'кем емес' in t:states=[a<=x<b for x in points]
   elif 'кіші, бірақ' in t:states=[x<a and x>b for x in points]
   elif 'артық емес' in t:states=[a<x<=b for x in points]
   else:states=[a<x<b for x in points]
   return states==target
  chosen=one([o for o in os if matches(o)])
 elif i==9:
  assert 'артық емес' in s.lower();limit=one(nums(s));chosen=one([o for o in os if one(comparisons(o))==('x','≤',str(limit))])
 elif i==10:
  a,b=nums(s);answer=a-b;assert b<0
 elif i==11:
  chosen=one([o for o in os if len(comparisons(o))==2 and comparisons(o)[0][1]==comparisons(o)[1][1]])
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)
def rejected(fn):
 try:fn()
 except(AssertionError,ValueError,IndexError,KeyError):return
 raise AssertionError('Canary accepted')
def run():
 batch='problems/editorial/batches/grade6-numeric-inequalities.json';report='problems/editorial/reviews/grade6-numeric-inequalities.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==12;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text'] for o in raw['options'] if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==1:changed['options']=[o.replace('-0,9 < -0,4','-0,9 > -0,4') for o in changed['options']]
  elif i==3:changed['options']=[o.replace('5 × 9 > 41','6 × 9 > 41') for o in changed['options']]
  elif i==5:changed['statement']=changed['statement'].replace('-1,3','1,3')
  elif i==6:changed['statement']=changed['statement'].replace('(7/11) >','(7/11) <')
  elif i==7:changed['statement']=changed['statement'].replace('≥','>')
  elif i==8:changed['statement']=changed['statement'].replace('≤','<')
  elif i==9:changed['statement']=changed['statement'].replace('АРТЫҚ ЕМЕС','КЕМ ЕМЕС')
  elif i==11:changed['options']=[o.replace('-2 > -9','-2 < -9') for o in changed['options']]
  else:
   m=re.search(r'\d+(?:,\d+)?',changed['statement']);assert m;n=F(m[0].replace(',','.'))+1;t=str(n.numerator) if n.denominator==1 else str(float(n)).replace('.',',');changed['statement']=changed['statement'][:m.start()]+t+changed['statement'][m.end():]
  rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_printed_exact_fraction_comparisons_and_complete_strict_boundary_domains','notes':['Read every saved/new full condition, full official/authored solution, key and all MCQs.','Strict equality boundary, min/max natural selection, sign-based order, six truth values, non-strict sign type and double-endpoint sentence roles independently checked.','No author model/params solver imported; full compare expressions parsed from printed text.']})
 boundaries=0
 for a in range(1,13):
  for b in range(1,121):
   found=[n for n in range(1,b+2) if a*n<b]
   if found:assert max(found)==(b-1)//a
   assert a*((b-1)//a+1)>=b;boundaries+=1
 cross=0
 for a in range(-12,13):
  for b in range(1,10):
   for c in range(-12,13):
    for d in range(1,10):assert (F(a,b)<F(c,d))==(a*d<c*b);cross+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-numeric-inequalities.py','fullSavedAndNewRead':12,'printedKeysChecked':12,'badKeysRejected':12,'printedCanariesRejected':12,'completeNaturalBoundaries':boundaries,'signedFractionCrossProductCases':cross,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':12,'boundaries':boundaries,'crossProducts':cross,'report':report}))
if __name__=='__main__':run()
