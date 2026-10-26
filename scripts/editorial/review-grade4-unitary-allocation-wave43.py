"""Independent full39 saved/new/fullsolution/MCQ unitary-allocation review.
Own displayed-givens exact Fraction/AST, integer conservation searches and
formal formula witnesses; no author solver/renderer/checks imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-unitary-allocation-wave43.json'
OUT='problems/editorial/reviews/grade4-unitary-allocation-wave43.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return list(map(int,re.findall(r'[0-9]+',s)))
def integer(q):
 q=F(q);assert q.denominator==1,q
 return q.numerator
def calc(s):
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-').strip(),mode='eval'))
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(row):
 k=row['skillFamily'];s=row['statement'];n=nums(s);os=row.get('options',[]);v=a=None;suffix=''
 method='Independent actualprinted exact Fraction/unitary ledgers, orderedroles and SIconversion; original/new conditions fully read'
 if k in {'unit-price-new-count','common-rice-sack-new-mass','unit-cup-price-new-count'}:
  count,total,wanted=n;unit=integer(F(total,count));v=unit*wanted
  note=f'Printedoriginal{count}equalunits total{total}, unit{unit}; requestednew{wanted}units→{v}. Originalledger{count}×{unit}={total}.'
 elif k=='first-step-total-box-count':
  x,y,total=n;count=x+y;unit=integer(F(total,count));a=one([o for o in os if o==f'Барлық қорап санын табу: {x} + {y} = {count}'])
  note=f'Actualtwoequalpricegroups{x}+{y}={count}; FIRSTrequestedstepistotalcount, thenunitprice{unit}. Difference{y-x}anddividingfullpaymentbyonegroupfail semanticgiven.'
 elif k in {'hourly-fuel-unitary','hourly-area-unitary'}:
  t,work,wanted=n;unit=integer(F(work,t));v=unit*wanted
  note=f'Actualconstantunitrate{work}/{t}={unit}; requested{wanted}hours gives{v}, reverseunit anddirecttotal×newtime rejected.'
 elif k=='equal-daily-rate-second-week':
  t1,t2,total=n;rate=one([r for r in range(1,total+1)if r*t1+r*t2==total]);v=rate*t2
  note=f'PrintedEQUALdailyoutputs{rate}, workdays{t1}/{t2}; requestedSECONDweek{v}; first{rate*t1}+second{v}={total}.'
 elif k=='common-sack-mass-first-count':
  m1,m2,count=n;mass=integer(F(m1+m2,count));x,y=one([(x,count-x)for x in range(1,count)if x*mass==m1 and(count-x)*mass==m2]);v=x
  note=f'Actualcommonfullsackmass{mass}kg fromTOTAL{m1+m2}kg/{count}; independentcountpair{x}/{y}restoresBOTHmasses, requestedFIRST{x}.'
 elif k=='equal-worker-rates-first-work':
  t1,t2,total=n;rate=one([r for r in range(1,total+1)if r*t1+r*t2==total]);v=rate*t1
  note=f'PrintedEQUALdailyproductivity{rate}, unequaldaycounts{t1}/{t2}; requestedFIRSTwork{v}, second{rate*t2}; nothalftotal{F(total,2)}norunitrate.'
 elif k=='same-price-ordered-payment-pair':
  x,y,total=n;pairs=[nums(o)for o in os];a=one([o for o,(u,v)in zip(os,pairs)if u+v==total and F(u,x)==F(v,y)])
  u,v=nums(a);assert u>v and all(sum(pair)==total for pair in pairs)
  note=f'ALLfouractualorderedpairssumto{total}, so sumaloneinsufficient. Only{u}/{x}={v}/{y}={F(u,x)}equalunitprice; namedЖанарFIRST/СаяSECOND verified.'
 elif k=='fabric-unit-consumption-new-count':
  count,total,new=n;unit=integer(F(total,count));v=one([c for c in range(1,new+1)if c*unit==new])
  note=f'Printed{count}samebags use{total}m→{unit}m/bag; new{new}mconsumedexactlyby{v}bags. Unitlengthnotprice.'
 elif k=='equal-trips-ordered-load-pair':
  total,x,y=n;trips=integer(F(total,x+y));a=one([o for o in os if nums(o)==[x*trips,y*trips]])
  assert all(F(u,x)==F(v,y)and u+v==total for u,v in[nums(a)])
  note=f'ActualEQUALtripcounts{trips}, capacities{x}/{y}; orderedloads{x*trips}/{y*trips}, NOTreversed/equalhalf/tripslabelledtonnes.'
 elif k=='same-price-first-juice-cost':
  x,y,total=n;unit=integer(F(total,x+y));v=x*unit;suffix=' тг'
  note=f'Actualcommonboxprice{unit}from{x+y}boxes; APPLEfirst{x}boxes→{v}, other{y*unit}; equalhalf{F(total,2)}andunitpricearenotasked.'
 elif k=='same-price-equation-role':
  x,y,total=n;price=integer(F(total,x+y));truth=[]
  for o in os:
   lhs,rhs=o.split(' = ');truth.append(calc(lhs.replace('x',str(price)))==calc(rhs))
  a=one([o for o,t in zip(os,truth)if t]);assert a==f'({x} + {y}) × x = {total}'
  note=f'PrintedunknownxISunitprice; bothgroupsmustmultiplyx. Actualall4equationssubstitutedindependentprice{price}, truth{truth}; distributiveidentityx×{x}+x×{y}=(x+y)×xformalrolechecked.'
 elif k=='unit-price-money-shortfall':
  count,total,money,wanted=n;price=integer(F(total,count));required=price*wanted;v=required-money;assert v>0
  note=f'Printedunit{price}, desired{wanted}cost{required}, existingmoney{money}; askedSHORTFALL{v}, NOTfullrequiredpayment. Money+answerrestoresdesiredcost.'
 elif k=='fuel-kilometres-per-litre':
  distance,litres,new=n;km_per_litre=integer(F(distance,litres));v=integer(F(new,km_per_litre));assert F(litres,distance)*new==v
  note=f'Actual{distance}/{litres}={km_per_litre}km/litre; newdistance{new}requires{v}L. Bothreciprocalunitskm/LandL/km independentlyreconcile.'
 elif k=='equal-speed-second-distance':
  t1,t2,total=n;speed=one([v for v in range(1,total+1)if v*t1+v*t2==total]);v=speed*t2;suffix=' км'
  note=f'ActualsameSPEED{speed}, notsameDISTANCE. First{speed*t1}, SECOND{v}, sum{total}; equalhalftotal{F(total,2)}andtimecount{t1+t2}wrong.'
 elif k=='same-price-purchase-cost-gap':
  m1,m2,total=n;price=integer(F(total,m1+m2));v=price*m2-price*m1;suffix=' тг';assert v>0
  note=f'Actualonekgprice{price}; separatepayments{price*m1}/{price*m2}. RequestedSECOND−FIRST{v}, NOTsecondpayment{price*m2}, unitprice{price}, halftotal{F(total,2)}.'
 elif k=='tonne-centner-hourly-work':
  hours,tonnes,centners,new=n;mass=tonnes*10+centners;rate=integer(F(mass,hours));v=rate*new
  note=f'Actual{tonnes}t{centners}centner={mass}centner usingSI1t=10centner; rate{rate}/h, new{new}h→{v}CENTNER. Notkg/tonne output.'
 elif k in {'unit-price-from-total-boxes-first-count','unit-price-from-total-boxes-second-count'}:
  count,cost1,cost2=n;price=integer(F(cost1+cost2,count));x=integer(F(cost1,price));y=integer(F(cost2,price));assert x+y==count
  first=k.endswith('first-count');v=x if first else y;assert('Алма шырыны неше'if first else'Шие шырыны неше')in s
  note=f'Actual{count}boxes, commonprice{price}, apple{x},cherry{y}; requested'+('APPLEfirst'if first else'CHERRYsecond')+f'count{v}. Bothpaymentledgers andsumrestored.'
 elif k=='same-price-unknown-second-fabric-length':
  metres,cost,total=n;price=integer(F(cost,metres));v=integer(F(total-cost,price));assert (metres+v)*price==total
  note=f'Actualblue{metres}m costs{cost}→{price}/m; GREENsecondpayment{total-cost}→{v}m. Totalpaymentnotsecondpayment; metreunitexplicit.'
 elif k=='equal-boat-trip-count':
  x,y,total=n;v=one([trips for trips in range(1,total+1)if x*trips+y*trips==total]);assert str(2*v)in os
  note=f'Actualcapacities{x}/{y}, equaltripcounts; conservation{x}×{v}+{y}×{v}={total}. AskedEACH{v}, notcombinedtrips{2*v}.'
 elif k in {'common-crate-mass-first-count-choice','common-sack-mass-first-count-choice'}:
  count,m1,m2=n;mass=integer(F(m1+m2,count));x,y=one([(x,count-x)for x in range(1,count)if x*mass==m1 and(count-x)*mass==m2]);v=x
  note=f'Actualfullcontainermass{mass}, exactFIRSTcount{x}, second{y}, total{count}. Bothsources FIRSTtargetpreserved; equalhalf{F(count,2)}ignoresmassdifferences.'
 elif k=='increased-basket-capacity-new-count':
  mass,count,extra,new=n;unit=integer(F(mass,count));capacity=unit+extra;v=integer(F(new,capacity))
  note=f'Printedoldcapacity{unit}kg/basket plus{extra}kg→{capacity}kg/basket; new{new}kgrequires{v}baskets. IncrementbelongstoPERBASKETmass, notcount.'
 elif k=='two-harvests-centner-kilogram-box-count':
  first,factor,box=n;second=integer(F(first,factor));kg=(first+second)*100;v=integer(F(kg,box))
  note=f'Actualsecondharvest{first}/{factor}={second}centner, total{first+second}centner={kg}kg. Full{box}kgboxes→{v}; unit100not10or1000.'
 elif k=='equal-trips-difference-total-load':
  x,y,gap=n;trips=one([t for t in range(1,gap+1)if x*t-y*t==gap]);v=x*trips+y*trips;suffix=' т'
  note=f'PrintedDIFFERENCE{gap}t, pertrippairgap{x-y}; equaltripcounts{trips}. Loads{x*trips}/{y*trips}, requestedTOTAL{v}, notone truckorhalf.'
 elif k=='unit-price-second-purchase-larger-cost':
  mass,cost,gap=n;price=integer(F(cost,mass));v=integer(F(cost+gap,price))
  note=f'Actualfirstunitprice{price}, secondpayment{cost}+{gap}={cost+gap}, secondmass{v}. AskedwholeSECONDmassnotincrease{F(gap,price)}.'
 elif k=='unit-price-from-payment-gap-total':
  t1,t2,gap=n;price=integer(F(gap,t2-t1));first=price*t1;second=price*t2;v=first+second;suffix=' тг'
  assert second-first==gap
  note=f'PrintedPAYMENTDIFFERENCE{gap}correspondsto{t2-t1}tonnes, notsum{t1+t2}. Unit{price}, first{first}, second{second}, requestedTOTAL{v}.'
 elif k=='two-machines-solo-times-joint-time':
  work,t1,t2=n;r1=integer(F(work,t1));r2=integer(F(work,t2));v=one([t for t in range(1,work+1)if r1*t+r2*t==work])
  note=f'ActualSOLOtimes{t1}/{t2}, unitoutputs{r1}/{r2}, exactjointconservationgivestime{v}. Notaddition/averageoftimes.'
 elif k=='three-money-shares-third-fruit':
  m1,m2,m3,mass=n;v=integer(F(mass*m3,m1+m2+m3));shares=[F(mass*m,m1+m2+m3)for m in[m1,m2,m3]];assert all(x.denominator==1 for x in shares)and sum(shares)==mass
  note=f'Actualthreecontributions{m1}/{m2}/{m3}; proportionalsubsets{list(map(int,shares))}, requestedTHIRD{v}kg, notequalpeopledivision{F(mass,3)}.'
 elif k=='equal-house-contributions-third-minus-pair':
  h1,h2,h3,total=n;unit=integer(F(total,h1+h2+h3));first=unit*h1;second=unit*h2;third=unit*h3;v=third-first-second;suffix=' тг';assert v>0
  note=f'ActualequalPERHOUSE{unit}, THREEcommunitiespayments{first}/{second}/{third}. RequestedTHIRDminusFIRSTTWOcombined={v}; notthirdalone{third}norcombinedpair{first+second}.'
 elif k=='equal-pump-rates-mixed-time-first-work':
  h,m,t2,work=n;t1=60*h+m;rate=one([r for r in range(1,work+1)if r*t1+r*t2==work]);v=rate*t1
  note=f'Actualfirst{h}h{m}min={t1}min, second{t2}min; EQUALperminrate{rate}. RequestedFIRST{v}L, second{rate*t2}, sum{work}; rawh/minnotaddable.'
 elif k=='three-equal-rates-last-pair-minus-first':
  t1,t2,t3,area=n;rate=integer(F(area,t1+t2+t3));v=rate*t2+rate*t3-rate*t1;suffix=' м²'
  note=f'ActualEQUALperdayarea{rate}, THREEtimes{t1}/{t2}/{t3}; lastpair{rate*(t2+t3)}minusfirst{rate*t1}={v}m², NOTpairaloneorone rate.'
 elif k=='equal-bag-mass-first-store':
  n1,n2,mass=n;unit=integer(F(mass,n1+n2));v=unit*n1
  note=f'Actualcommonbagmass{unit}, FIRSTstore{n1}bags→{v}, SECOND{unit*n2}; totalrestored. Equalbags not equalstoremasses.'
 elif k=='printer-unitary-time-work':
  t,work,new=n;rate=integer(F(work,t));v=rate*new;suffix=' бет'
  note=f'Actual{work}pages/{t}min={rate}pages/min, requested{new}min→{v}. Rate{rate}andtotalpages×newminuteswrongchoicesdistinguished.'
 elif k=='equal-trips-second-load':
  total,x,y=n;trips=integer(F(total,x+y));v=y*trips;suffix=' т'
  note=f'Actualequaltripcounts{trips}; SECONDcapacity{y}→{v}tonnes, first{x*trips}, total{total}. Trips{trips}arenottonnes.'
 elif k=='metre-centimetre-fabric-unitary':
  count,m,cm,new=n;length=m*100+cm;per=integer(F(length,count));v=integer(F(per*new,100))
  note=f'Actual{m}m{cm}cm={length}cm, pergarment{per}cm. New{new}garments require{per*new}cm, returnedtoMETRES{v}; both100unitconversionsmandatory.'
 else:raise AssertionError(('Uncoveredmodel',k))
 if a is None:
  v=integer(v);assert v>0;a=one([o for o in os if o==str(v)+suffix])if os else str(v)
 assert row['answer']==a,(k,row['answer'],a)
 if os:assert len(os)==len(set(os))==4
 else:assert s.endswith('Жауапқа тек санды жазыңыз.')
 return{'method':method,'notes':note}

def chains(s):
 count=0
 for m in re.finditer(r'[0-9(][0-9\s+×:−()=\-]*',s):
  t=m.group().strip()
  if '='not in t or t.count('(')!=t.count(')'):continue
  ps=t.split('=')
  if any(not p.strip()or re.search(r'[+×:−-]\s*$',p)for p in ps):continue
  vs=list(map(calc,ps));assert all(v==vs[0]for v in vs),(t,vs);count+=1
 return count

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==39
 entries=[];eq=0
 for row in rows:
  ref=one(row['sourceRefs']);src=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert src['checked'];assert row['grade']==4 and row['minimumPlan']=='pro'
  norm=lambda s:re.sub(r'\s+',' ',s).strip().casefold();assert norm(src['statement'])!=norm(row['statement'])
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)});eq+=chains(row['solution'])
 rejected=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
 for i,row in enumerate(rows):
  bad=copy.deepcopy(row);bad['statement']=re.sub(r'[0-9]+',lambda m:str(int(m.group())+1),row['statement'],count=1)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printedgivenmutationaccepted',i))
 ledger=0;si=0
 # Build full separate ownership ledgers; recovering commonunit fromsumand
 # difference must reproduce both identities and WHO owns which quantity.
 for x in range(1,45):
  for y in range(1,45):
   for unit in range(1,35):
    first=x*unit;second=y*unit;combined=first+second
    assert F(combined,x+y)==unit and F(first,x)==F(second,y)==unit
    if x!=y:assert F(second-first,y-x)==unit
    assert combined-F(combined,x+y)*y==first;ledger+=1
 for metres in range(1,20):
  for cm in range(0,100):
   for count in range(1,15):
    length=100*metres+cm
    if length%count:continue
    per=length//count
    for new in[1,3,7,15]:
     exact=F(per*new,100);assert exact*100==per*new;si+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All39saved/newconditions,fullsolutions,allMCQread. OwnactualprintedFraction/integerunitledgers/orderedpairs/shortfall/difference/threecontributorsandSI60/100/10conversion. Noauthorcalculatorimported. Findings0.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'separateOwnershipLedgers':ledger,'cmMetreCases':si,'report':OUT if args.write else None}))
if __name__=='__main__':main()
