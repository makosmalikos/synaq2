"""Last6 frozen geometry visual sources. Full saved/new conditions, full official
and new solutions, all4MCQs when present, all6 archived rasters and final343px
native previews read/viewed. Same root author wrote separate exact/combinatorial
geometry review; no separate human reviewer. Source images not copied/traced.
Actual SVG sector arcs/colors, cell edges and semicircle arcs drive new answers.
"""
import collections,copy,hashlib,importlib.util,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-geometry-figures';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
sp=importlib.util.spec_from_file_location('geocore',ROOT/'scripts/editorial/review-collection-geometry-core.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G)
one=G.one

def boundary(cells):
 cells=set(cells);todo=[next(iter(cells))];reached=set(todo)
 while todo:
  x,y=todo.pop()
  for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]:
   p=(x+dx,y+dy)
   if p in cells and p not in reached:reached.add(p);todo.append(p)
 assert reached==cells,'Disconnected cell figure'
 edges=collections.Counter()
 for x,y in cells:
  vs=[(x,y),(x+1,y),(x+1,y+1),(x,y+1)]
  for a,b in zip(vs,vs[1:]+vs[:1]):edges[tuple(sorted((a,b)))]+=1
 assert set(edges.values())<={1,2};outside=[e for e,n in edges.items()if n==1];graph=collections.defaultdict(set)
 for a,b in outside:graph[a].add(b);graph[b].add(a)
 assert all(len(v)==2 for v in graph.values());todo=[next(iter(graph))];seen=set(todo)
 while todo:
  for v in graph[todo.pop()]:
   if v not in seen:seen.add(v);todo.append(v)
 assert seen==set(graph),'More than one boundary loop / hidden hole'
 # Independent exterior flood fill proves no empty enclosed cell is counted.
 xs,ys=zip(*cells);xmin,xmax=min(xs)-1,max(xs)+1;ymin,ymax=min(ys)-1,max(ys)+1;todo=[(xmin,ymin)];empty=set(todo)
 while todo:
  x,y=todo.pop()
  for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]:
   p=(x+dx,y+dy)
   if xmin<=p[0]<=xmax and ymin<=p[1]<=ymax and p not in cells and p not in empty:empty.add(p);todo.append(p)
 assert len(empty)+len(cells)==(xmax-xmin+1)*(ymax-ymin+1)
 return{'outerUnitEdges':len(outside),'sharedEdges':sum(n==2 for n in edges.values()),'singleConnectedOuterBoundary':True,'noHolesByFloodFill':True,'allOuterEdges':outside}

