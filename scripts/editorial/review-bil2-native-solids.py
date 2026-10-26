"""Allthreefullsource/newconditions completeofficial/newsolutions/all15source/new
choices read; allsourcebitmaps/all343pxnativePNGs inspected. Same root author
separate exact computation, not anotherhumanreviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-native-solids';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('solid','scripts/editorial/review-bil1-native-solids.py');S=importlib.util.module_from_spec(sp);sp.loader.exec_module(S);M=S.M;B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;ids=M.ids;points=M.points;segment=M.segment
ASSETS={37:('b6e67b2bebfd71f7dcc35a50','c2b26ccd4c4782c0feb06c36dddf27354a0a6365b74f642e08fb9e8d4e38affc'),45:('1fd9eae2fdf3c3f8e19070ed','30f2bfc5f9900785598d4b3cba2af9d81c9d083e06b7ffbc4c2d5f3b8f4e6260'),46:('861d3fb8a3bef15ff9514866','f892ac745cf8f3670c4016eab89cd9114ee241287fcf99cc2d719404dc9ceb5c')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def t_cells(root):
 d=ids(root);raw={kind:[points(v)for id,v in d.items()if id.startswith('body-'+kind+'-')]for kind in['front','right','top']};assert all(raw.values());f,t=raw['front'][0],raw['top'][0];U,Z=S.sub(f[1],f[0]),S.sub(f[3],f[0]);V=S.sub(t[3],t[0]);assert S.sub(t[1],t[0])==U;O=(min(x for p in raw['front']for x,y in p),max(y for p in raw['front']for x,y in p));assert U[0]>0 and U[1]==Z[0]==0 and Z[1]<0 and V[0]>0>V[1];inverse={}
 for c in itertools.product(range(9),repeat=3):
  p=tuple(O[j]+sum(c[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));assert p not in inverse;inverse[p]=c
 decoded={}
 for kind,faces in raw.items():
  decoded[kind]=set()
  for face in faces:assert len(face)==4 and all(p in inverse for p in face);ps=tuple(inverse[p]for p in face);assert ps not in decoded[kind];decoded[kind].add(ps)
 cells=set()
 for face in decoded['top']:
  x,y,z=face[0];assert face==((x,y,z),(x+1,y,z),(x+1,y+1,z),(x,y+1,z))and z==1;cells.add((x,y,0))
 assert decoded==S.visible(cells);return cells,{'allActualTUnitFacePolygonsDecoded':sum(map(len,raw.values())),'projectionInjectiveOverAll729PositiveLatticeVertices':True,'allActualTWorldCubeCoordinates':[list(v)for v in sorted(cells)],'allVisibleFaceInventoryMatchesSingleLayerCubeShape':True},(O,U,V,Z)
def cross_cells(root):
 d=ids(root);raw={kind:[points(v)for id,v in d.items()if id.startswith('body-'+kind+'-')]for kind in['front','right','top']};assert all(raw.values());f,t=raw['front'][0],raw['top'][0];O=f[0];U=S.sub(f[1],f[0]);Z=S.sub(f[3],f[0]);V=S.sub(t[3],t[0]);assert S.sub(t[1],t[0])==U and U[0]>0 and U[1]==Z[0]==0 and Z[1]<0 and V[0]>0>V[1];inverse={}
 for c in itertools.product(range(-4,5),repeat=3):
  p=tuple(O[j]+sum(c[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));assert p not in inverse;inverse[p]=c
 decoded={};owners=set()
 for kind,faces in raw.items():
  decoded[kind]=set()
  for face in faces:
   assert len(face)==4 and all(p in inverse for p in face);ps=tuple(inverse[p]for p in face);assert ps not in decoded[kind];decoded[kind].add(ps);a=ps[0];owner=a if kind=='front'else(a[0]-1,a[1],a[2])if kind=='right'else(a[0],a[1],a[2]-1);owners.add(owner)
 assert len(owners)==6;center=tuple(sum(v[j]for v in owners)/F(6)for j in range(3));assert all(v.denominator==1 for v in center);center=tuple(map(int,center));arms={tuple(center[k]+(delta if k==j else 0)for k in range(3))for j in range(3)for delta in[-1,1]};assert owners==arms;cells=arms|{center};assert decoded==S.visible(cells);return cells,{'allActualProjectedFacePolygons':sum(map(len,raw.values())),'projectionUniqueOverAll729LocalIntegerCandidates':True,'allSixActualVisibleFaceOwnerCubes':list(map(list,sorted(owners))),'singleHiddenMiddleCubeInferredFromActualSixArmOwnersAndExplicitCondition':list(center),'noFakeSolidColumnsAddedBeneathUnsupportedArms':True,'allVisibleFaceInventoryMatchesSevenCubeSixArmSolid':True}
def circle_geometry(root,shade):
 d=ids(root);mid=d['center'];cx,cy,r=[F(mid.attrib[k])for k in['cx','cy','r']];assert r>0 and mid.attrib['fill']=='#b4c8f3';vertices=points(d['square']);assert len(vertices)==4 and points(d['square-outline'])==vertices;assert len(set(vertices))==4;origins=[]
 for j in range(4):
  o,c=d['outer-'+str(j)],d['shade-'+str(j)];a,b,rr=[F(o.attrib[k])for k in['cx','cy','r']];assert(a,b)==vertices[j]and rr==r and o.attrib['fill']=='white';assert all(c.attrib[k]==o.attrib[k]for k in['cx','cy','r'])and c.attrib['fill']=='#b4c8f3'and c.attrib['clip-path']=='url(#square-clip)';origins.append((a,b));assert(a-cx)**2+(b-cy)**2==4*r*r
 assert(cx,cy)==tuple(sum(v[k]for v in vertices)/4 for k in range(2));sides=[]
 for j,v in enumerate(vertices):
  a,b=S.sub(vertices[j-1],v),S.sub(vertices[(j+1)%4],v);assert sum(x*y for x,y in zip(a,b))==0;sides.append(sum(x*x for x in a))
 assert len(set(sides))==1 and sides[0]>r*r;assert all((a[0]-b[0])**2+(a[1]-b[1])**2>=4*r*r for a,b in itertools.combinations(vertices,2));assert F(one(re.findall(r'(\d+)A',d['shade-total'].text)))==shade
 # Center disc is fully inside the square; each corner clip is an exact90degree
 # sector and does not reach a nonadjacent side.
 for a,b in zip(vertices,vertices[1:]+vertices[:1]):
  v=S.sub(b,a);w=S.sub((cx,cy),a);assert(v[0]*w[1]-v[1]*w[0])**2>=r*r*sum(t*t for t in v)
 return{'allFiveActualEqualCircleCentersAndRadiiChecked':True,'allFourOuterToCenterTangenciesExact':True,'allOuterDiscInteriorsPairwiseDisjoint':True,'actualDiamondClipIsRightAngleSquareAtAllFourCenters':True,'actualFourShadeCopiesUseMatchingSquareClipAndCenterDiscInsideSquare':True,'allFourClippedCornerAreasExactlyOneQuarterOfOneDisc':True,'totalShadedDiscAreaCount':2,'totalUnshadedDiscAreaCount':3}
def solve(r,i,src=False,data=None):
 n=H.numeric_tokens(re.sub(r'\$\^2\$|²','',r['statement']));proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data)
 if i==37:
  if src:cells={(x,0,0)for x in range(5)}|{(2,y,0)for y in range(1,4)};proof['observedSourceFiveCrossbarThreeStemEightCubeT']=True;assert n==[1]and'сегіз'in r['statement']
  else:cells,p,frame=t_cells(root);proof.update(p);edge,count=n;assert edge>0 and len(cells)==count
  histogram=collections.Counter(sum(v in cells for v in S.neighbors(c))for c in cells);out=F(histogram[2]);assert sum(histogram.values())==len(cells);expected=[out,F(len(cells)),F(3),out+3,out+2];proof.update({'allCubeCountsByActualFaceNeighborCount':dict(histogram),'exactFourPaintedFacesMeansExactlyTwoNeighbors':True,'allCubeCountsByPaintedFaceCount':{6-k:v for k,v in histogram.items()},'exactFourPaintedCubeCountTarget':str(out)})
 elif i==45:
  wholeArea=one(n)
  if src:cells={(1,1,1),(0,1,1),(2,1,1),(1,0,1),(1,2,1),(1,1,0),(1,1,2)};proof['observedSourceSingleMiddlePlusSixFaceArmCubes']=True
  else:cells,p=cross_cells(root);proof.update(p)
  faces,p=S.surfaces(cells);assert len(cells)==7 and faces==30;proof.update(p);unitArea=wholeArea/faces;edge=math.isqrt(int(unitArea));assert edge*edge==unitArea;out=F(len(cells)*edge**3);expected=[wholeArea,out,out-48,out-24,out-82];proof.update({'actualWholePhysicalSurface':str(wholeArea),'physicalUnitSquareArea':str(unitArea),'physicalCubeEdge':edge,'wholeVolumeTarget':str(out)})
 elif i==46:
  shade=n[-1];assert shade>0
  if not src:proof.update(circle_geometry(root,shade));assert'A оң сан'in r['statement']
  else:assert n[0]==5;proof['observedSourceFourQuarterCornerDiscClipsAndOneWholeMiddleDisc']=True
  out=3*shade/2;coeffs=[shade,out-2,out-1,out,2*shade];target=E.expr('('+str(out)+')*A');values=list(map(E.expr,B.options(r)));assert all(v.equals(E.expr('('+str(c)+')*A'))for v,c in zip(values,coeffs))and all(not a.equals(b)for a,b in itertools.combinations(values,2))and E.expr(r['answer']).equals(target);proof.update({'actualGivenShadedAreaCoefficient':str(shade),'singleDiscAreaCoefficient':str(shade/2),'unshadedAreaCoefficientTarget':str(out),'allFiveExactSymbolicAreaOptionsChecked':True,'answerChecked':True});return proof
 else:raise AssertionError(i)
 proof.update(B.checked_choices(r,out,expected));proof['answerChecked']=True;return proof
def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root)
 if i==37:
  cells,p,frame=t_cells(root);cells.add((3,5,0));S.redraw(root,'body',cells,frame);d['statement']=d['statement'].replace('11 текше','12 текше');target='8';d['options']=['8','12','3','11','10']
 elif i==45:d['statement']=d['statement'].replace('750 см²','1080 см²');target='1512 см³';d['options']=['1080 см³','1512 см³','1464 см³','1488 см³','1430 см³']
 else:d['statement']=d['statement'].replace('8A','10A');v['shade-total'].text='Боялған аудан: 10A';target='15 × A';d['options']=['10 × A','13 × A','14 × A','15 × A','20 × A']
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,target
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  bad,raw,target=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashGeometryOrPhysicalInputTarget']=target;proof['oldKeyRejectedAndCorrectChangedInputAccepted']=True;root=W.svg(r);v=ids(root)
  if i==46:v['shade-0'].set('r','41')
  else:
   first=next(x for id,x in v.items()if id.startswith('body-front-'));ps=points(first);ps[0]=(ps[0][0]+1,ps[0][1]);first.set('points',' '.join(','.join(map(str,p))for p in ps))
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedActualSolidAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[x.strip().rstrip('.,')for x in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:vals=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vals))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Allthreefullsource/newconditions completeofficial/newsolutions/all15source/newoptions/sourcebitmaps/343pxnativePNGs read. ActualTfacepolygons decoded tointegerworldcubes/allneighborandpaintedfacehistograms checked. Actualsixvisiblecrossarmowners decodedinlocalprojection; singlehiddencenterderivedfromactualarmsandexplicit6-armcondition, nofakefilledcolumns. All30externalfaces/physicalsquareedge/wholevolume checked. Actualfiveequalcirclecenters/radii/diamondcliprightangles/tangencies/nonoverlap/centerinsideclip andallquarter-sectors checked; allsymbolicoptions exact. Updatedhashgeometryorphysicaltargets8/1512/15A recomputedandmalformedgeometry rejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'ThreeoriginalnativeSVG actual3Dunitfacepolygons andequalcircle/diamondclipgeometry decoded. Sourcebitmaps/all343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'fullSourceNewConditionsAndSolutionsRead':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'wrongKeysRejected':3,'validUpdatedHashGeometryOrPhysicalInputChangesRecomputed':3,'updatedHashMalformedActualGeometryRejected':3,'nativeFigures':3,'hiddenCrossCenterNotFakeColumnFilled':True,'remainingBIL2Visuals':[11,22,40,41,48],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
