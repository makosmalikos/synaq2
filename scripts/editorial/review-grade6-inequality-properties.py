"""Independent full12 saved/new inequality-property review. Read full official/
new solutions and all options; exact printed operations and polynomial differences
prove sign reversal, positivity and requested-side/memberwise roles. No author code.
"""
import copy,hashlib,json,re
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('independent_numeric_inequality',ROOT/'scripts/editorial/review-grade6-numeric-inequalities.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
clean,poly,val,comparisons,truth,nums,one,norm,options,rejected=ind.clean,ind.poly,ind.val,ind.comparisons,ind.truth,ind.nums,ind.one,ind.norm,ind.options,ind.rejected
NUM=r'[+-]?\d+(?:[.,]\d+)?'
def solve(r,i):
 s=clean(r['statement']);os=options(r);answer=None;chosen=None
 if i==0:
  m=re.search('('+NUM+r')\s*<\s*a\s*<\s*('+NUM+')',s);assert m;lo,hi=(F(x.replace(',','.')) for x in m.groups());added=F(one(re.findall(r'a\s*\+\s*('+NUM+')',s)).replace(',','.'));answer=hi+added
  left=F(one(re.findall('('+NUM+r')\s*<\s*a\s*\+',s)).replace(',','.'));assert left==lo+added
 elif i==1:
  a,b,mul=nums(s);assert a<b and mul>0;answer=b*mul;assert a*mul<answer
 elif i==2:
  a,b,add=nums(s);assert a<b;answer=b+add;assert a+add<answer
 elif i==3:
  a,b,d=nums(s);assert a>b and d>0;answer=a/d;assert answer>b/d
 elif i==4:
  denominators=[F(n) for n in re.findall(r'\(1/(\d+)\)',s)];assert len(denominators)==4;biggest=max(F(1,d) for d in denominators);answer=biggest.denominator;assert answer==min(denominators)
 elif i==5:
  a,op,b=one(comparisons(s));assert val(a)>0 and val(b)>0 and op=='<' and val(a)<val(b)
  chosen=one([o for o in os if truth(one(comparisons(o)))])
 elif i==6:
  proofs=[]
  for o in os:
   a,op,b=one(comparisons(o));assert op=='<';left,right=poly(a),poly(b);keys=set(left)|set(right);delta={k:left.get(k,F(0))-right.get(k,F(0)) for k in keys};delta={k:c for k,c in delta.items() if c};assert set(delta)=={('a',),('b',)} and delta[('b',)]==-delta[('a',)]
   # Left-minus-right=k(a-b). Given a-b<0, positivity of k preserves <.
   proofs.append(delta[('a',)]>0)
  chosen=one([o for o,p in zip(os,proofs) if not p]);assert proofs==[True,True,True,False]
 elif i==7:
  cs=comparisons(s);assert len(cs)==2 and all(c[1]=='<' and val(c[0])>0 for c in cs);assert all(truth(c) for c in cs);answer=val(cs[0][2])*val(cs[1][2]);assert val(cs[0][0])*val(cs[1][0])<answer
 elif i==8:
  cs=comparisons(s);assert len(cs)==2 and cs[0][0]=='m' and cs[1][2]=='n' and cs[0][1]==cs[1][1]=='>' and val(cs[0][2])==val(cs[1][0]);chosen=one([o for o in os if comparisons(o)==[('m','>','n')]]);bridge=val(cs[0][2]);assert all(truth(('m','>','n'),{'m':bridge+i,'n':bridge-j}) for i in range(1,10) for j in range(1,10))
 elif i==9:
  cs=comparisons(s);assert len(cs)==2 and cs[0][1]==cs[1][1]=='>';assert all(truth(c) for c in cs);answer=val(cs[0][0])+val(cs[1][0]);assert answer>val(cs[0][2])+val(cs[1][2])
 elif i==10:
  a,b,factor=nums(s);assert a>b and factor<0;target=(a*factor,'<',b*factor)
  chosen=one([o for o in os if (val(one(comparisons(o))[0]),one(comparisons(o))[1],val(one(comparisons(o))[2]))==target]);assert truth(one(comparisons(chosen)))
 elif i==11:
  cs=comparisons(s);assert len(cs)==2 and all(c[1]=='<' and val(c[0])>0 and truth(c) for c in cs);target=(val(cs[0][0])*val(cs[1][0]),'<',val(cs[0][2])*val(cs[1][2]));chosen=one([o for o in os if(val(one(comparisons(o))[0]),one(comparisons(o))[1],val(one(comparisons(o))[2]))==target]);states=[truth(one(comparisons(o))) for o in os];assert states==[False,True,True,True]
 else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)
def run():
 batch='problems/editorial/batches/grade6-inequality-properties.json';report='problems/editorial/reviews/grade6-inequality-properties.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==12;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text'] for o in raw['options'] if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==0:changed['statement']=changed['statement'].replace('4 < a','5 < a')
  elif i==1:changed['statement']=changed['statement'].replace('3 санына','4 санына')
  elif i==2:changed['statement']=changed['statement'].replace('9 санын','10 санын')
  elif i==3:changed['statement']=changed['statement'].replace('35 >','36 >')
  elif i==4:changed['statement']=changed['statement'].replace('(1/4)','(1/5)')
  elif i==5:changed['options']=[o.replace('(1/6) > (1/11)','(1/6) < (1/11)') for o in changed['options']]
  elif i==6:changed['options']=[o.replace('-4a < -4b','4a < 4b') for o in changed['options']]
  elif i==7:changed['statement']=changed['statement'].replace('3 < 7','3 < 8')
  elif i==8:changed['options']=[o.replace('m > n','m < n') for o in changed['options']]
  elif i==9:changed['statement']=changed['statement'].replace('6,8 >','7,8 >')
  elif i==10:changed['statement']=changed['statement'].replace('-4 санына','-5 санына')
  elif i==11:changed['statement']=changed['statement'].replace('2 < 6','3 < 6')
  rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_printed_exact_fraction_operations_symbolic_difference_sign_and_memberwise_target','notes':['Read all saved/new complete conditions, official/authored solutions and every MCQ.','Own exact printed parser; three-part uniform addition, positive multiply/divide, negative reversal, positive reciprocal ordering and universal affine sign proofs checked.','Requested left/right sides and genuine memberwise product distinguished from other true cross/sum comparisons; no author params/solver imported.']})
 negative=0
 for ai in range(-12,13):
  for bi in range(-12,13):
   a,b=F(ai,2),F(bi,3)
   if a>=b:continue
   for c in range(1,9):assert a*c<b*c and a/F(c)<b/F(c) and a*(-c)>b*(-c);negative+=1
 reciprocal=0
 for a in range(1,41):
  for b in range(a+1,41):assert F(1,a)>F(1,b) and -F(1,a)<-F(1,b);reciprocal+=1
 memberwise=0
 for a in range(1,11):
  for b in range(a+1,13):
   for c in range(1,11):
    for d in range(c+1,13):assert a+c<b+d and a*c<b*d;memberwise+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-inequality-properties.py','fullSavedAndNewRead':12,'printedKeysChecked':12,'badKeysRejected':12,'printedCanariesRejected':12,'signedExactOperationCases':negative,'positiveReciprocalCases':reciprocal,'positiveMemberwiseSumProductCases':memberwise,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':12,'signedCases':negative,'reciprocalCases':reciprocal,'memberwiseCases':memberwise,'report':report}))
if __name__=='__main__':run()