def geometry(r,raw=None):
 i=int(one(r['sourceRefs'])['sourceId']);raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 360 320';assert not re.search(rb'<image|<script|<foreignObject|href=|data:|onload=',raw);proof={'sha256':hashlib.sha256(raw).hexdigest()};n=G.numbers(r['statement'])
 if i in{9,10}:
  total=one(n);paths=root.findall('.//s:path',NS);assert len(paths)==total;colors=[];arc_points=[];deltas=[]
  for j,path in enumerate(paths):
   assert path.attrib['id']=='sector-'+str(j);assert re.fullmatch(r'M [-0-9.]+ [-0-9.]+ L [-0-9.]+ [-0-9.]+ A 110 110 0 0 1 [-0-9.]+ [-0-9.]+ Z',path.attrib['d']);cx,cy,x,y,rx,ry,rot,large,sweep,xx,yy=map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d']));assert(cx,cy,rx,ry,rot,large,sweep)==(180,145,110,110,0,0,1)
   assert abs(math.hypot(x-cx,y-cy)-rx)<0.00015 and abs(math.hypot(xx-cx,yy-cy)-rx)<0.00015;a=math.degrees(math.atan2(y-cy,x-cx))%360;b=math.degrees(math.atan2(yy-cy,xx-cx))%360;delta=(b-a)%360;assert abs(delta-360/float(total))<0.00015;deltas.append(delta);arc_points.append(((x,y),(xx,yy)));assert path.attrib['fill']in{'#8295f3','#ffffff'};colors.append(path.attrib['fill']=='#8295f3')
  assert all(arc_points[j][1]==arc_points[(j+1)%len(paths)][0]for j in range(len(paths)))and abs(sum(deltas)-360)<0.00015;colored=sum(colors);proof.update(totalEqualSectors=int(total),actualColoredSectors=colored,allEqualArcAngles=deltas,completeNonoverlappingCircleCover=True,answer=str(F(colored*100,total)))
 elif i in{15,16,17}:
  side,count=n;rects=root.findall('.//s:rect[@id]',NS);assert len(rects)==count
  xs=[F(e.attrib['x'])for e in rects];ys=[F(e.attrib['y'])for e in rects];unit=F(rects[0].attrib['width']);assert unit>0;cells=[]
  for e,x,y in zip(rects,xs,ys):
   assert F(e.attrib['width'])==F(e.attrib['height'])==unit;gx,gy=(x-min(xs))/unit,(y-min(ys))/unit;assert gx.denominator==gy.denominator==1;cells.append((int(gx),int(gy)))
  assert len(set(cells))==len(cells);given=one(root.findall('.//s:text[@id="given"]',NS)).text;assert G.numbers(given)==[side];b=boundary(cells);out=F(b['outerUnitEdges'])*side
  if i==16:assert set(cells)=={(x,y)for x in range(5)for y in range(2)}
  proof.update(actualUnitCells=cells,cellCount=int(count),side=str(side),boundary=b,answer=str(out))
 elif i==24:
  diameter=one(n);es={p.attrib['id']:p for p in root.findall('.//s:path',NS)};assert set(es)=={'large','left-hole','right-hole'};discs={}
  for id,e in es.items():
   assert re.fullmatch(r'M \d+ \d+ A \d+ \d+ 0 0 1 \d+ \d+ L \d+ \d+ Z',e.attrib['d']);x,y,rx,ry,rot,large,sweep,xx,yy,xclose,yclose=map(F,re.findall(r'\d+',e.attrib['d']));assert y==yy==yclose==210 and x==xclose and xx>x and rx==ry==(xx-x)/2 and(rot,large,sweep)==(0,0,1);discs[id]={'centre':((x+xx)/2,y),'radius':rx,'diameter':(x,xx)};assert e.attrib['fill']==('#a2adf5'if id=='large'else'#ffffff')
  big,left,right=[discs[k]for k in['large','left-hole','right-hole']];assert big['diameter']==(40,320)and left['diameter']==(40,180)and right['diameter']==(180,320);assert left['radius']==right['radius']==big['radius']/2
  for small in[left,right]:assert abs(small['centre'][0]-big['centre'][0])+small['radius']==big['radius']
  assert right['centre'][0]-left['centre'][0]==right['radius']+left['radius'];texts={e.attrib['id']:e for e in root.findall('.//s:text[@id]',NS)};assert G.numbers(texts['given'].text)==[diameter]
  for label,x in[('C',40),('M',180),('D',320)]:assert texts[label].text==label and F(texts[label].attrib['x'])==x
  scale=F(280,diameter);rBig=big['radius']/scale;rLeft=left['radius']/scale;rRight=right['radius']/scale;coef=(rBig*rBig-rLeft*rLeft-rRight*rRight)/2;proof.update(G.symbolic(r,0,coef));proof['exactPhysicalRadii']=list(map(str,[rBig,rLeft,rRight]));proof['containedDisjointWhiteSemicircles']=True
 else:raise AssertionError(i)
 return proof

