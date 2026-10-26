"""Independent45 canonical collection ratio occurrences.
All saved/new fullconditions, officialsolutions and everyMCQ read manually.
Actual printed values, own Fraction/AST and exhaustive candidates; no author
calculator/spec/renderer/checker imports. Source number is scoped by FILE.
"""
from pathlib import Path
from fractions import Fraction as F
from math import gcd,isqrt
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-ratios-wave1.json'
OUT='problems/editorial/reviews/collection-ratios-wave1.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return[F(n.replace(',','.'))for n in re.findall(r'\d+(?:,\d+)?',s)]
def whole(x):
 x=F(x);assert x.denominator==1,x
 return x.numerator
def ratio(a,b):
 q=F(a,b);assert q>0
 return f'{q.numerator} : {q.denominator}'
def option_ratio(os,a,b):
 expected=ratio(a,b);return one([o for o in os if o==expected])
def calc(s,env=None):
 env=env or{}
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 s=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',s)
 return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-').strip(),mode='eval'))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);os=r.get('options',[]);a=v=None
 if k in{'integer-ratio','ordered-parts','decimal-ratio','unequal-decimal-places'}:
  first,second=n;a=option_ratio(os,first,second);note=f'Actualorderedprinted{first}/{second} reducesexactlyto{a}; part-to-WHOLEandreversaldecoysexcluded, decimalplacespreserved.'
 elif k in{'larger-share','second-colour-share','read-part-of-book','middle-of-three-shares'}:
  if k=='second-colour-share':x,y,total=n;weights=[x,y];i=1
  elif k=='middle-of-three-shares':total,x,y,z=n;weights=[x,y,z];i=1
  else:total,x,y=n;weights=[x,y];i=0 if k=='read-part-of-book'else 1
  unit=F(total,sum(weights));v=unit*weights[i];assert sum(unit*x for x in weights)==total
  note=f'Actualwhole{total}, orderedweights{weights}; unit{unit}, requestedindex{i}, result{v}; ALLpartsconservewhole, notpart-to-partdenominator.'
 elif k=='known-first-share':
  x,y,first=n;v=first*y/x;assert F(first,v)==F(x,y);note=f'ActualFIRSTknown{first}, SECOND{v}, ordered{x}:{y}; knownpartnotwhole.'
 elif k=='difference-smaller':
  x,y,gap=n;v=x*gap/(y-x);assert v*y/x-v==gap;note=f'ActualSMALLER{v}, LARGER{v*y/x}, difference{gap}, unit{gap/(y-x)}; gapnotSUM.'
 elif k=='metres-centimetres':
  metres,cm=n;a=option_ratio(os,metres*100,cm);note=f'ActualorderedMETRES{metres}→{metres*100}cm vs{cm}cm; reduced{a}, SI100essential.'
 elif k=='largest-triangle-angle':
  weights=n;angles=[F(180*x,sum(weights))for x in weights];v=max(angles);assert sum(angles)==180 and all(0<x<180 for x in angles);note=f'Actualtriangle180°, angles{angles}; greatest{v}, not360°arcdefinition.'
 elif k=='recipe-known-second':
  x,y,second=n;v=second*x/y;assert v/second==x/y;note=f'ActualSECOND rice{second}g known, requestedFIRSTsalt{v}g, notwhole{v+second}.'
 elif k=='proportion-first-term':
  d,x,y=n;v=d*x/y;assert v*y==d*x;note=f'Actualx:{d}={x}:{y} gives{v}; fullcrossproductidentitynotreverseddivision.'
 elif k=='segment-first-part':
  total,x,y=n;assert'ішінде'in s;v=total*x/(x+y);other=total-v;assert v/other==x/y and 0<v<total;note=f'ActualINTERIORsplitWHOLE{total}→PR{v}/RQ{other}; requestedFIRSTPRnotsecond/externaldivision.'
 elif k=='hours-minutes':
  hours,minutes=n;a=option_ratio(os,hours*60,minutes);note=f'Actual{hours}h→{60*hours}MIN vs{minutes}MIN, ordered{a}; factor60not100.'
 elif k=='future-age-ratio':
  adult,child,years=n;a=option_ratio(os,adult+years,child+years);assert adult-child==(adult+years)-(child+years);note=f'ActualBOTHgrow{years}, futureages{adult+years}/{child+years}, answer{a}; originalratio/oneageonlywrong.'
 elif k=='rectangle-perimeter-to-area':
  x,y,perimeter=n;unit=perimeter/(2*(x+y));side1=x*unit;side2=y*unit;v=side1*side2;assert 2*(side1+side2)==perimeter and side1/side2==x/y;note=f'ActualhalfP{perimeter/2}, sides{side1}/{side2}; AREA{v}cm², notP/areaorwholeperimeterassidesum.'
 elif k=='fractional-ratio':
  an,ad,bn,bd=n;a=option_ratio(os,F(an,ad),F(bn,bd));note=f'Actual({an}/{ad})DIVIDEDBY({bn}/{bd})→{a}; gcd/exactcrossproducts, notfractionproductorreverse.'
 elif k=='sum-larger-number':
  total,x,y=n;v=total*max(x,y)/(x+y);note=f'Actualsum{total}, weights{x}/{y}; LARGER{v}, other{total-v}, bothsumandorderedratio.'
 elif k=='align-middle-three-ratio':
  x,y,y2,z=n;target=[x*y2,y*y2,y*z];g=gcd(gcd(whole(target[0]),whole(target[1])),whole(target[2]));target=[whole(v/g)for v in target]
  a=one([o for o in os if list(map(int,o.split(' : ')))==target]);assert F(target[0],target[1])==x/y and F(target[1],target[2])==y2/z;note=f'Actualcommonmiddlefrom{x}:{y}and{y2}:{z}→{target}, bothoriginalrelationsbacksubstitute; prematureconcatenationfails.'
 elif k=='mixture-gap-to-total':
  x,y,gap=n;unit=gap/(x-y);v=(x+y)*unit;assert x*unit-y*unit==gap;note=f'ActualGAP{gap}g givesunit{unit}, requestedWHOLE{v}, parts{x*unit}/{y*unit}.'
 elif k=='square-area-ratio':
  x,y=n;a=option_ratio(os,x*x,y*y);note=f'ActualSIDEratio{x}:{y}→AREA{x*x}:{y*y}; squarepower, notfirstpowerorvolumeCUBE.'
 elif k=='add-only-first-group':
  total,x,y,added=n;unit=total/(x+y);first=x*unit;second=y*unit;a=option_ratio(os,first+added,second);note=f'Actualinitial{first}/{second}; ONLYFIRSTadds{added}people→{first+added}/{second}; addnottoabstractratio/coefficient.'
 elif k=='known-first-to-total-money':
  x,y,first=n;unit=first/x;v=(x+y)*unit;assert v-first==y*unit;note=f'ActualFIRST{first}, SECOND{y*unit}, requestedTOTAL{v}; knownfirstnotwhole.'
 elif k=='shortest-triangle-side':
  x,y,z,perimeter=n;weights=[x,y,z];sides=[perimeter*w/sum(weights)for w in weights];v=min(sides);assert 2*max(sides)<sum(sides);note=f'ActualPERIMETER{perimeter}, sides{sides}; stricttriangleinequality, SHORTEST{v}.'
 elif k=='sum-to-second-symbolic':
  x,y=n;assert'(a + b) : b'in s;a=option_ratio(os,x+y,y);note=f'Actuala/b={x}/{y}; FORMALpositiveunitk cancelsfrom(a+b)/b→{a}, requesteddenominatorbnot aorwhole.'
 elif k=='constant-unit-price':
  kg,cost,target=n;v=F(cost,kg)*target;assert v/target==cost/kg;note=f'ActualfixedUNITprice{cost/kg}, targetmass{target}→cost{v}, directproportion.'
 elif k=='equal-addition-changes-ratio':
  x,y,added,nx,ny=n;unit=added*(nx-ny)/(ny*x-nx*y);v=min(x,y)*unit;assert unit>0 and (x*unit+added)/(y*unit+added)==nx/ny;note=f'ActualBOTH+{added}; uniqueunit{unit}, original{x*unit}/{y*unit}; after{x*unit+added}/{y*unit+added}, requestedORIGINALSMALLER{v}.'
 elif k=='group-gap-to-total':
  x,y,gap=n;unit=gap/(y-x);v=(x+y)*unit;assert y*unit-x*unit==gap;note=f'ActualgroupGAP{gap}people, initial{x*unit}/{y*unit}; requestedTOTAL{v}notdifferencepart.'
 elif k=='chain-to-outer-ratio':
  x,y,y2,z=n;a=option_ratio(os,x*y2,y*z);note=f'ActualA/B×B/C=({x}/{y})×({y2}/{z}); formalBcancel→A/C={a}. Middlealignmentinprintedsolutionchecked18:24:20.'
 elif k=='three-ratio-range-sum':
  x,y,z,gap=n;weights=[x,y,z];unit=gap/(max(weights)-min(weights));v=sum(weights)*unit;assert max(weights)*unit-min(weights)*unit==gap;note=f'Actualmax−minGAP{gap}, all3parts{[x*unit,y*unit,z*unit]}, requestedSUM{v}.'
 elif k=='first-spending-equalizes':
  x,y,spent=n;unit=spent/(x-y);v=x*unit;assert v-spent==y*unit;note=f'ActualONLYFIRSTspends{spent}, requestedFIRSTBEFORE{v}, SECONDunchanged{y*unit}; afterequal.'
 elif k=='first-to-whole-fraction':
  x,y=n;q=F(x,x+y);a=one([o for o in os if o==f'({q.numerator}/{q.denominator})']);note=f'ActualFIRSTtoWHOLE{x}/({x}+{y})={q}, notfirst/SECOND{x}/{y}. MCQcanonicalfractionretainsgradingkey.'
 elif k=='remove-first-equalizes':
  x,y,removed=n;unit=removed/(x-y);v=(x+y)*unit;assert x*unit-removed==y*unit;note=f'ActualONLYFIRST−{removed}equalizes; ORIGINALtotal{v}, notremainingtotal{v-removed}.'
 elif k=='add-first-component-alloy':
  total,x,y,nx,ny=n;first=total*x/(x+y);second=total*y/(x+y);added=second*nx/ny-first;v=added;assert added>0 and (first+added)/second==nx/ny;note=f'Actualinitialcomponents{first}/{second}; SECONDmassconstant{second}; addONLYFIRST{added}, finalWHOLE{total+added}notoldtotal.'
 elif k=='weighted-linear-ratio':
  x,y,*_=n;target=one(re.findall(r'\(([^()]+)\) : \(([^()]+)\)',s));left=calc(target[0],{'x':x,'y':y});right=calc(target[1],{'x':x,'y':y});a=option_ratio(os,left,right);note=f'Actualprintedweightedexpressions{target}atx={x},y={y}yield{left}/{right}; positivecommonscalekcanceluniversally.'
 elif k=='rectangle-area-to-perimeter':
  x,y,area=n;unit2=area/(x*y);unit=isqrt(whole(unit2));assert unit*unit==unit2 and unit>0;side1=x*unit;side2=y*unit;v=2*(side1+side2);assert side1*side2==area;note=f'Actualarea{area}=({x}k)({y}k)→k²={unit2}; POSITIVEroot{unit}; sides{side1}/{side2}, requestedPERIMETER{v}cm.'
 elif k=='age-ratio-two-times':
  x,y,years,nx,ny=n;unit=years*(nx-ny)/(ny*x-nx*y);v=y*unit;assert (x*unit+years)/(v+years)==nx/ny;note=f'Actualinitialages{x*unit}/{v}; BOTH+{years}→{x*unit+years}/{v+years}, uniquechildNOW{v}, notlaterage.'
 elif k=='fixed-work-inverse-worker-count':
  first,days,nextn=n;v=F(first*days,nextn);assert nextn*v==first*days;note=f'ActualFIXEDwork{first*days}persondays; {nextn}equalrateworkers→{v}days, inversenotdirectproportion.'
 elif k=='smallest-circle-arc':
  weights=n;arcs=[F(360*x,sum(weights))for x in weights];v=min(arcs);assert sum(arcs)==360;note=f'ActualwholeCIRCLE360°, arcs{arcs}, least{v}; disjointcompletepartitionexplicit, nottriangle180°.'
 elif k=='girls-leave-changes-ratio':
  x,y,left,nx,ny=n;unit=left*nx/(y*nx-x*ny);v=(x+y)*unit;assert x*unit/(y*unit-left)==nx/ny;note=f'ActualONLYGIRLS−{left}, unit{unit}; original{x*unit}/{y*unit}, after{x*unit}/{y*unit-left}; requestedORIGINALTOTAL{v}, notaftertotal{v-left}.'
 elif k=='add-to-smaller-equalizes':
  x,y,added=n;unit=added/(y-x);v=y*unit;assert x*unit+added==v;note=f'ActualONLYSMALLER+{added}equalizes; originalLARGER{v}, SMALLER{x*unit}, rolesnotreversed.'
 elif k=='triangle-angle-classification':
  weights=n;angles=[F(180*x,sum(weights))for x in weights];greatest=max(angles)
  label='Тік бұрышты'if greatest==90 else'Доғал бұрышты'if greatest>90 else'Сүйір бұрышты';a=one([o for o in os if o==label]);assert len(set(angles))>1;note=f'Actualtriangle180°, angles{angles}; greatest{greatest}→{a}; actualequilateraldecoyfailsunequalangles.'
 elif k=='drink-litre-to-millilitre-share':
  water,juice,litres=n;total=litres*1000;v=total*juice/(water+juice);assert v+(total-v)==total and (total-v)/v==water/juice;note=f'ActualTOTAL{litres}L={total}ml, orderedwater/juice{water}/{juice}; requestedJUICE{v}ml, water{total-v}notanswer.'
 else:raise AssertionError(k)
 if a is None:a=str(whole(v))
 assert a==r['answer'],(r['editionId'],r['answer'],a)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==45
 entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution'];refs.add((ref['sourceFile'],ref['sourceId']));files.add(ref['sourceFile'])
  assert not raw.get('images')and not raw.get('svg');norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement'])
  note=solve(r);assert r['grade']==6 and r['minimumPlan']=='pro'
  if'options'in r:assert len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  else:assert re.fullmatch(r'\d+',r['answer'])and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted exactFraction/AST and completecandidateledgers; all45canonicalfile-scopedquestionnumbers/raw/new/fullsolutions/everyMCQread; noauthorcalculatorimported','notes':note})
 assert len(refs)==45 and len(files)==3
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let count=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){count++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(count);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native==14
 rejected=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
  b=copy.deepcopy(r);m=one([list(re.finditer(r'\d+(?:,\d+)?',b['statement']))[0]]);q=F(m.group().replace(',','.'))+1
  changed=str(whole(q))if q.denominator==1 else str(float(q)).replace('.',',');b['statement']=b['statement'][:m.start()]+changed+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 sums=changes=ages=areas=0
 for x in range(1,13):
  for y in range(x+1,16):
   for unit in range(1,21):
    a,b=x*unit,y*unit;total=a+b;gap=b-a
    # Exhaustive candidates independent of linear formula: simultaneousSUM+RATIO
    candidates=[i for i in range(1,total)if F(i,total-i)==F(x,y)];assert candidates==[a]
    assert F(gap,y-x)==unit and F(total,x+y)==unit;sums+=1
    for delta in[1,4,8]:
     after=F(a+delta,b+delta);assert (a+delta)*after.denominator==(b+delta)*after.numerator;changes+=1
 for unit in range(1,13):
  for adult in range(3,10):
   for child in range(1,adult):
    for years in[5,10,12]:
     before=F(adult,child);after=F(adult*unit+years,child*unit+years);assert after<before and (adult-child)*unit==(adult*unit+years)-(child*unit+years);ages+=1
 for x in range(1,10):
  for y in range(x+1,12):
   for unit in range(1,11):
    a,b=x*unit,y*unit;area=a*b;perimeter=2*(a+b);u=F(perimeter,2*(x+y));assert (x*u)*(y*u)==area and isqrt(whole(F(area,x*y)))==unit;areas+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All45canonicalcollectionfile-scopedquestionnumbers fullsaved/newconditions,officialsolutions/everyMCQread. Exactactualprinted Fraction/AST, orderedpart/whole/known/gap/sum, chainedmiddle, SI100/60/1000, one-sidedchanges/bothagechanges, squareAREA/rectanglepositiveroot/triangle180/circle360, source-specificrequestedroles. Nativepresentation-onlyfractionnormalizationrereadbeforehash. Repeatedmechanismsarevariantsnot45newmeanings. Noauthorcalculatorimported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':rejected,'printedCanariesRejected':printed,'completeShareDomains':sums,'bothAdditionLedgers':changes,'futureAgeLedgers':ages,'rectangleLedgers':areas,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
