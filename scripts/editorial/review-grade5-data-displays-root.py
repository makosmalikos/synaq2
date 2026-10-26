"""Independent root: all13 full saved/new conditions, official/new solutions
and every MCQ read. Exact printed circle proportions, common-base budgets,
linear scales, additive sector equations, vote conservation and noncollinear
time-series geometry; no author specs/models/params used as answer oracle.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-data-displays.json'
REPORT='problems/editorial/reviews/grade5-data-displays.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def clean(s):
 s=str(s).replace('$','').replace('{,}',',').replace('\\,','').replace('−','-')
 s=re.sub(r'\\+(?:d?frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
 return s
def options(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))}
 if i==0:
  num,den=n;assert 0<num<den;out=360*num/den;assert out/360==num/den
  proof.update(fullCircle=360,numerator=str(num),denominator=str(den))
 elif i==1:
  angle=n[0];assert 0<angle<360
  if not source:assert n[1]==100
  out=angle/F(360,100);assert out*F(36,10)==angle;proof['onePercentDegrees']='18/5'
 elif i in(2,4,11):
  if i==2:
   # The new prompt explicitly requests a connected time-ordered polyline;
   # bars can compare values but do not meet that representation constraint.
   good=[True,False,False,False]
   if not source:assert 'БІР ТҰТАС СЫНЫҚ СЫЗЫҚПЕН'in s
   wanted='Графиктік диаграмма'if source else'Уақыт нүктелерін кесінділермен қосатын графиктік диаграмма'
  elif i==4:
   good=[True,False,False,False];wanted='Дөңгелек диаграмма'
   if not source:assert 'Әр кітап дәл бір жанрға'in s and '100%'in s
  else:
   wanted='Сынық сызық';good=[False,True,False,False]if source else[True,False,False,False]
   if not source:
    x=n[:3];y=n[3:];assert len(x)==len(y)==3 and x[0]<x[1]<x[2]
    determinant=(x[1]-x[0])*(y[2]-y[0])-(x[2]-x[0])*(y[1]-y[0]);assert determinant
    assert y[0]<y[1]>y[2];proof['actualThreePointNonCollinearity']=str(determinant)
  opts=options(r);assert len(opts)==4 and sum(o==wanted for o in opts)==1 and clean(r['answer'])==wanted
  assert [o==wanted for o in opts]==good;proof.update(everyMCQMeetsRequestedRepresentation=good,answer=wanted);return proof
 elif i==3:
  pct=one(n);assert 0<pct<100;out=360*pct/100;assert out/360*100==pct
 elif i==5:
  cm,metres,altitude=n;assert cm==1 and 0<metres<altitude
  out=altitude/metres;assert out*metres==altitude
  proof.update(scaleMetresPerCentimetre=str(metres),requestedCentimetres=str(out),diagnosticWrongScales=[str(out*10),str(altitude/1000),str(out/10)])
 elif i==6:
  multiplier=one(n);assert multiplier>1;b=360/(multiplier+2);a=multiplier*b;c=b
  assert a+b+c==360 and a/b==multiplier;out=a;proof['orderedSectors']=list(map(str,[a,b,c]))
 elif i==7:
  a,b=n;remaining=100-a-b;assert min(a,b,remaining)>0;out=360*remaining/100
  assert 360*a/100+360*b/100+out==360
  if not source:assert 'БАСТАПҚЫ'in s
  proof.update(commonBasePercent=100,remainingPercent=str(remaining),requestedRemainingAngle=str(out))
 elif i==8:
  d,multiplier,excess=n;unit=(360-d-excess)/(2*multiplier+1);b=multiplier*unit;a=b+excess
  assert min(d,unit,b,a)>0 and a+b+unit+d==360 and b/unit==multiplier and a-b==excess
  out=a;proof['orderedABCD']=list(map(str,[a,b,unit,d]))
 elif i==9:
  pupils,angle,other=n;rate=angle/pupils;second=other/rate;total=360/rate;out=second-pupils
  assert all(v.denominator==1 and v>0 for v in[pupils,second,total,out])and total>=pupils+second
  assert out==(other-angle)/rate
  proof.update(degreesPerPupil=str(rate),secondCount=str(second),requestedDifference=str(out),remainingOtherPupils=str(total-pupils-second))
 elif i==10:
  step=one(n);small=(360-step*sum(range(5)))/5;sectors=[small+step*j for j in range(5)]
  assert min(sectors)>0 and sum(sectors)==360;out=max(sectors);assert out==72+2*step
  proof['allFiveSectors']=list(map(str,sectors))
 elif i==12:
  if source:aAngle,bAngle,aVotes,extra=n
  else:aAngle,aVotes,bAngle,extra=n
  rate=aAngle/aVotes;total=360/rate;bVotes=bAngle/rate;remainder=total-aVotes-bVotes;dVotes=(remainder-extra)/2;cVotes=dVotes+extra
  assert all(v.denominator==1 and v>0 for v in[aVotes,bVotes,cVotes,dVotes,total])
  assert sum([aVotes,bVotes,cVotes,dVotes])==total and cVotes-dVotes==extra
  out=dVotes*rate;assert aAngle+bAngle+cVotes*rate+out==360
  proof.update(degreesPerVote=str(rate),orderedVoteCounts=list(map(str,[aVotes,bVotes,cVotes,dVotes])),requestedDAngleNotVoteCount=str(out))
 else:raise AssertionError(i)
 assert one(ns(clean(r['answer'])))==out,(i,r['answer'],out)
 if options(r):assert sum(ns(o)==[out]for o in options(r))==1
 proof['answer']=str(out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==13
 entries=[];evidence=[];canaries=0;claims=0
 for i,r in enumerate(rows):
  proof=solve(r,i);ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId'])
  assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  if q.get('options'):assert clean(one(o['text']for o in q['options']if o['correct']))==clean(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['topic']=='stats'and clean(r['statement'])!=clean(q['statement'])and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  if not r.get('options'):assert'options'not in r
  changed=copy.deepcopy(r);changed['answer']='INVALID_KEY'
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r)
  if i in(2,4,11):changed['options'][changed['options'].index(changed['answer'])]='INVALID_OPTION'
  else:
   # Alter a mathematical given, never the invariant 1cm scale unit.
   pattern='400'if i==5 else r'\d+(?:,\d+)?';m=re.search(pattern,changed['statement']);assert m
   changed['statement']=changed['statement'][:m.start()]+str(F(m.group().replace(',','.'))+1)+changed['statement'][m.end():]
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:,\d+)?(?:\s*[+×÷:-]\s*-?\d+(?:,\d+)?)+)\s*=\s*(-?\d+(?:,\d+)?(?:\s*[+×÷:-]\s*-?\d+(?:,\d+)?)*)',clean(r['solution'])):
   a,b=m.groups();assert H.calc(a.replace('÷','/'))==H.calc(b.replace('÷','/')),(i,a,b);claims+=1
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceFromPrintedCondition':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_full_saved_new_solutions_every_MCQ_read_exact_printed_circle_scale_budget_vote_ledgers_and_noncollinear_chart_representation','notes':[json.dumps(proof,ensure_ascii=False)]})
 proportions=0
 for total in range(1,101):
  for part in range(total+1):
   angle=F(360*part,total);assert angle/360==F(part,total)and angle/F(36,10)==F(100*part,total);proportions+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==3
 report={'schemaVersion':1,'reviewer':'root_independent_of_data_display_author','batch':BATCH,'scope':__doc__,'summary':{'verified':13,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':13,'wrongKeysRejected':13,'printedGivensOrMCQCanariesRejected':canaries,'printedElementaryClaims':claims,'exactProportionCases':proportions,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':13},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
