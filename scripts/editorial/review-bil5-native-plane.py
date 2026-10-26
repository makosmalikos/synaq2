"""Seven complete source/new conditions, official/new solutions, all35 choices,
source bitmaps and own343px PNGs read. Source geometric givens/incidences are
visually reviewed, never claimed exact raster measurements. Actual new SVG
coordinates and physical labels independently checked. Same root author,
separate computational review, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil5-native-plane';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('p','scripts/editorial/review-bil2-native-plane.py');P=importlib.util.module_from_spec(sp);sp.loader.exec_module(P);M=P.M;B=M.B;H=B.H;E=B.E;W=M.W;one=B.one;ids=M.ids;points=M.points;rect=M.rect;segment=M.segment;area=P.area;TOL=1e-6
ns=importlib.util.spec_from_file_location('n','scripts/editorial/review-bil3-nonvisual.py');N=importlib.util.module_from_spec(ns);ns.loader.exec_module(N)

def squarepoly(v):return P.polygon(rect(v))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dist(a,b):return math.dist(a,b)
def near(a,b):assert abs(float(a-b))<TOL,(float(a),float(b))
def inside(ps,bounds):
 x,y,w,h=bounds;assert all(x<=a<=x+w and y<=b<=y+h for a,b in ps)
def disjoint(polys):assert all(P.disjoint(a,b)for a,b in itertools.combinations(polys,2))
def edges(polys):return[(a,b)for ps in polys for a,b in zip(ps,ps[1:]+ps[:1])]
def union_perimeter(polys):
 # Split every parent edge at all collinear child endpoints. Shared base
 # subedges cancel twice; only multiplicity-one exterior edges remain.
 allEdges=edges(polys);vertices=set(v for ab in allEdges for v in ab);counts=collections.Counter()
 for a,b in allEdges:
  v=sub(b,a);assert dot(v,v)>0
  cuts=sorted((dot(sub(p,a),v)/dot(v,v),p)for p in vertices if cross(sub(p,a),v)==0 and 0<=dot(sub(p,a),v)<=dot(v,v))
  for(_,p),(_,q)in zip(cuts,cuts[1:]):counts[tuple(sorted([p,q]))]+=1
 assert all(v in[1,2]for v in counts.values());external=[ab for ab,v in counts.items()if v==1];return sum(dist(a,b)for a,b in external),{'allActualAtomicEdgeMultiplicities':dict(collections.Counter(counts.values())),'actualExteriorSegmentCount':len(external),'allSharedInternalBaseSubedgesCancelTwice':True}
def equal_triangle(ps):
 assert len(ps)==3 and area(ps)>0;ss=[dot(sub(a,b),sub(a,b))for a,b in itertools.combinations(ps,2)];near(min(ss),max(ss));return math.sqrt(float(ss[0]))
def right_triangle(ps):
 assert len(ps)==3 and area(ps)>0;ss=sorted(dot(sub(a,b),sub(a,b))for a,b in itertools.combinations(ps,2));assert ss[0]+ss[1]==ss[2];return ss
def source(r,i):
 q=r['statement'];manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(r['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'sourceGivensAndFaceIncidencesReadVisuallyNotExactRasterMetrics':True}
 if i==2:
  width,height=F(30),F(28);long=height/2;short=width-2*long;out=4*long*short/2;p['visuallyReadRectangleWidthHeight']=list(map(str,[width,height]));p['fourCongruentRightTriangleLegs']=list(map(str,[short,long]))
 elif i==6:
  a,b,c,perimeter=H.numeric_tokens(q);assert a*a+b*b==c*c;width=(perimeter-c-a-b)/2;assert width>0;out=width*c;p['fiveBoundaryPiecesAreOppositeRectangleSideTwoWidthsAndTwoNotchLegs']=True
 elif i==32:
  side,count=H.numeric_tokens(q);assert count==4;small=side/(count-1);out=2*side+2*side+2*(count-1)*small;p['sourceOneLargeAndThreeSmallExteriorEquilateralTriangles']=True
 elif i==37:
  assert H.numeric_tokens(q)==[1,1];whole=F(9*3);whites=[F(3*2,2),F(2*1,2),F(3*2,2),F(2*3,2)];out=whole-sum(whites);p['sourceVisuallyReadGridDimensions']=[9,3];p['sourceVisuallyReadWhiteTriangleAreas']=list(map(str,whites))
 elif i==41:out=F(1,4)+F(1,16)+F(1,64);p['sourceThreeSuccessivelyQuarterAreaSquares']=True
 elif i==42:radius=one(H.numeric_tokens(q));out=8*4*radius;p['sourceFourEqualCirclePackingAndFourExteriorEquilateralTriangles']=True
 elif i==43:diameter=H.numeric_tokens(q)[0];pi=E.calc(one(H.math_parts(q,True)).split('=')[1]);out=pi*(diameter/2)**2-diameter**2/2;p['sourceInscribedSquareDiagonalEqualsCircleDiameter']=True
 else:raise AssertionError(i)
 p['target']=str(out);p.update(B.checked_choices(r,out));return p

def geometry(r,i,data=None):
 root=W.svg(r,data);d=ids(root);p={};s=r['statement']
 if i==2:
  bounds=rect(d['outer']);x,y,w,h=bounds;width=B.scalar(d['width-label'].text);height=B.scalar(d['height-label'].text);unit=w/width;assert unit==h/height>0;polys=[points(d['triangle-'+str(j)])for j in range(4)]
  for ps in polys:inside(ps,bounds)
  disjoint(polys);lengths=[right_triangle(ps)for ps in polys];assert len(set(tuple(v)for v in lengths))==1;short2,long2,_=lengths[0];assert short2/unit**2==(width-height)**2 and long2/unit**2==(height/2)**2;assert width>height>0;out=sum(area(v)for v in polys)/unit**2;assert out==4*(height/2)*(width-height)/2;p.update({'allFourActualTriangleVerticesInsideRectangleDisjointCongruentAndRight':True,'actualPhysicalSquaredTriangleLegs':list(map(str,[short2/unit**2,long2/unit**2])),'commonPixelsPerCm':str(unit)})
 elif i==6:
  outer=points(d['outer']);assert len(outer)==4;Pp,Q,R,S=outer;assert Pp[0]==Q[0]<R[0]==S[0] and Q[1]==R[1]<Pp[1]==S[1];cut=points(d['cutout']);assert len(cut)==3 and cut[0]==R and cut[2]==S;T=cut[1];inside([T],(Q[0],Q[1],R[0]-Q[0],Pp[1]-Q[1]));assert Q[0]<T[0]<R[0] and Q[1]<T[1]<S[1];assert dot(sub(R,T),sub(S,T))==0
  a=B.scalar(d['leg-rt'].text);b=B.scalar(d['leg-ts'].text);c=B.scalar(d['hypotenuse'].text);assert min(a,b,c)>0 and a*a+b*b==c*c;unit=F(dist(R,S))/c;near(dist(R,T)/float(unit),a);near(dist(T,S)/float(unit),b);perimeter=one(H.numeric_tokens(s));width=(perimeter-c-a-b)/2;assert width>0;near(dist(Pp,S)/float(unit),width);out=c*width;near(float(area(outer)/unit**2),out);p['allActualRectangleCornersCutoutLegsHypotenuseAndRightAngleChecked']=True;p['fiveActualColoredBoundaryEdgeLengthsCm']=list(map(str,[c,width,a,b,width]));p['inferredUnlabelledWidthMatchesActualGeometry']=str(width)
 elif i==32:
  square=squarepoly(d['square']);x,y,w,h=rect(d['square']);assert w==h>0;side=B.scalar(d['side-label'].text);assert side>0;unit=w/side;small=[points(v)for k,v in d.items()if k.startswith('small-')];large=points(d['large']);count=one(H.numeric_tokens(s));assert len(small)==count>1
  for ps in small:near(equal_triangle(ps),w/count);assert ps[0][1]==ps[1][1]==y and ps[2][1]<y
  near(equal_triangle(large),w);assert large[0]==(x,y+h)and large[1]==(x+w,y+h)and large[2][1]>y+h;assert sorted((v[0][0],v[1][0])for v in small)==[(x+j*w/count,x+(j+1)*w/count)for j in range(int(count))];disjoint([square,*small,large]);perimeter,proof=union_perimeter([square,*small,large]);out=6*side;near(perimeter/float(unit),out);p.update(proof);p['allSixActualTrianglesEquilateralAndExternal']=True;p['actualSmallTriangleCount']=len(small)
 elif i==37:
  bounds=rect(d['outer']);x,y,w,h=bounds;vertical=sorted(segment(v)for k,v in d.items()if k.startswith('grid-x-'));horizontal=sorted(segment(v)for k,v in d.items()if k.startswith('grid-y-'));cols=len(vertical)-1;rows=len(horizontal)-1;step=w/cols;assert step==h/rows>0
  assert set(vertical)=={(x+j*step,y,x+j*step,y+h)for j in range(cols+1)}and set(horizontal)=={(x,y+j*step,x+w,y+j*step)for j in range(rows+1)};a,b=H.numeric_tokens(d['cell-label'].text);assert a==b>0;unit=step/a;white=[points(v)for k,v in d.items()if k.startswith('white-')];assert len(white)==4
  for ps in white:assert len(ps)==3;inside(ps,bounds);assert all(((u-x)/step).denominator==((v-y)/step).denominator==1 for u,v in ps)
  disjoint(white);out=(w*h-sum(area(v)for v in white))/unit**2;p['actualGridColumnsRows']=[cols,rows];p['allActualWhiteTriangleAreasCm2']=[str(area(v)/unit**2)for v in white];p['allWhiteVerticesOnActualGridAndAllInteriorsDisjoint']=True;p['allActualUniformGridLinesAndPhysicalCellSizeChecked']=True
 elif i==41:
  bounds=rect(d['outer']);x,y,w,h=bounds;assert w==h>0;shades=[rect(v)for k,v in d.items()if k.startswith('shade-')];count=int(H.numeric_tokens(s)[0]);fractions=N.fractions(s,False);assert len(shades)==len(fractions)==count and all(a==b>0 for xx,yy,a,b in shades);polys=list(map(P.polygon,shades))
  for ps in polys:inside(ps,bounds)
  disjoint(polys);ratios=sorted(a/w for xx,yy,a,b in shades);assert ratios==sorted(fractions);out=sum(a*b for xx,yy,a,b in shades)/(w*h);assert out==sum(v*v for v in fractions);p['allActualColoredSideFractions']=list(map(str,ratios));p['actualColoredSquareAreasAsWholeFraction']=[str(a*b/(w*h))for xx,yy,a,b in shades];p['allColoredSquaresDisjointInsideOuterAndMatchPrintedFractions']=True
 elif i==42:
  square=points(d['square']);assert len(square)==4;x,y=square[0];w=square[1][0]-x;assert w>0 and square==[(x,y),(x+w,y),(x+w,y+w),(x,y+w)];circles=[v for k,v in d.items()if k.startswith('circle-')];assert len(circles)==4;radius=one({F(c.attrib['r'])for c in circles});assert radius>0 and w==4*radius;centers={(F(c.attrib['cx']),F(c.attrib['cy']))for c in circles};assert centers=={(x+i*radius,y+j*radius)for i,j in itertools.product([1,3],repeat=2)};physical=B.scalar(d['radius-label'].text);assert physical>0;unit=radius/physical
  rx1,ry1,rx2,ry2=segment(d['radius']);assert(rx1,ry1)in centers and dot((rx2-rx1,ry2-ry1),(rx2-rx1,ry2-ry1))==radius**2;triangles=[points(d['triangle-'+str(j)])for j in range(4)]
  for j,ps in enumerate(triangles):assert ps[:2]==[square[j],square[(j+1)%4]];near(equal_triangle(ps),w);assert cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]))<0
  disjoint([square,*triangles]);perimeter,proof=union_perimeter([square,*triangles]);out=32*physical;near(perimeter/float(unit),out);p.update(proof);p['allFourActualCircleCentersRadiiAndSquareTangenciesChecked']=True;p['allFourActualExteriorTrianglesEquilateral']=True;p['actualPhysicalRadius']=str(physical)
 elif i==43:
  c=d['circle'];cx,cy,radius=[F(c.attrib[k])for k in['cx','cy','r']];assert radius>0;ps=points(d['inscribed-square']);assert len(ps)==4
  for v in ps:near(dot(sub(v,(cx,cy)),sub(v,(cx,cy))),radius**2)
  vectors=[sub(b,a)for a,b in zip(ps,ps[1:]+ps[:1])];ss=[dot(v,v)for v in vectors]
  for v in ss:near(v,ss[0])
  for a,b in zip(vectors,vectors[1:]+vectors[:1]):near(dot(a,b),0)
  a,b,cx2,dy2=segment(d['diameter']);assert a==cx-radius and cx2==cx+radius and b==dy2==cy;diameter=B.scalar(d['diameter-label'].text);assert diameter>0;pi=one(N.fractions(s,False));assert 3<pi<4;unit=2*radius/diameter;near(area(ps)/unit**2,diameter**2/2);out=pi*(diameter/2)**2-diameter**2/2;p['allFourActualSquareVerticesOnCircleEqualEdgesAndRightAnglesChecked']=True;p['actualDiameterSegmentPassesCenterWithBothEndpointsOnCircle']=True;p['actualRotatedSquareShoelaceAreaAgreesWithDiagonalFormula']=True;p['physicalDiameterAndPrintedPi']=list(map(str,[diameter,pi]));p['actualSquaredPixelTolerance']=TOL
 else:raise AssertionError(i)
 p['target']=str(out);p.update(B.checked_choices(r,out));return p

def changed(r,i):
 root=W.svg(r);d=ids(root);cr=copy.deepcopy(r)
 if i==2:d['width-label'].text='68 см';d['height-label'].text='60 см'
 elif i==6:
  for k in['leg-rt','leg-ts','hypotenuse']:d[k].text=str(2*B.scalar(d[k].text))+' см'
  cr['statement']=cr['statement'].replace('76 см','152 см')
 elif i==32:d['side-label'].text='18 см'
 elif i==37:d['cell-label'].text='2 см × 2 см'
 elif i==41:
  root.remove(d['shade-3']);cr['statement']=cr['statement'].replace('4 көк шаршы','3 көк шаршы').replace(', (1/16)','')
 elif i==42:d['radius-label'].text='4 см'
 elif i==43:d['diameter-label'].text='28 см'
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();return cr,raw
def malformed(r,i):
 root=W.svg(r);d=ids(root)
 if i==41:d['shade-0'].set('width',str(F(d['shade-0'].attrib['width'])+1))
 elif i==42:d['circle-0'].set('r',str(F(d['circle-0'].attrib['r'])+1))
 elif i==43:d['circle'].set('r',str(F(d['circle'].attrib['r'])+1))
 else:
  key={2:'triangle-0',6:'cutout',32:'small-0',37:'white-0'}[i];ps=points(d[key]);ps[-1]=(ps[-1][0]+1,ps[-1][1]);d[key].set('points',' '.join(','.join(str(float(v))for v in p)for p in ps))
 raw=ET.tostring(root);return{**r,'figureSha256':hashlib.sha256(raw).hexdigest()},raw

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==7;entries=[];evidence=[];targets={2:F(480),6:F(1200),32:F(108),37:F(92),41:F(21,64),42:F(128),43:F(224)}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=geometry(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  cr,raw=changed(r,i);new=targets[i];old=F(proof['target']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']];bad,badraw=malformed(r,i)
  for row,data in[({**r,'answer':'999999'},None),({**cr,'answer':r['answer']},raw),(bad,badraw)]:
   try:geometry(row,i,data)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('badkeyorupdatedhashgeometryaccepted',i))
  try:changeproof=geometry({**cr,'answer':str(new)},i,raw)
  except Exception as e:raise AssertionError(('changedvalid',i))from e
  proof['validUpdatedHashActualGivensOrColorGeometryTarget']=changeproof['target'];proof['updatedHashMalformedActualGeometryRejected']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All7fullsource/newconditions official/newsolutions/all35source/newchoices/sourcebitmaps/343pxPNGs read. Sourcegivens/incidences visuallyread, notexactsourcepixelmetrics. ActualnativeSVGcoordinates/physicaldimensionlabels decoded. Congruentrighttriangles/disjointness/areas, concave5edgeperimeterandrightnotch, equilateraltrianglesandatomicsharededgecancellation, allgridlinesandwhitevertices, allactualnestedshadedrects/fractions, circlepackingtangencies/starboundaries,androtatedinscribedsquare/diameter checked. Irrationalvertexrounding checkedwith1e-6squaredpixel tolerance; exactphysicalformulas produceanswers. Validupdatedhashactualgivens/colorcanaries recomputed; malformedupdatedhashgeometry rejected. Sameauthornotanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualallshapecoordinates/areas/dimensions/edgeincidences decoded;343pxPNGinspected. Nosourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':7,'sourceOptionsRead':35,'rewrittenOptionsRead':35,'nativeFigures':7,'wrongKeysRejected':7,'validUpdatedHashActualGivensOrGeometryTargetsRecomputed':7,'updatedHashMalformedActualGeometryRejected':7,'pythonJavaScriptHashesMatched':7,'remainingBIL5SourceVisualTasks':[11,21,29,30,31,33,45,48],'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
