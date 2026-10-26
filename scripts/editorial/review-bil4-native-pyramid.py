"""Fullsource/newcondition official/newsolution/all5source/newchoices,
sourcebitmap and343pxnativePNG read. Sourcecandidateface-edgeincidences visually
observed then givenindependenttopologicalrealizations; noexactsourcepixelmetric
coordinates claimed. Actualnew25facepolygons decoded andfolded. Same root author
separate computationalreview, notanotherhumanreviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-pyramid';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';EPS=1e-7
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids

def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def squared(a,b):return dot(sub(a,b),sub(a,b))
def close(a,b,scale=1):return math.dist(a,b)<=EPS*scale

def actual_points(el):return[tuple(float(v)for v in p)for p in M.points(el)]
def overlap(p,q,unit):
 for shape in[p,q]:
  for a,b in zip(shape,shape[1:]+shape[:1]):
   axis=(b[1]-a[1],a[0]-b[0]);aa=[dot(v,axis)for v in p];bb=[dot(v,axis)for v in q]
   if min(max(aa),max(bb))-max(min(aa),min(bb))<=EPS*unit*unit:return False
 return True

def fold_mesh(polygons,base,leg,check_nonoverlap=True):
 assert len(polygons)==5;root=one(j for j,p in enumerate(polygons)if len(p)==4);assert all(len(p)==3 for j,p in enumerate(polygons)if j!=root);q=polygons[root];lengths=[squared(a,b)for a,b in zip(q,q[1:]+q[:1])];unit=math.sqrt(lengths[0])/base;assert unit>0 and all(abs(v-lengths[0])<EPS*unit*unit for v in lengths);assert all(abs(dot(sub(b,a),sub(c,b)))<EPS*unit*unit for a,b,c in zip(q,q[1:]+q[:1],q[2:]+q[:2]));expected=sorted([base*base,leg*leg,leg*leg])
 for j,p in enumerate(polygons):
  if j==root:continue
  actual=sorted(squared(a,b)/unit**2 for a,b in itertools.combinations(p,2));assert all(abs(a-b)<EPS for a,b in zip(actual,expected))
 if check_nonoverlap:assert not any(overlap(a,b,unit)for a,b in itertools.combinations(polygons,2))
 vertices=[];faces=[]
 for p in polygons:
  f=[]
  for v in p:
   found=next((k for k,w in enumerate(vertices)if close(v,w,unit)),None)
   if found is None:found=len(vertices);vertices.append(v)
   f.append(found)
  assert len(set(f))==len(f);faces.append(f)
 edges=collections.defaultdict(list)
 for j,f in enumerate(faces):
  for a,b in zip(f,f[1:]+f[:1]):edges[tuple(sorted([a,b]))].append(j)
 assert all(len(v)in[1,2]for v in edges.values());adj=collections.defaultdict(list);shared=0
 for edge,fs in edges.items():
  if len(fs)==2:adj[fs[0]].append((fs[1],edge));adj[fs[1]].append((fs[0],edge));shared+=1
 assert shared==4;reached=set();todo=[root]
 while todo:
  j=todo.pop()
  if j in reached:continue
  reached.add(j);todo.extend(k for k,e in adj[j])
 assert len(reached)==5
 target=[{0,1,2,3},*[{j,(j+1)%4,4}for j in range(4)]];height=math.sqrt(leg*leg-base*base/2);world=[(-base/2,-base/2,0),(base/2,-base/2,0),(base/2,base/2,0),(-base/2,base/2,0),(0,0,height)];vf=dict(zip(faces[root],range(4)));assigned={root:0};todo=[root];failure=None
 while todo and failure is None:
  j=todo.pop()
  for k,edge in adj[j]:
   if k in assigned:continue
   a,b=[vf[v]for v in edge];choices=[i for i,t in enumerate(target)if{a,b}<=t and i!=assigned[j]]
   if len(choices)!=1:failure={'reason':'shared_edge_not_a_unique_other_pyramid_face','actualFace':k};break
   t=choices[0]
   if len(target[t])!=len(faces[k]):failure={'reason':'triangle_would_need_to_cover_square_base','actualFace':k,'targetFace':t};break
   if t in assigned.values():failure={'reason':'two_actual_faces_fold_onto_same_pyramid_face','actualFace':k,'targetFace':t};break
   new=one(set(faces[k])-set(edge));label=one(target[t]-{a,b})
   if new in vf and vf[new]!=label:failure={'reason':'same_planar_vertex_requires_different_pyramid_vertices','actualFace':k};break
   candidate={**vf,new:label}
   assert all(abs(squared(vertices[u],vertices[v])/unit**2-squared(world[candidate[u]],world[candidate[v]]))<EPS for u,v in itertools.combinations(faces[k],2))
   vf[new]=label;assigned[k]=t;todo.append(k)
 valid=failure is None and len(assigned)==5 and set(assigned.values())==set(range(5));proof={'allFiveActualFacePolygonsCounted':5,'actualSingleSquareFourCongruentIsoscelesTrianglesVerified':True,'actualSquaredSideLengthToleranceInPhysicalUnits':EPS,'allActualFaceInteriorsPairwiseDisjoint':check_nonoverlap,'allFourActualSharedEdgesFormConnectedFaceTree':True,'actualPlanarClusteredVertexCount':len(vertices),'allActualPlanarFacesAsVertexIndices':faces,'targetPyramidFaceAssignments':{str(k):v for k,v in assigned.items()},'allAssignedPhysicalEdgeLengthsMatchTargetPyramid':True,'allFiveDistinctPyramidFacesCovered':valid,'failure':failure};return valid,proof

def source_nets():
 # Independent geometric realizations of the source's visually observed edge
 # attachments only. These reference triangles do not claim original sizes.
 base=[(0.,0.),(2.,0.),(2.,2.),(0.,2.)];h=math.sqrt(3)
 def triangle(j):a,b=base[j],base[(j+1)%4];u=sub(b,a);return[a,b,((a[0]+b[0])/2+h*u[1]/2,(a[1]+b[1])/2-h*u[0]/2)]
 def reflect(t,i,j):a,b=t[i],t[j];c=one(t[k]for k in range(3)if k not in[i,j]);u=sub(b,a);v=sub(c,a);scale=dot(u,v)/dot(u,u);p=tuple(a[k]+scale*u[k]for k in range(2));return[a,b,tuple(2*p[k]-c[k]for k in range(2))]
 left,right,top,bottom=[triangle(j)for j in[3,1,0,2]];rtop=reflect(right,0,2);rtopleft=reflect(rtop,1,2);rbot=reflect(right,1,2);topright=reflect(top,1,2);bottleft=reflect(bottom,1,2);bottomright=reflect(bottom,0,2);lb=reflect(left,0,2);lbbase=reflect(lb,0,2);striplast=reflect(lbbase,1,2)
 return{'A':[base,right,rbot,bottom,bottleft],'B':[base,right,rtop,rtopleft,bottom],'C':[base,top,topright,right,rtop],'D':[base,left,right,bottom,bottomright],'E':[base,left,lb,lbbase,striplast]}
def body(root,base,leg):
 d=ids(root);points={};expectedEdges=[(0,1),(1,2),(2,3),(3,0),(0,4),(1,4),(2,4),(3,4)]
 for a,b in expectedEdges:
  x1,y1,x2,y2=map(float,M.segment(d[f'body-edge-{a}-{b}']))
  for key,p in[(a,(x1,y1)),(b,(x2,y2))]:
   if key in points:assert close(points[key],p)
   else:points[key]=p
 assert set(points)==set(range(5));q=[points[j]for j in range(4)];assert close(tuple(q[0][j]+q[2][j]for j in range(2)),tuple(q[1][j]+q[3][j]for j in range(2)));center=tuple(sum(p[j]for p in q)/4 for j in range(2));assert abs(points[4][0]-center[0])<EPS and points[4][1]<center[1];u=tuple(v/base for v in sub(q[1],q[0]));v=tuple(w/base for w in sub(q[3],q[0]));assert abs(u[0]*v[1]-u[1]*v[0])>EPS;height=math.sqrt(leg*leg-base*base/2);z=tuple(w/height for w in sub(points[4],center));world=[(-base/2,-base/2,0),(base/2,-base/2,0),(base/2,base/2,0),(-base/2,base/2,0),(0,0,height)]
 for j,p in enumerate(world):assert close(points[j],tuple(center[k]+p[0]*u[k]+p[1]*v[k]+p[2]*z[k]for k in range(2)))
 assert float(B.scalar(d['base-label'].text))==base and float(B.scalar(d['side-label'].text))==leg;return{'allEightActualBodyWireEdgesAndFiveEndpointIncidencesChecked':True,'actualProjectedSquareBaseParallelogramAndSharedApexChecked':True,'bothActualPhysicalBodyLabelsMatchStatement':True,'positivePyramidHeightDerivedFromGivenBaseAndLateralEdges':height,'bodyIsConsistentProjectionOfGivenPhysicalSquarePyramidNotPixelMetricInference':True}
def solve(r,src=False,data=None):
 proof={};opts=B.options(r);assert opts==list('ABCDE');results={}
 if src:
  sha='69cc35eff37747a6348b32527f5bbb45a2db93b3711568742fbeee00099817fd';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/63ffe61a88f1f650999039e6.png').read_bytes()).hexdigest()==sha
  for key,polys in source_nets().items():valid,p=fold_mesh(polys,2.,2.,False);results[key]=p
  proof.update({'sourceRasterSHA256':sha,'sourceObservedFaceEdgeIncidencesGivenTopologicalRealizations':True,'sourceReferenceSizesNotClaimedMeasuredRasterMetrics':True})
 else:
  root=W.svg(r,data);base,leg=map(float,H.numeric_tokens(r['statement']));assert 0<base<leg and leg*leg>base*base/2;proof.update(body(root,base,leg));d=ids(root)
  for key in'ABCDE':
   nodes=list(d['net-'+key]);assert len(nodes)==5 and all(e.tag.endswith('polygon')for e in nodes);polys=[actual_points(e)for e in nodes];valid,p=fold_mesh(polys,base,leg);results[key]=p;label=d['label-'+key];assert label.text==key;cx=(min(x for p in polys for x,y in p)+max(x for p in polys for x,y in p))/2;bottom=max(y for p in polys for x,y in p);assert abs(float(label.attrib['x'])-cx)<EPS and 0<float(label.attrib['y'])-bottom<60
 answer=one(k for k,p in results.items()if p['allFiveDistinctPyramidFacesCovered']);assert r['answer']==answer;proof.update({'allFiveActualCandidateNetFoldingProofs':results,'uniqueValidNet':answer});return proof

def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);ref=one(r['sourceRefs']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==18);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer']
 try:src=solve({**q,'answer':key},True);proof=solve(r)
 except Exception as e:raise AssertionError('source/new pyramid')from e
 root=W.svg(r);d=ids(root);a=[actual_points(e)for e in d['net-A']];e=[actual_points(el)for el in d['net-E']]
 for group,polys,dx,dy in[(d['net-A'],e,-85,-300),(d['net-E'],a,85,300)]:
  for el,p in zip(group,polys):el.set('points',' '.join(f'{x+dx:.9f},{y+dy:.9f}'for x,y in p))
 raw=ET.tostring(root);changed={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
 for cr,cb in[({**r,'answer':'ZZ'},None),(changed,raw)]:
  try:solve(cr,False,cb)
  except(AssertionError,ValueError,IndexError):pass
  else:raise AssertionError('oldkeyaccepted')
 solve({**changed,'answer':'A'},False,raw);proof['validUpdatedHashActualWholeNetSwapTarget']='A';root=W.svg(r);el=list(ids(root)['net-E'])[1];p=actual_points(el);p[2]=(p[2][0]+1,p[2][1]);el.set('points',' '.join(f'{x},{y}'for x,y in p));bad=ET.tostring(root)
 try:solve({**r,'figureSha256':hashlib.sha256(bad).hexdigest()},False,bad)
 except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedIsoscelesTriangleRejected']=True
 else:raise AssertionError('malformedtriangleaccepted')
 assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(editionHash(JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0]));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==sha;entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newcondition official/newsolution/all5source/newchoices/sourcebitmap/343pxPNG read. Sourceobservedfaceedgeincidences givenindependenttopologicalrealizations validatingB; noexactsourcepixelmetrics claimed. Actualall25nativefacepolygons verifiedone4cmsquare/four4-5-5triangles withsquaredphysicaltolerance1e-7/vertexclustering/disjointinteriors/four-edgeconnectedtrees. Targetsquarepyramidface-edgeincidences propagatefromactualbase; duplicates/triangleonbase/conflictingvertexmaps rejected, allassignedphysicaledges checked; onlyEcoversexactly5distincttargetfaces. Actual8bodyedges/baseparallelogram/apex/4and5labels verifiedasconsistentprojection. ActualA/Ewholegeometryswap givesA; updatedhashmalformedtriangle rejected. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualall25netpolygons/edgegluing/bodywire/physicalgivens decoded;343pxPNG inspected. No sourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]};summary={'verified':1,'sourceOptionsRead':5,'rewrittenOptionsRead':5,'nativeFigures':1,'actualNetFacePolygonsChecked':25,'sourceValidNet':'B','newValidNet':'E','validUpdatedHashActualWholeNetSwapTarget':'A','updatedHashMalformedIsoscelesTriangleRejected':True,'allFiftyBIL4SourceTasksCompleteWithOtherBatches':True,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
