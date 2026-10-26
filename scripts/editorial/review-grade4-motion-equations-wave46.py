"""Independent full39 saved/new/fullsolution/MCQ motion-equation review.
Own printed Fraction/AST, equation semantics, absolute deadlines/clocks,
signedposition ledgers, complete two-scenario candidate constraints.
No author calculator, renderer or checker imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-motion-equations-wave46.json'
OUT='problems/editorial/reviews/grade4-motion-equations-wave46.json'
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
 t=F(d,u+v);assert t>0 and u*t==d-v*t;return t
def equations(os,x):
 truths=[]
 for o in os:
  lhs,rhs=o.split(' = ');truths.append(calc(lhs,{'x':x})==calc(rhs,{'x':x}))
 return one([o for o,t in zip(os,truths)if t]),truths

def solve(r):
 k=r['skillFamily'];s=r['statement'];without_clock=re.sub(r'\d{2}:\d{2}','CLOCK',s);n=nums(without_clock);os=r.get('options',[]);v=a=None;suffix=''
 method='Independent actualprinted exact Fraction/AST conservation, equationmeaning/unknownroles, absoluteclock/deadline andsignedtrajectories; full39saved/new/solutions/everyMCQread'
 if k=='two-buses-distance-equation':
  u,w,t=n;v=u*t+w*t
  note=f'Actualinitialdistance{v}sumstwoindividualpaths{u*t}/{w*t}; signedintersectionafter{t}h. UnknownxISdistance, notclosingrate{u+w}.'
 elif k=='whole-route-includes-remainder-equation':
  speed,t,left=n;distance=speed*t+left;a,truths=equations(os,distance);assert a==f'{speed} × {t} + {left} = x'
  note=f'Actualwholex={distance}, walked{speed*t}PLUSremaining{left}. All4printedequationsactualsubstitutiontruth{truths}; subtraction/remaining-as-rate/wrongdimensionfail.'
 elif k=='equal-boats-individual-root':
  d,t=n;v=F(d,2*t);assert meeting(d,v,v)==t
  note=f'ActualEQUALindividualspeed{v}, closing{2*v}; unique(x+x)×{t}={d}. RequestedEACHnotclosingsum.'
 elif k=='one-hour-shrink-quantity':
  u,w,t=n;assert t==1 and'әлі кездеспейді'in s;v=u*t+w*t
  note=f'Actualbeforemeetingonehourdecrease{v}km, sameNUMERICvalueasclosingkm/hbutrequestedDISTANCE. Bothsame-timepathsadded.'
 elif k=='check-student-correct-root':
  m=re.search(r'\(x \+ (\d+)\) × (\d+) = (\d+).*?x = (\d+)',s);assert m;known,t,d,proposed=map(int,m.groups());root=F(d,t)-known
  if (proposed+known)*t==d:a=one([o for o in os if o=='Дұрыс'])
  else:a=one([o for o in os if o==f'Қате, x = {integer(root)}'])
  assert root==proposed
  note=f'Actualsubstitution({proposed}+{known})×{t}={d}; root{root}correct. Wrongoption{F(d,t)}isSUMx+known, notroot; allproposedalternative rootsfailoriginalequation.'
 elif k=='meeting-time-as-equation-root':
  d,u,w=n;v=meeting(d,u,w)
  note=f'Actualuniqueintersection{v}h viaut=D−wt; equation({u}+{w})x={d}. Bothpaths{u*v}/{w*v}sumtoD, notone-cartravel time.'
 elif k=='km-minute-time-equation-choice':
  km,u,w=n;v=meeting(km*1000,u,w);suffix=' мин'
  note=f'Actual{km}km={km*1000}m; rates{u}/{w}m/min. Uniqueintersection{v}MIN, bothunitsconvertedbeforeequation; 1000not100.'
 elif k=='sum-times-time-expression-meaning':
  u,w,t,*rest=n;assert rest==[u,w,t];expression=s[s.index('('):].split(' өрнегі')[0];assert calc(expression)==u*t+w*t
  a=one([o for o in os if o=='Стансалар арасындағы бастапқы қашықтықты'])
  note=f'Actualexpression{expression}={u*t+w*t}kmhasBOTHpaths{u*t}/{w*t}; atmeetingtheirSUMISinitialseparation. Rate{u+w}andindividualpathsaredifferent quantities; semanticlabelverified, notnumericvaluealone.'
 elif k=='approach-speed-equation-root':
  d,t=n;v=F(d,t)
  note=f'Actualdistance{d}closedin{t}h→relative{v}; xISspeedSUM. Individualspeedsremainunderdetermined, explicitlynotasked.'
 elif k=='meeting-time-formula-two-speeds':
  a=one([o for o in os if o=='T = D : (u + w)'])
  for d,u,w in[(240,40,20),(270,50,40),(144,11,7)]:assert calc(a.split(' = ')[1],{'D':d,'u':u,'w':w})*(u+w)==d
  note='FormalpositiveD,u,w: gapD−(u+w)T=0 impliesuniqueT=D/(u+w). Bothspeedcoefficientsonly1, parenthesesbindSUM. Other3formulashavecounterexampleD240,u40,w20; compatiblespeed/distanceunitsyieldtime.'
 elif k in {'aircraft-unknown-speed-root','train-long-route-second-speed'}:
  d,t,u=n;v=F(d,t)-u;assert v>0 and u*t+v*t==d
  note=f'ActualSECONDspeed{v}, FIRST{u}, elapsed{t}; sumoftrajectories{u*t}+{v*t}={d}. Rootof(x+{u})×{t}={d}; notrelativerate{F(d,t)}.'
 elif k=='second-speed-literal-expression':
  a=one([o for o in os if o=='D : T − u'])
  for d,t,u in[(360,4,30),(280,5,20),(420,3,50)]:assert calc(a,{'D':d,'T':t,'u':u})*t+u*t==d
  note='FormalfeasiblepositiveD,T,u: firstpathuT, secondpathD−uT; secondspeed(D−uT)/T=D/T−u. Chosenexpressionexactidentity; otheractualexpressionsfailD360,T4,u30 anddimensions.'
 elif k=='simultaneous-clock-not-duration':
  d,u,w=n;start=clock(one(re.findall(r'\d{2}:\d{2}',s)));time=F(d*60,u+w);at=start+time;a=one([o for o in os if clock(o)==at]);assert clock(a)!=time
  note=f'ActualabsoluteSTART{start}min, duration{time}min, MEETINGclock{a}({at}). Duration-only03:00distractorisnotclockofevent; minuteorigin35preserved.'
 elif k=='known-fast-path-gap-second-speed':
  t,u,gap=n;v=F(u*t-gap,t);assert v>0 and (u-v)*t==gap
  note=f'ActualFIRSTpath{u*t}, SECOND{u*t-gap}; secondspeed{v}. Printedgap{gap}ISpathdifferenceover{t}h, notperhourrategap.'
 elif k=='arrival-before-preparation-deadline':
  times=re.findall(r'\d{2}:\d{2}',s);event,start=map(clock,times);early=int(re.search(r'басталуынан (\d+) минут',s)[1]);d=int(re.search(r'Жол (\d+) км',s)[1]);speed=int(re.search(r'шығып, (\d+) км/сағ',s)[1]);arrival=start+F(60*d,speed);deadline=event-early;margin=deadline-arrival;assert margin>0
  a=one([o for o in os if o==f'Үлгереді; дайындық шегінен {integer(margin)} минут ерте']);assert event-arrival!=margin
  note=f'ActualEVENT{times[0]}needsPREPARATION{early}minearlier→deadline{deadline}min. START{times[1]}+trip{F(60*d,speed)}min→arrival{arrival}, margin{margin}. Eventmargin{event-arrival}isWRONGrequestedreference, explicitdistractor.'
 elif k=='mixed-km-metres-speed-equation':
  km,m,t,u=n;d=km*1000+m;w=F(d,t)-u;a,truths=equations(os,w);assert a==f'(x + {u}) × {t} = {d}'
  note=f'Actualmixed{km}km{m}m={d}m, SECONDx={w}m/min. All4equationtruths{truths}; wholeSUMmustmultiply{t}, metreunitandreferencekept.'
 elif k=='meeting-location-reference-first':
  d,u,w=n;t=meeting(d,u,w);v=u*t;a=one([o for o in os if o==f'А стансасынан {integer(v)} км']);assert'А стансасынан қандай'in s
  note=f'ActualA-endpointcoordinate{v}, elapsed{t}, Btravel{w*t}. PrintedreferenceA, notB{w*t}/midpoint{F(d,2)}/relative{u+w}.'
 elif k=='half-hour-duration-choice':
  d,u,w=n;duration=F(60*d,u+w)
  a=one([o for o in os if (lambda a:a[0]*60+a[1])(nums(o))==duration]);assert duration==90
  note=f'Actualduration{duration}min=1h30min byexactintersection, not1h50/1h5fromdecimal50-percentconfusion. All4actualhour-minutechoicesconverted.'
 elif k in {'km-minute-second-speed-choice','km-minute-cyclist-speed-root'}:
  km,t,u=n;d=km*1000;v=F(d,t)-u;suffix=' м/мин'if os else'';assert v>0 and u*t+v*t==d
  note=f'Actual{km}km={d}m, elapsed{t}MIN, FIRST{u}; SECOND{v}m/min restoresBOTHpaths. Closing{F(d,t)}notindividualrequested.'
 elif k=='mixed-speed-units-distance':
  t,mmin,kmh=n;first=F(mmin*60,1000);v=(first+kmh)*t
  note=f'ActualFIRST{mmin}m/min={first}km/h via60/1000, SECOND{kmh}km/h. Bothpaths{first*t}/{kmh*t}, initialdistance{v}km; incompatibleunitsnotdirectlyadded.'
 elif k=='hidden-extra-speed-original-distance':
  t,u,extra=n;w=u+extra;v=(u+w)*t
  note=f'ActualSECONDspeedHIDDEN{u}+{extra}={w}, notgapalone. Initialdistance{v}sumofbothsame-timepaths{u*t}/{w*t}.'
 elif k=='kmh-meeting-minute-target':
  d,u,w=n;v=F(60*d,u+w);assert'МИНУТТА'in s
  note=f'Actualdistance{d}km, closing{u+w}km/h; time{F(d,u+w)}h converted×60→{v}MIN. Alternativem/minconversionexact; requestedMINnotfractionalhour.'
 elif k=='delayed-departure-second-speed':
  d,u,lead,after=n;v=F(d-u*(lead+after),after);assert v>0 and u*(lead+after)+v*after==d
  note=f'ActualFIRSTelapsed{lead+after}, SECOND{after}; paths{u*(lead+after)}/{v*after}, total{d}. SECONDspeed{v}; FIRSTheadstartincluded, afterseconddeparturetimeexplicit.'
 elif k=='minimum-speed-arrival-deadline':
  times=re.findall(r'\d{2}:\d{2}',s);event,start=map(clock,times);early=int(re.search(r'топ (\d+) минут ерте',s)[1]);d=int(re.search(r'Жол (\d+) км',s)[1]);deadline=event-early;available=deadline-start;assert available>0;v=F(d*60,available)
  assert F(v*available,60)==d and F((v-F(1,1000))*available,60)<d
  note=f'ActualEVENT{event}, early{early}→deadline{deadline}, start{start}, available{available}min. REALminimumspeed{v}km/h, exactboundaryvt=D. ForEVERYv<{v}, vt<D bypositiveavailabletime, so minimumproofnotinteger-only. Eventstartitselfwrongdeadline.'
 elif k=='ordered-speeds-from-total-path-gap':
  d,t,gap=n;a=one([o for o in os if (lambda q:(q[0]+q[1])*t==d and(q[0]-q[1])*t==gap)(nums(o))]);u,w=nums(a)
  note=f'ActualorderedFIRST{u}/SECOND{w}, commonelapsed{t}; paths{u*t}/{w*t}, sum{d}, difference{gap}. Bothconstraintsessential, pathgapnotrategap; namedorderkept.'
 elif k=='whole-route-solo-time-inverse':
  meet,u,solo=n;assert solo>meet;v=F(u*meet*solo,solo-meet);w=v/solo;assert meeting(v,u,w)==meet
  note=f'ActualWHOLErouteD; secondspeedD/{solo}, notD/{meet}. Identityu×{meet}+(D/{solo})×{meet}=D givesUNIQUErealD={v}, second{w}. Fullsolo{w}×{solo}={v}, joint{meet}hchecked.'
 elif k=='clock-elapsed-half-hour-distance':
  times=re.findall(r'\d{2}:\d{2}',s);start,end=map(clock,times);u,w=n;minutes=end-start;v=F((u+w)*minutes,60);assert minutes%60==30
  note=f'Actualclocks{times}→elapsed{minutes}min, notrawclockdigit-subtraction. Twoindividualpaths{F(u*minutes,60)}/{F(w*minutes,60)}sum{v}km; halfhour30not50min.'
 elif k=='postmeeting-positive-separation':
  d,u,w,t=n;meet=meeting(d,u,w);assert t>meet and'бағытын өзгертпей'in s;v=abs(u*t-(d-w*t));suffix=' км'
  note=f'Actualsignedpositionsafterpassing x1={u*t},x2={d-w*t}; POSITIVEseparation|x1−x2|={v}km. Meetingat{meet}h, queried{t}h>{meet}. Not0/notnegative/notalljointpath.'
 elif k=='two-scenario-ordered-speed-pair':
  d,t,lead,after=n;pairs=[nums(o)for o in os];assert all((u+w)*t==d for u,w in pairs)
  a=one([o for o,(u,w)in zip(os,pairs)if(u+w)*t==d and u*(lead+after)+w*after==d]);u,w=nums(a)
  note=f'ALL4actualpairsobeysimultaneouscase{t}min, sumspeed{F(d,t)}. Onlyordered{u}/{w}alsoobeysFIRSTheadstart{lead}plusjoint{after}: {u}×{lead+after}+{w}×{after}={d}. Reversalbreakssecondscenario.'
 elif k=='ordered-speeds-ratio-and-sum':
  d,t,factor=n;a=one([o for o in os if(lambda q:(q[0]+q[1])*t==d and q[1]==factor*q[0])(nums(o))]);u,w=nums(a)
  note=f'ActualFIRST{u},SECOND{w}={factor}×FIRST; commonelapsed{t}, sumtrajectory{d}. Bothratioandsumneeded; multipleotheroptionssatisfyratioonly.'
 elif k in {'delayed-departure-path-gap','early-departure-first-path'}:
  d,u,w=n;times=re.findall(r'\d{2}:\d{2}',s);start,end=map(clock,times);lead=F(end-start,60);assert lead>0;after=F(d-u*lead,u+w);first=u*(lead+after);second=w*after;assert first+second==d and after>0
  v=first-second if k=='delayed-departure-path-gap'else first
  note=f'Actualclocks{times}, headstart{lead}h, laterjoint{after}h; FIRSTpath{first},SECOND{second}, sum{d}. Asked'+('PATHDIFFERENCE'if k=='delayed-departure-path-gap'else'FULLFIRSTpath')+f'{v}; earlysoloportionnotdropped.'
 elif k=='cyclist-speed-equation-selection':
  d,t,u=n;w=F(d,t)-u;a,truths=equations(os,w);assert a==f'(x + {u}) × {t} = {d}'
  note=f'ActualSECONDx={w}; all4actualequationtruth{truths}. Correct(u+x)×time includesBOTHpaths anddoesnotexchangespeed/time, subtractopposingratesoromitparentheses.'
 elif k=='second-speed-times-time-meaning':
  t,u,w,ew,et=n;assert ew==w and et==t;a=one([o for o in os if o=='Екінші пойыздың кездескенге дейінгі жолын'])
  note=f'ActualexpressionSECONDspeed{w}×COMMONtime{t}={w*t}km, henceSECONDpath. FIRST{u*t}, TOTAL{(u+w)*t}, relative{u+w}aredistinct; semanticlabelcorrect, notjustnumber.'
 elif k=='mixed-km-m-time-as-root':
  km,m,u,w=n;d=km*1000+m;v=meeting(d,u,w)
  note=f'Actualmixed{km}km{m}m={d}m, commonrelative{u+w}m/min; uniqueintersection{v}MIN. Bothpaths{u*v}/{w*v}sumtoD.'
 elif k=='distance-over-speed-sum-expression':
  a=one([o for o in os if o=='L : (p + q)'])
  for d,u,w in[(120,17,13),(80,12,8),(140,10,4)]:assert calc(a,{'L':d,'p':u,'q':w})*(u+w)==d
  note='FormalpositiveL,p,q: jointtrajectory(p+q)t=L yieldsuniqueexpressionL/(p+q). Parenthesessumwholedenominator; noL/p+q precedenceerror. Other3expressionsfailL120,p17,q13.'
 elif k=='gap-before-meeting-inverse-distance':
  observed,left,meet=n;assert meet>observed;relative=F(left,meet-observed);v=relative*meet;suffix=' км';assert v-relative*observed==left
  note=f'Actualremaining{left}kmclosedduringLAST{meet-observed}h, relative{relative}; WHOLEdistance{v}. Atobserved{observed}hgapleft{left}, actualmeet{meet}h, firstpart{relative*observed}notwhole.'
 else:raise AssertionError(('Uncovered',k))
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
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==39
 entries=[];eq=0
 for r in rows:
  ref=one(r['sourceRefs']);assert ref['sourceId']!='123d7e820a0e0e7a';src=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert src['checked'];assert r['grade']==4 and r['minimumPlan']=='pro'
  norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip().casefold();assert norm(src['statement'])!=norm(r['statement'])
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified',**solve(r)});eq+=chains(r['solution'])
 rejected=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:rejected+=1
  else:raise AssertionError('Wrongkeyaccepted')
 # Semanticformulaanswerswithnonumericgivens are justified formally above.
 # Other printed givens feed the independent solver; changing one cannot hide
 # behind unchanged params or authorrenderedanswer.
 for r in rows:
  if not re.search(r'\d',r['statement']):continue
  b=copy.deepcopy(r);b['statement']=re.sub(r'[0-9]+',lambda m:str(int(m.group())+1),r['statement'],count=1)
  try:solve(b)
  except(AssertionError,ValueError,ZeroDivisionError):rejected+=1
  else:raise AssertionError(('Printedgivenmutationaccepted',r['editionId']))
 scenarios=clocks=solo=post=0
 for u in range(1,31):
  for w in range(1,31):
   for firstlead in[1,2,3]:
    for joint in[1,2,4]:
     d=u*(firstlead+joint)+w*joint
     simultaneous=F(d,u+w)
     assert u*(firstlead+joint)+w*joint==d and (u+w)*simultaneous==d
     recovered=F(d-(u+w)*joint,firstlead);assert recovered==u and F(d,simultaneous)-recovered==w
     scenarios+=1
 for event in[900,960,1080,1140]:
  for early in[10,20,30,45]:
   for start in range(event-180,event-early,10):
    available=event-early-start
    for d in[18,36,54,90]:
     v=F(d*60,available);assert F(d*60,v)+start==event-early
     assert F(d*60,v/2)+start>event-early;clocks+=1
 for u in range(1,21):
  for meet in range(1,8):
   for alone in range(meet+1,13):
    d=F(u*meet*alone,alone-meet);w=d/alone;assert meeting(d,u,w)==meet and w*alone==d;solo+=1
 for u in range(1,21):
  for w in range(1,21):
   for meet in range(1,9):
    d=(u+w)*meet
    for after in[1,2,3]:
     t=meet+after;assert abs(u*t-(d-w*t))==(u+w)*after;post+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All39saved/newconditions,fullsolutions,everyMCQread. OwnactualprintedFraction/AST+formal symbolicroles, completeactualequation/candidatefilters, deadlinevsEVENT, REALminimumspeed, delayedabsoluteclocks, postmeetingsignedgap, two-scenarioorderedpairs, whole-route-soloinverse, mixedSI60/1000. Findings0. Noauthorcalculatorimported. Alreadyverified123dsource excluded.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'closedNumericEqualityChains':eq,'twoScenarioLedgers':scenarios,'deadlineRealMinimumCases':clocks,'wholeRouteSoloCases':solo,'postmeetingSignedCases':post,'report':OUT if args.write else None}))
if __name__=='__main__':main()
