"""Bothfull source/newvisualconditions and complete official/newsolutions read.
Botharchivedsourcebitmaps andboth343pxactualnewSVGpreviews inspected. Same
root author separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2025-district-visual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('visual4','scripts/editorial/review-femo6-spring-grade4-visual.py');V=importlib.util.module_from_spec(sp);sp.loader.exec_module(V);P=V.P;H=P.H;one=H.one;exact=P.exact

def source_asset(i):
 name,sha={6:('d2089a1c6aaf0e381c0564ec','091b9f1331f5afa6d8a303e6a2b0ac7a3ecce70c2f008b7f6920fade6fffc5d7'),18:('b414c7475139136d03d376ea','12712f119e61ac62c31d0009011a152df1e8076bece81983911098b3f226bc79')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{name}.png').read_bytes()).hexdigest()==sha;return sha

def squares(edges,cols,rows):
 allSquares=[]
 for side in range(1,min(cols,rows)+1):
  for x in range(cols-side+1):
   for y in range(rows-side+1):
    boundary={tuple(sorted(((x+j,y),(x+j+1,y))))for j in range(side)}|{tuple(sorted(((x+j,y+side),(x+j+1,y+side))))for j in range(side)}|{tuple(sorted(((x,y+j),(x,y+j+1))))for j in range(side)}|{tuple(sorted(((x+side,y+j),(x+side,y+j+1))))for j in range(side)}
    if boundary<=edges:allSquares.append([x,y,side])
 assert allSquares;largest=max(v[2]for v in allSquares);return largest,{'allAxisLineBoundedSquaresEnumerated':len(allSquares),'allLargestGridSquares':[v for v in allSquares if v[2]==largest],'largestSideInActualGridUnits':largest}

def packing(boxes,whole):
 assert len(whole)==3 and all(v>0 for v in whole);shapes=[];volume=F(0)
 for x,y,z,a,b,c in boxes:
  assert min(a,b,c)>0 and all(0<=u and u+v<=w for u,v,w in zip([x,y,z],[a,b,c],whole));shapes.append(tuple(sorted([a,b,c])));volume+=a*b*c
 assert len(set(shapes))==1
 for A,B in itertools.combinations(boxes,2):assert any(max(A[j],B[j])>=min(A[j]+A[j+3],B[j]+B[j+3])for j in range(3)),'Overlappingboxinteriors'
 assert volume==math.prod(whole);return volume,{'allCongruentBrickDimensions':list(map(str,one(set(shapes)))),'wholeSolidDimensions':list(map(str,whole)),'allPhysicalBoxCoordinatesAndSizes':[[str(v)for v in box]for box in boxes],'allBoxesInsideSolid':True,'allPairwiseBoxInteriorsDisjoint':True,'sumCongruentBrickVolumesEqualsWholeSolidVolume':True,'volumeCubicCentimetersTarget':str(volume)}

def projections(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rect=lambda v:tuple(F(v.attrib[k])for k in['x','y','width','height']);front=rect(ids['front-whole']);top=rect(ids['top-whole']);upper=rect(ids['front-upper']);lowers=sorted(rect(v)for id,v in ids.items()if id.startswith('front-lower-'));tops=sorted((rect(v)for id,v in ids.items()if id.startswith('top-upper-')),key=lambda v:v[1]);assert len(lowers)==4 and len(tops)==2;fx,fy,fw,fh=front;tx,ty,tw,td=top;ux,uy,uw,uh=upper;assert(ux,uy,uw)==(fx,fy,fw)and uh>0;assert fw==tw;lowerH=one({v[3]for v in lowers});assert lowerH+uh==fh
 for j,(x,y,w,h)in enumerate(lowers):assert y==fy+uh and h==lowerH and x==fx+sum(v[2]for v in lowers[:j]);assert w>0
 assert sum(v[2]for v in lowers)==fw and len({v[2]for v in lowers})==1
 for j,(x,y,w,h)in enumerate(tops):assert x==tx and w==tw and y==ty+sum(v[3]for v in tops[:j]);assert h>0
 assert sum(v[3]for v in tops)==td and len({v[3]for v in tops})==1
 count,physicalEdge=map(int,H.numeric_tokens(r['statement']));assert count==len(lowers)+len(tops);line=ids['dimension-segment'];x1,y1,x2,y2=[F(line.attrib[k])for k in['x1','y1','x2','y2']];assert y1==y2 and x1==lowers[0][0]and x2==x1+lowers[0][2];assert one(H.numeric_tokens(ids['small-edge'].text))==physicalEdge and F(ids['small-edge'].attrib['x'])==(x1+x2)/2;scale=(x2-x1)/physicalEdge;assert scale>0 and'бір масштабпен'in r['statement'];boxes=[];depth=td/scale;bottomHeight=lowerH/scale
 for x,y,w,h in lowers:boxes.append(((x-fx)/scale,F(0),F(0),w/scale,depth,h/scale))
 for x,y,w,h in tops:boxes.append(((x-tx)/scale,(y-ty)/scale,bottomHeight,w/scale,h/scale,uh/scale))
 volume,proof=packing(boxes,[fw/scale,td/scale,fh/scale]);assert ids['front-title'].text=='Алдыңғы көрініс'and ids['top-title'].text=='Үстінен көрініс';proof.update({'allActualFrontLowerAndTopUpperProjectionCounts':[len(lowers),len(tops)],'allActualProjectionRectanglesAndDimensionBracketRead':True,'actualPhysicalSmallEdge':str(physicalEdge),'commonPixelsPerCentimeter':str(scale),'bothViewsExplicitlyAtSameScale':True,'congruenceAndWhole3DPackingDerivedFromActualTwoViews':True});return volume,proof

def solve(r,i,src=False,data=None):
 n=H.numeric_tokens(r['statement'])
 if i==6:
  perimeter=one(n);assert perimeter>0
  if src:cols,rows=5,3;edges=V.grid_edges(cols,rows);proof={'sourceRasterSHA256':source_asset(6),'observedFullSource5Columns3RowsUnitGrid':True}
  else:
   root=P.W.svg(r,data);cols,rows,edges,point,proof=V.decode_segments(root,'grid-');label=one(v for v in root.iter()if v.attrib.get('id')=='outer-perimeter');assert one(H.numeric_tokens(label.text))==perimeter
  sideUnits,p=squares(edges,cols,rows);unit=perimeter/(2*(cols+rows));out=4*sideUnits*unit;proof.update(p);proof.update({'actualGridColumnsRows':[cols,rows],'actualOuterPerimeter':str(perimeter),'oneGridCellPhysicalSide':str(unit),'maximumSquarePhysicalSide':str(sideUnits*unit),'maximumSquarePerimeterTarget':str(out)})
 elif i==18:
  if src:
   number=H.numeric_tokens(re.sub(r'см\$\^3\$','см',r['statement']));assert number==[8];short=F(3);length=5*short;middle=length/3;boxes=[(j*short,F(0),F(0),short,length,middle)for j in range(5)]+[(F(0),j*middle,middle,length,middle,short)for j in range(3)];out,proof=packing(boxes,[length,length,middle+short]);proof.update({'sourceRasterSHA256':source_asset(18),'observedSourceBottom5Top3BricksAndLabeledShortEdge3':True})
  else:out,proof=projections(r,data)
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2 and{r['params']['number']for r in rows}=={6,18};core=json.loads((ROOT/'problems/editorial/batches/altynsaka-2025-district-core.json').read_text())['editions'];assert len(core)==18 and len({r['params']['number']for r in rows+core})==20;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['images']and q['solution'];answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  try:solve({**r,'answer':'999999999'},i)
  except AssertionError:pass
  else:raise AssertionError('wrongkeyaccepted')
  root=P.W.svg(r)
  if i==6:one(v for v in root.iter()if v.attrib.get('id')=='outer-perimeter').text='P = 120 см';statement=r['statement'].replace('100 см','120 см');expected='96'
  else:one(v for v in root.iter()if v.attrib.get('id')=='small-edge').text='6 см';statement=r['statement'].replace('4 см','6 см');expected='10368'
  raw=ET.tostring(root);bad={**r,'statement':statement,'figureSha256':hashlib.sha256(raw).hexdigest()}
  try:solve(bad,i,False,raw)
  except AssertionError:pass
  else:raise AssertionError('oldkeyacceptedforvalidphysicalinput')
  cp=solve({**bad,'answer':expected},i,False,raw);proof['validChangedPhysicalLabelTarget']=expected;proof['updatedHashChangedNativeLabelsRecomputed']=True
  root=P.W.svg(r)
  if i==6:
   for v in list(root):
    if re.fullmatch(r'grid-h-\d+-5',v.attrib.get('id',''))or re.fullmatch(r'grid-v-6-\d+',v.attrib.get('id','')):root.remove(v)
   raw=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
   try:solve(bad,i,False,raw)
   except AssertionError:pass
   else:raise AssertionError('oldKeyAcceptedForActuallyChangedGrid')
   cp=solve({**bad,'answer':'(800/9)'},i,False,raw);assert cp['actualGridColumnsRows']==[5,4];proof['validActualGridChangedColumnsTarget']='800/9'
  else:
   one(v for v in root.iter()if v.attrib.get('id')=='top-upper-0').set('height','120');raw=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
   try:solve(bad,i,False,raw)
   except AssertionError:proof['updatedHashProjectionGapRejected']=True
   else:raise AssertionError('gappedProjectionAccepted')
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('options')and r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Bothfullsource/newvisualconditions and fullsolutions/sourcebitmaps/343pxnativepreviews read. Allactualunitgridsegments read, everylineboundedaxisgridsquare enumerated, physicalperimeterrecomputed. Allactualfront/toprectangles anddimensionbracket/labels read; exactphysical3Dboxcoordinates/dimensionsderived, all6brickscongruent, insidewhole, pairwiseinteriorsdisjoint andvolumesfillfullsolid checked. Validupdatedhashlabelchanges96/10368 andactualgridcolumnschange800/9 verified; gappedprojectionrejecteddespitematchingupdatedSHA. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'BothoriginalnativeSVGs and343pxPNGs inspected. Actualgeometry andlabelsindependentlydecoded. Explicitcommonprojectionscale/physicaledge, completegridandpackingconstraints verified. No originalbitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':2,'fullSourceNewConditionsAndSolutionsRead':2,'capturedOpenKeys':2,'wrongKeysRejected':2,'updatedHashPhysicalLabelsChangedAndRecomputed':2,'validActualGridGeometryChangeRecomputed':True,'updatedHashInvalidProjectionGapRejected':True,'nativeFigures':2,'completeCollectionWithCore18':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
