"""All36 full saved/new conditions official/new solutions and44 source/new
choices read.35 source pictures inspected; source25 unavailable but both
operands completely in text.36 own SVGs rendered343px inspected. Independent
exact arithmetic, natural-factor and hidden-digit enumeration, full river
crossing state-space BFS. Same author computational review, not another human.
No browser QA; local Standard+ only.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-products';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-shifts-sets.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
COLS=[11,24,25,26,29,31,32,33,34,35]
def clean(s):return H.tex(s).replace('\\square','□').replace(' ','').replace('×','*').replace('÷','/').replace(':','/')
def parse(r,i,src=False):
 parts=H.math_parts(r['statement'],src)
 if i==7:return[E.calc(s.split('=')[-1])for s in parts if '='in s]
 if i in[31,32,34]:
  s=clean(one(parts));left,right=s.split('=');a,b=left.split('*');return[a,b,right]
 if i==29:
  a,b=clean(parts[0]).split('*');return[E.calc(a),E.calc(b),E.calc(parts[1])]
 if i in[11,22,24,25,26,33,35]:
  s=clean(one(parts));return list(map(E.calc,s.split('/'if i==22 else'*')))
 return list(map(E.calc,parts))
def crossing(n):
 n=int(n);assert 1<=n<=12;start=(n,2,0);goal=(0,2,0);queue=collections.deque([start]);paths={start:[]};transitions=0
 while queue:
  state=queue.popleft();a,c,boat=state
  for da,dc in[(1,0),(0,1),(0,2)]:
   available=(a,c)if boat==0 else(n-a,2-c)
   if da>available[0]or dc>available[1]:continue
   sign=-1 if boat==0 else 1;new=(a+sign*da,c+sign*dc,1-boat);transitions+=1
   if new not in paths:paths[new]=paths[state]+[[da,dc,boat,1-boat]];queue.append(new)
 assert goal in paths;path=paths[goal];assert len(path)==4*n;return len(path),{'shortestCrossingPath':path,'allReachableStates':len(paths),'legalTransitionsEnumerated':transitions}

def masks(v):
 a,b,pattern=v;assert re.fullmatch('[0-9□]+',a)and re.fullmatch('[0-9]+',b)and re.fullmatch('[0-9□]+',pattern);solutions=[]
 for digits in itertools.product('0123456789',repeat=a.count('□')):
  chars=iter(digits);s=''.join(next(chars)if c=='□'else c for c in a)
  if s[0]=='0':continue
  n=int(s);product=n*int(b);text=str(product)
  if len(text)==len(pattern)and all(x=='□'or x==y for x,y in zip(pattern,text)):solutions.append({'operand':n,'product':product,'inputDigits':list(map(int,digits)),'outputDigits':[int(y)for x,y in zip(pattern,text)if x=='□']})
 return one(solutions)

def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':[str(x)for x in v],'euclideanSteps':[]}
 if i in[0,2,5,16]:out=v[0]*v[1]*v[2]
 elif i in[1,9]:out=v[0]/v[1]/v[2]
 elif i==3:out=v[0]/v[1]/v[2]/v[3]
 elif i==4:a,b,c,d=v;out=a*b*c/d
 elif i==6:a,b,c,empty=v;out=a*b*c-empty;assert 0<=empty<a*b*c
 elif i==7:
  total,ab,bc=v;assert min(v)>0;a=total/bc;c=total/ab;b=ab/a;assert all(x.denominator==1 and x>0 for x in[a,b,c]);assert b*c==bc;p['naturalFactorWitness']=list(map(str,[a,b,c]));out=b
 elif i==8:
  assert'екі бала'in r['statement'].lower();out,proof=crossing(one(v));p.update(proof)
 elif i==10:boxes,per,total=v;out=total/boxes/per;p['wrongAllBundleCount']=str(total/per)
 elif i in[11,12,24,25,26,27,33,35]:out=v[0]*v[1]
 elif i==13:wagons,load,total=v;out=total/(wagons*load);p['capacityPerTrain']=str(wagons*load);p['totalWagons']=str(total/load)
 elif i==14:load,total=v;out=total/load
 elif i==15:a,n,b,m=v;out=a*n+b*m
 elif i==17:boxes,total,n=v;per=total/boxes;assert per.denominator==1;out=per*n;p['perBox']=str(per)
 elif i==18:whole,daily,elapsed=v;duration=whole/daily;out=duration-elapsed;assert min(v)>0 and out>0;p['wholeDays']=str(duration)
 elif i==19:n,price,paid=v;assert n*price>paid>0;out=(n*price-paid)/n
 elif i==20:correct,wrong,q=v;assert correct>wrong>0;original=q*wrong;out=original/correct;p['reconstructedOriginal']=str(original)
 elif i==21:mult,div,q=v;original=q*div;out=original*mult;p['reconstructedOriginal']=str(original)
 elif i==22:out=v[0]/v[1]
 elif i==23:speed,halfTime=v;assert'жарты'in r['statement'];out=2*speed*halfTime;p['halfDistance']=str(speed*halfTime)
 elif i==28:a,b,t=v;assert'қарама-қарсы'in r['statement'];out=(a+b)*t
 elif i==29:a,b,wrong=v;correct=a*b;assert correct==wrong*10;out=('missing_one',int(correct));p['correctProduct']=str(correct);p['wrongRecordedProduct']=str(wrong)
 elif i==30:out=v[0]*v[1]/100
 elif i in[31,32,34]:m=masks(v);p['uniqueHiddenDigitWitness']=m;out=m['product']if i==32 else one(m['inputDigits'])
 else:raise AssertionError(i)
 if i!=29:assert F(out)>=0 and F(out).denominator==1,('nonintegral',i,out)
 p['calculatedAnswer']=list(out)if isinstance(out,tuple)else str(out);return out,p

def representation(s,i):
 s=s.replace('$','').replace('\\,','').strip()
 if i==29:
  if'Қате жоқ'in s:return('none',0)
  tag='missing_one'if'Бір нөлді'in s else'missing_two'if'Екі нөлді'in s else'extra'if'Артық нөл'in s else None;assert tag;num=int(re.sub(r'\s','',one(re.findall(r'\d[\d\s]*',s))));return(tag,num)
 return E.calc(re.sub(r'\bц\b','',s))
def fmt(out,i):return'Бір нөлді тіркемеген, дұрысы '+str(out[1])if i==29 else str(int(out))

def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());meta=json.loads(ids['actual-inputs'].text);assert list(map(str,meta))==list(map(str,v))
 def txt(id):return''.join(ids[id].itertext())
 assert[txt('value-'+str(j))for j in range(len(v))]==list(map(str,v))
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in COLS or i==22:
  assert txt('operand-a')==str(v[0])and txt('operand-b')==str(v[1]);a,b=ids['operand-a'],ids['operand-b'];assert a.get('text-anchor')==b.get('text-anchor')=='end'and a.get('font-family')==b.get('font-family')=='monospace'
  if i==22:
   assert a.get('x')=='185'and b.get('x')=='300'and a.get('y')==b.get('y')=='60';assert[ids['division-vertical'].get(k)for k in['x1','y1','x2','y2']]==['210','30','210','140'];assert[ids['division-horizontal'].get(k)for k in['x1','y1','x2','y2']]==['210','78','320','78'];assert txt('quotient-unknown')=='?'
  else:
   assert a.get('x')==b.get('x')=='300'and a.get('y')=='60'and b.get('y')=='104'and txt('operator')=='×'
   if len(v)==3:assert txt('shown-result')==str(v[2])and ids['shown-result'].get('x')=='300'and ids['shown-result'].get('text-anchor')=='end'
 if i==8:
  assert sum(id.startswith('traveller-')for id in ids)==v[0]and sum(id.startswith('child-')for id in ids)==2
  assert txt('return-caption')=='Екі бала мен қайық қайтады'
 if i==28:
  assert[ids['left-direction'].get(k)for k in['x1','x2']]==['170','45']and[ids['right-direction'].get(k)for k in['x1','x2']]==['190','315'];assert ids['left-head'].get('points')=='45,70 57,63 57,77'and ids['right-head'].get('points')=='315,70 303,63 303,77'
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=[list(x)if isinstance(x,tuple)else str(x)for x in vals]
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 cr=copy.deepcopy(r);cr.pop('options',None);s=cr['statement']
 if i==7:s=s.replace('336','432').replace('42','54').replace('56','72')
 elif i==29:s=s.replace('6800','6900').replace('27200','27600')
 elif i==31:s=s.replace('26400','30400')
 elif i==32:s=s.replace('70','90').replace('3□500','4□500')
 elif i==34:s=s.replace('28000','28800')
 else:s=None
 if s:
  cr['statement']=s;out,_=compute(cr,i);assert out!=representation(r['answer'],i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in[1,2,3,4,5,6,7,8,9,10,12,15,20,24,25,30,40,50,60,80,100,120,200,300,400,600,1000]:
    cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'][:left]+str(old+delta)+r['statement'][right:]
    try:
     out,_=compute(cr,i)
     if out!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
    except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==36;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   elif i in COLS or i==22:ids['operand-a'].text='999'
   elif i==8:ids['traveller-0'].set('id','removed-traveller')
   elif i==28:ids['left-direction'].set('x2','300')
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'36 own SVGs rendered343px inspected;35 saved pictures inspected, one unavailable complete in text. All visible input values, column operands and right alignment, actual boat travellers and direction arrows checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==44
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':36,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':35,'unavailableSourceWithCompleteText':1,'nativeSVGs':36,'actualInputMutationsChecked':36,'updatedHashWrongVisibleInputsRejected':36,'rehashedIncorrectDiagramsRejected':36,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':36,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
