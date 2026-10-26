"""Fullfrozen question7/officialsolution/original4cube raster and full rewritten
condition/solution/native3DPNG343px read. Same root author separate exact math,
no separatehumanreviewer. Actual75polygon projection coordinates and6affine
circle transforms decoded to worldvoxel rows. Fullcube cells, all6ray unions and
all63nonempty subset intersections checked. Changedvalid center evenwithupdated
hash changes answer99to98 and oldkey rejected. No sourcebitmap/trace reused.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo1-winter-grade4-drilled-cube';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one

def plus(a,b):return tuple(x+y for x,y in zip(a,b))
def minus(a,b):return tuple(x-y for x,y in zip(a,b))
def times(k,a):return tuple(k*x for x in a)
def points(s):return[tuple(map(F,p.split(',')))for p in s.split()]

def actual_holes(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',data.decode());svg=ET.fromstring(data);assert svg.attrib['viewBox']=='0 0 360 350';allElements=list(svg.iter());ids={v.attrib['id']:v for v in allElements if'id'in v.attrib};assert len(ids)==sum('id'in v.attrib for v in allElements);faceCells={};faceFrames={};sizes=[]
 for face in['front','top','right']:
  cells={}
  for id,e in ids.items():
   m=re.fullmatch('cell-'+face+r'-(\d+)-(\d+)',id)
   if m:cells[int(m[1]),int(m[2])]=points(e.attrib['points'])
  size=max(max(k)for k in cells)+1;assert set(cells)==set(itertools.product(range(size),repeat=2));p00,p10,p11,p01=cells[0,0];u,v=minus(p10,p00),minus(p01,p00);assert p11==plus(plus(p00,u),v);assert u[0]*v[1]-u[1]*v[0]!=0
  for(c,rr),ps in cells.items():assert ps==[plus(plus(p00,times(c+dc,u)),times(rr+dr,v))for dc,dr in[(0,0),(1,0),(1,1),(0,1)]]
  assert all(0<x<360 and 0<y<350 for ps in cells.values()for x,y in ps);faceCells[face]=cells;faceFrames[face]=(p00,u,v);sizes.append(size)
 size=one(set(sizes));O,Ux,Uz=faceFrames['front'];topO,topUx,Uy=faceFrames['top'];rightO,rightUy,rightUz=faceFrames['right'];assert topUx==Ux and rightUy==Uy and rightUz==Uz and topO==plus(O,times(size,Uz))and rightO==plus(O,times(size,Ux));assert sum(len(v)for v in faceCells.values())==3*size*size;holes=[];decoded=[]
 for face in['front','top','right']:
  origin,u,v=faceFrames[face];circles=[(id,e)for id,e in ids.items()if id.startswith('hole-'+face+'-')];assert len(circles)==2;positions=set()
  for id,e in circles:
   assert e.tag.endswith('circle')and F(e.attrib['cx'])==F(e.attrib['cy'])==0;radius=F(e.attrib['r']);assert 0<radius<F(1,2);a,b,c,d,tx,ty=map(F,one(re.findall(r'matrix\(([^)]+)\)',e.attrib['transform'])).split());assert(a,b)==u and(c,d)==v;dx,dy=tx-origin[0],ty-origin[1];det=a*d-b*c;localU=(d*dx-c*dy)/det;localV=(-b*dx+a*dy)/det;assert localU%1==localV%1==F(1,2);col,row=math.floor(localU),math.floor(localV);assert 0<=col<size and 0<=row<size and(col,row)not in positions;positions.add((col,row))
   if face=='front':axis=1;fixed={0:col,2:row}
   elif face=='top':axis=2;fixed={0:col,1:row}
   else:axis=0;fixed={1:col,2:row}
   holes.append((axis,fixed));decoded.append({'nativeHoleID':id,'visibleFace':face,'decodedFaceCell':[col,row],'axis':axis,'fixedWorldCoordinates':fixed,'radiusInCellUnits':str(radius)})
 assert len(holes)==6;return size,holes,{'actualProjectedUnitFacePolygonsChecked':3*size*size,'actualCommon3DProjectionFrame':{'origin':list(map(str,O)),'xAxis':list(map(str,Ux)),'depthAxis':list(map(str,Uy)),'upAxis':list(map(str,Uz))},'allFaceGridCellsShareSameWorldCube':True,'allSixHoleAffineCentersDecoded':decoded,'allHolesCenteredWithinOneCubeRowDiameterLessThanOneCell':True}

def voxel_union(size,holes):
 assert len(holes)==6;sets=[];incidences=collections.Counter()
 for axis,fixed in holes:
  assert set(fixed)==set(range(3))-{axis};line=set()
  for along in range(size):
   cell=tuple(along if j==axis else fixed[j]for j in range(3));assert all(0<=x<size for x in cell);line.add(cell);incidences[cell]+=1
  assert len(line)==size;sets.append(line)
 totals={};ie=0;subsetCount=0
 for count in range(1,7):
  subtotal=0
  for group in itertools.combinations(sets,count):subtotal+=len(set.intersection(*group));subsetCount+=1
  totals[count]=subtotal;ie+=subtotal*((-1)**(count+1))
 union=set.union(*sets);assert union==set(incidences)and ie==len(union);untouched=[cell for cell in itertools.product(range(size),repeat=3)if cell not in union];histogram=collections.Counter(incidences.values());assert sum(k*v for k,v in histogram.items())==6*size and sum(histogram.values())==len(union);out=F(len(untouched));assert out==size**3-len(union);return out,{'allOriginalCubeCellsEnumerated':size**3,'sixRowRayIncidences':6*size,'allDamagedVoxelCoordinates':sorted(union),'voxelCountsByNumberOfCrossingHoles':dict(histogram),'allTripleIntersectionVoxels':sorted(cell for cell,n in incidences.items()if n==3),'all63RaySubsetIntersectionsChecked':subsetCount,'intersectionSizeTotalsBySubsetCardinality':totals,'inclusionExclusionMatchesDirectUnion':True,'damagedCount':len(union),'allUndamagedVoxelCoordinates':untouched,'undamagedCountTarget':str(out),'overcountRemoved':6*size-len(union)}

def solve(r,src=False,figureBytes=None):
 n=H.numeric_tokens(r['statement']);size=int(n[0]);assert n[:3]==[size]*3
 if src:
  assert n[3:]==[6];sha='94ca2f0725c7e9ce7609bc958ec4c35728926f0cec106284bc0ea3c405bb0f93';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/de0b17d11d5d4d5c46f5b284.png').read_bytes()).hexdigest()==sha
  # Cellcenters read from the three visible source faces, zero-based worldaxes.
  observations={'front-xz':[(2,2),(1,1)],'top-xy':[(2,1),(1,2)],'right-yz':[(1,2),(2,1)]};holes=[(1,{0:x,2:z})for x,z in observations['front-xz']]+[(2,{0:x,1:y})for x,y in observations['top-xy']]+[(0,{1:y,2:z})for y,z in observations['right-yz']];proof={'sourceRasterInspectedSHA256':sha,'sourceObservedZeroBasedFaceCellCenters':observations,'sourceSmallHoleCentersInsideSingleRows':True}
 else:
  assert'алты өтпелі тесіктің'in r['statement']and'диаметрі кішкентай текшенің қырынан кіші'in r['statement'];decodedSize,holes,proof=actual_holes(r,figureBytes);assert decodedSize==size
 out,counts=voxel_union(size,holes);proof.update(counts);assert E.calc(r['answer'])==out,(src,out,r['answer']);proof['answerChecked']=True;return proof

def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if str(q['number'])==ref['sourceId']);assert q['sourceAnswer']is None and q['solution']and len(q['images'])==1 and not q['options'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();src=solve({**q,'answer':answer},True);proof=solve(r)
 assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not r.get('options')and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
 try:solve({**r,'answer':'100'})
 except AssertionError:pass
 else:raise AssertionError('wrongkey accepted')
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'};circle=svg.find("s:circle[@id='hole-front-0']",ns);matrix=list(map(F,one(re.findall(r'matrix\(([^)]+)\)',circle.attrib['transform'])).split()));matrix[4]+=matrix[0]+matrix[2];matrix[5]+=matrix[1]+matrix[3];circle.set('transform','matrix('+' '.join(str(v)for v in matrix)+')');changed=ET.tostring(svg);bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(changed).hexdigest()
 try:solve(bad,False,changed)
 except AssertionError:pass
 else:raise AssertionError('actualchangedvalidhole center retained wrongoldkey')
 bad['answer']='98';changedProof=solve(bad,False,changed);assert changedProof['damagedCount']==27 and changedProof['undamagedCountTarget']=='98';proof['validActualChangedHoleWithUpdatedHashRejectedOldKey']=True;proof['changedHoleMathematicalTarget']='98'
 equalities=0
 for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
  sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
  if len(sides)<2 or not all(sides):continue
  try:values=[E.calc(v)for v in sides]
  except(AssertionError,ValueError,SyntaxError):continue
  assert len(set(values))==1,('printedsolutionequality',match[0]);equalities+=len(sides)-1
 rowHash=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0];console.log(editionHash(r));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==rowHash
 entry={'editionId':r['editionId'],'sha256':rowHash,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Allactual75polygons commonaffine3Dframes and all6holematrices decoded toworldcellrows; fullvoxelunion andall63subsetintersections independentlychecked. Originalraster and343pxnativePNG inspected. Validfront-hole move2coordinates evenwithupdatedhash changes99to98.'},'notes':[json.dumps(proof,ensure_ascii=False)]}
 summary={'verified':1,'fullSourceNewConditionsAndSolutionsRead':1,'sourceKeysNotCaptured':1,'wrongKeysRejected':1,'updatedHashActualGeometryCanariesRejected':1,'nativeFigures':1,'nativeFacePolygons':75,'nativeHoleMarkers':6,'allOriginalAndNewVoxelCountsEnumerated':64+125,'allRaySubsetIntersectionsSourceAndNew':126,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof,'validChangedFigureProof':changedProof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
