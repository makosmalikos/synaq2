"""14 full archived/new conditions official/new solutions and24 choices read.
14 source illustrations and14 original343px SVGs inspected. Unit differences,
areas perimeters ordered distances surplus/deficit and clock intervals checked
with exact fractions. Same author computational checker, not another human.
Local Standard+ only, no browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-differences';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-remainders-zeroes.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
def parse(r,i,src=False):return[E.calc(str(int(x)))if re.fullmatch(r'0[0-9]+',x)else E.calc(x)for x in H.math_parts(r['statement'],src)]
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v))}
 def unit(a,b,d):
  assert a>b>0 and d>0;u=d/(a-b);assert u.denominator==1;return u
 if i in[0,1,2,3,4,5,6,11,13]:
  a,b,d=v;u=unit(a,b,d);p['unitValue']=str(u)
  out=u if i in[0,1]else u*b if i in[2,3,5,13]else 2*(b+u)if i==4 else(u*a,u*b)if i==6 else u*a
 elif i==7:a,left,b,short=v;u=unit(b,a,left+short);out=u;p['availableMoney']=str(a*u+left);assert b*u-(a*u+left)==short
 elif i==8:
  a,pens,b,pens2,d,total=v;assert pens==pens2==1;u=unit(b,a,d);out=total-a*u;p['unitValue']=str(u)
 elif i==9:a,b,c,d=v;u=unit(a,b,d);out=u*c;p['unitValue']=str(u)
 elif i in[10,12]:
  assert len(v)==9
  for j in[0,2,4,6]:assert 0<=v[j]<=23 and 0<=v[j+1]<60
  a=v[2]*60+v[3]-v[0]*60-v[1];b=v[6]*60+v[7]-v[4]*60-v[5];assert a>b>0;u=v[8]/(a-b);out=u*(a+b);p['durationsMinutes']=list(map(str,[a,b]));p['unitPerMinute']=str(u)
 else:raise AssertionError(i)
 if i!=6:assert out.denominator==1 and out>0
 p['calculatedAnswer']=fmt(out,i);return out,p

def representation(s,i):
 if i==6:return tuple(representation(x,0)for x in s.split(';'))
 if '$'in s:return E.calc(one(H.math_parts(s,True)))
 return E.calc(re.search(r'[\d]+(?:[ ,][\d]{3})*',s)[0].replace(' ',''))
def fmt(out,i):return'; '.join(str(int(x))for x in out)if i==6 else str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(E.calc,map(str,json.loads(ids['actual-inputs'].text))))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[E.calc(txt('value-'+str(j)))for j in range(len(v))]==v
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in[3,4,13]:
  a,b,d=v;w=d/(a-b);scale=min(270/a,65/w)
  for j,x in enumerate([a,b]):
   for k,value in {'x':35,'y':25+j*100,'width':x*scale,'height':w*scale}.items():assert abs(F(ids['field-'+str(j)].get(k))-value)<F(1,10**10)
   assert E.calc(txt('length-'+str(j)))==x
 if i in[10,12]:
  for j in range(2):
   a,b,c,d=map(int,v[j*4:j*4+4]);assert txt('clock-'+str(j))==f'{a}:{b:02d} → {c}:{d:02d}'
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.C.choices(r);v=parse(r,i,src)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals));roles=None
  if i==4:a,b,d=v;u=d/(a-b);roles=[b*u,2*(a+u),2*b,out]
  elif i==5:a,b,d=v;u=d/(a-b);roles=[d*b,out-d,u*a,out]
  elif i==6:a,b,d=v;x,y=out;roles=[(y,x),(d*a,d*b),out,(x,x+d)]
  elif i==9:a,b,c,d=v;u=d/(a-b);roles=[out,u*(b-c),u*a,u*b]
  elif i==12:
   a,b=map(F,p['durationsMinutes']);u=F(p['unitPerMinute']);roles=[v[8]*(a+b)/60,out,u*b,u*a]
  elif i==13:a,b,d=v;u=d/(a-b);roles=[u*(a+b),d,u*a,out]
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
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   elif i in[3,4,13]:ids['field-0'].set('width','999')
   elif i in[10,12]:ids['clock-0'].text='wrong clock'
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'14 own SVGs rendered343px inspected;14 source pictures inspected. Equal-width rectangle dimensions, clock times and every visible input checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==24
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':14,'nativeSVGs':14,'actualInputMutationsChecked':14,'updatedHashWrongVisibleInputsRejected':14,'rehashedIncorrectDiagramsRejected':14,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':14,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
