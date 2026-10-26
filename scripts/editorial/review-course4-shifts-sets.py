"""All37 full saved/new conditions official/new solutions and48 source/new
choices read.36 source rasters inspected; source21 unavailable with complete
nested packing givens in text.37 own native SVGs inspected343px. Exact unit
conversion, floor/ceiling/topping-up, Euclidean remainders, separately allocated
boxes and all nonnegative disjoint Venn regions independently checked.
Same author separate computational checker, not another human. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-shifts-sets';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-multiply-parity.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one

def parse(r,i,src=False):
 t=H.math_parts(r['statement'],src)
 if i==0:
  if src:assert t[0]==t[-1]and t[1]=='1'
  return[E.calc(t[0])]
 if i==11:assert len(set(t))==1;return[E.calc(t[0])]
 if i==19:
  if src:assert t[2]=='1'and E.calc(t[3].lstrip('= '))==1000
  return list(map(E.calc,t[:2]))
 if i==28:assert all(x in['A','B']or re.search(r'\d',x)for x in t);t=[x for x in t if x not in['A','B']]
 return list(map(E.calc,t))
def integer(x):assert F(x).denominator==1;return int(x)
def ceilq(n,d):return(integer(n)+integer(d)-1)//integer(d)
def membership(a,b):return'шеңберлердің ортақ бөлігінде'if a and b else'тек сол жақ шеңберде'if a else'тек оң жақ шеңберде'if b else'екі шеңберден де тыс'
def money(s):
 s=s.replace('$','').replace('\\,','');parts=re.findall(r'(\d+)\s*(теңге|тиын|руб\.?|коп\.?)',s);assert parts;return F(sum(int(n)*(1 if u in['тиын','коп','коп.']else 100)for n,u in parts))
def length_mm(s):
 parts=re.findall(r'(\d+)\s*(мм|см|км|м)\b',s.replace('$','').replace('\\,',''));assert parts;return F(sum(int(n)*{'мм':1,'см':10,'м':1000,'км':1000000}[u]for n,u in parts))
def representation(s,i):
 if i==6:return length_mm(s)
 if i==9:return money(s)
 if i==14:return C.C.C.units(s,'grams')
 if i==23:return list(map(int,re.findall(r'\d+',s)))
 if i in[30,34]:return s.strip()
 return E.calc(re.sub(r'\b(?:кг|теңге)\b','',s.strip('$ ')))
def fmt(out,i):
 if i==6:return str(integer(out))+' мм'
 if i==9:n=integer(out);return f'{n//100} теңге {n%100} тиын'
 if i==14:n=integer(out);return f'{n//1000} кг {n%1000} г'
 if i==23:return str(out[0])+' қап, '+str(out[1])+' г'
 if i in[30,34]:return out
 return str(integer(out))

def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v)),'euclideanSteps':[]}
 def divide(n,d):
  n,d=integer(n),integer(d);assert n>=0 and d>0;q,rem=divmod(n,d);p['euclideanSteps'].append({'dividend':n,'divisor':d,'quotient':q,'remainder':rem});return q,rem
 def cells(total,a,b,both,neither):
  regions=[a-both,b-both,both,neither];assert min(regions)>=0 and sum(regions)==total;p['fourDisjointVennRegions']=list(map(str,regions));return regions
 if i==0:out=v[0]*100
 elif i in[1,11]:out=v[0]*1000
 elif i==2:out=v[0]*v[1]
 elif i==3:out=v[0]/1000
 elif i==4:out=v[0]*v[1]
 elif i==5:out=v[0]*100+v[1]
 elif i==6:out=v[0]*1000/v[1]
 elif i==7:a,n,b,m=v;out=a*n+b*m
 elif i==8:roll,n,piece=v;out=roll*n*100/piece
 elif i==9:eur,c,other=v;assert 0<=c<100;out=eur*100+c+other
 elif i==10:tonnes,bag,vehicle=v;bags=v[0]*1000/bag;assert bags.denominator==1;out=bags/vehicle
 elif i==12:boxes,n,groups=v;out=boxes*n/groups
 elif i==13:cm,m=v;out,rem=divide(cm,m*100)
 elif i==14:grams=one(v);divide(grams,1000);out=grams
 elif i==15:size,bundles,rem=v;assert 0<=rem<size;out=size*bundles+rem;divide(out,size)
 elif i==16:total,size=v;q,rem=divide(total,size);assert rem>0;out=size-rem;assert(total+out)%size==0
 elif i in[17,24]:
  size,total=v if i==17 else[v[1],v[0]];divide(total,size);out=ceilq(total,size);assert(out-1)*size<total<=out*size
 elif i==18:denom,total=v;out,rem=divide(total,denom)
 elif i==19:ml,litre=v;out,rem=divide(ml,litre*1000)
 elif i==20:size,*groups=v;allCounts=[]
 elif i==21:total,perBox,perCrate=v;boxes,_=divide(total,perBox);_,out=divide(boxes,perCrate);divide(total,perBox*perCrate)
 elif i==22:a,surplus,b,short=v;assert b>a and min(surplus,short)>0;children=(surplus+short)/(b-a);assert children.denominator==1;out=children*a+surplus;assert children*b-out==short;p['children']=str(children)
 elif i==23:grams,kg=v;q,rem=divide(grams,kg*1000);out=[q,rem]
 elif i==25:a,b,both=v;assert both<=min(a,b);out=a-both;p['threeKnownVennRegions']=list(map(str,[a-both,b-both,both]))
 elif i in[26,32,36]:total,a,b,neither=v;both=a+b-total+neither;regions=cells(total,a,b,both,neither);out=regions[0]if i==32 else both
 elif i in[27,29,35]:total,a,b=v;both=a+b-total;regions=cells(total,a,b,both,0);out=regions[0]if i==27 else both
 elif i==28:
  start,end,a,b=map(integer,v);assert 1<=start<=end and min(a,b)>0;actual=[[n,n%a==0,n%b==0]for n in range(start,end+1)];out=sum(not x and not y for n,x,y in actual);p['allActualNaturalNumberMemberships']=actual
 elif i==30:divisor,n=v;out=membership(n%2==0,n%divisor==0);p['membershipFlags']=[n%2==0,n%divisor==0]
 elif i==31:total,a,b,both=v;neither=total-a-b+both;cells(total,a,b,both,neither);out=neither
 elif i==33:
  total,a,b=map(integer,v);allRegions=[]
  for both in range(min(a,b)+1):
   regions=[a-both,b-both,both,total-a-b+both]
   if min(regions)>=0:allRegions.append(regions)
  assert allRegions;out=min(c[2]for c in allRegions);p['allFeasibleDisjointRegionCounts']=allRegions
 elif i==34:divisor,n=v;out=membership(n%divisor==0,n%2==0);p['membershipFlags']=[n%divisor==0,n%2==0]
 else:raise AssertionError(i)
 if i==20:
  for n in groups:divide(n,size);allCounts.append(ceilq(n,size))
  out=sum(allCounts);p['separateGroupCeilings']=allCounts;p['invalidPooledShortcut']=ceilq(sum(groups),size);assert out>p['invalidPooledShortcut']
 if i not in[23,30,34]:assert F(out).denominator==1 and out>=0
 p['calculatedAnswer']=json.loads(json.dumps(out,default=str));return out,p

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out)
 opts=C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len({str(x)for x in vals})==4 and sum(x==out for x in vals)==1;p['allActualOptions']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+(?:\s*=\s*\d+)*',r['solution']):
   vals=[E.calc(s.replace('−','-'))for s in chain.split('=')];assert len(set(vals))==1,('badPrintedArithmetic',i,chain)
 return p

def figure(r,i,v,data=None):
 raw=data if data is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());meta=json.loads(ids['actual-inputs'].text);assert list(map(F,meta))==v
 def txt(id):return''.join(ids[id].itertext())
 assert[F(txt('input-'+str(j)))for j in range(len(v))]==v
 if i>=25:
  a,b=ids['set-A'],ids['set-B'];assert a.tag.endswith('circle')and b.tag.endswith('circle');ra,rb=F(a.get('r')),F(b.get('r'));dx=F(a.get('cx'))-F(b.get('cx'));dy=F(a.get('cy'))-F(b.get('cy'));assert(ra-rb)**2<dx*dx+dy*dy<(ra+rb)**2
  labels=['×'+str(int(v[2])),'×'+str(int(v[3]))]if i==28 else['Жұп','×'+str(int(v[0]))]if i==30 else['×'+str(int(v[0])),'Жұп']if i==34 else['Бірінші топ','Екінші топ'];assert[txt('set-A-label'),txt('set-B-label')]==labels
  universe=ids['universe'];x,y,w,h=map(F,[universe.get(k)for k in['x','y','width','height']]);assert x<=F(a.get('cx'))-ra and F(b.get('cx'))+rb<=x+w and y<=F(a.get('cy'))-ra and F(a.get('cy'))+ra<=y+h
 if i==0:assert len([id for id in ids if id.startswith('coin-')and not id.startswith('coin-label-')])==v[0]
 if i==6:
  marks=[e for id,e in ids.items()if id.startswith('mark-')];assert len(marks)==v[1]-1
  for j in range(1,int(v[1])):e=ids['mark-'+str(j)];assert F(e.get('x1'))==30+F(j*300,int(v[1]))and e.get('x1')==e.get('x2')and e.get('y1')=='36'and e.get('y2')=='66'
 return True

def changed(r,i):
 found=None;parts=H.math_parts(r['statement'],False);indexes=[1]if i==18 else range(len(parts))
 for j in indexes:
  old=parts[j]
  for delta in[1,2,3,4,5,6,7,10,20,50,100,1000]:
   cr=copy.deepcopy(r);cr['statement']=cr['statement'].replace('«'+old+'»','«'+str(int(old)+delta)+'»',1);cr.pop('options',None)
   try:
    out,p=compute(cr,i)
    if out!=representation(r['answer'],i):found=cr;break
   except(AssertionError,ValueError,ZeroDivisionError):continue
  if found:break
 assert found,('validMutation',i);cr=found;cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];return cr

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==37;entries=[];evidence=[];choices=0;exact=0;remainders=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert q['solution'];opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};ids['input-0'].text='999';wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
  try:figure(bad,i,parse(r,i),wrong)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('rehashedVisibleCorruptionAccepted',i))
  if i>=25:
   tree=ET.fromstring(raw);circle=next(e for e in tree.iter()if e.get('id')=='set-B');circle.set('cx','500');wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
   try:figure(bad,i,parse(r,i),wrong)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('rehashedDisjointCirclesAccepted',i))
   proof['rehashedIncorrectVennGeometryRejected']=True
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:vals=[N.exact_power_arithmetic(s)for s in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   if len(set(vals))!=1:
    assert len(vals)==2 and any(F(step['dividend'],step['divisor'])==vals[0]and step['quotient']==vals[1]and step['remainder']>0 for step in src['euclideanSteps']),('sourceNonexactWithoutRemainder',i,expr);remainders+=1
   else:exact+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'37 own SVGs rendered343px inspected;36 archived illustrations inspected, one missing has complete nested-packing text. All visible inputs,12 coin pictograms,100 ribbon pieces and12 Venn intersections/containment labels checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==48
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':37,'sourceOptionsRead':48,'rewrittenOptionsRead':48,'sourceIllustrationsInspected':36,'unavailableSourceWithCompleteText':1,'nativeSVGs':37,'actualInputMutationsChecked':37,'updatedHashWrongVisibleInputsRejected':37,'rehashedInvalidVennGeometryRejected':12,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':37,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
