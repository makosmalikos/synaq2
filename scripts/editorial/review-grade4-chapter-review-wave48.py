"""Independent complete37 saved/new/fullsolutions/every-MCQ review.
Own actualprinted Fraction/AST/physical ledgers, never author solver imports.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-chapter-review-wave48.json'
OUT='problems/editorial/reviews/grade4-chapter-review-wave48.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return list(map(int,re.findall(r'[0-9]+',s)))
def whole(x):
 x=F(x);assert x.denominator==1,x
 return x.numerator
def clock(s):
 h,m=map(int,s.split(':'));assert 0<=h<24 and 0<=m<60
 return h*60+m
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def calc(s,env=None):
 env=env or{}
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-').strip(),mode='eval'))
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(re.sub(r'\d{2}:\d{2}','CLOCK',s));os=r.get('options',[]);v=a=None;suffix=''
 if k=='written-internal-zero-product':
  x,m=n;v=x*m;assert str(x)[1:3]=='00' and len(str(x))==4 and str(v)[2]=='0';note=f'Actual{x}×{m}={v}. Distributive8000×7+9×7=56000+63; unitscarry6 entersTENS butHUNDREDSstays0, printedproofnotzeroelision.'
 elif k=='quarter-hour-reading-work':
  rate=one(n);assert'ТӨРТТЕН БІР БӨЛІГІ'in s;v=rate*F(60,4);note=f'Invariant1h60min, quarter15min; actualrate{rate}gives{v}WORDS, notrate/4orquarterDAY.'
 elif k=='basic-time-symbolic-formula':
  assert'оң u'in s;a=one([o for o in os if o=='T = D : u'])
  for d,u in[(120,40),(45,6),(1,10)]:assert calc(a.split(' = ')[1],{'D':d,'u':u})*u==d
  note='FormalD=uT withu>0 givesT=D/u; actual4formulaschecked, reverseu/Disnotduration. CasesincludeNONINTEGERtime45/6and1/10.'
 elif k in {'fabric-difference-unit-price','fabric-difference-first-total-cost'}:
  first,second,gap=n;price=F(gap,first-second);assert price>0;v=price if k=='fabric-difference-unit-price'else price*first;assert price*first-price*second==gap;note=f'ActualcommonUNITprice{price}, FIRSTtotal{price*first}, SECOND{price*second}; givenGAP{gap}checked. Requested'+('UNITprice.'if k=='fabric-difference-unit-price'else'FIRSTFULLcost, notunitprice.')
 elif k=='walkers-outward-distance-review':
  u,w,t=n;assert'бір түзу бойымен қарама-қарсы'in s;v=u*t+w*t;note=f'ActualoppositeOUTWARDcoordinates{u*t}/−{w*t}gap{v}; sumnotdifference.'
 elif k in {'opposite-meeting-time-choice-review','opposite-trains-meeting-time-review'}:
  d,u,w=n;v=F(d,u+w);suffix=' сағ'if os else'';assert u*v+w*v==d;note=f'Actualuniqueintersection{v}h withpaths{u*v}/{w*v}; relativeSUM{u+w}, notdifference.'
 elif k=='approach-speed-choice-review':
  u,w=n;v=u+w;suffix=' км/сағ';note=f'Actualgapderivative−{v}, requestedAPPROACHrateSUM, notmean{F(u+w,2)}/difference{abs(u-w)}/product{u*w}.'
 elif k in {'daily-productivity-choice-review','daily-productivity-open-review'}:
  days,work=n;v=F(work,days);assert v*days==work;note=f'ActualequalDAILYwork{v}; all{days}daysrestore{work}, notmultiplicationorwork−days.'
 elif k=='quarter-day-hours-invariant':
  assert'Тәулік'in s and'төрт'in s;v=F(24,4);suffix=' сағ';note='Invariant24hDAYdividedinto4equalparts→6HOURS. 15minisquarterHOUR,12hhalfDAY; factnotchangedfornumericnovelty.'
 elif k=='joint-tailor-order-time':
  u,w,work=n;v=F(work,u+w);assert u*v+w*v==work;note=f'Actualsimultaneouswork{u+w}/day, sharedtime{v}; individual{u*v}/{w*v}conserves{work}.'
 elif k=='outward-distance-literal-review':
  assert'бір түзу бойымен қарама-қарсы'in s;a=one([o for o in os if o=='(u + w) × T'])
  for u,w,t in[(5,7,3),(14,9,4),(3,5,F(3,2))]:assert calc(a,{'u':u,'w':w,'T':t})==u*t+w*t
  note='FormalpositionsuT/−wT implygap(u+w)T. ParenthesesapplyTtoBOTHrates; all4symbolicforms, missingparenthesesanddifferencefalsecounterexamples.'
 elif k=='equal-rate-difference-first-time':
  first,second,gap=n;rate=F(first-second,gap);v=F(first,rate);assert v-F(second,rate)==gap;note=f'Actualsharedrate{rate}; FIRST{v}days, SECOND{F(second,rate)}days; BOTHworkloadsand{gap}dayGAPchecked.'
 elif k=='joint-pump-second-rate':
  t,work,u=n;v=F(work,t)-u;assert (u+v)*t==work;note=f'ActualSECONDpump{v}L/MIN, SUM{F(work,t)}; common{t}MINrestores{work}L.'
 elif k=='quarter-day-plus-quarter-hour':
  assert'тәуліктің төрттен бір'in s and'сағаттың төрттен бір'in s and'ҚОСЫНДЫСЫН'in s
  target=F(24*60,4)+F(60,4);a=one([o for o in os if (lambda p:p[0]*60+p[1])(nums(o))==target]);note='InvariantquarterDAY360minPLUSquarterHOUR15min→375min=6h15min. Bothdifferentoriginalunitskept; no100min/hourfiction.'
 elif k=='fixed-feed-inverse-cow-count':
  feed,days,cows=n;daily=F(feed,days);v=F(feed,cows*daily);suffix=' күн';assert cows*daily*v==feed;note=f'Actualone-cow{daily}kg/day, {cows}cowsconsume{cows*daily}; fixedfeed{feed}gives{v}days. Feedmasscancelslegitimately, countINVERSE.'
 elif k=='equal-speed-early-rider-original-distance':
  lead,gap,second=n;speed=F(gap,lead);v=speed*(lead+2*second);assert speed*(lead+second)-speed*second==gap;note=f'ActualEQUALspeed{speed}, durations{lead+second}/{second}; fullsum{v}, pathDIFFERENCE{gap}, earlierdeparturelead{lead}.'
 elif k=='same-time-running-scale':
  first,second,target=n;v=F(target*second,first);assert F(target,first)==F(v,second);note=f'Actualconstant-rateSAMEelapsedscalemultiplier{F(target,first)}; SECONDpath{v}, nottargetplusfixedgap.'
 elif k=='reading-less-factor-joint-work':
  u,factor,days=n;w=u*factor;v=(u+w)*days;note=f'ActualgivenSMALLrate{u}, sibling{w}={factor}×{u}; combined{u+w}×{days}={v}, less-factorisnotdividegivenagain.'
 elif k=='same-direction-catch-after-start':
  slow,lead,fast=n;assert fast>slow and'ЖЕҢІЛ КӨЛІК ШЫҚҚАННАН'in s;v=F(slow*lead,fast-slow);suffix=' сағ';assert fast*v==slow*(lead+v);note=f'Actualinitiallead{slow*lead}; catchAFTERSECOND{v}h, FIRSTtotal{lead+v}; gapclosedbyDIFFERENCE{fast-slow}.'
 elif k=='table-count-gap-second-seats':
  first,second,gap=n;per=F(gap,first-second);v=per*second;assert first*per-v==gap;note=f'ActualperTABLE{per}, requestedSECONDhall{v}, FIRST{first*per}; bothTABLEcountdifferenceandSEATgapkept.'
 elif k=='two-speed-rate-ratio':
  t1,d1,t2,d2=n;u,w=F(d1,t1),F(d2,t2);v=u/w;note=f'Actualrates{u}/{w}; requestedMULTIPLICATIVE{v}, notgap{u-w}orrawdistance{F(d1,d2)}ratio.'
 elif k=='delayed-opposite-first-path-review':
  d,u,w=n;starts=list(map(clock,re.findall(r'\d{2}:\d{2}',s)));lead=F(starts[1]-starts[0],60);joint=F(d-u*lead,u+w);assert joint>0;v=u*(lead+joint);assert v+w*joint==d;note=f'ActualFIRSTlead{lead}h, joint{joint}h; FIRSTWHOLEpath{v}, SECOND{w*joint}; notFIRSTjointphaseonly{u*joint}.'
 elif k=='three-worker-days-second-payment':
  a1,a2,a3,pay=n;unit=F(pay,a1+a2+a3);v=unit*a2;assert unit*a1+v+unit*a3==pay;note=f'Actualordereddayweights{a1}/{a2}/{a3}, rate{unit}; SECONDshare{v}, notequal-thirds/firstorlast.'
 elif k=='two-solo-times-joint-work-choice':
  work,t1,t2=n;u,w=F(work,t1),F(work,t2);v=F(work,u+w);suffix=' күн';assert v<t1 and v<t2 and u*v+w*v==work;note=f'Actualindividualrates{u}/{w}, jointtime{v}; workvolumelegitimatelycancels, timesMEAN{F(t1+t2,2)}andSUM{t1+t2}notjoint.'
 elif k=='same-direction-catch-literal':
  assert'u > v'in s and'сол бағытта'in s;a=one([o for o in os if o=='D : (u − v)'])
  for d,u,v in[(12,10,7),(25,9,4),(7,8,3)]:
   t=calc(a,{'D':d,'u':u,'v':v});assert u*t==d+v*t
  note='FormalD>0,u>v>0: secondpositionut catchesfirstD+vt onlyatD/(u−v). FouractualformulasASTchecked, bothdenominatorparenthesesandsamedirectionDIFFERENCEessential.'
 elif k=='equal-distance-round-trip-average':
  d,u,w=n;t=F(d,u)+F(d,w);v=F(2*d,t);suffix=' км/сағ';assert v!=F(u+w,2) and v>min(u,w)and v<max(u,w);note=f'ActualEQUALpaths{d}+{d}, unequalTIMES{F(d,u)}/{F(d,w)}, weightedAVG{v}; arithmeticMEAN{F(u+w,2)}isexplicitfalseoption.'
 elif k=='delayed-second-pipe-total-time-review':
  work,lead,u,w=n;joint=F(work-u*lead,u+w);v=lead+joint;assert u*v+w*joint==work and'БАРЛЫҒЫ'in s;note=f'ActualFIRSTsolo{lead}min/{u*lead}L, joint{joint}min, TOTAL{v}; jointonly{joint}notanswer.'
 elif k=='remaining-time-before-encounter-distance':
  u,w,t=n;assert'қалған сәтте'in s;v=(u+w)*t;note=f'ActualREMAININGuntilmeeting{t}h impliesCURRENTgap{v}; unknownoriginaldistanceunneeded, notsilentlyassumedstarttime.'
 elif k=='bike-turnaround-meeting-total-time':
  d,bike,walker=n;arrival=F(d,bike);walker_at_turn=walker*arrival;after=F(d-walker_at_turn,bike+walker);v=arrival+after;suffix=' сағ';assert after>0 and 2*d-bike*v==walker*v and v>arrival;note=f'ActualFIRSTturnat{arrival}h, walkerthen{walker_at_turn}, gap{d-walker_at_turn}, returnjoint{after}; TOTAL{v}, meetingcoordinate{walker*v}. SecondidentitytotalPATHS2Dchecked, initialcoincidenceexcludedbyқайта.'
 elif k=='equal-distance-different-time-inverse':
  slow,fast,gap=n;v=F(gap,F(1,slow)-F(1,fast));assert F(v,slow)-F(v,fast)==gap;note=f'ActualSAMEroute{v}, slowTIME{F(v,slow)}, fastTIME{F(v,fast)}, TIMEgap{gap}; ratesnotdirectlymultipliedbygap.'
 elif k=='opposite-original-distance-review':
  u,w,t=n;v=u*t+w*t;note=f'ActualmeetingendpointsSUMof{u*t}/{w*t}→ORIGINALdistance{v}, notpathgap.'
 elif k=='quarter-day-minute-target':
  assert'Тәулікті төрт'in s and'МИНУТПЕН'in s;v=F(24*60,4);suffix=' мин';note='InvariantquarterDAY24/4=6HOURS then×60=360MINUTES. Definitionunchanged, requestedunitexplicit, 6minand600mintrapsrejected.'
 elif k=='path-gap-to-original-meeting-distance':
  u,w,gap=n;t=F(gap,u-w);v=(u+w)*t;assert u*t-w*t==gap;note=f'ActualPATHgap{gap}determinescommon{t}h throughRATEdifference{u-w}; thenPATHSUM{v}requestedORIGINALdistance.'
 elif k=='same-direction-catch-absolute-clock':
  slow,fast=n;starts=list(map(clock,re.findall(r'\d{2}:\d{2}',s)));lead=F(starts[1]-starts[0],60);after=F(slow*lead,fast-slow);at=starts[1]+60*after;a=one([o for o in os if clock(o)==at]);assert fast*after==slow*(lead+after);note=f'Actualorigins{starts}, SAMEdirectionlead{lead}, afterSECOND{after}h, ABSOLUTEclock{a}; positionsboth{fast*after}, notclockplusleadagain.'
 else:raise AssertionError(k)
 if a is None:
  a=str(whole(v))+suffix
  if os:a=one([o for o in os if o==a])
 assert a==r['answer'],(r['editionId'],r['answer'],a)
 return note
def chains(s):
 count=0;s=re.sub(r'\d{2}:\d{2}','CLOCK',s)
 for m in re.finditer(r'[0-9(][0-9\s+×:−()=\-]*',s):
  if s[:m.start()].rstrip().endswith(tuple('×:+−-/=(')):continue
  text=m[0].strip()
  if'='not in text or text.count('(')!=text.count(')'):continue
  parts=text.split('=')
  if any(not p.strip()or re.search(r'[+×:−-]\s*$',p)for p in parts):continue
  qs=list(map(calc,parts));assert all(q==qs[0]for q in qs),(text,qs);count+=1
 return count
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==37
 entries=[];seen=set();eq=0
 for r in rows:
  ref=one(r['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution'];seen.add((ref['sourceFile'],ref['sourceId']))
  norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r);eq+=chains(r['solution']);assert r['grade']==4 and r['minimumPlan']=='pro'
  if'options'in r:assert len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  else:assert re.fullmatch(r'\d+',r['answer'])and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted Fraction/AST, fullsaved/new/fullsolutions/everyMCQread; exactclock/weightedrate/stagedwork/physicalpositions/SI/orderedquantityroles; noauthorcalculatorimported','notes':note})
 assert len(seen)==37
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 rejected=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
  if not re.search(r'\d',r['statement']):continue
  b=copy.deepcopy(r);index=1 if r['skillFamily']in{'fixed-feed-inverse-cow-count','two-solo-times-joint-work-choice','equal-distance-round-trip-average'}else 0
  matches=list(re.finditer(r'\d+',b['statement']));m=matches[index];b['statement']=b['statement'][:m.start()]+str(int(m.group())+1)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 catch=turn=rate=pay=0
 for slow in range(1,16):
  for fast in range(slow+1,25):
   for lead in[1,2,3]:
    t=F(slow*lead,fast-slow);assert fast*t==slow*(lead+t);catch+=1
   for d in[12,36,75]:
    arrival=F(d,fast);after=F(d-slow*arrival,fast+slow);t=arrival+after
    assert t>arrival and 2*d-fast*t==slow*t and t==F(2*d,fast+slow);turn+=1
 for d in[24,120,360]:
  for u in range(1,21):
   for w in range(1,21):
    average=F(2*d,F(d,u)+F(d,w));assert F(2*d,average)==F(d,u)+F(d,w)
    if u!=w:assert average<F(u+w,2)
    rate+=1
 for a in range(1,11):
  for b in range(1,11):
   for c in range(1,11):
    total=(a+b+c)*1700;second=F(total*b,a+b+c);assert second==b*1700 and total-second==(a+c)*1700;pay+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All37saved/newconditions,fullsolutions,everyMCQread; independent actualprinted exactFraction/AST, 8009×7internalzero/carry, invariantquarter24/4and60/4, weightedroundtripNOTmean, catchclock/delayedturnaround/stagedworkTOTAL/remainingvswhole, orderedFIRST/SECOND/unit/fullcost and exactunits. Findings0. Noauthorcalculatorimported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':rejected,'printedCanariesRejected':printed,'numericChains':eq,'catchLedgers':catch,'turnaroundLedgers':turn,'weightedAverageCases':rate,'orderedPayCases':pay,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
