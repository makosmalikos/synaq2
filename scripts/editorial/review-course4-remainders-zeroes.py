"""25 full saved/new conditions official/new solutions and28 source/new
choices read.24 source pictures inspected; missing source3 has complete
numeric condition.25 own SVGs rendered343px inspected. True remainders,
floors/ceilings, inverse divisions, all bounded congruence candidates and every
masked quotient independently recomputed. Same author, not another human.
No browser QA; local Standard+ only.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-remainders-zeroes';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-zero-division.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
CORNERS=[3,10,12,14,15,19,20,21,22,23,24]
def clean(s):return H.tex(s).replace('\\square','□').replace(' ','').replace('÷','/').replace(':','/')
def parse(r,i,src=False):
 p=H.math_parts(r['statement'],src)
 if i in[20,21,22]:left,right=clean(one(p)).split('=');a,b=left.split('/');return[a,b,right]
 if i in[12,14,15,23]:return list(map(E.calc,clean(one(p)).split('/')))
 if i in[19,24]:a,b=map(E.calc,clean(p[0]).split('/'));return[a,b,E.calc(p[1])]
 return list(map(E.calc,p))
def hidden(v):
 dividend,divisor,quotient=v;assert re.fullmatch('[0-9□]+',dividend)and re.fullmatch('[0-9]+',divisor)and re.fullmatch('[0-9□]+',quotient);out=[]
 for ds in itertools.product('0123456789',repeat=quotient.count('□')):
  it=iter(ds);s=''.join(next(it)if c=='□'else c for c in quotient)
  if s[0]=='0':continue
  q=int(s);n=q*int(divisor);text=str(n)
  if len(text)==len(dividend)and all(a=='□'or a==b for a,b in zip(dividend,text)):out.append({'dividend':n,'divisor':int(divisor),'quotient':q,'quotientDigits':list(map(int,ds)),'dividendDigits':[int(b)for a,b in zip(dividend,text)if a=='□']})
 return one(out)
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def divide(n,d):
  assert F(n).denominator==F(d).denominator==1 and min(n,d)>0;p['euclideanSteps']+=C.long_division(n,d);q,rem=divmod(int(n),int(d));return q,rem
 if i in[0,3,7,10]:n,d=v;q,rem=divide(n,d);assert rem>0;out=rem;p['actualQuotient']=q;p['actualRemainder']=rem
 elif i in[1,6]:d,q,rem=v;assert 0<rem<d;out=d*q+rem;qq,rr=divide(out,d);assert qq==q and rr==rem
 elif i==2:n,d=v;q,rem=divide(n,d);out=q;p['actualQuotient']=q;p['actualRemainder']=rem
 elif i==4:d,q,rem,new=v;assert 0<rem<d;n=d*q+rem;divide(n,d);out,newrem=divide(n,new);p['reconstructedTotal']=str(n);p['newRemainder']=newrem
 elif i in[5,11]:n,d=v;q,rem=divide(n,d);out=q+(rem>0);assert(out-1)*d<n<=out*d;p['actualQuotient']=q;p['actualRemainder']=rem
 elif i==8:
  capacity,empty,other,bound=map(int,v);assert 0<empty<capacity and bound>=other>0;candidates=[n for n in range(1,bound+1)if n%capacity==capacity-empty and n%other==0];out=one(candidates);divide(out,capacity);divide(out,other);p['allOtherCapacityMultiples']=[{'n':n,'firstRemainder':n%capacity,'satisfiesBoth':n in candidates}for n in range(other,bound+1,other)];p['allValidStudentCounts']=candidates
 elif i==9:q,rem=divide(*v);out=(q,rem);p['actualQuotient']=q;p['actualRemainder']=rem
 elif i in[12,13,14,15,17,23]:out,rem=divide(*v);assert rem==0;p['quotientDigits']=list(str(out))
 elif i==16:total,first,a,b=v;assert total>first>0;q,rem=divide(first,a);assert rem==0;qq,rem=divide(total-first,b);assert rem==0;out=q+qq;p['twoBoxCounts']=[q,qq]
 elif i==18:t,s=v;out,rem=divide(s,t);assert rem==0
 elif i in[19,24]:n,d,wrong=v;out,rem=divide(n,d);assert rem==0 and '0'in str(out)and int(str(out).replace('0',''))==wrong;p['incorrectOmittedZero']=str(wrong);p['quotientDigits']=list(str(out))
 elif i in[20,21,22]:m=hidden(v);p['uniqueHiddenDivision']=m;divide(m['dividend'],m['divisor']);out=m['dividend']if i==20 else m['quotient']
 else:raise AssertionError(i)
 if i!=9:assert F(out)>=0 and F(out).denominator==1
 p['calculatedAnswer']=list(out)if i==9 else str(out);return out,p

def representation(s,i):
 s=s.replace('$','').replace('\\,','')
 if i==9:return tuple(int(re.sub(r'\s','',x))for x in re.findall(r'\d[\d\s]*',s))
 return E.calc(s)
def fmt(out,i):return f'{out[0]} қорап, {out[1]} кәмпит'if i==9 else str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(str,json.loads(ids['actual-inputs'].text)))==list(map(str,v))
 def txt(id):return''.join(ids[id].itertext())
 assert[txt('value-'+str(j))for j in range(len(v))]==list(map(str,v))
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in CORNERS:
  assert txt('operand-a')==str(v[0])and txt('operand-b')==str(v[1]);a,b=ids['operand-a'],ids['operand-b'];assert a.get('text-anchor')==b.get('text-anchor')=='end'and a.get('font-family')==b.get('font-family')=='monospace';assert a.get('x')=='185'and b.get('x')=='300'and a.get('y')==b.get('y')=='60';assert[ids['division-vertical'].get(k)for k in['x1','y1','x2','y2']]==['210','30','210','140'];assert[ids['division-horizontal'].get(k)for k in['x1','y1','x2','y2']]==['210','78','320','78']
  if len(v)==3:assert txt('shown-quotient')==str(v[2])and ids['shown-quotient'].get('x')=='300'and ids['shown-quotient'].get('y')=='120'
  else:assert txt('quotient-unknown')=='?'
  if i in[19,24]:assert txt('error-label')=='Қате жауап'and ids['shown-quotient'].get('fill')=='#b45368'
 if i==0:
  n,d=v;q,rem=divmod(int(n),int(d));scale=300/n;assert sum(id.startswith('piece-')for id in ids)==q
  for j in range(q):el=ids['piece-'+str(j)];assert abs(F(el.get('x'))-30-j*d*scale)<F(1,10**10)and abs(F(el.get('width'))-d*scale)<F(1,10**10)
  el=ids['remainder'];assert abs(F(el.get('x'))-30-q*d*scale)<F(1,10**10)and abs(F(el.get('width'))-rem*scale)<F(1,10**10)
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=[list(x)if isinstance(x,tuple)else str(x)for x in vals]
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 cr=copy.deepcopy(r);cr.pop('options',None);s=cr['statement']
 if i==19:s=s.replace('17136','17220').replace('«24»','«25»')
 elif i==20:s=s.replace('5□3□0','5□1□0')
 elif i==21:s=s.replace('□□0□9','□□3□9')
 elif i==22:s=s.replace('4□3□9','4□6□9')
 elif i==24:s=s.replace('34304','34624').replace('«172»','«182»')
 else:s=None
 if s:
  cr['statement']=s;out,_=compute(cr,i);assert out!=representation(r['answer'],i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in[1,2,3,4,5,6,7,8,9,10,12,15,16,18,20,24,25,26,28,30,32,34,36,40,42,45,48,50,51,52,54,60,64,68,70,72,73,77,80,84,90,100,120,200,300,400,600,800,1000]:
    cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'][:left]+str(old+delta)+r['statement'][right:]
    try:
     out,_=compute(cr,i)
     if out!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
    except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   elif i==0:ids['remainder'].set('width','999')
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'25 own SVGs rendered343px inspected;24 source pictures inspected, one unavailable complete in text. Actual visible values, scaled ribbon full pieces plus remainder, corner operands and clearly labelled incorrect answers checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==28
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':25,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':24,'unavailableSourceWithCompleteText':1,'nativeSVGs':25,'actualInputMutationsChecked':25,'updatedHashWrongVisibleInputsRejected':25,'rehashedIncorrectDiagramsRejected':25,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':25,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
