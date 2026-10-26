"""External full saved/new content reading and exact printed-system oracle.

No author specs/params/models imported. Separate multivariate coefficient map
and determinants, all MCQ residuals, universal identities and integer coefficient
isolation criterion independently check each requested role.
"""
import copy,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
S=importlib.util.spec_from_file_location('independent_polynomial',Path(__file__).with_name('review-grade6-two-variable-lines.py'));P=importlib.util.module_from_spec(S);S.loader.exec_module(P)
BATCH='problems/editorial/batches/grade6-system-substitution.json'
clean,one,poly,equation,equations,value,hashrow=P.clean,P.one,P.poly,P.equation,P.equations,P.value,P.hashrow
X=(1,0,0,0,0,0);Y=(0,1,0,0,0,0);ZERO=P.ZERO

def coeff(p):
 assert P.affine(p)
 return [p.get(k,F(0)) for k in (X,Y,ZERO)]
def systems(s):return [equation(e) for e in equations(s)[:2]]
def solvepair(ps):
 assert len(ps)==2
 a,b,c=coeff(ps[0]);d,e,f=coeff(ps[1]);D=a*e-b*d;assert D
 x,y=(b*f-c*e)/D,(c*d-a*f)/D
 assert all(value(p,{'x':x,'y':y})==0 for p in ps)
 return x,y
def opts(r):return P.opts(r)
def select(r,predicate):P.select(r,predicate)
def numeric(r,answer):P.numeric(r,answer)
def pair(s):return P.pair(s)
def solve(r,i,source=False):
 s=clean(r['statement']);os=opts(r)
 if i in (2,8):
  p=equation(equations(s)[0]);select(r,lambda o:P.equivalent(p,equation(o)))
 elif i==11:
  total,factor=map(F,re.findall(r'\d+',s));assert total>0 and factor>1
  numeric(r,total*factor/(factor+1))
 else:
  ps=systems(s);x,y=solvepair(ps)
  if i in (0,3,4):select(r,lambda o:all(value(p,dict(zip('xy',pair(o))))==0 for p in ps))
  elif i in (1,13):numeric(r,y)
  elif i in (5,6,12):
   numeric(r,x)
   if i==6:
    a,b,c=coeff(ps[0]);d,e,f=coeff(ps[1]);assert a>0 and b<0 and d==e==1
    wrongX=(-c-b*(-f))/(a+b);assert wrongX!=x
    assert F(os[0])==wrongX and F(os[1])==y and F(os[-1])==-x
    if not source:assert 'қате жазды' in s and '−24 + 3x' in r['solution']
  elif i==7:
   # Direct isolation without a fractional coefficient, after exact reduction.
   def fractional_free(o):
    equationIndex=0 if 'бірінші' in o.casefold() else 1
    var='x' if 'x-' in o else 'y';a,b,c=coeff(ps[equationIndex]);v=a if var=='x' else b;other=b if var=='x' else a
    return v!=0 and (other/v).denominator==1 and (c/v).denominator==1
   select(r,fractional_free)
  elif i==9:
   # Substitute x from x+y=C into second equation, compare complete printed
   # polynomial coefficients in y, rather than one fortunate root only.
   a,b,c=coeff(ps[0]);assert a==b==1
   # Replace x by C-y symbolically in equation2 through its coefficients.
   d,e,f=coeff(ps[1]);target=P.add(poly(str(d*(-c)+f)),poly(str(e-d)+'y'))
   select(r,lambda o:equation(o)==target)
   # Each distractor must fail the desired substitution, not just have bad syntax.
   assert sum(equation(o)==target for o in os)==1
  elif i==10:numeric(r,x*y)
  else:raise AssertionError(i)
 if not source and not os:assert 'Жауапқа тек санды жазыңыз.' in s

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14;entries=[];refs=[]
 for i,r in enumerate(rows):
  try:solve(r,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(r['sourceRefs']);d=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in d['questions'] if q['id']==ref['sourceId']]);assert d['status']=='captured' and q['checked'] and not q['images'] and not q['svg'];src={**q,'answer':q['sourceAnswer']}
  try:solve(src,i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if q['options']:assert one([clean(o['text']) for o in q['options'] if o['correct']])==clean(q['sourceAnswer'])
  assert clean(r['statement'])!=clean(q['statement']);assert r['minimumPlan']=='pro'
  wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY';P.rejected(lambda:solve(wrong,i))
  refs.append(ref);entries.append({'editionId':r['editionId'],'sha256':hashrow(r),'verdict':'verified','method':'independent_full_saved_new_conditions_official_authored_solutions_every_MCQ_read_printed_exact_polynomial_determinant_universal_substitution_method_target_oracle','notes':[]})
 mutations=[(0,'statement','-1;','-2;'),(1,'statement','27.','28.'),(2,'statement','= 5','= 6'),(3,'statement','= 20','= 24'),(4,'statement','= 7','= 8'),(5,'statement','= 28','= 32'),(6,'statement','= 16','= 24'),(7,'statement','3x − 4y = 24','2x − 4y = 20'),(8,'statement','= 14','= 15'),(9,'statement','= 33','= 34'),(10,'statement','= 19','= 21'),(11,'statement','54','60'),(12,'statement','= 16','= 20'),(13,'statement','= 28','= 30')]
 for i,k,old,new in mutations:
  c=copy.deepcopy(rows[i]);assert old in c[k],(i,old);c[k]=c[k].replace(old,new);P.rejected(lambda:solve(c,i))
 # Independent unique-solution complete integer domains for pair/system cases.
 domain=0
 for i in (0,1,3,4,5,6,7,9,10,12,13):
  ps=systems(rows[i]['statement']);hits=[]
  for x in range(-30,31):
   for y in range(-30,31):
    domain+=1
    if all(value(p,{'x':x,'y':y})==0 for p in ps):hits.append((F(x),F(y)))
  assert one(hits)==solvepair(ps)
 js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';import {mathFragments} from './frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions;let native=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){native++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),native}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All14 saved/new fullconditions, official/authored fullsolutions and everyMCQ read. Printed exact affine determinants, full coefficient substitution identities, all option residuals, requested x/y/product/larger roles and genuine fraction-free method criterion checked; no author models/params/solver imported.','summary':{'verified':14,'findingsResolved':1,'wrongKeysRejected':14,'printedCanariesRejected':14,'completeIntegerPairCases':domain,'nativeFractionNodes':native['native'],'pythonJavaScriptHashesMatched':14},'resolvedFindings':[{'sourceId':'cfaeb550b5422277','finding':'New second2x-4y=20 admitted integer x isolation as well as first y; source method-choice uniqueness weakened.','resolution':'Second equation changed to3x-4y=24, preserving solution(4;-3) while both second-equation isolations require a fractional coefficient; final fullrow reread and separate exact coefficient criterion confirms unique first-y choice.'}],'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-system-substitution.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
