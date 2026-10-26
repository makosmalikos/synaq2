"""27 full archived/new conditions official/new solutions and60 choices read.
All27 source pictures and27 original343px SVGs inspected. Exact rate sums,
work stages, joint times, proportional shares and every meaningful distractor
computed separately. Same author computational check, not another human.
Local Standard+ only; no browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-joint-proportion';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-remainders-zeroes.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
def parse(r,i,src=False):return list(map(E.calc,H.math_parts(r['statement'],src)))
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v))};assert min(v)>0
 def exact(a,b):
  x=a/b;assert x.denominator==1 and x>0;return x
 if i in[0,11]:out=v[0]-v[1]
 elif i==1:a,b,t=v;out=(a+b)*t
 elif i==2:a,b,total=v;out=exact(total,a+b)
 elif i in[3,12]:alone,a,b,together=v;out=alone*a+(a+b)*together;p['stageOutputs']=list(map(str,[alone*a,(a+b)*together]))
 elif i in[4,10]:volume,both,first=v;rate=volume/both-volume/first;out=exact(volume,rate);p['secondRate']=str(rate)
 elif i==5:length,first,second=v;out=exact(length,length/first+length/second)
 elif i==6:total,a,b,c,t=v;remaining=total-(a+b+c)*t;out=exact(remaining,a+b);p['remainingWork']=str(remaining)
 elif i==7:a,b,c,volume=v;assert a+b>c;out=exact(volume,a+b-c);p['netRate']=str(a+b-c)
 elif i==8:
  ab,bc,ac,t=v;rates=[(ab+ac-bc)/2,(ab+bc-ac)/2,(bc+ac-ab)/2];assert min(rates)>0;out=sum(rates)*t;p['threeIndividualRates']=list(map(str,rates))
 elif i==9:mul,t,total=v;assert mul>1;out=exact(total,t*(mul+1))
 elif i in[13,14,17,18,25,26]:
  a,b,total=v
  if i==26:assert a>b;unit=exact(total,a-b);out=unit*(a+b)
  else:
   unit=exact(total,a+b)
   out=unit*a if i==13 else unit if i==14 else unit*(b-a)if i==17 else(unit*a,unit*b)if i==18 else unit*b
  p['unitShare']=str(unit)
 elif i==15:t,amount,new=v;out=exact(amount,t)*new
 elif i==16:t,area,h,m=v;assert 0<=m<60;out=exact(h*60+m,t)*area
 elif i==19:total,a,b=v;assert a>b;unit=exact(total,a+b);out=unit*(a-b);p['unitShare']=str(unit)
 elif i in[20,21,24]:
  a,b,c,total=v
  if i==21:assert c>a;unit=exact(total,c-a);out=unit*(a+b+c)
  else:unit=exact(total,a+b+c);out=unit*b if i==20 else unit*(c-a)
  p['unitShare']=str(unit)
 elif i==22:mul,total=v;assert mul>1;out=exact(total,mul+1)*mul
 elif i==23:a,b,total,mul=v;assert mul>1;unit=exact(total,a+b*mul);out=unit*mul;p['unitShare']=str(unit)
 else:raise AssertionError(i)
 if i!=18:assert out.denominator==1 and out>0
 p['calculatedAnswer']=fmt(out,i);return out,p

def representation(s,i):
 if i==18:return tuple(representation(x,0)for x in s.split('және'))
 if '$'in s:return E.calc(one(H.math_parts(s,True)))
 return E.calc(re.search(r'[\d]+(?:[ ,][\d]{3})*',s)[0].replace(' ',''))
def fmt(out,i):return' және '.join(str(int(x))for x in out)if i==18 else str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(E.calc,map(str,json.loads(ids['actual-inputs'].text))))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[E.calc(txt('value-'+str(j)))for j in range(len(v))]==v
 for j in range(len(v)):assert txt('input-'+str(j))
 shares={13:v[:2],14:v[:2],17:v[:2],18:v[:2],19:v[1:],20:v[:3],21:v[:3],22:[v[0],F(1)],23:[v[0],v[1]*v[3]]if i==23 else[],24:v[:3],25:v[:2],26:v[:2]}.get(i)
 if shares:
  assert len([id for id in ids if re.fullmatch(r'share-\d+',id)])==len(shares);x=F(30)
  for j,n in enumerate(shares):
   el=ids['share-'+str(j)];w=300*n/sum(shares)
   for k,value in {'x':x,'y':40,'width':w,'height':42}.items():assert abs(F(el.get(k))-value)<F(1,10**10)
   assert E.calc(txt('share-label-'+str(j)))==n;x+=w
 if i in[3,6,12]:assert txt('stage-first')==str(v[4]if i==6 else v[0])+' сағ' and txt('stage-second')==('?'if i==6 else str(v[3]))+' сағ'
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.C.choices(r);v=parse(r,i,src)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals));roles=None
  if i==2:a,b,total=v;roles=[out,total/(b-a),a+b,total/a]
  elif i==4:vol,both,first=v;roles=[vol/both-vol/first,out,both+first,first-both]
  elif i==5:_,a,b=v;roles=[out,a+b,a,(a+b)/2]
  elif i==6:total,a,b,c,t=v;rem=total-(a+b+c)*t;roles=[out,rem/(a+b+c),total/(a+b),total/(a+b+c)]
  elif i==9:mul,t,total=v;rate=total/t;roles=[out,rate/2,rate/mul,out*mul]
  elif i==10:vol,both,first=v;roles=[both*2,out,first-both,vol/both-vol/first]
  elif i==14:a,b,total=v;roles=[total/a,total/2,out,total/b]
  elif i==15:t,amount,new=v;roles=[amount*new,amount*t,amount/t,out]
  elif i==17:a,b,total=v;unit=total/(a+b);roles=[unit,unit*b,out,unit*a]
  elif i==18:a,b,total=v;u=total/(a+b);roles=[out,(u*b,u*a),(total/2,total/2),(total-u,u)]
  elif i==19:total,a,b=v;u=total/(a+b);roles=[total/2,out,u*a,u]
  elif i==21:a,b,c,d=v;u=d/(c-a);roles=[2*d,out,u*c,d*(a+b+c)]
  elif i==23:a,b,total,mul=v;u=total/(a+b*mul);roles=[total/(a+b),u,out,total/(mul+1)]
  elif i==24:a,b,c,total=v;u=total/(a+b+c);roles=[out,u*a,u,u*c]
  elif i==25:a,b,total=v;u=total/(a+b);roles=[out,u*a,u,total/2]
  if roles is not None:assert vals==roles,('distractorRoles',i,vals,roles)
 if not src:
  if check_figure:figure(r,i,v)
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
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==27;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   elif i>=13 and i not in[15,16]:ids['share-0'].set('width','999')
   elif i in[3,6,12]:ids['stage-first'].text='999 сағ'
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'27 own SVGs rendered343px inspected;27 saved pictures inspected. Actual rate inputs work-stage labels and proportional share rectangle dimensions checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==60
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':27,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':27,'nativeSVGs':27,'actualInputMutationsChecked':27,'updatedHashWrongVisibleInputsRejected':27,'rehashedIncorrectDiagramsRejected':27,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':27,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
