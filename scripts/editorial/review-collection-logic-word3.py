"""Read every20source/new full condition and full official/new solution, all4MCQ
sets. Independent printed-input Fraction ledgers for every mass/group/seat/age/
train/net-flow/candle/area/guest share; same root author, not separate human.
No source raster, no actual physical-property claims for named fluids in rewrite.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-logic-word3';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H);one=H.one

def minutes(s):
 h=one(re.findall(r'(\d+)\s*сағат',s));m=re.findall(r'(\d+)\s*минут',s);assert len(m)<=1;return F(int(h)*60+(int(m[0])if m else 0))
def percent_change(s):
 if s=='Өзгерген жоқ':return F(0)
 value=F(one(re.findall(r'(\d+(?:[,.]\d+)?)\s*%',s)).replace(',','.'));assert ('артты'in s)!=('кеміді'in s);return value if'артты'in s else-value

def solve(r,i,source=False):
 s=r['statement'];n=H.numeric_tokens(s);proof={}
 if i in(1,2):
  full,half=n;lost=full-half;content=2*lost;container=full-content;assert min(lost,content,container)>0 and container+content==full and container+content/2==half;out=container;proof={'emptyContainer':str(container),'initialContent':str(content),'removedHalf':str(lost),'bothWeighingsChecked':True}
 elif i in(3,4):
  if source:fixed=one(n);den=5 if i==3 else 2;assert('бестен біріне'in s)if i==3 else'жарты'in s
  elif i==3:fixed,numerator,den=n;assert numerator==1
  else:fixed=one(n);den=2;assert'жартысының'in s
  mass=fixed/(1-F(1,den));assert mass>0 and mass==fixed+mass/den;out=mass;proof={'fixedMassKg':str(fixed),'selfFraction':str(F(1,den)),'wholeMassKg':str(mass),'partMassKg':str(mass/den)}
 elif i in(5,6):
  a,b,c,d,initial=n;groups1=initial/a;mid=groups1*b;groups2=mid/c;out=groups2*d;assert groups1.denominator==groups2.denominator==1 and min(groups1,groups2)>0;assert out/d*c==mid and mid/b*a==initial;proof={'firstWholeBatchCount':str(groups1),'intermediateItems':str(mid),'secondWholeBatchCount':str(groups2),'finalItems':str(out),'reverseConservationCheck':True}
 elif i in(7,8):
  standing,empty=n;tables=standing+2*empty;children=tables+standing;assert tables>empty>0 and children==2*(tables-empty);out=tables;proof={'tables':str(tables),'children':str(children),'firstArrangementSeated':str(tables),'secondArrangementUsedTables':str(tables-empty),'emptyTables':str(empty)}
 elif i in(9,10):
  now,years,later=n;assert now>later>1;child=years*(later-1)/(now-later);father=now*child;assert child>0 and father+years==later*(child+years);assert father-child==(father+years)-(child+years);out=child;proof={'currentChildAge':str(child),'currentFatherAge':str(father),'laterChildAge':str(child+years),'laterFatherAge':str(father+years),'ageGapInvariant':str(father-child)}
 elif i in(11,12):
  post,bridge,whole=n;assert whole>post>0;speed=bridge/(whole-post);length=speed*post;assert length/speed==post and(length+bridge)/speed==whole;out=length;proof={'constantSpeedMetersPerSecond':str(speed),'trainLengthMeters':str(length),'pointCrossingSeconds':str(post),'completeBridgeCrossingSeconds':str(whole)}
 elif i in(13,14):
  fill,drain=n;inflow=1/fill;outflow=1/drain;net=inflow-outflow;assert net>0;time=1/net;assert time*inflow-time*outflow==1;out=time;proof={'fillPerHour':str(inflow),'drainPerHour':str(outflow),'netPerHour':str(net),'wholeReservoirTimeHours':str(time),'inflowAtFinish':str(time*inflow),'outflowAtFinish':str(time*outflow)}
 elif i in(15,16):
  first,second,ratio=n;assert second>first>0 and ratio>1;t=(ratio-1)/(ratio/first-1/second);remainingFirst=1-t/first;remainingSecond=1-t/second;assert 0<t<first<second and remainingSecond==ratio*remainingFirst and min(remainingFirst,remainingSecond)>0;out=t*60;assert out.denominator==1 and minutes(r['answer'])==out;proof={'timeHours':str(t),'timeMinutes':str(out),'firstCandleRemainingFraction':str(remainingFirst),'secondCandleRemainingFraction':str(remainingSecond),'ratioOfRemainingLengths':str(ratio),'beforeEitherBurnsOut':True}
 elif i in(17,18):
  up,down=n;lengthScale=1+up/100;widthScale=1-down/100;assert min(lengthScale,widthScale)>0;scale=lengthScale*widthScale;out=(scale-1)*100;assert percent_change(r['answer'])==out;proof={'lengthScale':str(lengthScale),'widthScale':str(widthScale),'areaScale':str(scale),'signedAreaChangePercent':str(out),'multiplicativeAreaLaw':True}
 elif i==19:
  if source:heavy,light=n;ratio=F(2);assert'екі есе'in s
  else:ratio,heavy,light=n
  assert heavy>light>0 and ratio>1;lightFluid=(heavy-light)/(ratio-1);container=light-lightFluid;assert min(container,lightFluid)>0;assert container+ratio*lightFluid==heavy and container+lightFluid==light;out=container;proof={'emptyContainerGrams':str(container),'lightFluidGrams':str(lightFluid),'heavyFluidGrams':str(ratio*lightFluid),'sameContainerBothWeighingsVerified':True}
 elif i==20:
  first,second,payment=n;meal=(first+second)/3;givenFirst=first-meal;givenSecond=second-meal;assert min(givenFirst,givenSecond)>0 and givenFirst+givenSecond==meal;rate=payment/meal;out=givenFirst*rate;other=givenSecond*rate;assert out+other==payment and first==meal+givenFirst and second==meal+givenSecond;proof={'eachPersonsMeal':str(meal),'firstContributionToGuest':str(givenFirst),'secondContributionToGuest':str(givenSecond),'pricePerFoodUnit':str(rate),'firstCompensation':str(out),'secondCompensation':str(other),'totalPaymentConserved':True}
 else:raise AssertionError(i)
 if i not in(15,16,17,18):assert H.calc(r['answer'])==out,(i,out,r['answer'])
 proof['answer']=str(out)
 if r.get('options'):
  values=[(minutes if i in(15,16)else percent_change)(o['text']if isinstance(o,dict)else o)for o in r['options']];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['everyOptionValue']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
  if source:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
 return proof

def mutation(r,i):
 pairs={1:('2200 г','2300 г'),2:('5900 г','6000 г'),3:('12 кг','15 кг'),4:('9 кг','10 кг'),5:('90 жетон','100 жетон'),6:('40 дәптер','60 дәптер'),7:('7 балаға','8 балаға'),8:('4 балаға','6 балаға'),9:('24 жылдан','27 жылдан'),10:('20 жылдан','22 жылдан'),11:('480 м','504 м'),12:('270 м','288 м'),13:('15 сағатта','16 сағатта'),14:('14 сағатта','15 сағатта'),15:('6 сағатта','5 сағатта'),16:('8 сағатта','9 сағатта'),17:('60 пайызға','70 пайызға'),18:('60 пайызға','50 пайызға'),19:('3 есе','4 есе'),20:('9 бәліш','12 бәліш')};a,b=pairs[i];assert a in r['statement'];out=copy.deepcopy(r);out['statement']=out['statement'].replace(a,b,1);return out

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20;entries=[];evidence=[];equalities=0;missing=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and not q['svg'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));answer=re.sub(r'^[A-D]\)\s*','',tail).strip();missing+=q['sourceAnswer']is None
  try:src=solve({**q,'answer':q['sourceAnswer']or answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and bool(r.get('options'))==bool(q['options'])and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in({**r,'answer':'999999999'},mutation(r,i)):
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9()+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip()for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[H.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All20full source/new conditions/full official/new solutions and all4MCQ sets read. Exact printed-input Fraction mass/fraction/exchange/seating/constant age gap/train complete crossing/net rate/positive candle remnants/multiplicative area/equal volume/fair contributed food ledgers with target units and every alternative checked; same root author, not separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':20,'allSourceNewConditionsFullSolutionsRead':20,'sourceKeysNotCaptured':missing,'sourceAndNewMCQSets':4,'allSourceAndNewAlternativeValuesChecked':32,'wrongKeysRejected':20,'printedSemanticCanariesRejected':20,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':20,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
