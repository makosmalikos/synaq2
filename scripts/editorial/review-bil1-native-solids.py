"""Three fullsource/newconditions completeofficial/newsolutions andall15
source/newoptions read; three sourcebitmaps/all343pxnativePNGs inspected.
Same root author separate exact computation, not anotherhumanreviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil1-native-solids';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('mathfig','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;ids=M.ids;segment=M.segment;points=M.points
ASSETS={32:('45991cb0c462674f192466ec','da4d8701a3ba7b59bb1f647e28900b27334d2543643566ed28cb5853cd1183ee'),44:('83709b1050cd63a4bc19ee63','4a04c57a346e9b9f49056e72f3b00a1a41a53928ea8b316f25e3970f40863139'),50:('79156e953d0e0cd5912c43a4','87cd1fbc3297427b59db46694e3c61d92294eeb8f78d86e506081adaf6fbea14')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def neighbors(v):
 for j in range(3):
  for delta in[-1,1]:w=list(v);w[j]+=delta;yield tuple(w)
def surfaces(cells):
 assert cells;count=sum(n not in cells for c in cells for n in neighbors(c));contacts=sum(n in cells for c in cells for n in neighbors(c));assert contacts%2==0 and count==6*len(cells)-contacts;return F(count),{'allOccupiedCubeCount':len(cells),'allSixNeighborDirectionsPerCubeEnumerated':6*len(cells),'internalSharedFacePairs':contacts//2,'allExternalUnitFacesIncludingBottom':count,'sixTimesVolumeMinusTwiceContactsEqualsDirectSurfaceInventory':True}
def visible(cells):
 result={'front':set(),'right':set(),'top':set()}
 for x,y,z in cells:
  if(x,y-1,z)not in cells:result['front'].add(((x,y,z),(x+1,y,z),(x+1,y,z+1),(x,y,z+1)))
  if(x+1,y,z)not in cells:result['right'].add(((x+1,y,z),(x+1,y+1,z),(x+1,y+1,z+1),(x+1,y,z+1)))
  if(x,y,z+1)not in cells:result['top'].add(((x,y,z+1),(x+1,y,z+1),(x+1,y+1,z+1),(x,y+1,z+1)))
 return result
def actual_voxels(root,key):
 d=ids(root);raw={kind:[points(v)for id,v in d.items()if id.startswith(key+'-'+kind+'-')]for kind in['front','right','top']};assert all(raw.values());f,t=raw['front'][0],raw['top'][0];assert len(f)==len(t)==4;U,Z=sub(f[1],f[0]),sub(f[3],f[0]);assert sub(t[1],t[0])==U;V=sub(t[3],t[0]);assert U[0]>0 and U[1]==0 and Z[0]==0 and Z[1]<0 and V[0]>0 and V[1]<0;O=(min(x for face in raw['front']for x,y in face),max(y for face in raw['front']for x,y in face));project=lambda c:tuple(O[j]+sum(c[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));inverse={}
 for c in itertools.product(range(7),repeat=3):p=project(c);assert p not in inverse,'Projection must be injective over checked lattice';inverse[p]=c
 decoded={}
 for kind,faces in raw.items():
  decoded[kind]=set()
  for face in faces:
   assert len(face)==4 and all(p in inverse for p in face);world=tuple(inverse[p]for p in face);assert world not in decoded[kind];decoded[kind].add(world)
 heights={}
 for face in decoded['top']:
  x,y,z=face[0];assert face==((x,y,z),(x+1,y,z),(x+1,y+1,z),(x,y+1,z))and z>0 and(x,y)not in heights;heights[x,y]=z
 cells={(x,y,z)for(x,y),h in heights.items()for z in range(h)};expected=visible(cells);assert decoded==expected;assert cells and min(x for x,y,z in cells)==min(y for x,y,z in cells)==0;proof={'actualCommonProjectionBasisInferredFromFrontAndTopUnitFaces':{'origin':list(map(str,O)),'U':list(map(str,U)),'V':list(map(str,V)),'Z':list(map(str,Z))},'allActualUnitPolygonsDecodedToUniqueIntegerWorldVertices':sum(map(len,raw.values())),'projectionInjectiveOverAll343CandidateWorldVertices':True,'allActualTopHeights':[[x,y,h]for(x,y),h in sorted(heights.items())],'completeVisibleFrontRightTopFaceInventoryEqualsNoGapColumnSolid':True};return cells,proof,(O,U,V,Z)
def redraw(root,key,cells,frame):
 group=ids(root)[key]
 for v in list(group):group.remove(v)
 O,U,V,Z=frame;proj=lambda c:tuple(O[j]+sum(c[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));ns='{http://www.w3.org/2000/svg}'
 for kind,faces in visible(cells).items():
  for j,face in enumerate(sorted(faces)):ET.SubElement(group,ns+'polygon',{'id':f'{key}-{kind}-{j}','points':' '.join(','.join(map(str,proj(c)))for c in face),'fill':{'front':'#cadffa','right':'#bdb3ed','top':'#edf1ff'}[kind],'stroke':'#839ac0','stroke-width':'1.2'})
def route(root,edge):
 dims,proof=M.cuboid(root);assert dims==[edge]*3;d=ids(root);a=M.segment(d['box-edge-0-1']);b=M.segment(d['box-edge-0-2']);c=M.segment(d['box-edge-0-4']);O=(a[0],a[1]);U=((a[2]-a[0])/edge,(a[3]-a[1])/edge);Z=((b[2]-b[0])/edge,(b[3]-b[1])/edge);V=((c[2]-c[0])/edge,(c[3]-c[1])/edge);project=lambda v:tuple(O[j]+sum(v[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));inverse={}
 for v in itertools.product(range(int(edge)+1),repeat=3):
  p=project(v);assert p not in inverse;inverse[p]=v
 actual=points(d['route']);assert all(v in inverse for v in actual);world=[inverse[v]for v in actual];assert world[0]==(0,0,edge)and world[-1]==(edge,edge,0);lengths=[]
 for a,b in zip(world,world[1:]):
  changed=[j for j in range(3)if a[j]!=b[j]];assert len(changed)==1;direction=one(changed);fixed=[j for j in range(3)if j!=direction];assert any(a[j]in[0,edge]for j in fixed);lengths.append(F(abs(a[direction]-b[direction])))
 out=sum(lengths);proof.update({'allActualPolylineWorldSurfacePoints':[list(v)for v in world],'allPhysicalAxisParallelSegmentLengths':list(map(str,lengths)),'everySegmentRemainsOnCubeSurfaceAndNoScreenDistanceUsed':True,'actualSurfaceRouteCentimetersTarget':str(out)});return out,proof
def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s);proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data)
 if i==32:
  if src:
   # Sourceupperlayers can be centered at half-cell offsets. Only fully supported
   # layer AREAS and external areas are claimed, not fictitious integer alignment.
   sizes=[3,2,1];count=sum(v*v for v in sizes);paint=F(1);area=F(2*sizes[0]**2+4*sum(sizes));allLayerSurfaces=sum(2*v*v+4*v for v in sizes);contactArea=sum(v*v for v in sizes[1:]);assert area==allLayerSurfaces-2*contactArea;proof.update({'observedSourceLayerSquareSides':sizes,'observedSourceCubeCount':count,'fullySupportedLayerContactAreas':[4,1],'sourceHalfOffsetAlignmentNotPretendedInteger':True,'layerSurfaceSumMinusTwiceContactArea':str(area)})
  else:
   count,paint=n;cells,p,frame=actual_voxels(root,'stack');assert len(cells)==count;area,q=surfaces(cells);proof.update(p);proof.update(q)
  out=area*paint/6;expected=[out-4,out-1,out,out+2,out+3];proof['wholeUnitCubePaintLiters']=str(paint);proof['wholeSolidPaintLitersTarget']=str(out)
 elif i==44:
  edge=one(n)
  if src:out=5*edge;proof.update({'sourceObservedFiveEdgeLengthGroups':True,'sourceUnlabeledSplitNotClaimedMeasured':True,'twoFrontHorizontalPartsSumToOneWholeEdgeForAnyInteriorSplit':True,'actualSurfaceRouteCentimetersTarget':str(out)})
  else:out,proof=route(root,edge)
  expected=[out-26,out-8,out,out+8,out+10]
 elif i==50:
  paint=one(n)
  if src:
   first=set(itertools.product(range(3),repeat=3));second={c for c in first if not(c[0]>=1 and c[1]==0)};proof['observedSourceThreeByThreeByThreeFullHeightFrontCornerTwoByOneCut']=True
  else:first,p,f=actual_voxels(root,'solid-one');second,q,g=actual_voxels(root,'solid-two');proof['firstActualFigure']=p;proof['secondActualFigure']=q
  areaFirst,p=surfaces(first);areaSecond,q=surfaces(second);assert second<first;side=round(len(first)**(1/3));assert first==set(itertools.product(range(side),repeat=3));removed=first-second;removedXY={(x,y)for x,y,z in removed};assert removed=={(x,y,z)for x,y in removedXY for z in range(side)}and len({y for x,y in removedXY})==1;out=paint*areaSecond/areaFirst;expected=[out+2,out+1,out+F(6,5),out,paint];proof.update({'firstSolid':p,'secondSolid':q,'removedWholeHeightColumnCoordinates':[list(v)for v in sorted(removedXY)],'originalFullCubeSideCells':side,'paintPerUnitSquareLiter':str(paint/areaFirst),'paintLitersTarget':str(out)})
 else:raise AssertionError(i)
 proof.update(B.checked_choices(r,out,expected));proof['answerChecked']=True;return proof
def changed(r,i):
 bad=copy.deepcopy(r);root=W.svg(r);d=ids(root)
 if i==32:
  cells,p,frame=actual_voxels(root,'stack');x,y=0,0;z=max(v[2]for v in cells if v[:2]==(x,y))+1;cells.add((x,y,z));redraw(root,'stack',cells,frame);bad['statement']=bad['statement'].replace('30 бірдей','31 бірдей');target='19 л';bad['options']=['15 л','18 л','19 л','21 л','22 л']
 elif i==44:
  d['route'].set('points','55,44 55,224 125,224 125,44 165,44 165,84 235,84 235,44 270,9 270,189');target='98 см';bad['options']=['72 см','90 см','98 см','106 см','108 см']
 else:
  cells,p,frame=actual_voxels(root,'solid-two');cells|={(1,0,z)for z in range(4)};redraw(root,'solid-two',cells,frame);target='13.8 л';bad['options']=['15.8 л','14.8 л','15 л','13.8 л','14.4 л']
 raw=ET.tostring(root);bad['figureSha256']=hashlib.sha256(raw).hexdigest();return bad,raw,target
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
  try:cp=solve({**bad,'answer':target},i,False,raw)
  except Exception as e:raise AssertionError(('validChangedActualSolid',i))from e
  proof['validUpdatedHashActualSolidTarget']=target;proof['oldKeyRejectedAndCorrectChangedSolidAnswerAccepted']=True
  root=W.svg(r);d=ids(root)
  if i==44:d['route'].set('points',d['route'].attrib['points'].replace('125,224','126,223'))
  else:
   key='stack'if i==32 else'solid-two';v=one(v for id,v in d.items()if id.startswith(key+'-front-')and id==next(k for k in d if k.startswith(key+'-front-')));ps=points(v);ps[0]=(ps[0][0]+1,ps[0][1]);v.set('points',' '.join(','.join(map(str,p))for p in ps))
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedSolidAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Allthreefullsource/newconditions completeofficial/newsolutions/all15source/newoptions/sourcebitmaps/343pxnativePNGs read. Actualunitfacepolygons/commonbasis inferredfromactualfront/topfaces decoded intoinjectiveintegerworldlattice; allvisiblefront/right/topinventory checkedagainstnogapcolumns; allsixdirectionexposedsurfaces includingbottom cross6Nminus2contacts. Actualcube routepolyline decoded tophysical3Dsurfacepoints/axisparallelsegments. OriginalpyramidlayercontactAREAScheckedwithoutpretending sourcehalf-offsetstackwasintegeraligned. Updatedhashactualvoxel/pathchanges recomputed19/98/13.8 and malformedgeometry rejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualallunitfacepolygons/routepolyline decoded to3Dworldgeometry. Sourcebitmaps/all343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'fullSourceNewConditionsAndSolutionsRead':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'wrongKeysRejected':3,'validUpdatedHashActualSolidChangesRecomputed':3,'updatedHashMalformedActualGeometryRejected':3,'nativeFigures':3,'visualQuestionsStillSeparate':[11,27],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
