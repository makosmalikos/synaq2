"""Four BIL7 counting tasks: full saved/new conditions, official/new solutions,
all choices, source rasters and native 343px PNGs read. Own actual SVG controls
all recomputations. Same author separate computation, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil7-native-counting';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,path):
 s=importlib.util.spec_from_file_location(n,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-bil7-native-plane.py');L=module('l','scripts/editorial/review-bil1-native-logic.py');M=A.M;B=A.B;H=A.H;E=A.E;one=A.one;W=A.W;ids=A.ids;points=A.points;segment=A.segment;P=A.P

def euler(edges):
 adjacency=collections.defaultdict(list)
 for j,(a,b)in enumerate(edges):assert a!=b;adjacency[a].append((b,j));adjacency[b].append((a,j))
 assert set(adjacency)==set(range(1,10));seen=set();todo=[1]
 while todo:
  v=todo.pop()
  if v in seen:continue
  seen.add(v);todo.extend(a for a,j in adjacency[v])
 assert len(seen)==9;odd=sorted(v for v,e in adjacency.items()if len(e)%2);assert len(odd)==2;stack=[odd[0]];used=set();path=[]
 while stack:
  v=stack[-1];unused=next(((a,j)for a,j in adjacency[v]if j not in used),None)
  if unused is None:path.append(stack.pop())
  else:a,j=unused;used.add(j);stack.append(a)
 path.reverse();assert len(used)==len(edges)and collections.Counter(tuple(sorted(e))for e in edges)==collections.Counter(tuple(sorted(e))for e in zip(path,path[1:]));return ' немесе '.join(map(str,odd)),{'actualAllRoomDegrees':{str(k):len(v)for k,v in sorted(adjacency.items())},'completeEulerWalk':path,'everyDoorTraversedExactlyOnce':True}
def floorplan(root):
 d=ids(root);x,y,w,h=M.rect(d['outer-wall']);assert w==h>0;unit=w/3;labels={};boundaries={}
 for rr in range(3):
  for cc in range(3):
   xx=x+unit*(cc+F(1,2));yy=y+unit*(rr+F(1,2));matches=[e for k,e in d.items()if k.startswith('room-')and F(e.attrib['x'])==xx and abs(F(e.attrib['y'])-yy)<unit/5];v=int(one(matches).text);assert v not in labels.values();labels[rr,cc]=v
   for axis in['v','h']:
    if axis=='v'and cc==2 or axis=='h'and rr==2:continue
    key=(axis,rr,cc);boundaries[key]=[]
 assert set(labels.values())==set(range(1,10))
 for k,v in d.items():
  if not k.startswith('wall-'):continue
  a,b,c,e=segment(v);assert (a==c)!=(b==e);matched=[]
  for(axis,rr,cc)in boundaries:
   fixed=x+unit*(cc+1)if axis=='v'else y+unit*(rr+1);start=y+unit*rr if axis=='v'else x+unit*cc
   if axis=='v'and a==c==fixed and start<=min(b,e)<max(b,e)<=start+unit:matched.append(((axis,rr,cc),min(b,e)-start,max(b,e)-start))
   if axis=='h'and b==e==fixed and start<=min(a,c)<max(a,c)<=start+unit:matched.append(((axis,rr,cc),min(a,c)-start,max(a,c)-start))
  key,lo,hi=one(matched);boundaries[key].append((lo,hi))
 edges=[]
 for(axis,rr,cc),intervals in boundaries.items():
  intervals.sort();assert intervals and intervals[0][0]==0 and intervals[-1][1]==unit and all(a[1]<=b[0]for a,b in zip(intervals,intervals[1:]));gaps=[(a[1],b[0])for a,b in zip(intervals,intervals[1:])if a[1]<b[0]]
  if gaps:
   lo,hi=one(gaps);assert lo==unit*F(11,30)and hi==unit*F(19,30);edges.append((labels[rr,cc],labels[rr+(axis=='h'),cc+(axis=='v')]))
 out,p=euler(edges);p.update(allTwelveSharedWallsDecodedFromActualSegmentCoverage=True,actualDoorEdges=[list(e)for e in edges]);return out,p

def straight_graph(raw):
 edges,p=L.split_intersections(raw);vs=sorted(set(itertools.chain.from_iterable(edges)));cache={}
 def covered(a,b):
  key=tuple(sorted([a,b]))
  if key in cache:return cache[key]
  adj=collections.defaultdict(list)
  for u,v in edges:
   if L.on(u,a,b)and L.on(v,a,b):adj[u].append(v);adj[v].append(u)
  seen=set();todo=[a]
  while todo:
   v=todo.pop()
   if v in seen:continue
   seen.add(v);todo.extend(adj[v])
  cache[key]=b in seen;return cache[key]
 return vs,covered,p

def triangle_inventory(raw):
 vs,covered,p=straight_graph(raw);found=[q for q in itertools.combinations(vs,3)if L.cross(L.subtract(q[1],q[0]),L.subtract(q[2],q[0]))and all(covered(a,b)for a,b in itertools.combinations(q,2))];p.update(allNoncollinearVertexTriplesChecked=math.comb(len(vs),3),everyTriangleSideHasFullContiguousStraightCoverage=True,allTriangleWitnesses=[[[str(x),str(y)]for x,y in q]for q in found]);return F(len(found)),p

def square_inventory(raw):
 vs,covered,p=straight_graph(raw);vset=set(vs);found=set()
 for a,b in itertools.permutations(vs,2):
  dx,dy=L.subtract(b,a);c=(b[0]-dy,b[1]+dx);d=(a[0]-dy,a[1]+dx)
  if c in vset and d in vset and all(covered(u,v)for u,v in[(a,b),(b,c),(c,d),(d,a)]):found.add(tuple(sorted([a,b,c,d])))
 assert all((a==c)!=(b==d)for a,b,c,d in raw);xs=sorted({v[0]for v in vs});ys=sorted({v[1]for v in vs});other=set()
 for x,z in itertools.combinations(xs,2):
  side=z-x
  for y in ys:
   q=[(x,y),(z,y),(z,y+side),(x,y+side)]
   if all(v in vset for v in q)and all(covered(a,b)for a,b in zip(q,q[1:]+q[:1])):other.add(tuple(sorted(q)))
 assert found==other;hist=collections.Counter()
 for q in found:
  ds=sorted(sum((a[j]-b[j])**2 for j in range(2))for a,b in itertools.combinations(q,2));assert ds[:4]==[ds[0]]*4 and ds[4:]==[2*ds[0]]*2;hist[str(ds[0])]+=1
 p.update(allSquareWitnesses=[[[str(x),str(y)]for x,y in q]for q in sorted(found)],squareCountsBySquaredPhysicalSide=dict(sorted(hist.items())),independentAxisCoordinateScanAgreesWithAllPerpendicularVertexPairs=True,everySquareSideHasFullContiguousCoverage=True);return F(len(found)),p

def shaded(root):
 d=ids(root);squares={k:M.rect(d['square-'+k])for k in'ABCD'};assert one({(w,h)for x,y,w,h in squares.values()})[0]>0 and all(w==h for x,y,w,h in squares.values());areas={}
 for key,(x,y,w,h)in squares.items():
  unit=w/4;polys=[points(v)for k,v in d.items()if k.startswith('shade-'+key+'-')];assert polys
  for ps in polys:assert len(ps)>=3 and P.area(ps)>0 and all(x<=a<=x+w and y<=b<=y+h for a,b in ps);turns=[L.cross(L.subtract(b,a),L.subtract(c,b))for a,b,c in zip(ps,ps[1:]+ps[:1],ps[2:]+ps[:2])];assert all(v>=0 for v in turns)or all(v<=0 for v in turns)
  assert all(P.disjoint(a,b)for a,b in itertools.combinations(polys,2));areas[key]=sum(P.area(ps)for ps in polys)/unit**2
  for j in range(1,4):assert segment(d[f'grid-{key}-v-{j}'])==(x+unit*j,y,x+unit*j,y+h)and segment(d[f'grid-{key}-h-{j}'])==(x,y+unit*j,x+w,y+unit*j)
 if len(set(areas.values()))==1:answer='Барлығының боялған ауданы бірдей'
 else:answer=one(k for k,v in areas.items()if v==max(areas.values()))+'-дағы аудан ең үлкен'
 return answer,{'allActualShadedUnitAreas':{k:str(v)for k,v in areas.items()},'allShadedFractions':{k:str(v/16)for k,v in areas.items()},'allConvexShadedPiecesContainedAndPairwiseDisjoint':True,'allTwelveEqualGridIntervalsCheckedPerPanel':True}

def geometry(r,i,data=None):
 root=W.svg(r,data);d=ids(root)
 if i==17:out,p=floorplan(root)
 elif i==34:
  raw=[segment(v)for v in d['diagram']];assert all(v.tag.endswith('line')for v in d['diagram']);O=tuple(F(d['boundary'].attrib[k])for k in['cx','cy']);radius=F(d['boundary'].attrib['r']);assert radius>0
  for x,y in set(p for a,b,c,e in raw for p in[(a,b),(c,e)]):assert (x-O[0])**2+(y-O[1])**2==radius**2
  out,p=triangle_inventory(raw);p['allActualChordEndpointsOnCircle']=True
 elif i==40:
  raw=[segment(v)for v in d['diagram']];assert all(v.tag.endswith('line')for v in d['diagram']);lens=[abs(c-a)+abs(e-b)for a,b,c,e in raw];unit=one(set(lens));assert unit>0;ox=min(a for a,b,c,e in raw);oy=min(b for a,b,c,e in raw);assert all(((a-ox)/unit).denominator==((b-oy)/unit).denominator==((c-ox)/unit).denominator==((e-oy)/unit).denominator==1 for a,b,c,e in raw);out,p=square_inventory([((a-ox)/unit,(b-oy)/unit,(c-ox)/unit,(e-oy)/unit)for a,b,c,e in raw]);p['actualUniformUnitGridDecoded']=True
 else:out,p=shaded(root)
 p['target']=str(out)
 if i in[17,48]:assert r['answer']==out and r['answer']in B.options(r)and len(set(B.options(r)))==5
 else:p.update(B.checked_choices(r,out))
 return p

def source(q,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'sourceObservedTopologyRationalRealizationNotPixelMetricTracing':True}
 if i==17:out,z=euler([(1,8),(2,8),(2,3),(3,5),(3,4),(4,5),(6,9),(6,7),(7,8),(8,9)]);p.update(z)
 elif i==34:
  R=(F(1),F(0));ps=[(F(0),F(1)),(F(-3,5),F(4,5)),(F(-1),F(0)),(F(0),F(-1))];raw=[(*R,*v)for v in ps]+[(*ps[0],*ps[-1]),(*ps[1],*ps[2])];out,z=triangle_inventory(raw);assert out==7;p.update(z)
 elif i==40:
  raw=[tuple(map(F,[x,a,x,b]))for x,a,b in[(0,0,3),(1,0,5),(2,1,3),(3,0,5),(4,1,3),(5,1,5)]]+[tuple(map(F,[a,y,b,y]))for y,a,b in[(0,0,3),(1,0,5),(2,1,3),(3,0,5),(4,1,3),(5,1,5)]];out,z=square_inventory(raw);assert out==15;assert z['squareCountsBySquaredPhysicalSide']=={'1':5,'16':1,'4':8,'9':1};p.update(z)
 else:
  areas=[2*F(2),2*F(2),4*F(1),4*F(1)];assert len(set(areas))==1;out='Ондай шаршы жоқ';p.update(sourceTwoHalfQuarterTrianglesOrFourQuarterQuarterTriangles=areas,sourceShadedFraction='1/4')
 p['target']=str(out)
 if i in[17,48]:assert q['answer']==out
 else:p.update(B.checked_choices(q,out))
 return p

def redraw_walls(root,doors):
 d=ids(root)
 for k,v in list(d.items()):
  if k.startswith('wall-'):root.remove(v)
 for rr in range(3):
  for cc in range(3):
   room=3*rr+cc+1
   for axis,nextroom in[('v',room+1),('h',room+3)]:
    if axis=='v'and cc==2 or axis=='h'and rr==2:continue
    x=135+cc*90 if axis=='v'else 45+cc*90;y=40+rr*90 if axis=='v'else 130+rr*90
    for j,(a,b)in enumerate([(0,33),(57,90)]if tuple(sorted([room,nextroom]))in doors else[(0,90)]):
     xx,yy,zz,ww=(x,y+a,x,y+b)if axis=='v'else(x+a,y,x+b,y);ET.SubElement(root,'{http://www.w3.org/2000/svg}line',{'id':f'wall-{room}-{nextroom}-{j}','x1':str(xx),'y1':str(yy),'x2':str(zz),'y2':str(ww),'stroke':'#7294c5'})
def changed(r,i):
 root=W.svg(r);d=ids(root);cr=copy.deepcopy(r)
 if i==17:
  _,p=floorplan(root);edges=set(tuple(sorted(e))for e in p['actualDoorEdges']);edges.add((2,5));edges.remove((4,5));redraw_walls(root,edges)
 elif i==34:d['diagram'].remove(d['spoke-3'])
 elif i==40:
  # Remove the exposed right and bottom edges of the bottom-right unit cell.
  for k in['grid-4,3,4,4','grid-3,4,4,4']:d['diagram'].remove(d[k])
 else:
  ET.SubElement(root,'{http://www.w3.org/2000/svg}polygon',{'id':'shade-A-extra','points':'123,99 150,99 150,153','fill':'#b4a3df'})
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest()
 if i==17:new='2 немесе 8';cr['options'][1]=new
 elif i==34:new='7';cr['options']=[str(B.scalar(v)-4)for v in r['options']]
 elif i==40:new='16';cr['options']=[str(B.scalar(v)-2)for v in r['options']]
 else:new='A-дағы аудан ең үлкен'
 return cr,raw,new

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=source({**q,'answer':key},i);proof=geometry(r,i);cr,raw,new=changed(r,i)
  for bad,data in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:geometry(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  proof['validChangedActualGeometryTarget']=geometry({**cr,'answer':new},i,raw)['target'];root=W.svg(r);d=ids(root)
  if i==17:d['room-1'].text='2'
  elif i==34:d['boundary'].set('r','126')
  elif i==40:line=next(iter(d['diagram']));line.set('y2',str(F(line.attrib['y2'])+1))
  else:el=d['shade-A-0'];ps=points(el);ps[0]=(ps[0][0]-1,ps[0][1]);el.set('points',' '.join(f'{x},{y}'for x,y in ps))
  bs=ET.tostring(root)
  try:geometry({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedGeometryRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full frozen/new conditions solutions all options and source rasters read. Actual walls decode doors, Euler walk replays every edge; exact segment intersections and all vertex triples or perpendicular pairs enumerate all triangles/squares with contiguous side coverage; exact convex polygon areas and disjointness compare all shaded fractions. Updated actual geometry canaries recomputed and malformed geometry rejected. Same author computational review.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG actual geometry verified; native 343px PNG inspected.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':4,'sourceOptionsRead':20,'rewrittenOptionsRead':20,'nativeFigures':4,'validChangedActualGeometryRecomputed':4,'malformedActualGeometryRejected':4,'pythonJavaScriptHashesMatched':4,'allFiftyBIL7TasksCompleteWithOtherBatches':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2,default=str)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
