"""Full source/new conditions and solutions, all10source/newchoices, two saved
rasters and both343pxnativePNGs inspected. Same author separate computational
review, not anotherhumanreviewer. All actual native geometry is decoded.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-native-nets';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids;points=M.points;rect=M.rect
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-collection-logic-word3-cube.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C)
ASSETS={22:('b36ad58fa865168aecd45a1e','9f0334ca37d08d1d7d5fe68d51a9d57039f42b64cbb122a915934e80ef958d36'),41:('9306b3e399edcc2e2cbc2667','7ba4ba5ba1256c936b9ae225928fee10327f7e4f17a341b54194fc8b2fb12a3e')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def tag(e):return e.tag.rsplit('}',1)[-1]
def xy(e):return tuple(F(e.attrib[k])for k in['x','y'])
def segment(e):return tuple(tuple(F(e.attrib[k+str(j)])for k in['x','y'])for j in[1,2])
def vecsum(*vs):return tuple(map(sum,zip(*vs)))
def box_markers(labels,ends,col):
 frames=C.fold({(j,0)for j in range(4)}|{(col,-1),(col,1)});dim=(1,2,1);out={}
 for cell,(u,v,n)in frames.items():
  center=tuple(F(n[k]*dim[k],2)for k in range(3))
  if cell[1]==0:
   for j,c in enumerate(labels[cell[0]]):assert c not in out;out[c]=C.add(center,C.times(v,F(-1 if j==0 else 1,2)))
  else:
   c=ends[0 if cell[1]==-1 else 1];assert c not in out;out[c]=center
 assert len(out)==10;return out
OBS=[(F(-1,2),0,F(1,2)),(F(1,2),0,F(1,2)),(F(-1,2),F(1,2),0),(F(1,2),F(1,2),0),(1,0,0)]
def box_actual(root):
 d=ids(root);raw=[];labels=[]
 for j in range(4):
  g=d[f'net-side-{j}'];r=rect(one(e for e in g if tag(e)=='rect'));x,y,w,h=r;assert h==2*w>0;raw.append(r);pair=[]
  for k in range(2):
   e=d[f'net-side-{j}-value-{k}'];assert xy(e)==(x+w/2,y+(F(k)+F(1,2))*w);assert re.fullmatch('[A-Z]',e.text);pair.append(e.text)
  assert set(segment(d['net-mid-'+str(j)]))=={(x,y+w),(x+w,y+w)};labels.append(''.join(pair))
 ox,oy,u,h=raw[0];assert raw==[(ox+j*u,oy,u,2*u)for j in range(4)];ends=[];cols=[]
 for key,targety in[('upper',oy-u),('lower',oy+2*u)]:
  g=d['net-'+key];x,y,w,h=rect(one(e for e in g if tag(e)=='rect'));assert y==targety and w==h==u;col=(x-ox)/u;assert col.denominator==1 and 0<=col<=3;cols.append(int(col));e=d['net-'+key+'-value'];assert xy(e)==(x+u/2,y+u/2);assert re.fullmatch('[A-Z]',e.text);ends.append(e.text)
 assert cols[0]==cols[1];return box_markers(labels,ends,cols[0]),{'actualAllFourLongFaceLetterPairs':labels,'actualEndLetters':ends,'actualCapAttachmentColumn':cols[0],'allActual10MarkerCentersAndTwoCapShapesChecked':True}
def box_views(root):
 d=ids(root);views={};frames=[]
 for key in'ABCD':
  t,f,e=[points(d[key+'-face-'+k])for k in['top','front','end']];assert all(len(p)==4 for p in[t,f,e]);sx=C.times(C.sub(t[1],t[0]),F(1,2));sy=C.sub(t[3],t[0]);sz=C.sub(f[1],f[2]);origin=vecsum(t[0],sx,C.times(sy,F(1,2)),C.times(sz,F(-1,2)));P=lambda p:vecsum(origin,C.times(sx,p[0]),C.times(sy,p[1]),C.times(sz,p[2]));assert sx[0]>0 and sx[1]==0 and sy[0]<0<sy[1]and sz[0]==0 and sz[1]<0;frames.append((sx,sy,sz))
  for ps,expected in[(t,[(-1,-F(1,2),F(1,2)),(1,-F(1,2),F(1,2)),(1,F(1,2),F(1,2)),(-1,F(1,2),F(1,2))]),(f,[(-1,F(1,2),F(1,2)),(1,F(1,2),F(1,2)),(1,F(1,2),-F(1,2)),(-1,F(1,2),-F(1,2))]),(e,[(1,F(1,2),F(1,2)),(1,-F(1,2),F(1,2)),(1,-F(1,2),-F(1,2)),(1,F(1,2),-F(1,2))])]:assert ps==[P(p)for p in expected]
  for side,world in[('top',[(0,-F(1,2),F(1,2)),(0,F(1,2),F(1,2))]),('front',[(0,F(1,2),F(1,2)),(0,F(1,2),-F(1,2))])]:assert set(segment(d[key+'-'+side+'-divider']))=={P(p)for p in world}
  values=[]
  for k,p in enumerate(OBS):
   label=d[key+'-value-'+str(k)];assert xy(label)==P(p);assert re.fullmatch('[A-Z]',label.text);values.append(label.text)
  views[key]=''.join(values)
 assert len(set(frames))==1;assert d['none-label'].text=='E — Ешқайсысы';return views
def box(root=None):
 if root is None:markers=box_markers(['21','45','78','90'],'36',1);views=dict(zip('ABCD',['87543','87546','87093','87096']));proof={'sourceActualBeltPairs':['21','45','78','90'],'sourceCapAttachmentColumn':1}
 else:markers,proof=box_actual(root);views=box_views(root);proof['actualAll12VisibleFacePolygonsAnd20ViewMarkerCentersChecked']=True
 counts={key:sum(all(c in markers and C.rotate(r,markers[c])==p for c,p in zip(value,OBS))for r in C.rotations())for key,value in views.items()};answer=one(key for key,n in counts.items()if n)if any(counts.values())else'E';proof.update({'all24ProperRotationsPerView':24,'allTenFoldedLetterCenters':{k:list(map(str,v))for k,v in markers.items()},'allActualCandidateTopFrontEndLabels':views,'candidateProperRotationMatchCounts':counts,'fullCellCenterMatchNotOnlyFaceAdjacency':True,'target':answer});return answer,proof
def folded_edges(cells,marks):
 frames=C.fold(cells);edges=[];normals=[]
 for cell,ends in marks.items():
  u,v,n=frames[cell];assert all(all(abs(q)==F(1,2)for q in p)for p in ends)and C.add(*ends)==(0,0);world=lambda p:vecsum(C.times(n,F(1,2)),C.times(u,p[0]),C.times(v,p[1]));edges.append(tuple(sorted(world(p)for p in ends)));normals.append(n)
 assert len(edges)==3 and len(set(edges))==3;vertices=set(itertools.chain.from_iterable(edges));degrees=sorted(sum(p in e for e in edges)for p in vertices);return edges,{'allFoldedDiagonalSegments':[[list(map(str,p))for p in edge]for edge in edges],'distinctEndpointCount':len(vertices),'endpointDegrees':degrees,'markedFaceNormals':[list(n)for n in normals],'closedTriangle':len(vertices)==3 and degrees==[2,2,2]}
def diagonal_ends(s):return[(-F(1,2),-F(1,2)),(F(1,2),F(1,2))]if s=='b'else[(-F(1,2),F(1,2)),(F(1,2),-F(1,2))]
def net_actual(group):
 rs=[rect(e)for e in group if tag(e)=='rect'];assert len(rs)==6;u=one({w for x,y,w,h in rs}|{h for x,y,w,h in rs});assert u>0;ox,oy=rs[0][:2];cells={};marks={}
 for x,y,w,h in rs:
  a,b=(x-ox)/u,(y-oy)/u;assert a.denominator==b.denominator==1;cell=(int(a),int(b));assert cell not in cells;cells[cell]=(x,y)
 for e in group:
  if tag(e)!='line':continue
  ps=segment(e);owners=[]
  for cell,(x,y)in cells.items():
   norm=[((a-x)/u-F(1,2),(b-y)/u-F(1,2))for a,b in ps]
   if all(all(abs(t)==F(1,2)for t in p)for p in norm)and C.add(*norm)==(0,0):owners.append((cell,norm))
  cell,norm=one(owners);assert cell not in marks;marks[cell]=norm
 assert len(marks)==3;return folded_edges(cells,marks)
def body_actual(root):
 d=ids(root);t,l,r=[points(d['body-face-'+side])for side in['top','left','right']];sx=C.sub(t[1],t[0]);sy=C.sub(t[3],t[0]);sz=C.sub(l[1],l[2]);origin=vecsum(t[0],C.times(sx,F(1,2)),C.times(sy,F(1,2)),C.times(sz,-F(1,2)));P=lambda p:vecsum(origin,C.times(sx,p[0]),C.times(sy,p[1]),C.times(sz,p[2]));assert sx[0]>0>sy[0]and sx[1]>0 and sy[1]>0 and sz[0]==0 and sz[1]<0
 for ps,world in[(t,[(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]),(l,[(-1,1,1),(1,1,1),(1,1,-1),(-1,1,-1)]),(r,[(1,1,1),(1,-1,1),(1,-1,-1),(1,1,-1)])]:assert ps==[P(tuple(F(q,2)for q in p))for p in world]
 result=[]
 for side,normal in[('top',C.Z),('left',C.Y),('right',C.X)]:
  vertices=[tuple(F(q,2)for q in p)for p in itertools.product([-1,1],repeat=3)if C.dot(p,normal)==1];ps=segment(d['body-diagonal-'+side]);ends=[one(v for v in vertices if P(v)==q)for q in ps];assert C.dot(C.sub(*ends),C.sub(*ends))==2;result.append(tuple(sorted(ends)))
 vs=set(itertools.chain.from_iterable(result));assert len(vs)==3 and all(sum(v in e for e in result)==2 for v in vs);return result
def triangle(root=None):
 if root is None:
  cells={(-1,0),(0,0),(1,0),(2,0),(0,-1),(0,1)};pp=[{(-1,0):'b',(0,1):'b',(2,0):'b'},{(-1,0):'s',(0,1):'s',(2,0):'b'},{(-1,0):'s',(0,1):'s',(2,0):'s'},{(-1,0):'b',(0,1):'b',(2,0):'s'},{(-1,0):'b',(0,1):'b',(1,0):'b'}];values={k:folded_edges(cells,{p:diagonal_ends(s)for p,s in pattern.items()})for k,pattern in zip('ABCDE',pp)};target=None
 else:
  d=ids(root);values={k:net_actual(d['choice-'+k])for k in'ABCDE'};target=body_actual(root)
 proofs={};valid=[]
 for key,(edges,proof)in values.items():
  if target is not None:
   matches=sum(set(tuple(sorted(C.rotate(rot,p)for p in edge))for edge in edges)==set(target)for rot in C.rotations());assert bool(matches)==proof['closedTriangle'];proof['fullActualBodyTriangleProperRotationMatches']=matches
  if proof['closedTriangle']:valid.append(key)
  proofs[key]=proof
 answer=one(valid);return answer,{'allFiveActualNetFoldingProofs':proofs,'actualBodyThreeProjectedFaceDiagonalsDecoded':root is not None,'target':answer}
def solve(r,i,src=False,data=None):
 root=None if src else W.svg(r,data);answer,p=box(root)if i==22 else triangle(root);assert B.options(r)==list('ABCDE');assert r['answer']==answer
 if src:p['sourceRasterSHA256']=asset(i)
 return p
def mutate(r,i):
 root=W.svg(r);d=ids(root)
 if i==22:
  for j in range(5):d['A-value-'+str(j)].text,d['B-value-'+str(j)].text=d['B-value-'+str(j)].text,d['A-value-'+str(j)].text
  target='A'
 else:
  a=[v for v in d['choice-A']if tag(v)=='line'];c=[v for v in d['choice-C']if tag(v)=='line']
  for av,cv in zip(a,c):
   for key in['y1','y2']:
    # Both drawings share x/row layout, differing only in diagonal direction.
    ay,cy=F(av.attrib[key]),F(cv.attrib[key]);av.set(key,str(cy-176));cv.set(key,str(ay+176))
  target='A'
 raw=ET.tostring(root);return{**r,'figureSha256':hashlib.sha256(raw).hexdigest()},raw,target
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer'];src=solve({**q,'answer':key},i,True);proof=solve(r,i);bad,raw,target=mutate(r,i)
  for cr,cb in[({**r,'answer':'99999'},None),(bad,raw)]:
   try:solve(cr,i,False,cb)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashActualFigureTarget']=target;root=W.svg(r);d=ids(root)
  if i==22:d['B-value-0'].set('x',str(F(d['B-value-0'].attrib['x'])+1))
  else:d['C-mark-0'].set('x1',str(F(d['C-mark-0'].attrib['x1'])+1))
  broken=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(broken).hexdigest()},i,False,broken)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedNativeGeometryRejected']=True
  else:raise AssertionError(('malformedgeometryaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newcondition solution/all10choices/sourcebitmaps/native343pxPNGs read. Actualcuboidbeltrectangles/capattachment/10labelcenters folded; all12viewfacepolygons/20letterpositions/dividers decoded andfullcenters matched under24properrotations. Actualfive6squarenets/15diagonals folded; actual3bodyfacepolygons/diagonals decoded; all24rotations match completeclosedtriangle; allfivecandidateroles checked. Updatedhashvalidswapcanary recomputed andmalformedgeometry rejected. Sameauthor notseparatehumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Original nativeSVG actualnetrectangles/labels/diagonalendpoints/projectedbodies checked; all343pxPNGs visually inspected. No rasterortracedvector.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'properRotationsPerCandidate':24,'nativeFigures':2,'wrongKeysRejected':2,'validUpdatedHashActualFigureCanariesRecomputed':2,'updatedHashMalformedNativeGeometryRejected':2,'fullCuboidCellCentersAndClosedTriangleSegmentsVerified':True,'pythonJavaScriptHashesMatched':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
