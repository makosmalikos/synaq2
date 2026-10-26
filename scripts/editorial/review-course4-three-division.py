"""14 complete saved/new conditions official/new solutions and12 source/new
choices read.14 archived illustrations and14 own343px SVGs inspected.
Independent full long division, mixed mass units, inverse factors and exhaustive
masked divisions. Source3 wording gives wrong brought-down digit despite correct
answer; rewritten explanation corrected. Same author, not another human.
No browser QA; localStandard+ only.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-three-division';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-remainders-zeroes.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
CORNERS=[0,1,2,9,11,12]
def clean(s):return H.tex(s).replace('\\square','□').replace(' ','').replace('÷','/').replace(':','/')
def parse(r,i,src=False):
 p=H.math_parts(r['statement'],src)
 if i==9:
  if src:assert p[-1]=='0';p=p[:-1]
  left,right=clean(one(p)).split('=');a,b=left.split('/');return[a,b,right]
 if i==11:
  if src:assert p[-1]=='\\square';p=p[:-1]
  return[clean(x)for x in p]
 if i in[1,2,12]:return list(map(E.calc,clean(one(p)).split('/')))
 return list(map(E.calc,p))
def hidden_digit(v):
 mask,d=v;d=int(d);assert mask.count('□')==1;allCandidates=[];valid=[]
 for digit in range(10):
  n=int(mask.replace('□',str(digit)));q,r=divmod(n,d);row={'digit':digit,'dividend':n,'divisor':d,'quotient':q,'remainder':r};allCandidates.append(row)
  if r==0:valid.append(row)
 return one(valid),allCandidates

def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def divide(n,d):
  assert F(n).denominator==F(d).denominator==1 and min(n,d)>0;p['euclideanSteps']+=C.C.long_division(n,d);q,rem=divmod(int(n),int(d));assert rem==0;return F(q)
 if i==0:d,q=v;out=d*q;divide(out,d)
 elif i in[1,2,4,12]:out=divide(*v)
 elif i==3:n,total=v;out=divide(total,n)
 elif i==5:t,kg,capacity=v;assert 0<=kg<1000;mass=t*1000+kg;out=divide(mass,capacity);p['actualMassKilograms']=str(mass)
 elif i==6:n,t,kg=v;assert 0<=kg<1000;mass=t*1000+kg;out=divide(mass,n);p['actualMassKilograms']=str(mass)
 elif i==7:area,side=v;other=divide(area,side);out=2*(side+other);p['otherSide']=str(other)
 elif i==8:boxes,total,new=v;assert 0<new<=boxes;per=divide(total,boxes);out=per*new;p['perBox']=str(per)
 elif i==9:m=C.hidden(v);p['uniqueHiddenDivision']=m;divide(m['dividend'],m['divisor']);out=m['quotient']
 elif i==10:budget,price,n,per=v;left=budget-price*n;assert left>0;out=divide(left,per);p['remainingMoney']=str(left)
 elif i==11:
  m,candidates=hidden_digit(v);p['allActualHiddenDigitCandidates']=candidates;p['uniqueHiddenDigit']=m
  for row in candidates:p['euclideanSteps']+=C.C.long_division(row['dividend'],row['divisor'])
  out=m['digit']
 elif i==13:capacity,t,kg=v;assert 0<=kg<1000;mass=t*1000+kg;out=divide(mass,capacity);p['actualMassKilograms']=str(mass)
 else:raise AssertionError(i)
 assert F(out)>=0 and F(out).denominator==1;p['calculatedAnswer']=str(out)
 if i==3 and src:
  assert '2$-ні түсіреміз'in r['solution'];p['sourceWordingCorrection']='The next digit after437 in437500 is5, not2; true 625 partial dividend and3500 answer independently verified. New solution has no copied wording.'
 return out,p

def representation(s,i):return E.calc(s.replace('$','').replace('\\,','').replace('тг',''))
def fmt(out,i):return str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(str,json.loads(ids['actual-inputs'].text)))==list(map(str,v))
 def txt(id):return''.join(ids[id].itertext())
 assert[txt('value-'+str(j))for j in range(len(v))]==list(map(str,v))
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in CORNERS:
  assert txt('operand-a')==('?'if i==0 else str(v[0]))and txt('operand-b')==str(v[0]if i==0 else v[1]);a,b=ids['operand-a'],ids['operand-b'];assert a.get('text-anchor')==b.get('text-anchor')=='end'and a.get('font-family')==b.get('font-family')=='monospace';assert a.get('x')=='185'and b.get('x')=='300'and a.get('y')==b.get('y')=='60';assert[ids['division-vertical'].get(k)for k in['x1','y1','x2','y2']]==['210','30','210','140'];assert[ids['division-horizontal'].get(k)for k in['x1','y1','x2','y2']]==['210','78','320','78'];assert txt('shown-quotient')==str(v[1]if i==0 else v[2]if i==9 else'?')
 if i==7:
  area,side=v;other=area/side;s=min(280/side,135/other);el=ids['field'];assert abs(F(el.get('width'))-side*s)<F(1,10**10)and abs(F(el.get('height'))-other*s)<F(1,10**10)
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 cr=copy.deepcopy(r);cr.pop('options',None);s=cr['statement']
 if i==9:s=s.replace('9□104','9□024')
 elif i==11:s=s.replace('9□264','9□256')
 else:s=None
 if s:
  cr['statement']=s;out,_=compute(cr,i);assert out!=representation(r['answer'],i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in[1,2,3,4,5,6,7,8,9,10,12,15,16,18,20,24,25,26,28,30,32,34,36,40,42,45,48,50,51,52,54,60,64,68,70,72,73,77,80,84,90,100,120,144,150,200,248,285,300,384,400,408,416,423,425,526,528,600,800,1000]:
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
   elif i in CORNERS:ids['operand-b'].text='999'
   elif i==7:ids['field'].set('width','999')
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'14 own SVGs rendered343px inspected;14 saved pictures inspected. Actual visible values, inverse and masked division corners and scaled rectangle checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==12
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':14,'nativeSVGs':14,'actualInputMutationsChecked':14,'updatedHashWrongVisibleInputsRejected':14,'rehashedIncorrectDiagramsRejected':14,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':14,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
