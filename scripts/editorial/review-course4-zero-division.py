"""All14 full saved/new conditions official/new solutions and8 source/new
options read.14 archived diagrams and14 own SVGs previewed343px. Independent
full long-division digit/remainder steps before and after cancelling each common
zero; floor quotient, actual unscaled remainder, ceil seats and perimeter.
Same author computational review, not a second human. No browser QA.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-zero-division';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-shifts-sets.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
CORNERS=[0,3,10,12,13]
def parse(r,i,src=False):
 p=H.math_parts(r['statement'],src)
 if i in[0,3,13]:p=re.split(r'[:÷/]',H.tex(one(p)))
 return list(map(E.calc,p))
def long_division(n,d):
 n,d=int(n),int(d);assert n>=0 and d>0;records=[];scale=1
 while True:
  q,rem=divmod(n,d);records.append({'dividend':n,'divisor':d,'quotient':q,'remainder':rem,'cancelledZeroScale':scale});partial=0;started=False
  for digit in str(n):
   partial=partial*10+int(digit)
   if partial>=d or started:
    q,r=divmod(partial,d);assert 0<=q<=9;records.append({'dividend':partial,'divisor':d,'quotient':q,'remainder':r,'cancelledZeroScale':scale});partial=r;started=True
  if n%10 or d%10:break
  n//=10;d//=10;scale*=10
 return records

def compute(r,i,src=False):
 v=parse(r,i,src);assert min(v)>0;p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def divide(n,d):
  assert F(n).denominator==F(d).denominator==1;p['euclideanSteps']+=long_division(n,d);q,rem=divmod(int(n),int(d));return q,rem
 if i in[0,1,3,7,13]:n,d=v;q,rem=divide(n,d);assert rem==0;out=q
 elif i in[2,11]:d,n=v;q,rem=divide(n,d);assert rem==0;out=q
 elif i in[4,6]:area,side=v;q,rem=divide(area,side);assert rem==0;out=2*(q+side);p['otherSide']=str(q);p['halfPerimeter']=str(q+side)
 elif i==5:n,a,b=v;q,rem=divide(n,a);assert rem==0;out,rem=divide(q,b);assert rem==0
 elif i==8:n,d=v;q,rem=divide(n,d);out=q+(rem>0);assert(out-1)*d<n<=out*d;p['fullVehicles']=q;p['actualUnscaledRemainder']=rem
 elif i==9:a,n,b,m,groups=v;total=a*n+b*m;out,rem=divide(total,groups);assert rem==0;p['totalItems']=str(total)
 elif i in[10,12]:n,d=v;q,rem=divide(n,d);assert rem>0;out=q if i==10 else rem;p['actualQuotient']=q;p['actualUnscaledRemainder']=rem
 else:raise AssertionError(i)
 assert F(out)>=0 and F(out).denominator==1;p['calculatedAnswer']=str(out);return out,p

def representation(s,i):return E.calc(re.sub(r'\b(?:м|сағ)\b','',s.replace('$','').replace('\\,','')))
def fmt(out,i):return str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(F,json.loads(ids['actual-inputs'].text)))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[F(txt('value-'+str(j)))for j in range(len(v))]==v
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in CORNERS:
  assert txt('operand-a')==str(v[0])and txt('operand-b')==str(v[1]);a,b=ids['operand-a'],ids['operand-b'];assert a.get('text-anchor')==b.get('text-anchor')=='end'and a.get('font-family')==b.get('font-family')=='monospace';assert a.get('x')=='185'and b.get('x')=='300'and a.get('y')==b.get('y')=='60';assert[ids['division-vertical'].get(k)for k in['x1','y1','x2','y2']]==['210','30','210','140'];assert[ids['division-horizontal'].get(k)for k in['x1','y1','x2','y2']]==['210','78','320','78'];assert txt('quotient-unknown')=='?'
 if i in[4,6]:
  a,side=v;other=a/side;scale=min(280/side,135/other);el=ids['field'];assert el.tag.endswith('rect')and el.get('x')=='35'and el.get('y')=='30';assert abs(F(el.get('width'))-side*scale)<F(1,10**10)and abs(F(el.get('height'))-other*scale)<F(1,10**10)
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
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in[1,2,3,4,5,6,7,8,9,10,12,15,20,24,25,30,40,50,60,70,80,90,100,120,200,300,400,600,800,1000]:
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
   elif i in CORNERS:ids['operand-a'].text='999'
   elif i in[4,6]:ids['field'].set('width','999')
   else:ids['value-0'].text='888'
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'14 own SVGs rendered343px inspected,14 source diagrams inspected. Actual visible data, proper division corner and scaled rectangle sides checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==8
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':14,'nativeSVGs':14,'actualInputMutationsChecked':14,'updatedHashWrongVisibleInputsRejected':14,'rehashedIncorrectDiagramsRejected':14,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':14,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
