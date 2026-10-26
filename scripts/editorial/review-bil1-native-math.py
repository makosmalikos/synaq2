"""Eight full frozen/newvisualconditions completeofficial/newsolutions and
all40source/newMCQoptions read. Eight sourcebitmaps and actual343pxnewnativePNGs
inspected. Same root author separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil1-native-math';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('b1','scripts/editorial/review-bil1-nonvisual.py');B=importlib.util.module_from_spec(sp);sp.loader.exec_module(B);E=B.E;H=B.H;one=B.one;scalar=B.scalar
sp=importlib.util.spec_from_file_location('gr','scripts/editorial/review-femo6-spring-grade4-visual.py');V=importlib.util.module_from_spec(sp);sp.loader.exec_module(V);W=V.P.W
ASSETS={5:('962296a9ed908d0f273714e6','96b9d9533cfda933ce017d27cca346128afdd4a032372303027920085b5acfb8'),6:('3f02e7d7d222ec8c35ed4e8e','92a17bb809420750b01654848beb5cf5607191a29e89b3c94cda5d4c5cc7b854'),9:('94fcafff4c2816c587317e68','bfc8752441ed4602d0ab2566459cd1cf56e2888dbcb80a80eafa0fe01f73a657'),14:('cbe19d41aa35c1a507f553e5','062f129d0af3e3bbf14df387f662c06178d025911262c8562d233a1c5908f15c'),24:('7e7ef5a2ba3713982e1cfd3c','efff06367adffa9ab2890183db5959cdbe3eab7eb0eb151856eca66e03884caf'),29:('910de3d2db56d8499a04da53','70baf162547e8c22c980a20de82ed1ca3f81b9149fa5b6bc854c36e4ec483d16'),30:('81c2cd039aaa07754b5ff36c','bd8fcd80a2fd8c230c3fce2b075a0dd28ee36645030958ae1fd4ca4979f41901'),36:('8667e320afbdbb542d226ae5','0d09c6c1815dde482539a709f3ae617203b0ba044cac58dcb347e49a14ff6efb')}
def asset(i):
 file,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{file}.png').read_bytes()).hexdigest()==sha;return sha
def ids(root):return{v.attrib['id']:v for v in root.iter()if'id'in v.attrib}
def rect(v):return tuple(F(v.attrib[k])for k in['x','y','width','height'])
def segment(v):return tuple(F(v.attrib[k])for k in['x1','y1','x2','y2'])
def points(v):return[tuple(map(F,p.split(',')))for p in v.attrib['points'].split()]
def measured_outline(root):
 d=ids(root);p=points(d['outline']);assert len(p)==8;w,h,t=[scalar(d['dimension-'+k].text)for k in['width','lower','tower']];assert min(w,h,t)>0;(x0,y0),(x1,y1),(x2,y2),(x3,y3),(x4,y4),(x5,y5),(x6,y6),(x7,y7)=p;assert y0==y1 and x1==x2 and y2==y3==y6==y7 and x3==x4 and y4==y5 and x5==x6 and x7==x0 and x0<x5<x4<x1 and y4<y2<y0;unit=(x1-x0)/w;assert unit==(y0-y2)/h==(y2-y4)/t>0;length=sum(abs(a[0]-b[0])+abs(a[1]-b[1])for a,b in zip(p,p[1:]+p[:1]));out=length/unit;assert out==2*(w+h+t);return out,[w,h,t],{'actualAllEightOrthogonalBoundaryVertices':[[str(v)for v in q]for q in p],'threeDimensionLabelsAndCommonScaleChecked':True,'commonPixelsPerCm':str(unit),'sumAllActualBoundaryEdgesCm':str(out),'independentHorizontalVerticalGroupingAgrees':True}
def measured_arc(root):
 d=ids(root);c=d['whole-circle'];cx,cy,r=[F(c.attrib[k])for k in['cx','cy','r']];assert r>0;ax1,ay1,ax2,ay2=segment(d['radius-A']);bx1,by1,bx2,by2=segment(d['radius-B']);assert(ax1,ay1)==(bx1,by1)==(cx,cy);a,b=(ax2-cx,ay2-cy),(bx2-cx,by2-cy);assert sum(v*v for v in a)==sum(v*v for v in b)==r*r and sum(u*v for u,v in zip(a,b))==0;angle=scalar(d['angle'].text);assert angle==90;arc=scalar(d['arc-length'].text);raw=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',d['minor-arc'].attrib['d']);assert raw[0]=='M'and raw[3]=='A';v=list(map(F,raw[1:3]+raw[4:]));assert v==[ax2,ay2,r,r,0,0,0,bx2,by2];assert a[0]*b[1]-a[1]*b[0]<0;assert d['label-A'].text=='A'and d['label-B'].text=='B'and d['label-C'].text=='C';return arc,angle,{'allActualCircleAndBothRadiusEndpointsChecked':True,'exactEqualRadiiAndZeroDotProductProveRightCentralAngle':True,'actualShortArcPathRadiiFlagsEndpointsChecked':True,'actualMinorArcCentimeters':str(arc),'actualCentralAngleDegrees':str(angle)}
def four_rectangles(root,statement):
 d=ids(root);ox,oy,ow,oh=rect(d['whole']);pieces=[rect(v)for k,v in d.items()if k.startswith('piece-')];assert len(pieces)==4;short,long=one({tuple(sorted([w,h]))for x,y,w,h in pieces});assert long==2*short and ow==4*short and oh==long;assert all(w>0 and h>0 and ox<=x and oy<=y and x+w<=ox+ow and y+h<=oy+oh for x,y,w,h in pieces);assert all(not V.overlap(a,b)for a,b in itertools.combinations(pieces,2));assert sum(w*h for x,y,w,h in pieces)==ow*oh;physical=scalar(d['short-label'].text);assert H.numeric_tokens(statement)==[4,physical];x1,y1,x2,y2=segment(d['short-dimension']);assert y1==y2 and x1==ox and x2-x1==short;return ow/(short/physical),physical,{'allFourActualCongruentRectanglesRead':True,'actualLongSideIsTwoShortSides':True,'allPiecesInsideDisjointAndCoverWhole':True,'actualShortLabelDimensionBracketAndStatementAgree':True,'wholePhysicalLongSide':str(4*physical)}
def coord(text):
 s=H.tex(text).replace('(','').replace(')','');a,b=s.split(';');return E.calc(a),E.calc(b)
def coordinate(root):
 d=ids(root);xx=segment(d['axis-x']);yy=segment(d['axis-y']);assert xx[1]==xx[3]and yy[0]==yy[2];ox,oy=yy[0],xx[1];scales=[]
 for axis in['x','y']:
  for v in range(-4,5):
   line=d[f'grid-{axis}-{v}'];x1,y1,x2,y2=segment(line)
   if axis=='x':assert x1==x2;pos=x1-ox
   else:assert y1==y2;pos=oy-y1
   if v==0:assert pos==0;continue
   label=d[f'tick-{axis}-{v}'];assert F(label.text)==v;scales.append(pos/v)
 unit=one(set(scales));assert unit>0;p=d['point-A'];px,py=F(p.attrib['cx']),F(p.attrib['cy']);assert F(p.attrib['r'])==5;out=((px-ox)/unit,(oy-py)/unit);assert min(out)<0<max(out);lines=[segment(d['intersect-'+str(j)])for j in range(2)]
 for x1,y1,x2,y2 in lines:assert(x2-x1)*(py-y1)==(y2-y1)*(px-x1)and min(x1,x2)<=px<=max(x1,x2)and min(y1,y2)<=py<=max(y1,y2)
 a,b=lines;assert(a[2]-a[0])*(b[3]-b[1])!=(a[3]-a[1])*(b[2]-b[0]);label=d['label-A'];assert label.text=='A'and(F(label.attrib['x'])-px)**2+(F(label.attrib['y'])-py)**2<30**2;return out,{'allSixteenActualTickValuesAndAll18GridLinesDecoded':True,'commonPixelsPerCoordinateUnit':str(unit),'bothActualLinesIntersectAtMarkedA':True,'actualCalibratedCoordinates':list(map(str,out))}
def coefficients(level,column):return[F(math.comb(level,k-column))if column<=k<=column+level else F(0)for k in range(5)]
def pyramid(constraints):
 matrix=[coefficients(l,c)+[F(v)]for l,c,v in constraints];rank=0
 for col in range(5):
  pivot=next((j for j in range(rank,len(matrix))if matrix[j][col]),None)
  if pivot is None:continue
  matrix[rank],matrix[pivot]=matrix[pivot],matrix[rank];scale=matrix[rank][col];matrix[rank]=[v/scale for v in matrix[rank]]
  for j in range(len(matrix)):
   if j==rank:continue
   factor=matrix[j][col];matrix[j]=[a-factor*b for a,b in zip(matrix[j],matrix[rank])]
  rank+=1
 assert rank==5 and all(any(row[:5])or row[5]==0 for row in matrix);bottom=[matrix[i][-1]for i in range(5)];allrows=[bottom]
 for _ in range(4):allrows.append([a+b for a,b in zip(allrows[-1],allrows[-1][1:])])
 assert all(allrows[l][c]==v for l,c,v in constraints);assert allrows[-1][0]==sum(v*c for v,c in zip(bottom,coefficients(4,0)));return allrows[-1][0],{'allActualGivenNodeConstraints':[[l,c,str(v)]for l,c,v in constraints],'exactBottomSystemRank':rank,'allFiveCompletedRows':[[str(v)for v in row]for row in allrows],'allGivenNodesAndPascalWeightedWholeTopIndependentlyRechecked':True,'topValueTarget':str(allrows[-1][0])}
def measured_pyramid(root):
 d=ids(root);circles=[v for k,v in d.items()if k.startswith('node-')];assert len(circles)==15 and{F(v.attrib['r'])for v in circles}=={19};ys=sorted({F(v.attrib['cy'])for v in circles},reverse=True);assert len(ys)==5;step=one({a-b for a,b in zip(ys,ys[1:])});assert step>38;rows=[sorted([v for v in circles if F(v.attrib['cy'])==y],key=lambda v:F(v.attrib['cx']))for y in ys];constraints=[];texts=[v for k,v in d.items()if k.startswith('value-')];xCount=0
 for l,row in enumerate(rows):
  assert len(row)==5-l;xs=[F(v.attrib['cx'])for v in row];assert all(b-a==60 for a,b in zip(xs,xs[1:]));assert l==0 or xs==[(F(a.attrib['cx'])+F(b.attrib['cx']))/2 for a,b in zip(rows[l-1],rows[l-1][1:])]
  for c,v in enumerate(row):
   cx,cy=F(v.attrib['cx']),F(v.attrib['cy']);labels=[t for t in texts if F(t.attrib['x'])==cx and abs(F(t.attrib['y'])-cy)<10];assert len(labels)<=1
   if labels:
    label=labels[0]
    if label.text=='x':assert(l,c)==(4,0);xCount+=1
    else:constraints.append((l,c,F(label.text)))
 assert xCount==1 and len(texts)==len(constraints)+1;out,p=pyramid(constraints);p['all15ActualCirclePlacementsAndGivenLabelAttachmentsChecked']=True;return out,p
EDGES=[(0,1),(0,2),(1,3),(2,3),(0,4),(1,5),(2,6),(3,7),(4,5),(4,6),(5,7),(6,7)]
def cuboid(root):
 d=ids(root);vertices={}
 for a,b in EDGES:
  x1,y1,x2,y2=segment(d[f'box-edge-{a}-{b}'])
  for k,p in[(a,(x1,y1)),(b,(x2,y2))]:assert k not in vertices or vertices[k]==p;vertices[k]=p
 assert len(vertices)==len(set(vertices.values()))==8 and sum(k.startswith('box-edge-')for k in d)==12;o=vertices[0];sub=lambda a,b:(a[0]-b[0],a[1]-b[1]);u,v,z=[sub(vertices[k],o)for k in[1,4,2]];assert u[0]>0 and u[1]==0 and z[0]==0 and z[1]<0 and v[0]>0 and v[1]<0
 for k,a,b,c in[(0,0,0,0),(1,1,0,0),(2,0,0,1),(3,1,0,1),(4,0,1,0),(5,1,1,0),(6,0,1,1),(7,1,1,1)]:assert vertices[k]==tuple(o[j]+a*u[j]+b*v[j]+c*z[j]for j in range(2))
 for face,idx in[('front',[0,1,3,2]),('top',[2,3,7,6]),('side',[1,5,7,3])]:assert points(d['face-'+face])==[vertices[k]for k in idx]
 w,h,depth=[scalar(d['dimension-'+k].text)for k in['width','height','depth']];assert min(w,h,depth)>0 and u[0]/w==-z[1]/h;assert v[0]==-v[1];return[w,depth,h],{'allTwelveActualProjectedEdgesAndEightSharedVerticesChecked':True,'allThreeVisibleFacePolygonsMatchSameCuboidVertices':True,'actualLabeledWidthDepthHeight':list(map(str,[w,depth,h])),'frontWidthHeightCommonScale':str(u[0]/w),'positiveNondegenerateObliqueDepthBasis':list(map(str,[v[0]/depth,v[1]/depth]))}
def nested(root,ratios):
 d=ids(root);ox,oy,ow,oh=rect(d['outer']);ix,iy,iw,ih=rect(d['inner']);assert min(ow,oh,iw,ih)>0 and ix==ox and iy+ih==oy+oh and iw<ow and ih<oh;first,second=ratios;assert(iy-oy)/oh==first and iw/ow==second;vertices={'A':(ox,oy),'B':(ox+ow,oy),'C':(ox+ow,oy+oh),'D':(ox,oy+oh),'E':(ix+iw,oy+oh),'F':(ix+iw,iy),'G':(ox,iy)}
 for key,(x,y)in vertices.items():v=d['label-'+key];assert v.text==key and(F(v.attrib['x'])-x)**2+(F(v.attrib['y'])-y)**2<35**2
 out=ow*oh/(iw*ih);assert out==1/((1-first)*second);return out,{'allActualOuterInnerRectangleCoordinatesDecoded':True,'allSevenLabelsAndSharedCornerAndBottomAlignmentChecked':True,'bothStatedRatiosMatchActualGeometry':True,'actualPixelAreaRatioEqualsIndependentComplementarySideFormula':True,'areaRatioTarget':str(out)}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s);proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data);expected=None
 if i==5:
  if src:w,h,t=F(25),F(10),F(12);out=2*(w+h+t);proof['observedSourceBaseWidthLowerHeightTowerHeight']=['25','10','12']
  else:out,(w,h,t),proof=measured_outline(root)
  expected=[out/2,out-22,out-w,out,out-t]
 elif i==6:
  if src:arc=F(22);angle=F(45);proof['observedSourceCentralAngle']=45
  else:arc,angle,proof=measured_arc(root);assert one(n)==arc
  out=arc*360/angle;expected=[arc*angle,arc+angle,out,out/2,out+16];proof['circumferenceCentimetersTarget']=str(out)
 elif i==9:
  if src:count,short=n;assert count==4;out=4*short;proof['observedSourceFourCongruentRectanglesTwoMiddleShortSidesMatchLong']=True
  else:out,short,proof=four_rectangles(root,s)
  expected=[5*short,out,3*short,2*short,short];proof['wholeLongSideCentimetersTarget']=str(out)
 elif i==14:
  values=list(map(coord,B.options(r)))
  if src:out=one(v for v in values if v[0]<0<v[1]);proof['sourceHasNoCalibratedTicksNumericCoordinatesNotClaimedMeasured']=True;proof['onlySourceOptionInObservedSecondQuadrantSelected']=True
  else:out,proof=coordinate(root)
  a,b=out;assert values==[(a,b),(a,-b),(-a,b),(-a,-b),(b,a)]and len(set(values))==5 and coord(r['answer'])==out;proof['coordinateTarget']=list(map(str,out));proof['allFiveActualCoordinateOptions']=[[str(v)for v in p]for p in values];proof['answerChecked']=True;return proof
 elif i==24:
  if src:out,p=pyramid([(0,0,F(2)),(0,1,F(5)),(0,4,F(6)),(1,0,F(7)),(1,3,F(15)),(2,2,F(27))]);proof.update(p)
  else:out,proof=measured_pyramid(root)
  expected=[out+18,out,out-27,out-32,out-50]
 elif i in[29,36]:
  if src:dims=list(map(F,[8,6,2]if i==29 else[8,4,4]));proof['observedSourceCuboidDimensions']=list(map(str,dims))
  else:dims,proof=cuboid(root)
  w,depth,h=dims;vol=w*depth*h
  if i==29:out=vol;expected=[out,out-60,w*depth,w*h,out+20];proof['volumeCubicCentimetersTarget']=str(out)
  else:
   if src:a,b,c,unit,u,v=n;assert[a,b,c]==dims and unit==u==v
   else:unit=one(n)
   counts=[v/unit for v in dims];assert min(counts)>0 and all(v.denominator==1 for v in counts);out=math.prod(counts);assert out==vol/unit**3;expected=[out,out-4,out+2,out+4,out-2];proof.update({'actualCubeSideCentimeters':str(unit),'wholeCubeCountsInThreeDirections':list(map(str,counts)),'allThreeDirectionsDivideExactlyAndVolumeCrossCheckAgrees':True,'cubeCountTarget':str(out)})
 elif i==30:
  a,b,c,d=n;ratios=[a/b,c/d]
  if src:assert ratios==[F(1,3),F(3,4)];out=1/((1-ratios[0])*ratios[1]);proof['sourceSharedBottomCornerGOnADAndComplementaryHeightObserved']=True
  else:out,proof=nested(root,ratios)
  expected=[out,out+F(1,2),out-F(1,2),out-1,out+1];proof['areaRatioTarget']=str(out)
 else:raise AssertionError(i)
 proof.update(B.checked_choices(r,out,expected));proof['answerChecked']=True;return proof

def set_box(root,transform):
 d=ids(root)
 for a,b in EDGES:
  v=d[f'box-edge-{a}-{b}'];x1,y1,x2,y2=segment(v);x1,y1=transform(a,x1,y1);x2,y2=transform(b,x2,y2)
  for key,value in zip(['x1','y1','x2','y2'],[x1,y1,x2,y2]):v.set(key,str(value))
 for face,idx in[('front',[0,1,3,2]),('top',[2,3,7,6]),('side',[1,5,7,3])]:d['face-'+face].set('points',' '.join(','.join(map(str,transform(k,x,y)))for k,(x,y)in zip(idx,points(d['face-'+face]))))

def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root)
 if i==5:
  p=points(v['outline']);p[4]=(p[4][0],p[4][1]-6);p[5]=(p[5][0],p[5][1]-6);v['outline'].set('points',' '.join(','.join(map(str,q))for q in p));v['dimension-tower'].text='16 см';v['dimension-tower-line'].set('y1','96');answer='106 см';d['options']=['53 см','84 см','78 см','106 см','90 см']
 elif i==6:d['statement']=d['statement'].replace('27 см','28 см');v['arc-length'].text='28 см';answer='112 см';d['options']=['2520 см','118 см','112 см','56 см','128 см']
 elif i==9:d['statement']=d['statement'].replace('12 см','15 см');v['short-label'].text='15 см';answer='60 см';d['options']=['75 см','60 см','45 см','30 см','15 см']
 elif i==14:
  v['point-A'].set('cx','96');v['point-A'].set('cy','114');v['label-A'].set('x','81');v['label-A'].set('y','106')
  for j in range(2):
   e=v['intersect-'+str(j)];x1,y1,x2,y2=segment(e)
   for key,value in zip(['x1','y1','x2','y2'],[x1-28,y1+28,x2-28,y2+28]):e.set(key,str(value))
  answer='(−3; 2)';d['options']=['(−3; 2)','(−3; −2)','(3; 2)','(3; −2)','(2; −3)']
 elif i==24:v['value-0-4'].text='9';answer='104';d['options']=['122','104','77','72','54']
 elif i==29:
  set_box(root,lambda k,x,y:(x,y-18 if k in[2,3,6,7]else y));v['dimension-height'].text='4 см';v['dimension-height'].set('y','188');answer='280 см³';d['options']=['280 см³','220 см³','70 см³','40 см³','300 см³']
 elif i==30:
  d['statement']=d['statement'].replace('(2/5)','(1/5)');v['inner'].set('y','92');v['inner'].set('height','128')
  for name in['F','G']:v['label-'+name].set('y',str(F(v['label-'+name].attrib['y'])-32))
  answer='(25/12)';d['options']=['(25/12)','(31/12)','(19/12)','(13/12)','(37/12)']
 else:
  set_box(root,lambda k,x,y:(x+45 if k in[1,3,5,7]else x,y));v['dimension-width'].text='15 см';v['dimension-width'].set('x','167.5');v['dimension-depth'].set('x',str(F(v['dimension-depth'].attrib['x'])+45));answer='30';d['options']=['30','26','32','34','28']
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,answer

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;answer=one(v['text']for v in q['options']if v['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  bad,raw,answer=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve({**bad,'answer':answer},i,False,raw)
  except Exception as e:raise AssertionError(('validUpdatedHashMath',i))from e
  proof['validUpdatedHashActualFigureInputTarget']=answer;proof['oldKeyRejectedAndCorrectChangedFigureAnswerAccepted']=True
  root=W.svg(r);d=ids(root)
  if i==5:d['outline'].set('points',d['outline'].attrib['points'].replace('264,246','263,246'))
  elif i==6:d['radius-B'].set('x2','181')
  elif i==9:d['piece-0'].set('width','59')
  elif i==14:d['point-A'].set('cx','125')
  elif i==24:d['node-0-0'].set('cx','61')
  elif i in[29,36]:d['box-edge-0-1'].set('x2','236')
  else:d['inner'].set('x','61')
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedFigureAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and len(r['options'])==5;assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8fullfrozen/newvisualconditions completeofficial/newsolutions/all40source/newoptions/sourcebitmaps/343pxnativePNGs read. Actualeightoutlinevertices/threephysicallabels, exactcirclerays/zero-dotquarterarc, allcongruentrectanglepieces/disjointfulltiling, allcoordinateticks/twoactualintersectinglines, all15pyramidcircles/fullrankgiven-nodeequations, all12cuboidprojectededges/8sharedvertices/3facepolygons/physicallabels, nestedrectangles/all7labelsandratios checked. Validupdatedhashfigureinputchanges recomputed andmalformedactualgeometries rejected. Sourcecoordinatebitmaphasnocalibration:onlyuniquequadrantanswerclaimed, newfigurecalibrated. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'EightoriginalnativeSVGs decoded fromactualgeometry/labels; sourcebitmaps and343pxPNGs inspected. No sourcebitmap/tracedvector. Updatedhashvalidandinvalidgeometrycanaries checked.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceOptionsRead':40,'rewrittenOptionsRead':40,'wrongKeysRejected':8,'validUpdatedHashActualFigureInputsRecomputed':8,'updatedHashMalformedActualGeometriesRejected':8,'sourceUncalibratedCoordinateOnlyQuadrantClaimed':True,'nativeFigures':8,'visualQuestionsStillSeparate':[8,11,27,32,42,44,47,50],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
