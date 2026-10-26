"""All29 full source/new conditions official/new solutions and32 source/new
options read. All29 archived pictures and29 own343px SVG previews inspected.
Source1 table480km6h read from archived pixels. Independent rational speed,
length,time and relative-motion calculations; same author, not another human.
No browser QA. Frozen saved sources only, Standard+ local.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-motion';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-shifts-sets.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one

def parse(r,i,src=False):
 if src and i==1:
  assert H.math_parts(r['statement'],True)==['v','t','S'];return[F(6),F(480)]
 return list(map(E.calc,H.math_parts(r['statement'],src)))
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def minute(h,m):assert 0<=h<24 and 0<=m<60;return h*60+m
 if i in[0,3]:speed,t=v;assert min(v)>0;out=speed*t;p['distance']=str(out)
 elif i==1:t,s=v;assert min(v)>0;out=s/t
 elif i==2:speed,s=v;assert min(v)>0;out=s/speed
 elif i==4:t,a,u,b=v;assert min(v)>0;out=t*a+u*b;p['legDistances']=[str(t*a),str(u*b)]
 elif i==5:s,t,a,b=v;left=s-t*a;assert min(v)>0 and left>0;out=left/b;p['remainingDistance']=str(left)
 elif i==6:s,speed,t=v;left=s-speed*t;assert min(v)>0 and left>0;out=left/speed;p['wholeTime']=str(s/speed);p['remainingDistance']=str(left)
 elif i==7:s,a,b,fly=v;assert min(v)>0 and fly>max(a,b);t=s/(a+b);out=fly*t;assert a*t+b*t==s;p['meetingTimeHours']=str(t)
 elif i==8:a,b,t=v;assert min(v)>0;out=(a+b)*t;p['separateDistances']=[str(a*t),str(b*t)]
 elif i in[9,13]:s,a,b=v;assert min(v)>0;out=s/(a+b);assert a*out+b*out==s
 elif i==10:s,slow,fast=v;assert fast>slow>0 and s>0;out=s/(fast-slow);assert fast*out==s+slow*out;p['closingSpeed']=str(fast-slow)
 elif i in[11,19]:train,speed,tunnel=v;assert min(v)>0;speed=speed*F(5,18)if i==19 else speed;out=(train+tunnel)/speed;assert speed*out-train==tunnel;p['speedMetresPerSecond']=str(speed);p['fullClearanceDistance']=str(train+tunnel)
 elif i==12:a,b,t=v;assert a>b>0 and t>0;out=(a-b)*t;p['fastDistance']=str(a*t);p['wrongOppositeSum']=str((a+b)*t)
 elif i==14:km,m,t=v;assert 0<=m<1000 and km>=0 and t>0;out=(km*1000+m)/t
 elif i==15:speed,km=v;assert min(v)>0;out=km*1000/speed
 elif i==16:km,m,speed=v;assert 0<=m<1000 and km>=0 and speed>0;out=(km*1000+m)/speed
 elif i==17:km,m,walk,bike=v;s=km*1000+m;assert 0<=m<1000 and walk>0 and bike*1000/60>walk;times=[s/walk,s/(bike*1000/60)];out=times[0]-times[1];p['arrivalMinutes']=list(map(str,times))
 elif i==18:h,m,speed,km=v;start=minute(h,m);duration=km*60/speed;assert duration>0;out=(start+duration)%(24*60);p['durationMinutes']=str(duration);p['startMinutes']=str(start)
 elif i==20:km,bike,walk=v;assert min(v)>0;closing=bike*1000/60+walk;out=km*1000/closing;p['closingSpeedMetresPerMinute']=str(closing)
 elif i==21:km,a,b,dog=v;assert min(v)>0 and dog*1000/60>max(a,b);t=km*1000/(a+b);out=dog*1000/60*t;p['meetingTimeMinutes']=str(t);p['dogSpeedMetresPerMinute']=str(dog*1000/60)
 elif i==22:
  lap,fast,slow=v;slow/=60;assert fast>slow>0 and lap>0;out=lap/(fast-slow);assert fast*out-slow*out==lap;p['relativeMetresPerSecond']=str(fast-slow);p['singleLapSeconds']=str(lap/fast);p['euclideanSteps']=[{'dividend':int(out),'divisor':60,'quotient':int(out//60),'remainder':int(out%60)}]
 elif i==23:s,fast,slow=v;slow/=60;assert fast>slow>0 and s>0;out=s/(fast-slow);assert fast*out==s+slow*out
 elif i==24:km,first,bike,wait,bus=v;assert km>first>0 and min(bike,wait,bus)>0;times=[first*1000/bike,wait,(km-first)*60/bus];out=sum(times);p['journeyPartsMinutes']=list(map(str,times))
 elif i==25:a,b,t=v;assert min(v)>0;out=(a*1000/60+b)*t/1000
 elif i==26:
  km,h,m,car,bh,bm,bus=v;delay=minute(bh,bm)-minute(h,m);assert delay>0 and min(km,car,bus)>0;lead=car*delay/60;left=km-lead;assert left>0;t=left/(car+bus*60/1000);out=lead+car*t;assert out+bus*60/1000*t==km;p['delayMinutes']=str(delay);p['headStartKilometres']=str(lead);p['sharedMotionHours']=str(t)
 elif i==27:
  h,m,walk,bh,bm,bike=v;start=minute(h,m);bstart=minute(bh,bm);delay=bstart-start;fast=bike*1000/60;assert fast>walk>0 and delay>0;lead=walk*delay;t=lead/(fast-walk);out=(bstart+t)%(24*60);assert fast*t==walk*(delay+t);p['headStartMetres']=str(lead);p['chaseMinutes']=str(t)
 elif i==28:km,m,a,b=v;assert 0<=m<1000 and min(km,a,b)>0;out=(km*1000+m)/(a+b*1000/60)
 else:raise AssertionError(i)
 assert out>=0 and F(out).denominator==1,('nonIntegral',i,out);p['calculatedAnswer']=str(out);return out,p

def representation(s,i):
 s=s.replace('$','').strip()
 if i in[18,27]:
  a=re.findall(r'(\d+)\s*(сағ|мин)',s);assert a and all(u in['сағ','мин']for n,u in a);return sum(F(n)*(60 if u=='сағ'else 1)for n,u in a)
 if i==22:
  a=re.findall(r'(\d+)\s*(мин|с)\b',s);assert a;return sum(F(n)*(60 if u=='мин'else 1)for n,u in a)
 return E.calc(re.sub(r'\b(?:сағ|км|с)\b','',s))
def fmt(out,i):
 n=int(out)
 if i in[18,27]:return f'{n//60} сағ {n%60} мин'
 if i==22:return f'{n//60} мин {n%60} с'
 return str(n)

def mode(i):return'meet'if i in[7,9,13,20,21,26,28]else'apart'if i in[8,25]else'chase'if i in[10,23,27]else'parallel'if i in[12,17]else'stages'if i in[4,5,24]else'train'if i in[11,19]else'circle'if i==22 else'table'if i==1 else'single'
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(F,json.loads(ids['actual-inputs'].text)))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[F(txt('value-'+str(j)))for j in range(len(v))]==v;kind=mode(i);assert txt('route-mode')==kind
 for j in range(len(v)):assert txt('input-'+str(j))
 if kind=='table':assert txt('table-v')=='v, км/сағ'and txt('table-t')=='t, сағ'and txt('table-s')=='S, км'and txt('table-unknown')=='?'and F(txt('table-time'))==v[0]and F(txt('table-distance'))==v[1]
 elif kind=='circle':
  assert ids['track'].get('r')=='57'and ids['track'].get('cx')=='180'and ids['track'].get('cy')=='90';assert ids['lap-0'].get('d')=='M 180 147 A 57 57 0 0 0 237 90'and ids['lap-1'].get('d')=='M 180 162 A 72 72 0 0 0 252 90';assert ids['lap-head-0'].get('points')=='237,86 230,99 244,99'and ids['lap-head-1'].get('points')=='252,86 245,99 259,99'
 else:
  expected=[(45,75,140),(315,75,220)]if kind=='meet'else[(170,75,45),(190,75,315)]if kind=='apart'else[(45,75,140),(220,75,315)]if kind=='chase'else[(45,65,315),(45,105,315)]if kind=='parallel'else[(35,75,160),(200,75,325)]if kind=='stages'else[(40,40,120)]if kind=='train'else[(45,75,315)]
  for j,(x,y,z)in enumerate(expected):
   el=ids['route-'+str(j)];assert tuple(map(F,[el.get(k)for k in['x1','y1','x2','y2']]))==(x,y,z,y);head=ids['route-'+str(j)+'-head'];pts=[tuple(map(F,x.split(',')))for x in head.get('points').split()];assert pts==[(z,y),(z+(-10 if z>x else 10),y-6),(z+(-10 if z>x else 10),y+6)]
  if kind=='train':
   tr,tu=ids['train-body'],ids['tunnel'];w=F(tr.get('width'));u=F(tu.get('width'));assert abs(w/u-v[0]/v[2])<F(1,10**12);assert F(tr.get('x'))==30 and abs(F(tu.get('x'))-30-w)<F(1,10**12)and abs(w+u-300)<F(1,10**12)
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 parts=H.math_parts(r['statement'],False)
 for j,old in enumerate(parts):
  for delta in[1,2,3,4,5,6,7,8,9,10,12,15,16,18,20,21,24,25,30,32,35,36,40,45,48,50,60,72,75,80,84,90,96,100,120,132,150,160,180,200,240,300,360,400,500,600,1000]:
   cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=cr['statement'].replace('«'+old+'»','«'+str(int(old)+delta)+'»',1)
   try:
    out,_=compute(cr,i)
    if out!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
   except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==29;entries=[];evidence=[];choices=0;exact=0;remainders=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])and q['solution']
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  if i==1:
   manifest=json.loads((ROOT/'problems/sources/zerek/courses/image-manifest.json').read_text())['files'];im=one(x for x in manifest if x['src'].split('/questions/')[-1]==q['images'][0]['src'].split('/questions/')[-1]);src['archivedPixelTableWitness']={'timeHours':6,'distanceKilometres':480,'file':im['file'],'sha256':hashlib.sha256((ROOT/'problems/sources/zerek/courses'/im['file']).read_bytes()).hexdigest()}
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('staleKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
  for kind in['input','geometry']:
   tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')}
   if kind=='input':ids['value-0'].text='999'
   elif i==1:ids['table-time'].text='99'
   elif i==22:ids['lap-1'].set('d','M 180 162 A 72 72 0 0 1 252 90')
   else:ids['route-0'].set('x2','0')
   wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
   try:figure(bad,i,parse(r,i),wrong)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('rehashedCorruptionAccepted',i,kind))
  for expr in H.math_parts(q['solution'],True):
   if '='not in expr:continue
   try:vals=[N.exact_power_arithmetic(s)for s in expr.split('=')]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   if len(set(vals))!=1:
    assert len(vals)==2 and any(F(x['dividend'],x['divisor'])==vals[0]and x['quotient']==vals[1]and x['remainder']>0 for x in src['euclideanSteps']),('sourceNonexact',i,expr);remainders+=1
   else:exact+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'29 own SVGs rendered343px inspected,29 saved pictures inspected. All visible inputs directions arrowheads circular direction and train/tunnel ratios checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==32
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':29,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':29,'nativeSVGs':29,'actualInputMutationsChecked':29,'updatedHashWrongVisibleInputsRejected':29,'rehashedIncorrectDirectionsRejected':29,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':29,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
