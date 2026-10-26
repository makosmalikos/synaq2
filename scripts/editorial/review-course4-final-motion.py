"""54 full archived/new conditions official/new solutions and96 choices read.
54 saved pictures and54 own343px SVGs inspected. Independent exact approach,
separation, pursuit, trains, clocks, deadlines and work-rate calculations check
all actual given quantities and every distractor. Same author computational
checker, not another human. Standard+ local only, no browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-final-motion';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-remainders-zeroes.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
CLOCK=[28,34,36];DURATION=[49,50]
def parse(r,i,src=False):return[E.calc(str(int(x)))if re.fullmatch(r'0[0-9]+',x)else E.calc(x)for x in H.math_parts(r['statement'],src)if x!='x']
def compute(r,i,src=False):
 g=i+14;v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v))};assert min(v)>=0
 def exact(x):assert x.denominator==1 and x>=0;return x
 if g in[14,24,60]:D,a,b,t=v;out=D-(a+b)*t;assert out>0;p['travelledTogether']=str((a+b)*t)
 elif g in[15,40,42,52,56,58,67]:a,b,t=v;out=(a+b)*t
 elif g==16:a,b,t=v;out=a*t
 elif g==17:D,a,b=v;out=exact(D/(a+b))
 elif g in[18,27,39,59]:D,t,a=v;out=exact(D/t-a)
 elif g==19:D,a,b,r=v;assert D>r>0;out=exact((D-r)/(a+b))
 elif g==20:a,b,t,r=v;out=(a+b)*t+r
 elif g==21:l,a,m,b=v;out=exact((l+m)/(a+b)*60);p['clearanceMetres']=str(l+m)
 elif g==22:
  t,r,u,s=v;assert u>t and r>s>0;rate=(r-s)/(u-t);out=r+rate*t;p['relativeSpeed']=str(rate)
 elif g in[23,25,36]:
  D,h,a,k,b=v;assert 0<=h<k<24;head=a*(k-h);assert D>head;after=exact((D-head)/(a+b));p['headStartDistance']=str(head);p['sharedHours']=str(after)
  out=after if g==23 else a*(k-h+after)if g==25 else k*60+after*60
 elif g==26:km,m,a,b=v;assert 0<=m<1000;out=exact((km*1000+m)/(a+b));p['distanceMetres']=str(km*1000+m)
 elif g==28:h,m,a,D=v;assert 0<=h<24 and 0<=m<60;travel=exact(D/a*60);out=h*60+m+travel;p['travelMinutes']=str(travel)
 elif g in[29,38]:a,t,r=v;out=a*t+r
 elif g==30:a,b=v;out=a+b
 elif g==31:h,a,b,k=v;assert 0<=h<k<24;out=(a+b)*(k-h)
 elif g==32:a,t,b,u,r=v;out=a*t+b*u+r
 elif g==33:a,t=v;out=2*a*t
 elif g==34:
  km,h,m,a,k,n,b=v;assert 0<=h<=k<24 and 0<=m<60 and 0<=n<60;first=h*60+m;second=k*60+n;assert second>first;D=km*1000;head=a*(second-first);assert D>head;after=exact((D-head)/(a+b));out=second+after;p['sharedMinutes']=str(after);p['headStartDistance']=str(head)
 elif g==35:t,r,u=v;assert u>t;rate=r/(u-t);out=rate*u
 elif g==37:
  h,m,D,k,n,a=v;assert 0<=h<24 and 0<=k<24 and 0<=m<60 and 0<=n<60;travel=exact(D/a*60);arrival=k*60+n+travel;delta=arrival-(h*60+m);assert delta!=0;out=('late'if delta>0 else'early',abs(delta));p['arrivalMinuteOfDay']=str(arrival)
 elif g==41:t,D,a=v;out=exact(D/t-a)
 elif g in[43,46,53]:a,t,D=v;out=exact(D/t-a)
 elif g==44:t,D,S=v;assert D>S;out=exact((D-S)/t)
 elif g in[45,50]:D,a,b,S=v;assert S>D;out=exact((S-D)/(a+b));out=out*60 if g==50 else out
 elif g in[47,51]:D,a,b,t=v;out=D+(a+b)*t
 elif g==48:a,early,b,t=v;out=a*(early+t)+b*t
 elif g==49:D,a,b,S=v;assert S>D;out=exact((S-D)*1000/(a+b))
 elif g==54:a,b,t=v;assert a>b;out=(a-b)*t
 elif g==55:out=one(v)*6
 elif g in[57,65]:slow,D,fast=v;assert fast>slow;out=exact(D/(fast-slow))
 elif g==61:fast,slow,D=v;assert fast>slow;out=exact(D/(fast-slow)*60)
 elif g==62:pole,bridge,t=v;assert t>pole;speed=bridge/(t-pole);out=speed*pole;p['trainSpeedMetresPerSecond']=str(speed)
 elif g==63:lap,fast,slow=v;assert fast>slow;out=exact(lap/(fast-slow));p['singleLapTimeFast']=str(lap/fast)
 elif g==64:D,a,b,dog=v;assert dog>max(a,b);t=D/(a+b);out=dog*t;p['meetingHours']=str(t)
 elif g==66:t,total,first=v;out=exact(total/t-first)
 else:raise AssertionError(g)
 if g!=37:exact(out);assert out>0
 p['calculatedAnswer']=fmt(out,i);return out,p

def representation(s,i):
 g=i+14
 if g in CLOCK:
  if':'in s:a,b=map(int,s.split(':'));return F(a*60+b)
  parts=H.math_parts(s,True);assert len(parts)==2;return F(int(parts[0])*60+int(parts[1]))
 if g in DURATION:
  s=s.replace('$','');h=re.search(r'(\d+)\s*сағ',s);m=re.search(r'(\d+)\s*мин',s);return F((int(h[1])*60 if h else 0)+(int(m[1])if m else 0))
 if g==37:
  vals=H.math_parts(s,True)if'$'in s else re.findall(r'\d+',s);return('late'if'Үлгермейді'in s else'early',F(one(vals)))
 if '$'in s:return E.calc(one(H.math_parts(s,True)))
 return E.calc(s)
def fmt(out,i):
 g=i+14
 if g in CLOCK:return str(int(out)//60)+':'+str(int(out)%60).zfill(2)
 if g in DURATION:return str(int(out)//60)+' сағ '+str(int(out)%60)+' мин'
 if g==37:return('Үлгермейді, 'if out[0]=='late'else'Үлгереді, ')+str(int(out[1]))+(' минут кешігеді'if out[0]=='late'else' минут ерте жетеді')
 return str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(E.calc,map(str,json.loads(ids['actual-inputs'].text))))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[E.calc(txt('value-'+str(j)))for j in range(len(v))]==v
 for j in range(len(v)):assert txt('input-'+str(j))
 g=i+14;single=g in[28,29,32,33,37,38,55,62];same=g in[54,57,61,65];out=40<=g<=53 or g==67;work=g in[56,66]
 if g==63:
  assert ids['track'].get('cx')=='180'and ids['track'].get('cy')=='100'and ids['track'].get('r')=='70'
  assert ids['lap-direction'].get('d')=='M180 30A70 70 0 0 1 250 100'and ids['lap-head'].get('d')=='M244 90L250 100L256 90';assert txt('lap-length')==str(v[0])+' м'
 elif not work:
  arrows=[(80,65,190)]if single else[(40,55,90),(200,90,90)]if same else[(145,65,-90),(215,65,90)]if out else[(40,65,90),(320,65,-90)]
  assert len([x for x in ids if re.fullmatch(r'direction-\d+',x)])==len(arrows)
  for j,(x,y,dx)in enumerate(arrows):
   end=x+dx;sign=1 if dx>0 else-1;assert ids['direction-'+str(j)].get('d')==f'M{x} {y}H{end}';assert ids['direction-'+str(j)+'-head'].get('d')==f'M{end-sign*9} {y-6}L{end} {y}L{end-sign*9} {y+6}'
 return True

def solve(r,i,src=False,check_figure=True):
 row=r;g=i+14;out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',g,r['answer'],out);opts=C.C.C.C.choices(r);v=parse(r,i,src)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals));roles=None
  if g==14:D,a,b,t=v;roles=[a+b,(a+b)*t,out,D-a-b]
  elif g==15:a,b,t=v;roles=[b*t,out,(b-a)*t,a+b]
  elif g==20:a,b,t,r=v;roles=[out,(a+b)*t-r,a+b+r,(a+b)*t]
  elif g==22:t,r,u,s=v;rate=(r-s)/(u-t);roles=[out,r+s,r,r+rate]
  elif g==24:D,a,b,t=v;roles=[(a+b)*t,D-abs(a-b)*t,D-a-b,out]
  elif g==28:h,m,a,D=v;travel=D/a;start=h*60+m;roles=[out+60,(out//60)*60,out,start+travel]
  elif g==34:km,h,m,a,k,n,b=v;start=h*60+m;second=k*60+n;after=F(p['sharedMinutes']);roles=[start+after,start+km*1000/(a+b),out+second-start,out]
  elif g==36:roles=[out+60,out,out+30,out-60]
  elif g==37:_,d=out;roles=[('early',d),('early',3*d),out,('late',5*d)]
  elif g==41:t,D,a=v;roles=[out,D/t,(D-a)/t,D-a]
  elif g==42:a,b,t=v;roles=[(a-b)*t,out,a*t,a+b]
  elif g==44:t,D,S=v;roles=[D-S,D/t,out,S/t]
  elif g==47:D,a,b,t=v;roles=[(a+b)*t,D+(b-a)*t,out,D+a+b]
  elif g==49:D,a,b,S=v;roles=[S*1000/(a+b),out/10,(S+D)*1000/(a+b),out]
  elif g==50:D,a,b,S=v;roles=[(S-D)/(b-a)*60,S/(a+b)*60,(S+D)/(a+b)*60,out]
  elif g==51:D,a,b,t=v;roles=[(a+b)*t,D+(b-a)*t,out,D*2]
  elif g==52:a,b,t=v;roles=[(b-a)*t,out,b*t,a+b]
  elif g==54:a,b,t=v;roles=[a-b,out,(a+b)*t,a*t]
  elif g==60:D,a,b,t=v;roles=[out,D+(a+b)*t,(a+b)*t,D-a*t]
  elif g==62:pole,bridge,t=v;roles=[bridge/t*pole,bridge,bridge+out,out]
  elif g==63:lap,fast,slow=v;roles=[out*2,out/2,lap/slow,out]
  elif g==65:slow,D,fast=v;roles=[out,F(-(-D//fast)),D/slow,out*2]
  elif g==66:t,total,first=v;roles=[total-first,out,total/t,total/t+first]
  elif g==67:a,b,t=v;roles=[out,a+b,b*t,(b-a)*t]
  if roles is not None:assert vals==roles,('distractorRoles',g,vals,roles)
 if not src:
  if check_figure:figure(row,i,v)
  for chain in re.findall(r'(?<![\w:])\d+(?:\.\d+)?(?:\s*[+×÷−]\s*\d+(?:\.\d+)?)+\s*=\s*\d+(?:\.\d+)?',row['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in range(1,501):
    cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'][:left]+str(old+delta)+r['statement'][right:]
    try:
     out,_=compute(cr,i)
     if out!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
    except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==54;entries=[];evidence=[];choices=0;exact=0;remainders=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])and q['solution']
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('staleKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
  for kind in['input','geometry']:
   tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')}
   if kind=='input':ids['value-0'].text='999'
   elif i+14==63:ids['lap-direction'].set('d','M0 0')
   elif i+14 not in[56,66]:ids['direction-0'].set('d','M0 0')
   else:ids['value-0'].text='888'
   wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
   try:figure(bad,i,parse(r,i),wrong)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('rehashedCorruptionAccepted',i,kind))
  for expr in H.math_parts(q['solution'],True):
   if '='not in expr:continue
   try:vals=[N.exact_power_arithmetic(s)for s in expr.split('=')]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(vals))==1,('sourceArithmetic',i,expr);exact+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'54 own SVGs rendered343px inspected;54 source pictures inspected. Actual approach/separation/pursuit arrows, circular direction and all visible givens checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==96
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':54,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':54,'nativeSVGs':54,'actualInputMutationsChecked':54,'updatedHashWrongVisibleInputsRejected':54,'rehashedIncorrectDiagramsRejected':54,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':54,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
