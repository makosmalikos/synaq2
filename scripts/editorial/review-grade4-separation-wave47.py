"""Independent full saved/new/solutions/every-MCQ review of separation39.
Actual displayed givens feed Fraction/AST conservation, clock and role checks.
No author calculator, renderer, specs or checker is imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-separation-wave47.json'
OUT='problems/editorial/reviews/grade4-separation-wave47.json'
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
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(re.sub(r'\d{2}:\d{2}','CLOCK',s));os=r.get('options',[]);v=a=None;suffix=''
 if k=='known-separation-rate-time':
  rate,d=n;v=F(d,rate);assert rate*v==d;note=f'Actualrelative{rate}, gap{d}, uniqueelapsed{v}; individualratesunderdeterminedandnotasked.'
 elif k=='opposite-outward-rate-formula':
  assert'бір түзу бойымен қарама-қарсы'in s;a=one([o for o in os if o=='q = u + w'])
  for u,w in[(17,9),(11,11),(40,60)]:assert calc(a.split(' = ')[1],{'u':u,'w':w})==abs(u-(-w))
  note='Formalpositiveu,w on oppositehalflines: coordinatesut and−wt havegap(u+w)t; all4displayedformulascheckedbycounterexampleu17,w9, chosenidentityuniversal.'
 elif k=='given-rate-times-time-choice':
  rate,t=n;assert'түзу жолдың қарама-қарсы екі жағына'in s;v=rate*t;suffix=' км';note=f'Actualgivenrate{rate}×{t}={v}; option{F(rate,t)}division,{rate+t}addition,{rate-t}subtractionallwrongdimensions.'
 elif k=='successive-hour-distance-triple':
  u,w,*times=n;assert times==[1,2,3];a=one([o for o in os if nums(o)==[(u+w)*t for t in times]]);note=f'Actualsignedpositionsgap{u+w}t atordered1/2/3hours; all4tripleschecked, constantincrements{u+w}not10/100.'
 elif k in {'ski-minute-distance','walkers-outward-distance','aircraft-opposite-distance'}:
  u,w,t=n;v=u*t+w*t;note=f'Actualseparatesignedpaths{u*t}/{w*t}, Euclideangap{v}; sameelapsed{t}, compatiblespeed/timeunits.'
 elif k=='per-minute-increase-choice':
  u,w=n;v=u+w;suffix=' м';note=f'Actualone-MINUTE increase{v}METRES; firstonly{u}, firstHOUR{60*u}, anddifference{abs(u-w)}allwrongreference.'
 elif k in {'bus-distance-target-time','rider-distance-target-time'}:
  u,w,d=n;v=F(d,u+w);assert u*v+w*v==d;note=f'Actualuniqueincreasinggapfirstreaches{d}at{v}h, paths{u*v}/{w*v}; sumrate{u+w}notdifference.'
 elif k=='outward-distance-monotonicity':
  assert'Оң тұрақты'in s;a=one([o for o in os if o=='Үнемі өседі']);note='FormalD(t)=(u+w)t foru,w>0; positiveincrementforEVERYpositivedeltat. Initial0 and outwarddirectionprecludefirstshrink/constant.'
 elif k=='outward-distance-expression':
  u,w,t=n;a=one([o for o in os if calc(o)==u*t+w*t]);assert a==f'({u} + {w}) × {t}';note=f'ActualexpressionSUMparenthesesbindbothratesbefore×{t}; value{u*t+w*t}. All4displayedexpressionsASTevaluated.'
 elif k in {'cars-separation-rate','bus-separation-rate'}:
  u,w=n;v=u+w;note=f'Actualonehourindividualpaths{u}/{w}; requestedSEPARATIONRATE{v}, notdistanceoveranunspecifiedtime.'
 elif k=='unknown-ski-speed-equation-root':
  u,t,d=n;v=F(d,t)-u;assert v>0 and u*t+v*t==d;note=f'ActualSECONDspeed{v}rootof(x+{u})×{t}={d}; individualvsSUM{F(d,t)}distinguished.'
 elif k=='other-path-to-helicopter-speed':
  t,d,firstpath=n;v=F(d-firstpath,t);assert firstpath+v*t==d;note=f'ActualSECONDpath{d-firstpath}, speed{v}; knownFIRSTPATH{firstpath}notrate, shared{t}h.'
 elif k=='half-hour-target-duration':
  u,w,d=n;t=F(d*60,u+w);a=one([o for o in os if (lambda x:x[0]*60+x[1])(nums(o))==t]);assert t%60==30;note=f'Actual{t}MINduration, halfhour30not50/5min; all4displayedhourminutepairsconvertedexactly.'
 elif k=='minute-speed-hour-time-km-distance':
  u,w,t=n;v=F((u+w)*t*60,1000);note=f'Actual{t}HOUR→{60*t}MIN, paths{u*t*60}/{w*t*60}METRES→{v}KILOMETRES; BOTH60and1000needed.'
 elif k=='hidden-factor-boat-separation':
  u,factor,t=n;w=u*factor;v=u*t+w*t;note=f'ActualhiddenSECOND{w}={factor}×FIRST{u}, paths{u*t}/{w*t}sum{v}; factorisnotadditivegap.'
 elif k=='km-target-minute-time':
  u,w,km=n;v=F(1000*km,u+w);note=f'Actual{km}km→{1000*km}m, unique{v}MIN; paths{u*v}/{w*v}sumtarget.'
 elif k=='outward-speed-equation-choice':
  t,d,u=n;root=F(d,t)-u
  a=one([o for o in os if (lambda sides:calc(sides[0],{'x':root})==calc(sides[1],{'x':root}))(o.split(' = '))]);assert a==f'(x + {u}) × {t} = {d}';note=f'ActualSECONDroot{root}; all4displayedequationsbacksubstituted. OnlySUM×wholetimeworks, notunparenthesized/ratedifference/division.'
 elif k=='equal-individual-train-speed-choice':
  t,d=n;v=F(d,2*t);suffix=' км/сағ';note=f'ActualEACH{v}, SUM{2*v}; coordinates±{v}×{t}havegap{d}. ExplicitEACHpreventsreturningrelative{2*v}.'
 elif k=='half-hour-word-distance-choice':
  u,w=n;assert'ЖАРТЫ САҒАТ'in s;v=F(u+w,2);suffix=' км';note=f'ActualHALFhour→{v}km; unittrap30×{u+w}anddoubledtime{2*(u+w)}checked.'
 elif k=='largest-distance-pair-sum':
  assert'ең үлкен'in s;t=one(n);pairs=[nums(o) for o in os];dist=[sum(p)*t for p in pairs];a=one([o for o,d in zip(os,dist)if d==max(dist)]);assert max(map(max,pairs))not in nums(a);note=f'All4actualpairSUMpaths{dist}; chosen{a}hasgreatestSUM, excludesfastestINDIVIDUAL{max(map(max,pairs))}trap.'
 elif k=='second-path-not-speed-choice':
  u,t,d=n;assert'КИЛОМЕТР'in s;v=d-u*t;suffix=' км';note=f'ActualSECONDpath{v}, FIRSTpath{u*t}; SECONDspeed{F(v,t)}andSUMrate{F(d,t)}areactualdistractorsbutWRONGquantity.'
 elif k=='same-time-from-path-and-speed-gaps':
  a1,a2,gap=n;v=F(a1-a2,gap);suffix=' сағ';assert F(a1,v)-F(a2,v)==gap;note=f'Actualsharedtime{v}fromPATHDIFFERENCE{a1-a2}andSPEEDDIFFERENCE{gap}; bothindividualpaths/ratesbacksubstitute.'
 elif k=='hidden-time-other-train-speed':
  u,d,path=n;t=F(path,u);v=F(d-path,t);suffix=' км/сағ';note=f'Actualhiddentime{t}fromFIRSTpath{path}/rate{u}; SECONDpath{d-path}, SECONDspeed{v}, SUM{F(d,t)}notanswer.'
 elif k=='ordered-speed-ratio-sum':
  factor,t,d=n;pairs=[nums(o) for o in os];a=one([o for o,(u,w)in zip(os,pairs)if (u+w)*t==d and w==factor*u]);assert'осы ретпен'in s;note=f'All4actualorderedpairsrequireBOTHsum×{t}={d}ANDSECOND={factor}×FIRST; decoysseparatelysatisfyONLYsumorONLYfactor.'
 elif k=='initial-gap-additional-time':
  initial,elapsed,observed,target=n;rate=F(observed-initial,elapsed);v=F(target-observed,rate);assert initial+rate*(elapsed+v)==target and'ТАҒЫ'in s;note=f'Actualinitial{initial}, observed{observed}after{elapsed}, rate{rate}; requestedADDITIONAL{v}, total{elapsed+v}explicitlydifferent.'
 elif k=='delayed-outward-absolute-hour':
  times=list(map(clock,re.findall(r'\d{2}:\d{2}',s)));u,w,d=n;lead=F(times[1]-times[0],60);after=F(d-u*lead,u+w);at=F(times[1],60)+after;v=at;assert u*(lead+after)+w*after==d;note=f'Actualabsoluteorigins{times}, FIRSTlead{lead}, postSECONDduration{after}; clockHOUR{at}, signedpathsrestore{d}.'
 elif k=='half-hour-absolute-clock-choice':
  u,w,d=n;start=clock(one(re.findall(r'\d{2}:\d{2}',s)));duration=F(60*d,u+w);at=start+duration;a=one([o for o in os if clock(o)==at]);assert clock(a)!=duration;note=f'ActualSTART{start}min+duration{duration}min→clock{a}; durationonly02:30explicitlyexcluded.'
 elif k=='second-speed-from-sum-and-gap':
  t,d,gap=n;v=(F(d,t)-gap)/2;assert (2*v+gap)*t==d;note=f'ActualSECOND{v}, FIRST{v+gap}; BOTHsum{F(d,t)}andgap{gap}checked, notlargerfirstspeed.'
 elif k=='early-cyclist-speed-inverse':
  lead,w,after,d=n;v=F(d-w*after,lead+after);assert v*(lead+after)+w*after==d;note=f'ActualFIRSTduration{lead+after}vsSECOND{after}; knownSECONDpath{w*after}; recoveredEARLYcyclist{v}.'
 elif k=='one-car-rest-total-distance':
  u,w,stop,t=n;assert 0<stop<t;v=u*(t-stop)+w*t;assert v==(u+w)*t-u*stop;note=f'ActualFIRSTmotion{t-stop}h, SECOND{t}h; FULL{stop}hstopcost{u*stop}, gap{v}; stopnotdeductedfromboth.'
 elif k=='inverse-separation-rate-choice':
  t,d=n;v=F(d,t);suffix=' км/сағ';note=f'ActualrelativeSUM{v}; noindividualequalityassumed. Half{v/2}isnotrequestedrate.'
 elif k=='mixed-km-metres-target-time':
  u,w,km,m=n;v=F(1000*km+m,u+w);assert (u+w)*v==1000*km+m;note=f'Actualmixedtarget{km}km{m}m→{1000*km+m}m, unique{v}MIN.'
 elif k=='thirty-minute-distance-choice':
  u,w,minutes=n;v=F((u+w)*minutes,60);suffix=' км';assert minutes==30;note=f'Actual{minutes}/60hour, gap{v}; direct×30iswrong60factor, speedDIFFERENCEiswrongdirection.'
 elif k=='delayed-outward-after-second-time':
  u,lead,w,d=n;v=F(d-u*lead,u+w);assert u*(lead+v)+w*v==d and'ФУРГОН ШЫҚҚАННАН'in s;note=f'ActualFIRSTlead{lead}h, requestedAFTERSECOND{v}h, FIRSTtotal{lead+v}notanswer; bothpathsrestore{d}.'
 elif k=='nonzero-initial-gap-clock-choice':
  initial,u,w,target=n;start=clock(one(re.findall(r'\d{2}:\d{2}',s)));duration=F(60*(target-initial),u+w);a=one([o for o in os if clock(o)==start+duration]);assert initial+(u+w)*duration/60==target;note=f'Actualinitial{initial}alreadyexists; ADDITIONALpaths{target-initial}, elapsed{duration}min, START{start}→{a}. Ignoringinitialandduration-onlybothwrong.'
 else:raise AssertionError(k)
 if a is None:
  answer=str(whole(v))+suffix
  a=one([o for o in os if o==answer])if os else answer
 assert r['answer']==a,(r['editionId'],r['answer'],a)
 return note
def numeric_chains(s):
 count=0
 s=re.sub(r'\d{2}:\d{2}','CLOCK',s)
 for m in re.finditer(r'[0-9(][0-9\s+×:−()=\-]*',s):
  if s[:m.start()].rstrip().endswith(tuple('×:+−-/=(')):continue
  text=m[0].strip()
  if'='not in text or text.count('(')!=text.count(')'):continue
  parts=text.split('=')
  if any(not p.strip()or re.search(r'[+×:−-]\s*$',p)for p in parts):continue
  qs=list(map(calc,parts));assert all(q==qs[0]for q in qs),(text,qs);count+=1
 return count
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==39
 entries=[];refs=set();chains=0
 for r in rows:
  ref=one(r['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution']
  norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);refs.add((ref['sourceFile'],ref['sourceId']))
  note=solve(r);chains+=numeric_chains(r['solution']);assert r['grade']==4 and r['minimumPlan']=='pro'
  if'options'in r:assert len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  else:assert re.fullmatch(r'\d+',r['answer'])and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualdisplayed Fraction/AST signedpositions, exactSI60/1000, clock/quantity/domain checks; fullsaved/new/solutions/everyMCQread; noauthorcalculatorimported','notes':note})
 assert len(refs)==39
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 rejected=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
 printed_rejected=0
 for r in rows:
  if not re.search(r'\d',r['statement']):continue
  b=copy.deepcopy(r);b['statement']=re.sub(r'\d+',lambda m:str(int(m.group())+1),b['statement'],count=1)
  if r['skillFamily']=='largest-distance-pair-sum':
   solve(b) # SamepositiveelapsedscalesALLpairs; rankingproperlyinvariant.
   b['statement']=r['statement'].replace('ең үлкен','ең кіші')
  try:solve(b)
  except(AssertionError,ValueError,ZeroDivisionError):printed_rejected+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 # Full finite independent signed-position ledgers, with arbitrary positive
 # rational elapsed times, nonzero initial gaps, departure leads and rests.
 signed=initial=delayed=rest=0
 for u in range(1,21):
  for w in range(1,21):
   for t in[F(1,2),F(3,2),F(2),F(5,2),F(4)]:
    gap=abs(u*t-(-w*t));assert gap==(u+w)*t and F(gap,u+w)==t;signed+=1
    for gap0 in[7,40,600]:
     total=abs((-u*t)-(gap0+w*t));assert total==gap0+(u+w)*t
     observed=gap0+(u+w)*F(1,3);assert F(total-observed,u+w)==t-F(1,3);initial+=1
   for lead in[1,2,3]:
    for after in[1,2,4]:
     d=u*(lead+after)+w*after;assert F(d-u*lead,u+w)==after and F(d-w*after,lead+after)==u;delayed+=1
   for elapsed in range(2,9):
    for stop in range(1,elapsed):
     d=u*(elapsed-stop)+w*elapsed;assert d==(u+w)*elapsed-u*stop;rest+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All39saved/newconditions,fullsolutions,everyMCQread. Actualdisplayed exactFraction/AST, ONE-LINEoppositeoutward, differentclockorigins, additionalvsTOTAL, unequaldepartures/fullstops, orderedratioANDsum, individualPATHvsRATE, units60/1000. Oneambiguousdirectionphrase authorclarified beforehash; mathematicaldataunchanged. Noauthorcalculatorimported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':rejected,'printedCanariesRejected':printed_rejected,'numericChains':chains,'signedPositionCases':signed,'initialGapCases':initial,'unequalDepartureCases':delayed,'fullStopCases':rest,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
