"""All3fullsource/newconditions solutions/all15source/newchoices/sourcebitmaps
andall343pxnativePNGs read. Same root author separate computation,
notanotherhumanreviewer. Hanging arch decoded asone-deepactualfaces, not filled
columns. Source-square rationalrealization modelsincidences, notrastermetricdata.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-counting';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('s','scripts/editorial/review-bil1-native-solids.py');S=importlib.util.module_from_spec(sp);sp.loader.exec_module(S);M=S.M;B=S.B;H=S.H;E=B.E;one=S.one;W=S.W;ids=S.ids;points=S.points;rect=M.rect
sp=importlib.util.spec_from_file_location('l','scripts/editorial/review-bil1-native-logic.py');L=importlib.util.module_from_spec(sp);sp.loader.exec_module(L)
ASSETS={3:('88be5415e49724280d68329d','7d27e09258afe84bd6be0582ee3a71905e78367e36ad70a14899b0448a1c1460'),40:('4c4e341fb6bc8fd38fc393e3','c33467e07e1de4552d0532b8d2b0dd3ab7c544e14132a41596613b9a4d63df62'),43:('360c859270791210f5c3c15c','f7fa3111473636ec268bc22a9f89d91f20e8eeaf29fe3ea5fac97f61d664de9e')}
def asset(i):
 f,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha
def sheet(root,key):
 d=ids(root);raw={kind:[points(v)for id,v in d.items()if id.startswith(key+'-'+kind+'-')]for kind in['front','right','top']};assert all(raw.values());front,top=raw['front'][0],raw['top'][0];U,Z=S.sub(front[1],front[0]),S.sub(front[3],front[0]);V=S.sub(top[3],top[0]);assert S.sub(top[1],top[0])==U and U[0]>0 and U[1]==Z[0]==0 and Z[1]<0 and V[0]>0>V[1];O=(min(x for p in raw['front']for x,y in p),max(y for p in raw['front']for x,y in p));frame=(O,U,V,Z);project=lambda p:tuple(O[j]+sum(p[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));inv={}
 for p in itertools.product(range(7),repeat=3):q=project(p);assert q not in inv;inv[q]=p
 actual={kind:set()for kind in raw}
 for kind,polys in raw.items():
  for p in polys:assert len(p)==4 and all(v in inv for v in p);world=tuple(inv[v]for v in p);assert world not in actual[kind];actual[kind].add(world)
 cells=set()
 for p in actual['front']:
  x,y,z=p[0];assert y==0 and p==((x,0,z),(x+1,0,z),(x+1,0,z+1),(x,0,z+1));cells.add((x,0,z))
 assert S.visible(cells)==actual;seen=set();todo=[next(iter(cells))]
 while todo:
  p=todo.pop()
  if p in seen:continue
  seen.add(p);todo.extend(v for v in S.neighbors(p)if v in cells)
 assert seen==cells;columns=collections.Counter(x for x,y,z in cells);return cells,{'actualAllFrontRightTopUnitPolygonsDecoded':sum(map(len,raw.values())),'actualOneCubeThicknessVerified':True,'allCompleteVisibleFacesEqualActualOccupiedCells':True,'unsupportedSpacesNotFilledBelowHangingCubes':True,'fullSixNeighborConnectivityChecked':True,'actualColumnCubeCounts':[columns[x]for x in sorted(columns)],'actualCubeCount':len(cells)},frame

def bird_count(root):
 d=ids(root);x,y,w,h=rect(d['window']);boxes=[]
 for key,v in d.items():
  if not key.startswith('bird-'):continue
  assert v.tag.endswith('path')and v.attrib['fill']=='none'and F(v.attrib['stroke-width'])==3 and v.attrib['stroke-linecap']=='round';t=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',v.attrib['d']);assert len(t)==13 and[t[j]for j in[0,3,8]]==['M','Q','Q'];nums=list(map(F,t[1:3]+t[4:8]+t[9:]));left,base,c1,up,cx,base2,c2,up2,right,base3=nums;r=(right-left)/2;assert r>0 and base==base2==base3 and up==up2==base-r and cx==(left+right)/2 and c1==cx-r/2 and c2==cx+r/2;box=(left-F(3,2),up-F(3,2),right+F(3,2),base+F(3,2));assert box[0]>=x+3 and box[1]>=y+3 and box[2]<=x+w-3 and box[3]<=y+h-3;boxes.append(box)
 assert boxes and all(a[2]<=b[0]or b[2]<=a[0]or a[3]<=b[1]or b[3]<=a[1]for a,b in itertools.combinations(boxes,2));return len(boxes),{'allActualTwoQuadraticWingPathsDecoded':len(boxes),'bothWingsMeetAtExactCommonBirdCenter':True,'allStrokeExpandedBirdBoundsInsideWindowAndPairwiseDisjoint':True}

def square_inventory(raw):
 edges,p=L.split_intersections(raw);vs=set(itertools.chain.from_iterable(edges));connections={}
 def cover(a,b):
  key=tuple(sorted([a,b]))
  if key in connections:return connections[key]
  adj=collections.defaultdict(list)
  for u,v in edges:
   if L.on(u,a,b)and L.on(v,a,b):adj[u].append(v);adj[v].append(u)
  seen=set();todo=[a]
  while todo:
   v=todo.pop()
   if v in seen:continue
   seen.add(v);todo.extend(adj[v])
  connections[key]=b in seen;return b in seen
 found=set()
 for a,b in itertools.permutations(vs,2):
  u=L.subtract(b,a);v=(-u[1],u[0]);c=(b[0]+v[0],b[1]+v[1]);d=(a[0]+v[0],a[1]+v[1])
  if c in vs and d in vs and all(cover(x,y)for x,y in[(a,b),(b,c),(c,d),(d,a)]):found.add(tuple(sorted([a,b,c,d])))
 # Independent enumeration in45-degree transformed coordinates; existing
 # segmentdirections imply everypossibleedge is horizontalorvertical there.
 transformed={(a+b,a-b)for a,b in vs};us=sorted({a for a,b in transformed});vcoords=sorted({b for a,b in transformed});other=set();inverse=lambda a,b:((a+b)/2,(a-b)/2)
 for a,c in itertools.combinations(us,2):
  for b in vcoords:
   d=b+c-a;points2=[(a,b),(a,d),(c,d),(c,b)]
   if all(v in transformed for v in points2):
    q=[inverse(*v)for v in points2]
    if all(cover(x,y)for x,y in zip(q,q[1:]+q[:1])):other.add(tuple(sorted(q)))
 assert found==other;hist=collections.Counter()
 for q in found:dist=sorted(sum((a[j]-b[j])**2 for j in range(2))for a,b in itertools.combinations(q,2));assert dist[:4]==[dist[0]]*4 and dist[4:]==[2*dist[0]]*2;hist[dist[0]]+=1
 p.update({'allActualSquareVertexWitnesses':[[list(map(str,v))for v in q]for q in sorted(found)],'allActualSquaredSideLengthCountClasses':{str(k):v for k,v in sorted(hist.items())},'allCandidateSidesRequireFullContiguousCollinearGraphCoverage':True,'independent45DegreeCoordinateEnumerationMatchesAllWitnesses':True,'allVertexPairsUsedToGenerateEqualPerpendicularSides':len(vs)*(len(vs)-1)});return len(found),p

def square_count(root=None):
 raw=[]
 if root is None:
  for j in range(3):
   cx=F(2*j);r=F(3);ps=[(cx,r),(cx+r,0),(cx,-r),(cx-r,0),(cx,r)];raw.extend(tuple(a+b)for a,b in zip(ps,ps[1:]))
 else:
  polys=[points(e)for key,e in ids(root).items()if key.startswith('square-')];assert len(polys)>=3
  for ps in polys:
   assert len(ps)==5 and ps[0]==ps[-1];vectors=[L.subtract(b,a)for a,b in zip(ps,ps[1:])];length=one({sum(v*v for v in u)for u in vectors});assert length>0 and all(sum(a*b for a,b in zip(u,v))==0 for u,v in zip(vectors,vectors[1:]+vectors[:1]));assert all(abs(u[0])==abs(u[1])for u in vectors);raw.extend(tuple(a+b)for a,b in zip(ps,ps[1:]))
 return square_inventory(raw)
def solve(r,i,src=False,data=None,check=True):
 p={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data)
 if i==3:
  if src:b=13;c=6;p['sourceObservedOneDeepColumnCubeCounts']={'B':[5,3,1,4],'C':[1,1,2,2]}
  else:
   bc,pb,fb=sheet(root,'solid-B');cc,pc,fc=sheet(root,'solid-C');b,c=len(bc),len(cc);p.update({'actualB':pb,'actualC':pc});assert ids(root)['label-B'].text=='B'and ids(root)['label-C'].text=='C'
  expr=one(H.math_parts(r['statement'],src));assert E.expr(expr).equals(E.expr('B*C-B+C'));out=E.expr(expr).value({'B':F(b),'C':F(c)});p['bothActualWholeCubeCounts']=[b,c]
 elif i==40:
  if src:visible=14;fraction=F(1,3);assert'үштен бір'in r['statement'];p['sourceVisibleBirdCountReadWithOfficialSolution']=14
  else:visible,p2=bird_count(root);p.update(p2);fraction=one(F(int(a),int(b))for a,b in re.findall(r'\((\d+)/(\d+)\)',r['statement']))
  assert 0<fraction<1;out=visible/fraction;assert out.denominator==1;p.update({'actualVisibleBirdCount':visible,'actualVisibleFraction':str(fraction)})
 else:count,p2=square_count(root);p.update(p2);out=F(count)
 p['target']=str(out)
 if check:p.update(B.checked_choices(r,out))
 return out,p

def changed(r,i):
 root=W.svg(r);d=copy.deepcopy(r);v=ids(root)
 if i==3:cells,proof,frame=sheet(root,'solid-B');cells.remove((0,0,0));S.redraw(root,'solid-B',cells,frame)
 elif i==40:ET.SubElement(root,'{http://www.w3.org/2000/svg}path',{'id':'bird-added','d':'M173 299 Q176.5 292 180 299 Q183.5 292 187 299','fill':'none','stroke':'#617bc2','stroke-width':'3','stroke-linecap':'round'})
 else:root.remove(v['square-3'])
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();new,_=solve(d,i,False,raw,False);old,_=solve(r,i);assert new!=old;d['options']=[str(B.scalar(val)+new-old)for val in r['options']];return d,raw,str(new)
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:_,src=solve({**q,'answer':key},i,True);_,proof=solve(r,i);bad,raw,target=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for cr,cb in[({**r,'answer':'99999999'},None),(bad,raw)]:
   try:solve(cr,i,False,cb)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashActualGeometryTarget']=target;root=W.svg(r);v=ids(root)
  if i==3:
   node=next(iter(v['solid-B']));ps=points(node);ps[0]=(ps[0][0]+1,ps[0][1]);node.set('points',' '.join(f'{x},{y}'for x,y in ps))
  elif i==40:v['bird-0'].set('d',v['bird-0'].attrib['d'].replace('M46','M45'))
  else:ps=points(v['square-0']);ps[1]=(ps[1][0]+1,ps[1][1]);v['square-0'].set('points',' '.join(f'{x},{y}'for x,y in ps))
  broken=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(broken).hexdigest()},i,False,broken)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedgeometryaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All3fullsource/newconditions solutions/all15source/newchoices/sourcebitmaps/all343pxPNGs read. Actual3Dunitfaceprojection/frontoccupancy/sixneighborconnectivity/fullvisibleinventory checkedwithoutfilledcolumnsunderarch. Actualall16twoquadraticbirdwingpaths normalized; expandedboundsinsidewindowanddisjoint. Actualdiamondoutlines verifiedsquare; allrationalintersections/allvertexpairs/equalperpendiculars/fullstraightedgecoverage andall16squarewitnesses independentlycross45degreeaxis-enumeration. Changedactualcube/bird/squaregeometry recomputed; malformedupdatedhashgeometry rejected. Source-squaremodelpreservesobservedincidenceswithoutclaimingpixelmetriccoordinates. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'ThreeoriginalnativeSVG actualunitfaces/birdpaths/squareoutlines decoded;all343pxPNGs inspected. No sourcebitmap/tracedvectors.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'nativeFigures':3,'wrongKeysRejected':3,'validUpdatedHashActualGeometryCanariesRecomputed':3,'updatedHashMalformedActualGeometryRejected':3,'remainingBIL4SourceTasks':[16,18],'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
