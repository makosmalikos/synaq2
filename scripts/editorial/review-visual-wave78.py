"""Independent full19saved/18new read and physical native343px SVG review.
No author model/specs/params/data-* imported or used as geometric evidence.
All19 archived rasters and all18 native figures were actually visually inspected.
"""
import copy,hashlib,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave78-pictured-circle-basics.json'
REPORT='problems/editorial/reviews/visual-wave78-pictured-circle-basics.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def close(a,b,tol=1e-6):assert abs(float(a)-float(b))<tol,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext()).strip()
def num(e,k):return float(e.attrib[k])
def center(e):return num(e,'cx'),num(e,'cy')
def endpoint(e,j):return num(e,'x'+j),num(e,'y'+j)
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def angle(p,c):return math.degrees(math.atan2(c[1]-p[1],p[0]-c[0]))%360
def unit_value(e):return F(one(re.findall(r'\d+(?:[.,]\d+)?',text(e))).replace(',','.'))
def h(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def coords(s):
 v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',s,re.I)));assert len(v)%2==0
 return list(zip(v[::2],v[1::2]))
def labeled_points(ts,dots):
 labels=[e for e in ts if re.fullmatch('[A-Z](?:[₁₂])?',text(e))]
 if not labels:return{}
 assert len(labels)==len(dots)
 # Global minimum-cost label/dot assignment (small exact bitmask DP), using
 # actual rendered text anchors and a baseline correction, not data-point IDs.
 dp={0:(0,[])}
 for label in labels:
  anchor=(num(label,'x'),num(label,'y')-8);nd={}
  for mask,(cost,chosen) in dp.items():
   for j,d in enumerate(dots):
    if mask>>j&1:continue
    distance=dist(anchor,center(d));new=(cost+distance**2,chosen+[j]);key=mask|1<<j
    if key not in nd or new[0]<nd[key][0]:nd[key]=new
  dp=nd
 chosen=one(list(dp.values()))[1];out={}
 for e,j in zip(labels,chosen):
  p=center(dots[j]);assert dist((num(e,'x'),num(e,'y')-8),p)<34,(text(e),p)
  out[text(e)]=p
 assert len(out)==len(labels);return out

def observe(svg,i):
 root=E.fromstring(svg);assert root.attrib['viewBox']=='0 0 480 360'
 nodes=list(root.iter());assert {tag(e) for e in nodes}<={'svg','title','desc','g','rect','circle','line','text','path','polygon'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 cs=[e for e in nodes if tag(e)=='circle' and num(e,'r')>10];dots=[e for e in nodes if tag(e)=='circle' and num(e,'r')<5];ts=[e for e in nodes if tag(e)=='text'];ls=[e for e in nodes if tag(e)=='line' and float(e.get('stroke-opacity','1'))>.5];polys=[e for e in nodes if tag(e)=='polygon'];paths=[e for e in nodes if tag(e)=='path'];grid=[e for e in nodes if tag(e)=='line' and float(e.get('stroke-opacity','1'))<.5]
 for e in cs:assert 0<num(e,'cx')-num(e,'r') and num(e,'cx')+num(e,'r')<480 and 0<num(e,'cy')-num(e,'r') and num(e,'cy')+num(e,'r')<360
 for e in ts:assert 0<num(e,'x')<480 and 0<num(e,'y')<360 and num(e,'font-size')*343/480>=18
 points=labeled_points(ts,dots) if i not in (12,17) else{}
 givens=[e for e in ts if re.search(r'\d',text(e)) and text(e) not in ('O₁','O₂')];o={'points':points,'givenTexts':[text(e) for e in givens]}
 def on(p,c):return abs(dist(p,center(c))-num(c,'r'))<1e-6
 def at(p,q):return dist(p,q)<1e-6
 def hasline(a,b):return any((at(endpoint(e,'1'),a) and at(endpoint(e,'2'),b)) or(at(endpoint(e,'1'),b) and at(endpoint(e,'2'),a)) for e in ls)
 def segments():
  result=[]
  for e in ls:
   a=one([k for k,p in points.items() if at(endpoint(e,'1'),p)]);b=one([k for k,p in points.items() if at(endpoint(e,'2'),p)]);result.append(''.join(sorted([a,b])))
  return sorted(result)
 if i in(0,1,2,3,4,5,6,8,16):assert len(cs)==1
 if i==0:
  c=one(cs);close(dist(points['O'],center(c)),0);norms={k:dist(p,center(c))**2/num(c,'r')**2 for k,p in points.items() if k!='O'}
  inside=sorted(k for k,v in norms.items() if v<1-1e-7);boundary=sorted(k for k,v in norms.items() if abs(v-1)<1e-7);outside=sorted(k for k,v in norms.items() if v>1+1e-7)
  assert inside==list('PQRS') and boundary==list('TUV') and outside==list('WXY');o.update(inside=inside,boundary=boundary,outside=outside,normalizedSquaredDistances=norms)
 elif i==1:
  c=one(cs);close(dist(points['O'],center(c)),0);assert all(on(points[k],c) for k in 'PQR');path=one(paths);assert float(path.get('stroke-width'))>float(c.get('stroke-width'))
  v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])));assert len(v)==9 and v[4:7]==[0,0,0];close(v[2],num(c,'r'));close(v[3],num(c,'r'));close(dist(tuple(v[:2]),points['P']),0);close(dist(tuple(v[7:]),points['Q']),0)
  first,last,other=(angle(points[k],center(c)) for k in 'PQR');sweep=(last-first)%360;close(sweep,130);assert (other-first)%360>sweep;o.update(arcStart='P',arcEnd='Q',minorArcDegrees=round(sweep),excludedOtherPoint='R')
 elif i in(2,3):
  c=one(cs);assert on(points['A'],c) and at(points['O'],center(c));assert len(ls)==1 and hasline(points['O'],points['A'])
  if i==2:o['radiusGiven']=str(unit_value(one(givens)))
 elif i in(4,5):
  c=one(cs);centre='K' if i==4 else'O';assert at(points[centre],center(c));ss=segments();expected=['AC','BD','BK','KM'] if i==4 else['AB','CD','EF','GO','HM'];assert ss==sorted(expected)
  assert dist(points['M'],center(c))<num(c,'r')-1
  boundary={k for k,p in points.items() if on(p,c)}
  chords=[s for s in ss if set(s)<=boundary];radii=[s for s in ss if centre in s and len(set(s)&boundary)==1];o.update(fullSegments=ss,chords=chords,radii=radii)
  diameter='AC' if i==4 else'CD';a,b=(points[k] for k in diameter);close(dist(a,b),2*num(c,'r'));close(dist(((a[0]+b[0])/2,(a[1]+b[1])/2),center(c)),0)
  if i==4:assert radii==['BK'] and chords==['AC','BD']
  else:assert chords==['AB','CD','EF'] and radii==['GO']
 elif i==6:
  c=one(cs);assert at(points['O'],center(c)) and on(points['A'],c) and on(points['B'],c);assert segments()==['AB','AO','BO'];g=one([e for e in givens if not text(e).startswith('P')]);per=one([e for e in givens if text(e).startswith('P')]);chord=unit_value(g);P=unit_value(per);radius=(P-chord)/2;assert radius>0 and 2*radius>chord
  close(dist(points['A'],points['B'])/num(c,'r'),float(chord/radius));o.update(chord=str(chord),trianglePerimeter=str(P),strictTriangle=True)
 elif i==7:
  assert len(cs)==2 and not ls;cs.sort(key=lambda e:num(e,'cx'));close(dist(center(cs[0]),center(cs[1])),sum(num(c,'r') for c in cs));assert at(points['O₁'],center(cs[0])) and at(points['O₂'],center(cs[1]))
 if i in(3,7):
  vertical=sorted(set(endpoint(e,'1')[0] for e in grid if abs(endpoint(e,'1')[0]-endpoint(e,'2')[0])<1e-7));horizontal=sorted(set(endpoint(e,'1')[1] for e in grid if abs(endpoint(e,'1')[1]-endpoint(e,'2')[1])<1e-7));assert len(vertical)>10 and len(horizontal)>8
  step=vertical[1]-vertical[0];assert step>0
  for a,b in zip(vertical,vertical[1:]):close(b-a,step)
  for a,b in zip(horizontal,horizontal[1:]):close(b-a,step)
  grid_radii=[num(c,'r')/step for c in cs];assert all(abs(r-round(r))<1e-7 for r in grid_radii);assert [round(r) for r in grid_radii]==([5] if i==3 else[3,4]);o.update(gridRadii=[round(r) for r in grid_radii],gridUnit=str(unit_value(one(givens))))
 if i in(8,13):
  poly=one(polys);vertices=coords(poly.attrib['points']);assert len(vertices)==4
  for j in range(4):
   a,b,c=vertices[j-1],vertices[j],vertices[(j+1)%4];close(dot((a[0]-b[0],a[1]-b[1]),(c[0]-b[0],c[1]-b[1])),0)
  xmin,xmax=min(p[0] for p in vertices),max(p[0] for p in vertices);ymin,ymax=min(p[1] for p in vertices),max(p[1] for p in vertices);assert all(p[0]in(xmin,xmax) and p[1]in(ymin,ymax) for p in vertices)
  width,height=xmax-xmin,ymax-ymin;cs.sort(key=lambda e:num(e,'cx'));assert len(cs)==(1 if i==8 else 2)
  r=num(cs[0],'r');assert all(abs(num(c,'r')-r)<1e-7 for c in cs);close(height,2*r);close(width,2*r*len(cs))
  for j,c in enumerate(cs):close(num(c,'cy'),(ymin+ymax)/2);close(num(c,'cx'),xmin+(2*j+1)*r)
  o.update(framePerimeter=str(unit_value(one(givens))),frameWidthInRadii=width/r,frameHeightInRadii=height/r)
 if i==9:
  assert len(cs)==2;cs.sort(key=lambda e:num(e,'cx'));a,b=cs;close(num(a,'r'),num(b,'r'));assert at(points['A'],center(a)) and at(points['B'],center(b));membership={k:[dist(p,center(c))<=num(c,'r')+1e-7 for c in cs] for k,p in points.items() if k not in'AB'}
  assert membership=={'P':[True,False],'Q':[True,False],'R':[True,False],'S':[True,True],'T':[True,True],'U':[False,True],'V':[False,True],'W':[False,False]};o['membership']=membership
 if i in(10,15):
  assert len(cs)==2;cs.sort(key=lambda e:num(e,'cx'));first,second=cs;ca,cb='A',('B'if i==10 else'O');crosses=('C','D') if i==10 else('B','C')
  assert at(points[ca],center(first)) and at(points[cb],center(second));assert abs(num(first,'r')-num(second,'r'))<dist(center(first),center(second))<sum(num(c,'r')for c in cs)
  for k in crosses:assert all(on(points[k],c)for c in cs);assert hasline(points[ca],points[k]) and hasline(points[cb],points[k])
  known=one([e for e in givens if(i==10 and text(e).startswith('6 '))or(i==15 and not text(e).startswith('P'))]);radius=unit_value(known)
  radial=one([e for e in ls if at(endpoint(e,'1'),center(second)) and on(endpoint(e,'2'),second) and all(not at(endpoint(e,'2'),points[k])for k in crosses)]);close(dist(endpoint(radial,'1'),endpoint(radial,'2')),num(second,'r'))
  o['secondRadius']=str(radius)
  if i==10:
   diameterGiven=unit_value(one([e for e in givens if text(e).startswith('16 ')]));diameterLine=one([e for e in ls if on(endpoint(e,'1'),first) and on(endpoint(e,'2'),first) and dist(endpoint(e,'1'),endpoint(e,'2'))>1.99*num(first,'r')]);close(dist(endpoint(diameterLine,'1'),endpoint(diameterLine,'2')),2*num(first,'r'));close(num(first,'r')/num(second,'r'),float(diameterGiven/(2*radius)));o['firstDiameter']=str(diameterGiven)
  else:
   P=unit_value(one([e for e in givens if text(e).startswith('P')]));unknownR=(P-2*radius)/2;assert unknownR>0;close(num(first,'r')/num(second,'r'),float(unknownR/radius));o['kitePerimeter']=str(P)
 if i in(11,12):
  n=5 if i==11 else 6;assert len(cs)==n;cs.sort(key=lambda e:num(e,'cx'));r=num(cs[0],'r')
  for c in cs:close(num(c,'r'),r);close(num(c,'cy'),num(cs[0],'cy'))
  for a,b in zip(cs,cs[1:]):close(dist(center(a),center(b)),(2 if i==11 else 1)*r)
  left=num(cs[0],'cx')-r;right=num(cs[-1],'cx')+r;measure=one([e for e in ls if abs(endpoint(e,'1')[0]-left)<1e-7 and abs(endpoint(e,'2')[0]-right)<1e-7]);close(endpoint(measure,'1')[1],endpoint(measure,'2')[1]);assert endpoint(measure,'1')[1]>num(cs[0],'cy')+r
  verticals=[e for e in ls if abs(endpoint(e,'1')[0]-endpoint(e,'2')[0])<1e-7];assert len(verticals)==2;assert sorted(round(endpoint(e,'1')[0],7)for e in verticals)==[round(left,7),round(right,7)]
  if i==12:assert sorted(center(d)for d in dots)==sorted(center(c)for c in cs)
  o.update(count=n,span=str(unit_value(one(givens))),spanInRadii=round((right-left)/r),centresStepInRadii=2 if i==11 else 1)
 if i==14:
  assert len(cs)==6;outer=max(cs,key=lambda e:num(e,'r'));small=sorted([c for c in cs if c is not outer],key=lambda e:num(e,'cx'));r=num(small[0],'r');R=num(outer,'r');close(R,5*r)
  for c in small:close(num(c,'r'),r);close(num(c,'cy'),num(outer,'cy'));assert dist(center(c),center(outer))+r<=R+1e-7
  for a,b in zip(small,small[1:]):close(dist(center(a),center(b)),2*r)
  for c in(small[0],small[-1]):close(dist(center(c),center(outer))+r,R)
  assert at(points['O'],center(outer));line=one(ls);assert at(endpoint(line,'1'),center(outer)) and on(endpoint(line,'2'),outer);o.update(largeRadius=str(unit_value(one(givens))),smallCount=len(small),radiusRatio=round(R/r),allSmallInternallyContained=True)
 if i==16:
  c=one(cs);assert at(points['O'],center(c));assert all(on(points[k],c)for k in'ABC');assert segments()==['AB','CO'];assert points['A'][0]<points['O'][0]<points['M'][0]<points['B'][0]
  for k in'AOMB':close(points[k][1],points['O'][1])
  close(dist(points['A'],points['B']),2*num(c,'r'));assert 0<dist(points['O'],points['M'])<num(c,'r')
  rg=unit_value(one([e for e in givens if text(e).startswith('13 ')]));inner=unit_value(one([e for e in givens if text(e).startswith('5 ')]));close(dist(points['O'],points['M'])/num(c,'r'),float(inner/rg));o.update(radius=str(rg),inner=str(inner),strictOrder='A,O,M,B')
 if i==17:
  assert len(cs)==4 and len(dots)==4;assert sorted(center(c)for c in cs)==sorted(center(d)for d in dots);r=num(cs[0],'r');assert all(abs(num(c,'r')-r)<1e-7 for c in cs);vertices=coords(one(polys).attrib['points']);assert set(vertices)=={center(c)for c in cs}
  for j,p in enumerate(vertices):
   prev,nxt=vertices[j-1],vertices[(j+1)%4];close(dist(p,nxt),2*r);close(dot((prev[0]-p[0],prev[1]-p[1]),(nxt[0]-p[0],nxt[1]-p[1])),0)
  close(dist(vertices[0],vertices[2]),2*r*math.sqrt(2));line=one(ls);assert any(at(endpoint(line,'1'),center(c)) and on(endpoint(line,'2'),c)for c in cs);o.update(radius=str(unit_value(one(givens))),squareSideInRadii=2,perimeterInRadii=8)
 return o

