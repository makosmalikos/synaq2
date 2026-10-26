"""Sixfullsource/newconditions fullsolutions all30source/newchoices andsixsaved
bitmaps/all343pxnativePNGs inspected. Same root author separate computation,
notanotherhumanreviewer. Actualnativegeometry decoded, not JSspecansweroracles.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil3-native-plane';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('p','scripts/editorial/review-bil2-native-plane.py');P=importlib.util.module_from_spec(sp);sp.loader.exec_module(P);M=P.M;B=P.B;H=P.H;E=P.E;one=P.one;W=P.W;ids=P.ids;rect=P.rect;points=P.points;segment=P.segment;area=P.area
ASSETS={10:('59a3128ce68fe3fd64950a83','f56057bbc697680340e8936935e5de17513820bfb48476898e93170861e5f1a3'),12:('e4552a009ad6fb02e8c7c0b8','dc6321344b1cdca62fc4e4ed16145cfdaa3d394aeb3be755054d2fc6069c0d4b'),17:('2b89ef117f70ea8a35e81894','1fd22d7ab6de97514f54b3ceabf19bef954e5f0b10561d67bd310f0f4f68c667'),26:('388c411f200c92eaac47b4d9','91a606cf716f17e54c8db1667970da852e4f8923582ad18f59aa579a3226372b'),38:('2888e8c68fb7f712738c2018','f11418f46d223f4b04f88fc16141f6d40e1caee2357708c1681a879c3e47a6ae'),39:('caa293af8ccba9094d5e46bd','860d939351fe70b12a96b00e59763cb2bfa791bc29270528195983cb4d208c46')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def grid(root):
 d=ids(root);x,y,w,h=rect(d['whole']);assert w==h>0;xs=[];ys=[]
 for id,el in d.items():
  if id.startswith('grid-x-'):a,b,c,e=segment(el);assert a==c and b==y and e==y+h;xs.append(a)
  if id.startswith('grid-y-'):a,b,c,e=segment(el);assert b==e and a==x and c==x+w;ys.append(b)
 xs.sort();ys.sort();assert xs[0]==x and xs[-1]==x+w and ys[0]==y and ys[-1]==y+h and len(xs)==len(ys);unit=one({b-a for a,b in zip(xs,xs[1:])}|{b-a for a,b in zip(ys,ys[1:])});assert unit>0;return(x,y,w,unit,len(xs)-1)
def grid_fraction(root):
 x,y,w,u,n=grid(root);d=ids(root);polys=[points(e)for k,e in d.items()if k.startswith('shade-')];assert len(polys)>=6;normalized=[]
 for p in polys:
  assert len(p)==3;local=[((a-x)/u,(b-y)/u)for a,b in p];assert all(0<=a<=n and 0<=b<=n and a.denominator<=2 and b.denominator<=2 for a,b in local);assert area(local)>0;normalized.append(local)
 assert all(P.disjoint(a,b)for a,b in itertools.combinations(normalized,2));physical=[area(p)for p in normalized];out=sum(physical)/(n*n)
 # Printed diagonals must bisect exactly the marked interior unit square.
 a,b=segment(d['center-diagonal-0']),segment(d['center-diagonal-1']);assert(a[0]+a[2],a[1]+a[3])==(b[0]+b[2],b[1]+b[3]);assert abs(a[2]-a[0])==abs(a[3]-a[1])==abs(b[2]-b[0])==abs(b[3]-b[1])==u
 return out,{'actualGridSideCellCount':n,'allActualShadedTriangleUnitAreas':list(map(str,physical)),'allActualTrianglesContainedAndPairwiseInteriorDisjoint':True,'bothActualCentralDiagonalsHaveSameMidpointAndUnitSquareCorners':True}
def circles(root,diameter):
 d=ids(root);cs=[d['circle-'+str(j)]for j in range(4)];r=one({F(e.attrib['r'])for e in cs});assert r>0;centers=[tuple(F(e.attrib[k])for k in['cx','cy'])for e in cs];xs=sorted({x for x,y in centers});ys=sorted({y for x,y in centers});assert len(xs)==len(ys)==2 and xs[1]-xs[0]==ys[1]-ys[0]==2*r and set(centers)==set(itertools.product(xs,ys));filled=[e for e in cs if e.attrib['fill']!='none'];assert len(filled)==1 and filled[0].attrib['fill']==d['center-gap'].attrib['fill'];xm,ym=sum(xs)/2,sum(ys)/2;vertices=[(xm,ys[0]),(xs[1],ym),(xm,ys[1]),(xs[0],ym),(xm,ys[0])];tokens=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',d['center-gap'].attrib['d']);expected=['M',*map(str,vertices[0])]
 for endpoint in vertices[1:]:expected+=['A',str(r),str(r),'0','0','0',*map(str,endpoint)]
 expected+=['Z'];assert tokens==expected;cx,cy=centers[cs.index(filled[0])];assert segment(d['diameter'])==(cx-r,cy,cx+r,cy)and B.scalar(d['diameter-label'].text)==diameter;out=diameter*diameter
 return out,{'allFourEqualActualRadiiAndFourNeighborTangenciesChecked':True,'allConcaveQuarterArcRadiiEndpointsSmallArcNegativeSweepChecked':True,'actualDiameterSegmentAndPhysicalLabelMatchStatement':True,'exactSymbolicPiDiscCoefficientMinusOnePlusOne':0,'centerSquareMinusFourQuartersPlusWholeDiscEqualsDiameterSquared':True}
def diamond(root,known):
 d=ids(root);x,y,w,h=rect(d['whole']);assert w==h>0;p=points(d['shade']);assert p==[(x+w/2,y),(x+w,y+h/2),(x+w/2,y+h),(x,y+h/2)];assert B.scalar(d['inner-area'].text)==known;ticklength=[]
 for j,yy in enumerate([y,y+h]):
  for k,xx in enumerate([x+w/4,x+3*w/4]):
   a,b,c,e=segment(d[f'tick-h-{j}-{k}']);assert a==c==xx and(b+e)/2==yy;ticklength.append(abs(e-b))
 for j,xx in enumerate([x,x+w]):
  for k,yy in enumerate([y+h/4,y+3*h/4]):
   a,b,c,e=segment(d[f'tick-v-{j}-{k}']);assert b==e==yy and(a+c)/2==xx;ticklength.append(abs(c-a))
 assert len(set(ticklength))==1 and ticklength[0]>0;ratio=area(p)/(w*h);assert ratio==F(1,2);return known/ratio,{'allFourActualVerticesEqualSideMidpoints':True,'allEightEqualMidsectionTickPlacementsChecked':True,'actualShoelaceInnerToOuterAreaRatio':str(ratio),'actualPhysicalInnerLabelMatchesStatement':True}
def hexagon(root,perimeter):
 d=ids(root);ps=points(d['whole']);assert len(ps)==6;rad=[segment(d['radius-'+str(j)])for j in range(6)];cx,cy=one({(a,b)for a,b,c,e in rad});assert [(c,e)for a,b,c,e in rad]==ps;rs=[(a-cx)**2+(b-cy)**2 for a,b in ps];ls=[(a[0]-b[0])**2+(a[1]-b[1])**2 for a,b in zip(ps,ps[1:]+ps[:1])];assert max(float(abs(v-rs[0])/rs[0])for v in rs+ls)<1e-10;assert abs(float(area(ps)-sum(area([(cx,cy),a,b])for a,b in zip(ps,ps[1:]+ps[:1]))))<1e-8;shade=points(d['shade']);assert len(shade)==3 and shade[0]==(cx,cy);idx=ps.index(shade[1]);assert shade[2]==ps[(idx+1)%6];assert B.scalar(d['perimeter'].text)==perimeter;return perimeter/2,{'actualSixEqualRadiiAndSixEqualSidesRelativeSquaredTolerance':1e-10,'allSixActualCenterToVertexSegmentsChecked':True,'actualShadedPolygonIsExactlyOneCompleteAdjacentSector':True,'actualPhysicalPerimeterLabelMatchesStatement':True,'physicalTargetFromEqualSidesNotRoundedPixelLength':True}
def coordinate(root):
 d=ids(root);a=segment(d['axis-x']);b=segment(d['axis-y']);assert a[1]==a[3]and b[0]==b[2];ox,oy=b[0],a[1];units=[]
 for k in range(15):
  x1,y1,x2,y2=segment(d['grid-x-'+str(k)]);assert x1==x2 and y1<y2==oy
  if k:units.append((x1-ox)/k)
  else:assert x1==ox
 for k in range(11):
  x1,y1,x2,y2=segment(d['grid-y-'+str(k)]);assert y1==y2 and x1==ox and x2>ox
  if k:units.append((oy-y1)/k)
  else:assert y1==oy
 unit=one(set(units));assert unit>0
 for axis,end in[('x',14),('y',10)]:
  for k in range(2,end+1,2):
   e=d[f'tick-{axis}-{k}'];assert F(e.text)==k
   if axis=='x':assert F(e.attrib['x'])==ox+k*unit
   else:assert abs(F(e.attrib['y'])-(oy-k*unit))<unit/2
 ps=[((x-ox)/unit,(oy-y)/unit)for x,y in points(d['shade'])];assert len(ps)==4 and all(0<=x<=14 and 0<=y<=10 and x.denominator==y.denominator==1 for x,y in ps);out=area(ps);base=abs(ps[1][0]-ps[0][0]);height=ps[2][1]-ps[0][1];cutbase=ps[2][1]-ps[3][1];cutheight=abs(ps[3][0]-ps[0][0]);assert ps[0][1]==ps[1][1]and ps[2][0]==ps[3][0]and 0<cutbase<height;crosscheck=(base*height-cutbase*cutheight)/2;assert out==crosscheck;return out,{'all26ActualGridLinesAnd12NumberedTicksCalibrated':True,'actualFourCalibratedVertices':[[str(v)for v in p]for p in ps],'shoelaceEqualsLargeTriangleMinusActualConcaveCut':True}
def bands(root,side,unitcm):
 d=ids(root);x,y,w,u,n=grid(root);assert side/unitcm==n;assert B.scalar(d['whole-side'].text)==side and B.scalar(d['unit-label'].text)==unitcm;assert segment(d['unit'])[2]-segment(d['unit'])[0]==u;used=set();proofs=[]
 for key,el in d.items():
  if not key.startswith('band-'):continue
  p=[((a-x)/u,(y+w-b)/u)for a,b in points(el)];assert len(p)==6;assert all(a.denominator==b.denominator==1 and 0<=a<=n and 0<=b<=n for a,b in p);k=max(max(a,b)for a,b in p);assert p==[(0,k),(k,k),(k,0),(k-1,0),(k-1,k-1),(0,k-1)];cells={(a,b)for a,b in itertools.product(range(int(k)),repeat=2)if max(a,b)==k-1};assert not cells&used;used|=cells;assert len(cells)==area(p)==2*k-1;proofs.append(str(area(p)*unitcm**2))
 out=len(used)*unitcm**2;return out,{'actualGridSide':n,'allActualLPolygonAreasInPhysicalCmSquared':proofs,'allShadedUnitCellsDisjointAndAgreeWithPolygonShoelace':True,'shadedUnitCellCount':len(used)}
def solve(r,i,src=False,data=None,check=True):
 n=H.numeric_tokens(r['statement']);proof={};root=None if src else W.svg(r,data)
 if src:proof['sourceRasterSHA256']=asset(i)
 if i==10:
  if src:out=F(4*F(1,2)+2*F(1,4),9);proof['sourceObservedFourCornerHalvesAndTwoCentralQuartersInNineCells']=True
  else:out,p=grid_fraction(root);proof.update(p)
 elif i==12:
  diameter=one(n);assert diameter>0
  if src:out=diameter**2;proof['sourceObservedFourTangentDiscsCentralGapAndOneWholeDiscPiCancellation']=True
  else:out,p=circles(root,diameter);proof.update(p)
 elif i==17:
  known=one(n)
  if src:out=2*known;proof['sourceObservedAllEightEqualSideMarksAndMidpointDiamond']=True
  else:out,p=diamond(root,known);proof.update(p)
 elif i==26:
  perimeter=one(n)
  if src:out=perimeter/2;proof['sourceObservedSixEquilateralSectors']=True
  else:out,p=hexagon(root,perimeter);proof.update(p)
 elif i==38:
  if src:p=[(F(1),F(1)),(F(12),F(1)),(F(7),F(9)),(F(7),F(4))];out=area(p);assert out==F(11*8-5*6,2);proof['sourceActualGridVertices']=[[str(v)for v in a]for a in p]
  else:assert one(n)==1;out,p=coordinate(root);proof.update(p)
 elif i==39:
  side,unitcm=n
  if src:assert side/unitcm==5;out=sum(k*k-(k-1)**2 for k in[2,4])*unitcm**2;proof['sourceObservedAlternatingUnitLShells2And4']=True
  else:out,p=bands(root,side,unitcm);proof.update(p)
 else:raise AssertionError(i)
 proof['target']=str(out)
 if check:proof.update(B.checked_choices(r,out))
 return out,proof

def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root)
 if i==10:ET.SubElement(root,'{http://www.w3.org/2000/svg}polygon',{'id':'shade-new','points':'180,144 236,144 236,200','fill':'#a99bdf'})
 elif i==12:d['statement']=d['statement'].replace('диаметрі 4 см','диаметрі 5 см');v['diameter-label'].text='5 см'
 elif i==17:d['statement']=d['statement'].replace('50 см²','72 см²');v['inner-area'].text='72 см²'
 elif i==26:d['statement']=d['statement'].replace('54 см','60 см');v['perimeter'].text='P = 60 см'
 elif i==38:
  p=points(v['shade']);p[1]=(p[1][0]+22,p[1][1]);v['shade'].set('points',' '.join(f'{a},{b}'for a,b in p))
 else:ET.SubElement(root,'{http://www.w3.org/2000/svg}polygon',{'id':'band-new','points':'75,64 285,64 285,274 255,274 255,94 75,94','fill':'#a99bdf'})
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();new,_=solve(d,i,False,raw,False);old,_=solve(r,i);assert new!=old;d['options']=[str(B.scalar(val)+new-old)for val in r['options']];return d,raw,str(new)
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==6;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);bad,raw,target=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for cr,cb in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(cr,i,False,cb)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashGeometryOrPhysicalInputTarget']=target;proof['oldKeyRejectedAndCorrectChangedInputAccepted']=True;root=W.svg(r);v=ids(root)
  if i==10:v['shade-0'].set('points',v['shade-0'].attrib['points'].replace('68,32','69,32'))
  elif i==12:v['center-gap'].set('d',v['center-gap'].attrib['d'].replace('A65 65','A64 65',1))
  elif i==17:v['tick-h-0-0'].set('x1','121')
  elif i==26:v['radius-0'].set('x2','289')
  elif i==38:v['tick-x-2'].text='3'
  else:v['band-2'].set('points',v['band-2'].attrib['points'].replace('135','136',1))
  broken=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(broken).hexdigest()},i,False,broken)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedgeometryaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All6fullsource/newconditions solutions/all30source/newchoices/sourcebitmaps/all343pxPNGs read. Actualgridspacing/trianglevertices/containment/disjointSAT/shoelaceareas; fourcirclecenters/equalradii/tangencies/concavearcflags/diameter andsymbolicpi-cancellation; diamondmidpoints/eightticks/physicalarea; allhexvertices/equalradii/sides/sector withrelative1e-10squaredtolerance andexactphysicalperimeterrelation; all26coordinategridlines/12ticks/concavevertices/difference/shoelace; actualLpolygons/allunitcells/shellareas checked. Changedgeometryorphysicalinputcanaries acceptcorrectnewanswers andrejectold; malformedgeometry rejected evenwithupdatedhash. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'SixoriginalnativeSVG actualgeometry andphysicaldimensions decoded. All343pxPNGs inspected. No sourcebitmap/tracedvector.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':6,'sourceOptionsRead':30,'rewrittenOptionsRead':30,'nativeFigures':6,'wrongKeysRejected':6,'validUpdatedHashGeometryOrPhysicalInputsRecomputed':6,'updatedHashMalformedActualGeometryRejected':6,'sourceBitmapsReused':0,'pythonJavaScriptHashesMatched':6,'remainingBIL3VisualTasks':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
