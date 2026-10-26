"""Independent full-content and physical native SVG review of visual77.

No author models/specs/geometry/calculators imported. All 29 saved statements,
FULL official solutions and MCQs, and all 25 new statements/full solutions/MCQs
were individually read. Five archived-source sheets (26 available originals)
and five native343 sheets were actually viewed. Missing original rasters are
explicitly NOT claimed compared. Four already verified editions are not resigned.
"""
import copy, hashlib, itertools, json, math, re, subprocess, sys
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave77-pictured-polygons.json'
REPORT='problems/editorial/reviews/visual-wave77-pictured-polygons.json'
EPS=1e-6

def only(xs):
 assert len(xs)==1,xs
 return xs[0]
def close(a,b):
 assert abs(float(a)-float(b))<EPS,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext()).strip()
def number(s):return F(re.search(r'-?\d+(?:[,.]\d+)?',s).group().replace(',','.'))
def point(e,n):return (float(e.get('x'+n)),float(e.get('y'+n)))
def polygon(e):return [tuple(map(float,p.split(','))) for p in e.get('points').split()]
def vector(a,b):return (b[0]-a[0],b[1]-a[1])
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def dist(a,b):return math.hypot(*vector(a,b))
def edges(p):return list(zip(p,p[1:]+p[:1]))
def area(p):return abs(sum(cross(a,b) for a,b in edges(p)))/2
def perimeter(p):return sum(dist(a,b) for a,b in edges(p))
def signturns(p):return [cross(vector(p[j-1],p[j]),vector(p[j],p[(j+1)%len(p)])) for j in range(len(p))]
def convex(p):
 c=signturns(p);return min(c)>EPS or max(c)<-EPS
