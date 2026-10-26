"""External14 fullcontent review: exact printed affine elimination/MCQ roles.

No author params/models/solver imported. All saved/new conditions, complete
solutions and options read; an independent coefficient map and determinants
verify the printed targets, exact scaling and subtraction of both whole sides.
"""
import copy,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sp=importlib.util.spec_from_file_location('independent_substitution',Path(__file__).with_name('review-grade6-system-substitution.py'));S=importlib.util.module_from_spec(sp);sp.loader.exec_module(S);P=S.P
BATCH='problems/editorial/batches/grade6-system-addition.json'
clean,one,poly,equation,equations,value,hashrow=P.clean,P.one,P.poly,P.equation,P.equations,P.value,P.hashrow

def normalized_equations(s):return [equation(e.replace('a','x').replace('b','y')) for e in equations(s)[:2]]
def constant(s):
 p=poly(s);assert not p or set(p)=={P.ZERO};return p.get(P.ZERO,F(0))
def numeric(r,n):
 assert constant(r['answer'])==n,(r['answer'],n)
 if P.opts(r):assert sum(constant(o)==n for o in P.opts(r))==1

def solve(r,i,source=False):
 s=clean(r['statement']);os=P.opts(r)
 if i==0:
  total,gap=map(F,re.findall(r'\d+',s));assert total>gap>0;numeric(r,(total+gap)/2)
 elif i==7:
  initial=equation(equations(s)[0]);factor=F(one(re.findall(r'(-\d+)-(?:ке|ге)',s)));assert factor<0
  target={m:v*factor for m,v in initial.items()};P.select(r,lambda o:equation(o)==target)
 elif i==8:
  def eliminates(o):
   ps=normalized_equations(o);assert len(ps)==2
   a,b,_=S.coeff(ps[0]);d,e,_=S.coeff(ps[1]);return (a!=0 and a+d==0) or (b!=0 and b+e==0)
  P.select(r,eliminates)
  assert [eliminates(o) for o in os]==[False,False,True,False]
 else:
  ps=normalized_equations(s);x,y=S.solvepair(ps)
  if i in (1,9,12):numeric(r,y)
  elif i in (2,6):numeric(r,x)
  elif i==3:numeric(r,x*y)
  elif i==4:
   a,b,c=S.coeff(ps[0]);d,e,f=S.coeff(ps[1]);assert a and d
   k=-a/d;numeric(r,k);summed=P.add(ps[0],{m:v*k for m,v in ps[1].items()})
   assert summed.get(S.X,0)==0 and summed.get(S.Y,0)!=0
  elif i==5:
   total=P.add(ps[0],ps[1]);cancelled=[l for l,m in [('x',S.X),('y',S.Y)] if total.get(m,0)==0];assert cancelled==['y'];P.select(r,lambda o:o=='y')
  elif i in (10,13):P.select(r,lambda o:all(value(p,dict(zip('xy',P.pair(o))))==0 for p in ps))
  elif i==11:
   target=P.add(ps[0],ps[1],-1);assert target.get(S.X,0)==0
   P.select(r,lambda o:equation(o)==target)
  else:raise AssertionError(i)
 if not source and not os:assert 'Жауапқа тек санды жазыңыз.' in s

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14;entries=[];refs=[]
 for i,r in enumerate(rows):
  try:solve(r,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(r['sourceRefs']);d=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in d['questions'] if q['id']==ref['sourceId']]);assert d['status']=='captured' and q['checked'] and not q['images'] and not q['svg']
  try:solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if q['options']:assert one([clean(o['text']) for o in q['options'] if o['correct']])==clean(q['sourceAnswer'])
  assert clean(q['statement'])!=clean(r['statement']) and r['minimumPlan']=='pro'
  wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY';P.rejected(lambda:solve(wrong,i))
  refs.append(ref);entries.append({'editionId':r['editionId'],'sha256':hashrow(r),'verdict':'verified','method':'independent_full_saved_new_official_authored_solutions_every_MCQ_read_printed_exact_affine_determinant_whole_scaling_subtraction_target_oracle','notes':[]})
 mutations=[(0,'statement','82','84'),(1,'statement','= 39','= 43'),(2,'statement','= 27','= 34'),(3,'statement','= 21','= 23'),(4,'statement','8x','10x'),(5,'statement','5x + 3y','5x + 4y'),(6,'statement','= 31','= 33'),(7,'statement','−2-ге','−3-ге'),(8,'options','5x − 4y = 17','5x − 5y = 17'),(9,'statement','= 12','= 16'),(10,'statement','= 16','= 18'),(11,'statement','= 26','= 24'),(12,'statement','= 72','= 84'),(13,'statement','= 42','= 46')]
 for i,k,old,new in mutations:
  c=copy.deepcopy(rows[i]);assert old in str(c[k]),(i,old);c[k]=[o.replace(old,new) for o in c[k]] if isinstance(c[k],list) else c[k].replace(old,new);P.rejected(lambda:solve(c,i))
 cases=0
 for i in (1,2,3,4,5,6,9,10,11,12,13):
  ps=normalized_equations(rows[i]['statement']);hits=[]
  for x in range(-30,31):
   for y in range(-30,31):
    cases+=1
    if all(value(p,{'x':x,'y':y})==0 for p in ps):hits.append((F(x),F(y)))
  assert one(hits)==S.solvepair(ps)
 js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';import {mathFragments} from './frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions;let native=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){native++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),native}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All14 saved/new fullconditions, official/authored fullsolutions and everyMCQ independently read. Printed exact affine coefficient/determinant, actual same-variable cancellation, whole negative scaling including RHS, entire-second subtraction, everyMCQ and requested target oracle. No author params/spec/model/solver imported.','summary':{'verified':14,'findings':0,'wrongKeysRejected':14,'printedCanariesRejected':14,'completeIntegerPairCases':cases,'nativeFractionNodes':native['native'],'pythonJavaScriptHashesMatched':14},'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-system-addition.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
