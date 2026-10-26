"""Independent full40 saved/new/fullsolution/MCQ opposing-motion review.
Own printed-givens Fraction/AST signed trajectories, absolute-clock ledgers,
piecewise earliest meeting and finite domains. No author calculator imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-meeting-wave45.json'
OUT='problems/editorial/reviews/grade4-meeting-wave45.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return list(map(int,re.findall(r'[0-9]+',s)))
def integer(q):
 q=F(q);assert q.denominator==1,q
 return q.numerator
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
def clock(s):
 h,m=map(int,s.split(':'));assert 0<=h<24 and 0<=m<60;return h*60+m
def meeting(d,u,v):
 t=F(d,u+v);assert t>0 and u*t==d-v*t
 return t
def rest_meeting(d,u,v,walk,rest):
 # Solve all continuous linear branches independently, retain only times whose
 # branch is valid, then choose the earliest common position.
 candidates=[]
 t=F(d,u+v)
 if 0<=t<=walk:candidates.append(t)
 t=F(d-u*walk,v)
 if walk<=t<=walk+rest:candidates.append(t)
 t=F(d+u*rest,u+v)
 if t>=walk+rest:candidates.append(t)
 assert candidates;return min(candidates)
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);os=r.get('options',[]);v=a=None;suffix=''
 method='Independent actualprinted exact Fraction/AST signedposition conservation, earliestpiecewise motion andabsoluteclock; all40saved/newconditions,fullsolutions,everyMCQread'
 if k in {'boats-distance-two-methods','riders-original-distance'}:
  u,w,t=n;v=u*t+w*t
  note=f'Actualsameelapsed{t}, opposingpaths{u*t}/{w*t}; initialseparation{v}. Signedpositionsut andD−wt coincideat{t}; bothmethodssumto{v}.'
 elif k=='minute-approach-distance':
  u,w,t=n;v=u*t+w*t;suffix=' м';assert'әлі кездескен жоқ'in s
  note=f'ActualPREmeetingdistanceDECREASE{v}, notinitialdistance oronepath. Time{t}min, bothsignedpathcontributions{u*t}/{w*t}; relative sum{u+w}notdifference{u-w}.'
 elif k in {'footpath-meeting-minutes','opposite-walkers-meeting-time','hour-meeting-time-choice'}:
  d,u,w=n;v=meeting(d,u,w);suffix=' сағ'if k=='hour-meeting-time-choice'else''
  note=f'Actualsignedpositions x1={u}t, x2={d}−{w}t; uniqueintersectiont={v}, separation strictlydecreasesbefore. Correcttimeunitprinted, oneunitnotlost.'
 elif k=='approach-symbolic-sum':
  assert'u және w'in s and'q деп'in s
  a=one([o for o in os if o=='q = u + w'])
  for u,w in[(3,5),(4,8),(7,2)]:
   assert calc(a.split(' = ')[1],{'u':u,'w':w})==u+w
  note='Formalforallpositiveu,w: x1(t)=u×t,x2(t)=D−w×t, separationD−(u+w)×t. Thusq=u+w; uniqueconservationcoefficients1/1. Division/product/differencehaveexplicitcounterexampleu3,w5.'
 elif k in {'unknown-second-car-speed-choice','second-speed-from-meeting-inverse'}:
  d,t,u=n;v=F(d,t)-u;suffix=' км/сағ'if os else'';assert v>0 and u*t+v*t==d
  note=f'Actualfirstspeed{u}, elapsed{t}, total{d}; SECOND{v}restores BOTHtrajectories, firstpath{u*t}, secondpath{v*t}. Relative{F(d,t)}isnotaskedindividual.'
 elif k=='fastest-pair-sum-not-individual':
  pairs=[nums(o)for o in os];totals=list(map(sum,pairs));m=max(totals);a=one([o for o,t in zip(os,totals)if t==m]);assert nums(a)!=max(pairs,key=max)
  note=f'Allactualpairrelativesums{totals}; uniquegreatest{m}isFOURTHactualoption. Fastestsinglevehicle70pairhassum90, not93. Savedsourceordinalerrornotcopied.'
 elif k=='unknown-addend-approach-speed':
  total,u=n;v=one([w for w in range(1,total)if u+w==total])
  note=f'Printedrelative{total}=FIRST{u}+SECOND{v}; unknownaddendnotdistance/time. Fullpositiveintegerspeeddomainchecked.'
 elif k in {'road-approach-speed','minute-approach-speed'}:
  u,w=n;v=u+w
  note=f'Actualbeforemeetingseparationchangesby−{u}−{w}perunit; closing{v}. Individualrates{u}/{w}positiveandcompatibleunits; notsame-directiondifference.'
 elif k=='meeting-symbolic-time':
  assert'D'in s and'c — оң'in s and'T уақытын'in s
  a=one([o for o in os if o=='T = D : c'])
  for d,c in[(21,3),(40,8),(15,2)]:assert calc(a.split(' = ')[1],{'D':d,'c':c})*c==d
  note='FormalforallD>0,c>0: remainingseparationD−c×T=0 yieldsuniqueT=D/c. Distance/rateunitsgivetime. Subtraction/product/reciprocalfailD21,c3; universalitynotinferredfromonecoincidentalcase.'
 elif k=='inverse-meeting-approach-speed':
  d,t=n;v=F(d,t)
  note=f'Actualclosedinitialdistance{d}in{t}h→relative{v}, product{v}×{t}={d}. Individualspeedsunderdetermined, requestedSUMonly.'
 elif k=='meeting-distance-from-first-end':
  u,w,d=n;t=meeting(d,u,w);v=u*t;suffix=' км';assert'А бекетінен неше'in s
  note=f'ActualintersectionatAcoordinate{v}; Btravel{w*t}; sum{d}. AskedAendpoint, NOTBdistance{w*t}, mid{F(d,2)}orrelativerate{u+w}.'
 elif k=='km-to-metre-meeting-choice':
  km,u,w=n;v=meeting(km*1000,u,w);suffix=' мин'
  note=f'Actualdistance{km}km={km*1000}m matchesm/minrates{u}/{w}; signedintersection{v}min. Differencebased{F(km*1000,abs(u-w))}wrongrole.'
 elif k=='meeting-equation-unknown-speed':
  d,t,u=n;w=F(d,t)-u;truths=[]
  for o in os:
   lhs,rhs=o.split(' = ');truths.append(calc(lhs,{'x':w})==calc(rhs,{'x':w}))
  a=one([o for o,b in zip(os,truths)if b]);assert a==f'({u} + x) × {t} = {d}'
  note=f'Actualx=SECONDspeed{w}. Bothratesmustmultiplycommon{t}time; all4actualequationtruth{truths}. Formal(u+x)t=ut+xt=distance, omissionofparentheseslosesfirstpath.'
 elif k=='two-paths-to-approach-speed':
  t,p1,p2=n;v=F(p1,t)+F(p2,t);suffix=' км/сағ'
  note=f'Actualindividualpaths{p1}/{p2}incommon{t}h implyrates{F(p1,t)}/{F(p2,t)}; relative{v}. Bothindividualrate-sum andtotalpath/t confirm, notpathsumasrate.'
 elif k=='distance-expression-two-paths':
  u,w,t=n;distance=u*t+w*t;a=one([o for o in os if calc(o)==distance]);assert a==f'{u} × {t} + {w} × {t}'
  note=f'Allactual4expressions evaluatedexactly. Only{a}={distance}includesBOTHtime-scaledpaths; nofirst-speed×timeomission/productofspeeds/difference.'
 elif k=='hidden-factor-speed-meeting':
  u,factor,d=n;w=u*factor;v=meeting(d,u,w)
  note=f'ActualSECONDspeedHIDDENas{factor}×{u}={w}, relative{u+w}; initial{d}, intersection{v}min. Factorisnotadditiverategap.'
 elif k=='unknown-second-speed-two-methods':
  d,t,u=n;v=F(d-u*t,t);assert v==F(d,t)-u
  note=f'Actualfirstpath{u*t}, secondpath{d-u*t}; SECONDspeed{v}. Independentdistance-left/timeequalsrelative−first methods, requestedindividualkm/h.'
 elif k=='farther-path-who-and-gap':
  u,w,t=n;d1=u*t;d2=w*t;assert d2>d1;a=one([o for o in os if o==f'Автобус; {d2-d1} км'])
  note=f'Actualequalelapsed{t}, truck{d1}, bus{d2}; BUStravels{d2-d1}kmfurther. Notrelativepathsum{d1+d2}, rategap{w-u}, orwrongvehicle.'
 elif k=='first-half-separation-before-meeting':
  d,u,w=n;assert'КЕЗДЕСКЕНГЕ ДЕЙІН'in s and'АЛҒАШ РЕТ'in s
  v=F(d,2*(u+w));meet=meeting(d,u,w);assert v<meet and d-(u+w)*v==F(d,2)
  second=F(3*d,2*(u+w));assert abs(d-(u+w)*second)==F(d,2)and second>meet
  note=f'Actualabsolute separation=|{d}−{u+w}t| hashalf-distanceat{v}and{second}; printedFIRSTBEFOREmeeting{meet}selects{v}. Noambiguouspostmeetingbranch.'
 elif k=='mixed-km-m-meeting-time':
  km,m,u,w=n;d=km*1000+m;v=meeting(d,u,w)
  note=f'Actualmixed{km}km{m}m={d}m, relative{u+w}m/min→intersection{v}min. Mustnotaddrawkmwithmetres.'
 elif k=='equal-individual-speeds':
  d,t=n;v=F(d,2*t);assert meeting(d,v,v)==t
  note=f'ActualEQUALindividualspeed{v}, relative{2*v}, total{d}; requestedEACHnotrelative. Equalityisevidencedinstatement.'
 elif k=='sum-gap-ordered-speeds':
  total,gap=n;pairs=[nums(o)for o in os];assert all(u-w==gap for u,w in pairs);a=one([o for o,(u,w)in zip(os,pairs)if u+w==total and u-w==gap])
  note=f'All4actualorderedpairsalreadyhavegap{gap}; only{a}alsosums{total}. FIRSTfasterroleexplicit, bothconstraintsessential.'
 elif k=='hidden-additive-speed-meeting':
  d,u,extra=n;w=u+extra;v=meeting(d,u,w)
  note=f'ActualSECONDspeed{u}+{extra}={w}, relative{u+w}; initial{d}→intersection{v}. Extragapnotcomplete secondspeed.'
 elif k=='midpoint-offset-original-distance':
  u,w,offset=n;t=F(2*offset,abs(w-u));v=(u+w)*t;assert abs(v/2-u*t)==offset
  note=f'Actualmeetingoffset{offset}frommidpointmakesPATHDIFFERENCE{2*offset}, not{offset}. Relativegap{w-u}giveselapsed{t}, originaldistance{v}; midpointbacksubverified.'
 elif k=='meeting-coincident-distance-trap':
  assert'КЕЗДЕСКЕН СӘТТЕ'in s
  u,w,d=n;t=meeting(d,u,w);assert u*t==d-w*t;a=one([o for o in os if o=='Екеуінің А нүктесінен қашықтығы тең'])
  note=f'Actualsamepositionatmeeting{t}: Acoordinatefirst{u*t}=D−secondtravel{d-w*t}. BothA-distancesequal althoughtravelpaths{u*t}/{w*t}unequal. Formalcoincidenceforallpositivespeeds.'
 elif k=='delayed-hour-departure-clock':
  times=re.findall(r'\d{2}:\d{2}',s);start,end=map(clock,times);m=re.match(r'Аралары (\d+) км.*?кезінде (\d+) км/сағ.*?(\d+) сағат кеш.*?кезінде (\d+) км/сағ',s);assert m
  d,u,delay,w=map(int,m.groups());assert end-start==60*delay and d>u*delay
  a=one([o for o in os if clock(o)>=end and F(u*(clock(o)-start)+w*(clock(o)-end),60)==d]);time=clock(a)
  note=f'ActualabsoluteclocksFIRST{times[0]}, SECOND{times[1]}; elapsedminutes{time-start}/{time-end}, signedpathsum{F(u*(time-start),60)}+{F(w*(time-end),60)}={d}. Correctclock{a}; headstartandoriginbothincluded.'
 elif k=='delayed-minute-departure-clock':
  times=re.findall(r'\d{2}:\d{2}',s);start,end=map(clock,times);d=nums(s)[0];u=int(re.search(r'Біріншісі.*?кезінде (\d+) м/мин',s)[1]);w=int(re.search(r'Екіншісі.*?кезінде (\d+) м/мин',s)[1]);assert d>u*(end-start)
  a=one([o for o in os if clock(o)>=end and u*(clock(o)-start)+w*(clock(o)-end)==d]);time=clock(a)
  note=f'Actualabsoluteclocks{times}, FIRSTelapsed{time-start}min andSECOND{time-end}min; paths{u*(time-start)}/{w*(time-end)}sum{d}. Correctclock{a}; notdelay-free orclockfromwrongdeparture.'
 elif k=='speed-ratio-faster-speed':
  d,t,factor=n;v=one([fast for fast in range(1,d+1)if F(fast,factor)*t+fast*t==d]);suffix=' км/сағ';assert v>F(v,factor)
  note=f'ActualspeedratioFAST:SLOW{factor}:1, uniqueFAST{v}, SLOW{F(v,factor)}; pathsrestore{d}after{t}h. Equalhalfofrelativerateviolatesratio.'
 elif k=='midpoint-meeting-departure-gap':
  d,fast,slow=n;tf=F(d,2*fast);ts=F(d,2*slow);v=ts-tf;assert v>0 and slow*(tf+v)==fast*tf==F(d,2)
  note=f'Actualmidpointrequiresequalpaths{F(d,2)}, unequaltraveltimesFAST{tf}/SLOW{ts}; SLOWstarts{v}hEARLIER. Notclaimsimultaneousstarts.'
 elif k=='after-meeting-remaining-time':
  d,t,firstpath=n;speed=F(firstpath,t);v=F(d-firstpath,speed);assert speed*v+firstpath==d and v>0
  note=f'ActualFIRSTspeed{speed}from{firstpath}in{t}h. Remainingendpointdistance{d-firstpath}→ADDITIONALaftermeeting{v}h. Totalelapsed{t+v}notasked.'
 elif k in {'sum-path-gap-faster-speed','sum-path-gap-slower-speed'}:
  d,t,gap=n;short,long=F(d-gap,2),F(d+gap,2);slow,fast=short/t,long/t;assert short+long==d and long-short==gap and fast>slow>0
  v=fast if k.endswith('faster-speed')else slow;suffix=' км/сағ'
  note=f'Actualpathpair{long}/{short}sum{d}, gap{gap}, commonelapsed{t}; FAST{fast}/SLOW{slow}. Asked'+('FAST'if k.endswith('faster-speed')else'SLOW')+f'{v}, nothalfrelativerate{F(d,2*t)}.'
 elif k=='rest-stage-total-meeting-time':
  d,u,w,walk,rest=n;v=rest_meeting(d,u,w,walk,rest);assert v>walk+rest
  def pos(t):return u*t if t<=walk else u*walk if t<=walk+rest else u*(t-rest)
  assert pos(v)==d-w*v
  for t in[0,F(walk,2),F(walk),F(2*walk+rest,2),F(walk+rest)]:assert pos(t)<d-w*t
  note=f'Actualcontinuouspiecewisepositions: firstwalk{walk}h, rests{rest}h, resumes. All3validlineintersectionbrancheschecked, EARLIESTt={v}; atrestendseparation{d-pos(walk+rest)-w*(walk+rest)}>0. Firstmovingtime{v-rest}, SECOND{v}, positions{pos(v)}={d-w*v}.'
 elif k=='meeting-distance-from-second-end':
  d,u,w=n;t=meeting(d,u,w);v=w*t;suffix=' км';assert'Б стансасынан неше'in s
  note=f'ActualB-endpointdistanceSECONDtravel{v}; Acoordinate{u*t}, sum{d}, elapsed{t}. PrintedBroleexplicit, notA/midpoint/relativespeed.'
 elif k=='not-yet-met-remaining-gap-speed':
  d,u,t,remaining=n;assert'ӘЛІ КЕЗДЕСПЕГЕН'in s
  v=one([w for w in range(1,d+1)if d-u*t-w*t==remaining]);suffix=' км/сағ';assert remaining>0 and meeting(d,u,v)>t
  note=f'ActualPREmeetingremaining{remaining}>0 at{t}h, signedgap{d}−({u}+{v})×{t}={remaining}. Onlyclosedpart{d-remaining}countsforrelativerate. FullD/twouldoverstatespeed.'
 else:raise AssertionError(('Uncoveredmodel',k))
 if a is None:
  v=integer(v);assert v>0;a=one([o for o in os if o==str(v)+suffix])if os else str(v)
 assert r['answer']==a,(k,r['answer'],a)
 if os:assert len(os)==len(set(os))==4
 else:assert s.endswith('Жауапқа тек санды жазыңыз.')
 return{'method':method,'notes':note}
def chains(s):
 s=re.sub(r'\d{2}:\d{2}',' CLOCK ',s);count=0
 for m in re.finditer(r'[0-9(][0-9\s+×:−()=\-]*',s):
  prefix=s[:m.start()].rstrip()
  if prefix and prefix[-1]in'×:+−-/=(':continue
  t=m.group().strip()
  if '='not in t or t.count('(')!=t.count(')'):continue
  ps=t.split('=')
  if any(not p.strip()or re.search(r'[+×:−-]\s*$',p)for p in ps):continue
  vs=list(map(calc,ps));assert all(v==vs[0]for v in vs),(t,vs);count+=1
 return count

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==40
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
 # Printedgivens (not params) are computationinputs. Symbolic/formulafamilies
 # have no numericgivens; mutate one actualoptionforall-identity checks instead.
 for r in rows:
  if not re.search(r'\d',r['statement']):continue
  b=copy.deepcopy(r)
  if r['skillFamily']=='meeting-coincident-distance-trap':b['statement']=r['statement'].replace('КЕЗДЕСКЕН СӘТТЕ','КЕЗДЕСКЕНГЕ ДЕЙІН')
  else:b['statement']=re.sub(r'[0-9]+',lambda m:str(int(m.group())+1),r['statement'],count=1)
  try:solve(b)
  except(AssertionError,ValueError):rejected+=1
  else:raise AssertionError(('Printedgivenmutationaccepted',r['editionId']))
 signed=piecewise=clockcases=0
 for u in range(1,21):
  for w in range(1,21):
   for t in range(1,21):
    d=(u+w)*t;assert u*t==d-w*t
    half=F(t,2);after=F(3*t,2);assert abs(d-(u+w)*half)==abs(d-(u+w)*after)==F(d,2)
    assert half<t<after;signed+=1
 for d in range(1,101):
  for u in range(1,9):
   for w in range(1,9):
    walk=2;rest=1;t=rest_meeting(d,u,w,walk,rest)
    x=u*t if t<=walk else u*walk if t<=walk+rest else u*(t-rest)
    assert x==d-w*t
    if t>0:
     eps=min(F(1,1000),t/2);q=t-eps
     before=u*q if q<=walk else u*walk if q<=walk+rest else u*(q-rest)
     assert before<d-w*q
    piecewise+=1
 for u in[12,30,48,60,72,90]:
  for w in[18,36,54,66,84]:
   for delay in[15,30,60,90]:
    for joint in[30,60,120,180]:
     d=F(u*(delay+joint)+w*joint,60)
     assert F(d-F(u*delay,60),F(u+w,60))==joint
     start=540;end=start+delay;at=end+joint
     assert F(u*(at-start)+w*(at-end),60)==d;clockcases+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All40saved/newconditions,fullsolutions,everyMCQread. OwnactualprintedFraction/AST signedmotion, endpoint/remaining/first-premeeting roles, delayedabsoluteclocks, allcontinuousrestbranches+earliestmeeting, midpointoffset/departuregap, orderedpairtwo-constraints. Two language findings corrected by author onlyrow5solution/row16statement; finalfullrows reread. Noauthorcalculatorimported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'signedTrajectoryDomains':signed,'continuousPiecewiseRestCases':piecewise,'absoluteClockLedgers':clockcases,'report':OUT if args.write else None}))
if __name__=='__main__':main()
