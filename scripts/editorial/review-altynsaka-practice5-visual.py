"""Allthree full frozen/newvisualconditions, completeofficial/newsolutions and
allnine source/newoptions read; three sourcebitmaps andactual343pxnativePNGs
inspected. Same root author separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-practice5-visual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('visualgrid','scripts/editorial/review-femo6-spring-grade4-visual.py');V=importlib.util.module_from_spec(sp);sp.loader.exec_module(V);P=V.P;H=P.H;one=H.one;exact=P.exact
def asset(i):
 f,sha={4:('9badcf7c7c7b6bda8d7c0790','47991ea3de01e4d28a80e091893643fdba7e64c30afe6e870c26a8c4acabcd27'),8:('16b2bc5af464e10e43763d87','ea2f2a35ef614e6592e3d43e48f2292c3c72fe766dd836763e34efb35cd5532f'),15:('406c33da401072071f2fa5ee','49bcabb27e17fe5ee8a099ad3cffa1727a7a2502874704d9b9e626ee0421e288')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def balances(root):
 ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};counts=[]
 for row in range(2):
  beam=ids[f'beam-{row}'];bx1,by1,bx2,by2=[F(beam.attrib[k])for k in['x1','y1','x2','y2']];assert by1==by2 and bx1<bx2;pair=[];panYs=[];panCenters=[]
  for side in['left','right']:
   pan=ids[f'pan-{row}-{side}'];px1,py1,px2,py2=[F(pan.attrib[k])for k in['x1','y1','x2','y2']];assert py1==py2 and px1<px2 and by1<py1;panYs.append(py1);panCenters.append((px1+px2)/2);actual={'circle':0,'square':0,'triangle':0};boxes=[]
   for id,v in ids.items():
    if not id.startswith(f'weight-{row}-{side}-'):continue
    tag=v.tag.split('}')[-1]
    if tag=='circle':
     x,y,r=[F(v.attrib[k])for k in['cx','cy','r']];assert r==12;box=(x-r,y-r,2*r,2*r);kind='circle'
    elif tag=='rect':
     x,y,w,h=[F(v.attrib[k])for k in['x','y','width','height']];assert w==h==24;box=(x,y,w,h);kind='square'
    elif tag=='polygon':
     points=[tuple(F(z)for z in p.split(','))for p in v.attrib['points'].split()];assert len(points)==len(set(points))==3;top=one(p for p in points if p[1]==min(y for x,y in points));base=sorted(p for p in points if p!=top);assert base[0][1]==base[1][1]and base[1][0]-base[0][0]==26 and base[0][1]-top[1]==25 and 2*top[0]==base[0][0]+base[1][0];box=(base[0][0],top[1],F(26),F(25));kind='triangle'
    else:raise AssertionError(('unexpectedactualweightgeometry',tag))
    x,y,w,h=box;assert px1<=x and x+w<=px2 and 0<=py1-y-h<=2;boxes.append(box);actual[kind]+=1
   assert boxes and all(not V.overlap(a,b)for a,b in itertools.combinations(boxes,2));assert bx1<px1+9<px2-9<bx2;pair.append(actual)
  assert panYs[0]==panYs[1]and sum(panCenters)==bx1+bx2;counts.append(pair)
 # A triangle is the mass unit. Solve both actual balance equations exactly.
 coeff=[]
 for left,right in counts:coeff.append((F(left['circle']-right['circle']),F(left['square']-right['square']),F(right['triangle']-left['triangle'])))
 (a,b,c),(d,e,f)=coeff;det=a*e-b*d;assert det;circle=(c*e-b*f)/det;square=(a*f-c*d)/det;assert circle>0 and square>0 and all(a*circle+b*square==c for a,b,c in coeff)
 return square,{'actualAllFourPanShapeCounts':counts,'allShapeTagsAndVerticesClassifiedNotAnswerIds':True,'allIdenticalShapesCongruentAndOnLevelPansWithoutOverlap':True,'actualCircleAndSquareMassInTriangleUnits':list(map(str,[circle,square])),'bothExactBalanceEquationsVerified':True}

def dominoes(cols,rows,edges):
 cells=[(x,y)for y in range(rows)for x in range(cols)];assert all({tuple(sorted([a,b]))for a,b in[((x,y),(x+1,y)),((x,y+1),(x+1,y+1)),((x,y),(x,y+1)),((x+1,y),(x+1,y+1))]}<=edges for x,y in cells);pairs=[(a,b)for a,b in itertools.combinations(cells,2)if abs(a[0]-b[0])+abs(a[1]-b[1])==1];horizontal=[p for p in pairs if p[0][1]==p[1][1]];vertical=[p for p in pairs if p[0][0]==p[1][0]];assert len(horizontal)==rows*(cols-1)and len(vertical)==cols*(rows-1);return F(len(pairs)),{'allActualCells':len(cells),'allUnorderedCellPairsChecked':math.comb(len(cells),2),'horizontalDominoes':len(horizontal),'verticalDominoes':len(vertical),'allAdjacentCellPairsEqualIndependentOrientationCount':True,'dominoCountTarget':str(len(pairs))}

def avoiding(edges,A,B,D):
 through,p=V.paths(edges,A,B,D);total=p['allMonotoneAtoCPathsEnumerated'];out=F(total)-through;vertices={p for e in edges for p in e};dp={A:1}
 for v in sorted(vertices,key=lambda p:(sum(p),p)):
  if v==A:continue
  dp[v]=0 if v==B else sum(dp.get(u,0)for u in[(v[0]-1,v[1]),(v[0],v[1]-1)]if tuple(sorted([u,v]))in edges)
 assert out==dp[D];p.update({'allMonotonePathsMinusForbiddenVertexEqualsIndependentBlockedVertexDP':True,'routesAvoidingRedPointTarget':str(out)});return out,p

def solve(r,i,src=False,data=None):
 s=r['statement'];values=None
 if i==4:
  if src:count=4;square=F(3);proof={'sourceRasterSHA256':asset(i),'observedSourceTwoSquaresEqualThreeCirclesOneCircleEqualsTwoTriangles':True,'actualCircleAndSquareMassInTriangleUnits':['2','3']}
  else:count=int(one(H.numeric_tokens(s)));square,proof=balances(P.W.svg(r,data))
  out=count*square;values=list(map(lambda v:H.scalar(H.tex(v['text']if isinstance(v,dict)else v)),r['options']));assert values==[out,out/2,out*2/3,out-2];proof.update({'askedSquareCount':count,'allFourCorrectHalfTwoThirdsMinusTwoOptionRolesPreserved':True,'triangleWeightTarget':str(out)})
 elif i==8:
  if src:cols,rows=4,3;edges=V.grid_edges(cols,rows);proof={'sourceRasterSHA256':asset(i),'observedSourceThreeByFourCellGrid':True}
  else:cols,rows,edges,point,proof=V.decode_segments(P.W.svg(r,data),'grid-')
  out,p=dominoes(cols,rows,edges);proof.update(p);values=list(map(lambda v:H.scalar(H.tex(v['text']if isinstance(v,dict)else v)),r['options']));assert values==[cols*rows,2*(cols+rows),2*rows*(cols-1),out,2*cols*rows];proof['allFiveOriginalCellPerimeterDoubleHorizontalCorrectDoubleCellRolesPreserved']=True
 elif i==15:
  if src:cols,rows=4,3;edges=V.grid_edges(cols,rows);A,B,D=(0,0),(2,1),(4,3);proof={'sourceRasterSHA256':asset(i),'observedSourceFourByThreeCellGridRedVertexTwoOne':True}
  else:
   root=P.W.svg(r,data);cols,rows,edges,point,proof=V.decode_segments(root,'grid-');ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};markers={}
   for name in['A','blocked','D']:
    v=ids['marker-'+name];x,y=F(v.attrib['cx']),F(v.attrib['cy']);markers[name]=point(x,y);assert F(v.attrib['r'])==6
    if name=='blocked':assert v.attrib['fill']=='#ef6671'
    else:label=ids['label-'+name];assert label.text==name and(F(label.attrib['x'])-x)**2+(F(label.attrib['y'])-y)**2<35**2
   A,B,D=[markers[k]for k in['A','blocked','D']];assert A==(0,0)and D==(cols,rows)and 0<B[0]<cols and 0<B[1]<rows
  out,p=avoiding(edges,A,B,D);proof.update(p)
 else:raise AssertionError(i)
 assert H.scalar(H.tex(r['answer']))==out,(i,src,r['answer'],proof)
 if values is not None:assert len(values)==len(set(values))and values.count(out)==1;proof['allActualOptionValues']=list(map(str,values))
 proof['answerChecked']=True;return proof

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;core=json.loads((ROOT/'problems/editorial/batches/altynsaka-practice5-core.json').read_text())['editions'];assert len(core)==17 and{r['params']['number']for r in rows+core}==set(range(1,21));entries=[];evidence=[];ns='{http://www.w3.org/2000/svg}';equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']
  if q['options']:answer=one(v['text']for v in q['options']if v['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer'])
  else:answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip()
  src=solve({**q,'answer':answer},i,True);proof=solve(r,i);root=P.W.svg(r);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};bad=copy.deepcopy(r)
  if i==4:
   old=ids['weight-0-left-0'];old.set('cx','77');extra=copy.deepcopy(old);extra.set('id','weight-0-left-extra');extra.set('cx','105');root.append(extra);expected='9';bad['options']=['9','4.5','6','7']
  elif i==8:
   for y in range(5):ET.SubElement(root,ns+'line',{'id':f'grid-extra-h-{y}','x1':'280','y1':str(60+40*y),'x2':'320','y2':str(60+40*y),'stroke':'#8fa6cf','stroke-width':'2'})
   for y in range(4):ET.SubElement(root,ns+'line',{'id':f'grid-extra-v-{y}','x1':'320','y1':str(60+40*y),'x2':'320','y2':str(100+40*y),'stroke':'#8fa6cf','stroke-width':'2'})
   expected='38';bad['options']=['24','20','40','38','48']
  else:ids['marker-blocked'].set('cx','120');expected='40'
  raw=ET.tostring(root);bad['figureSha256']=hashlib.sha256(raw).hexdigest()
  for changed,rawData in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changed,i,False,rawData)
   except AssertionError:pass
   else:raise AssertionError(('wrongOrOldKeyAccepted',i))
  cp=solve({**bad,'answer':expected},i,False,raw);proof['validUpdatedHashActualGeometryTarget']=expected;proof['oldKeyRejectedAndCorrectChangedGeometryAnswerAccepted']=True
  # Actual missing unit edges / tilted beams / off-vertex forbidden markers fail even with updated hashes.
  root=P.W.svg(r)
  if i==4:one(v for v in root.iter()if v.attrib.get('id')=='beam-0').set('y2','97')
  elif i==8:root.remove(one(v for v in root.iter()if v.attrib.get('id')=='grid-h-0-0'))
  else:one(v for v in root.iter()if v.attrib.get('id')=='marker-blocked').set('cx','161')
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except AssertionError:proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedGeometryAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and len(r.get('options',[]))==len(q['options']);assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullthreefrozen/newvisualconditions completeofficial/newsolutions all9source/newMCQoptions/sourcebitmaps/343pxnativePNGs read. Actualallshapegeometries andlevelpans decoded intoexactbalanceequations; actualfullgridsegments decoded thenallunorderedcellpairscrossorientationcount; actualright-upunitgraph/fullpathenumeration/forbiddenmarkercrossblockedvertexDP checked. Actualupdatedhashvalidgeometrytargets9/38/40 recomputed, allmalformedtilt/missingedge/offvertex rejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualshapes/levelpanplacements/unitgridsegments/markers decoded. All343pxnewPNGs inspected; no sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'fullSourceNewConditionsAndSolutionsRead':3,'sourceOptionsRead':9,'rewrittenOptionsRead':9,'capturedOpenKeys':1,'capturedMCQKeys':2,'wrongKeysRejected':3,'validUpdatedHashActualGeometryChangesRecomputed':3,'updatedHashMalformedGeometriesRejected':3,'nativeFigures':3,'completeCollectionWithCore17':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
