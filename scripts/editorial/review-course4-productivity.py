"""13 full archived and rewritten productivity conditions, solutions and8 choices read.
13 source illustrations and13 original343px native SVGs inspected. Exact work-rate,
fractions, cycles, equal-output rates and progression calculations. Same author
computational check, not another human. No browser QA. Local Standard+ only.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-productivity';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-remainders-zeroes.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
def parse(r,i,src=False):
 p=H.math_parts(r['statement'],src)
 if src and i in[5,6,7,10]:assert p[-2:]==['1','2'];p=p[:-2]
 return list(map(E.calc,p))
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v))};assert min(v)>0
 def exact(a,b):
  x=a/b;assert x.denominator==1 and x>=0;return x
 if i==0:t,n=v;out=exact(n,t)
 elif i==1:rate,t=v;out=rate*t
 elif i in[2,12]:total,t,rate,new=v;remaining=total-t*rate;assert remaining>0;out=exact(remaining,new);p['remainingWork']=str(remaining)
 elif i==3:rate,start,end=v;assert 0<=start<end<=23;out=rate*(end-start)
 elif i==4:
  total,f,rate=v;assert 0<f<1 and (total*f).denominator==1;remaining=total*(1-f);out=exact(remaining,rate);p['remainingWork']=str(remaining)
 elif i==5:
  t,a,u,b=v;first=t*a;second=u*b;out=('шебер'if first>second else'шәкірт'if second>first else'екеуі бірдей',abs(first-second));p['workerOutputs']=list(map(str,[first,second]))
 elif i==6:
  fast,slow,delta=v;assert slow>fast;slowRate=exact(delta*fast,slow-fast);fastRate=slowRate+delta;out=slowRate*slow;assert out==fastRate*fast;p['workerRates']=list(map(str,[fastRate,slowRate]))
 elif i==7:
  t,a,u,b,h=v;minutes=h*60;out=exact(minutes,t)*a-exact(minutes,u)*b;assert out>0;p['workerOutputs']=list(map(str,[minutes/t*a,minutes/u*b]))
 elif i==8:total,t,rate,mul=v;assert mul>1 and total>t*rate;out=t+exact(total-t*rate,rate*mul)
 elif i==9:
  first,step,n=v;assert n.denominator==1;terms=[first+j*step for j in range(int(n))];out=sum(terms);p['hourlyProduction']=list(map(str,terms))
 elif i==10:plan,rate,first,new=v;assert first<plan and new>rate;out=first+exact((plan-first)*rate,new)
 elif i==11:cycle,n,h,minutes=v;assert 0<=minutes<60;out=exact(h*60+minutes,cycle)*n
 else:raise AssertionError(i)
 if i!=5:assert out.denominator==1 and out>=0
 p['calculatedAnswer']=fmt(out,i);return out,p

def representation(s,i):
 if i==5:
  if 'бірдей'in s:return('екеуі бірдей',F(0))
  return('шәкірт'if'шәкірт'in s else'шебер',E.calc(re.search(r'\d+',s)[0]))
 return E.calc(s.replace('$','').replace('\\,',''))
def fmt(out,i):return out[0]+(', '+str(int(out[1]))+' бөлшекке'if out[1]else'')if i==5 else str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(E.calc,map(str,json.loads(ids['actual-inputs'].text))))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[E.calc(txt('value-'+str(j)))for j in range(len(v))]==v
 for j in range(len(v)):assert txt('input-'+str(j))
 def rect(id,attrs):
  for k,val in attrs.items():assert abs(F(ids[id].get(k))-val)<F(1,10**10),(i,id,k)
 if i==4:
  n,d=v[1].numerator,v[1].denominator;assert len([k for k in ids if k.startswith('fraction-piece-')])==d
  for j in range(d):
   rect('fraction-piece-'+str(j),{'x':30+F(j*300,d),'y':35,'width':F(300,d),'height':40});assert ids['fraction-piece-'+str(j)].get('fill')==('#abc9ee'if j<n else'#eee7f7')
 if i==6:
  for k,t in enumerate(v[:2]):
   assert len([id for id in ids if id.startswith('time-'+str(k)+'-')])==t
   for j in range(int(t)):rect(f'time-{k}-{j}',{'x':30+j*300/t,'y':42+k*70,'width':300/t,'height':30})
 if i==9:
  a,step,n=v;scale=125/(a+step*(n-1));assert len([id for id in ids if re.fullmatch(r'hour-\d+',id)])==n
  for j in range(int(n)):
   value=a+j*step;rect('hour-'+str(j),{'x':25+j*310/n,'y':165-value*scale,'width':260/n,'height':value*scale});assert E.calc(txt('hour-value-'+str(j)))==value and E.calc(txt('hour-number-'+str(j)))==j+1
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals))
  if i==9:
   a,step,n=parse(r,i,src);last=a+(n-1)*step;assert vals==[last,out,a*n,last*n]
  if i==5:
   role,d=out;other='шәкірт'if role=='шебер'else'шебер';assert vals==[('екеуі бірдей',F(0)),(other,d),(role,d),(other,d/2)]
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
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
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==13;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   elif i==4:ids['fraction-piece-0'].set('width','999')
   elif i==6:ids['time-0-0'].set('width','999')
   elif i==9:ids['hour-0'].set('height','999')
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'13 own SVGs rendered343px inspected;13 saved pictures inspected. Actual fractional strips, equal-work timelines, hourly bars and visible inputs verified. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==8
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':13,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':13,'nativeSVGs':13,'actualInputMutationsChecked':13,'updatedHashWrongVisibleInputsRejected':13,'rehashedIncorrectDiagramsRejected':13,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':13,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
