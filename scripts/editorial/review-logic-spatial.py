"""All25 frozen/new full conditions official/new solutions, all16source/new
choices,10source rasters and10own343px SVG previews read. Explicit voxel/die-face
and straight-segment enumeration; actual new nets folded, topology differs from
all four frozen nets. Same author computation, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='logic-spatial';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):
 s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-logic-rings.py');G=module('g','scripts/editorial/review-bil7-native-counting.py');NET=module('net','scripts/editorial/review-bil2-native-nets.py');W=A.W;ids=A.ids;one=A.one;B=A.B;H=A.H;E=A.E;N=A.N;M=A.A.M;segment=A.A.segment;Fold=NET.C
SOURCE_NETS={14:([(0,1),(1,1),(2,1),(3,1),(1,0),(1,2)],'АЕВКТМ','В'),15:([(1,0),(0,1),(1,1),(2,1),(2,2),(3,2)],'НКРТМБ','Н'),20:([(0,0),(1,0),(2,0),(2,1),(3,1),(4,1)],'ВБРМАС','А'),21:([(0,0),(1,0),(1,1),(2,1),(2,2),(3,2)],'КНСТРБ','Р')}

def normalize(cells):
 x0=min(x for x,y in cells);y0=min(y for x,y in cells);return tuple(sorted((x-x0,y-y0)for x,y in cells))
def canonical(cells):return min(normalize([(x*sx,y*sy)if not swap else(y*sy,x*sx)for x,y in cells])for sx in[-1,1]for sy in[-1,1]for swap in[0,1])
def folded(cells,labels,asked):
 assert len(cells)==len(set(cells))==len(labels)==len(set(labels))==6;origin=cells[0];local=[(x-origin[0],y-origin[1])for x,y in cells];frames=Fold.fold(set(local));normals={v:frames[p][2]for v,p in zip(labels,local)};assert asked in normals;opposite=one(k for k,v in normals.items()if v==Fold.neg(normals[asked]));pairs=sorted({tuple(sorted((a,b)))for a in normals for b in normals if normals[a]==Fold.neg(normals[b])});assert len(pairs)==3;return opposite,{'allActualFoldedFaceNormals':{k:list(v)for k,v in normals.items()},'allThreeActualOppositeFacePairs':[list(v)for v in pairs],'sixDistinctFoldedNormalsVerified':True}

def voxels(dims):
 assert len(dims)==3 and min(dims)>0 and all(v.denominator==1 for v in dims);dims=tuple(map(int,dims));out=collections.Counter()
 for p in itertools.product(*(range(n)for n in dims)):out[sum(int(v==0)+int(v==n-1)for v,n in zip(p,dims))]+=1
 assert sum(out.values())==math.prod(dims);return out

def word_target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p={'actualNumericTokens':list(map(str,n))}
 if i in[1,2,3,11,12,13,23,24]:
  if i in[1,2,3]:
   side,unit,total=n[:3];assert side>0 and unit>0;length=side/unit;assert length.denominator==1 and length**3==total;dims=[length]*3;p['actualPhysicalSideUnitAndCellCount']=list(map(str,[side,unit,total]))
  elif i in[11,12,13]:
   dims=n[:3];assert len(set(dims))==1
   if src and i in[11,12]:assert dims[0]**3==n[3]
  elif i==23:dims=n[:3]
  else:dims=[*n[:2],F(1)]if src else n[:3];assert dims[-1]==1
  histogram=voxels(dims);asked={1:2,2:3,3:2,11:1,12:0,23:1,24:2}.get(i)
  if i==13:out=F(sum(v for k,v in histogram.items()if k>0))
  else:
   if not src:
    if'Бірде-бір'in s:asked=0
    else:asked=int(one(re.findall(r'[Дд]әл (\d+) беті',s)))
   else:assert ({2:'үш',11:'бір',12:'бірде-бір',23:'бір'}.get(i,'екі'))in s.lower()
   out=F(histogram[asked]);p['actualAskedPaintedFaceCount']=asked
  p['actualVoxelDimensions']=list(map(str,dims));p['allEnumeratedPaintedFaceCountHistogram']={str(k):v for k,v in sorted(histogram.items())};p['allVoxelPositionsEnumerated']=math.prod(map(int,dims))
 elif i in[4,5]:
  layers=int(n[0]);assert layers>=2 and n[1:5]==[layers,layers,layers-1,layers-1];points={(x,y,z)for z in range(layers)for x in range(layers-z)for y in range(layers-z)};out=F(len(points));assert out==F(layers*(layers+1)*(2*layers+1),6);p['allLayerVoxelCounts']=[(layers-z)**2 for z in range(layers)];p['allVoxelPositionsEnumerated']=len(points)
 elif i==6:
  count=int(n[0]);assert n[-1]==count and count>0;points={(x,0,z)for x in range(count)for z in range(x+1)};out=F(len(points));assert out==F(count*(count+1),2);p['allColumnHeights']=list(range(1,count+1))
 elif i in[9,10]:
  opposite,count,top=n;assert opposite==7 and count.denominator==top.denominator==1 and count>0 and 1<=top<=6;possible=[]
  for lower in itertools.product(range(1,7),repeat=int(count)-1):
   tops=(*lower,int(top));bottoms=[7-v for v in tops];possible.append(sum(tops)+sum(bottoms)-top)
  out=one(set(possible));p['allLowerDieTopAssignmentsEnumerated']=len(possible);p['allAssignmentsSameHiddenHorizontalTotal']=True
 elif i in[19,22]:
  dims=n[:3];assert len(set(dims))==1 and dims[0].denominator==1;length=int(dims[0]);assert length>=3 and length%2==1;c=length//2;allv=set(itertools.product(range(length),repeat=3));tunnels=[{tuple(t if j==axis else c for j in range(3))for t in range(length)}for axis in range(1 if i==19 else 3)];removed=set.union(*tunnels);out=F(len(allv-removed));assert len(removed)==(length if i==19 else 3*length-2);p['actualAllRemovedTunnelVoxels']=[list(v)for v in sorted(removed)];p['originalCubeVolume']=len(allv);p['removedVoxelCount']=len(removed);p['unionCountsCentralCubeOnlyOnce']=True
 else:raise AssertionError(i)
 p['target']=str(out);return out,p

def grid(raw,rectangles=False):
 vertical=[v for v in raw if v[0]==v[2]];horizontal=[v for v in raw if v[1]==v[3]];assert len(vertical)+len(horizontal)==len(raw);xs=sorted({v[0]for v in vertical});ys=sorted({v[1]for v in horizontal});assert len(xs)==len(vertical)>=2 and len(ys)==len(horizontal)>=2;assert all({v[1],v[3]}=={ys[0],ys[-1]}for v in vertical)and all({v[0],v[2]}=={xs[0],xs[-1]}for v in horizontal);assert len({b-a for a,b in zip(xs,xs[1:])})==len({b-a for a,b in zip(ys,ys[1:])})==1
 if rectangles:
  vertices,covered,p=G.straight_graph(raw);witness=[]
  for a,b in itertools.combinations(xs,2):
   for c,d in itertools.combinations(ys,2):
    corners=[(a,c),(b,c),(b,d),(a,d)];assert all(covered(x,y)for x,y in zip(corners,corners[1:]+corners[:1]));witness.append(corners)
  out=F(len(witness));assert out==math.comb(len(xs),2)*math.comb(len(ys),2);p['allRectangleBoundaryPairWitnesses']=[[[str(x),str(y)]for x,y in v]for v in witness]
 else:out,p=G.square_inventory(raw);assert out==sum(max(0,len(xs)-k)*max(0,len(ys)-k)for k in range(1,min(len(xs),len(ys))))
 p['actualGridRowColumnCounts']=[len(ys)-1,len(xs)-1];p['target']=str(out);return out,p

def native_target(r,i,data=None):
 root=W.svg(r,data);d=ids(root)
 if i in SOURCE_NETS:
  records=[(int(m[1]),el)for key,el in d.items()if(m:=re.fullmatch(r'face-(\d+)',key))];assert sorted(j for j,el in records)==list(range(6));rects=[M.rect(d['face-'+str(j)])for j in range(6)];unit=one({w for x,y,w,h in rects}|{h for x,y,w,h in rects});assert unit>0;ox,oy=rects[0][:2];cells=[];labels=[]
  for j,(x,y,w,h)in enumerate(rects):
   a,b=(x-ox)/unit,(y-oy)/unit;assert a.denominator==b.denominator==1;cells.append((int(a),int(b)));el=d['letter-'+str(j)];assert F(el.attrib['x'])==x+w/2 and F(el.attrib['y'])-8==y+h/2 and re.fullmatch('[A-Z]',el.text);labels.append(el.text)
  asked=one(re.findall(r'([A-Z]) әрпіне',r['statement']));out,p=folded(cells,labels,asked);assert all(canonical(cells)!=canonical(v[0])for v in SOURCE_NETS.values());assert one(labels[j]for j,el in records if el.attrib['fill']=='#d4c6f0')==asked;p['newFreeNetTopologyDiffersFromAllFourSourceNets']=True;p['actualNativeLatticeCells']=[list(v)for v in cells];p['actualAskedFace']=asked
 else:
  raw=[segment(el)for el in root if el.tag.split('}')[-1]=='line'];assert raw and all(all(v>=0 for v in line)for line in raw)
  if i in[7,8,25]:out,p=grid(raw,i==25)
  else:out,p=G.triangle_inventory(raw)
 p['target']=str(out);return out,p

def source(q,i):
 if i not in[7,8,14,15,16,17,18,20,21,25]:return word_target(q,i,True)
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256']
 if i in SOURCE_NETS:cells,labels,asked=SOURCE_NETS[i];out,p=folded(cells,labels,asked)
 else:
  if i in[7,8,25]:rows,cols={7:(2,4),8:(2,2),25:(2,3)}[i];raw=[(x,0,x,rows)for x in range(cols+1)]+[(0,y,cols,y)for y in range(rows+1)];out,p=grid([tuple(map(F,v))for v in raw],i==25)
  elif i==16:raw=[(2,0,x,3)for x in[0,1,3,4]]+[(0,3,4,3)];out,p=G.triangle_inventory([tuple(map(F,v))for v in raw])
  elif i==17:raw=[(2,0,x,4)for x in[0,2,4]]+[(1,2,3,2),(0,4,4,4)];out,p=G.triangle_inventory([tuple(map(F,v))for v in raw])
  else:raw=[(0,0,2,0),(2,0,2,2),(2,2,0,2),(0,2,0,0),(0,0,2,2),(2,0,0,2)];out,p=G.triangle_inventory([tuple(map(F,v))for v in raw])
 p['sourceRasterSHA256']=asset['sha256'];p['sourceGivensTopologyVisuallyReadNativeGeometryNotTraced']=True;p['target']=str(out);return out,p

def solve(r,i,src=False,data=None):
 out,p=source(r,i)if src else native_target(r,i,data)if r.get('image')else word_target(r,i)
 if i in SOURCE_NETS:
  opts=B.options(r);assert len(opts)==len(set(opts))==4 and opts.count(out)==1 and r['answer']==out
 else:assert E.calc(r['answer'])==out,(i,out,r['answer'])
 return p

def changed(r,i):
 cr=copy.deepcopy(r);raw=None
 if r.get('image'):
  root=W.svg(r);d=ids(root)
  if i in SOURCE_NETS:
   old=r['answer'];other=next(v for v in r['options']if v!=old);a=one(v for key,v in d.items()if key.startswith('letter-')and v.text==old);b=one(v for key,v in d.items()if key.startswith('letter-')and v.text==other);a.text,b.text=b.text,a.text
  elif i in[7,8,25]:
   vert=[v for v in root if v.tag.split('}')[-1]=='line'and F(v.attrib['x1'])==F(v.attrib['x2'])];horiz=[v for v in root if v.tag.split('}')[-1]=='line'and F(v.attrib['y1'])==F(v.attrib['y2'])];xs=sorted(F(v.attrib['x1'])for v in vert);ys=sorted(F(v.attrib['y1'])for v in horiz)
   if i==7:
    end=ys[-1]+ys[1]-ys[0]
    for el in vert:el.set('y2',str(end))
    ET.SubElement(root,'{http://www.w3.org/2000/svg}line',{'id':'horizontal-added','x1':str(xs[0]),'x2':str(xs[-1]),'y1':str(end),'y2':str(end),'stroke':'#6a8dbf'})
   elif i==8:
    end=xs[-1]+xs[1]-xs[0]
    for el in horiz:el.set('x2',str(end))
    ET.SubElement(root,'{http://www.w3.org/2000/svg}line',{'id':'vertical-added','x1':str(end),'x2':str(end),'y1':str(ys[0]),'y2':str(ys[-1]),'stroke':'#6a8dbf'})
   else:
    root.remove(one(el for el in vert if F(el.attrib['x1'])==xs[-1]))
    for el in horiz:el.set('x2',str(xs[-2]))
  else:root.remove(d['edge-'+str({16:1,17:4,18:6}[i])])
  raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();out,p=native_target(cr,i,raw)
 else:
  s=cr['statement'];n=H.numeric_tokens(s)
  if i in[1,3]:unit=n[1];length=int(n[0]/unit)+1;asked=int(one(re.findall(r'Дәл (\d+) беті',s)));cr['statement']=f'Қабырғасы {length*unit} см кубтың барлық беті боялды. Оны қабырғасы {unit} см бірдей {length**3} текшеге кесті. Дәл {asked} беті боялған текшелер нешеу?'
  elif i==2:cr['statement']=s.replace('Дәл 3 беті','Дәл 2 беті')
  elif i in[4,5]:v=int(n[0])+1;cr['statement']=f'Текшелерден {v} қабатты пирамида жасалды. Қабаттар төменнен жоғары {v} × {v}, {v-1} × {v-1}, әр бағытта бірден кеміп, 1 × 1 шаршымен аяқталады. Барлығы неше текше?'
  elif i==6:v=int(n[0])+1;cr['statement']=f'Ені бір текшеге тең сатының {v} бағаны бар. Бірінші баған биіктігі 1 текше, келесілері бірден биік, соңғысы {v} текше. Барлығы неше текше?'
  elif i in[9,10]:cr['statement']=re.sub(r'7 болатын (\d+) ойын',lambda m:'7 болатын '+str(int(m[1])+1)+' ойын',s,count=1)
  else:
   old=one(H.math_parts(s,False));vals=H.numeric_tokens(old);new=([v+2 for v in vals]if i in[19,22]else[v+1 for v in vals]if i in[11,12,13]else[vals[0]+1,*vals[1:]]);cr['statement']=s.replace('«'+old+'»','«'+' × '.join(map(str,new))+'»')
  out,p=word_target(cr,i)
 old=native_target(r,i)[0]if r.get('image')else word_target(r,i)[0];assert out!=old;cr['answer']=str(out);cr['solution']='Жаңа шарттағы толық есептеу нәтижесі '+str(out)+'.';return cr,raw

def mutated_figure(r,i):
 root=W.svg(r);d=ids(root)
 if i in SOURCE_NETS:el=d['letter-0'];el.set('x',str(F(el.attrib['x'])+1))
 elif i in[7,8,25]:el=one(v for key,v in d.items()if key=='horizontal-0');el.set('x2',str(F(el.attrib['x2'])-1))
 else:
  lines=[v for v in root if v.tag.split('}')[-1]=='line'];horizontal=[v for v in lines if v.attrib['y1']==v.attrib['y2']];bottom=max(F(v.attrib['y1'])for v in horizontal);root.remove(one(v for v in horizontal if F(v.attrib['y1'])==bottom))
 return A.changed_hash(r,root)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];choices=0;equalities=0;figures=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['svg'];assert bool(q['images'])==bool(r.get('image'));choices+=len(q['options']);assert len(q['options'])==len(r.get('options',[]));key=one(v['text']for v in q['options']if v['correct'])if q['options']else one(re.findall(r'Жауабы:\s*(.*)',q['solution']))
  if q['options']:assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr,raw=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad,data in[({**r,'answer':'999999999'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,data=data)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  proof['validChangedActualInputAnswer']=solve(cr,i,data=raw)['target']
  if r.get('image'):
   figures+=1;bad,bs=mutated_figure(r,i)
   try:solve(bad,i,data=bs)
   except(AssertionError,ValueError):proof['updatedHashChangedGeometryOldKeyRejected']=True
   else:raise AssertionError(('badGeometryOldKeyAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for text,srcText in[(q['solution'],True),(r['solution'],False)]:
   parts=H.math_parts(text,True)if srcText else[m[0]for m in re.finditer(r'[0-9(),.+−×÷/^\s=]+',text)]
   for expr in parts:
    sides=[v.strip().rstrip('.,')for v in expr.split('=')]
    if len(sides)<2 or not all(sides):continue
    try:values=[N.exact_power_arithmetic(v)for v in sides]
    except(AssertionError,ValueError,SyntaxError,KeyError):continue
    assert len(set(values))==1,('sourceOrNewPrintedArithmetic',i,expr);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All25 source/new conditions full official/new solutions10source rasters all16source/newchoices read. Every voxel location enumerated with six separate painted-boundary tests including unit-thick slabs; all central tunnel voxel sets unioned; every die top assignment replayed; full layer/column voxel enumeration. Actual native grid segment coverage and all squares/rectangle witnesses; exhaustive triangle vertex triples; actual native net squares/centred labels folded to six distinct normals, all opposite pairs checked. All four new free-net topologies differ from all four originals. All25 changed actual inputs reject old answers and accept recomputed ones;10updated-hash changed geometry old answers rejected. Same author computation.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG grid/triangle edges and cube-net square lattice/labels independently enumerated/folded;343px PNG inspected. Source images not reused/traced.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==16 and figures==10
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':25,'nativeFigures':10,'sourceOptionsRead':16,'rewrittenOptionsRead':16,'validChangedActualInputsRecomputed':25,'updatedHashChangedGeometryOldKeysRejected':10,'printedSourceAndNewArithmeticEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':25,'allSpatialCollectionTasksComplete':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