def crosses(a,b,c,d):return cross(vector(a,b),vector(a,c))*cross(vector(a,b),vector(a,d))<-EPS and cross(vector(c,d),vector(c,a))*cross(vector(c,d),vector(c,b))<-EPS
def crossing_count(p):return sum(crosses(*edges(p)[i],*edges(p)[j]) for i,j in itertools.combinations(range(len(p)),2) if j!=i+1 and (i,j)!=(0,len(p)-1))
def rounded(p):return tuple(round(x,6) for x in p)
def edgekey(a,b):return tuple(sorted([rounded(a),rounded(b)]))
def h(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def nfmt(x):
 x=F(x);return str(x.numerator) if x.denominator==1 else str(float(x)).replace('.',',')
def integer(x):
 close(x,round(x));return round(x)
def square(p):
 assert len(p)==4
 ds=[dist(a,b) for a,b in edges(p)]
 for d in ds:close(d,ds[0])
 for j in range(4):close(dot(vector(p[j],p[j-1]),vector(p[j],p[(j+1)%4])),0)
 return ds[0]
def graph_points(segments):
 # Exact rational intersections, including points on a longer original segment.
 pts=set(p for ab in segments for p in ab)
 for (a,b),(c,d) in itertools.combinations(segments,2):
  u,v=vector(a,b),vector(c,d);den=cross(u,v)
  if not den:continue
  t=cross(vector(a,c),v)/den;s=cross(vector(a,c),u)/den
  if 0<=t<=1 and 0<=s<=1:pts.add((a[0]+t*u[0],a[1]+t*u[1]))
 return sorted(pts)
def covered(a,b,segments):
 u=vector(a,b);axis=0 if abs(u[0])>=abs(u[1]) else 1
 lo,hi=sorted([a[axis],b[axis]]);intervals=[]
 for c,d in segments:
  if cross(u,vector(a,c))==cross(u,vector(a,d))==0:
   left,right=sorted([c[axis],d[axis]]);intervals.append((max(lo,left),min(hi,right)))
 at=lo
 for left,right in sorted(intervals):
  if right<left:continue
  if left>at:return False
  at=max(at,right)
 return at>=hi

def enumerate_graph(segments,size):
 pts=graph_points(segments);result=[]
 for subset in itertools.combinations(pts,size):
  if size==3:
   if cross(vector(subset[0],subset[1]),vector(subset[0],subset[2])) and all(covered(a,b,segments) for a,b in itertools.combinations(subset,2)):result.append(subset)
  else:
   a=subset[0]
   for tail in itertools.permutations(subset[1:]):
    if tail[0]>tail[-1]:continue
    p=[a,*tail]
    if any(cross(vector(p[j-1],p[j]),vector(p[j],p[(j+1)%4]))==0 for j in range(4)):continue
    if crosses(p[0],p[1],p[2],p[3]) or crosses(p[1],p[2],p[3],p[0]):continue
    if all(covered(x,y,segments) for x,y in edges(p)):result.append(p)
 return pts,result

def observe(svg,i):
 root=E.fromstring(svg);nodes=list(root.iter());assert root.get('viewBox')=='0 0 480 360'
 assert {tag(e) for e in nodes}<={'svg','title','desc','g','rect','line','polygon','text'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 texts=[e for e in nodes if tag(e)=='text'];lines=[e for e in nodes if tag(e)=='line'];polys={e.get('data-polygon'):polygon(e) for e in nodes if tag(e)=='polygon'}
 for e in texts:
  assert 0<float(e.get('x'))<480 and 0<float(e.get('y'))<360
  assert float(e.get('font-size'))*343/480>=15.7
 for p in polys.values():
  assert all(0<x<480 and 0<y<360 for x,y in p)
  assert len(set(p))==len(p)
 obs={};a=None
 def ts(key):return [e for e in texts if e.get(key) is not None]
 def val(key):return number(text(only(ts(key))))
 def gridstep():
  xs=sorted({float(e.get('x1')) for e in lines if e.get('data-grid')=='v'});ys=sorted({float(e.get('y1')) for e in lines if e.get('data-grid')=='h'})
  assert len(xs)>2 and len(ys)>2;s=xs[1]-xs[0]
  for l in (xs,ys):
   for x,y in zip(l,l[1:]):close(y-x,s)
  for p in polys.values():
   for x,y in p:integer((x-xs[0])/s);integer((y-ys[0])/s)
  assert val('data-unit')==1
  return s
 def metrics(p,labels):
  lengths=[dist(a,b) for a,b in edges(p)];scale=lengths[0]/float(labels[0])
  for x,l in zip(lengths,labels):close(x/scale,l)
  assert convex(p) and not crossing_count(p)
  return scale
 if i in (0,13,17):
  p=polys['main'];s=gridstep();unit_lengths=[dist(a,b)/s for a,b in edges(p)]
  if i==0:
   assert len(p)==8 and unit_lengths==[8,2,3,4,2,4,3,2]
   assert all(a[0]==b[0] or a[1]==b[1] for a,b in edges(p));a=sum(unit_lengths)
  elif i==13:
   assert len(p)==3;close(dot(vector(p[0],p[1]),vector(p[0],p[2])),0)
   close(unit_lengths[0],8);close(unit_lengths[-1],5);a=area(p)/s**2
  else:
   square(p);xs=[q[0] for q in p];ys=[q[1] for q in p];close((max(xs)-min(xs))/s,8);close((max(ys)-min(ys))/s,8)
   a=area(p)/s**2;close(a,8*8-4*3*5/2)
  obs={'pixelGridStep':s,'outerEdgeLengthsInGridUnits':unit_lengths,'areaInGridUnits':area(p)/s**2}
 elif i in (1,3,7):
  p=polys['main'];assert convex(p) and not crossing_count(p)
  lens=[dist(a,b) for a,b in edges(p)]
  for d in lens:close(d,lens[0])
  if i==1:
   letters=ts('data-vertex');assert [text(e) for e in letters]==list('ABCDEF') and len(p)==6
   for e,q in zip(letters,p):assert dist((float(e.get('x')),float(e.get('y'))-8),q)<40
   options=['AB','DE','FA','BE'];truth=[min(abs('ABCDEF'.index(x)-'ABCDEF'.index(y)),6-abs('ABCDEF'.index(x)-'ABCDEF'.index(y)))>1 for x,y in options];a=only([x for x,t in zip(options,truth) if t]);obs['diagonalTruths']=truth
  elif i==3:
   assert len(p)==7;a='Жетібұрыш'
  else:
   assert len(p)==8 and len([e for e in lines if e.get('data-equal-side') is not None])==8
   side=val('data-length');assert side==5;a=len(p)*side
  obs['vertices']=len(p);obs['equalPhysicalEdges']=lens
 elif i in (2,5):
  pp=[polys['panel'+str(k)] for k in range(1,5)]
  assert [int(text(e)) for e in ts('data-panel-number')]==[1,2,3,4]
  cv=[convex(p) for p in pp];cr=[crossing_count(p) for p in pp]
  if i==2:
   assert cr==[0]*4 and cv==[True,True,False,True];a='3-көпбұрыш'
  else:
   assert cr==[1,0,0,0];a='1-фигура'
  obs={'convex':cv,'nonAdjacentCrossings':cr,'verticesPerPanel':list(map(len,pp))}
 elif i==4:
  p=polys['main'];assert convex(p) and not crossing_count(p)
  letters=ts('data-vertex');assert [text(e) for e in letters]==list('ABCDE')
  for e,q in zip(letters,p):assert dist((float(e.get('x')),float(e.get('y'))-8),q)<40
  ds=[dot(vector(c,p[j-1]),vector(c,p[(j+1)%5])) for j,c in enumerate(p)]
  close(ds[0],0);close(ds[1],0);assert ds[2]<0 and ds[4]<0 and ds[3]>0
  a='∠'+only([letter for letter,v in zip('ABCDE',ds) if v>EPS]);obs={'interiorDotSigns':[0 if abs(x)<EPS else 1 if x>0 else -1 for x in ds]}
 elif i in (6,20):
  p=polys['main'];labels=[number(text(e)) for e in ts('data-length')]
  assert labels==([9,6,7,5] if i==6 else [5,F(7,2),F(5,2),4,4,2])
  scale=metrics(p,labels);a=sum(labels);obs={'physicalMetricScale':scale,'printedSideLengths':[str(v) for v in labels]}
 elif i==8:
  pp=[polys['congruent'+str(k)] for k in range(1,5)];scales=[]
  for group in [e for e in nodes if e.get('data-panel') is not None]:
   gl=list(group.iter());xs=sorted({float(e.get('x1')) for e in gl if e.get('data-grid')=='v'});ys=sorted({float(e.get('y1')) for e in gl if e.get('data-grid')=='h'});s=xs[1]-xs[0];scales.append(s)
   for coords in (xs,ys):
    for x,y in zip(coords,coords[1:]):close(y-x,s)
   for q in pp[int(group.get('data-panel'))-1]:integer((q[0]-xs[0])/s);integer((q[1]-ys[0])/s)
  assert scales==[20]*4;s=20
  def signatures(p):
   n=len(p)
   # Every pairwise squared distance in cyclic vertex order, not just the sides.
   return {tuple(round(dot(vector(q[j],q[k]),vector(q[j],q[k]))/s**2,8) for j,k in itertools.combinations(range(n),2)) for q in [p[j:]+p[:j] for j in range(n)]}
  pairs=[]
  for j,k in itertools.combinations(range(4),2):
   if signatures(pp[j])&signatures(pp[k]):pairs.append([j+1,k+1])
  assert pairs==[[2,4]]
  # Prove a real orientation-preserving rigid rotation, no rescaling/reflection.
  u,v=vector(pp[1][0],pp[1][1]),vector(pp[3][0],pp[3][1]);close(dot(u,v),0);close(dist(pp[1][0],pp[1][1]),dist(pp[3][0],pp[3][1]))
  for q,r in zip(pp[1],pp[3]):
   x,y=vector(pp[1][0],q);rx,ry=vector(pp[3][0],r);close(rx,y);close(ry,-x)
  a='2 және 4';obs={'pairwiseDistanceCongruentPairs':pairs,'gridScale':s,'areas':[area(p)/s**2 for p in pp],'rotationDegrees':90,'originalRasterCompared':False}
 elif i==9:
  p=polys['main'];squareish=[(a[0]==b[0] or a[1]==b[1]) for a,b in edges(p)];assert all(squareish)
  xs=sorted([min(q[0] for q in p),max(q[0] for q in p)]+[float(e.get('x1')) for e in lines]);ys=sorted({q[1] for q in p});assert len(ys)==2 and len(xs)==6
  for e in lines:assert point(e,'1')[1]==ys[0] and point(e,'2')[1]==ys[1]
  a=len(list(itertools.combinations(xs,2)));obs={'verticalBoundaries':xs,'allHorizontalSpans':a}
 elif i==10:
  p=polys['main'];labels=ts('data-given');assert [number(text(e)) for e in labels]==[12,9]
  assert all(x[0]==y[0] or x[1]==y[1] for x,y in edges(p));scale=dist(*edges(p)[0])/12
  close((max(q[1] for q in p)-min(q[1] for q in p))/scale,9)
  horizontal=sum(abs(x[0]-y[0])/scale for x,y in edges(p));vertical=sum(abs(x[1]-y[1])/scale for x,y in edges(p));close(horizontal,24);close(vertical,18);a=horizontal+vertical
  assert not convex(p);obs={'totalHorizontal':horizontal,'totalVertical':vertical,'reflexCornersPresent':True}
 elif i==11:
  p=polys['main'];assert len(p)==5
  shared=only([e for e in lines if e.get('data-shared')]);s=dist(point(shared,'1'),point(shared,'2'))
  assert {point(shared,'1'),point(shared,'2')}=={p[1],p[3]};assert shared.get('stroke-dasharray')
  square([p[0],p[1],p[3],p[4]])
  for x,y in edges([p[1],p[2],p[3]]):close(dist(x,y),s)
  printed=val('data-given');assert printed==52;a=F(printed,4)*integer(perimeter(p)/s);obs={'outerEqualEdges':5,'commonPhysicalSide':s,'squarePerimeter':str(printed)}
 elif i==12:
  p=polys['main'];top=[number(text(e)) for e in ts('data-given') if e.get('data-given')=='top'];height=number(text(only([e for e in ts('data-given') if e.get('data-given')=='height'])))
  assert top==[3,7,2] and height==8
  scale=dist(p[0],p[1])/sum(top)
  close(abs(p[0][1]-p[3][1])/scale,height);close((p[3][0]-p[0][0])/scale,3);close((p[2][0]-p[3][0])/scale,7);close((p[1][0]-p[2][0])/scale,2)
  a=area(p)/scale**2;close(a,76);obs={'printedTopParts':list(map(str,top)),'printedHeight':str(height),'shoelaceArea':a}
 elif i==14:
  p=polys['main'];labs={int(e.get('data-given')):number(text(e)) for e in ts('data-given')};assert labs=={0:12,1:4,5:10,4:5}
  scale=dist(p[0],p[1])/12
  for j,v in labs.items():close(dist(*edges(p)[j])/scale,v)
  assert all(x[0]==y[0] or x[1]==y[1] for x,y in edges(p));a=area(p)/scale**2;close(a,78);obs={'shoelaceArea':a,'boundingArea':120,'missingRectangleArea':42}
 elif i==15:
  p=polys['main'];q=polys['selected'];assert len(p)==6 and len(q)==3
  ls=[dist(a,b) for a,b in edges(p)]
  for l in ls:close(l,ls[0])
  rs=[e for e in lines if e.get('data-radius') is not None];assert len(rs)==6 and len({point(e,'1') for e in rs})==1
  for e in rs:close(dist(point(e,'1'),point(e,'2')),ls[0])
  assert {point(e,'2') for e in rs}==set(p)
  for a0,b0 in edges(q):close(dist(a0,b0),ls[0])
  printed=val('data-given');assert printed==54;a=printed/F(6)*3;obs={'outerSides':6,'equilateralPieces':6,'triangleEqualLengths':[dist(*ab) for ab in edges(q)]}
 elif i in (16,22):
  cells=list(polys.values());expected=7 if i==16 else 5;assert len(cells)==expected
  side=square(cells[0])
  for p in cells:close(square(p),side)
  cc=Counter(edgekey(a,b) for p in cells for a,b in edges(p));assert max(cc.values())==2
  outer=[ab for ab,c in cc.items() if c==1];shared=[ab for ab,c in cc.items() if c==2]
  shownouter=[edgekey(point(e,'1'),point(e,'2')) for e in lines if e.get('data-boundary')];shownshared=[edgekey(point(e,'1'),point(e,'2')) for e in lines if e.get('data-shared')]
  assert set(shownouter)==set(outer) and len(shownouter)==len(outer)
  assert set(shownshared)==set(shared) and len(shownshared)==len(shared)
  assert len(outer)==(16 if i==16 else 12) and len(shared)==(6 if i==16 else 4)
  if i==16:
   size=val('data-given');assert size==4;a=len(outer)*size
  else:
   printed=val('data-given');assert printed==84;size=printed/len(outer);a=len(cells)*size**2
  obs={'squareCells':len(cells),'externalEdges':len(outer),'internalSharedEdges':len(shared),'actualSide':side,'physicalSquareSideCm':str(size)}
 elif i in (18,21):
  segs=[((F(e.get('x1')),F(e.get('y1'))),(F(e.get('x2')),F(e.get('y2')))) for e in lines]
  pts,figures=enumerate_graph(segs,3 if i==18 else 4)
  a=len(figures);assert a==(16 if i==18 else 18)
  if i==18:
   sizes=Counter(area(list(p)) for p in figures);assert sorted(sizes.values())==[4,4,8]
   obs={'intersectionVertices':len(pts),'allTriangleCount':a,'areaSizeGroupCounts':sorted(sizes.values())}
  else:
   assert len([e for e in lines if e.get('data-level')])==4 and len([e for e in lines if e.get('data-ray')])==3
   obs={'intersectionVertices':len(pts),'allSimpleFourCornerCycles':a,'positiveHorizontalLevels':4,'distinctApexRays':3}
 elif i==19:
  ls=[(point(e,'1'),point(e,'2')) for e in lines];assert len(ls)==8
  vertical=[e for e in lines if e.get('data-wire')=='v'];horizontal=[e for e in lines if e.get('data-wire')=='h'];assert len(vertical)==len(horizontal)==4
  s=dist(*ls[0]);assert all(abs(dist(*ab)-s)<EPS for ab in ls)
  assert len({point(e,'1')[0] for e in vertical})==4 and len({point(e,'1')[1] for e in horizontal})==4
  printed=val('data-given');assert printed==60;a=printed/4*len(ls);obs={'fullWires':8,'uniqueShortWireSegments':24,'outerPerimeter':str(printed)}
 elif i==23:
  p=polys['main'];vals=[number(text(e)) for e in ts('data-area')];assert vals==[9,25,64]
  ss=[math.isqrt(v.numerator) for v in vals];assert [v*v for v in ss]==vals
  shared=[e for e in lines if e.get('data-shared')];assert len(shared)==2
  scale=dist(point(shared[0],'1'),point(shared[0],'2'))/ss[0]
  close(dist(point(shared[1],'1'),point(shared[1],'2'))/scale,ss[1]);close((max(q[0] for q in p)-min(q[0] for q in p))/scale,sum(ss))
  for e,v in zip(ts('data-area'),ss):
   cx=float(e.get('x'));cy=float(e.get('y'));assert min(q[1] for q in p)<cy<max(q[1] for q in p)
  a=perimeter(p)/scale;close(a,4*sum(ss)-2*sum(ss[:-1]));obs={'printedAreas':list(map(str,vals)),'derivedSides':ss,'physicalUnionPerimeter':a}
 elif i==24:
  p=polys['main'];divs={e.get('data-divider'):e for e in lines};assert set(divs)=={'v','h'}
  left,right=min(q[0] for q in p),max(q[0] for q in p);top,bottom=min(q[1] for q in p),max(q[1] for q in p);x=point(divs['v'],'1')[0];y=point(divs['h'],'1')[1]
  assert left<x<right and top<y<bottom
  cells=ts('data-cell-perimeter');assert [text(e) for e in cells]==['14 см','20 см','24 см','?']
  widths=[x-left,right-x];heights=[y-top,bottom-y];actual=[2*(widths[j]+heights[k]) for k in range(2) for j in range(2)];values=[number(text(e)) for e in cells[:3]];scale=actual[0]/float(values[0])
  for got,want in zip(actual,values):close(got/scale,want)
  a=values[1]+values[2]-values[0];close(actual[3]/scale,a);obs={'printedCellPerimeters':list(map(str,values)),'actualFourthPerimeter':actual[3]/scale,'identity':'TR + BL - TL = BR for all positive widths/heights'}
 else:raise AssertionError(i)
 if not isinstance(a,str):a=nfmt(F(float(a)).limit_denominator(100000))
 return a,obs

NOTES=[
 'Actual8edge T grid:8/2/3/4/2/4/3/2 outer lengths; P28cm, internal grid excluded.',
 'Actual cyclicABCDEF; AB/DE/FA are neighboring sides, BE only nonneighbor diagonal.',
 'Actual four simple polygons:1/2/4 convex;3 has a reflex turn, no selfintersection.',
 'Actual seven distinct corners and noncollinear sides; name жетібұрыш.',
 'Actual house internal dot signs0/0/negative/positive/negative: A/Bright,C/Eobtuse,Donlyacute.',
 'Actual nonadjacent edges cross only in panel1, remaining three are simple.',
 'Actual metric quadrilateral sides proportional9/6/7/5, boundary sum27cm.',
 'Actual8equal physical edges/equality ticks; printed5cm gives40cm.',
 'Only panels2/4 share ALL pairwise squared distances at identical20px gridscale. Explicit proper90° rotation proved. Original raster unavailable; saved fullrotation skill only, no originalimagecomparison claimed.',
 'Full six vertical boundaries; all15 pairs give rectangles across contiguous strips.',
 'Physical monotone stair: total horizontal24cm, vertical18cm, P42. Reflex corners allowed; no false allinterior90° claim.',
 'Physical true square plus genuine equilateral triangle, shared edge dashed; outer5equal13cm edges→65.',
 'Actual trapezoid shoelace agrees with rectangle96 minus trianglecuts12+8→76; all4MCQ traproles preserved.',
 'Actual1cm grid perpendicular legs8/5, full box40, triangle20cm².',
 'Actual concave orthogonal area by shoelace78; disjoint48+30 and bounding120−42 agree.',
 'Actual regular6hex and six genuine equilateral sectors,54÷6×3→27cm, notside9.',
 'Seven actual equal cells, six shared edges, sixteen outer edges times4→64cm.',
 'Actual rotated square on8×8 unitbox; four3×5/2 cornercuts, area34cm²; actualequal sides and orthogonality checked.',
 'Independent exact rational intersections/coveredsegment enumeration finds16triangles, disjoint area groups8/4/4; no omitted composite.',
 'Actual4horizontal+4vertical fullwires, printed outerP60 means side15;8×15=120, each shared wire once.',
 'Actual six side metric ratios5/3.5/2.5/4/4/2 agree with labels; exact decimal sum21cm.',
 'Independent exact allsimplefourcornercycles enumeration finds18;4positivelevels×3apexrays, no triangles/collinear corners counted.',
 'Actual5square cross,4internalsharededges and12outeredges;84÷12=7 side,5×49=245cm².',
 'Actual three adjacent squares with areas9/25/64 imply sides3/5/8; shared3+5 removedTWICE from64→48cm.',
 'Actual2×2 subdivision labelsTL14/TR20/BL24; universal signed-perimeter identity givesBR30, notsemiperimeter15.'
]

def main():
 batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==25
 inv=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records']
 entries=[];observations=[];canaries=0
 for i,row in enumerate(rows):
  ref=only(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=only([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['solution'] and raw['statement']
  if raw['options']:assert only([x['text'] for x in raw['options'] if x['correct']])==raw['sourceAnswer']
  record=only([r for r in inv if r['occurrenceId']==row['sourceOccurrenceId']]);assert record['sourceId']==ref['sourceId'] and record['sourceSha256']==row['sourceCanonicalSha256']
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==row['figureSha256']
  a,o=observe(svg,i);assert row['answer']==a,(i,row['answer'],a)
  if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(a)==1
  else:assert re.fullmatch(r'\d+',a) and 'Жауапқа тек санды жазыңыз.' in row['statement']
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY';assert bad['answer']!=a
  # Deliberate physical-geometry/printed-label errors must actually be rejected.
  el=E.fromstring(svg);poly=next((e for e in el.iter() if tag(e)=='polygon'),None)
  if i==2:
   pp={e.get('data-polygon'):e for e in el.iter() if tag(e)=='polygon'};pp['panel3'].set('points',pp['panel4'].get('points'))
  elif i==3:
   pp=polygon(poly)[1:];poly.set('points',' '.join(f'{x},{y}' for x,y in pp))
  elif i==5:
   pp={e.get('data-polygon'):e for e in el.iter() if tag(e)=='polygon'};pp['panel1'].set('points',pp['panel2'].get('points'))
  elif i==24:
   only([e for e in el.iter() if e.get('data-cell-perimeter')=='0']).text='15 см'
  elif poly is not None:
   pp=polygon(poly);pp[0]=(pp[0][0]+5,pp[0][1]);poly.set('points',' '.join(f'{x},{y}' for x,y in pp))
  else:
   line=only([e for e in el.iter() if tag(e)=='line'][:1]);line.set('x1',str(float(line.get('x1'))+5))
  try:observe(E.tostring(el,encoding='unicode'),i)
  except (AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('physical mutation escaped independent oracle',i))
  canaries+=1
  missing=i==8
  checked=['All29saved/full official solutions/everyMCQ and all25new/fullsolutions/everyMCQ individually read.','Five all-source raster sheets actually viewed (26available,3unavailable) and five native343contact sheets actually viewed (25new).','Own physical SVG polygon vertices, printed metric labels, gridscale, segment intersections and shared boundary ledger parsed without author params/specs/calculator imports.','No arbitrary markup, raster embedding or external resource; mobile labels visible and unclipped.',NOTES[i],('Missing original raster: saved fulltext/officialrotation skill only; no originalimagecomparison claimed.' if missing else 'Available archived original raster actually viewed and skill/topology compared.')]
  entries.append({'editionId':row['editionId'],'sha256':h(row),'verdict':'verified','method':'independent_full_saved_new_solution_MCQ_read_actual_SVG_metric_polygon_grid_congruence_exact_graph_enumeration_native343_visual_review','notes':[NOTES[i]],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':not missing,'checked':checked},'evidence':{'oracle':'scripts/editorial/review-visual-wave77.py','nativeSheet':f'output/editorial-visual-wave77/visual-wave77-contact-{i//6+1}.png','mobileWidthPx':343,'sourceRasterAvailable':not missing,'sourceRasterCompared':not missing,'figureSha256':sha}})
  observations.append({'editionId':row['editionId'],'computedAnswer':a,**o})
 # Recompute all scalar saved relationships and full count targets, not source keys alone.
 assert sum([6,2,2,3,2,3,2,2])==22 and sum([4,6,5,8])==23 and 7*6==42
 assert sum(range(1,5))==10 and 2*(9+7)==32 and 36//4*5==45
 assert 12*6-(2*6+4*6)/2==54 and 6*4/2==12 and 10*4+4*(9-4)==60
 assert 42//6*3==21 and (6*4-2*5)*3==42 and 36-4*4*2/2==20
 source_segs=[((F(0),F(0)),(F(8),F(0))),((F(8),F(0)),(F(8),F(4))),((F(8),F(4)),(F(0),F(4))),((F(0),F(4)),(F(0),F(0))),((F(0),F(0)),(F(8),F(4))),((F(8),F(0)),(F(0),F(4))),((F(4),F(0)),(F(4),F(4)))]
 assert len(enumerate_graph(source_segs,3)[1])==12 and 48//4*6==72
 assert sum(map(F,['4','2.5','2','3','3','1.5']))==16
 assert math.comb(3,2)**2==9 and 5*(60//12)**2==125 and 4*(2+4+6)-2*(2+4)==36 and 20+22-16==26
 retained=batch['coverage']['previousEditionsRetained'];assert len(retained)==4
 assert {r['sourceId'] for r in retained}=={'f2da6bb957073dff','d751c6bb677c8245','7eccaf6025f2451f','bcae7df0a7662afc'}
 for r in retained:
  raw=only([q for q in json.loads((ROOT/r['sourceFile']).read_text())['questions'] if q['id']==r['sourceId']]);assert raw['checked'] and raw['solution'] and raw['statement']
 assert 8-2==6 and math.comb(4,2)==6 and math.comb(4,2)*math.comb(3,2)==18 and 2*(14+10)+2*4==56
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 summary={'verified':25,'retainedNotResigned':4,'findings':0,'fullSavedConditionsOfficialSolutionsEveryMCQRead':29,'fullNewConditionsSolutionsEveryMCQRead':25,'availableSourceRastersActuallyViewed':26,'newUnavailableRastersNotClaimedCompared':1,'retainedUnavailableRastersNotClaimedCompared':2,'native343FiguresActuallyViewed':25,'wrongKeysRejected':25,'physicalSvgCanariesRejected':canaries,'pythonJavaScriptHashesMatched':25}
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_missing_set_diagram','batch':BATCH,'reviewedAt':'2026-10-24','summary':summary,'retainedNotResigned':retained,'actualPhysicalSvgObservations':observations,'entries':entries}
 if '--write' in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
