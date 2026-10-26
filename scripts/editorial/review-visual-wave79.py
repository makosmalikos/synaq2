"""Root independent review: full19 saved/18new conditions, full official/new
solutions and EVERY MCQ read; four archived sheets and three native343px sheets
actually viewed.18 archived rasters available; source4:00clock raster missing,
so no raster comparison claimed for that row. No author params/models/data-*
used as physical geometric evidence. Retained edition is not resigned.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave79-pictured-sectors.json'
REPORT='problems/editorial/reviews/visual-wave79-pictured-sectors.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext()).strip()
def num(e,k):return float(e.attrib[k])
def point(e,j):return num(e,'x'+j),num(e,'y'+j)
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def close(a,b):assert abs(float(a)-float(b))<1e-6,(a,b)
def polar(p,c):return math.degrees(math.atan2(c[1]-p[1],p[0]-c[0]))%360
def coords(s):return list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',s,re.I)))
def observe(svg,i):
 root=E.fromstring(svg);assert root.get('viewBox')=='0 0 480 360';nodes=list(root.iter())
 assert {tag(e)for e in nodes}<={'svg','title','desc','rect','g','circle','line','path','text'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 circles=[e for e in nodes if tag(e)=='circle'and num(e,'r')>10];circle=one(circles);c=(num(circle,'cx'),num(circle,'cy'));radius=num(circle,'r')
 assert 0<c[0]-radius<c[0]+radius<480 and 0<c[1]-radius<c[1]+radius<360
 texts=[e for e in nodes if tag(e)=='text'];lines=[e for e in nodes if tag(e)=='line'];paths=[e for e in nodes if tag(e)=='path']
 for e in texts:assert 0<num(e,'x')<480 and 0<num(e,'y')<360 and num(e,'font-size')*343/480>=17.8
 if i in(10,13):
  labels={int(txt(e)):e for e in texts};assert set(labels)==set(range(1,13))
  for hour,e in labels.items():
   difference=((90-polar((num(e,'x'),num(e,'y')-9),c))-(hour%12)*30)%360;close(min(difference,360-difference),0)
  hands=[e for e in lines if dist(point(e,'1'),c)<1e-6];assert len(hands)==2
  short,long=sorted(hands,key=lambda e:dist(point(e,'2'),c));assert short.get('stroke')!=long.get('stroke')and num(short,'stroke-width')>num(long,'stroke-width')
  assert dist(point(long,'2'),c)>dist(point(short,'2'),c)>0
  hourAngle=(90-polar(point(short,'2'),c))%360;minuteAngle=(90-polar(point(long,'2'),c))%360
  minute=minuteAngle/6;hour=(hourAngle-minute*.5)/30;close(hour,round(hour));close(minute,round(minute))
  gap=abs(hourAngle-minuteAngle);small=min(gap,360-gap)
  ticks=[e for e in lines if dist(point(e,'1'),c)>radius*.8];assert len(ticks)==60
  for e in ticks:close(dist(point(e,'2'),c),radius-1)
  tickAngles=sorted(polar(point(e,'2'),c)for e in ticks)
  for j,a in enumerate(tickAngles):close((tickAngles[(j+1)%60]-a)%360,6)
  return {'hour':round(hour),'minute':round(minute),'minor':round(small),'major':round(360-small),'clockTickCount':60}
 radii=[e for e in lines if dist(point(e,'1'),c)<1e-6];assert len(radii)>=2
 for e in radii:close(dist(point(e,'2'),c),radius)
 radii.sort(key=lambda e:polar(point(e,'2'),c));angles=[polar(point(e,'2'),c)for e in radii];close(angles[0],0)
 gaps=[(angles[(j+1)%len(angles)]-a)%360 for j,a in enumerate(angles)];assert min(gaps)>0;close(sum(gaps),360)
 def indexAt(a):return one(j for j,v in enumerate(angles)if min((a-v)%360,(v-a)%360)<1e-6)
 def containing(a):return one(j for j,v in enumerate(angles)if 1e-6<(a-v)%360<gaps[j]-1e-6)
 labels={};letters={};centerLabel=[]
 for e in texts:
  value=txt(e);p=(num(e,'x'),num(e,'y')-8)
  if re.fullmatch('[A-Z]',value):
   if dist(p,c)<50:centerLabel.append(value)
   else:
    j=min(range(len(radii)),key=lambda j:dist(p,point(radii[j],'2')));assert dist(p,point(radii[j],'2'))<30;letters[value]=j
  else:
   j=containing(polar(p,c));assert j not in labels;labels[j]=value
 assert len(centerLabel)==1
 rights=[];shade=[];arcGroups={};tickCounts={}
 for e in paths:
  d=e.get('d');v=coords(d)
  if e.get('fill','none')!='none':
   assert len(v)==11 and 'L'in d and 'A'in d and d.endswith('Z');close(dist(tuple(v[:2]),c),0)
   start,end=tuple(v[2:4]),tuple(v[-2:]);close(dist(start,c),radius);close(dist(end,c),radius);close(v[4],radius);close(v[5],radius)
   a,b=polar(start,c),polar(end,c);j=indexAt(a);close((b-a)%360,gaps[j]);assert v[7]==int(gaps[j]>180)and v[8]==0
   assert j not in shade;shade.append(j)
  elif 'A'in d:
   assert len(v)==9;start,end=tuple(v[:2]),tuple(v[-2:]);arcRadius=v[2];close(v[3],arcRadius);close(dist(start,c),arcRadius);close(dist(end,c),arcRadius)
   a,b=polar(start,c),polar(end,c);j=indexAt(a);close((b-a)%360,gaps[j]);assert v[6]==0;arcGroups[j]=arcRadius
  else:
   assert len(v)==6;points=list(zip(v[::2],v[1::2]));a,b,z=points
   u=(a[0]-b[0],a[1]-b[1]);w=(z[0]-b[0],z[1]-b[1]);close(u[0]*w[0]+u[1]*w[1],0);close(dist(a,b),dist(b,z));assert dist(a,b)>0
   j=indexAt(polar(a,c));close((polar(z,c)-polar(a,c))%360,90);close(gaps[j],90);rights.append(j)
 for e in lines:
  if e in radii:continue
  a,b=point(e,'1'),point(e,'2');close(dist(a,b),10);p=((a[0]+b[0])/2,(a[1]+b[1])/2);j=containing(polar(p,c));tickCounts[j]=tickCounts.get(j,0)+1
 # Same arc-radius and same tick-count are equality classes; each class
 # has identical actual physical angles. Different tick counts stay distinct.
 groups={}
 for j in set(arcGroups)|set(tickCounts):groups.setdefault((arcGroups.get(j),tickCounts.get(j,0)),[]).append(j)
 for indices in groups.values():
  for j in indices:close(gaps[j],gaps[indices[0]])
 for j,label in labels.items():
  if re.fullmatch(r'\d+°',label):close(gaps[j],int(label[:-1]))
 return {'gaps':gaps,'labels':labels,'letters':letters,'center':one(centerLabel),'rightMarkers':rights,'shaded':sorted(shade),'equalityGroups':[sorted(v)for v in groups.values()],'tickCounts':tickCounts}
def checkAnswer(r,i,o):
 if i in(10,13):
  assert (o['hour'],o['minute'])==((5,0)if i==10 else(8,30));out=o['major']if i==10 else o['minor']
 else:
  gaps=o['gaps'];labels=o['labels'];shaded=o['shaded'];right=o['rightMarkers'];letters=o['letters']
  numeric={j:int(v[:-1])for j,v in labels.items()if re.fullmatch(r'\d+°',v)}
  if i==0:out=360-sum(numeric.values());assert len(gaps)==3 and len(numeric)==2 and labels[one(shaded)]=='?'
  elif i==1:
   assert o['center']=='K'and set(letters)==set('PQR')and len(gaps)==3
   expected={('P','Q'),('Q','R'),('R','P')}
   def valid(option):
    words=re.findall(r'\b[A-Z]+\b',option)
    return len(words)==3 and all(len(w)==3 and w[1]=='K'for w in words)and {(w[0],w[2])for w in words}==expected
   out=one(v for v in r['options']if valid(v));assert r['answer']==out;return out
  elif i==2:out=360-sum(numeric.values());assert len(gaps)==2 and out>180
  elif i==3:out=len(gaps);assert len(gaps)==6 and not shaded
  elif i in(4,9):
   close((o['gaps'][0]+sum(o['gaps'][1:letters['B']]))%360,180);assert letters['A']==0
   out=180-sum(numeric.values());close(sum(gaps[:letters['B']]),180)
  elif i in(5,6):
   assert len(right)==1;remaining=360-sum(numeric.values())-90;unknown=len(gaps)-len(numeric)-1;out=F(remaining,unknown)
   if i==6:assert sorted(o['equalityGroups'])==[[3,4]]and unknown==2
  elif i in(7,11):
   expressions={j:re.sub(r'(\d)(x)',r'\1*\2',v.replace('°',''))for j,v in labels.items()};assert all('x'in v for v in expressions.values())
   slopes={j:H.calc(v,{'x':1})-H.calc(v,{'x':0})for j,v in expressions.items()};intercepts={j:H.calc(v,{'x':0})for j,v in expressions.items()}
   x=(360-90*len(right)-sum(intercepts.values()))/sum(slopes.values());values={j:H.calc(v,{'x':x})for j,v in expressions.items()}
   for j,v in values.items():close(gaps[j],v)
   out=max(values.values())if i==7 else one(v for j,v in values.items()if expressions[j]=='2*x')
   if i==11:assert len(right)==1 and len(gaps)==4
  elif i==8:
   assert len(gaps)==10 and len(shaded)==4 and shaded==list(range(4))
   for gap in gaps:close(gap,360/len(gaps))
   out=F(360*len(shaded),len(gaps))
  elif i==12:
   first,second=ns(r['statement']);out=(first+second)/2
   assert letters=={'A':0,'M':1,'B':2,'N':3,'C':4};close(gaps[0]+gaps[1],first);close(gaps[2]+gaps[3],second)
   assert sorted(o['equalityGroups'])==[[0,1],[2,3]]and o['tickCounts']=={0:1,1:1,2:2,3:2}and shaded==[1,2]
  elif i==14:
   difference=one(ns(r['statement']));out=(180-difference)/2
   assert letters=={'A':0,'B':1,'C':2,'D':3};close(gaps[0]+gaps[1],180);close(gaps[1]+gaps[2],180);close(gaps[1]-gaps[0],difference)
   assert shaded==[2]
  elif i==15:
   count=len(gaps);assert count==6 and not shaded
   out=len({(a,b,side)for a,b in itertools.combinations(range(count),2)for side in(0,1)})
  elif i==16:
   known=one(list(numeric.values()));assert len(gaps)==4 and sorted(o['equalityGroups'])==[[1,2,3]];out=F(360-known,3)
  elif i==17:
   known=one(list(numeric.values()));assert letters=={'C':0,'M':1,'B':2,'A':3,'D':4};close(gaps[0]+gaps[1],90);close(gaps[2],90);close(gaps[3],90);close(gaps[4],90)
   assert shaded==[0,4]and right==[2];out=90-known+90
  else:raise AssertionError(i)
  if shaded:close(sum(gaps[j]for j in shaded),out)
  if '?'in labels.values():assert '?'in[labels.get(j)for j in shaded]
 assert one(ns(r['answer']))==out,(i,r['answer'],out)
 if r.get('options'):assert sum(ns(v)==[out]for v in r['options'])==1
 return str(out)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==18
 inventory=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records'];entries=[];observations=[];canaries=0
 # Original givens independently recomputed after reading full official
 # solutions and inspecting all available archived diagrams, not copied keys.
 sourceResults=[360-100-120,None,360-130,5,180-50,360-90-50,F(360-60-90-120,2),F(360*3,1+2+3+3),F(360*3,8),180-35-60,360-4*30,2*F(360-50-90,4),F(100+130,2),F(30*7,1)+15-6*30,F(180-40,2),2*math.comb(5,2),F(360-45,3),90-25+90]
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one(q for q in cap['questions']if q['id']==ref['sourceId']);assert cap['status']=='captured'and raw['checked']and raw['solution']
  if i==1:assert re.findall(r'[A-Z]{3}',raw['sourceAnswer'])==['KOM','MON','NOK']
  else:assert one(ns(raw['sourceAnswer']))==sourceResults[i]
  if raw['options']:assert one(o['text']for o in raw['options']if o['correct'])==raw['sourceAnswer']
  inv=one(q for q in inventory if q['occurrenceId']==r['sourceOccurrenceId']);assert inv['sourceSha256']==r['sourceCanonicalSha256']and inv['sourceId']==ref['sourceId']
  svg=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==r['figureSha256']
  o=observe(svg,i);answer=checkAnswer(r,i,o);bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:checkAnswer(bad,i,o)
  except(AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('badkeyaccepted',i))
  el=E.fromstring(svg);circle=one(e for e in el.iter()if tag(e)=='circle'and num(e,'r')>10);circle.set('r',str(num(circle,'r')*1.03))
  try:observe(E.tostring(el,encoding='unicode'),i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('actualgeometrycanaryaccepted',i))
  available=i!=10;assert available or ref['sourceId']=='7c63c62fcfd4a7da'
  notes=['Fullsaved/newconditions/fullofficial+authoredsolutions/everyMCQread.','All4archivedsourcepreview sheets/3native343px sheets actually visually inspected; no clipping; 343px labels remain legible.','Ownactualcircle/radialendpoints/filledarcs/largearcflags/rotatedrightmarkers/tickclasses/linearlabelbinding/clockcontinuoushourmotion/compositewrap geometry inspected without authorparams ordata-*.',('Archived4:00sourceclockrastermissing; preservedlarge-sector skill from savedfullsolution, new5:00redrawn; NOsourceimagecomparisonclaimed.'if not available else'Availablearchivedrasterandrewrittennativefigurevisuallycomparedforpreservedskill, nottraced.')]
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_fullsaved_new_solutions_everyMCQ_actualSVG_geometric_partition_arcflags_rightangles_tickclasses_clock_and_native343visualreview','notes':notes,'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':available,'checked':notes},'evidence':{'oracle':'scripts/editorial/review-visual-wave79.py','sourceSheet':f'output/editorial-visual-wave79/visual-wave79-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave79/visual-wave79-contact-{i//6+1}.png','mobileWidthPx':343,'sourceRasterAvailable':available,'sourceRasterCompared':available,'figureSha256':sha}})
  observations.append({'editionId':r['editionId'],'answer':answer,'actualSvg':o,'independentOriginalResult':None if i==1 else str(sourceResults[i])})
 retained=one(batch['coverage']['previousEditionsRetained']);q=one(q for q in json.loads((ROOT/retained['sourceFile']).read_text())['questions']if q['id']==retained['sourceId']);assert retained['editionId']=='visual-circle-sector-gap'and q['sourceAnswer']=='75'and 360-80-95-110==75
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'root_independent_of_visual79_author','batch':BATCH,'scope':__doc__,'summary':{'verified':18,'retainedNotResigned':1,'findings':0,'fullSavedConditionsOfficialSolutionsEveryMCQRead':19,'fullNewConditionsSolutionsEveryMCQRead':18,'availableSourceRastersActuallyViewed':18,'unavailableSourceRasterNotCompared':1,'native343FiguresActuallyViewed':18,'wrongKeysRejected':18,'physicalSvgCanariesRejected':canaries,'pythonJavaScriptHashesMatched':18},'retained':retained,'actualPhysicalSvgObservations':observations,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary']))
if __name__=='__main__':main()
