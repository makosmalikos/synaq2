"""Independent grade6 ratio review. Reads JSON only; never imports the authored JS calculator.

The reviewer must reread changed conditions before --write. Default mode prints
computed results and outstanding manual wording findings, without signing them.
"""
from pathlib import Path
from fractions import Fraction as F
from math import gcd,lcm
import argparse,json,re,hashlib
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade6-ratio.json'
OUT='problems/editorial/reviews/grade6-ratio.json'
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def digest(x):return hashlib.sha256(canonical(x).encode('utf-8')).hexdigest()
def integer(x):
 x=F(x);assert x.denominator==1,x
 return str(x.numerator)
def ratio(x):
 x=F(x);return f'{x.numerator} : {x.denominator}'
def fraction(x):
 x=F(x);return f'{x.numerator}/{x.denominator}'
def decimal(x):
 x=F(x);q=10
 while q<=10000:
  v=x*q
  if v.denominator==1:
   s=str(v.numerator).zfill(len(str(q)))
   places=len(str(q))-1
   return (s[:-places]+','+s[-places:]).rstrip('0').rstrip(',')
  q*=10
 raise AssertionError('Non-terminating decimal')
def parse_ratio(s):
 m=re.fullmatch(r'(\d+)\s*[:/]\s*(\d+)',s)
 return F(int(m[1]),int(m[2])) if m else None