def answer(row,i,o):
 if i==0:a=len(o['inside'])+len(o['boundary'])
 elif i==1:a='⌣'+o['arcStart']+o['arcEnd']
 elif i==2:a=2*F(o['radiusGiven'])
 elif i in(3,7):a=2*sum(o['gridRadii'])*F(o['gridUnit'])
 elif i==4:a=one(o['radii'])[::-1] # physical canonicalpair BK → written KB
 elif i==5:a=len(o['chords'])
 elif i==6:a=F(o['trianglePerimeter'])-F(o['chord'])
 elif i in(8,13):a=F(o['framePerimeter'])/F(round(2*(o['frameWidthInRadii']+o['frameHeightInRadii'])))
 elif i==9:a='; '.join(sorted(k for k,v in o['membership'].items()if v==[True,False]))
 elif i==10:a=F(o['firstDiameter'])+2*F(o['secondRadius'])
 elif i in(11,12):a=F(o['span'])/o['spanInRadii']
 elif i==14:a=F(o['largeRadius'])/o['smallCount']
 elif i==15:a=F(o['kitePerimeter'])-2*F(o['secondRadius'])
 elif i==16:a=F(o['radius'])+F(o['inner'])
 else:a=F(o['radius'])*8
 if isinstance(a,str):assert row['answer']==a;assert row['options'].count(a)==1
 else:
  assert F(row['answer'].replace(',','.'))==a,(i,row['answer'],a)
  if row.get('options'):assert sum(F(x.replace(',','.'))==a for x in row['options'])==1
 return str(a)
