"""33 saved grade4 source/new full conditions, official/new solutions, all44
source/new choices read.32 archived illustrations inspected, one missing source
illustration reconstructed from complete textual givens. Own33 native SVGs
inspected at343px. Actual printed inputs independently solved; same author,
separate computational checker, not a second human review. No browser QA.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-place-visual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-logic-sequences.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one
K=['scale-forward','unit-price','lesson-breaks','overnight-clock','venn-both','limited-colour-counts','scale-reverse','route-product','successor','expanded-number','largest-digits','three-lengths-sum','descending-numbers','regroup-hundreds','minimum-digit-inequality','descending-digit-sum','concatenated-position','odd-cycle-pair-sums','smallest-six-digits','repunit-sum','all-thousands','all-hundreds','successor','round-hundred','rounded-thousands-difference','sum-round-hundred-thousand','multiply-nine','classes-all-hundreds','successive-rounding','smallest-round-hundred','rounding-digit-sum','round-hundred','successor']
def clock_minutes(s):
 s=s.strip("$ ").replace("{", "").replace("}", "");m=re.fullmatch(r"(\d{1,2}):(\d{2})",s);assert m;h,minute=map(int,m.groups());assert 0<=minute<60;return 60*h+minute
def integer(x):
 v=E.calc(x);assert v.denominator==1;return int(v)
def tokens(r,src=False):return H.math_parts(r['statement'],src)
def rnd(n,u):assert n>=0;return(n+u//2)//u*u
def minimum(ds):
 assert all(0<=d<=9 for d in ds);return min(int(''.join(map(str,p)))for p in set(itertools.permutations(ds))if p[0])
def parse(r,i,src=False):
 t=tokens(r,src);k=K[i]
 if i==3:return[str(clock_minutes(t[0])),*map(integer,t[1:])]
 if i in[9,19]:return[integer(v)for v in t[0].split('+')]
 if i==14:return[re.sub(r'\s+','',H.tex(t[0]).replace('\\square','□'))]
 if i==30:return[re.sub(r'\s+','',H.tex(t[0]).replace('\\square','□')),integer(t[1])]
 if i==16:return[integer(t[0]),integer(t[-1])]
 if i in[22,32]:return[integer(t[0]),integer(t[1])]
 if i==26:
  expr=H.tex(t[0]).replace('×','*');factors=re.split(r'[*·]',expr);return[*map(integer,factors),integer(t[1])]
 return list(map(integer,t))
def compute(v,i,src=False):
 k=K[i];p={'actualPrintedInputs':v,'method':k}
 if k=='scale-forward':assert v[0]==1;out=v[1]*v[2]
 elif k=='scale-reverse':assert v[0]==1 and v[2]%v[1]==0;out=v[2]//v[1]
 elif k=='unit-price':assert v[1]%v[0]==0;p['onePrice']=v[1]//v[0];out=p['onePrice']*v[2]
 elif k=='lesson-breaks':d,b,n=v if src else[v[1],v[2],v[0]];assert n>=2;p['lessons']=n*d;p['breaks']=(n-1)*b;out=p['lessons']+p['breaks']
 elif k=='overnight-clock':departure,h,m=map(int,v);arrival=departure+60*h+m;assert 1440<=arrival<2880;out=f'{arrival//60%24}:{arrival%60:02d}';p['absoluteArrivalMinutes']=arrival
 elif k=='venn-both':n,a,b,neither=v;out=a+b-(n-neither);p['disjointCounts']=[a-out,b-out,out,neither];assert min(p['disjointCounts'])>=0 and sum(p['disjointCounts'])==n
 elif k=='limited-colour-counts':a,b,n=v;p['allColourCountPairs']=[[x,n-x]for x in range(a+1)if 0<=n-x<=b];out=len(p['allColourCountPairs'])
 elif k=='route-product':p['allRoutes']=list(itertools.product(range(v[0]),range(v[1])));out=len(p['allRoutes'])
 elif k=='successor':out=v[0]+1;assert len(v)==1 or v[1]==1
 elif k in['expanded-number','three-lengths-sum','repunit-sum']:out=sum(v)
 elif k=='largest-digits':out=max(int(''.join(map(str,p)))for p in itertools.permutations(v)if p[0])
 elif k=='descending-numbers':out=sorted(v,reverse=True)
 elif k=='regroup-hundreds':out=v[0]*1000+v[1]*100+v[2];assert 10<v[1]<20
 elif k=='minimum-digit-inequality':
  s=v[0];assert s.count('□')==1 and'>'in s;a,b=s.split('>');p['validDigits']=[d for d in range(10)if int(a.replace('□',str(d)))>int(b)];out=min(p['validDigits'])
 elif k=='descending-digit-sum':
  step,total=v;possible=[]
  for lead in range(1,10):
   ds=[lead-step*j for j in range(5)]
   if min(ds)>=0 and sum(ds)==total:possible.append(int(''.join(map(str,ds))))
  out=one(possible);p['digitWitness']=list(map(int,str(out)))
 elif k=='concatenated-position':start,index=v;assert start==1;stream=''.join(map(str,range(start,index+1)));out=int(stream[index-1]);p['containingPrefix']=stream[:index]
 elif k=='odd-cycle-pair-sums':
  assert len(v)==5;out=F(sum(v),2)-v[1]-v[3];weights=[out]
  for total in v[:-1]:weights.append(total-weights[-1])
  assert weights[-1]+weights[0]==v[-1]and min(weights)>0;p['allWeights']=list(map(str,weights));assert out.denominator==1;out=int(out)
 elif k=='smallest-six-digits':out=minimum(v)
 elif k=='all-thousands':out=v[0]//1000;p['remainder']=v[0]%1000
 elif k=='all-hundreds':out=v[0]//100;p['remainder']=v[0]%100
 elif k=='round-hundred':out=rnd(v[0],100)
 elif k=='rounded-thousands-difference':a,b=[rnd(n,1000)for n in v];assert a>b;out=(a-b)//1000;p['roundedPopulations']=[a,b]
 elif k=='sum-round-hundred-thousand':p['exactSum']=sum(v);out=rnd(sum(v),100000)
 elif k=='multiply-nine':a,b,ten=v;assert b==9 and ten==10;out=a*ten-a;assert out==a*b
 elif k=='classes-all-hundreds':a,b,c=v;assert b<1000 and c<1000;p['actualNumber']=a*1000000+b*1000+c;out=p['actualNumber']//100
 elif k=='successive-rounding':n=v[0];steps=[]
 elif k=='smallest-round-hundred':p['smallestNumber']=minimum(v);out=rnd(p['smallestNumber'],100)
 elif k=='rounding-digit-sum':
  a,result=v;assert a.count('□')==1;p['validDigits']=[d for d in range(10)if rnd(int(a.replace('□',str(d))),10000)==result];out=sum(p['validDigits']);assert p['validDigits']
 else:raise AssertionError(k)
 if k=='successive-rounding':
  for unit in[10,100,1000]:n=rnd(n,unit);steps.append(n)
  out=n;p['successiveResults']=steps;p['directThousands']=rnd(v[0],1000);assert n!=p['directThousands']
 p['calculatedAnswer']=out;return out,p

def answer_value(s,i):
 if i==3:return clock_minutes(s)
 if i==12:return list(map(int,re.findall(r'\d+',H.tex(s))))
 return integer(s)
def solve(r,i,src=False,data=None,check_figure=True):
 v=parse(r,i,src);out,p=compute(v,i,src);assert answer_value(r['answer'],i)==answer_value(str(out),i)if i!=12 else answer_value(r['answer'],i)==out
 options=B.options({**r,'options':r.get('options',[])})
 if options:
  vals=[answer_value(s,i)for s in options];assert len(vals)==4 and len({json.dumps(x)for x in vals})==4 and sum(x==answer_value(r['answer'],i)for x in vals)==1;p['allActualOptions']=vals
 if not src and check_figure:figure(r,i,v,data)
 if not src:
  # All displayed arithmetic chains are checked, including carry and exact unit prices.
  s=r['solution'];chains=re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+(?:\s*=\s*\d+)*',s)
  for chain in chains:
   vals=[E.calc(x)for x in chain.replace('−','-').split('=')];assert len(set(vals))==1,('badArithmetic',i,chain)
  for a,b in re.findall(r'(\d+)\s*≈\s*(\d+)',s):
   a,b=int(a),int(b);assert any(rnd(a,u)==b for u in[10,100,1000,100000]),('badRound',i,a,b)
  p['allPrintedArithmeticChainsVerified']=chains
 return p

def figure(r,i,v,data=None):
 raw=data if data is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);assert not any(re.search(r'image|script|foreignObject',e.tag.split('}')[-1],re.I)for e in root.iter());ids={e.get('id'):e for e in root.iter()if e.get('id')};meta=json.loads(ids['actual-inputs'].text)
 expected=v
 if i==3:expected=[f'{int(v[0])//60}:{int(v[0])%60:02d}',*v[1:]]
 assert [x.replace(' ','')if isinstance(x,str)else x for x in meta]==expected,('meta',i,meta,expected)
 def txt(id):return''.join(ids[id].itertext())
 if i==4:
  assert txt('total')=='Барлығы: '+str(v[0])and txt('A-total')=='Робот: '+str(v[1])and txt('B-total')=='Сурет: '+str(v[2])and txt('neither')=='Қатыспайды: '+str(v[3])and txt('both')=='?'
  a,b=ids['set-A'],ids['set-B'];assert a.tag.endswith('circle')and b.tag.endswith('circle');dx=F(a.get('cx'))-F(b.get('cx'));assert 0<dx*dx<(F(a.get('r'))+F(b.get('r')))**2
 elif i==7:
  for group,count in enumerate(v):
   paths=[e for id,e in ids.items()if id.startswith('route-'+str(group)+'-')];assert len(paths)==count and len({e.get('d')for e in paths})==count
   expectedEnds=[45,180]if group==0 else[180,315]
   for e in paths:
    n=list(map(F,re.findall(r'-?\d+(?:\.\d+)?',e.get('d'))));assert n[0]==expectedEnds[0]and n[-2]==expectedEnds[1]and n[1]==n[-1]==118
 elif i==2:
  lessons=[e for id,e in ids.items()if id.startswith('lesson-')and e.tag.endswith('rect')];breaks=[e for id,e in ids.items()if id.startswith('break-')and e.tag.endswith('rect')];assert len(lessons)==v[0]and len(breaks)==v[0]-1
  assert abs(float(lessons[0].get('width'))/float(breaks[0].get('width'))-v[1]/v[2])<1e-9;assert txt('lesson-label')==f'{v[0]} сабақ · {v[1]} мин'and txt('break-label')==f'Үзіліс: {v[2]} мин'
 elif i==17:
  assert[integer(txt('pair-'+str(j)))for j in range(5)]==v and[txt('vertex-'+str(j))for j in range(5)]==list('ABCDE')
 elif i==5:
  for j,n in enumerate(v[:2]):assert len([id for id in ids if id.startswith('cup-'+str(j)+'-')])==n
  assert txt('choose')==f'Таңдау: {v[2]} кесе'
 elif i in[0,6]:assert txt('scale')==f'{v[0]} см ↔ {v[1]} км'and txt('distance')==str(v[2])+(' см'if i==0 else' км')
 else:assert[txt('input-'+str(j))for j in range(len(meta))]==list(map(str,meta))
 return True

def changed(r,i):
 cr=copy.deepcopy(r);parts=tokens(r);v=parse(r,i);k=K[i]
 # Change actual printed input; regenerate solution only from independently calculated result.
 if i==3:new='22:35';old=parts[0]
 elif i in[9,19]:old=parts[0];new=old+' + 1'
 elif i==14:old=parts[0];new=old.replace('654900','674900')
 elif i==30:old=parts[0];new=old.replace('637','837') # same answer: use a different target threshold below
 elif i==29:old=parts[1];new=str(int(old)+1)
 elif i in[10,18]:old=parts[-1];new=str(int(old)-1)
 elif i==15:old=parts[1];new=str(int(old)-5)
 elif i==16:old=parts[-1];new=str(int(old)+2)
 elif i==5:old=parts[2];new=str(int(old)+1)
 elif i==6:old=parts[-1];new=str(int(old)+int(parts[1]))
 elif i in[0,1,7]:old=parts[-1];new=str(int(old)+1)
 elif i==2:old=parts[0];new=str(int(old)+1)
 elif i==12:old=parts[0];new=str(int(old)+5000)
 elif i==13:old=parts[0];new=str(int(old)+1)
 elif i==17:old=parts[0];new=str(int(old)+2)
 elif i==4:old=parts[0];new=str(int(old)+1)
 elif i==26:old=parts[0];new=old.replace('86','87')
 elif i==27:old=parts[0];new=str(int(old)+1)
 elif i==25:old=parts[0];new=str(int(old)+100000)
 elif i in[20,23,24,28,31]:old=parts[0];new=str(int(old)+1000)
 else:old=parts[0];new=str(int(old)+100)
 cr['statement']=cr['statement'].replace('«'+old+'»','«'+new+'»',1)
 if i==30:
  # Change requested target to rounding down, still sum all admissible digits.
  cr['statement']=cr['statement'].replace('«90000»','«80000»')
 out,p=compute(parse(cr,i),i);cr['answer']='; '.join(map(str,out))if isinstance(out,list)else str(out);assert answer_value(cr['answer'],i)!=answer_value(r['answer'],i),('unchangedMutation',i)
 cr['solution']='Тексерілген жаңа нәтиже: '+cr['answer']+'.';cr.pop('options',None);return cr

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==33;entries=[];evidence=[];choices=0;sourceEq=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert q['solution'];opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]));assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badkeyaccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();mal=raw.replace(b'<metadata',b'<image',1)
  try:figure(r,i,parse(r,i),mal)
  except(AssertionError,ET.ParseError):pass
  else:raise AssertionError(('badSVGaccepted',i))
  tree=ET.fromstring(raw);byid={e.get('id'):e for e in tree.iter()if e.get('id')};badId={0:'distance',2:'lesson-label',4:'A-total',5:'choose',6:'distance',7:'route-0-0',17:'pair-0'}.get(i,'input-0');el=byid[badId]
  if i==7:el.set('d',el.get('d').replace('M 45','M 46',1))
  else:el.text=(el.text or'')+'9'
  badData=ET.tostring(tree);badRow={**r,'figureSha256':hashlib.sha256(badData).hexdigest()}
  try:figure(badRow,i,parse(r,i),badData)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('updatedHashBadVisibleInputAccepted',i))
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:vals=[N.exact_power_arithmetic(x)for x in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(vals))==1,('sourceEquation',i,expr);sourceEq+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedAndRecomputedKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG, all visible inputs cross-checked against independently parsed condition;32 source archives inspected, unavailable source14 reconstructed solely from full text;33 rendered343px previews inspected. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==44
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':33,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':32,'unavailableSourceIllustrationsWithCompleteText':1,'nativeSVGs':33,'actualInputMutationsChecked':33,'updatedHashWrongVisibleInputsRejected':33,'allWrongAndStaleKeysRejected':True,'sourceArithmeticEqualitiesChecked':sourceEq,'pythonJavaScriptHashesMatched':33,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
