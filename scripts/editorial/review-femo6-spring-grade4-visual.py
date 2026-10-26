"""All4full frozen/newconditions and full official/newsolutions/4source rasters
read; all4native343pxPNGs inspected. Same root author separate exact mathematical
review, not a separatehumanreviewer. Completes earlier nonvisualcore11.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo6-spring-grade4-visual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('tour5','scripts/editorial/review-femo3-tour3-grade5.py');T=importlib.util.module_from_spec(sp);sp.loader.exec_module(T);P=T.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def asset(i):
 f,sha={8:('b5f03850e43ae7c79e081852','d4e5e55f85a8075fc990fb942d944747751da14dfb1fbb7617bda01fb6a902e3'),9:('29f0194ab16363e9d5914690','4a6a2aa9cee8c6d3f282c06b62c9965180372282990ab505deb4018ecde2d4e2'),10:('fbf67d7b5c7403ef153085d0','b9531c6a4b85e80e01f364e358edf326e64d599c3aaaf3b832a9ac4c54216f66'),12:('2a46cb6c845ffdb935728133','dc8eff7b95960706b459724305f3c3296ba3fce026cec6a8811ce5bf03576239')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def count_squares(points):
 assert len(points)==len(set(points));valid=set()
 for group in itertools.combinations(points,4):
  ds=sorted((a[0]-b[0])**2+(a[1]-b[1])**2 for a,b in itertools.combinations(group,2))
  if ds[0]>0 and ds[:4]==[ds[0]]*4 and ds[4:]==[2*ds[0]]*2:valid.add(frozenset(group))
 pointset=set(points);vectors=set()
 for a,b in itertools.combinations(points,2):
  dx,dy=b[0]-a[0],b[1]-a[1]
  for rx,ry in[(-dy,dx),(dy,-dx)]:
   c,d=(a[0]+rx,a[1]+ry),(b[0]+rx,b[1]+ry)
   if c in pointset and d in pointset:vectors.add(frozenset([a,b,c,d]))
 assert vectors==valid;axis=[p for p in valid if len({x for x,y in p})==len({y for x,y in p})==2];tilted=valid-set(axis);xs=sorted({x for x,y in points});ys=sorted({y for x,y in points});unit=one({b-a for a,b in zip(xs,xs[1:])}|{b-a for a,b in zip(ys,ys[1:])});assert pointset==set(itertools.product(xs,ys));byWidth=collections.Counter(str((max(x for x,y in p)-min(x for x,y in p))/unit)for p in tilted);return F(len(valid)),{'allUnorderedPointQuadruplesChecked':math.comb(len(points),4),'all90DegreeRotatedEdgeCandidatesAlsoChecked':True,'sixExactDistancesAndRotatedEdgeConstructionAgree':True,'actualPointGridColumnsRows':[len(xs),len(ys)],'axisAlignedSquares':len(axis),'tiltedSquares':len(tilted),'tiltedByBoundingGridWidth':dict(sorted(byWidth.items())),'allSquareCountTarget':str(len(valid))}

def grid_edges(cols,rows):return{tuple(sorted(((c,r),(c+1,r))))for r in range(rows+1)for c in range(cols)}|{tuple(sorted(((c,r),(c,r+1))))for c in range(cols+1)for r in range(rows)}
def decode_segments(root,prefix):
 raw=[tuple(F(v.attrib[k])for k in['x1','y1','x2','y2'])for v in root.iter()if v.attrib.get('id','').startswith(prefix)];assert raw;assert all((x1==x2)!=(y1==y2)for x1,y1,x2,y2 in raw);unit=one({abs(x2-x1)+abs(y2-y1)for x1,y1,x2,y2 in raw});assert unit>0;left=min(x for x1,y1,x2,y2 in raw for x in[x1,x2]);top=min(y for x1,y1,x2,y2 in raw for y in[y1,y2]);right=max(x for x1,y1,x2,y2 in raw for x in[x1,x2]);bottom=max(y for x1,y1,x2,y2 in raw for y in[y1,y2]);cols,rows=(right-left)/unit,(bottom-top)/unit;assert cols.denominator==rows.denominator==1;cols,rows=int(cols),int(rows);edges=set()
 def point(x,y):
  c,r=(x-left)/unit,(bottom-y)/unit;assert c.denominator==r.denominator==1;return int(c),int(r)
 for x1,y1,x2,y2 in raw:edge=tuple(sorted([point(x1,y1),point(x2,y2)]));assert edge not in edges;edges.add(edge)
 assert edges==grid_edges(cols,rows);return cols,rows,edges,point,{'allActualUnitSegmentsChecked':len(raw),'completeUnitRectangularGridVerified':True,'unitPixels':str(unit),'actualColumnsRows':[cols,rows]}

def paths(edges,A,B,C):
 assert A[0]<=B[0]<=C[0]and A[1]<=B[1]<=C[1];adj=collections.defaultdict(list)
 for a,b in edges:
  assert abs(a[0]-b[0])+abs(a[1]-b[1])==1
  low,high=sorted([a,b],key=lambda p:p[0]+p[1]);assert high[0]>=low[0]and high[1]>=low[1];adj[low].append(high)
 def allpaths(start,end):
  if start==end:return[(start,)]
  return[(start,)+tail for step in adj[start]if step[0]<=end[0]and step[1]<=end[1]for tail in allpaths(step,end)]
 full=allpaths(A,C);through=[p for p in full if B in p];first=allpaths(A,B);second=allpaths(B,C);assert len(through)==len(first)*len(second);assert len(full)==len(set(full));assert len(first)==math.comb(sum(B)-sum(A),B[0]-A[0])and len(second)==math.comb(sum(C)-sum(B),C[0]-B[0]);return F(len(through)),{'actualA_B_C':[list(A),list(B),list(C)],'allMonotoneAtoCPathsEnumerated':len(full),'AtoBCount':len(first),'BtoCCount':len(second),'throughBDirectEnumerationEqualsSegmentProduct':True,'onlyActualRightUpEdgesUsed':True,'throughBPathCountTarget':str(len(through))}

def native_paths(r,data=None):
 root=P.W.svg(r,data);cols,rows,edges,point,proof=decode_segments(root,'grid-');ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};markers={}
 for name in['A','B','C']:
  marker,label=ids['marker-'+name],ids['label-'+name];x,y=F(marker.attrib['cx']),F(marker.attrib['cy']);markers[name]=point(x,y);assert markers[name]in{p for e in edges for p in e};assert label.text==name;assert(F(label.attrib['x'])-x)**2+(F(label.attrib['y'])-y)**2<35**2
 out,p=paths(edges,markers['A'],markers['B'],markers['C']);proof.update(p);return out,proof

def overlap(a,b):return max(a[0],b[0])<min(a[0]+a[2],b[0]+b[2])and max(a[1],b[1])<min(a[1]+a[3],b[1]+b[3])
def native_staircase(r,sides,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rect=lambda v:tuple(F(v.attrib[k])for k in['x','y','width','height']);whole=rect(ids['whole']);x0,y0,bw,bh=whole;assert bw==bh>0;whites=[rect(v)for id,v in ids.items()if id.startswith('white-')];blues=[rect(v)for id,v in ids.items()if id.startswith('shade-')and v.attrib['fill']=='#cadffa'];assert len(whites)==4 and blues;scales=[];readSides=[]
 for id,v in ids.items():
  if id.startswith('side-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);a,b,w,h=one(q for q in whites if q[0]<x<q[0]+q[2]and q[1]<y<q[1]+q[3]);assert w==h;value=F(v.text);assert value>0;scales.append(w/value);readSides.append(value)
 scale=one(set(scales));assert readSides==sides;whites=sorted(whites);assert whites[0][:2]==whole[:2]
 for a,b in zip(whites,whites[1:]):assert b[0]==a[0]+a[2]and b[1]==a[1]+a[3]
 assert whites[-1][0]+whites[-1][2]==x0+bw and whites[-1][1]+whites[-1][3]==y0+bh and bw/scale==sum(sides)
 for q in blues:assert q[2]>0 and q[3]>0 and x0<=q[0]and y0<=q[1]and q[0]+q[2]<=x0+bw and q[1]+q[3]<=y0+bh
 assert all(not overlap(a,b)for a,b in itertools.combinations(blues,2))and all(not overlap(a,b)for a in blues for b in whites);blueAreas=[q[2]*q[3]/scale**2 for q in blues];out=sum(blueAreas);canonical=[(x,y+h,w,y0+bh-y-h)for x,y,w,h in whites if y+h<y0+bh];wholeSide=bw/scale;complementHalf=(wholeSide**2-sum(v*v for v in sides))/2;complete=set(canonical)==set(blues)
 if complete:assert out==complementHalf
 return out,{'allActualWhiteSideLabels':list(map(str,sides)),'allFourWhiteSquaresTouchAlongActualWholeDiagonal':True,'commonPixelsPerCm':str(scale),'physicalWholeSide':str(wholeSide),'allActualDisjointBlueRectangleAreas':list(map(str,blueAreas)),'allBlueInsideWholeAndOutsideWhiteSquares':True,'blueIsCompleteLowerStaircase':complete,'halfComplementAreaIfComplete':str(complementHalf),'actualBlueAreaTarget':str(out)}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==8:
  if src:points=[(F(c),F(rr))for rr,c in itertools.product(range(4),repeat=2)];out,proof=count_squares(points);proof['sourceRasterSHA256']=asset(8);proof['observedRegular4By4SourcePointLattice']=True
  else:root=P.W.svg(r,data);points=[(F(v.attrib['cx']),F(v.attrib['cy']))for v in root.iter()if v.attrib.get('id','').startswith('point-')];out,proof=count_squares(points)
 elif i==9:
  if src:out,proof=paths(grid_edges(5,3),(0,0),(1,2),(5,3));proof['sourceRasterSHA256']=asset(9);proof['observedFull5By3CellGridAndMarkers']=True
  else:out,proof=native_paths(r,data)
 elif i==10:
  cols,rows,targetCols,targetRows=map(int,n);assert 0<cols<=targetCols and 0<rows<=targetRows;initial=grid_edges(cols,rows);final=grid_edges(targetCols,targetRows)
  if src:proof={'sourceRasterSHA256':asset(10),'observedSource24IndividualMatches3By3':True}
  else:root=P.W.svg(r,data);c,rr,actual,point,proof=decode_segments(root,'stick-');assert(c,rr)==(cols,rows)and actual==initial
  missing=final-initial;assert initial<=final and len(missing)==len(final)-len(initial);out=F(len(missing));proof.update({'initialColsRows':[cols,rows],'targetColsRows':[targetCols,targetRows],'initialActualUnitMatchCount':len(initial),'finalUnitMatchCount':len(final),'allMissingUnitSegmentsCounted':len(missing),'allOriginalMatchesKeptInPlace':True,'additionalMatchCountTarget':str(out)})
 elif i==12:
  sides=n;assert len(sides)==4 and min(sides)>0
  if src:whole=sum(sides);used=F(0);areas=[]
  if src:
   for side in sides:used+=side;areas.append(side*(whole-used))
   out=sum(areas);assert out==(whole**2-sum(v*v for v in sides))/2;proof={'sourceRasterSHA256':asset(12),'observedSourceEntireLowerLeftStaircase':True,'allFourSourceSideLabels':list(map(str,sides)),'physicalWholeSide':str(whole),'allSourceStripAreas':list(map(str,areas)),'actualBlueAreaTarget':str(out)}
  else:out,proof=native_staircase(r,sides,data)
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;core=json.loads((ROOT/'problems/editorial/batches/femo6-spring-grade4-core.json').read_text())['editions'];coreIds={v['params']['number']for v in core};visualIds={v['params']['number']for v in rows};assert len(core)==11 and not coreIds&visualIds and coreIds|visualIds==set(range(1,16));entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['images']and q['solution'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  root=P.W.svg(r);ns='{http://www.w3.org/2000/svg}';statement=r['statement']
  if i==8:
   for j,y in enumerate([58,102,146,190,234]):ET.SubElement(root,ns+'circle',{'id':f'point-extra-{j}','cx':'312','cy':str(y),'r':'4.4','fill':'#5267cc'})
   expected='70'
  elif i==9:
   one(v for v in root.iter()if v.attrib.get('id')=='marker-B').set('cy','146');one(v for v in root.iter()if v.attrib.get('id')=='label-B').set('y','134');expected='36'
  elif i==10:
   c,rr,edges,point,p=decode_segments(root,'stick-');unit=F(p['unitPixels']);lines=[v for v in root.iter()if v.attrib.get('id','').startswith('stick-')];left=min(F(v.attrib[k])for v in lines for k in['x1','x2']);top=min(F(v.attrib[k])for v in lines for k in['y1','y2'])
   for row in range(rr+1):ET.SubElement(root,ns+'line',{'id':f'stick-extra-h-{row}','x1':str(left+c*unit),'y1':str(top+row*unit),'x2':str(left+(c+1)*unit),'y2':str(top+row*unit),'stroke':'#b78d59','stroke-width':'4'})
   for row in range(rr):ET.SubElement(root,ns+'line',{'id':f'stick-extra-v-{row}','x1':str(left+(c+1)*unit),'y1':str(top+row*unit),'x2':str(left+(c+1)*unit),'y2':str(top+(row+1)*unit),'stroke':'#b78d59','stroke-width':'4'})
   statement=statement.replace('2 × 2','3 × 2');expected='43'
  else:one(v for v in root.iter()if v.attrib.get('id')=='shade-0').set('height','198');expected='69'
  changed=ET.tostring(root);bad={**r,'statement':statement,'figureSha256':hashlib.sha256(changed).hexdigest()}
  try:solve(bad,i,False,changed)
  except AssertionError:proof['updatedHashActualGeometryCanaryRejected']=True
  else:raise AssertionError(('changedactualfigureaccepted',i))
  changedProof=solve({**bad,'answer':expected},i,False,changed);proof['validChangedNativeTarget']=expected
  if i==12:assert changedProof['blueIsCompleteLowerStaircase']is False;proof['validPartialBlueAreaReadFromActualColorGeometry']=True
  try:solve({**r,'answer':'999999999'},i)
  except AssertionError:pass
  else:raise AssertionError('wrongkeyaccepted')
  assert r['minimumPlan']=='pro'and r['grade']==4 and not r.get('options')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All4fullsource/newconditions and full official/newsolutions/4rasters/4nativepreviews read. Actualfullpointquadruples/sixsquared-distances crossrotated-edgeconstruction, actualdirectedunitgraph/markers/fullpathenumerationcrosssegmentDP, actualindividualmatchunitinventory/fullrectgrid and actualwhite/bluevertices/physicalunits/disjointareas independentlychecked. Validupdatedhashgeometrychanges recompute70/36/43/69, includingpartialbluepartinstead ofblindlyusinghalfcomplement. Same root author not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]};entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'AllfouractualnativeSVGpoint/edge/marker/match/rectangle/label geometries decoded fromfiles. Sourcebitmaps and343pxnewPNGs inspected. Updatedhashvalidchangedinputs rejectoldkeysandacceptrecomputedanswers; no sourcebitmap/tracedvector.'};entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':4,'fullSourceNewConditionsAndSolutionsRead':4,'sourceKeysNotCaptured':4,'wrongKeysRejected':4,'actualGeometrySemanticCanariesRejected':4,'nativeFigures':4,'validChangedGeometryAnswersAlsoVerified':4,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':4,'completeCollectionWithCore11':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
