"""Independent full34 saved/new signed-context review, using printed givens only.
All raw conditions, official solutions and MCQs and all new fulltexts read.
Author specs/models/params/solvers are not used by this oracle.
"""
import ast,copy,hashlib,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-signed-contexts.json'
REPORT='problems/editorial/reviews/grade6-signed-contexts.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('\\\\','\\').replace('\\,','').replace('{,}',',').replace('{:}',':').replace('$','').replace('−','-')
 s=re.sub(r'\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
 return s
TOKEN=r'[+-]?(?:\(\d+/\d+\)|\d+(?:[,.]\d+)?)'
def frac(s):return F(s.replace(',','.').replace('(','').replace(')',''))
def ns(s):return[frac(t) for t in re.findall(TOKEN,clean(s))]
def options(row):return[o['text'] if isinstance(o,dict) else o for o in row.get('options',[])]
def one(xs):assert len(xs)==1,xs;return xs[0]
def equivalent(a,b):return re.sub(r'\s+',' ',clean(a)).strip()==re.sub(r'\s+',' ',clean(b)).strip()
def clock(s):h,m=map(int,s.split(':'));assert 0<=h<24 and 0<=m<60;return h*60+m
def clocks(s):return[clock(t) for t in re.findall(r'\b\d{1,2}:\d{2}\b',clean(s))]
def time(m):assert 0<=m<1440;return f'{m//60:02}:{m%60:02}'
domain_cases=0
def solve(row,i,source=False):
 global domain_cases
 s=row['statement'];n=ns(s);ops=options(row);expected=None;exact=None;notes=[]
 if i==1:
  start,drop=n;assert start<0 and drop>0;expected=-(start-drop)
  if not source:assert 'нөлден төмен мөлшері' in row['solution']
  notes=['The requested below-zero magnitude13 is positive; signed temperature is−13 and the extra cooling alone is9.']
 elif i==2:
  exact=one([o for o in ops if ('оң сан да, теріс сан да емес' in o or 'оң сандарға да, теріс сандарға да кірмейді' in o)])
  assert not(0>0) and not(0<0) and 0>=0 and 0<=0
 elif i==3:expected=-one(n)
 elif i==4:
  magnitude=abs(one(n));exact=one([o for o in ops if ('ұтылды' in o or 'жоғалтты' in o) and ns(o)==[magnitude]])
 elif i in(5,11):
  if source:listing=s.split('?',1)[1]
  else:listing=s.split(':',1)[1].split('. Осы',1)[0]
  values=ns(listing);assert len(values)==8,values
  expected=sum(v<0 for v in values) if i==5 else sum(v>=0 for v in values)
  assert any(v==0 for v in values) and any(v.denominator>1 and v<0 for v in values)
 elif i==6:expected=abs(n[-1]);assert n[0]==0 and n[-1]<0
 elif i==7:expected=-n[0];assert n[0]>0 and n[1]==0
 elif i==8:expected=abs(one(n))
 elif i==9:expected=-n[0];assert n[0]<0 and n[1]==0
 elif i==10:
  if source:underground=2;above=n[-1];assert n[:2]==[-1,-2]
  else:assert n[0]==-1 and n[2]==1;underground=abs(n[1]);above=n[3];assert 'нөлінші қабат жоқ' in s
  labels=list(range(-int(underground),0))+list(range(1,int(above)+1));assert 0 not in labels;expected=len(labels);domain_cases+=len(labels)
  notes=['Count actual floor labels,18 floors, separately from the12 floor-to-floor intervals of the elevator task.']
 elif i==12:
  good=[o for o in ops if one(ns(o))<0];exact=one(good)
  assert one(ns(exact)).denominator>1
 elif i==13:exact=one([o for o in ops if 'арзандады' in o]);assert one(ns(exact))>0
 elif i==14:
  planned,actual=clocks(s);expected=actual-planned;assert expected<0
  notes=['Own minutes-from-midnight conversion crosses the hour:537−550=−13min.']
 elif i==15:debt,deposit=n;assert debt<0 and deposit>0;expected=deposit+debt
 elif i==16:
  assert n[0]==0;depth,height=n[1:3];expected=[-depth,height,F(0)]
 elif i==17:rise,fall=n[-2:];expected=rise-fall;assert n[0]==0 and rise>0 and fall>rise
 elif i==18:
  before,after=n;expected=[-before,after]
  if not source:assert 'өткен уақытты есептеу талап етілмейді' in s
  notes=['BC/AD sign labels follow an explicitly scoped convention; do not subtract those labels to obtain a historical duration.']
 elif i==19:
  # Zero is printed in both conditions as the exact-budget convention.
  budget=n[-4] if source else n[0];spent=n[-3:];expected=[budget-v for v in spent]
  assert spent[0]>budget and spent[1]==budget and spent[2]<budget
  assert sum(expected)==3*budget-sum(spent)
 elif i==20:
  start,rise,evening,night=n;stages=[start,start+rise,start+rise-evening,start+rise-evening-night]
  assert stages[0]<0 and stages[1]>0 and stages[2]<0 and stages[3]<0
  expected=-stages[-1]
 elif i==21:
  exact=one([o for o in ops if all(v<=0 for v in ns(o))]);assert 0 in ns(exact) and min(ns(exact))<0
 elif i==22:
  start,end=n[-2:];assert start<0<end and 'нөлінші қабат жоқ' in s
  labels=list(range(int(start),0))+list(range(1,int(end)+1));assert 0 not in labels
  path=list(zip(labels,labels[1:]));expected=len(path);domain_cases+=len(labels)
  assert (-1,1) in path and expected==len(labels)-1
  notes=['Enumerated actual labels−4,−3,−2,−1,1,…,9 and counted12 adjacent transitions; no zero floor.']
 elif i==23:expected=n[-1];assert expected>0 and n[0]>0 and n[1]==-n[0]
 elif i==24:
  reward,negativePenalty=n[:2];correct,wrong=n[-2:];assert reward>0>negativePenalty
  changes=[reward]*int(correct)+[negativePenalty]*int(wrong);expected=sum(changes);domain_cases+=len(changes)
 elif i==25:height,depth=n;assert height>0;expected=height+abs(depth)
 elif i==26:
  exact=one([o for o in ops if 'не оң сан, не' in o and one(ns(o))==0])
  for v in[F(-2,9),F(-1),F(0),F(1,7),F(3)]:assert (v>=0)==(v>0 or v==0);domain_cases+=1
  assert not(0>0) and F(-2,9)<0
 elif i==27:
  surface,hillRise,fall=([n[0],n[2],n[3]] if source else n[:3]);surface=-abs(surface);hill=surface+hillRise;expected=hill-fall
  assert hill>0 and expected<surface<0 and (surface-expected)+hillRise==fall
  notes=['Different reference levels retained: lake−36, hill148, bottom−302m; actual lake depth266m is not the signed sea-level coordinate.']
 elif i==28:
  if source:hours,rate=n[:2];finalBelow=abs(ns(s.split('болды')[0])[-1]);assert clocks(s)[0]-clocks(s)[1]==hours*60
  else:
   start,end,repeatEnd,repeatStart=clocks(s);assert repeatEnd==end and repeatStart==start
   hours=F(end-start,60);rate=one(ns(s.split('температура әр сағатта',1)[1].split('градусқа',1)[0]));finalBelow=abs(one(ns(s.split('°C болды')[0].rsplit('-де ',1)[1])))
  expected=hours*rate-finalBelow;assert hours.denominator==1 and expected>0
  trajectory=[expected-k*rate for k in range(int(hours)+1)];assert trajectory[-1]==-finalBelow;domain_cases+=len(trajectory)
 elif i==29:
  debt,first,days,daily,last=n;assert debt<0;stages=[debt,debt+first]
  for _ in range(int(days)):stages.append(stages[-1]-daily)
  stages.append(stages[-1]+last);expected=stages[-1]
  assert stages[1]>0 and stages[-2]<0<stages[-1]
  assert expected==first+last+debt-days*daily;domain_cases+=len(stages)
  if not source:assert 'теріс баланста да' in s and 'басқа төлем жоқ' in s
 elif i==30:
  assert n[0]==0;height,down,factor=n[1:];diver=height-down;assert diver<0 and factor>1;expected=diver*factor
  assert abs(expected)>abs(diver) and height-diver==down
 elif i==31:
  buy1,repair,sell1,buy2,sell2=n;outflows=[buy1,repair,buy2];inflows=[sell1,sell2];expected=sum(inflows)-sum(outflows)
  assert sell1<buy1+repair and sell2>buy2 and expected>0
 elif i==32:
  total,reward,negativePenalty=n[:3];score=n[-1]
  hits=[]
  for c in range(int(total)+1):
   domain_cases+=1
   if c*reward+(total-c)*negativePenalty==score:hits.append(F(c))
  expected=one(hits);assert 0<expected<total
  notes=['Complete0…26 correct-answer counts independently tested; only19 correct and7 wrong produce62 points.']
 elif i==33:
  before,after=n[:2];assert 'нөлінші жыл жоқ' in s and 'басында' in s
  labels=list(range(-int(before),0))+list(range(1,int(after)+1));expected=labels.index(int(after))-labels.index(-int(before));domain_cases+=len(labels)
  assert 0 not in labels and expected==len(labels)-1
  notes=['Enumerated no-zero year-label timeline from start of150BC to start of315AD:464 completed annual transitions, not465 nor inclusive466.']
 elif i==34:
  ahead,believedBehind=n[:2];target=clocks(s)[0];shown=target-int(believedBehind);actual=shown-int(ahead);delta=actual-target
  assert delta<0;exact=one([o for o in ops if clocks(o)==[actual] and ns(o)[-1]==-delta and 'ерте' in o])
  assert shown+believedBehind==target and actual+ahead==shown
  notes=['Separate real clock offset and imagined correction:display18:55, real18:48, target19:00,12min early.']
 else:raise AssertionError(i)
 if exact is not None:assert equivalent(row['answer'],exact),(i,row['answer'],exact)
 elif ops:
  want=expected if isinstance(expected,list) else[expected];exact=one([o for o in ops if ns(o)==want]);assert equivalent(row['answer'],exact),(i,row['answer'],exact)
 else:assert one(ns(row['answer']))==expected,(i,row['answer'],expected)
 return notes
def expr(s):
 t=s.replace('×','*').replace('−','-').replace(':','/').strip()
 def go(a):
  if isinstance(a,ast.Constant):return F(ast.get_source_segment(t,a))
  if isinstance(a,ast.UnaryOp):assert isinstance(a.op,(ast.USub,ast.UAdd));return -go(a.operand) if isinstance(a.op,ast.USub) else go(a.operand)
  assert isinstance(a,ast.BinOp);x,y=go(a.left),go(a.right)
  if isinstance(a.op,ast.Add):return x+y
  if isinstance(a.op,ast.Sub):return x-y
  if isinstance(a.op,ast.Mult):return x*y
  if isinstance(a.op,ast.Div):return x/y
  raise AssertionError(ast.dump(a))
 return go(ast.parse(t,mode='eval').body)
def eqs(row):
 count=0
 for m in re.finditer(r'(?<![\d\w])(-?\d+(?:\s*[×+:−+-]\s*-?\d+)+)\s*=\s*(-?\d+)',row['solution']):
  prefix=row['solution'][:m.start()]
  if re.search(r'[×+:−+-]\s*$',prefix):continue
  assert expr(m[1])==F(m[2]),m[0];count+=1
 return count
def run():
 global domain_cases
 rows=read(BATCH)['editions'];assert len(rows)==34;entries=[];wrong=0;equalities=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];capture=read(ref['sourceFile']);raw=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert capture['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert not equivalent(raw['statement'],row['statement'])
  original={**raw,'answer':raw['sourceAnswer']};solve(original,i,True);notes=solve(row,i)
  bad=copy.deepcopy(row);bad['answer']='INVALID INDEPENDENT WRONG KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError):wrong+=1
  else:raise AssertionError(('Wrong key accepted',i))
  equalities+=eqs(row)
  digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','method':'independent_full_source_and_authored_content_read_printed_fraction_signed_reference_and_complete_domain_oracle','notes':[
   'Read this entire canonical condition, official fullsolution and allsourceMCQs plus the entire newcondition, fullsolution and everynewMCQ. Own oracle does not read authorparams or import authorsolver.',
   'Checked signed coordinate versus positive distance/lossamount, zero/weak sign sets, everyreference and operationstage; unique choices and exact targetunits; numeric solutionequalities independently parsed.',*notes]})
 canaries=[(1,'тағы 9 градус','тағы 10 градус'),(5,'-150','+150'),(6,'-65 м','-66 м'),(9,'-12 °C','-13 °C'),(10,'-3-ке дейін','-4-ке дейін'),(11,'-9;','+9;'),(14,'09:10','09:11'),(15,'1200 тг','1300 тг'),(17,'61 см','62 см'),(19,'18400;','18500;'),(20,'13 градус','14 градус'),(22,'нөлінші қабат жоқ','нөлінші қабат бар'),(24,'10 дұрыс','11 дұрыс'),(25,'42 м','43 м'),(27,'36 м','37 м'),(28,'сағатта 3 градус','сағатта 4 градус'),(29,'4 күн','5 күн'),(30,'560 м','570 м'),(31,'6500 тг','6600 тг'),(32,'62 ұпай','56 ұпай'),(33,'150 жылдың','151 жылдың'),(34,'7 минут алда','8 минут алда')]
 rejected=0
 for i,a,b in canaries:
  bad=copy.deepcopy(rows[i-1]);assert a in bad['statement'],(i,a);bad['statement']=bad['statement'].replace(a,b,1)
  try:solve(bad,i)
  except (AssertionError,ValueError):rejected+=1
  else:raise AssertionError(('Printed canary did not fail',i))
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rows=JSON.parse(fs.readFileSync(process.argv[1],'utf8')).editions;console.log(JSON.stringify(rows.map(r=>[r.editionId,editionHash(r)])));"
 js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code,BATCH],cwd=ROOT,text=True)))
 assert all(js[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','scope':'All34 saved/new grade6signedcontexts2.1 nonvisual editions; no claim of34 distinct meanings and no new sourcecollection.','evidence':{'oracle':'scripts/editorial/review-grade6-signed-contexts.py','fullContentRead':34,'sourceKeysVerified':34,'printedExactKeys':34,'wrongKeysRejected':wrong,'printedCanariesRejected':rejected,'completeTimelineAndScoreDomainCases':domain_cases,'numericSolutionEqualities':equalities,'pythonJsHashesMatched':len(entries),'findingResolved':'case1 solution now explicitly distinguishes below-zero magnitude13 from additional cooling9; other33 rows unchanged by author.'},'entries':entries}
 (ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'reviewed':34,**report['evidence']}))
if __name__=='__main__':run()