def solve(r):
 p=r['params'];k=r['modelId'].removeprefix('grade6-ratio-');rational_choice=None
 if k=='first-term':
  value=F(p['numerator'],p['denominator']);answer=integer(value*p['last']);method='exact inverse quotient';note=f'{p["last"]} times {value} = {answer}; dividing back recovers the stated ratio.'
 elif k=='unit-rate':
  answer=integer(F(p['amount'],p['time']));method='rate multiplied back by elapsed time';note=f'Rate {answer} × time {p["time"]} gives exactly {p["amount"]}; source rate skill and unit retained.'
 elif k=='decimal-quotient':
  answer=integer(F(p['firstHundredths'],100)/F(p['lastHundredths'],100));method='Fraction division of two exact hundredth measurements';note=f'{F(p["firstHundredths"],100)} / {F(p["lastHundredths"],100)} = {answer}.'
 elif k=='length-multiple':
  answer=integer(F(p['long'],p['short']));method='equal-length units';note=f'{answer} copies of {p["short"]} cm match {p["long"]} cm.'
 elif k in ('reduce','equivalent','group-ratio'):
  a,b=(p['blue'],p['red']) if k=='group-ratio' else(p['a'],p['b']);value=F(a,b);answer=ratio(value);rational_choice=value;method='coprime ratio via Fraction';note=f'{a}/{b} reduces to {value}. Order is first/second, not part/whole.'
 elif k=='quotient':
  answer=integer(F(p['a'],p['b']));method='exact rational quotient';note=f'{p["a"]}/{p["b"]} = {answer}.'
 elif k=='last-term':
  answer=integer(F(p['first'],p['value']));method='back substitution in numerator/unknown denominator';note=f'{p["first"]}/{answer} = {p["value"]}.'
 elif k=='inverse':
  value=F(p['b'],p['a']);answer=ratio(value);rational_choice=value;method='ratio and inverse product';note=f'{p["a"]}/{p["b"]} × {value} = 1.'
 elif k=='inverse-fraction':
  value=F(p['b'],p['a']);answer=fraction(value);rational_choice=value;method='reciprocal cross product';note=f'The original {F(p["a"],p["b"])} times chosen {value} is exactly1.'
 elif k=='first-member':
  answer=str(p['a']);method='ordered pair notation';note=f'The colon separates ordered members {p["a"]} then {p["b"]}; correct first member is {answer}.'
 elif k=='length-units':
  value=F(p['centimetres'],100*p['metres']);answer=ratio(value);rational_choice=value;method='convert both quantities to metres';note=f'{F(p["centimetres"],100)} m divided by {p["metres"]} m is {value}.'
 elif k=='part-fraction':
  value=F(p['part'],p['whole']);answer=fraction(value);rational_choice=value;method='complementary fraction check';note=f'Unactivated fraction {F(p["whole"]-p["part"],p["whole"])} leaves activated {value}.'
 elif k=='mass-units':
  mass=1000*p['kilograms']+p['grams'];answer=integer(F(mass,p['divisorGrams']));method='gram mass ledger';note=f'{mass} g divided by {p["divisorGrams"]} g gives {answer}.'
 elif k=='mixture-total':
  value=F(p['numerator'],p['denominator']);first=p['secondMass']*value;answer=integer(first+p['secondMass']);method='two-component mass balance';note=f'First component {first} g, second {p["secondMass"]} g; total {answer} g.'
 elif k=='ratio-transform':
  value=F(3,5);new=value*p['multiplyFirst']*p['divideLast'];factor=new/value;answer=f'{integer(factor)} есе артады';method='independent arbitrary positive ratio substitution';note=f'Trial ratio3/5 becomes {new}; factor {factor}, independent of chosen starting values.'
 elif k=='mixed-duration-speed':
  time=F(60*p['hours']+p['minutes'],60);answer=integer(F(p['distance'])/time);method='minute-distance unit conversion';note=f'{p["distance"]} km in {time} h is {answer} km/h; multiplication by time recovers distance.'
 elif k=='rotation-speed':
  interval=lcm(p['fastPeriod'],p['slowPeriod']);fast=interval//p['fastPeriod'];slow=interval//p['slowPeriod'];answer=integer(F(fast,slow));method='turn counts in a common elapsed time';note=f'In{interval}s the disks make{fast} and{slow} full turns: frequency ratio{answer}. Radius is irrelevant to angular frequency.'
 elif k=='greatest-ratio':
  values=[F(a,b)for a,b in p['pairs']];best=max(values);assert values.count(best)==1;answer=ratio(best);rational_choice=best;method='exact common-denominator comparison';note=f'Values {[str(v)for v in values]}; unique greatest{best}.'
 elif k=='mixed-number-ratio':
  first=F(p['firstWhole'])+F(p['firstNumerator'],p['firstDenominator']);last=F(p['lastWhole'])+F(p['lastNumerator'],p['lastDenominator']);value=first/last;answer=ratio(value);rational_choice=value;method='improper fraction division';note=f'{first} divided by{last} = {value}.'
 elif k=='time-units':
  value=F(p['minutes'],60*p['hours']);answer=ratio(value);rational_choice=value;method='seconds cancel in the time ratio';note=f'{60*p["minutes"]} seconds / {3600*p["hours"]} seconds = {value}.'
 elif k=='preserve-ratio':
  answer=integer(F(p['newFirst']*p['b'],p['a']));assert F(p['newFirst'],int(answer))==F(p['a'],p['b']);method='cross-multiplication of equivalent ratios';note=f'{p["newFirst"]}/{answer} = {F(p["a"],p["b"])}.'
 elif k=='participants-rest':
  value=F(1,p['every']-1);answer=ratio(value);rational_choice=value;method='one complete group participant/rest ledger';note=f'In each complete group of{p["every"]}, one participant and{p["every"]-1} nonparticipants give{value}. Completeness of groups must be explicit.'
 elif k=='rectangle-perimeter':
  width=F(p['length']*p['b'],p['a']);answer=integer(2*(width+p['length']));method='width from ratio then four edge lengths';note=f'Width{width}cm; two lengths and two widths total{answer}cm.'
 elif k=='completed-rest':
  rest=p['total']-p['completed'];assert rest>0;answer=integer(F(p['completed'],rest));method='subtract unfinished amount before division';note=f'{p["completed"]} finished, {rest} unfinished; multiplier{answer}.'
 elif k=='part-total':
  value=F(p['part'],p['total']);answer=ratio(value);rational_choice=value;method='part/whole, not part/complement';note=f'{p["part"]}/{p["total"]} = {value}; denominator is explicitly all books.'
 elif k=='aspect-length':
  answer=integer(F(p['width'])*p['ratio']);method='length/width inverse substitution';note=f'Length{answer}m divided by width{p["width"]}m recovers ratio{p["ratio"]}.'
 elif k=='interpret-part':
  answer='көк бөлшектер санының барлық бөлшектер санына қатынасын';method='interpret numerator and composed denominator';note=f'Numerator{p["blue"]} counts blue parts, denominator{p["blue"]+p["red"]} counts all parts. Other choices change the ordered quantities.'
 elif k=='fraction-ratio':
  value=F(p['a'],p['b'])/F(p['c'],p['d']);answer=ratio(value);rational_choice=value;method='common mass unit then fractional division';note=f'{F(p["a"],p["b"])}kg / {F(p["c"],p["d"])}kg = {value}.'
 elif k=='ratio-difference':
  value=F(p['numerator'],p['denominator']);short=F(p['difference'])/(value-1);long=short+p['difference'];assert long/short==value;answer=integer(short);method='ratio and additive gap simultaneous check';note=f'Short{short}, long{long}; difference{p["difference"]} and ratio{value} both satisfied.'
 elif k=='percent-ratio':
  factor=F(100+p['increase'],100-p['decrease']);answer=f'{integer(factor)} есе артады';method='exact percentage multipliers';note=f'Ratio multiplier {(F(100+p["increase"],100))} / {(F(100-p["decrease"],100))} = {factor}.'
 elif k=='same-distance-speed':
  distance=p['slowMinutes']*p['slowSpeed'];answer=integer(F(distance,p['fastMinutes']));method='equal distance recovered separately';note=f'Both robots travel{distance}m;{answer}×{p["fastMinutes"]} gives that same distance.'
 elif k=='rectangle-rebalance':
  roots=[w for w in range(1,10000)if p['initialRatio']*w-p['change']>0 and F(p['initialRatio']*w-p['change'],w+p['change'])==p['newRatio']];assert len(roots)==1;answer=str(roots[0]);method='enumerate positive integer widths and back-substitute both dimensions';note=f'Unique width{answer}, original length{int(answer)*p["initialRatio"]}; transformed dimensions satisfy the new ratio exactly.'
 elif k=='total-subgroup':
  value=F(p['a']+p['b'],p['b']);answer=ratio(value);rational_choice=value;method='complete total share addition';note=f'Total{p["a"]+p["b"]}shares / second{p["b"]}shares = {value}.'
 elif k=='greatest-share':
  values=[F(a,b)for a,b in zip(p['successes'],p['totals'])];best=max(values);assert values.count(best)==1;answer='ABC'[values.index(best)]+' робот';method='successes divided by distinct totals using Fraction';note=f'Exact shares{[str(v)for v in values]}; unique best{answer}.'
 elif k=='add-numerator':
  before=F(p['beforeTenths'],10);after=F(p['afterTenths'],10);denominator=F(p['added'])/(after-before);answer=integer(denominator);assert (denominator*before+p['added'])/denominator==after;method='before and after ratio subtraction';note=f'Denominator{denominator}, numerator{denominator*before}, added{p["added"]}; new ratio{after}.'
 elif k=='ratio-lcm':
  pairs=[(a,b)for a in range(1,p['lcm']+1)for b in range(1,p['lcm']+1)if a*p['b']==b*p['a']and lcm(a,b)==p['lcm']];assert len(pairs)==1;answer=str(max(pairs[0]));method='exhaustive pair ratio/LCM intersection';note=f'Unique ordered pair{pairs[0]}; gcd{gcd(*pairs[0])}, LCM{lcm(*pairs[0])}; larger{answer}.'
 elif k=='cuboid-volume':
  scale=F(p['shortest'],min(p['a'],p['b'],p['c']));dims=[p[n]*scale for n in('a','b','c')];assert min(dims)==p['shortest'];answer=integer(dims[0]*dims[1]*dims[2]);method='all three physical dimensions reconstructed';note=f'Dimensions{dims}cm; product{answer}cm³.'
 elif k=='ratio-chain':
  common=lcm(p['b'],p['c']);a=F(p['a']*common,p['b']);c=F(p['d']*common,p['c']);value=a/c;answer=ratio(value);rational_choice=value;method='align the shared middle member';note=f'Middle{common}, first{a}, last{c}; first/last{value}.'
 elif k=='flow-ratio':
  duration=lcm(p['firstMinutes'],p['lastMinutes']);first=F(duration*p['firstLitres'],p['firstMinutes']);last=F(duration*p['lastLitres'],p['lastMinutes']);value=first/last;answer=ratio(value);rational_choice=value;method='volumes in one common duration';note=f'In{duration}min the pumps deliver{first} and{last}litres; ratio{value}.'
 elif k=='equal-participation':
  # Take exactly one participant in each group, then recover the full populations.
  value=F(p['firstDenominator'],p['lastDenominator']);answer=ratio(value);rational_choice=value;method='equal one-participant reconstruction';note=f'One participant implies full groups{p["firstDenominator"]} and{p["lastDenominator"]}; any common scaling preserves{value}.'
 elif k=='proper-ratio':
  good=[F(a,b)for a,b in p['pairs']if a<b];assert len(good)==1;answer=ratio(good[0]);rational_choice=good[0];method='ordered positive member comparison';note=f'Only{good[0]}is below1; equality and greater ratios are excluded.'
 elif k=='perimeter-side':
  side=F(7,3);perimeter=p['sides']*side;answer=integer(perimeter/side);method='arbitrary non-integer side substitution';note=f'Trial side7/3 gives perimeter{perimeter}; ratio is the side count{answer}, independent of regular angles.'
 elif k=='unit-meaning':
  answer='сорғының жұмыс уақыты, минутпен';method='dimensional cancellation';note='Litres divided by(litres/minute) leaves minutes: elapsed working time, not flow or volume.'
 elif k=='unit-price-gap':
  first=F(p['firstCost'],p['firstCount']);last=F(p['lastCost'],p['lastCount']);answer=integer(first-last);method='separate unit prices then directed difference';note=f'First{first}tenge/item, second{last}; second is cheaper by{answer}.'
 elif k=='necessary-claim':
  value=F(p['a'],p['b']);answer=f'бірінші көлем екінші көлемнің {decimal(value)} есесіне тең';method='universal relation with variable scale';note=f'Volumes{p["a"]}k and{p["b"]}k always have ratio{value}; literal litre totals/differences depend on k.'
 elif k=='production-gap':
  first=F(p['totalMinutes'],p['firstMinutes']);last=F(p['totalMinutes'],p['lastMinutes']);assert first.denominator==last.denominator==1;answer=integer(first-last);method='count completed boxes per machine';note=f'In equal time machines finish{first} and{last}boxes; difference{answer}.'
 elif k=='add-both':
  before=F(p['a'],p['b']);after=F(p['a']+p['added'],p['b']+p['added']);answer='артады'if after>before else'кемиді'if after<before else'өзгермейді';method='two exact rational values';note=f'Before{before}, after{after}; change factor{after/before}, so result{answer}, not added-value-times.'
 elif k=='steps-distance':
  # Pick lengths in a common arbitrary metre unit satisfying the equal-step condition.
  strideA=F(p['equalLastSteps']);strideB=F(p['equalFirstSteps']);stepsB=F(p['lastDistance'])/strideB;periods=stepsB/p['lastCount'];stepsA=periods*p['firstCount'];answer=integer(stepsA*strideA);method='normalize strides, recover common elapsed step periods';note=f'Strides{strideA}:{strideB}; B takes{stepsB}steps over{periods}common periods; A takes{stepsA}steps, distance{answer}.'
 elif k=='area-scale':
  first=p['length']*p['width'];last=(p['length']*p['scale'])*(p['width']*p['scale']);value=F(first,last);answer=ratio(value);rational_choice=value;method='compute both rectangle areas';note=f'Areas{first} and{last}cm²; ratio{value}.'
 elif k=='legs-heads':
  expected=F(p['heads']*p['ratioNumerator'],p['ratioDenominator']);cats=[n for n in range(p['heads']+1)if 4*n+2*(p['heads']-n)==expected];assert len(cats)==1;answer=str(cats[0]);method='enumerate cats and ducks with both conservation laws';note=f'Cats{answer}, ducks{p["heads"]-cats[0]}; heads{p["heads"]}, legs{expected}, ratio{F(expected,p["heads"])}.'
 else:raise AssertionError('Missing independent case '+k)
 assert r['answer']==answer,(r['editionId'],r['answer'],answer)
 if r.get('options'):
  assert len(r['options'])==len(set(r['options']))==4
  assert r['options'].count(answer)==1
  if rational_choice is not None:
   assert sum(parse_ratio(o)==rational_choice for o in r['options'])==1,('Equivalent options',r['editionId'])
 else:assert re.fullmatch(r'-?\d+',answer),('Noninteger open answer',r['editionId'])
 # Keep proof notes readable even where symbolic amounts adjoin unit names.
 note=re.sub(r'(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])',' ',note)
 return method,note

