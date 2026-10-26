"""All27 full saved/new conditions official/new solutions and36 source/new
choices read.27 archived pictures and27 own343px SVG previews inspected.
Independent digit masks over both factors and hidden dividends, exact division
steps, unit versus tens partial products and omitted tens place. Same author
computational review, not another human. No browser QA. LocalStandard+ only.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-two-digit';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-zero-division.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
MUL=[1,2,7,8,11,12,13];DIV=[17,18,23,24,25]
def clean(s):return H.tex(s).replace('\\square','□').replace(' ','').replace('×','*').replace('÷','/').replace(':','/')
def parse(r,i,src=False):
 parts=H.math_parts(r['statement'],src)
 if i in[7,8,13]:left,right=clean(one(parts)).split('=');a,b=left.split('*');return[a,b,right]
 if i in[23,25]:return clean(one(parts)).split('/')
 if i in[1,2,11,12]:return list(map(E.calc,clean(one(parts)).split('*')))
 if i in[17,18,24]:return list(map(E.calc,clean(one(parts)).split('/')))
 if i==9:
  a,b=map(E.calc,clean(parts[0]).split('*'));units=E.calc(parts[1]);redundant=E.calc(parts[2]);assert redundant==a*(b//10*10);wrong=E.calc(parts[3]);return[a,b,units,wrong]
 return list(map(E.calc,parts))

def masked_product(v):
 a,b,pattern=v;assert all(re.fullmatch('[0-9□]+',s)for s in v);out=[]
 for digits in itertools.product('0123456789',repeat=a.count('□')+b.count('□')):
  it=iter(digits);aa=''.join(next(it)if c=='□'else c for c in a);bb=''.join(next(it)if c=='□'else c for c in b)
  if aa[0]=='0'or bb[0]=='0':continue
  result=int(aa)*int(bb);s=str(result)
  if len(s)==len(pattern)and all(x=='□'or x==y for x,y in zip(pattern,s)):out.append({'firstOperand':int(aa),'secondOperand':int(bb),'product':result,'inputDigits':list(map(int,digits)),'outputDigits':[int(y)for x,y in zip(pattern,s)if x=='□']})
 return one(out)
def masked_dividend(v):
 pattern,divisor=v;assert pattern.count('□')==1;d=int(divisor);out=[]
 for digit in range(10):
  s=pattern.replace('□',str(digit))
  if s[0]=='0':continue
  n=int(s)
  if n%d==0:out.append({'digit':digit,'dividend':n,'divisor':d,'quotient':n//d})
 return one(out)
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def divide(n,d):
  assert F(n).denominator==F(d).denominator==1 and min(n,d)>0;steps=C.long_division(n,d);p['euclideanSteps']+=steps;q,rem=divmod(int(n),int(d));assert rem==0;return F(q)
 def partial(a,b):assert a>0 and 10<=b<100;units=a*(b%10);tens=a*(b//10)*10;p['unitPartial']=str(units);p['tensPartial']=str(tens);p['fullProduct']=str(a*b);return units,tens
 if i in[0,1,3,4,12]:out=v[0]*v[1]
 elif i in[2,11]:a,b=v;u,t=partial(a,b);out=u if i==2 else t
 elif i==5:a,b,t=v;assert'қарама-қарсы'in r['statement'];out=(a+b)*t
 elif i==6:a,n,b,m=v;out=a*n+b*m
 elif i in[7,8,13]:m=masked_product(v);p['uniqueHiddenProduct']=m;out=m['product']if i==8 else m['firstOperand']
 elif i==9:
  a,b,u,wrong=v;units,tens=partial(a,b);assert u==units and wrong==tens/10;out=a*b-u-wrong;p['wrongRecordedTotal']=str(u+wrong)
 elif i==10:b,u=v;assert b%10>0;a=divide(u,b%10);partial(a,b);out=a*b;p['reconstructedFirstFactor']=str(a)
 elif i in[14,17,18,24]:out=divide(v[0],v[1])
 elif i in[15,16]:out=divide(v[1],v[0])
 elif i==19:total,per,shelves=v;count=divide(total,per);out=divide(count,shelves);p['filledShelfCount']=str(count)
 elif i==20:area,width=v;length=divide(area,width);out=2*(length+width);p['otherSide']=str(length);p['halfPerimeter']=str(length+width)
 elif i==21:t,s,new=v;speed=divide(s,t);out=divide(new,speed);p['speedMetresPerMinute']=str(speed)
 elif i==22:first,second,t,total=v;left=total-second*t;assert left>0;out=divide(left,first);p['firstLegDistance']=str(left);p['wholeTime']=str(out+t)
 elif i in[23,25]:m=masked_dividend(v);p['uniqueHiddenDividend']=m;divide(m['dividend'],m['divisor']);out=m['digit']
 elif i==26:n,total,new=v;price=divide(total,n);out=price*new;p['unitPrice']=str(price)
 else:raise AssertionError(i)
 assert F(out)>=0 and F(out).denominator==1;p['calculatedAnswer']=str(out);return out,p

def representation(s,i):
 s=s.replace('$','').replace('\\,','')
 for unit in['км/сағ','м²','сағ','м']:s=s.replace(unit,'')
 return E.calc(s)
def fmt(out,i):return str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(str,json.loads(ids['actual-inputs'].text)))==list(map(str,v))
 def txt(id):return''.join(ids[id].itertext())
 assert[txt('value-'+str(j))for j in range(len(v))]==list(map(str,v))
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in MUL+DIV:
  assert txt('operand-a')==str(v[0])and txt('operand-b')==str(v[1]);a,b=ids['operand-a'],ids['operand-b'];assert a.get('text-anchor')==b.get('text-anchor')=='end'and a.get('font-family')==b.get('font-family')=='monospace'
  if i in DIV:
   assert a.get('x')=='185'and b.get('x')=='300'and a.get('y')==b.get('y')=='60';assert[ids['division-vertical'].get(k)for k in['x1','y1','x2','y2']]==['210','30','210','140'];assert[ids['division-horizontal'].get(k)for k in['x1','y1','x2','y2']]==['210','78','320','78'];assert txt('quotient-unknown')=='?'
  else:
   assert a.get('x')==b.get('x')=='300'and a.get('y')=='60'and b.get('y')=='104'and txt('operator')=='×'
   if len(v)==3:assert txt('shown-result')==str(v[2])and ids['shown-result'].get('x')=='300'and ids['shown-result'].get('text-anchor')=='end'
 if i in[3,4,20]:
  a=v[0]/v[1]if i==20 else v[1]if i==3 else v[0];b=v[0]if i==3 else v[1];scale=min(280/a,125/b);el=ids['field'];assert abs(F(el.get('width'))-a*scale)<F(1,10**10)and abs(F(el.get('height'))-b*scale)<F(1,10**10)
  if i==3:
   assert sum(id.startswith('seat-col-')for id in ids)==a-1 and sum(id.startswith('seat-row-')for id in ids)==b-1
   for x in range(1,int(a)):el=ids['seat-col-'+str(x)];assert abs(F(el.get('x1'))-35-x*scale)<F(1,10**10)and el.get('x1')==el.get('x2')
   for y in range(1,int(b)):el=ids['seat-row-'+str(y)];assert abs(F(el.get('y1'))-30-y*scale)<F(1,10**10)and el.get('y1')==el.get('y2')
 if i==5:assert[ids['left-direction'].get(k)for k in['x1','x2']]==['170','45']and[ids['right-direction'].get(k)for k in['x1','x2']]==['190','315']
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 cr=copy.deepcopy(r);cr.pop('options',None);s=cr['statement']
 if i==7:s=s.replace('9□96','9□26')
 elif i==8:s=s.replace('8□29','8□99')
 elif i==9:s=s.replace('348','358').replace('2088','2148').replace('1044','1074')
 elif i==13:s=s.replace('1□258','1□488')
 elif i==23:s=s.replace('4□12','4□02')
 elif i==25:s=s.replace('5□04','5□12')
 else:s=None
 if s:
  cr['statement']=s;out,_=compute(cr,i);assert out!=representation(r['answer'],i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in[1,2,3,4,5,6,7,8,9,10,12,15,16,18,20,24,25,26,28,30,32,34,40,42,50,53,60,70,73,77,80,90,100,120,200,300,400,600,800,1000]:
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
   elif i in MUL+DIV:ids['operand-a'].text='999'
   elif i in[3,4,20]:ids['field'].set('width','999')
   elif i==5:ids['left-direction'].set('x2','300')
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'27 own SVGs rendered343px inspected,27 saved pictures inspected. All visible data, scaled rectangle sides,24 row32 column seats, column operands and corner division checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==36
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':27,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':27,'nativeSVGs':27,'actualInputMutationsChecked':27,'updatedHashWrongVisibleInputsRejected':27,'rehashedIncorrectDiagramsRejected':27,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':27,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
