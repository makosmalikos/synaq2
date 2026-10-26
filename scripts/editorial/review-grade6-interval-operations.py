"""Independent full11 saved/new union/intersection review. Literal membership
predicates and all endpoint/cell partitions, complete bracket pairs. No author code.
All original/authored full solutions and every choice were read separately.
"""
import copy,hashlib,json,re,math
from fractions import Fraction as F
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[2]
sp=spec_from_file_location('independent_interval',ROOT/'scripts/editorial/review-grade6-interval-notation.py');ind=module_from_spec(sp);sp.loader.exec_module(ind)
clean,intervals,valid,member,points,pick_set=ind.clean,ind.intervals,ind.valid,ind.member,ind.points,ind.pick_set
one,nums,val,norm,options,rejected=ind.one,ind.nums,ind.val,ind.norm,ind.options,ind.rejected
def operation(s):
 s=clean(s);ts=intervals(s);assert len(ts)==2 and all(valid(t)for t in ts);op='union'if'∪'in s else'intersection'if'∩'in s else None;assert op
 return ts,(lambda x:any(member(t,x)for t in ts))if op=='union'else(lambda x:all(member(t,x)for t in ts))
def integers(ts,predicate,natural=False):
 ends=[n for t in ts for n in(t[1],t[2])if math.isfinite(n)];assert ends
 return[n for n in range(math.floor(min(ends))-1,math.ceil(max(ends))+2)if predicate(F(n))and(not natural or n>=1)]
def solve(r,i):
 s=clean(r['statement']);os=options(r);answer=None;chosen=None
 if i==6:
  assert'∩'in s
  table=[(False,False),(False,True),(True,False),(True,True)];target=[a and b for a,b in table]
  def semantics(o):
   o=norm(o)
   if'кем дегенде'in o:return[a or b for a,b in table]
   if'бірақ'in o:return[a and not b for a,b in table]
   if'тиісті емес'in o:return[not a and not b for a,b in table]
   return[a and b for a,b in table]
  chosen=one([o for o in os if semantics(o)==target]);assert'да,'in chosen
 else:
  ts,predicate=operation(s)
  if i in(0,2,4,9):chosen=pick_set(os,predicate,ts)
  elif i in(1,10):answer=len(integers(ts,predicate))
  elif i==3:answer=max(integers(ts,predicate))
  elif i==5:
   match=re.search(ind.PAT,s);candidates=nums(s[:match.start()]);assert len(candidates)==6;answer=sum(predicate(x)for x in candidates)
  elif i==7:
   xs=integers(ts,predicate);answer=min(xs)+max(xs)
  elif i==8:answer=min(integers(ts,predicate,True))
  else:raise AssertionError(i)
 if chosen is not None:assert norm(r['answer'])==norm(chosen),(i,r['answer'],chosen)
 else:assert val(str(r['answer']))==answer,(i,r['answer'],answer)
def run():
 batch='problems/editorial/batches/grade6-interval-operations.json';report='problems/editorial/reviews/grade6-interval-operations.json';rows=json.loads((ROOT/batch).read_text())['editions'];assert len(rows)==11;entries=[]
 for i,r in enumerate(rows):
  solve(r,i);assert r['grade']==6 and r['minimumPlan']=='pro';ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured'and raw['checked']and raw['solution'];saved=copy.deepcopy(raw);saved['answer']=raw['sourceAnswer'];solve(saved,i)
  if options(raw):assert norm(one([o['text']for o in raw['options']if o['correct']]))==norm(raw['sourceAnswer'])
  assert norm(r['statement'])!=norm(raw['statement']);bad=copy.deepcopy(r);bad['answer']='9999';rejected(lambda:solve(bad,i));changed=copy.deepcopy(r)
  if i==0:changed['statement']=changed['statement'].replace('[-3;','[-4;')
  elif i==1:changed['statement']=changed['statement'].replace('[-4;','[-5;')
  elif i==2:changed['statement']=changed['statement'].replace('; -5)','; 3)')
  elif i==3:changed['statement']=changed['statement'].replace('; 9]','; 10]')
  elif i==4:changed['statement']=changed['statement'].replace('; 3]','; 4]')
  elif i==5:changed['statement']=changed['statement'].replace('-9; -8;','-8; -8;')
  elif i==6:changed['statement']=changed['statement'].replace('∩','∪')
  elif i==7:changed['statement']=changed['statement'].replace('; 15)','; 16)')
  elif i==8:changed['statement']=changed['statement'].replace('(4,6;','(5,6;')
  elif i==9:changed['statement']=changed['statement'].replace('; 6]','; 6)')
  elif i==10:changed['statement']=changed['statement'].replace('; 6]','; 7]')
  rejected(lambda:solve(changed,i));h=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':h,'verdict':'verified','method':'independent_literal_union_OR_intersection_AND_exact_cell_partition_and_complete_bracket_pairs','notes':['Read all saved/new complete conditions, full official/authored solutions and each MCQ.','Union OR and intersection AND evaluated from literal bounds/brackets on complete endpoint/midpoint/tail cells, no author params/solver.','Empty opposite rays, closed touching singleton, double-counting overlap, mixed brackets, integer extrema/counts, decimal natural minimum and six actual listed values checked.','Definition choice asks exact meaning; weaker OR implication is true under AND but not the AND truth table.']})
 ts=[(l,F(a),F(b),r)for a in range(-3,4)for b in range(a+1,4)for l in'(['for r in')]'];grid=[F(i,4)for i in range(-16,17)];cases=0;touch=0
 for A in ts:
  for B in ts:
   lo=max(A[1],B[1]);hi=min(A[2],B[2]);lc=member(A,lo)and member(B,lo);rc=member(A,hi)and member(B,hi)
   empty=lo>hi or(lo==hi and not(lc and rc));I=('['if lc else'(',lo,hi,']'if rc else')')
   if lo==hi:touch+=1
   first,second=sorted((A,B),key=lambda t:t[1]);merge=first[2]>second[1]or(first[2]==second[1]and(member(first,first[2])or member(second,second[1])))
   lower=min(A[1],B[1]);upper=max(A[2],B[2]);U=('['if member(A,lower)or member(B,lower)else'(',lower,upper,']'if member(A,upper)or member(B,upper)else')')
   for x in grid:
    assert(all(member(t,x)for t in(A,B)))==(False if empty else member(I,x))
    if merge:assert any(member(t,x)for t in(A,B))==member(U,x)
    cases+=1
 out={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade6-interval-operations.py','fullSavedAndNewRead':11,'printedKeysChecked':11,'badKeysRejected':11,'printedCanariesRejected':11,'completeBracketPairMembershipCases':cases,'touchingEndpointConfigurations':touch,'authorSolverImported':False,'findings':[]},'entries':entries};(ROOT/report).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'verified':11,'bracketPairCases':cases,'touchingConfigurations':touch,'report':report}))
if __name__=='__main__':run()
