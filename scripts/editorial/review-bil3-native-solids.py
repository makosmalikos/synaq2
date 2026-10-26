"""Bothfullsource/newconditions completeofficial/newsolutions/all10source/new
choices andbothsourcebitmaps/all343pxPNGs inspected. Same root author separate
computation, not anotherhumanreviewer. Actualunitfacepolygons decoded.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil3-native-solids';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('s','scripts/editorial/review-bil1-native-solids.py');S=importlib.util.module_from_spec(sp);sp.loader.exec_module(S);M=S.M;B=S.B;H=S.H;one=S.one;W=S.W;ids=S.ids;points=S.points
ASSETS={7:('85ed908c8467946bb81b6456','d79eebb111497cccdef5258aeec44f60c5100e3651f30c3b719fb7902c10cceb'),23:('d97aad7d9cf864d78e63853d','3605b10809a1ad1a500b867b46821fe2cdf43b54526c659dd57295cb603eeba6')}
def asset(i):
 f,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha
def cells(width,depth,split,low,high):return{(x,y,z)for x in range(width)for y in range(depth)for z in range(low if y<split else high)}
def single_paint(cells):
 hist=collections.Counter(sum(n not in cells for n in S.neighbors(v))for v in cells);surface,proof=S.surfaces(cells);assert sum(k*v for k,v in hist.items())==surface;return F(hist[1],len(cells)),{**proof,'allSixNeighborExposedFaceCountHistogram':{str(k):v for k,v in sorted(hist.items())},'allSinglePaintedCubeCoordinates':[list(v)for v in sorted(cells)if sum(n not in cells for n in S.neighbors(v))==1],'exactSingleFaceCubeCount':hist[1],'paintedSurfaceIncludesBottom':True}
def solve(r,i,src=False,data=None,check=True):
 n=H.numeric_tokens(r['statement']);proof={};root=None if src else W.svg(r,data)
 if src:proof['sourceRasterSHA256']=asset(i)
 else:occupied,p,frame=S.actual_voxels(root,'solid');proof.update(p)
 if i==7:
  if src:width,depth,totalH,thick,low=4,3,5,1,2;out=F(width*(thick*totalH+(depth-thick)*low));proof['sourceObservedContinuousSolidDimensions']=[width,depth,totalH,thick,low];assert out==width*depth*totalH-width*(depth-thick)*(totalH-low)
  else:
   unit=one(n);assert unit>0 and one(H.numeric_tokens(ids(root)['unit-label'].text))==unit;out=len(occupied)*unit**3;heights=collections.Counter(h for x,y,h in proof['allActualTopHeights']);assert len(heights)==2;cross=sum(h*count for h,count in heights.items())*unit**3;assert cross==out;proof.update({'actualPhysicalUnitCubeEdge':str(unit),'allLayerHeightColumnCounts':dict(heights),'volumeFromAllCellsEqualsHeightProfileSum':True})
 else:
  if src:occupied=cells(4,4,2,1,3);assert H.numeric_tokens(r['statement'])==[32,32];assert len(occupied)==32;proof['sourceObservedFullHeightProfile']=[[y,1 if y<2 else 3]for y in range(4)]
  else:assert one(n)==len(occupied)
  out,p=single_paint(occupied);proof.update(p)
  vals=list(map(B.scalar,B.options(r)));assert vals[:4]==[out*F(4,3),out*F(2,3),out,out*2]or not check;proof['firstTwoAndFourthKnownRelativeCountDistractorsChecked']=True
 proof['target']=str(out)
 if check:proof.update(B.checked_choices(r,out))
 return out,proof

def changed(r,i):
 root=W.svg(r);occupied,p,frame=S.actual_voxels(root,'solid');width=max(x for x,y,z in occupied)+1;newcells={(x,y,z)for x,y,z in occupied if x<width-1};S.redraw(root,'solid',newcells,frame);raw=ET.tostring(root);d={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
 if i==23:d['statement']=d['statement'].replace('50 бірдей','40 бірдей')
 new,_=solve(d,i,False,raw,False);old,_=solve(r,i)
 if i==7:d['options']=[str(B.scalar(o)+new-old)for o in r['options']]
 else:d['options']=[str(new*F(4,3)),str(new*F(2,3)),str(new),str(new*2),'(5/16)']
 return d,raw,str(new)
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);_,src=solve({**q,'answer':key},i,True);_,proof=solve(r,i);bad,raw,target=changed(r,i)
  for cr,cb in[({**r,'answer':'99999'},None),(bad,raw)]:
   try:solve(cr,i,False,cb)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashChangedWidthGeometryTarget']=target;proof['oldKeyRejectedAndCorrectChangedGeometryAccepted']=True;root=W.svg(r);node=next(iter(ids(root)['solid']));p=points(node);p[0]=(p[0][0]+1,p[0][1]);node.set('points',' '.join(f'{x},{y}'for x,y in p));rawbad=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(rawbad).hexdigest()},i,False,rawbad)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedUnitPolygonRejected']=True
  else:raise AssertionError(('malformedgeometryaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Bothfullsource/newconditions solutions/all10source/newchoices/sourcebitmaps/all343pxPNGs read. Actualunitfront/right/topfacepolygons decoded withprojectionbasis inferredfromactualfront/topfaces andinjective343vertexlattice; fullvisibleinventory verifiesno-gapcolumnsolid. Actualallcellvolume crossheightprofile andall6neighborsincludingbottom paint histogram cross6Nminus2contacts computed. Truechangedwidth geometry canary recomputed; malformedfacevertex rejectedwithupdatedhash. Same root author notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'TwooriginalnativeSVG allunitpolygonsdecoded. All343pxPNGs inspected. No sourcebitmap/tracedvectors.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'nativeFigures':2,'wrongKeysRejected':2,'validUpdatedHashChangedWidthGeometryRecomputed':2,'updatedHashMalformedUnitPolygonsRejected':2,'allPaintedBottomSurfacesIncluded':True,'sourceBitmapsReused':0,'pythonJavaScriptHashesMatched':2,'remainingBIL3VisualTasks':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
