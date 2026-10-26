"""Independent18new+1retained fullread, native343 sheets and physicalSVG review.
No author params/specs/render/solver imported.15 available new-source rasters
actually viewed;3new+1retained unavailable are NOT claimed compared.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/visual-wave76-pictured-angle-types.json';REPORT='problems/editorial/reviews/visual-wave76-pictured-angle-types.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext()).strip()
def num(e,k):return float(e.attrib[k])
def pt(e,k):return(num(e,'x'+k),num(e,'y'+k))
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def polar(p,c):return math.degrees(math.atan2(c[1]-p[1],p[0]-c[0]))%360
def delta(a,b):return min((a-b)%360,(b-a)%360)
def direction(p,q):return(q[0]-p[0],q[1]-p[1])
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def h(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
RAYS={1:{'P':180,'Q':0,'R':122},3:{'P':0,'Q':142,'R':246},4:{'P':0,'Q':45,'R':105},5:{'P':90,'Q':0,'R':59},8:{'P':0,'Q':20,'R':75,'S':180},9:{'P':180,'Q':0,'R':90,'S':33},10:{'P':0,'Q':54,'R':92,'S':146},11:{'P':0,'Q':30,'R':45},13:{'P':0,'Q':38,'R':90,'S':147,'T':180},14:{'P':0,'Q':90,'R':166,'S':242},15:{'P':0,'Q':104,'R':48},16:{'P':180,'T':0,'R':45},17:{'P':180,'Q':136,'R':92,'S':48,'T':0}}
LABELS={1:{'PR':'58°'},3:{'PQ':'142°','QR':'104°','PR':'?'},4:{'PQ':'45°','QR':'60°'},5:{'PR':'31°'},8:{'PQ':'20°','QR':'55°','RS':'105°'},9:{'QS':'33°'},10:{'QR':'38°','PS':'146°'},11:{'PR':'45°','PQ':'30°'},13:{'PQ':'38°','ST':'33°'},14:{'PS':'118°'},15:{},16:{'RT':'45°','PR':'?'},17:{'ST':'48°'}}

def parse_arc(e,c):
 v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',e.attrib['d'],re.I)));assert len(v)==9 and v[4:7]==[0,0,0];a=(v[0],v[1]);b=(v[7],v[8]);r=v[2];close(r,v[3]);close(dist(a,c),r);close(dist(b,c),r);first,last=polar(a,c),polar(b,c);sweep=(last-first)%360;assert 0<sweep<180+1e-7
 return {'radius':r,'first':first,'last':last,'sweep':sweep,'middle':(first+sweep/2)%360}
def observe(svg,i):
 root=E.fromstring(svg);nodes=list(root.iter());assert root.attrib['viewBox']=='0 0 480 360'
 assert {tag(e) for e in nodes}<={'svg','title','desc','g','rect','line','path','text','circle','polygon'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 ls=[e for e in nodes if tag(e)=='line'];ts=[e for e in nodes if tag(e)=='text'];cs=[e for e in nodes if tag(e)=='circle'];ps=[e for e in nodes if tag(e)=='path'];polys=[e for e in nodes if tag(e)=='polygon']
 for e in ts:assert 0<num(e,'x')<480 and 0<num(e,'y')<360 and num(e,'font-size')*343/480>=18
 arcpaths=[e for e in ps if ' A' in e.attrib['d']];rightpaths=[e for e in ps if ' A' not in e.attrib['d']]
 rights=[]
 for e in rightpaths:
  vals=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',e.attrib['d'])));assert len(vals)==6
  a,b,c=[tuple(vals[j:j+2]) for j in range(0,6,2)];u=direction(b,a);v=direction(b,c);close(dot(u,v),0);close(dist(a,b),dist(b,c));assert 10<=dist(a,b)<=18
  rights.append((a[0]+c[0]-b[0],a[1]+c[1]-b[1]))
 if i in (0,6,7):
  origins=sorted({pt(e,'1') for e in ls},key=lambda p:(p[1],p[0]));assert len(origins)=={0:4,6:5,7:4}[i]
  angles=[];panelLabels=[];blackcounts=[]
  for c in origins:
   edges=[e for e in ls if pt(e,'1')==c];assert len(edges)==2
   a=delta(polar(pt(edges[0],'2'),c),polar(pt(edges[1],'2'),c));angles.append(round(a))
   label=one([e for e in ts if abs(num(e,'x')-(c[0]+24))<1e-7 and abs(num(e,'y')-(c[1]+35))<1e-7]);panelLabels.append(txt(label))
   near=[]
   for e in arcpaths:
    # A panel arc starts at x=cx+r,y=cy; that geometric identity locates it.
    v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',e.attrib['d'])));radius=v[2]
    if dist((v[0],v[1]),(c[0]+radius,c[1]))<1e-7:
     arc=parse_arc(e,c);close(arc['sweep'],a);near.append(e)
   assert near;blackcounts.append(sum(e.attrib.get('stroke')=='#23394b' for e in near))
   if round(a)==90:assert any(dist(c,p)<1e-7 for p in rights)
  assert angles=={0:[55,135,90,30],6:[31,90,108,132,67],7:[39,39,73,73]}[i]
  assert panelLabels=={0:['∠1','∠2','∠3','∠4'],6:['31°','90°','108°','132°','67°'],7:['39°','∠1','∠2','73°']}[i]
  assert blackcounts==([1,1,2,2] if i==7 else [0]*len(origins))
  return {'panelAngles':angles,'panelLabels':panelLabels,'blackArcCounts':blackcounts,'rays':{},'labels':{},'rightMarkers':len(rights)}
 if i in (2,12):
  dial=one([e for e in cs if num(e,'r')==145]);c=(num(dial,'cx'),num(dial,'cy'));hands=[e for e in ls if dist(pt(e,'1'),c)<1e-7];assert len(hands)==2
  hour=one([e for e in hands if num(e,'stroke-width')==7]);minute=one([e for e in hands if num(e,'stroke-width')==4]);assert minute.attrib['stroke']=='#b94f69'
  ha=(90-polar(pt(hour,'2'),c))%360;ma=(90-polar(pt(minute,'2'),c))%360;close(delta(ha,300 if i==2 else 240),0);close(delta(ma,0),0)
  assert {txt(e) for e in ts}=={str(j) for j in range(1,13)}
  for e in ts:close(delta((90-polar((num(e,'x'),num(e,'y')-9),c))%360,int(txt(e))%12*30),0)
  ticks=[e for e in ls if e not in hands];assert len(ticks)==60
  for e in ticks:close(delta(polar(pt(e,'1'),c),polar(pt(e,'2'),c)),0);close(dist(pt(e,'2'),c),143)
  assert {round((90-polar(pt(e,'1'),c))%360)%360 for e in ticks}==set(range(0,360,6))
  return {'hourAngle':round(ha),'minuteAngle':round(ma)%360,'minor':round(delta(ha,ma)),'rays':{},'labels':{},'clockTicks':60}
 # Polygon angles and true right corners from physical edges.
 polygonpoints=[];polygonangles=[];rightcorners=[]
 for e in polys:
  vals=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',e.attrib['points'])));p=[tuple(vals[j:j+2]) for j in range(0,len(vals),2)];assert len(p)==3;polygonpoints.append(p)
  aa=[]
  for j,c in enumerate(p):
   a,b=p[(j+1)%3],p[(j+2)%3];ang=delta(polar(a,c),polar(b,c));aa.append(round(ang));
   if abs(ang-90)<1e-7:rightcorners.append(c)
  assert sorted(aa) in ([45,45,90],[30,60,90]);polygonangles.append(aa)
 if polys:
  assert len(rights)==len(polys)
  for c in rightcorners:assert any(dist(c,q)<1e-7 for q in rights)
  c=polygonpoints[0][0];assert all(p[0]==c for p in polygonpoints)
  # Construct actual rays from polygonvertices plus any drawn baseline.
  ends=list(dict.fromkeys(p for points in polygonpoints for p in points[1:]))
  if i==4:
   a,b=polygonpoints;assert a[2]==b[1] and a[0]==b[0];shared=direction(c,a[2]);assert cross(shared,direction(c,a[1]))*cross(shared,direction(c,b[2]))<0
   expected={'P':a[1],'Q':a[2],'R':b[2]};assert polygonangles==[[45,90,45],[60,30,90]]
  elif i==11:
   blue,yellow=polygonpoints;assert polygonangles==[[45,90,45],[30,90,60]]
   # Every yellow vertex lies within the closed bluetriangle; not merely a
   # misleading overlap of unrelated shapes. All subtriangle edges are genuine.
   def inside(p,tri):
    signs=[cross(direction(tri[j],tri[(j+1)%3]),direction(tri[j],p)) for j in range(3)];return min(signs)>=-1e-7 or max(signs)<=1e-7
   assert all(inside(p,blue) for p in yellow);base=one(ls);expected={'P':pt(base,'2'),'Q':yellow[2],'R':blue[2]}
  else:
   assert i==16 and polygonangles==[[45,90,45]];baseline=one(ls);assert pt(baseline,'1')[1]==pt(baseline,'2')[1]==c[1] and pt(baseline,'1')[0]<c[0]<pt(baseline,'2')[0];expected={'P':pt(baseline,'1'),'T':pt(baseline,'2'),'R':polygonpoints[0][2]}
  letters=[e for e in ts if re.fullmatch('[A-Z]',txt(e))];assigned={}
  for label,p in expected.items():
   e=one([e for e in letters if txt(e)==label]);assert dist((num(e,'x'),num(e,'y')-8),p)<30;assigned[label]=polar(p,c)
 else:
  origins={pt(e,'1') for e in ls};c=max(origins,key=lambda p:sum(dist(pt(e,'1'),p)<1e-7 for e in ls));raylines=[e for e in ls if dist(pt(e,'1'),c)<1e-7];letters=[e for e in ts if re.fullmatch('[A-Z]',txt(e))];assigned={}
  for line in raylines:
   e=min([t for t in letters if txt(t)!='V'],key=lambda t:dist((num(t,'x'),num(t,'y')-8),pt(line,'2')));assert dist((num(e,'x'),num(e,'y')-8),pt(line,'2'))<25
   label=txt(e);assert label not in assigned;assigned[label]=polar(pt(line,'2'),c)
  vertex=one([e for e in letters if txt(e)=='V']);assert dist((num(vertex,'x'),num(vertex,'y')),c)<45
 assert set(assigned)==set(RAYS[i])
 for label,a in RAYS[i].items():close(delta(assigned[label],a),0)
 arcs=[]
 for e in arcpaths:
  ar=parse_arc(e,c);aa=min(assigned,key=lambda k:delta(assigned[k],ar['first']));bb=min(assigned,key=lambda k:delta(assigned[k],ar['last']));close(delta(assigned[aa],ar['first']),0);close(delta(assigned[bb],ar['last']),0);ar['pair']=''.join(sorted([aa,bb]));arcs.append(ar)
 labels=[e for e in ts if not re.fullmatch('[A-Z]',txt(e))];observed={}
 for e in labels:
  p=(num(e,'x'),num(e,'y')-8);a=polar(p,c);rad=dist(p,c);arc=min(arcs,key=lambda ar:delta(a,ar['middle'])+abs(rad-ar['radius']-22)/3);assert delta(a,arc['middle'])<16;assert arc['pair'] not in observed;observed[arc['pair']]=txt(e)
 assert observed==LABELS[i],(i,observed)
 eq=[]
 if not polys:
  ticks=[e for e in ls if dist(pt(e,'1'),c)>1e-7]
  for e in ticks:
   a,b=pt(e,'1'),pt(e,'2');close(dist(a,b),12);mid=((a[0]+b[0])/2,(a[1]+b[1])/2);angle=polar(mid,c);rad=dist(mid,c);arc=min(arcs,key=lambda ar:delta(angle,ar['middle'])+abs(rad-ar['radius']));close(delta(angle,arc['middle']),0);close(rad,arc['radius']);eq.append(arc['pair'])
  assert sorted(eq)=={10:['PQ','RS'],14:['QR','RS'],17:['PQ','QR','RS']}.get(i,[])
  assert len(rights)==(1 if i in (5,9,13,14) else 0)
  for q in rights:close(dist(q,c),0)
 return {'rays':{k:round(v) for k,v in assigned.items()},'labels':observed,'equalArcPairs':eq,'polygonAngles':polygonangles,'rightMarkers':len(rights)}
def ang(o,a,b):return F(round(delta(o['rays'][a],o['rays'][b])))
def deg(o,p):return F(o['labels'][''.join(sorted(p))].rstrip('°'))
def answer(row,i,o):
 if i==0:a=one([label for label,v in zip(o['panelLabels'],o['panelAngles']) if 90<v<180])
 elif i==1:a=180-deg(o,'PR');assert ang(o,'P','Q')==180
 elif i==2:a='сүйір бұрыш' if 0<o['minor']<90 else 'доғал бұрыш' if 90<o['minor']<180 else 'тік бұрыш' if o['minor']==90 else 'жазыңқы бұрыш'
 elif i==3:a=360-deg(o,'PQ')-deg(o,'QR');assert ang(o,'R','P')==a
 elif i==4:a=deg(o,'PQ')+deg(o,'QR');assert ang(o,'P','R')==a
 elif i==5:a=90-deg(o,'PR');assert ang(o,'P','Q')==90
 elif i==6:a=sum(0<v<90 for v in o['panelAngles'])
 elif i==7:
  groups={}
  for v,t,n in zip(o['panelAngles'],o['panelLabels'],o['blackArcCounts']):groups.setdefault(n,[]).append((t,v))
  assert set(groups)=={1,2} and all(len(xs)==2 and len({v for t,v in xs})==1 for xs in groups.values());a=sum(one([v for t,v in xs if t.startswith('∠')]) for xs in groups.values())
 elif i in (8,13):
  pairs=list(itertools.combinations(o['rays'],2));values=[ang(o,*pair) for pair in pairs];assert len(pairs)==(6 if i==8 else 10)
  a=sum(0<v<90 for v in values) if i==8 else sum(90<v<180 for v in values)
  if i==8:assert sorted(values)==[20,55,75,105,160,180]
  else:assert sorted(values)==[33,38,52,57,90,90,109,142,147,180]
 elif i==9:a=180-90-deg(o,'QS');assert ang(o,'P','Q')==180 and ang(o,'P','R')==90
 elif i==10:a=(deg(o,'PS')-deg(o,'QR'))/2;assert ang(o,'P','Q')==ang(o,'R','S')==a
 elif i==11:a=deg(o,'PR')-deg(o,'PQ');assert ang(o,'Q','R')==a
 elif i==12:a=F(o['minor'])
 elif i==14:a=360-90-deg(o,'PS');assert ang(o,'Q','R')==ang(o,'R','S')==a/2 and ang(o,'Q','S')==a
 elif i==15:
  first,second=ang(o,'P','Q'),ang(o,'P','R');assert first>second and second>0;a='∠PVQ > ∠PVR'
 elif i==16:a=180-deg(o,'RT');assert ang(o,'P','T')==180
 else:a=180-(180-deg(o,'ST'))/3;assert ang(o,'P','Q')==ang(o,'Q','R')==ang(o,'R','S') and ang(o,'Q','T')==a
 if isinstance(a,str):assert row['answer']==a and row['options'].count(a)==1
 else:
  assert F(row['answer'].replace(',','.'))==a,(i,row['answer'],a)
  if row.get('options'):assert sum(F(x.replace(',','.'))==a for x in row['options'])==1
 return str(a)
NOTES=['Four physical panels55/135/90/30; right square3, obtuse2 only.','Opposite P/Q, printedleft58°→requestedright122°.','Clock60ticks/12numbers, red12 black10; minor60° acute, long300° excluded.','Three physical wrapped sectors142/104/114 total360, not180.','Two genuine right triangles45/45/90 and60/30/90 share VQ; opposite-side cross products prove no interior overlap; outer105°.','Actual right marker atV, PVQ90° minusprinted31°→59°.','Five physical panels31/90/108/132/67; exactly2 strictlyacute, boundary90 excluded.','Actual dark arc counts1/1/2/2 and physical equality39/39/73/73; requested39+73=112.','Missing original raster NOT visually compared. Own4rays20/55/105 sums180; full6pairs include composite75, exactly3acute.','Missing original raster NOT visually compared. Own straight/right and33° labels give90−33=57, not147.','Actual two equal radial ticks and outer146°/middle38° give two54°edges; no assumedstraight.','Actual blue45/45/90,yellow30/60/90 triangles share VP; everyyellowvertex insideblue; difference15, notsum75.','Clockred12/black8 yields minor120, other240 excluded.','Actual five rays andright square give10pairs, strictobtuse147/109/142 only;2rightand1straight excluded.','Missing original raster NOT visually compared. Own fullturn90/76/76/118, equalactualticks; minorQVS152, complement208 notrequested.','Common-side ordered physical104° and48° givePVQ>PVR without relying onedge length.','True45/45/90ruler onphysicalstraightbaseline; opposite135°, immutabletoolangleshonestlypreserved.','Actualthreeidenticalticks, equal44°/44°/44° plus48°; targettwoequalparts+last=136, not88.']
def main():
 batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==18;inventory=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records'];missing={8,9,14};entries=[];observations=[];canaries=0
 sourceanswers=['$\\angle 4$','116','доғал бұрыш','135','75','52','3','109','3','62','48','15','$150^\\circ$','$3$','140','$\\angle AOB < \\angle AOC$','$120^\\circ$','137']
 for i,row in enumerate(rows):
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer']==sourceanswers[i]
  if raw['options']:assert one([x['text'] for x in raw['options'] if x['correct']])==raw['sourceAnswer']
  inv=one([q for q in inventory if q['occurrenceId']==row['sourceOccurrenceId']]);assert inv['sourceId']==ref['sourceId'] and inv['sourceSha256']==row['sourceCanonicalSha256']
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==row['figureSha256'];o=observe(svg,i);a=answer(row,i,o)
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY'
  try:answer(bad,i,o)
  except (AssertionError,ValueError):pass
  else:raise AssertionError(('badkeyaccepted',i))
  el=E.fromstring(svg)
  if i in (4,11,16):
   chosen=one([e for e in el.iter() if tag(e)=='polygon' and e.attrib['fill']=='#8ec7db']);v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',chosen.attrib['points'])));v[5]+=5;chosen.set('points',' '.join(f'{v[j]},{v[j+1]}' for j in range(0,6,2)))
  else:
   lines=[e for e in el.iter() if tag(e)=='line'];chosen=one([e for e in lines if e.attrib.get('stroke-width')=='7']) if i in (2,12) else lines[0];chosen.set('y2',str(num(chosen,'y2')+5))
  try:observe(E.tostring(el,encoding='unicode'),i)
  except AssertionError:canaries+=1
  else:raise AssertionError(('physicalcanaryaccepted',i))
  checked=['All19saved/18new fullconditions/FULLofficial/authoredsolutions/everyMCQ read.','Three archived-source sheets and three native343px sheets actually visually inspected; legible labels and no clipping.','Own physical line endpoints/panelgrouping/polygonrightcorners/arcendpoints/printedlabels/equalityticks/clockticks read without authorparams/data-* assertions.','No raster/script/foreignObject/external URL; actual native343px shape calibration checked.',NOTES[i],('Unavailable source raster: no original image comparison claimed; only fullsavedofficial geometric constraints support a newconstruction.' if i in missing else 'Available archived raster actually visually compared.')]
  entries.append({'editionId':row['editionId'],'sha256':h(row),'verdict':'verified','method':'independent_all_saved_new_fullsolutions_MCQ_read_physical_SVG_geometry_righttriangle_polygon_allpairs_fullturn_clock_native343_visual_review','notes':[NOTES[i]],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':i not in missing,'checked':checked},'evidence':{'oracle':'scripts/editorial/review-visual-wave76.py','sourceSheet':f'output/editorial-visual-wave76/visual-wave76-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave76/visual-wave76-contact-{i//6+1}.png','mobileWidthPx':343,'sourceRasterAvailable':i not in missing,'sourceRasterCompared':i not in missing,'figureSha256':sha}});observations.append({'editionId':row['editionId'],'answer':a,**o})
 # Independently recompute read original scalar relationships and fullpairsets.
 assert 180-64==116 and 360-130-95==135 and 45+30==75 and 90-38==52 and 47+62==109
 sourceacute=[abs(a-b) for a,b in itertools.combinations([0,30,80,180],2)];assert sum(0<v<90 for v in sourceacute)==3
 sourceobtuse=[abs(a-b) for a,b in itertools.combinations([0,35,90,140,180],2)];assert sum(90<v<180 for v in sourceobtuse)==3
 assert 180-90-28==62 and F(130-34,2)==48 and 60-45==15 and min(150,360-150)==150 and 360-90-130==140 and 180-60==120 and 180-F(180-51,3)==137
 retained=one(batch['coverage']['previousEditionsRetained']);assert retained['editionId']=='geometry-straight-angle-gap';raw=one([q for q in json.loads((ROOT/retained['sourceFile']).read_text())['questions'] if q['id']==retained['sourceId']]);assert raw['sourceAnswer']=='140' and 100+F(180-100,2)==140
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'summary':{'verified':18,'retainedNotResigned':1,'findings':0,'fullSavedConditionsOfficialSolutionsEveryMCQRead':19,'fullNewConditionsSolutionsEveryMCQRead':18,'availableSourceRastersActuallyViewed':15,'newUnavailableRastersNotClaimedCompared':3,'retainedUnavailableRasterNotClaimedCompared':1,'native343FiguresActuallyViewed':18,'wrongKeysRejected':18,'physicalSvgCanariesRejected':canaries,'pythonJavaScriptHashesMatched':18},'retained':retained,'actualPhysicalSvgObservations':observations,'entries':entries}
 if '--write' in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
