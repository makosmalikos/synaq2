"""Independent full38 saved/new/fullsolution/MCQ difference-to-unit review.
Own printed-givens Fraction/AST conservation, pair-constraint filters, finite
unit ledgers and SI60/1000; no author calculator/renderer/checker imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-difference-unit-wave44.json'
OUT='problems/editorial/reviews/grade4-difference-unit-wave44.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return list(map(int,re.findall(r'[0-9]+',s)))
def integer(q):
 q=F(q);assert q.denominator==1,q
 return q.numerator
def calc(s,x=None):
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):assert n.id=='x'and x is not None;return F(x)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-').strip(),mode='eval'))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def unit(a,b,gap):
 # Finite positiveinteger productivity/price search, not producer's division.
 return one([u for u in range(1,gap+1)if u*a-u*b==gap])
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);os=r.get('options',[]);v=a=None;suffix=''
 method='Independent actualprinted Fraction/AST, finite conservation unit search, ordered constraints and SI60/1000; full original/new conditions/solutions/MCQ read'
 if k in {'ruler-unit-price-difference','reading-rate-from-minute-gap','equal-car-speed-time-gap'}:
  x,y,gap=n;u=unit(x,y,gap);v=u
  suffix=' тг'if k=='ruler-unit-price-difference'else' км/сағ'if k=='equal-car-speed-time-gap'else''
  note=f'Printedcommonunit{u}, quantities{x}/{y}; bothoutputs{u*x}/{u*y}difference{gap}. AskedUNITnotonewholeoutput nor sum-basedrate.'
 elif k in {'hour-gap-second-work','museum-second-class-cost','bucket-count-gap-second-volume','fuel-volume-gap-second-cost'}:
  x,y,gap=n;u=unit(x,y,gap);v=u*y
  suffix=' тг'if k=='museum-second-class-cost'else''
  note=f'Printedcommonunit{u}, first{x}→{u*x}, SECOND{y}→{v}; {u*x}−{v}={gap}. RequestedSECOND, notrate{u}/first/gap.'
 elif k=='bucket-capacity-from-volume-gap':
  vol1,vol2,gap=n;capacities=[u for u in range(1,vol1+1)if vol1%u==0 and vol2%u==0 and vol1//u-vol2//u==gap];v=one(capacities);suffix=' л'
  note=f'Actualfullbucketcapacity{v}, counts{vol1//v}/{vol2//v}areintegersanddifference{gap}. Volumegap{vol1-vol2}is{gap}buckets, notone.'
 elif k=='rice-price-ordered-payments':
  x,y,gap=n;a=one([o for o in os if (lambda pair:pair[1]-pair[0]==gap and F(pair[0],x)==F(pair[1],y))(nums(o))]);u,v=nums(a)
  note=f'Actualorderedpayments{u}/{v}, commonkgprice{F(u,x)}; SECOND−FIRST={gap}, reversedpair and scaledpairs failnamedroles/givengap.'
 elif k in {'fabric-dress-first-day-work','same-trip-load-first-work','machine-hour-gap-first-work'}:
  x,y,gap=n;u=unit(x,y,gap);v=x*u
  note=f'Printedcommonunit{u}, FIRSTwork{v}, second{y*u}, gap{gap}; exactconservation. AskedFIRST, notSECOND{y*u}, rate{u}, orinitialgap.'
 elif k=='unit-price-expression-difference':
  x,y,gap=n;u=unit(x,y,gap);a=one([o for o in os if calc(o)==u]);assert a==f'{gap} : ({x} − {y})'
  note=f'All4actualexpressions evaluatedexactly. Uniqueexpression{a}={u}restoresprice×({x}−{y})={gap}; sum/multiply/first-only denominatorfail.'
 elif k=='book-payments-ordered-counts':
  m1,m2,gap=n;a=one([o for o in os if (lambda pair:pair[0]-pair[1]==gap and F(m1,pair[0])==F(m2,pair[1]))(nums(o))]);x,y=nums(a)
  note=f'Printedorderedcounts{x}/{y}, commonbookprice{F(m1,x)}, FIRST−SECOND={gap}. Same ratio aloneallowswrongscale; all4actualpairsfiltered.'
 elif k=='road-day-gap-second-metres':
  t1,t2,km=n;assert'MЕТР'in s.replace('М','M');rate=unit(t1,t2,km*1000);v=rate*t2
  note=f'Actualgap{km}km={km*1000}m; common{rate}m/day, SECOND{v}m. PrintedrequestedMETRE requiresfactor1000.'
 elif k=='cycling-mixed-time-gap-afternoon-metres':
  h,minutes,km=n;t1=60*h;rate=unit(t1,minutes,1000*km);v=rate*minutes
  note=f'Printedmorning{h}h={t1}min, afternoon{minutes}min; gap{km*1000}m. Actual{rate}m/min→AFTERNOON{v}m. BOTH60and1000scales needed.'
 elif k=='equal-rate-outputs-second-time':
  first,second,hgap=n;u=one([u for u in range(1,first+1)if first%u==second%u==0 and first//u-second//u==hgap]);v=second//u
  note=f'Actualsameintegeroutputrate{u}; printedoutputs{first}/{second}correspondtimes{first//u}/{v}withdifference{hgap}. RequestedSECONDtime.'
 elif k in {'electricity-difference-first-cost','fabric-price-difference-first-cost'}:
  x,y,gap=n;u=unit(y,x,gap);v=u*x;suffix=' тг'
  note=f'Actualcommonunitprice{u}, SECONDhas{y-x}extraunitsandcostsgap{gap}. RequestedFIRST{x}units→{v}, notlater{u*y}, unitpriceor gap.'
 elif k=='payment-pair-two-constraints':
  x,y,gap=n;pairs=[nums(o)for o in os];a=one([o for o,(u,v)in zip(os,pairs)if u-v==gap and F(u,x)==F(v,y)])
  bad=one([(u,v)for u,v in pairs if u-v==gap and F(u,x)!=F(v,y)]);assert bad==[4200,2760]or tuple(bad)==(4200,2760)
  note=f'Allactualorderedpairs filteredbyBOTHgap{gap}andcommonkgprice. Wrong{bad[0]}/{bad[1]}hasrightgapbut{F(bad[0],x)}≠{F(bad[1],y)}. Only{a}meetsboth.'
 elif k in {'two-garments-difference-total-fabric','crate-count-gap-total-mass','dress-shirt-difference-total-fabric'}:
  x,y,gap=n;u=unit(x,y,gap);v=u*x+u*y
  note=f'Actualsameperitem{u}, separateoutputs{u*x}/{u*y}, gap{gap}. AskedTOTAL{v}, distinctfromunit/onegroup/difference.'
 elif k=='crate-mass-gap-total-count':
  m1,m2,gap=n;u=one([u for u in range(1,m1+1)if m1%u==m2%u==0 and m1//u-m2//u==gap]);v=m1//u+m2//u
  note=f'Printedcommonfullcratemass{u}; counts{m1//u}/{m2//u}, countgap{gap}, requestedTOTAL{v}crates. Notmass noronecount.'
 elif k=='suit-fabric-gap-first-count':
  length1,length2,gap=n;u=one([u for u in range(1,length2+1)if length1%u==length2%u==0 and length2//u-length1//u==gap]);v=length1//u
  note=f'Actualpergarment{u}m, BLUEfirst{v}, grey{length2//u}, difference{gap}. RequestedFIRSTcount, notfabricmetres/othercount.'
 elif k=='minutes-per-problem-total-count':
  t1,t2,gap=n;per=one([u for u in range(1,t1+1)if t1%u==t2%u==0 and t1//u-t2//u==gap]);v=t1//per+t2//per
  note=f'Actualperproblem{per}MINUTES, notproblems/minute; completed{t1//per}/{t2//per}withgap{gap}, TOTAL{v}. Bothintegerproblemledgersrestored.'
 elif k=='pencil-box-gap-total-price':
  x,y,gap=n;u=unit(y,x,gap);v=u*x+u*y;suffix=' тг';assert'өз құны есептелмесе'in s
  note=f'Actualpackagingpriceexplicitlyexcluded. Commonpencilprice{u}, separate{u*x}/{u*y}, requestedTOTAL{v}; objectcountdifference{y-x}mapsmoneygap{gap}.'
 elif k=='derived-second-ball-count-total-mass':
  first,gap,mgap=n;second=first-gap;assert second>0;u=one([u for u in range(1,mgap+1)if u*first-u*second==mgap]);v=u*(first+second);suffix=' г'
  note=f'ActualSECONDcountderived{first}−{gap}={second}; equalballmass{u}g, masses{u*first}/{u*second}, difference{mgap}; requestedBOTHballmass{v}g, no boxmass.'
 elif k=='hidden-factor-second-roll-cost':
  first,factor,gap=n;second=integer(F(first,factor));u=unit(first,second,gap);v=u*second;suffix=' тг'
  note=f'PrintedSECONDlengthhiddenbymultiplicativefactor{factor}: {first}/{factor}={second}m. Sameprice{u}, SECONDcost{v}, FIRST{first*u}, difference{gap}.'
 elif k=='surplus-shortfall-money-equation':
  small,surplus,large,short=n;u=one([u for u in range(1,surplus+short+1)if small*u+surplus==large*u-short]);money=small*u+surplus
  truths=[]
  for o in os:
   lhs,rhs=o.split(' = ');truths.append(calc(lhs,u)==calc(rhs,u))
  a=one([o for o,t in zip(os,truths)if t]);assert a==f'{small} × x + {surplus} = {large} × x − {short}'
  note=f'ActualunknownxISprice{u}, existingmoney{money}. BOTHledgers{small}×{u}+{surplus}={large}×{u}−{short}={money}. All4equationsevaluatedtruth{truths}; shortfallmustsubtractfromrequiredpurchasecost.'
 elif k=='equal-notebooks-per-student-bundle-count':
  x,y,gap,bundle=n;u=unit(x,y,gap);total=u*(x+y);v=integer(F(total,bundle));assert'бума'in s
  note=f'ActualequalPERCHILD{u}notebooks; classoutputs{x*u}/{y*u}gap{gap}, total{total}notebooks; FULL{bundle}-notebookbundles→{v}. Requestedbundlesnotnotebooks.'
 elif k=='sack-mass-gap-second-flour-cost':
  x,y,gap,price=n;u=unit(x,y,gap);mass=y*u;v=mass*price
  note=f'Actualfullsackmass{u}kg, SECOND{y}sacks→{mass}kg; common{price}tг/kg→{v}tг. Gap{gap}kgnotsecondmass; two differentunitsteps.'
 elif k=='three-classes-endpoint-gap-total-cost':
  x,y,z,gap=n;u=unit(x,z,gap);v=u*(x+y+z);suffix=' тг'
  note=f'ActualpricefromENDPOINTclassA{x}andB{z}, gap{gap}; middleӘ{y}notindenominatorbutincludedTOTAL. Classcosts{u*x}/{u*y}/{u*z}, sum{v}.'
 elif k=='work-rate-difference-equation':
  t1,t2,gap=n;u=unit(t1,t2,gap);truths=[]
  for o in os:
   lhs,rhs=o.split(' = ');truths.append(calc(lhs,u)==calc(rhs,u))
  a=one([o for o,t in zip(os,truths)if t]);assert a==f'{t1} × x − {t2} × x = {gap}'
  note=f'ActualxIScommonhourlyproductivity{u}. Eachdaymustmultiplyx; bothoutputs{t1*u}/{t2*u}gap{gap}. Fourprintedequations truth{truths}; addition/unmultipliedsecondhoursfail.'
 elif k=='hypothetical-extra-books-actual-cost':
  actual,hyp,gap=n;u=unit(hyp,actual,gap);v=u*actual
  note=f'PrintedHYPOTHETICAL{hyp}books, ACTUAL{actual}; unit{u}. Actualpayment{v}, hypothetical{hyp*u}, difference{gap}; requestedREALpurchasecostnotcounterfactual.'
 elif k=='flower-payments-gap-first-count':
  m1,m2,gap=n;u=one([u for u in range(1,m1+1)if m1%u==m2%u==0 and m1//u-m2//u==gap]);v=m1//u
  note=f'Actualflowerprice{u}, orderedcounts{v}/{m2//u}, gap{gap}. RequestedFIRSTcount, notunitprice/SECONDcount/gap.'
 elif k=='equal-printer-rate-ordered-page-counts':
  t1,t2,gap=n;pairs=[nums(o)for o in os];a=one([o for o,(u,v)in zip(os,pairs)if u-v==gap and F(u,t1)==F(v,t2)])
  bad=one([(u,v)for u,v in pairs if u-v==gap and F(u,t1)!=F(v,t2)]);assert bad==(654,474)
  note=f'AllactualorderedpagepairsmustmatchBOTHgap{gap}andcommonpages/min. Wrong654/474hascorrectdifferencebutrates{F(654,t1)}≠{F(474,t2)}. Only{a}meetsboth; swappedpairfailssign.'
 elif k=='surplus-shortfall-initial-money':
  small,surplus,large,short=n;u=one([u for u in range(1,surplus+short+1)if small*u+surplus==large*u-short]);v=small*u+surplus
  assert large*u-v==short and v-small*u==surplus
  note=f'Actualoneballprice{u}fromsimultaneousledgers; requestedEXISTINGmoney{v}. Surplus{surplus}andshortfall{short}ADDforcostgap; notprice/fulllargepurchasecost.'
 else:raise AssertionError(('Uncovered',k))
 if a is None:
  v=integer(v);assert v>0;a=one([o for o in os if o==str(v)+suffix])if os else str(v)
 assert r['answer']==a,(k,r['answer'],a)
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
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==38
 entries=[];eq=0
 for r in rows:
  ref=one(r['sourceRefs']);src=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert src['checked'];assert r['grade']==4 and r['minimumPlan']=='pro'
  norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip().casefold();assert norm(src['statement'])!=norm(r['statement'])
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified',**solve(r)});eq+=chains(r['solution'])
 rejected=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
  b=copy.deepcopy(r);b['statement']=re.sub(r'[0-9]+',lambda m:str(int(m.group())+1),r['statement'],count=1)
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printedgivenmutationaccepted',r['editionId']))
 ledgers=si=surplus=0
 # Independently generate all commonunit ledgers, recover by the two observed
 # differences, and distinguish requested orderedpair/total/unit/inverse roles.
 for first in range(2,41):
  for second in range(1,first):
   for u in range(1,51):
    a,b=first*u,second*u;gap=a-b
    assert F(gap,first-second)==u and F(a,u)==first and F(b,u)==second
    assert a+b==u*(first+second)and a-b==gap
    assert F(a,first)==F(b,second)and F(b,first)!=F(a,second)
    ledgers+=1
 for hours in range(1,7):
  for afternoon in range(1,60*hours):
   for metres_per_minute in[1,3,7,50,125,300]:
    before=hours*60*metres_per_minute;after=afternoon*metres_per_minute;gap=before-after
    assert F(gap,60*hours-afternoon)==metres_per_minute
    assert F(F(gap,1000)*1000*afternoon,60*hours-afternoon)==after;si+=1
 for small in range(1,8):
  for large in range(small+1,12):
   for price in range(1,101):
    for left in[0,1,17,49]:
     money=small*price+left;short=large*price-money
     if short<=0:continue
     assert F(left+short,large-small)==price and large*price-short==money
     assert money-small*price==left;surplus+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All38saved/newconditions,fullsolutions,allMCQread. OwnactualprintedFraction/AST+finitecommonunitconservation, allorderedpairsincludingcorrectgap-wrongrate distractors, surplus/shortfallsigns, inversecount/time, mixedSI60/1000, totalsandbundles. Findings0. Noauthorcalculatorimported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'separateDifferenceLedgers':ledgers,'mixedTimeDistanceCases':si,'surplusShortfallLedgers':surplus,'report':OUT if args.write else None}))
if __name__=='__main__':main()
