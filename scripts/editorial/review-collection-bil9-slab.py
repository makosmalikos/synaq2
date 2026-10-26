"""One frozen BIL9 visual occurrence. Full saved condition, full official solution,
all5 MCQs and archived source raster viewed. A new native343px SVG was visually
inspected. Same root wrote author and this exact geometry/ratio check; no separate
human/agent reviewer claimed. Geometry read from actual coordinates, not metadata.
"""
import copy,hashlib,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-bil9-slab';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def ratio(s):
 values=[F(x)for x in re.findall(r'\d+',s)];assert len(values)==3 and all(x>0 for x in values);return tuple(x/values[-1]for x in values)
def geometry(r,raw=None):
 n=int(re.search(r'бірдей (\d+) блокқа',r['statement'])[1]);assert n>=2
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'};assert root.attrib['viewBox']=='0 0 600 240'
 def project(origin,xyz):
  x,y,z=map(F,xyz);return(F(origin[0])+15*x+10*y,F(origin[1])-8*y-18*z)
 polys={e.attrib['id']:[tuple(map(F,p.split(',')))for p in e.attrib['points'].split()]for e in root.findall('.//s:polygon',ns)};expected={};cube=(50,174);strip=(260,174)
 def face(name,origin,vertices):expected[name]=[project(origin,p)for p in vertices]
 for j in range(n):
  face(f'cube-front-{j}',cube,[(0,0,j),(n,0,j),(n,0,j+1),(0,0,j+1)])
  face(f'cube-right-{j}',cube,[(n,0,j),(n,n,j),(n,n,j+1),(n,0,j+1)])
  x=j*n
  face(f'slab-front-{j}',strip,[(x,0,0),(x+n,0,0),(x+n,0,1),(x,0,1)])
  face(f'slab-top-{j}',strip,[(x,0,1),(x+n,0,1),(x+n,n,1),(x,n,1)])
 face('cube-top',cube,[(0,0,n),(n,0,n),(n,n,n),(0,n,n)])
 face('strip-right',strip,[(n*n,0,0),(n*n,n,0),(n*n,n,1),(n*n,0,1)])
 assert polys==expected,'Actual face corners/layer count/projection changed'
 lines={e.attrib['id']:[tuple(map(F,p.split(',')))for p in e.attrib['points'].split()]for e in root.findall('.//s:polyline',ns)}
 corners={'P':project(strip,(0,0,0)),'Q':project(strip,(n*n,0,0)),'R':project(strip,(n*n,n,0)),'S':project(strip,(n*n,n,1))}
 assert lines=={a+b:[corners[a],corners[b]]for a,b in[('P','Q'),('Q','R'),('R','S')]}
 labels={e.text:(F(e.attrib['x']),F(e.attrib['y']))for e in root.findall('.//s:text',ns)};assert set(labels)==set(corners)
 for k,(x,y)in labels.items():
  px,py=corners[k];assert abs(x-px)<=16 and abs(y-py)<=26
 assert not re.search(rb'<image|<script|<foreignObject|href=|onload=|data:',raw)
 # World dimensions, not projected Euclidean screen lengths. Slabs are joined
 # without rotation; full length n*a, depth a, thickness a/n. Volume conserved.
 L,D,H=F(n*n),F(n),F(1);assert L*D*H==n**3
 return {'layers':n,'allProjectedFaces':len(polys),'allProjectedVertices':4*len(polys),'labelledWorldEdgeLengths':[str(L),str(D),str(H)],'projectedLabelCorners':{k:list(map(str,v))for k,v in corners.items()},'universalRatio':[n*n,n,1],'volumeBefore':n**3,'volumeAfter':int(L*D*H),'sha256':hashlib.sha256(raw).hexdigest()}
def solve(r):
 g=geometry(r);wanted=tuple(F(k)for k in g['universalRatio']);matches=[o for o in r['options']if ratio(o)==wanted];assert len(matches)==1 and r['answer']==matches[0]
 assert len(r['options'])==len(set(r['options']))==5
 return g

def main():
 r=json.loads((ROOT/BATCH).read_text())['editions'][0];assert r['grade']==6 and r['minimumPlan']=='pro';ref=r['sourceRefs'][0];assert ref['sourceId']=='4'
 src=json.loads((ROOT/ref['sourceFile']).read_text())['questions'][3];assert src['number']==4 and len(src['images'])==1 and len(src['options'])==5 and src['solution'];assert'үш блокқа'in src['statement']
 # The saved raster visibly has3 horizontal slices,3 unrotated joined blocks,
 # AB total front length, BC depth, CD thickness. Solve for arbitrary a>0.
 sourceRatio=(F(3*3),F(3),F(1));matches=[o for o in src['options']if ratio(o['text'])==sourceRatio];assert len(matches)==1 and matches[0]['correct']and matches[0]['text']==src['sourceAnswer']
 raster=ROOT/'problems/sources/zerek/images/ce839a6c4e63a812c79ebfdc.png';assert hashlib.sha256(raster.read_bytes()).hexdigest()=='5cb50d50555d637629fca0a0ca40b62261f6d0717476b777d135cc4f8a199171'
 proof=solve(r);raw=(ROOT/('frontend/public'+r['image'])).read_bytes();canaries=0
 for o in r['options']:
  if o==r['answer']:continue
  bad=copy.deepcopy(r);bad['answer']=o
  try:solve(bad)
  except AssertionError:canaries+=1
  else:raise AssertionError('wrong MCQ key accepted')
 bad=copy.deepcopy(r);bad['statement']=bad['statement'].replace('бірдей 4 блокқа','бірдей 5 блокқа')
 try:solve(bad)
 except AssertionError:pass
 else:raise AssertionError('changed layer count accepted')
 assert b'500,174 540,142'in raw
 try:geometry(r,raw.replace(b'500,174 540,142',b'500,174 541,142'))
 except AssertionError:pass
 else:raise AssertionError('changed real projected corner accepted')
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const r=JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0];console.log(JSON.stringify({sha256:editionHash(r),nativeFraction:mathFragments(r.solution).some(n=>n.type==='fraction')}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert check['sha256']==digest(r)and check['nativeFraction']
 summary={'verified':1,'originalFigures':1,'fullSourceAndNewConditionSolutionFiveChoicesRead':True,'all4WrongMCQKeysRejected':canaries==4,'changedPrintedLayerCountRejected':True,'changedActualFigureCornerRejected':True,'allProjectedFaces':proof['allProjectedFaces'],'allProjectedVertices':proof['allProjectedVertices'],'separateHumanReviewer':False}
 entry={'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full saved raster/source/new text, all5MCQ; exact all18face72corner 3D affine projection, layer adjacency, labelled edges, universal ratio, volume, all4wrong keys and input/geometry mutation rejection; same author, no separate human review','notes':[json.dumps(proof)],'figureReview':{'status':'verified','sha256':proof['sha256'],'method':'Actual polygons/labelled polylines compared with exact world-coordinate projection of4slabs; source raster read, new343px native preview visually inspected; no copied/traced source image.'}}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':proof,'entries':[entry]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
