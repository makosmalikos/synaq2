"""22 full source/new conditions official/new solutions and76 source/new choices
read.22 source pictures and22 native343px SVGs inspected. Exact oriented folding,
vertex/edge coincidence, die assignments and an independent bitmask exact-cover
solver recompute every candidate. Same author computational review, not another
human reviewer. Standard+ local only; no browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course5-topology';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):
 sp=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
C=module('c','scripts/editorial/review-course4-cube-nets.py');G=module('g','scripts/editorial/course5-geometry-tools.py');H=C.H;one=C.one
INDICES=[2,5,7,8,10,13,15,16,23,24,25,26,30,35,36,37,38,40,41,42,45,47]
SOURCE={int(k):v for k,v in json.loads((ROOT/'problems/editorial/reviews/course5-topology-source-geometry.json').read_text()).items()}
def frames(m):
 cells=list(map(tuple,m['cells']));f=G.fold(cells);norm=C.fold(cells)
 # Separate preexisting cube folder agrees on every face pair independent of global orientation.
 for i,a in enumerate(cells):
  for j,b in enumerate(cells):assert sum(x*y for x,y in zip(f[a][2],f[b][2]))==sum(x*y for x,y in zip(norm[i],norm[j]))
 return f
def normals(m):return{str(l):frames(m)[tuple(p)][2]for p,l in zip(m['cells'],m['labels'])}
def opposite(m,asked):
 n=normals(m);return one(l for l,v in n.items()if v==G.neg(n[str(asked)]))
def det(a,b,c):return a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0])
def cube_valid(m,triple):
 n=normals(m);return det(*(n[str(l)]for l in triple))==-1
# A second exact-cover solver: every legal placement encoded as bits; branch on the
# most constrained uncovered target cell, not the authoring solver's first-piece search.
def tile(target,pieces):
 target=set(map(tuple,target));points=sorted(target);index={p:i for i,p in enumerate(points)}
 if sum(map(len,pieces))!=len(target):return None
 full=(1<<len(points))-1;place=[]
 for piece in pieces:
  masks={}
  for form in G.orientations(piece):
   for tx,ty in points:
    for px,py in form:
     cells={(x+tx-px,y+ty-py)for x,y in form}
     if cells<=target:masks[sum(1<<index[p]for p in cells)]=sorted(cells)
  place.append(masks)
 seen=set()
 def go(mask,left):
  if not left:return[]if mask==full else None
  state=(mask,tuple(left))
  if state in seen:return None
  choices=[]
  for bit in range(len(points)):
   if mask>>bit&1:continue
   opts=[(j,m,c)for j in left for m,c in place[j].items()if m>>bit&1 and not mask&m];choices.append(opts)
  opts=min(choices,key=len)
  for j,m,cells in opts:
   rest=go(mask|m,[k for k in left if k!=j])
   if rest is not None:return[(j,cells),*rest]
  seen.add(state);return None
 return go(0,list(range(len(pieces))))
def compute(d):
 k=d['type'];proof={'type':k}
 if k=='opposite':out=opposite(d['net'],d['asked'])
 elif k in['neighbor-sum','lateral-sum']:
  labels=list(map(str,d['net']['labels']));asked=str(d['asked']);opp=opposite(d['net'],asked);out=str(sum(map(int,labels))-int(asked)-int(opp));proof['opposite']=opp
 elif k=='vertex-max':
  m=d['net'];allv=[(sum(map(int,t)),t)for t in itertools.combinations(m['labels'],3)if abs(det(*(normals(m)[str(l)]for l in t)))==1];assert len(allv)==8;out=str(max(s for s,t in allv));proof['allEightVertexSums']=[{'sum':s,'labels':list(t)}for s,t in allv]
 elif k=='die':
  m=d['net'];labels=m['labels'];unknown=[l for l in labels if not l.isdigit()];known={l:int(l)for l in labels if l.isdigit()};sol=[]
  for values in itertools.permutations(set(range(1,7))-set(known.values())):
   mapping={**known,**dict(zip(unknown,values))}
   if all(mapping[l]+mapping[opposite(m,l)]==7 for l in labels):sol.append(mapping)
  mapping=one(sol);out=str(mapping[d['asked']]);proof['uniqueDieAssignment']=mapping
 elif k in['vertices','edges']:
  cells=d['net']['cells'];points={l:G.vertex(cells,p)for l,p in d['points'].items()};proof['allFoldedPoints']={l:list(p)for l,p in points.items()};asked=d['asked']
  if k=='vertices':out=one(l for l,p in points.items()if l!=asked and p==points[asked])
  else:
   def edge(a,b):return tuple(sorted([points[a],points[b]]))
   # Only actual boundary segments are candidate edges.
   boundaries=set()
   for x,y in map(tuple,cells):
    for a,b in[((x,y),(x+1,y)),((x+1,y),(x+1,y+1)),((x+1,y+1),(x,y+1)),((x,y+1),(x,y))]:
     e=tuple(sorted([a,b]));boundaries.symmetric_difference_update([e])
   target=edge(*asked);labels=list(d['points']);matches=[]
   for a,b in itertools.combinations(labels,2):
    if set([a,b])==set(asked):continue
    if tuple(sorted([tuple(d['points'][a]),tuple(d['points'][b])]))in boundaries and edge(a,b)==target:matches.append(''.join(sorted([a,b])))
   out=one(matches)
 elif k=='net-candidates':
  good=[C.valid(m['cells'])for m in d['nets']];out=str(sum(good)if d['count']else good.index(True)+1);assert sum(good)>0 and(d['count']or sum(good)==1);proof['allCandidateResults']=good
 elif k=='complete-net':
  good=[C.valid([*d['base'],p])for p in d['positions']];assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good
 elif k=='die-candidates':
  good=[all(int(l)+int(opposite(m,l))==7 for l in m['labels'])for m in d['nets']];assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good
 elif k=='cube-candidates':
  good=[cube_valid(d['net'],tr)for tr in d['cubes']];assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good
 elif k=='net-from-cube':
  good=[cube_valid(m,d['cube'])for m in d['nets']];assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good
 elif k=='hole':
  forms=G.orientations(d['hole'],False);good=[G.norm(p)in forms for p in d['pieces']];assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good
 elif k=='congruent-cuts':
  good=[]
  for a,b in d['cuts']:assert not set(map(tuple,a))&set(map(tuple,b));good.append(len(a)==len(b)and G.canonical(a)==G.canonical(b))
  assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good
 elif k=='assemble-rectangle':
  witnesses=[tile(itertools.product(range(w),range(h)),d['pieces'])for h,w in d['choices']];good=[p is not None for p in witnesses];assert sum(good)==1;out=' × '.join(map(str,d['choices'][good.index(True)]));proof['allCandidateResults']=good;proof['exactCoverWitness']=witnesses[good.index(True)]
 elif k=='congruent-tiles':
  witnesses=[tile(d['target'],[p]*d['count'])for p in d['pieces']];good=[p is not None for p in witnesses];assert sum(good)==1;out=str(good.index(True)+1);proof['allCandidateResults']=good;proof['exactCoverWitness']=witnesses[good.index(True)]
 elif k=='redundant-piece':
  w,h=d['target'];witnesses=[tile(itertools.product(range(w),range(h)),[p for j,p in enumerate(d['pieces'])if j!=omitted])for omitted in range(4)];good=[p is not None for p in witnesses];assert sum(good)==1;out=d.get('options',list('JKLM'))[good.index(True)];proof['allCandidateResults']=good;proof['exactCoverWitness']=witnesses[good.index(True)]
 else:raise AssertionError(k)
 if'net'in d and'labels'in d['net']:proof['allFaceNormals']={k:list(v)for k,v in normals(d['net']).items()}
 proof['calculatedAnswer']=out;return out,proof

def read(r,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};d=json.loads(ids['geometry'].text);assert'answer'not in d and'options'not in d;assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());return root,ids,d

def geometry(r,i,raw=None):
 root,ids,d=read(r,raw);k=d['type']
 def txt(id):return''.join(ids[id].itertext())
 def attr(id,key,value):assert abs(F(ids[id].get(key))-F(value))<F(1,10**9),(i,id,key)
 def shape(c,p,x,y,w,h,labels=None,colors=None):
  c=list(map(tuple,c));assert len(c)==len(set(c));xx=min(a for a,b in c);yy=min(b for a,b in c);nx=max(a for a,b in c)-xx+1;ny=max(b for a,b in c)-yy+1;s=min(F(w,nx),F(h,ny));assert len([key for key in ids if re.fullmatch(re.escape(p)+r'-cell-\d+',key)])==len(c)
  for j,(a,b)in enumerate(c):
   rx=x+(a-xx)*s;ry=y+(b-yy)*s
   for key,value in zip(['x','y','width','height'],[rx,ry,s,s]):attr(p+'-cell-'+str(j),key,value)
   assert ids[p+'-cell-'+str(j)].get('fill')==(colors[j]if colors else'#bed5f3')
   if labels:
    id=p+'-label-'+str(j);assert txt(id)==str(labels[j]);attr(id,'x',rx+s/2);attr(id,'y',ry+s/2+6)
  return s,(x-xx*s,y-yy*s)
 def net(m,p,x,y,w,h):return shape(m['cells'],p,x,y,w,h,m.get('labels'))
 def cube(labs,p,x,y,s=55):
  project=lambda a,b,c:[x+s*(a+F(21,50)*b),y-s*(c+F(8,25)*b)]
  for name,points in[('front',[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),('right',[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),('top',[(0,0,1),(1,0,1),(1,1,1),(0,1,1)])]:
   actual=[[F(a)for a in t.split(',')]for t in ids[p+'-'+name].get('points').split()];expected=[project(*pt)for pt in points];assert len(actual)==len(expected)
   for a,b in zip(actual,expected):assert all(abs(v-w)<F(1,10**9)for v,w in zip(a,b))
  for j,name in enumerate(['top','front','right']):assert txt(p+'-'+name+'-label')==str(labs[j])
 if k in['net-candidates','die-candidates','net-from-cube']:
  off=125 if k=='net-from-cube'else 20
  if k=='net-from-cube':cube(d['cube'],'target',145,100,60)
  for j,m in enumerate(d['nets']):x=18+j%2*180;y=off+j//2*200;net(m,'net-'+str(j),x,y,145,145);assert txt('option-'+str(j))==str(j+1)
 elif k=='cube-candidates':
  net(d['net'],'net-0',70,20,240,200)
  for j,labs in enumerate(d['cubes']):cube(labs,'cube-'+str(j),48+j%2*175,330+j//2*140);assert txt('option-'+str(j))==str(j+1)
 elif k=='complete-net':
  joined=[*d['base'],*d['positions']];minx=min(p[0]for p in joined);miny=min(p[1]for p in joined);maxx=max(p[0]for p in joined);maxy=max(p[1]for p in joined);s=min(F(300,maxx-minx+1),F(290,maxy-miny+1))
  for prefix,c in[('base',d['base']),('candidate',d['positions'])]:
   for j,(a,b)in enumerate(c):
    for key,value in zip(['x','y','width','height'],[30+(a-minx)*s,25+(b-miny)*s,s,s]):attr(prefix+'-cell-'+str(j),key,value)
    if prefix=='candidate':assert txt('option-'+str(j))==str(j+1)
 elif k in['vertices','edges']:
  s,(x,y)=net(d['net'],'net-0',50,50,245,245)
  for l,(a,b)in d['points'].items():attr('point-'+l,'cx',x+a*s);attr('point-'+l,'cy',y+b*s);assert txt('point-label-'+l)==l;attr('point-label-'+l,'x',x+a*s-7);attr('point-label-'+l,'y',y+b*s-9)
 elif k=='hole':
  cols,rows=d['board'];allc=[(j%cols,j//cols)for j in range(cols*rows)];colors=['#fff'if p in list(map(tuple,d['hole']))else'#bed5f3'for p in allc];shape(allc,'board',90,20,180,180,colors=colors)
  for j,p in enumerate(d['pieces']):shape(p,'piece-'+str(j),35+j%2*180,240+j//2*140,110,90);assert txt('option-'+str(j))==str(j+1)
 elif k=='congruent-cuts':
  for j,(a,b)in enumerate(d['cuts']):shape([*a,*b],'cut-'+str(j),20+j%2*180,20+j//2*175,145,115,colors=['#bed5f3']*len(a)+['#d0bce9']*len(b));assert txt('option-'+str(j))==str(j+1)
 elif k in['assemble-rectangle','redundant-piece','congruent-tiles']:
  top=20 if k=='assemble-rectangle'else 220
  if k=='congruent-tiles':shape(d['target'],'target',65,20,230,170)
  if k=='redundant-piece':w,h=d['target'];shape([(j%w,j//w)for j in range(w*h)],'target',105,20,150,150,colors=['#fff']*(w*h))
  for j,p in enumerate(d['pieces']):
   x=30 if k=='assemble-rectangle'else 35+j%2*180;y=20+j*125 if k=='assemble-rectangle'else top+j//2*150;shape(p,'piece-'+str(j),x,y,240 if k=='assemble-rectangle'else 110,90);assert txt('piece-name-'+str(j))==(str(j+1)if k=='congruent-tiles'else'JKLM'[j]);attr('piece-name-'+str(j),'y',y+(50 if k=='assemble-rectangle'else 120))
 else:net(d['net'],'net-0',40,35,280,225)
 if d.get('asked')and k not in['vertices','edges']:assert d['asked']in r['statement']
 return d

def representation(s,g,src=False):
 if g==35:
  clean=H.tex(s).replace('×','*').replace(' ','');return tuple(sorted(map(int,clean.split('*'))))
 if src and g==38:return'1'if'жолақ'in s else'2'if'шаршы'in s else'3'if'3'in s else'4'
 clean=H.canon(s).replace('№','').replace(' ','');return''.join(sorted(clean))if g==13 else clean

def solve(r,i,src=False,raw=None,check_figure=True):
 g=INDICES[i];d=SOURCE[g]if src else geometry(r,i,raw)if check_figure else read(r,raw)[2];out,p=compute(d);assert representation(r['answer'],g,src)==representation(out,g),('answer',g,r['answer'],out);opts=C.C.C.choices(r)
 if opts:
  vals=[representation(s,g,src)for s in opts];assert len(vals)==4 and len(set(vals))==4 and vals.count(representation(out,g))==1,('choices',g,vals,out);p['allActualOptions']=opts
 return p

def mutations(d):
 k=d['type'];answer=compute(d)[0];variants=[]
 if k in['opposite','neighbor-sum','lateral-sum','vertex-max','die']:
  for a,b in itertools.combinations(range(6),2):
   m=copy.deepcopy(d);m['net']['labels'][a],m['net']['labels'][b]=m['net']['labels'][b],m['net']['labels'][a];variants.append(m)
 elif k in['vertices','edges']:
  labels=[l for l in d['points']if l not in d['asked']]
  for a,b in itertools.combinations(labels,2):
   m=copy.deepcopy(d);m['points'][a],m['points'][b]=m['points'][b],m['points'][a];variants.append(m)
 elif k=='net-candidates'and d['count']:
  m=copy.deepcopy(d);good=next(j for j,n in enumerate(m['nets'])if C.valid(n['cells']));bad=next(n for n in m['nets']if not C.valid(n['cells']));m['nets'][good]=copy.deepcopy(bad);variants.append(m)
 elif k in['net-candidates','die-candidates','net-from-cube','cube-candidates','complete-net','hole','congruent-cuts','congruent-tiles']:
  key={'cube-candidates':'cubes','complete-net':'positions','hole':'pieces','congruent-cuts':'cuts','congruent-tiles':'pieces'}.get(k,'nets')
  for a,b in itertools.combinations(range(4),2):
   m=copy.deepcopy(d);m[key][a],m[key][b]=m[key][b],m[key][a];variants.append(m)
 elif k=='assemble-rectangle':
  m=copy.deepcopy(SOURCE[35]);variants.append(m)
 elif k=='redundant-piece':
  m=copy.deepcopy(d);m['pieces'][0]=copy.deepcopy(SOURCE[41]['pieces'][0]);variants.append(m)
 for m in variants:
  try:
   new,p=compute(m)
   if new!=answer:return m
  except(AssertionError,ValueError,KeyError):continue
 raise AssertionError(('noActualDiagramMutation',k))

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==22;entries=[];evidence=[];choices=0
 changed=[mutations(read(r)[2])for r in rows];Path('/private/tmp/course5-topology-mutations.json').write_text(json.dumps(changed));js="import fs from'node:fs';import{GEOMETRY,draw}from'./scripts/editorial/course5-topology-models.mjs';const a=JSON.parse(fs.readFileSync('/private/tmp/course5-topology-mutations.json'));for(let i=0;i<a.length;i++){GEOMETRY[i]=a[i];fs.writeFileSync('/private/tmp/course5-topology-mutated-'+i+'.svg',draw(i));}";subprocess.check_call(['node','--input-type=module','-e',js],cwd=ROOT)
 for i,r in enumerate(rows):
  g=INDICES[i];ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];assert q['solution']and len(opts)==len(r.get('options',[]));choices+=len(opts)
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',g))from e
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
  changedRaw=Path('/private/tmp/course5-topology-mutated-'+str(i)+'.svg').read_bytes();cr=copy.deepcopy(r);cr.pop('options',None);cr['figureSha256']=hashlib.sha256(changedRaw).hexdigest();new=compute(changed[i])[0];cr['answer']=new;solve(cr,i,raw=changedRaw);assert representation(new,g)!=representation(r['answer'],g)
  try:solve({**cr,'answer':r['answer']},i,raw=changedRaw)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('StaleActualDiagramAnswer',g))
  proof['changedActualDiagramAnswer']=new;proof['oldKeyRejectedNewKeyAccepted']=True
  for attribute in['width','x']:
   tree=ET.fromstring(raw);el=next(e for e in tree.iter()if e.get('id')and e.tag.split('}')[-1]=='rect');el.set(attribute,str(F(el.get(attribute))+F(1,2)));wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
   try:geometry(bad,i,wrong)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('rehashedBadGeometryAccepted',g))
  try:solve({**r,'answer':'wrong'},i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrongAnswerAccepted',g))
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution'])
  mf=json.loads((ROOT/'problems/sources/zerek/courses/image-manifest.json').read_text())['files'];im=one(x for x in mf if x['src'].split('/questions/')[-1]==q['images'][0]['src'].split('/questions/')[-1]);src['inspectedSourceImageSha256']=hashlib.sha256((ROOT/'problems/sources/zerek/courses'/im['file']).read_bytes()).hexdigest()
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'22 saved pictures and22 own343px previews inspected. Actual SVG cell lattice, labels, vertex coordinates, cube polygons and every tiling candidate checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==76
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':22,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':22,'nativeSVGs':22,'actualDiagramMutationsChecked':22,'staleDiagramKeysRejected':22,'rehashedGeometryCorruptionsRejected':44,'independentExactCoverAndOrientedFolding':True,'pythonJavaScriptHashesMatched':22,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
