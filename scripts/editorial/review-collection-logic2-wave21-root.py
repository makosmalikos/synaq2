"""Root external review of all20 saved/new full conditions, full official and
authored solutions, and every offered MCQ. Exact printed Fraction arithmetic,
linear equations, moving-body ledgers and correct percent bases; no author
specifications, params, models or calculator imported.18 uncaptured source
keys remain explicitly uncaptured; two original MCQ keys stay distinguished.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/collection-logic2-wave21.json'
REPORT='problems/editorial/reviews/collection-logic2-wave21.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
calc,one,ns=H.calc,H.one,H.ns
def clean(s):return str(s).replace('$','').replace('\\cdot','×').replace('−','-')
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))}
 if i<4:
  price,p=n;assert price>0 and 0<p<100
  paid=price*(100-p)/100;off=price*p/100;assert paid+off==price
  target=paid;proof.update(originalBase=str(price),onePercent=str(price/100),discount=str(off),requestedPaidPrice=str(target))
 elif i<6:
  gap,past,factor=n;assert gap>0 and past>0 and factor>1
  current=gap/(factor-1)+past;older=current+gap;assert current>past and older-past==factor*(current-past)
  assert [age for age in range(int(past)+1,151)if age+gap-past==factor*(age-past)]==[current]
  if not source:
   # Bind the teaching method to every actual printed linear stage, rather
   # than accepting a numerically correct answer from a different shortcut.
   x=current;c=gap-past;constant=factor*past
   required=[f'x + {int(c)} = {int(factor)} × (x − {int(past)})',f'x + {int(c)} = {int(factor)} × x − {int(constant)}',f'{int(factor)} × x − x = {int(c)} + {int(constant)}']
   assert all(t in r['solution']for t in required)
   for eq in required:
    a,b=eq.split('=');assert calc(a,{'x':x})==calc(b,{'x':x})
  target=current;proof.update(requestedCurrentYounger=str(current),currentOlder=str(older),pastAges=list(map(str,[current-past,older-past])),fullLinearMethodRetained=True)
 elif i<8:
  firstGap,secondGap,total=n;young=(total-2*firstGap-secondGap)/3;middle=young+firstGap;old=middle+secondGap
  assert 0<young<middle<old and young+middle+old==total
  target=old;proof.update(orderedAges=list(map(str,[young,middle,old])),requestedOldestNotEquationRoot=True)
 elif i<10:
  slow,delay,fast=n;assert 0<slow<fast and delay>0
  head=slow*delay;target=head/(fast-slow);assert target>0 and fast*target==slow*(target+delay)
  if not source:assert 'ӨЗІ шыққаннан'in s
  proof.update(initialLead=str(head),relativeSpeed=str(fast-slow),requestedPursuerOwnTime=str(target),slowTotalTime=str(target+delay),equalMeetingPosition=str(fast*target))
 elif i<12:
  train,speed,tunnel=n;assert min(n)>0
  target=(train+tunnel)/speed;assert target*speed-train==tunnel and target>tunnel/speed
  if not source:assert 'БАСЫ'in s and 'СОҢҒЫ'in s
  proof.update(trainLength=str(train),tunnelLength=str(tunnel),headTravelDistance=str(train+tunnel),requestedSeconds=str(target))
 elif i<14:
  a,b=n;assert 0<a<b
  length=F(math.lcm(int(a),int(b)));time1=length/a;time2=length/b
  target=2*length/(time1+time2);assert target==2*a*b/(a+b)and target!=(a+b)/2
  assert all(2*L/(L/a+L/b)==target for L in range(1,301))
  proof.update(oneWayLengthWitness=str(length),unequalTimes=list(map(str,[time1,time2])),requestedDistanceWeightedMean=str(target),arithmeticMeanWrong=str((a+b)/2),universalPositiveLengthCancellation=True)
 elif i<16:
  a,b=n;assert 0<a<b
  volume=F(math.lcm(int(a),int(b)));rate1=volume/a;rate2=volume/b;target=volume/(rate1+rate2)
  assert target==1/(1/a+1/b)and target<min(a,b)
  proof.update(commonVolume=str(volume),additiveRates=list(map(str,[rate1,rate2])),requestedFillHours=str(target),fractionRate=str(1/a+1/b))
 elif i<18:
  increase,decrease=n;assert 0<increase<100 and increase==decrease
  initial=F(100);raised=initial*(1+increase/100);final=raised*(1-decrease/100);drop=100*(initial-final)/initial
  assert 0<drop<100 and final/initial==(1+increase/100)*(1-decrease/100)
  def signedPercent(o):
   vals=ns(o)
   if not vals:assert 'өзгер'in o.casefold();return F(0)
   v=one(vals)
   if 'арзандады'in o:return-v
   assert 'қымбаттады'in o;return v
  opts=[o['text']if isinstance(o,dict)else o for o in r['options']]
  signed=[signedPercent(o)for o in opts];assert sum(v==-drop for v in signed)==1
  assert signedPercent(r['answer'])==-drop
  proof.update(firstBase=str(initial),secondBase=str(raised),secondDiscount=str(raised-final),finalPrice=str(final),signedChangePercent=str(-drop),allActualMCQChanges=list(map(str,signed)))
  return proof
 else:
  cost,sale=n;assert 0<cost<sale;profit=sale-cost;target=profit/cost*100
  assert cost*(1+target/100)==sale and target!=profit/sale*100
  if not source:assert 'САТЫП АЛУ'in s
  proof.update(purchaseBase=str(cost),sale=str(sale),absoluteProfit=str(profit),requestedPurchaseBasePercent=str(target),wrongSalesBasePercent=str(profit/sale*100))
 assert calc(r['answer'])==target,(i,r['answer'],target)
 if not source:assert 'options'not in r and target.denominator==1
 return proof
def final_source_answer(q):
 if q['sourceAnswer']is not None:return q['sourceAnswer']
 line=one(re.findall(r'Жауабы\s*:\s*([^\n]+)',q['solution']))
 return one(re.findall(r'\d+(?:,\d+)?',line))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20
 entries=[];evidence=[];canaries=0;claims=0;captured=0
 for i,r in enumerate(rows):
  proof=solve(r,i);ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if str(q['number'])==ref['sourceId'])
  assert cap['sourceReviewCaptured']and q['solution']and not q.get('images')and not q.get('svg')
  sourceProof=solve({**q,'answer':final_source_answer(q)},i,True)
  if q['sourceAnswer']is not None:
   captured+=1;assert one(o['text']for o in q['options']if o['correct'])==q['sourceAnswer']
  else:assert not q['options']and'not_captured'in r['sourceAnswerAvailability']
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  changed=copy.deepcopy(r);changed['answer']='WRONG_KEY'
  try:solve(changed,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r)
  if i==3:changed['statement']=changed['statement'].replace('10400','10600',1)
  elif i in(16,17):
   old='30%'if i==16 else'50%';new='20%'if i==16 else'40%';changed['statement']=changed['statement'].replace(old,new)
  else:
   m=re.search(r'\d+',changed['statement']);assert m;changed['statement']=changed['statement'][:m.start()]+str(int(m.group())+1)+changed['statement'][m.end():]
  try:solve(changed,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  # Every printed elementary numeric equality, including explicitly labelled
  # wrong-method examples, is still arithmetically checked as written.
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+×:-]\s*-?\d+)+)\s*=\s*(-?\d+(?:\s*[+×:-]\s*-?\d+)*)',clean(r['solution'])):
   a,b=m.groups();assert calc(a)==calc(b),(i,a,b);claims+=1
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceFromPrintedCondition':sourceProof,'sourceAnswerCaptured':q['sourceAnswer']is not None})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_all_saved_new_full_solutions_every_MCQ_read_exact_printed_linear_age_motion_train_equal_path_rate_and_rebased_percent_oracle','notes':[json.dumps(proof,ensure_ascii=False)]})
 assert captured==2
 discountCases=0
 for p in range(1,100):
  for initial in range(1,101):
   raised=F(initial)*(1+F(p,100));final=raised*(1-F(p,100));assert (initial-final)/initial==F(p*p,10000);discountCases+=1
 catchCases=0
 for slow in range(1,41):
  for extra in range(1,21):
   for delay in range(1,7):
    fast=slow+extra;t=F(slow*delay,extra);assert fast*t==slow*(t+delay);catchCases+=1
 pipeCases=0
 for a in range(1,41):
  for b in range(1,41):
   t=F(a*b,a+b);assert t/a+t/b==1 and t<min(a,b);pipeCases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==16
 report={'schemaVersion':1,'reviewer':'root_independent_of_logic2_author','batch':BATCH,'scope':__doc__,'summary':{'verified':20,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':20,'sourceAnswerCaptured':captured,'missingSourceKeysRecomputedWithoutInventingCapture':18,'wrongKeysRejected':20,'printedGivensCanariesRejected':canaries,'printedElementaryClaims':claims,'rebasedDiscountCases':discountCases,'pursuitCases':catchCases,'positiveAdditivePipeCases':pipeCases,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':20},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