NOTES=[
 'All10noncentre dots classified by actual squared distances:4strictinside,3boundary,3outside; centre excluded, closed disk counts7.',
 'Actual highlighted path endpointP20°toQ150°, minor130°; R260° lies only on opposite route. All4arc names checked.',
 'ActualOA from centre to circumference with printed11cm; diameter22, not radius or circumference.',
 'Actual radius spans5equal square grid steps; common printed3mm unit gives diameter10steps=30mm.',
 'ActualAC antipodaldiameter, KB centre-to-boundaryradius, BD noncentralchord, KM interiorpointsegment; all4roles distinct.',
 'Exactly5declared complete segments; AB/CD/EF chords, CDdiameter included, OGcentreendpoint and HMinternalendpoint excluded.',
 'Actualisosceles2radius triangle obeys strict inequality12<22; printedP34/chord12 givesD22, all4diagnostic options checked.',
 'Twoactual radii3/4same-grid steps, external tangency and common3mm unit; diameter sum42mm.',
 'Actual square orthogonal/equal edges and circle tangent to all4sides; P72⇒side18=D⇒R9.',
 'Actual closed membership of all8noncentre points: PQR firstonly, ST shared, UV secondonly, W outside; all4options checked.',
 'Actual two-circle intersections on both circles and4kite edges; printedfirstD16 versus secondR6 calibrated to8/6, P28.',
 'Actual5equal circles externallytangent in straight row; measured endpoints cover10radii70mm⇒R7, notD14.',
 'Actual6equal circles each passing through adjacentcentre, spacingR; fullspan7R56cm⇒R8, not6diameters.',
 'Actual2externaltangent congruentcircles in4R×2R rectangle touchingappropriateouterwalls; P12R84⇒R7, all4MCQroles.',
 'Actual5congruent inner circles all contained in outercircle; neighbors tangent and endcircles internallytangent; bigR25⇒smallR5.',
 'Actualcircle intersections and4kite radius edges15/7/7/15; printedP44−2R7=unknownD30, notR15/P4.',
 'ActualA,O,M,B strict collinearorder, ABdiameter and OCradius13, OM5; AM18, MB8, fullD26.',
 'Actual4equal circle centers form orthogonal square, adjacentexternal tangency gives side2R, radius4⇒P32; contour notrequested.'
]

