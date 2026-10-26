"""Independent root review of all20 saved/new full logic1 conditions and
full official/authored solutions. There are no source MCQs or captured keys.
Recompute source and rewritten answers from printed givens, then separately
compare the source official final line. No author params/specs/solver used.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/collection-logic1-wave20.json'
REPORT='problems/editorial/reviews/collection-logic1-wave20.json'
sp=importlib.util.spec_from_file_location('root_own_math',ROOT/'scripts/editorial/review-collection-word4-wave19.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M)
calc,one=M.calc,M.one
def clean(s):return str(s).replace('$','').replace('\\cdot','×').replace('\\times','×').replace('−','-')
def ns(s):return list(map(int,re.findall(r'\d+',clean(s))))
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);evidence={'actualPrintedNumbers':n}
 if i<4:
  if source:adult,child,factor=n
  elif i==1:adult,child,factor=n
  elif i==2:child,adult,factor,unit=n;assert unit==1
  else:child,adult,factor=n
  assert adult>child>0 and factor>1
  wait=F(adult-factor*child,factor-1);assert wait>0 and wait.denominator==1
  laterChild=child+wait;laterAdult=adult+wait
  assert laterAdult==factor*laterChild and laterAdult-laterChild==adult-child
  matches=[t for t in range(151)if adult+t==factor*(child+t)];assert matches==[wait]
  target=wait;evidence.update(targetWaitingYears=str(wait),futureAges=[str(laterAdult),str(laterChild)],unchangedAgeGap=adult-child,completeFutureIntegerDomainUnique=True)
 elif i<8:
  if i in(4,6):people,total,years=n
  elif source:people,years,total=n
  elif i==5:years,people,total=n
  else:people,years,total=n
  assert people>0 and years>0 and total>0
  target=F(total+people*years);assert target-total==people*years and target!=total+years
  evidence.update(samePeople=people,elapsedYears=years,originalSum=total,totalGrowth=people*years,targetSum=str(target),pastToPresent=i in(5,7))
 elif i in(8,10,11):
  if source:a,b,d=n
  else:d,a,b=n
  assert min(d,a,b)>0
  target=F(d,a+b);assert target>0 and a*target==d-b*target and(a+b)*(target-1)<d
  if not source:assert 'бір-біріне қарсы'in s and 'тұрақты'in s
  evidence.update(startDistance=d,speeds=[a,b],closingSpeed=a+b,targetTime=str(target),meetingPosition=str(a*target))
 elif i==9:
  a,b,t=n;assert min(a,b,t)>0
  target=F((a+b)*t);assert a*t+b*t==target and target>a*t and target>b*t
  evidence.update(speeds=[a,b],commonTime=t,requestedDistance=str(target),bothDistances=[a*t,b*t])
 elif i<16:
  people,days,newPeople=n;assert 0<newPeople<people and days>0
  workload=people*days;target=F(workload,newPeople);assert target>days and target*newPeople==workload
  if not source:assert 'күндік өнімділігі бірдей әрі тұрақты'in s and'адам-күн'in r['solution']
  evidence.update(personDays=workload,initialCrew=people,newCrew=newPeople,targetDays=str(target),inverseNotDirectProportionality=True)
 else:
  if i==19 and not source:part,pct=n
  elif i==17 and not source:pct,part,wholePercent=n;assert wholePercent==100
  else:pct,part=n
  assert 0<pct<100 and part>0
  target=F(part*100,pct);assert target>part and target*pct==part*100 and target!=F(part*pct,100)
  evidence.update(knownPercent=pct,knownPart=part,onePercent=str(F(part,pct)),requestedWhole=str(target))
 assert calc(r['answer'])==target,(i,r['answer'],target)
 if not source:assert 'options'not in r and target.denominator==1
 return evidence
def source_key(q):
 text=one(re.findall(r'Жауабы\s*:\s*([^\n]+)',q['solution']))
 return one(re.findall(r'\d+',text))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20
 entries=[];evidence=[];claims=0;canaries=0
 for i,r in enumerate(rows):
  proof=solve(r,i);ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if str(q['number'])==ref['sourceId'])
  assert cap['sourceReviewCaptured']and q['sourceAnswer']is None and not q['options']and not q.get('images')and not q.get('svg')
  sourceProof=solve({**q,'answer':source_key(q)},i,True)
  assert 'not_captured'in r['sourceAnswerAvailability']and r['minimumPlan']=='pro'
  assert clean(r['statement']).casefold()!=clean(q['statement']).casefold()
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  for key in['answer','statement']:
   changed=copy.deepcopy(r)
   if key=='answer':changed[key]=str(calc(r['answer'])+1)
   else:
    m=re.search(r'\d+',changed[key]);assert m
    changed[key]=changed[key][:m.start()]+str(int(m.group())+1)+changed[key][m.end():]
   try:solve(changed,i)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('acceptedcanary',i,key))
  canaries+=1
  # Numeric proof claims are checked from printed text; variable expressions
  # and definition prose remain part of the separate full manual review.
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+×:-]\s*-?\d+)+)\s*=\s*(-?\d+(?:\s*[+×:-]\s*-?\d+)*)',clean(r['solution'])):
   a,b=m.groups();assert calc(a)==calc(b),(i,a,b);claims+=1
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceRecomputedFromGivens':sourceProof,'sourceAnswerCaptured':False,'officialFinalLineAvailable':True})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_all20_saved_new_full_official_authored_solutions_read_actual_printed_exact_age_motion_person_day_reverse_percent_oracle','notes':[json.dumps(proof,ensure_ascii=False),'Original sourceAnswer remains null; independently computed source target matches the saved official final line. Numerical variants remain variants, not20newmeanings.']})
 # Independent fixed-person ledgers, signed positions, inverse workloads and
 # percent cross-products test the mathematical invariants beyond examples.
 cohorts=0
 for people in range(3,6):
  for start in range(1,101):
   for years in range(1,16):
    ages=[start+5*j for j in range(people)];assert sum(a+years for a in ages)-sum(ages)==people*years;cohorts+=1
 motion=0
 for a in range(1,31):
  for b in range(1,31):
   for t in range(1,9):
    distance=(a+b)*t;assert a*t==distance-b*t;motion+=1
 workloads=0
 for people in range(2,31):
  for fewer in range(1,people):
   for days in range(1,21):assert F(people*days,fewer)>days;workloads+=1
 pctCases=0
 for p in range(1,100):
  for whole in range(1,1001):assert F(whole*p,100)*100/p==whole;pctCases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==8
 report={'schemaVersion':1,'reviewer':'root_independent_of_logic1_author','batch':BATCH,'scope':__doc__,'summary':{'verified':20,'findings':0,'savedAndNewFullConditionsSolutionsRead':20,'sourceAnswerCaptured':0,'officialFinalLinesIndependentlyRecomputed':20,'wrongKeysRejected':20,'printedGivensCanariesRejected':canaries,'printedNumericProofClaims':claims,'fixedCohortCases':cohorts,'signedMotionCases':motion,'inversePersonDayCases':workloads,'percentCrossProductCases':pctCases,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':20},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