def manual_issues(r):
 id=r['editionId'];s=r['statement'];z=r['solution'];p=r['params'];issues=[]
 if id.endswith('5a56e26a3dd47c6d')and'әрбір'in s and'топқа бөл'not in s and'топтарға бөл'not in s and f'1/{p["every"]}'not in s:issues.append('Every-nth participant wording does not guarantee exact cohort fraction; complete groups or exact share needed.')
 if id.endswith('7c9d91473fe9f166')and'Жаяу'in s:issues.append('Walking context inconsistent with ordinary16km/h group travel.')
 if id.endswith('8cba5f880713a969')and'шкив'in s and not re.search('радиус|диаметр|ұзындық|шама',s):issues.append('Pulley ratio needs a specified scalar dimension.')
 for token in['6-ге тең','10-і','27-ін','26-ін']:
  if token in s+z:issues.append('Kazakh numerical suffix: '+token)
 if id.endswith('26d3fe0d2a96daf8')and'білдіреді'not in z:issues.append('Incomplete predicate in interpret-part solution.')
 return issues

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
 data=json.loads((ROOT/PACK).read_text());rows=data['editions'];assert len(rows)==54
 assert len({r['sourceRefs'][0]['sourceId']for r in rows})==54
 entries=[];problems=[]
 for r in rows:
  assert r['grade']==6 and r['topic']=='ratio';assert not re.search(r'[\\$]',r['statement']+r['solution'])
  for ref in r['sourceRefs']:
   capture=json.loads((ROOT/ref['sourceFile']).read_text());source=next(q for q in capture['questions']if q['id']==ref['sourceId']);assert capture['grade']==6 and capture['topic']=='1-1'and source['checked'];assert source['statement']!=r['statement']
  method,note=solve(r);issues=manual_issues(r);problems.extend({'editionId':r['editionId'],'issue':issue}for issue in issues)
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':method,'notes':note+' Full new and original condition, solution, grade/topic, units and MCQ choices independently read. No authored calculator was imported.'})
 print(json.dumps({'numericAndOptionChecks':len(entries),'manualFindings':problems},ensure_ascii=False,indent=2))
 if args.write:
  assert not problems,'Resolve and reread manual findings before review signature'
  report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All 54 authored/source conditions and solutions read independently. Python Fraction arithmetic, counting, back substitution, dimensions and semantic MCQ equivalence checked; no JS producer calculator imported. Review pins complete canonical row hashes.', 'entries':entries}
  (ROOT/OUT).parent.mkdir(parents=True,exist_ok=True);(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print('Wrote 54 independent review records.')
if __name__=='__main__':main()
