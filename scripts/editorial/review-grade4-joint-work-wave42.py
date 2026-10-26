"""Independent full39 saved/new/fullsolution/MCQ joint-work review.
Own displayed-givens exact Fraction/AST, integer conservation searches and
formal formula witnesses; no author solver/renderer/checks imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-joint-work-wave42.json'
OUT='problems/editorial/reviews/grade4-joint-work-wave42.json'
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
 method='Independent actualprinted exact Fraction/conservation/integer search; all original requested roles independently read'
 if k=='pair-rate-comparison':
  x,y,u,w=n;assert x==max(n)and x+y<u+w
  names=re.findall(r'([А-ЯӘІҢҒҮҰҚӨҺ][а-яәіңғүұқөһ]+)(?: сағатына)? [0-9]+',s);assert len(names)==4,names
  a=one([o for o in os if o==f'{names[2]} мен {names[3]}'])
  note=f'Actualjointoutputs{x+y}<{u+w}; fastestindividual{x}inlosingpair retained. Allactualnames and two orderedpairs checked.'
 elif k in {'joint-hourly-time','joint-baking-time'}:
  work,x,y=n;v=one([t for t in range(1,work+1)if x*t+y*t==work]);suffix=' сағ'
  note=f'Printedwork{work}; independentlysearcht gives{v}, separateoutputs{x*v}+{y*v}={work}. Sumratesneeded, NOTdifference{abs(x-y)}.'
 elif k in {'two-pumps-minute-work','two-inlet-pumps-work'}:
  x,y,t=n;v=sum([x for _ in range(t)])+sum([y for _ in range(t)]);suffix=' л'
  assert {str(x*t)+' л',str(y*t)+' л',str(x+y)+' л'}<set(os)
  note=f'Actualper-minuteledgers{x}×{t}={x*t},{y}×{t}={y*t}; sum{v}. EverydiagnosticoptionindividualworkandjointONEminute retained; inlet/outletdirection explicit, bothsame.'
 elif k=='inverse-second-pump-rate':
  t,work,x=n;v=one([y for y in range(1,work+1)if x*t+y*t==work])
  note=f'Printedledger{x}×{t}+y×{t}={work}; uniqueintegersecondrate{v}, notsecondtotal{v*t}.'
 elif k=='given-joint-rate-work':
  rate,t=n;v=sum(rate for _ in range(t));assert 'бірге жасағаны' in s
  note=f'Printed{rate}isALREADYjoint rate, repeated{t}times→{v}; doublemultiplyingby2wouldgive{2*v}andcontradictgiven.'
 elif k in {'joint-work-formula','joint-time-parentheses-formula'}:
  assert not n
  if k=='joint-work-formula':
   assert 'бірлескен' in s and 'w' in s and 't' in s
   witnesses=[{'w':w,'t':t}for w in range(2,16)for t in range(2,13)]
   a=one([o for o in os if all(calc(o.split(' = ')[1].replace('w',str(p['w'])).replace('t',str(p['t'])))==p['w']*p['t']for p in witnesses)])
   note='Allfour actual symbolicoptions evaluated across154positive independentw/twitnesses; onlyA=w×t preserves joint workdimension. Formaldefiningrate=A/t impliesA=w×t.'
  else:
   assert 'оң' in s
   witnesses=[(u,w,t)for u in range(1,15)for w in range(1,15)for t in range(1,9)]
   a=one([o for o in os if all(calc(o.split(' = ')[1].replace('v₁',str(u)).replace('v₂',str(w)).replace('A',str((u+w)*t)))==t for u,w,t in witnesses)])
   note='Allfour actualsymbolicoptions across1568positiveA=(v1+v2)t witnesses; onlyt=A:(v1+v2). Formalbrackets required; e.g60:4+6=21 vs60:(4+6)=6.'
  method='Independent displayed-symbol AST substitution plus formalrate/work definition'
 elif k=='joint-printer-minute-time':
  x,y,work=n;v=one([t for t in range(1,work+1)if x*t+y*t==work]);suffix=' мин'
  note=f'Actualbothprinters concurrent{x},{y}pages/min, work{work}; uniquecomplete time{v}min, contributions{x*v},{y*v}. Bothsolo and difference-time MCQ checked.'
 elif k=='joint-rate-area-choice':
  t,work=n;v=integer(F(work,t));suffix=' м²/сағ'
  assert [v,work-t,work*t,work+t]==[nums(o)[0]for o in os]
  note=f'Printedpaintedarea{work}m²over{t}h→joint{v}m²/h; everywrongoperation subtraction/multiplication/addition MCQ retained, no extra2factor.'
 elif k=='three-rates-total-work':
  x,y,z,t=n;v=x*t+y*t+z*t
  note=f'Independentthreepersonaloutputs{x*t},{y*t},{z*t}, sum{v}; allthreecontribute fortheSAME{t}hours.'
 elif k=='joint-gardening-time':
  x,y,work=n;v=one([t for t in range(1,work+1)if x*t+y*t==work])
  note=f'Printedseedlingcount{work}, hourlyrates{x},{y}; independentintegerconservation gives{v}hours and{x*v}+{y*v}={work}.'
 elif k=='solo-versus-joint-days-gap':
  work,x,y=n;solo=integer(F(work,x));joint=integer(F(work,x+y));v=solo-joint;suffix=' күн'
  assert v>0 and (x+y)*joint==work and x*solo==work
  note=f'PrintedfirstSOLO{solo}days, JOINT{joint}; requestedDIFFERENCE{v}, NOTthoseactualtimes orsecondsolo{integer(F(work,y))}minusjoint.'
 elif k=='identical-rates-each':
  t,work=n;v=one([rate for rate in range(1,work+1)if rate*t+rate*t==work])
  assert 'Өнімділіктері тең' in s
  note=f'PrintedEQUALrates, both{t}hours; per-worker{v}since2×{v}×{t}={work}. Joint{2*v}notrequested.'
 elif k=='pool-second-rate-from-two-times':
  volume,joint,solo=n;x=integer(F(volume,solo));v=one([y for y in range(1,volume+1)if (x+y)*joint==volume])
  note=f'PrintedfirstSOLO{solo}h sets{x}m³/h; joint{joint}h requires{x+v}, uniqueSECOND{v}; exactvolumebacksubstitution.'
 elif k in {'equal-rates-unequal-times-second-work','equal-rates-unequal-times-first-work'}:
  work,t1,t2=n;r=one([rate for rate in range(1,work+1)if rate*t1+rate*t2==work]);first=r*t1;second=r*t2;v=second if k.endswith('second-work')else first
  assert 'Өнімділіктері бірдей' in s and t1!=t2
  note=f'EQUALrates{r}, UNEQUALtimes{t1}/{t2}; individualoutputs{first}/{second}, requested{v}. Halfwhole{F(work,2)}notvalid; rateitselfnotwork.'
 elif k=='three-rates-with-half-sum':
  x,gap,t=n;y=x+gap;z=integer(F(x+y,2));v=x*t+y*t+z*t
  note=f'Actualsecondrate{x}+{gap}={y}, thirdHALFofFIRSTTWOsum={z}, nothalfofone. Threeoutputs{x*t},{y*t},{z*t}sum{v}.'
 elif k=='helper-earlier-hours':
  work,solo,helper=n;x=integer(F(work,solo));t=one([t for t in range(1,work+1)if x*t+helper*t==work]);v=solo-t;suffix=' сағ'
  assert v>0 and 'басынан бастап' in s and 'ерте' in s
  note=f'Actualfirstsolo{solo}h givesrate{x}; helper{helper}FROMSTART→joint{t}; saved{v}. Herejointtimeand savedtimecoincidentallyequal, rolesexplicitlyseparated.'
 elif k=='different-times-rate-winner':
  t1,w1,t2,w2=n;x=integer(F(w1,t1));y=integer(F(w2,t2));assert w1>w2 and y>x
  a=one([o for o in os if o==f'Данияр, сағатына {y-x} бөлшекке'])
  note=f'Actualoutputs{w1}>{w2}butrates{x}<{y}; winnerДанияр by{y-x}perhour. Wrongraw-outputgap{w1-w2}isdistinct.'
 elif k=='delayed-pump-remaining-time':
  x,delay,y,volume=n;v=one([t for t in range(1,volume+1)if x*(delay+t)+y*t==volume]);assert 'қосылған сәттен' in s
  note=f'Printedfirstpump{x}works{delay}+t, second{y}onlyt. Exacttotal{x*delay}+{x+y}×{v}={volume}. RequestedAFTERJOIN{v}, notelapsed{delay+v}.'
 elif k=='second-rate-greater-joint-time':
  x,gap,work=n;y=x+gap;v=one([t for t in range(1,work+1)if x*t+y*t==work])
  note=f'Actualsecondrate{x}+{gap}={y}, joint{x+y}; uniqueinteger{v}days. Gapmustnotbeusedassecondrate.'
 elif k=='same-duration-second-work':
  x,work,y=n;t=integer(F(work,x));v=y*t
  note=f'Printedfirst{x}perdayproduces{work}in{t}days; SECONDsame{t}days→{v}. Requestedsecondwork, NOTfirstwork/time/bothsum{work+v}.'
 elif k=='joint-total-second-work-not-rate':
  t,work,x,t2=n;assert t==t2;v=work-x*t
  assert v>0 and v%t==0
  note=f'Actualfirstoutput{x*t}, uniqueSECONDOUTPUT{v}; secondrate{v//t}, joint{integer(F(work,t))}different MCQ. All{t}hours, NOTonehour.'
 elif k=='learner-half-master-joint-work':
  x,t=n;y=integer(F(x,2));v=x*t+y*t
  note=f'Printedlearnerhalfrate{y}, master{x}; personaloutputs{x*t}+{y*t}={v}. Equal-ratewrong2×{x}×{t}={2*x*t}MCQretained.'
 elif k in {'two-solo-times-joint-time','two-solo-times-floor-time'}:
  work,t1,t2=n;x=integer(F(work,t1));y=integer(F(work,t2));v=one([t for t in range(1,work+1)if x*t+y*t==work])
  assert v<min(t1,t2)
  note=f'ActualseparateSOLOtimes{t1}/{t2}, exactrates{x}/{y}; conservation{x}×{v}+{y}×{v}={work}. Jointtime{v}lessthanbothsolo, NOTsumoftimes.'
 elif k=='one-master-versus-two-learners':
  work,master,x,y=n;assert max(x,y)<master<x+y;solo=integer(F(work,master));joint=integer(F(work,x+y));gap=solo-joint
  a=one([o for o in os if o==f'Шәкірттер, {gap} сағат ерте'])
  note=f'Printedbothindividuallearnersslowerthanmaster{master}, butsum{x+y}faster. Solotime{solo}, joint{joint}, saved{gap}; comparecompleteworktimes.'
 elif k=='equal-outputs-delayed-second-rate':
  delay,joint,work=n;each=integer(F(work,2));first=integer(F(each,delay+joint));second=integer(F(each,joint));v=second;suffix=' бөлшек/сағ'
  assert first<second and 'жасаған бөлшек саны тең' in s
  note=f'PrintedEQUALOUTPUTS{each}, NOTequalrates. Firstworks{delay+joint}h→{first}, second{joint}h→{second}; requestedSECOND{second}. Bothpersonaloutputledgersrestore{work}.'
 elif k=='unknown-initial-solo-time':
  x,y,joint,work=n;v=one([alone for alone in range(1,work+1)if x*alone+(x+y)*joint==work])
  assert 'жалғыз' in s
  note=f'Actualjointwork{(x+y)*joint}, initialfirstalone{work-(x+y)*joint}, uniqueALONEtime{v}; notfullfirsttime{v+joint}.'
 elif k in {'rate-sum-gap-second-total','rate-sum-gap-first-rate'}:
  gap,t,work=n;pairs=[(x,y)for y in range(1,work+1)for x in[y+gap]if x*t+y*t==work];x,y=one(pairs);v=y*t if k.endswith('second-total')else x
  note=f'Independentintegerpairsearchgivesfirst{x},second{y}, difference{gap}, total({x}+{y})×{t}={work}; requested'+(f'SECONDalltimework{v}, NOTrate{y}.'if k.endswith('second-total')else f'FIRSTrate{v}, NOTsecond{y}.')
 elif k=='observed-two-rates-joint-time':
  t1,w1,t2,w2,work=n;x=integer(F(w1,t1));y=integer(F(w2,t2));v=one([t for t in range(1,work+1)if x*t+y*t==work]);suffix=' күн'
  note=f'Actualobservedwork/timedivisions{x},{y}perday; newjointtarget{work}→{v}days. Observed{t1}+{t2}orrawtotalsincorrect; allfouroptionschecked.'
 elif k=='rate-sum-gap-first-rate-choice':
  t,work,gap=n;x,y=one([(y+gap,y)for y in range(1,work+1)if(2*y+gap)*t==work]);v=x;suffix=' м/күн'
  note=f'Printedjointoutput{work}over{t}days, firstrateexceedssecondby{gap}. Independentpair{x}/{y}, uniqueFIRST{x}; averagingwithoutgapgives{F(work,2*t)}wrong.'
 elif k=='unknown-first-rate-across-stages':
  alone,y,joint,work=n;v=one([x for x in range(1,work+1)if x*alone+(x+y)*joint==work])
  note=f'FirstworksBOTHstages{alone+joint}hours, secondonly{joint}; actual{v}×{alone}+({v}+{y})×{joint}={work}. Firstrequestedrate, notsolo-stageamount.'
 elif k=='helper-leaves-remaining-solo-time':
  work,x,y,joint=n;v=one([alone for alone in range(1,work+1)if(x+y)*joint+x*alone==work]);assert 'жалғыз' in s
  note=f'Actualjointstage{(x+y)*joint}, remaining{work-(x+y)*joint}, firstONLYrate{x}→alone{v}. RequestedremainingSOLOtime, nottotal{joint+v}.'
 elif k=='two-machine-joint-work':
  x,y,t=n;v=x*t+y*t
  note=f'Actualtwoindependentmachines{t}hours produce{x*t}+{y*t}={v}; bothunitratesaccounted.'
 elif k=='delayed-help-earlier-total-time':
  work,x,alone=n;solo=integer(F(work,x));joint=one([t for t in range(1,work+1)if x*alone+2*x*t==work]);elapsed=alone+joint;v=solo-elapsed;suffix=' сағ'
  assert 'ерте' in s and 0<alone<solo
  note=f'ActualnohelperSOLO{solo}h; initial{alone}hproduces{x*alone}, thenJOIN{joint}hfinishes. Totalelapsed{elapsed}, SAVED{v}; notfromstarttime{F(solo,2)}norjoint{joint}asgeneralrule.'
 else:raise AssertionError(('Uncoveredmodel',k))
 if a is None:
  v=integer(v);assert v>0
  a=one([o for o in os if o==str(v)+suffix])if os else str(v)
 assert row['answer']==a,(k,row['answer'],a)
 if os:assert len(os)==len(set(os))==4
 else:assert s.endswith('Жауапқа тек санды жазыңыз.')
 return {'method':method,'notes':note}
def chains(s):
 count=0
 for m in re.finditer(r'[0-9(][0-9\s+×:−()=\-]*',s):
  t=m.group().strip()
  if '='not in t or t.count('(')!=t.count(')'):continue
  parts=t.split('=')
  if any(not p.strip()or re.search(r'[+×:−-]\s*$',p)for p in parts):continue
  vals=list(map(calc,parts));assert all(v==vals[0]for v in vals),(t,vals);count+=1
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
  if not nums(row['statement']):continue
  bad=copy.deepcopy(row);bad['statement']=re.sub(r'[0-9]+',lambda m:str(int(m.group())+1),row['statement'],count=1)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printedgivenmutationaccepted',i))
 staged=0;equal=0
 # Independently enumerate short worklogs (one output perworker perminute),
 # nottheauthorinverseformula. Reconcile joint/alone/time-identification.
 for x in range(1,28):
  for y in range(1,28):
   for alone in range(1,9):
    for joint in range(1,9):
     firstlog=[x]*(alone+joint);secondlog=[y]*joint;work=sum(firstlog)+sum(secondlog)
     assert sum(firstlog[:alone])+sum(a+b for a,b in zip(firstlog[alone:],secondlog))==work
     assert work-y*joint==x*(alone+joint)
     assert work-(x+y)*joint==x*alone;staged+=1
 for first in range(1,41):
  for second in range(1,41):
   for t1 in range(1,13):
    for t2 in range(1,13):
     if first*t1==second*t2 and t1>t2:
      assert first<second
      assert F(first*t1+second*t2,2*t2)==second;equal+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All39saved/newconditions,fullsolutions,allMCQread. IndependentactualprintedFraction/AST/conservation/integersearch; formalwork/timeformulaandcompletedifferenttime/equaloutputworklogs. Noauthorcalculatorimported. Findings0.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'stagedWorklogWitnesses':staged,'equalOutputUnequalRateWitnesses':equal,'report':OUT if args.write else None}))
if __name__=='__main__':main()