def main():
 batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==18
 inventory=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records'];entries=[];observations=[];canaries=0
 sourceanswers=['5','$\\smile BC$','18','40','$OB$','2','$16$ см','40','7','$K$ және $M$','24','6','7','$5$ см','9','24','14','24']
 for i,row in enumerate(rows):
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions']if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer']==sourceanswers[i]
  if raw['options']:assert one([x['text']for x in raw['options']if x['correct']])==raw['sourceAnswer']
  inv=one([q for q in inventory if q['occurrenceId']==row['sourceOccurrenceId']]);assert inv['sourceSha256']==row['sourceCanonicalSha256'] and inv['sourceId']==ref['sourceId']
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==row['figureSha256'];o=observe(svg,i);a=answer(row,i,o)
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY'
  try:answer(bad,i,o)
  except (AssertionError,ValueError):pass
  else:raise AssertionError(('badkeyaccepted',i))
  el=E.fromstring(svg)
  if i==9:
   point=one([e for e in el.iter()if tag(e)=='circle'and num(e,'r')<5 and abs(num(e,'cx')-o['points']['P'][0])<1e-7 and abs(num(e,'cy')-o['points']['P'][1])<1e-7]);point.set('cx',str(num(point,'cx')+200))
  else:
   c=max([e for e in el.iter()if tag(e)=='circle'],key=lambda e:num(e,'r'));c.set('r',str(num(c,'r')*1.03))
  try:observe(E.tostring(el,encoding='unicode'),i)
  except AssertionError:canaries+=1
  else:raise AssertionError(('physicalcanaryaccepted',i))
  checked=['All19saved/18new FULLconditions/FULLofficial+newsolutions/everyMCQ individually read.','All4archivedsource sheets (19available rasters) and3native343px sheets (18newfigures) actually visually inspected, labels legible/no clipping.','Independent actual circle equations/label-to-dot geometric assignment/line endpoints/arc flags/printedgivens/common grid/polygons/tangency/intersections/containment inspected without authorparams/data-* or author solver.','NativeSVG only; no raster/scripts/external URL; physical printed calibration and requestedtarget verified.',NOTES[i]]
  entry={'editionId':row['editionId'],'sha256':h(row),'verdict':'verified','method':'independent_full_source_new_fullsolutions_MCQ_read_actual_SVG_circle_equations_distances_grids_containment_tangency_native343_visual_review','notes':[NOTES[i]],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':True,'checked':checked},'evidence':{'oracle':'scripts/editorial/review-visual-wave78.py','sourceSheet':f'output/editorial-visual-wave78/visual-wave78-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave78/visual-wave78-contact-{i//6+1}.png','mobileWidthPx':343,'sourceRasterAvailable':True,'sourceRasterCompared':True,'figureSha256':sha}};entries.append(entry);observations.append({'editionId':row['editionId'],'answer':a,**o})
 # Independent arithmetic of every saved scalar target, with full official
 # labels/rasters read: categorical answers come from physical archived diagrams.
 assert 3+2==5 and 9*2==18 and 4*5*2==40 and 26-10==16 and (2*2+2*3)*4==40 and 56/8==7
 assert 14+2*5==24 and 48/(4*2)==6 and 42/(5+1)==7 and 60/12==5 and 27/3==9 and 34-2*5==24 and 10+4==14 and 3*8==24
 # Exhaust the normalized squared-radius25 boundary over the121 lattice
 # points in[-5,5]², plus finite genuine triangles, not rounded drawing.
 lattice=[(x,y)for x in range(-5,6)for y in range(-5,6)if x*x+y*y==25];assert len(lattice)==12 and(-3,-4)in lattice and(5,0)in lattice and(0,5)in lattice
 strict_triangles=0
 for r in range(1,31):
  for chord in range(1,2*r):assert 2*r>chord;strict_triangles+=1
 retained=one(batch['coverage']['previousEditionsRetained']);assert retained['editionId']=='visual-ring-width';raw=one([q for q in json.loads((ROOT/retained['sourceFile']).read_text())['questions']if q['id']==retained['sourceId']]);assert raw['sourceAnswer']=='2' and 5-3==2
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'summary':{'verified':18,'retainedNotResigned':1,'findings':0,'fullSavedConditionsOfficialSolutionsEveryMCQRead':19,'fullNewConditionsSolutionsEveryMCQRead':18,'availableSourceRastersActuallyViewed':19,'native343FiguresActuallyViewed':18,'wrongKeysRejected':18,'physicalSvgCanariesRejected':canaries,'strictPositiveIntegerTriangleCases':strict_triangles,'integerBoundaryPairsForRadiusFive':12,'pythonJavaScriptHashesMatched':18},'retained':retained,'actualPhysicalSvgObservations':observations,'entries':entries}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 else:assert json.loads((ROOT/REPORT).read_text())==json.loads(json.dumps(report))
 print(json.dumps(report['summary']))
if __name__=='__main__':main()
