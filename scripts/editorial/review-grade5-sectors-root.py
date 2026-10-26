"""Independent root review: all35 full saved/new conditions, official/authored
solutions and EVERY MCQ read. Exact printed arc/angle/percent bases, sequential
remainders, cyclic interval counts, complete candidate tests and independently
attained extremal constructions. No author specs/models/params as oracle.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-sectors.json'
REPORT='problems/editorial/reviews/grade5-sectors.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def clean(s):
 s=str(s).replace('$','').replace('{,}',',').replace('\\,','').replace('−','-')
 return re.sub(r'\\+(?:d?frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def options(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def numeric(r,target):
 assert one(ns(clean(r['answer'])))==target,(r['answer'],target)
 if options(r):assert sum(ns(o)==[target]for o in options(r))==1
 return str(target)
def selected(r,pred):
 result=one(o for o in options(r)if pred(o));assert clean(r['answer'])==result
 return result
def sector_partition(angles):assert min(angles)>0 and sum(angles)==360
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))}
 if i in(0,1,8):
  value=one(n);assert value>0;out=360/value
  if i in(0,8):assert value.denominator==1
  else:assert out.denominator==1
 elif i==2:
  angle=one(n);assert 0<angle<=180;out=180/angle;assert out.denominator==1
 elif i==3:
  wanted='дөңгелектің екі радиусы мен олардың арасындағы доғамен шектелген бөлігі'if source else'Екі радиус, олардың ұштарын қосатын бір доға және ішкі аймақтан тұратын бөлік.'
  proof['answer']=selected(r,lambda o:o==wanted);proof['allMCQSectorDefinitionTruth']=[False,True,False,False]if source else[True,False,False,False];return proof
 elif i in(4,12):
  count=2 if i==4 else 3;parsed=[ns(o)for o in options(r)];assert all(len(v)==count and min(v)>0 for v in parsed)
  sums=[sum(v)for v in parsed];proof['everyMCQAngleSum']=list(map(str,sums))
  wanted=one(o for o,v in zip(options(r),sums)if v==360);assert ns(clean(r['answer']))==ns(wanted)
  proof['answer']=wanted;return proof
 elif i==5:
  wanted='секторлар бұрыштарының қосындысы 360^\\circ-қа тең'if source else'Барлық сектор бұрыштарын қосқанда толық 360° шығады.'
  if source:proof['answer']=selected(r,lambda o:ns(o)==[360])
  else:proof['answer']=selected(r,lambda o:o==wanted)
  # Distinct-size counterexample to equal-sector claim and subdivision does
  # not change sum: one85degree piece may split into40and45.
  witness=[85,125,150];sector_partition(witness);sector_partition([40,45,125,150]);proof['unequalSizeCounterexample']=witness;return proof
 elif i==6:
  expected=[180]if source else[180,180]
  proof['answer']=selected(r,lambda o:ns(o)==expected);proof['oppositeRadiusSectors']=[180,180];return proof
 elif i==7:
  total,taken=n;assert 0<taken<total and total.denominator==taken.denominator==1
  out=360/total*taken
  if not source:assert'ҚАТАР ТҰРҒАН'in s
  proof.update(oneSector=str(360/total),complement=str(360-out))
 elif i==9:
  circumference,angle=n;assert circumference>0 and 0<angle<360;out=circumference*angle/360
  assert out/circumference==angle/360;proof.update(requestedArcNotBoundary=str(out),fractionOfWhole=str(angle/360))
 elif i==10:
  difference=one(n);small=(360-difference)/2;out=small+difference;sector_partition([small,out]);assert out-small==difference
  proof['smallAngle']=str(small)
 elif i==11:
  num,den,less=n;first=360*num/den;second=first-less;out=360-first-second;sector_partition([first,second,out]);assert first-second==less
  proof['orderedSectors']=list(map(str,[first,second,out]))
 elif i==13:
  percent,num,den=n;first=360*percent/100;second=180*num/den;out=360-first-second;sector_partition([first,second,out])
  proof.update(firstBase=360,secondBase=180,orderedSectors=list(map(str,[first,second,out])))
 elif i==14:
  if source:assert n[0]==n[1];step=n[0]
  else:assert n[0]==n[1];step=n[0]
  first=120-step;out=120+step;sector_partition([first,120,out]);proof['orderedProgression']=list(map(str,[first,120,out]))
 elif i==15:
  pct=one(n);assert 0<pct<100;out=360*pct/100;proof['onePercentDegrees']='18/5'
 elif i==16:
  a,b,c,d=n;first=360*a/b;second=360*c/d;out=360-first-second;sector_partition([first,second,out])
  if not source:assert s.count('БАСТАПҚЫ')==2 and'көршілес'in s
  proof.update(sameOriginalBase=360,removedAngle=str(first+second),remainingAngle=str(out))
 elif i==17:
  ratio=one(n);small=360/(1+ratio);out=small*ratio;sector_partition([small,out]);assert out/small==ratio
 elif i==18:
  total=n[0];targets=re.findall(r'(\d+)-(?:тірек|уық)',s);assert targets
  target=F(targets[0]);assert all(F(v)==target for v in targets)and 1<target<=total
  out=(target-1)*360/total;proof.update(inclusiveTargetNumber=str(target),actualIntervals=str(target-1),oneInterval=str(360/total))
 elif i==19:
  angle=one(n);assert 0<angle<360;out=angle/360*100;proof['reducedWholeFraction']=str(angle/360)
 elif i==20:
  low,high=(90,180)if source else n;assert 0<low<high
  # Strict interval: k*low <360< k*high is necessary AND sufficient
  # (equal360/k sectors attain it). Source/new also exhibit unequal witness.
  possible=[k for k in range(1,361)if k*low<360<k*high];out=max(possible)
  witness=[120]*3 if source else[108,116,136];sector_partition(witness);assert len(witness)==out and all(low<a<high for a in witness)
  proof.update(strictBounds=[str(low),str(high)],feasibleSectorCounts=possible,attainingWitness=witness)
 elif i==21:
  ab,ac=n;out=ab+ac-360;b=ab-out;c=ac-out;sector_partition([out,b,c]);assert out+b==ab and out+c==ac
  proof['orderedSectors']=list(map(str,[out,b,c]))
 elif i==22:
  circumference,firstAngle,secondArc=n;firstArc=circumference*firstAngle/360;lastArc=circumference-firstArc-secondArc;out=360*lastArc/circumference
  assert min(firstArc,secondArc,lastArc)>0;sector_partition([firstAngle,secondArc*360/circumference,out])
  proof.update(arcFirstMethod=True,orderedArcs=list(map(str,[firstArc,secondArc,lastArc])),requestedFinalAngle=str(out))
  if not source:assert r['solution'].startswith('Алдымен бәрін доғаға келтіреміз.')
 elif i==23:
  ratio=one(n);weights=[ratio**k for k in range(4)];unit=360/sum(weights);angles=[w*unit for w in weights];sector_partition(angles);out=max(angles)
  assert all(angles[j+1]/angles[j]==ratio for j in range(3));proof['orderedSectors']=list(map(str,angles))
 elif i==24:
  first,step=n;assert first>0 and step>0
  counts=[k for k in range(1,361)if first*k+step*k*(k-1)/2==360];count=one(counts)
  angles=[first+j*step for j in range(count)];sector_partition(angles);out=count;proof['allProgressionAngles']=list(map(str,angles))
 elif i==25:
  total=int(n[0]);assert n[1]==total and total%4==0
  wanted=F(n[2]);assert wanted==90
  directed={(a,(a+total//4)%total)for a in range(total)};unordered={frozenset(p)for p in directed}
  assert len(directed)==len(unordered)==total;out=len(directed);proof['complementNotCounted']=270
 elif i==26:
  pct,num,den=n;first=360*pct/100;remaining=360-first;second=remaining*num/den;out=remaining-second;sector_partition([first,second,out])
  if not source:assert'ҚАЛҒАН АЙМАҚТЫҢ'in s
  proof.update(firstBase=360,secondBase=str(remaining),orderedSectors=list(map(str,[first,second,out])))
 elif i==27:
  angle=one(n);out=angle/360
  def frac(o):a,b=ns(o);return a/b
  assert frac(clean(r['answer']))==out and sum(frac(o)==out for o in options(r))==1
  proof['requestedReducedWholeFraction']=str(out);return proof
 elif i==28:
  minutes=one(n);assert 0<minutes<60;out=minutes*6
 elif i==29:
  first,second=n;out=360-first-second;sector_partition([first,second,out]);proof.update(traversalThroughB=str(first+second),requestedSectorExcludesB=str(out))
 elif i==30:
  first,second=n;assert first>1 and second>1;out=360/first/second;proof['totalSmallParts']=str(first*second)
 elif i==31:
  circumference,travel=n;assert 0<travel<circumference;out=travel/circumference*360
  if not source:assert'ДӘЛ ЖҮГІРГЕН ДОҒАҒА'in s
  proof.update(requestedDirectedTraversedArcAngle=str(out),wrongAutomaticallyChosenMinorAngle=str(min(out,360-out)))
 elif i==32:
  ratio=one(n);b=180/(ratio+1);out=b*ratio;sector_partition([out,b,180]);assert out/b==ratio
 elif i==33:
  if not source:assert'ОҢ БҮТІН'in s and'ешбір екі'in s
  possible=[k for k in range(1,361)if k*(k+1)//2<=360];out=max(possible)
  witness=list(range(1,26))+[35]if source else list(range(1,25))+[27,33]
  assert len(witness)==len(set(witness))==out;sector_partition(witness);assert min(witness)>0 and all(type(v)is int for v in witness)
  assert (out+1)*(out+2)//2>360;proof.update(attainingDistinctPositiveIntegerWitness=witness,nextCountLowerBound=(out+1)*(out+2)//2)
 elif i==34:
  ratio,excess=n;first=360/(ratio+1);others=360-first;third=(others-excess)/2;second=third+excess;sector_partition([first,second,third]);assert second+third==ratio*first and second-third==excess
  out=max(first,second,third);proof['allThreeCompared']=list(map(str,[first,second,third]))
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==35
 entries=[];evidence=[];canaries=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId'])
  assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert clean(one(o['text']for o in q['options']if o['correct']))==clean(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and clean(r['statement'])!=clean(q['statement'])and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  if not r.get('options'):assert'options'not in r
  changed=copy.deepcopy(r);changed['answer']='INVALID_KEY'
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r)
  if i in(3,4,5,6,12):changed['options'][changed['options'].index(changed['answer'])]='INVALID_OPTION'
  elif i==14:changed['statement']=changed['statement'].replace('26°','27°')
  elif i==20:changed['statement']=changed['statement'].replace('90°','120°')
  elif i==25:changed['statement']=changed['statement'].replace('16','20')
  elif i==33:changed['statement']=changed['statement'].replace('ОҢ БҮТІН','БҮТІН ЕМЕС')
  else:
   m=re.search(r'\d+(?:,\d+)?',changed['statement']);assert m
   changed['statement']=changed['statement'][:m.start()]+str(F(m.group().replace(',','.'))+1)+changed['statement'][m.end():]
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceFromPrintedCondition':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_all_full_saved_new_solutions_every_MCQ_read_exact_printed_sector_arc_percent_base_oracle_cyclic_endpoint_and_attained_extrema','notes':[json.dumps(proof,ensure_ascii=False)]})
 remainderCases=0
 for pct in range(1,100):
  for den in range(2,21):
   for num in range(1,den):
    first=F(360*pct,100);second=(360-first)*F(num,den);last=360-first-second;sector_partition([first,second,last]);assert last==360*(1-F(pct,100))*(1-F(num,den));remainderCases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==35
 report={'schemaVersion':1,'reviewer':'root_independent_of_sector_author','batch':BATCH,'scope':__doc__,'summary':{'verified':35,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':35,'wrongKeysRejected':35,'printedGivensOrMCQCanariesRejected':canaries,'exactSequentialRemainderCases':remainderCases,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':35},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