def solve(r,raw=None):
 proof=geometry(r,raw);assert proof['answer']==r['answer'];return proof

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==6;entries=[];evidence=[];keys=0;coordinate_canaries=0
 info={9:('b5099a91606a57376e1ba3db.png','5107413e86d209ae470855a85e5b0aaca49a17c20fe96ea4e1913cf94f012f01'),10:('f4c6fcf64df89e9097c073ab.png','a0f257540f4c37a00b69a6d221dcc71562b34f58aeaa33cefc87be65d5f9fa5a'),15:('0e884c935e31c38d4f1790e6.png','68612e5799e06653ca5a6b038bed4f4b386b8c5c33fc0d69713e0be5b19dd2ad'),16:('54a8808320419e06ac2913c6.png','fc26d3b66aa5e3e1164f2453c74ccd94f8c86853f93dd98eea8904376cec415d'),17:('6709ad009c413aaaf1e6be4a.png','7115855eb684de8ebcd75b4a1b69aed52601425216424a68e32d66d094b00836'),24:('c35ca26e8af57031cc12a09b.png','3c3af7f0f1e6c98d329935f429833abae248816c8afd8b531b452b1feb6dce8a')}
 source_cells={15:[(1,0),(0,1),(1,1),(1,2),(1,3),(2,3)],16:[(x,y)for x in range(4)for y in range(2)],17:[(1,0),(0,1),(1,1),(0,2),(1,2),(2,2),(3,2),(3,3)]}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);filename,sha=info[i];assert hashlib.sha256((ROOT/'problems/sources/zerek/images'/filename).read_bytes()).hexdigest()==sha;assert len(q['images'])==1 and q['solution'];n=G.numbers(q['statement'])
  if i in{9,10}:total=one(n);colored=8 if i==9 else 1;sourceProof={'visuallyCountedSectors':int(total),'visuallyCountedColored':colored,'answer':str(F(colored*100,total))}
  elif i in{15,16,17}:side,count=n;cells=source_cells[i];assert len(cells)==count;b=boundary(cells);sourceProof={'visuallyReadUnitCells':cells,'boundary':b,'answer':str(b['outerUnitEdges']*side)}
  else:
   d=one(n);sourceProof=G.symbolic({**q,'answer':q['sourceAnswer']},0,d*d/16)
  if i!=24:
   assert q['sourceAnswer']is None and q['options']==[]and q['openAnswerText'];assert re.search(r'Дұрыс жауап:\s*'+sourceProof['answer']+r'\b',q['openAnswerText']);assert re.search(r'Жауабы:\s*'+sourceProof['answer']+r'\b',q['solution'])
  else:assert len(q['options'])==4 and one(o['text']for o in q['options']if o['correct'])==q['sourceAnswer']
  proof=solve(r);assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution'])
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad)
  except(AssertionError,ValueError):keys+=1
  else:raise AssertionError(('wrongkeyaccepted',i))
  raw=(ROOT/('frontend/public'+r['image'])).read_bytes();node=ET.fromstring(raw)
  if i in{9,10}:
   path=next(p for p in node.findall('.//s:path',NS)if p.attrib['fill']=='#8295f3');path.set('fill','#ffffff')
  elif i in{15,16,17}:cell=one(node.findall('.//s:rect[@id="cell-0"]',NS));cell.set('width',str(F(cell.attrib['width'])-1))
  else:path=one(node.findall('.//s:path[@id="left-hole"]',NS));path.set('d',path.attrib['d'].replace('A 70 70','A 69 69'))
  try:solve(r,ET.tostring(node))
  except(AssertionError,ValueError):coordinate_canaries+=1
  else:raise AssertionError(('figure data mutation accepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':sourceProof,'rewritten':proof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All6source rasters/full source/new text/full solutions/availableMCQs read; actual equal sector arcs and fills, cell edge multiplicities/single boundary/flood fill, semicircle radii containment/disjointness and exact π polynomial identities computed. Actual figure mutations and wrong keys rejected; same root, no separate human review.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':proof['sha256'],'method':'Original native SVG; actual coordinate/arc/fill/cell data checked, all6archived source rasters viewed, final343px previews visually inspected. No original image/tracing used.'}})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)π]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':6,'sourceAnswerFieldNull':5,'sourceOpenReviewAnswersAvailable':5,'allSourceNewFullTextAndAvailableMCQsRead':6,'wrongKeysRejected':keys,'actualFigureDataMutationsRejected':coordinate_canaries,'originalFigures':6,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':6,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
