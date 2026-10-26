"""20 full saved/new conditions official/new solutions and24 source/new
choices read.20 archived illustrations inspected;20 own isometric SVGs
previewed343px. Exact volumes, litres, water conservation, constructive packing
and volume upper bounds; every painted unit cube face independently enumerated.
Same author separate computational checker, not another human. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-volumes';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-shifts-sets.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
COUNTS=[3,3,3,4,3,3,3,3,3,3,4,3,3,3,6,4,4,6,3,3]
def parse(r,i,src=False):
 parts=H.math_parts(r['statement'],src);v=[]
 for t in parts:
  if not re.search(r'\d',t):continue
  if re.search(r'[a-zA-Z]',t):t=t.split('=')[-1]
  if len(v)<COUNTS[i]:v.append(E.calc(t))
 assert len(v)==COUNTS[i]
 if src and i in[4,6]:assert E.calc(parts[-1])==1
 return v

def painted(dims):
 a,b,c=map(int,dims);hist={n:0 for n in range(7)};witness=[]
 for x,y,z in itertools.product(range(a),range(b),range(c)):
  count=sum([x==0,x==a-1,y==0,y==b-1,z==0,z==c-1]);hist[count]+=1;witness.append([x,y,z,count])
 return hist,witness

def compute(r,i,src=False):
 v=parse(r,i,src);assert min(v)>0;p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def prod(a):return F(a[0])*a[1]*a[2]
 if i==0:out=4*sum(v)
 elif i in[1,7,9]:out=prod(v)
 elif i==2:out=prod(v)/2000;p['fullLitres']=str(prod(v)/1000);assert'жарты'in r['statement']
 elif i in[3,14]:
  large=[v[3]]*3 if i==3 else v[:3];small=v[:3]if i==3 else v[3:];counts=[a/b for a,b in zip(large,small)];assert all(n.denominator==1 for n in counts);out=prod(counts);upper=prod(large)/prod(small);assert out==upper;p['tilingAxisCounts']=list(map(str,counts));p['volumeUpperBound']=str(upper);p['allBoxOrigins']=[list(map(str,[F(x)*small[0],F(y)*small[1],F(z)*small[2]]))for x,y,z in itertools.product(*(range(int(n))for n in counts))]
 elif i in[4,6]:
  assert all(n.denominator==1 and n>=2 for n in v)and '1' in r['statement'];hist,w=painted(v);out=hist[2 if i==4 else 0];p['paintedFaceHistogram']=hist;p['everyUnitCube']=w
 elif i==5:a,b,c=v;out=2*(a+b)*c
 elif i==8:a,c,vol=v;out=vol/(a*c)
 elif i==10:a,b,c,litres=v;out=litres*1000/(a*b);assert out<=c;p['waterVolumeCubicCentimetres']=str(litres*1000)
 elif i in[11,19]:vol,a,b=v;out=vol/(a*b)
 elif i==12:out=prod(v)/2;assert'жарты'in r['statement']
 elif i==13:a,b,c=v;out=a*b+2*(a+b)*c;p['bottomArea']=str(a*b);p['wallArea']=str(2*(a+b)*c);p['wrongClosedSurface']=str(out+a*b)
 elif i==15:a,b,c,edge=v;assert edge<min(a,b,c);out=a*b*c-edge**3;p['removedVolume']=str(edge**3)
 elif i==16:a,b,c,level=v;assert level<c;out=a*b*(c-level)/1000;p['unfilledHeight']=str(c-level)
 elif i==17:a,b,c,d,e,f=v;out=a*b*c/(d*e);assert out<=f;p['conservedWaterVolume']=str(a*b*c)
 elif i==18:edge,a,b=v;out=edge**3/(a*b);p['conservedWaterVolume']=str(edge**3)
 else:raise AssertionError(i)
 assert out>=0 and F(out).denominator==1,('nonintegral',i,out);p['calculatedAnswer']=str(out);return out,p

def representation(s,i):
 s=s.replace('$','').replace('\\,','');s=re.sub(r'(?:см|дм|м)[²³]?|л','',s);return E.calc(s)
def fmt(out,i):return str(int(out))
def shapes(i,v):
 if i==3:return[v[:3],[v[3]]*3]
 if i in[14,17]:return[v[:3],v[3:]]
 if i==15:return[v[:3],[v[3]]*3]
 if i==18:return[[v[0]]*3,[v[1],v[2],v[0]]]
 if i==8:return[[v[0],F(5),v[1]]]
 if i==11:return[[F(6),v[2],v[1]]]
 if i==19:return[[v[1],v[2],F(5)]]
 return[v[:3]]
def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert list(map(F,json.loads(ids['actual-inputs'].text)))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[F(txt('value-'+str(j)))for j in range(len(v))]==v
 for j in range(len(v)):assert txt('input-'+str(j))
 dims=shapes(i,v);s=min(n for a,b,c in dims for n in[F(140 if len(dims)>1 else 295)/(a+F(45,100)*b),F(110)/(c+F(35,100)*b)])
 def same(points,expected):
  actual=[tuple(map(F,t.split(',')))for t in points.split()];assert len(actual)==len(expected);assert all(abs(a-b)<F(1,10**10)for x,y in zip(actual,expected)for a,b in zip(x,y))
 for k,(a,b,c)in enumerate(dims):
  ox=20+k*185 if len(dims)>1 else 30
  def p(x,y,z):return[ox+s*(x+F(45,100)*y),F(155)-s*(z+F(35,100)*y)]
  same(ids['front-'+str(k)].get('points'),[p(0,0,0),p(a,0,0),p(a,0,c),p(0,0,c)]);same(ids['side-'+str(k)].get('points'),[p(a,0,0),p(a,b,0),p(a,b,c),p(a,0,c)])
  if i in[2,10,12,13,16]:assert'top-'+str(k)not in ids;same(ids['open-bottom-'+str(k)].get('points'),[p(0,0,0),p(a,0,0),p(a,b,0),p(0,b,0)]);same(ids['open-rim'].get('points'),[p(0,0,c),p(0,b,c),p(a,b,c),p(a,0,c)])
  else:same(ids['top-'+str(k)].get('points'),[p(0,0,c),p(a,0,c),p(a,b,c),p(0,b,c)])
  if i in[2,12,16]:
   level=v[3]if i==16 else c/2;same(ids['water-'+str(k)].get('points'),[p(0,0,level),p(a,0,level),p(a,b,level),p(0,b,level)])
  if i in[4,6]:
   expected={}
   for x in range(1,int(a)):expected['front-x-'+str(x)]=[p(x,0,0),p(x,0,c)];expected['top-x-'+str(x)]=[p(x,0,c),p(x,b,c)]
   for y in range(1,int(b)):expected['side-y-'+str(y)]=[p(a,y,0),p(a,y,c)];expected['top-y-'+str(y)]=[p(0,y,c),p(a,y,c)]
   for z in range(1,int(c)):expected['front-z-'+str(z)]=[p(0,0,z),p(a,0,z)];expected['side-z-'+str(z)]=[p(a,0,z),p(a,b,z)]
   actual={id:e for id,e in ids.items()if any(id.startswith(prefix)for prefix in['front-x-','front-z-','side-y-','side-z-','top-x-','top-y-'])};assert set(actual)==set(expected)
   for id,points in expected.items():el=actual[id];assert all(abs(F(el.get(attr))-target)<F(1,10**10)for attr,target in zip(['x1','y1','x2','y2'],points[0]+points[1]))
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
 parts=H.math_parts(r['statement'],False)
 for j,old in enumerate(parts):
  for delta in[1,2,3,4,5,6,8,10,12,15,16,20,24,25,30,40,48,50,60,80,100,120,200,300,400,600,1000]:
   cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=cr['statement'].replace('«'+old+'»','«'+str(int(old)+delta)+'»',1)
   try:
    out,_=compute(cr,i)
    if out!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr
   except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20;entries=[];evidence=[];choices=0;exact=0;remainders=0
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
   else:ids['front-0'].set('points','999,999 1,1 2,2 3,3')
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'20 own SVGs rendered343px inspected,20 saved pictures inspected. Actual visible dimensions, common-scale isometric face coordinates, all grid lines, water planes and open top checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==24
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':20,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':20,'nativeSVGs':20,'actualInputMutationsChecked':20,'updatedHashWrongVisibleInputsRejected':20,'rehashedIncorrectGeometryRejected':20,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':20,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
