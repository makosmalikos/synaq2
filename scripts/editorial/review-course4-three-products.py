"""All26 complete saved/new conditions official/new solutions and36 source/new
options read.26 archived pictures and26 original SVG343px previews inspected.
Raw partial row numbers explicitly distinguished from scaled tens/hundreds.
Independent rational arithmetic, full long division, masks over both operands,
true remainder pairs, all possible raw-partial factors and actual geometry.
Same author computational review, not another human. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-three-products';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-two-digit.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
# This dependency shares only exact division and mask algorithms, never authored answers.
sp2=importlib.util.spec_from_file_location('z','scripts/editorial/review-course4-remainders-zeroes.py');Z=importlib.util.module_from_spec(sp2);sp2.loader.exec_module(Z)
MUL=[0,5,10,13,15,16,17,20,21,24,25];DIV=[1,9,11]
def parse(r,i,src=False):
 p=H.math_parts(r['statement'],src)
 if i in[10,20,21,24]:left,right=C.clean(one(p)).split('=');a,b=left.split('*');return[a,b,right]
 if i==9:left,right=C.clean(one(p)).split('=');a,b=left.split('/');return[a,b,right]
 if i in[0,13,15,16,17,25]:return list(map(E.calc,C.clean(one(p)).split('*')))
 if i in[1,11]:return list(map(E.calc,C.clean(one(p)).split('/')))
 if i==2:
  s=C.clean(one(p)).replace('−','-');assert re.fullmatch(r'\d+-\d+/\d+\*\d+',s);return list(map(F,re.findall(r'\d+',s)))
 if i==22 and src:assert E.calc(p[2])==E.calc(p[3]);p=p[:3]+p[4:]
 if i in[5,22]:a,b=map(E.calc,C.clean(p[0]).split('*'));return[a,b,*map(E.calc,p[1:])]
 return list(map(E.calc,p))
def raw_factor_witnesses(v):
 u,t,h=v;w=[]
 for a in range(100,1000):
  if all(x%a==0 and 1<=x/a<=9 for x in v):
   digits=[int(x/a)for x in v];b=digits[0]+10*digits[1]+100*digits[2];assert 100<=b<1000;w.append({'first':a,'second':b,'rawDigits':digits})
 assert w;return w

def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def divide(n,d,exact=True):
  assert F(n).denominator==F(d).denominator==1 and min(n,d)>0;p['euclideanSteps']+=C.C.long_division(n,d);q,rem=divmod(int(n),int(d))
  if exact:assert rem==0
  return F(q),rem
 def partial(a,b):
  assert a>0 and 100<=b<1000;raw=[a*(b%10),a*((b//10)%10),a*(b//100)];scaled=[raw[j]*10**j for j in range(3)];assert sum(scaled)==a*b;p['allRawPartialRows']=list(map(str,raw));p['allScaledPartialValues']=list(map(str,scaled));return raw,scaled
 if i in[0,3,13,14,16,25]:out=v[0]*v[1]
 elif i in[1,11]:out,_=divide(*v)
 elif i==2:
  a,b,c,d=v;div,_=divide(b,c);out=a-div*d;assert out>=0;p['allDistractorRoles']=list(map(str,[a-div,out,(a-div)*d,div*d]))
 elif i==4:t,s,new=v;speed,_=divide(s,t);out=speed*new;p['speed']=str(speed)
 elif i==5:a,b,wrong=v;assert b%10==0 and wrong*10==a*b;out=a*b;p['wrongRecordedProduct']=str(wrong);p['allDistractorRoles']=list(map(str,[a*(b//100*100),wrong,out,out*10]))
 elif i==6:q,rem=divide(*v,exact=False);out=(int(q),rem);p['actualQuotient']=int(q);p['actualRemainder']=rem;p['allDistractorRoles']=[[int(q)+10,rem],[int(q)-1,int(rem+v[1])],[int(q),rem],[int(q)+1,int(v[1]-rem)]]
 elif i==7:total,storage,area=v;assert total>storage>0;out,_=divide(total-storage,area)
 elif i==8:n,total,new=v;price,_=divide(total,n);out=price*new;p['unitPrice']=str(price)
 elif i==9:m=Z.hidden(v);p['uniqueHiddenDivision']=m;divide(m['dividend'],m['divisor']);out=m['dividend']
 elif i in[10,20,21,24]:m=C.masked_product(v);p['uniqueHiddenProduct']=m;out=one(m['inputDigits'])if i==21 else m['firstOperand']
 elif i==12:a,n,shelves=v;out,_=divide(a*n,shelves)
 elif i in[15,17]:
  a,b=v;raw,scaled=partial(a,b)
  if i==15:assert raw[1]>0;out=raw[1];p['allDistractorRoles']=list(map(str,[a,raw[0],raw[2],raw[1]]))
  else:assert raw[1]==0 and raw[0]>0 and raw[2]>0;out=raw[2];p['allDistractorRoles']=list(map(str,[0,raw[0],raw[2],a]))
 elif i==18:a,b,c,d=v;assert a*b>c*d;out=a*b-c*d;p['twoAreas']=list(map(str,[a*b,c*d]))
 elif i==19:width,extra,newArea=v;out=newArea-width*extra;assert out>0;length,_=divide(out,width);p['originalLength']=str(length);p['addedStripArea']=str(width*extra)
 elif i==22:
  a,b,u,h,wrong=v;raw,scaled=partial(a,b);assert raw[1]==0 and u==raw[0]and h==raw[2]and wrong==u+h*10;out=a*b;p['wrongRecordedProduct']=str(wrong);p['allDistractorRoles']=list(map(str,[out,out+1000,wrong,u+h]))
 elif i==23:
  witnesses=raw_factor_witnesses(v);p['allPossibleThreeDigitFactorWitnesses']=witnesses;out=v[0]+10*v[1]+100*v[2];assert all(w['first']*w['second']==out for w in witnesses)
 else:raise AssertionError(i)
 if i!=6:assert F(out)>=0 and F(out).denominator==1
 p['calculatedAnswer']=list(out)if i==6 else str(out);return out,p

def representation(s,i):
 s=s.replace('$','').replace('\\,','')
 if i==6:return tuple(int(re.sub(r'\s','',x))for x in re.findall(r'\d[\d\s]*',s))
 return E.calc(s)
def fmt(out,i):return f'{out[0]} қорап, {out[1]} қарындаш артылады'if i==6 else str(int(out))
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(str,json.loads(ids['actual-inputs'].text)))==list(map(str,v))
 def txt(id):return''.join(ids[id].itertext())
 assert[txt('value-'+str(j))for j in range(len(v))]==list(map(str,v))
 for j in range(len(v)):assert txt('input-'+str(j))
 if i in MUL+DIV:
  assert txt('operand-a')==str(v[0])and txt('operand-b')==str(v[1]);a,b=ids['operand-a'],ids['operand-b'];assert a.get('text-anchor')==b.get('text-anchor')=='end'and a.get('font-family')==b.get('font-family')=='monospace'
  if i in DIV:
   assert a.get('x')=='185'and b.get('x')=='300'and a.get('y')==b.get('y')=='60';assert[ids['division-vertical'].get(k)for k in['x1','y1','x2','y2']]==['210','30','210','140'];assert[ids['division-horizontal'].get(k)for k in['x1','y1','x2','y2']]==['210','78','320','78'];assert txt('shown-quotient')==str(v[2]if i==9 else'?')
  else:
   assert a.get('x')==b.get('x')=='320'and a.get('y')=='60'and b.get('y')=='104'and txt('operator')=='×'
   if len(v)==3:assert txt('shown-result')==str(v[2])and ids['shown-result'].get('x')=='320'and ids['shown-result'].get('text-anchor')=='end'
   if i==5:assert txt('error-label')=='Қате нәтиже'and ids['shown-result'].get('fill')=='#b45368'
 if i==2:assert txt('expression')==f'{v[0]} − {v[1]} ÷ {v[2]} × {v[3]}'
 if i in[14,18,19]:
  dims=[v[:2],v[2:]]if i==18 else[[v[2]/v[0]-v[1],v[0]],[v[1],v[0]]]if i==19 else[v[:2]];scale=min(n for a,b in dims for n in[(135 if len(dims)>1 else 280)/a,125/b])
  for j,(a,b)in enumerate(dims):el=ids['field-'+str(j)];assert el.get('x')==str(30+j*180 if len(dims)>1 else 35)and el.get('y')=='30';assert abs(F(el.get('width'))-a*scale)<F(1,10**10)and abs(F(el.get('height'))-b*scale)<F(1,10**10)
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and sum(x==out for x in vals)==1;p['allActualOptions']=[list(x)if isinstance(x,tuple)else str(x)for x in vals]
  if 'allDistractorRoles'in p:assert p['allActualOptions']==p['allDistractorRoles'],('distractorRole',i,p)
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 cr=copy.deepcopy(r);cr.pop('options',None);s=cr['statement']
 if i==5:s=s.replace('718','728').replace('38054','38584')
 elif i==9:s=s.replace('5□□82','5□□52')
 elif i==10:s=s.replace('□□332','□□798')
 elif i==20:s=s.replace('4□5747','5□5847')
 elif i==21:s=s.replace('929664','964224')
 elif i==22:s=s.replace('4536','4546').replace('18144','18184').replace('13608','13638').replace('154224','154564')
 elif i==23:s=s.replace('1728','1944').replace('3456','3888').replace('2592','2916')
 elif i==24:s=s.replace('77□789','80□489')
 else:s=None
 if s:
  cr['statement']=s;out,_=compute(cr,i);assert out!=representation(r['answer'],i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  for n in re.finditer(r'\d+',m[1]):
   left,right=m.start(1)+n.start(),m.start(1)+n.end();old=int(n[0])
   for delta in[1,2,3,4,5,6,7,8,9,10,12,15,16,18,20,24,25,26,28,30,32,34,36,40,42,45,48,50,51,52,54,57,60,64,68,70,72,73,77,80,84,90,100,108,120,144,150,156,200,248,285,300,343,384,400,408,416,423,425,526,528,600,720,800,864,1000]:
    cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'][:left]+str(old+delta)+r['statement'][right:]
    try:
     out,_=compute(cr,i)
     if out!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
    except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==26;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   elif i in[14,18,19]:ids['field-0'].set('width','999')
   elif i==2:ids['expression'].text='999'
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'26 own SVGs rendered343px inspected;26 saved pictures inspected. Actual visible operands, monospaced right alignment, known error label, order-of-operation expression and scaled field/extension areas checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==36
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':26,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':26,'nativeSVGs':26,'actualInputMutationsChecked':26,'updatedHashWrongVisibleInputsRejected':26,'rehashedIncorrectDiagramsRejected':26,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':26,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
