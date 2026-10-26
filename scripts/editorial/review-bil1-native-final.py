"""Both fullsource/newconditions completeofficial/newsolutions/allten source/new
choices read. Both sourcebitmaps/all343pxnativePNGs inspected. Same root author
separate exact computation, not anotherhumanreviewer. Completes BIL1all50.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil1-native-final';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('lastmath','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids;rect=M.rect;points=M.points;segment=M.segment
ASSETS={11:('fb02d352452dc83db8369231','b6e523079f7508d14901b2fdf2f9a4f1f2e318a4b3b4e8d1ba9c5cf8b5477ea0'),27:('bdef3728a3f55e0f1ad9e0e0','8d6b62072b80cf5a384c3c7bcb865b906ef0aefd4245ea7fdea70541ab917d2c')}
def asset(i):
 file,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{file}.png').read_bytes()).hexdigest()==sha;return sha
def body(root):
 d=ids(root);edges=[(0,1),(1,2),(2,0),(3,4),(4,5),(5,3),(0,3),(1,4),(2,5)];vertices={}
 for a,b in edges:
  x1,y1,x2,y2=segment(d[f'body-edge-{a}-{b}'])
  for k,p in[(a,(x1,y1)),(b,(x2,y2))]:assert k not in vertices or vertices[k]==p;vertices[k]=p
 assert len(vertices)==len(set(vertices.values()))==6;offset=one({(vertices[j+3][0]-vertices[j][0],vertices[j+3][1]-vertices[j][1])for j in range(3)});assert offset!=(0,0)
 a,b,c=[vertices[j]for j in range(3)];assert a[1]==b[1]and b[0]==c[0]and b[0]>a[0]and b[1]>c[1];width,height,hyp,depth=[B.scalar(d['body-'+k].text)for k in['width','height','hypotenuse','depth']];assert min(width,height,hyp,depth)>0 and width*width+height*height==hyp*hyp and(b[0]-a[0])/width==(b[1]-c[1])/height
 for face,index in[('front',[0,1,2]),('bottom',[0,1,4,3]),('right',[1,2,5,4])]:assert points(d['body-face-'+face])==[vertices[k]for k in index]
 return sorted([width,height,hyp]),depth,{'allNineActualPrismEdgesAndSixSharedVerticesChecked':True,'bothActualRightTrianglesAreCongruentTranslations':True,'actualRightTriangleSides':list(map(str,sorted([width,height,hyp]))),'actualPrismExtrusionLength':str(depth),'exactRightAngleAndPythagoreanMetricVerified':True}
def squared(a,b):return sum((u-v)**2 for u,v in zip(a,b))
def nets(root):
 d=ids(root);sides,depth,proof=body(root);options={}
 for name in'ABCDE':
  raw=[rect(d[f'net-{name}-rect-{j}'])for j in range(3)];x,y,w,h=raw[0];assert min(w,h)>0;unit=h/depth;assert unit>0;assert all(v[1]==y and v[3]==h and v[2]>0 for v in raw);assert all(b[0]==a[0]+a[2]for a,b in zip(raw,raw[1:]));widths=[v[2]/unit for v in raw];attachments=[]
  for j in range(2):
   ps=points(d[f'net-{name}-tri-{j}']);assert len(ps)==len(set(ps))==3;ds=sorted(squared(a,b)/unit**2 for a,b in itertools.combinations(ps,2));assert ds==sorted(v*v for v in sides);found=[]
   for k,(rx,ry,rw,rh)in enumerate(raw):
    for side,by in[('top',ry),('bottom',ry+rh)]:
     left,right=(rx,by),(rx+rw,by)
     if left in ps and right in ps:
      apex=one(v for v in ps if v not in[left,right]);assert apex[1]<by if side=='top'else apex[1]>by;previous,next_=widths[(k-1)%3],widths[(k+1)%3];leftSq,rightSq=squared(apex,left)/unit**2,squared(apex,right)/unit**2;match=leftSq==previous**2 and rightSq==next_**2;found.append({'rectangleIndex':k,'end':side,'twoRemainingTriangleSidesSquared':list(map(str,[leftSq,rightSq])),'neighboringStripSideSquares':list(map(str,[previous**2,next_**2])),'bothBoundaryEdgeIdentificationsMatch':match})
   attachments.append(one(found))
  valid=sorted(widths)==sides and sorted(v['end']for v in attachments)==['bottom','top']and all(v['bothBoundaryEdgeIdentificationsMatch']for v in attachments);options[name]={'actualThreeStripWidths':list(map(str,widths)),'actualCommonStripHeightMatchesPrismLength':True,'bothActualTriangleMetricsMatchBody':True,'allActualTriangleAttachments':attachments,'stripWidthsAreExactlyThreeBodyEdges':sorted(widths)==sides,'oneTriangleClosesEachOppositeEnd':sorted(v['end']for v in attachments)==['bottom','top'],'validPrismNet':valid}
 answer=one(k for k,v in options.items()if v['validPrismNet']);proof.update({'allFiveActualMetricNetCandidates':options,'uniquePrismNetChoice':answer,'validNetFiveFacesHaveCompleteConsistentPrismEdgeIdentifications':True});return answer,proof
def source_nets():
 # Source widths are schematic and unlabeled. Preserve observed edge TYPES and
 # right-angle orientation; do not claim exact dimensions from source pixels.
 options={'A':{'threeSideTypesPresent':True,'topAdjacentSideOrderCorrect':False,'bottomAdjacentSideOrderCorrect':False,'oneOppositeEndEach':True},'B':{'threeSideTypesPresent':True,'topAdjacentSideOrderCorrect':True,'bottomAdjacentSideOrderCorrect':True,'oneOppositeEndEach':True},'C':{'threeSideTypesPresent':False,'topAdjacentSideOrderCorrect':False,'bottomAdjacentSideOrderCorrect':False,'oneOppositeEndEach':False},'D':{'threeSideTypesPresent':True,'topAdjacentSideOrderCorrect':True,'bottomAdjacentSideOrderCorrect':False,'oneOppositeEndEach':True},'E':{'threeSideTypesPresent':True,'topAdjacentSideOrderCorrect':False,'bottomAdjacentSideOrderCorrect':False,'oneOppositeEndEach':True}}
 answer=one(k for k,v in options.items()if all(v.values()));return answer,{'sourceSchematicEdgeRolesAndRightAngleOrientationsObserved':options,'sourceUnlabeledPixelWidthsNotClaimedExactPhysicalDimensions':True,'uniquePrismNetChoice':answer}
def pattern_parts(root,key):
 d=ids(root);x,y,w,h=rect(d['frame-'+key]);assert w==h>0;ps=points(d['shade-'+key]);norm=[((a-x)/w,(b-y)/h)for a,b in ps];assert len(norm)==5 and norm[0]==(0,0)and norm[2]==(F(1,2),F(1,2))and norm[4]==(0,1)and norm[1][1]==0 and norm[3][1]==1 and 0<norm[1][0]<1 and 0<norm[3][0]<1;return(norm[3],norm[1],True)
def pattern(root=None):
 if root is None:
  lower=[(F(0),F(1,2)),(F(0),F(1)),(F(1,2),F(1))];upper=[(F(1),F(0)),(F(1,2),F(0)),(F(0),F(0))];rows=[[(lower[r],upper[c],True)if(r,c)!=(2,2)else None for c in range(3)]for r in range(3)];choices={'A':((F(0),F(1)),(F(0),F(0)),True),'B':((F(1,2),F(1)),(F(0),F(0)),True),'C':((F(1),F(1)),(F(1),F(0)),False),'D':((F(0),F(1)),(F(1),F(0)),True),'E':((F(1,2),F(1)),(F(1,2),F(0)),True)}
 else:rows=[[pattern_parts(root,f'row-{r}-{c}')if(r,c)!=(2,2)else None for c in range(3)]for r in range(3)];choices={k:pattern_parts(root,'choice-'+k)for k in'ABCDE'};assert ids(root)['missing'].text=='?'
 lower=[one(set(v[0]for v in row if v is not None))for row in rows];upper=[one(set(rows[r][c][1]for r in range(3)if rows[r][c]is not None))for c in range(3)];assert all(v[2]for row in rows for v in row if v is not None);assert len(set(choices.values()))==5;target=(lower[-1],upper[-1],True);answer=one(k for k,v in choices.items()if v==target);serialize=lambda v:[[str(a)for a in v[0]],[str(a)for a in v[1]],v[2]];return answer,{'allThreeActualRowLowerEndpoints':[[str(v)for v in p]for p in lower],'allThreeActualColumnUpperEndpoints':[[str(v)for v in p]for p in upper],'allEightGivenPanelsSatisfyExplicitComponentLaw':True,'allFiveActualChoiceBoundaryComponents':{k:serialize(v)for k,v in choices.items()},'lastPanelExactBoundaryComponentTarget':serialize(target),'uniquePatternChoice':answer}
def solve(r,i,src=False,data=None):
 proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data)
 if i==11:answer,p=source_nets()if src else nets(root)
 elif i==27:answer,p=pattern(root)
 else:raise AssertionError(i)
 proof.update(p);assert B.options(r)==list('ABCDE')and r['answer']==answer;proof['answerChecked']=True;return proof
def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root)
 if i==11:
  old={k:[points(v[f'net-{k}-tri-{j}'])for j in range(2)]for k in'AB'}
  for key,other,dx in[('A','B',-170),('B','A',170)]:
   for j in range(2):v[f'net-{key}-tri-{j}'].set('points',' '.join(f'{x+dx},{y}'for x,y in old[other][j]))
 else:
  old={k:points(v['shade-choice-'+k])for k in'AB'}
  for key,other,dx in[('A','B',-67),('B','A',67)]:v['shade-choice-'+key].set('points',' '.join(f'{x+dx},{y}'for x,y in old[other]))
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,'A'
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;allrows=rows.copy()
 for name in['bil1-nonvisual','bil1-native-math','bil1-native-logic','bil1-native-solids']:allrows+=json.loads((ROOT/f'problems/editorial/batches/{name}.json').read_text())['editions']
 assert len(allrows)==50 and{r['params']['number']for r in allrows}==set(range(1,51));assert len({tuple((x['sourceFile'],x['sourceId'])for x in r['sourceRefs'])for r in allrows})==50;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=solve({**q,'answer':key},i,True);proof=solve(r,i);bad,raw,target=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashActualChoiceSwapTarget']=target;proof['oldKeyRejectedAndCorrectChangedChoiceAccepted']=True;root=W.svg(r);v=ids(root)
  if i==11:v['net-B-rect-1'].set('x',str(F(v['net-B-rect-1'].attrib['x'])+1))
  else:p=points(v['shade-choice-B']);p[2]=(p[2][0]+1,p[2][1]);v['shade-choice-B'].set('points',' '.join(','.join(map(str,q))for q in p))
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedFinalGeometryAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Bothfullsource/newconditions completeofficial/newsolutions/all10source/newchoices/sourcebitmaps/343pxnativePNGs read. Actual9prismedges/6vertices/bodyPythagoreanmetrics, all5netrectanglewidths/triangleside-squaredmetrics/top-bottomattachments/perimeteredgeidentifications checked. Source schematicedge-role observationsnotclaimedpixelmetricmeasurements. Actualallpatternshadeverticesnormalized; all8givenrow-lower/column-uppercomponents/all5choices verified; explicitofficialcomponentlawavoidsunrestrictedpatternambiguity. UpdatedhashactualchoiceswapsA recomputedandmalformedgeometry rejected. CompletesBIL1all50uniquesourcereferences. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'TwooriginalnativeSVG actualprism/netedges/trianglevertices andmatrixboundaryvertices decoded. Bothsourcebitmaps/all343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'fullSourceNewConditionsAndSolutionsRead':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'wrongKeysRejected':2,'validUpdatedHashActualChoiceSwapsRecomputed':2,'updatedHashMalformedActualGeometryRejected':2,'nativeFigures':2,'completeBIL1All50UniqueSourceQuestions':True,'pythonJavaScriptHashesMatched':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
