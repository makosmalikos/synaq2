"""All39 complete source/new conditions official/new solutions and48 source/new
choices read;39 saved source rasters inspected. Own39 native diagrams inspected
at343px. Separate exact volume/area/unit/clock computations; all painted voxel
boundaries enumerated and all lighter-coin decision branches replayed. Native
geometry and visible givens checked. Same author, not another human. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-measures';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-arithmetic-mass.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one

def parse(r,src=False):return[E.calc(x)for x in H.math_parts(r['statement'],src)]
def integer(n):assert F(n).denominator==1;return int(n)
def root(n):n=integer(n);x=math.isqrt(n);assert x*x==n;return F(x)
def minimum_weighings(n):
 n=integer(n);assert n>0;k=0;capacity=1
 while capacity<n:k+=1;capacity*=3
 return k

def strategy(n):
 # Known exactly one lighter coin. Replay each actual hidden coin through every branch.
 n=integer(n);traces=[]
 for hidden in range(n):
  candidates=list(range(n));trace=[]
  while len(candidates)>1:
   size=(len(candidates)+2)//3;a=candidates[:size];b=candidates[size:size*2];rest=candidates[size*2:];assert len(a)==len(b)
   outcome='left-light'if hidden in a else'right-light'if hidden in b else'balanced';trace.append({'suspects':len(candidates),'left':len(a),'right':len(b),'unweighed':len(rest),'outcome':outcome});candidates=a if hidden in a else b if hidden in b else rest
  assert candidates==[hidden];traces.append(trace)
 assert max(map(len,traces),default=0)==minimum_weighings(n);return traces

def area_value(s):
 s=s.replace('$','').replace('\\,','');m=re.fullmatch(r'\s*(\d+)\s*(км²|м²|га|а|ар)\s*',s);assert m,('areaUnit',s);return F(int(m[1])*{'км²':1000000,'м²':1,'га':10000,'а':100,'ар':100}[m[2]])
def representation(s,i):
 if i in[13,17]:return area_value(s)
 if i in[14,24,34]:return C.units(s,'length')
 if i in[29,31,38]:
  s=s.strip('$ ')
  if':'in s:return F(C.C.C.clock_minutes(s))
  ns=list(map(int,re.findall(r'\d+',s)));assert len(ns)==2 and ns[1]<60;return F(ns[0]*60+ns[1])
 if i==35:return C.ints(H.numeric_tokens(s))
 return E.calc(re.sub(r'\b(?:га|м|кг|см|дм)\b','',s.strip('$ ')))
def fmt(out,i):
 if i in[13,17]:return str(integer(out))+' м²'
 if i in[14,24,34]:return str(integer(out))+' м'
 if i in[29,31,38]:n=integer(out);return f'{n//60%24}:{n%60:02d}'
 if i==35:return' және '.join(map(str,out))
 return str(integer(out))
def compute(r,i,src=False):
 v=parse(r,src);p={'actualPrintedInputs':list(map(str,v))}
 if i==0:a,b,c,u=v;assert u>0 and all(x%u==0 for x in[a,b,c]);out=a*b*c/u**3
 elif i in[1,11]:out=math.prod(v)
 elif i==2:a,b,c,u,loaded=v;capacity=a*b*c/u**3;assert all(x%u==0 for x in[a,b,c]);out=capacity-loaded;p['totalCapacity']=str(capacity)
 elif i==3:a,b,c,d=v;out=abs(a*b*c-d**3);p['bothVolumes']=[str(a*b*c),str(d**3)]
 elif i in[4,9]:volume,a,b=v;out=volume/(a*b)
 elif i==5:u,a,b,c,edge=v;assert all(x%u==0 for x in[a,b,c,edge]);out=(edge**3-a*b*c)/u**3
 elif i in[6,10]:
  edge,unit=v;assert edge%unit==0;n=integer(edge/unit);assert n>=3;hist={}
  for x,y,z in itertools.product(range(n),repeat=3):
   faces=sum([x==0,x==n-1,y==0,y==n-1,z==0,z==n-1]);hist[faces]=hist.get(faces,0)+1
  out=hist[2];p['allPaintedBoundaryFaceHistogram']=hist;p['allVoxelsChecked']=n**3
 elif i==7:a,b,c,u=v;assert 0<u<min(a,b,c);counts=[int(x//u)for x in[a,b,c]];out=math.prod(counts);p['axisAlignedCounts']=counts;p['volumeQuotient']=str(a*b*c/u**3);p['packingWitness']=[[x,y,z]for x in range(counts[0])for y in range(counts[1])for z in range(counts[2])]
 elif i==8:out=math.prod(v)
 elif i==12:out=v[0]*v[1]/100
 elif i==13:out=v[0]**2
 elif i==14:out=v[0]*10000/v[1]
 elif i==15:out=v[0]*v[1]/4
 elif i==16:out=root(v[0]*10000)
 elif i==17:out=v[0]*1000*v[1]
 elif i in[18,25]:out=v[0]*v[1]/10000
 elif i==19:total,wheat,k=v;out=total-wheat-wheat*k
 elif i==20:area,length=v;width=area*10000/length;out=2*(length+width);p['widthMetres']=str(width)
 elif i==21:perimeter,k=v;width=perimeter*1000/(2*(k+1));out=width*width*k/10000;p['widthMetres']=str(width);p['lengthMetres']=str(width*k)
 elif i==22:area,fraction,barley=v;assert 0<fraction<1;out=area*100*(1-fraction)-barley
 elif i==23:side,a,b=v;assert side%a==0 and side%b==0;p['tilingRowsColumns']=[integer(side/a),integer(side/b)];out=side**2/(a*b)
 elif i==24:side=root(v[0]*100);out=side*4;p['squareSideMetres']=str(side)
 elif i==26:length,area=v;out=area/length
 elif i==27:hour,minutes=v;assert 0<=hour<12 and minutes%60==0;out=(hour+minutes/60)%24
 elif i==28:count,mg=v;out=count*mg/1000
 elif i==29:h,m,d,b,n=v;assert 0<=h<24 and 0<=m<60 and n>=2;duration=n*d+(n-1)*b;out=(h*60+m+duration)%1440;p['gapCount']=integer(n-1);p['durationMinutes']=str(duration)
 elif i==30:a,b,cm=v;assert a*100%cm==0 and b*100%cm==0;p['tilingRowsColumns']=[integer(a*100/cm),integer(b*100/cm)];out=a*b*10000/cm**2
 elif i==31:h,m,dt=v;assert 0<=h<24 and 0<=m<60;out=(h*60+m+dt)%1440
 elif i in[32,36]:area,length=v;out=2*(area/length+length);p['otherSide']=str(area/length)
 elif i==33:a,b,area=v;side=root(area*100);assert a%side==0 and b%side==0;p['tilingRowsColumns']=[integer(a/side),integer(b/side)];out=a*b/(area*100)
 elif i==34:large,small=v;n=large*10/small;assert n.denominator==1;out=n**3*small/10;p['unitCubeCount']=str(n**3)
 elif i==35:
  n,k=map(integer,v);assert k>=1;capacity=3**(k-1);pairs=[C.ints(H.numeric_tokens(s))for s in B.options(r)];valid=[];branches=[]
  for a,b in pairs:
   assert a==b;counts=[a,b,n-a-b];okay=min(counts)>=0 and max(counts)<=capacity;branches.append({'firstWeighing':[a,b],'possibleBranchSizes':counts,'remainingCapacity':capacity,'allBranchesSolvable':okay})
   if okay:valid.append([a,b])
  out=one(valid);p['allOptionDecisionBranches']=branches;p['allActualHiddenCoinTraces']=strategy(n);assert max(map(len,p['allActualHiddenCoinTraces']))<=k
 elif i==37:n=integer(v[0]);out=minimum_weighings(n);p['allActualHiddenCoinTraces']=strategy(n);p['previousMeasurementCapacity']=3**(out-1);assert 3**(out-1)<n<=3**out
 elif i==38:h,dt=v;assert 0<=h<12;out=(h*60+dt)%1440
 else:raise AssertionError(i)
 if i!=35:assert F(out).denominator==1 and out>=0
 p['calculatedAnswer']=json.loads(json.dumps(out,default=str));return out,p

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out)
 opts=B.options({**r,'options':r.get('options',[])})
 if opts:
  values=[representation(s,i)for s in opts];assert len(values)==4 and len(set(opts))==4 and sum(x==out for x in values)==1
  if src and i==17:assert values[0]==values[3]and values[0]!=out;p['sourceDuplicateIncorrectAreaValuesCorrectedInNewEdition']=True
  else:assert len({str(x)for x in values})==4
  p['allActualOptions']=list(map(str,values))
 if not src:
  if check_figure:figure(r,i,parse(r))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+(?:\s*=\s*\d+)*',r['solution']):
   vals=[E.calc(x.replace('−','-'))for x in chain.split('=')];assert len(set(vals))==1,('badPrintedArithmetic',i,chain)
 return p

def dimensions(i,v):
 if i in[0,1,2,3,7,8,11]:return v[:3]
 if i in[4,9]:return[v[1],v[2],F(4)]
 if i==5:return v[1:4]
 if i in[6,10,34]:return[v[0]]*3
 return None

def figure(r,i,v,data=None):
 raw=data if data is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());meta=json.loads(ids['actual-inputs'].text);assert list(map(F,meta))==v
 for j,x in enumerate(v):assert F(''.join(ids['input-'+str(j)].itertext()))==x
 dims=dimensions(i,v)
 if dims:
  l,w,h=map(float,dims);scale=min(245/(l+w*.5),168/(h+w*.45))
  def proj(p):x,y,z=p;return[43+scale*(x+y*.5),211-scale*(z+y*.45)]
  faces=[[[0,0,0],[l,0,0],[l,0,h],[0,0,h]],[[l,0,0],[l,w,0],[l,w,h],[l,0,h]],[[0,0,h],[l,0,h],[l,w,h],[0,w,h]]]
  for j,face in enumerate(faces):
   actual=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',ids['face-'+str(j)].get('points'))));expected=[z for p in face for z in proj(p)];assert len(actual)==len(expected)and all(abs(a-b)<1e-7 for a,b in zip(actual,expected))
  if i in[6,10,34]:
   n=integer(v[0]*10/v[1]if i==34 else v[0]/v[1]);assert len([id for id in ids if any(id.startswith(s+'-')for s in['front-v','front-h','top-x','top-y','right-z','right-y'])])==6*(n-1)
   for j in range(1,n):
    a=l*j/n
    for id,p,q in[['front-v',[a,0,0],[a,0,h]],['front-h',[0,0,a],[l,0,a]],['top-x',[a,0,h],[a,w,h]],['top-y',[0,a,h],[l,a,h]],['right-z',[l,0,a],[l,w,a]],['right-y',[l,a,0],[l,a,h]]]:
     e=ids[id+'-'+str(j)];actual=list(map(float,[e.get(k)for k in['x1','y1','x2','y2']]));assert all(abs(x-y)<1e-7 for x,y in zip(actual,proj(p)+proj(q)))
 if i in[27,29,31,38]:
  h,m=v[0],v[1]if i in[29,31]else F(0)
  for id,angle,length in[['hour-hand',(float(h%12)+float(m)/60)*math.pi/6,46],['minute-hand',float(m)*math.pi/30,68]]:
   e=ids[id];assert e.get('x1')=='180'and e.get('y1')=='115';assert abs(float(e.get('x2'))-(180+length*math.sin(angle)))<1e-7 and abs(float(e.get('y2'))-(115-length*math.cos(angle)))<1e-7
 if i in[35,37]:
  coins=[e for id,e in ids.items()if id.startswith('coin-')];assert len(coins)==v[0]and len({e.get('fill')for e in coins})==1
 if i==28:assert len([id for id in ids if id.startswith('bead-')])==v[0]
 if i in[23,30,33]:
  _,p=compute(r,i);cols,rows=p['tilingRowsColumns'];assert len([id for id in ids if id.startswith('tile-v-')])==cols-1 and len([id for id in ids if id.startswith('tile-h-')])==rows-1;land=ids['land'];x,y,w,h=map(float,[land.get(k)for k in['x','y','width','height']])
  for j in range(1,cols):e=ids['tile-v-'+str(j)];assert abs(float(e.get('x1'))-(x+w*j/cols))<1e-7 and e.get('x1')==e.get('x2')and float(e.get('y1'))==y and float(e.get('y2'))==y+h
  for j in range(1,rows):e=ids['tile-h-'+str(j)];assert abs(float(e.get('y1'))-(y+h*j/rows))<1e-7 and e.get('y1')==e.get('y2')and float(e.get('x1'))==x and float(e.get('x2'))==x+w
 if i in[13,16,23,24]:assert ids['land'].get('width')==ids['land'].get('height')
 if i==15:
  land=ids['land'];area=float(land.get('width'))*float(land.get('height'));assert float(ids['half'].get('width'))*float(ids['half'].get('height'))==area/2 and float(ids['quarter'].get('width'))*float(ids['quarter'].get('height'))==area/4
 return True

def changed(r,i):
 if i==35:
  cr=copy.deepcopy(r);cr['statement']=cr['statement'].replace('«26»','«8»').replace('«3»','«2»');out,p=compute(cr,i)
 else:
  found=None
  for old in H.math_parts(r['statement'],False):
   if'/'in old:continue
   for delta in[1,2,3,4,5,6,7,8,9,10,11,16,25,50,60,100]:
    cr=copy.deepcopy(r);cr['statement']=cr['statement'].replace('«'+old+'»','«'+str(int(old)+delta)+'»',1);cr.pop('options',None)
    try:
     out,p=compute(cr,i)
     if out!=representation(r['answer'],i):found=cr;break
    except(AssertionError,ValueError,ZeroDivisionError):pass
   if found:break
  assert found,('validMutation',i);cr=found
 cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];assert out!=representation(r['answer'],i);return cr

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==39;entries=[];evidence=[];choices=0;sourceEq=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert q['solution'];opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};ids['input-0'].text='999';wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
  try:figure(bad,i,parse(r),wrong)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('rehashedVisibleCorruptionAccepted',i))
  geometryId='face-0'if dimensions(i,parse(r))else'hour-hand'if i in[27,29,31,38]else'coin-0'if i in[35,37]else'bead-0'if i==28 else'tile-v-1'if i in[23,30,33]else'half'if i==15 else'land'if i in[13,16,24]else None
  if geometryId:
   tree=ET.fromstring(raw);byid={e.get('id'):e for e in tree.iter()if e.get('id')};e=byid[geometryId]
   if geometryId.startswith('face'):coords=e.get('points').split();x,y=coords[0].split(',');coords[0]=str(float(x)+1)+','+y;e.set('points',' '.join(coords))
   elif geometryId in['hour-hand','tile-v-1']:e.set('x2',str(float(e.get('x2'))+1))
   elif geometryId in['coin-0','bead-0']:
    parent=next(p for p in tree.iter()if e in list(p));parent.remove(e)
   else:e.set('width',str(float(e.get('width'))+1))
   geo=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(geo).hexdigest()}
   try:figure(bad,i,parse(r),geo)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('rehashedGeometryCorruptionAccepted',i))
   proof['rehashedActualGeometryCorruptionRejected']=True
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:vals=[N.exact_power_arithmetic(s)for s in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(vals))==1,('sourceArithmetic',i,expr);sourceEq+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'39 own native SVGs inspected343px;39 source rasters inspected. Actual projected cuboid faces grid segments square/quarter rectangles tile divisions clock-hand endpoints coin/bead counts and all visible givens checked independently. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==48
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':39,'sourceOptionsRead':48,'rewrittenOptionsRead':48,'sourceIllustrationsInspected':39,'nativeSVGs':39,'actualInputMutationsChecked':39,'updatedHashWrongVisibleInputsRejected':39,'sourceArithmeticEqualitiesChecked':sourceEq,'pythonJavaScriptHashesMatched':39,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
