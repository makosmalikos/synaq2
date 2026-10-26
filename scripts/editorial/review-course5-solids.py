"""26 full source/new conditions official/new solutions and36 choices read.
25 available saved pictures and26 own343px SVGs inspected. Source12 picture
unavailable: complete official solution explicitly records22/4/3; reconstruction
disclosed. Exact nets measured, contacts and grid boundaries enumerated, tilings
and disjoint reassembly checked. Same author computational check, not another
human. Standard+ local only. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course5-solids';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-remainders-zeroes.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
import math
spg=importlib.util.spec_from_file_location('geo','scripts/editorial/course5-geometry-tools.py');G=importlib.util.module_from_spec(spg);spg.loader.exec_module(G)
INDICES=[0,1,3,4,6,9,11,12,14,17,18,19,20,21,22,27,28,29,31,32,33,34,39,43,44,46]
# Read from all25 actual saved pictures, independent of the authored JS.12 image is unavailable.
SOURCE_DIMS={1:[8,5,3],3:[4,3,2],4:[7,4,3],6:[4],9:[5,3,2],11:[5,3,2],12:[22,4,3],14:[24,18,12],17:[20,14,3],18:[3],19:[2,5],21:[9,5],22:[6],27:[5,3,2],28:[3],29:[3],31:[6,2],32:[3,4],33:[4,2],34:[20,3],39:[6,4,3],43:[9,4],44:[2,4],46:[5,4,18]}
def parse(r,i,src=False):
 g=INDICES[i]
 if src:return list(map(F,SOURCE_DIMS.get(g,[])))
 return[E.calc(x)for x in H.math_parts(r['statement'],False)if re.fullmatch(r'[0-9]+',x)]
def meta(r,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());return root,ids,json.loads(ids['geometry'].text)
def geometry(r,i,raw=None):
 root,ids,m=meta(r,raw);g=INDICES[i];v=parse(r,i)
 def txt(id):return''.join(ids[id].itertext())
 assert list(map(F,json.loads(ids['actual-inputs'].text)))==v
 for j,value in enumerate(v):assert E.calc(txt('value-'+str(j)))==value and txt('input-'+str(j))
 def rect(id,x,y,w,h):
  for k,a in zip(['x','y','width','height'],[x,y,w,h]):assert abs(F(ids[id].get(k))-a)<F(1,10**9),(g,id,k)
 def points(id):return[[F(a)for a in p.split(',')]for p in ids[id].get('points').split()]
 def polygon(id,expected):
  p=points(id);assert len(p)==len(expected)
  for a,b in zip(p,expected):assert all(abs(x-y)<F(1,10**9)for x,y in zip(a,b))
 if m['type']=='cuboid-net':
  a,b,h=map(F,m['dimensions']);assert min(a,b,h)>0;s=min(300/(2*a+2*b),190/(2*b+h));x=F(25);y=25+b*s;widths=[a,b,a,b];xx=x
  for j,w in enumerate(widths):rect('net-face-'+str(j),xx,y,w*s,h*s);xx+=w*s
  rect('net-face-4',x,y-b*s,a*s,b*s);rect('net-face-5',x,y+h*s,a*s,b*s)
  if g in[3,9]:
   for j in range(6):
    rw=widths[j]if j<4 else a;rh=h if j<4 else b;assert len([k for k in ids if k.startswith('grid-v-'+str(j)+'-')])==rw-1 and len([k for k in ids if k.startswith('grid-h-'+str(j)+'-')])==rh-1
  expected=([v[0]/2-v[2],v[2],v[1]]if g==12 else[v[2]-2*v[1],v[1],v[0]]if g==46 else v if g in[27,39]else None)
  if expected:assert list(map(F,m['dimensions']))==expected
 elif m['type']=='cuboid':
  a,b,h=map(F,m['dimensions']);s=min(270/(a+F(2,5)*b),155/(h+F(3,10)*b));p=lambda x,y,z:[35+s*(x+F(2,5)*y),200-s*(z+F(3,10)*y)]
  polygon('front',[p(0,0,0),p(a,0,0),p(a,0,h),p(0,0,h)]);polygon('side',[p(a,0,0),p(a,b,0),p(a,b,h),p(a,0,h)]);polygon('top',[p(0,0,h),p(a,0,h),p(a,b,h),p(0,b,h)])
  if g in[1,4,11]:assert[a,b,h]==v
  if g==14:assert[a*h,a*b,b*h]==v
  if g in[0,20]:
   labels='KLMNPQRS'if g==0 else'TUVWXYZA';assert ''.join(txt('vertex-'+j)for j in map(str,range(8)))==labels;assert 'hidden-edges'in ids and'hidden-vertical'in ids
 elif m['type']=='cells':
  cells=list(map(tuple,m['cells']));assert len(cells)==len(set(cells));w=max(x for x,y in cells)+1;h=max(y for x,y in cells)+1;s=min(F(290,w),F(185,h));assert len([k for k in ids if re.fullmatch(r'cell-\d+',k)])==len(cells)
  for j,(x,y)in enumerate(cells):rect('cell-'+str(j),30+x*s,25+y*s,s,s)
  if g in[6,18,29]:assert G.valid(cells)and m['unit']==v[0]
  if g==19:assert len(cells)==v[1]and m['unit']==v[0]
  if g in[32,44]:rows,cols=map(int,v);assert set(cells)==set(itertools.product(range(cols),range(rows)))
  if g==33:n,unit=map(int,v);assert set(cells)=={(x,y)for y in range(n)for x in range(y+1)}and m['unit']==unit
 elif m['type']=='cut-card':
  a,b,cut=map(F,m['dimensions']);assert [a,b,cut]==(v if g==17 else[v[0],v[0],v[1]])and 0<2*cut<min(a,b);s=min(295/a,190/b);rect('card',30,25,a*s,b*s)
  for j,(x,y)in enumerate([(0,0),(a-cut,0),(0,b-cut),(a-cut,b-cut)]):rect('cut-'+str(j),30+x*s,25+y*s,cut*s,cut*s)
 elif m['type']=='cut-rectangle':
  a,b=map(F,v);assert m['dimensions']==v;s=min(290/a,180/b);rect('paper',30,25,a*s,b*s);el=ids['cut-line'];assert F(el.get('y1'))==25 and abs(F(el.get('y2'))-(25+b*s))<F(1,10**9)and F(el.get('x1'))==F(el.get('x2'))
 elif m['type']=='diagonal-square':
  assert m['side']==v[0];rect('square',85,25,180,180);assert ids['diagonals'].get('d')=='M85 25L265 205M265 25L85 205';polygon('quarter',[[85,205],[265,205],[175,115]])
 elif m['type']=='frame':
  a,b=map(F,v);assert m['dimensions']==v and a>b;s=180/(a+b)
  for j,(x,y,w,h)in enumerate([(b,0,a,b),(a,b,b,a),(0,a,a,b),(0,0,b,a)]):rect('frame-'+str(j),85+x*s,25+y*s,w*s,h*s)
 elif m['type']=='stair-cut':
  a,b=map(F,v);assert m['dimensions']==v and m['cut']==[[a/3,0],[a/3,b/2],[2*a/3,b/2],[2*a/3,b]];scale=290/a;rect('paper',30,25,a*scale,b*scale);polygon('stair-cut',[[30+x*scale,25+y*scale]for x,y in m['cut']])
 else:raise AssertionError(m)
 return m

def compute(r,i,src=False):
 g=INDICES[i];v=parse(r,i,src);p={'actualPrintedOrPixelInputs':list(map(str,v))};m=None if src else meta(r)[2]
 if g in[0,20]:
  labels='ABCDEFGH'if src else'KLMNPQRS'if g==0 else'TUVWXYZA';coords=[(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)];loc=dict(zip(labels,coords))
  if g==0:
   asked='AB'if src else one(re.findall(r'([A-Z]{2}) қырына',r['statement']));a,b=map(loc.get,asked);axis=one(k for k in range(3)if a[k]!=b[k]);pair=[c for c in coords if all(c[k]==1 for k in range(3)if k!=axis)];out=''.join(labels[coords.index(c)]for c in pair)
  else:
   asked='ABFE'if src else one(re.findall(r'([A-Z]{4}) алдыңғы',r['statement']));out=''.join(x for x in labels if x not in asked)
  p['actualLabelCoordinates']={k:list(v)for k,v in loc.items()};p['asked']=asked
 elif g in[1,4,11,27,39]:
  a,b,c=v;out=a*c if g==1 else 4*(a+b+c)if g==4 else a+b+c if g==11 else 2*(a*b+a*c+b*c)if g==27 else 4*(a+b+c)-(3*c+2*a)
 elif g in[3,9]:
  dims=v if src else[F(x)*v[0]for x in m['dimensions']];a,b,c=dims;out=tuple(dims)if g==3 else 2*(a*b+a*c+b*c);p['netDimensions']=list(map(str,dims))
 elif g==6:a=one(v);out=6*a*a
 elif g==12:strip,h,b=v;a=strip/2-b;assert a>0;out=a*b*h;p['derivedLength']=str(a)
 elif g==14:
  front,top,side=v;sq=front*top/side;a=F(math.isqrt(int(sq)));assert a*a==sq;b=top/a;c=front/a;out=4*(a+b+c);p['derivedDimensions']=list(map(str,[a,b,c]))
 elif g in[17,34]:
  a,b,cut=v if g==17 else[v[0],v[0],v[1]];assert 2*cut<min(a,b);out=(a-2*cut)*(b-2*cut)*cut;p['baseDimensions']=list(map(str,[a-2*cut,b-2*cut]))
 elif g in[18,29]:
  cells=[(0,1),(1,1),(2,1),(3,1),(1,0),(1,2)]if src else list(map(tuple,m['cells']));assert G.valid(cells);edges=G.boundary(cells);out=len(edges)*one(v);p['boundaryEdges']=len(edges)
 elif g==19:
  unit,n=v;cells={(0,1),(1,1),(2,1),(1,0),(1,2)}if src else set(map(tuple,m['cells']));assert len(cells)==n;contacts=sum((x+1,y)in cells for x,y in cells)+sum((x,y+1)in cells for x,y in cells);exposed=6*n-2*contacts;out=exposed*unit*unit;p['joinedContacts']=contacts;p['exposedUnitFaces']=str(exposed)
 elif g==21:a,b=v;out=2*(a+b)+2*b
 elif g==22:a=one(v);out=a*a/2
 elif g==28:
  cells={(x,y)for y,(start,n)in enumerate([(2,3),(1,4),(1,5),(0,6)])for x in range(start,start+n)}if src else set(map(tuple,m['cells']));per=one(v);assert per==3;out=F(len(cells),3);tiling=G.tile(cells,[[(0,0),(1,0),(0,1)]]*int(out));assert tiling is not None;p['actualCongruentTiling']=tiling;p['cellCount']=len(cells)
 elif g==31:a,b=v;assert a>b;out=(a-b)**2;p['outerArea']=str((a+b)**2);p['fourRectanglesArea']=str(4*a*b)
 elif g in[32,44]:
  rows,cols=map(int,v);allRects=[(x,y,w,h)for x in range(cols)for y in range(rows)for w in range(1,cols-x+1)for h in range(1,rows-y+1)if g==44 or w==h];out=F(len(allRects));p['allRectangleOrSquareWitnesses']=[list(t)for t in allRects]
 elif g==33:n,unit=v;cells={(x,y)for y in range(int(n))for x in range(y+1)};out=len(G.boundary(cells))*unit;p['boundaryEdges']=len(G.boundary(cells))
 elif g==43:
  a,b=map(int,v);area=a*b;side=math.isqrt(area);assert side*side==area and a%3==b%2==0;left={(x,y)for y in range(b)for x in range(a//3 if y<b//2 else 2*a//3)};right=set(itertools.product(range(a),range(b)))-left;moved={(x-a//3,y-b//2)for x,y in right};assert not left&moved and len(left|moved)==area and len({x for x,y in left|moved})==len({y for x,y in left|moved})==side;out=F(side);p['disjointReassemblyCellsChecked']=area
 elif g==46:h,b,triple=v;a=triple-2*b;assert a>0;out=a*b*h;p['derivedLength']=str(a)
 else:raise AssertionError(g)
 if g not in[0,3,20]:assert F(out).denominator==1 and out>0
 p['calculatedAnswer']=fmt(out,i);return out,p

def representation(s,i):
 g=INDICES[i]
 if g in[0,20]:return''.join(sorted(s.replace('$','')))
 if g==3:
  return tuple(E.calc(x)for x in H.math_parts(s,True))if'$'in s else tuple(F(x.strip())for x in s.split(','))
 if '$'in s:return E.calc(H.math_parts(s,True)[0])
 return E.calc(s)
def fmt(out,i):return', '.join(str(int(x))for x in out)if INDICES[i]==3 else out if INDICES[i]in[0,20]else str(int(out))
def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);g=INDICES[i];expected=representation(fmt(out,i),i);assert representation(r['answer'],i)==expected,('answer',g,r['answer'],expected);opts=C.C.C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len(set(vals))==4 and vals.count(expected)==1;p['allActualOptions']=list(map(str,vals));v=parse(r,i,src);roles=None
  if g==1:a,b,c=v;roles=[a*b,b*c,out,2*(a+c)]
  elif g==11:a,b,c=v;roles=[out,out*2,out*4,a*b]
  elif g==19:a,n=v;roles=[out,n*6*a*a,(n*6-6)*a*a,20*a*a]
  elif g==22:a=one(v);roles=[a*a/4,out,a*a,2*a]
  elif g==27:a,b,c=v;roles=[out,out/2,a*b*c,2*a*c]
  elif g==43:a,b=v;roles=[a+b,F(a+b,2),out,a*b]
  if roles is not None:assert vals==roles,('optionRoles',g,vals,roles)
 if not src and check_figure:geometry(r,i)
 return p

def changed(r,i):
 g=INDICES[i]
 if g in[0,20]:
  cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'].replace('KL қырына','LM қырына')if g==0 else r['statement'].replace('TUYX алдыңғы','UVZY алдыңғы');out,_=compute(cr,i);cr['answer']=fmt(out,i);cr['solution']='Жаңа геометриялық тексеру.';return cr
 if g==43:
  cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'].replace('«18»','«27»').replace('«8»','«12»');out,_=compute(cr,i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген есеп.';return cr
 if g==28:
  # Change the actual shape rather than making a three-cell corner have a different cell count.
  return None
 for m in re.finditer(r'«([^»]+)»',r['statement']):
  if not m[1].isdigit():continue
  for delta in range(1,101):
   cr=copy.deepcopy(r);cr.pop('options',None);cr['statement']=r['statement'][:m.start(1)]+str(int(m[1])+delta)+r['statement'][m.end(1):]
   try:
    out,_=compute(cr,i)
    if representation(fmt(out,i),i)!=representation(r['answer'],i):cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген есеп.';return cr
   except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noMutation',g))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==26;entries=[];evidence=[];choices=0;exact=0;remainders=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])and q['solution']
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);
  except Exception as e:raise AssertionError(('source/new',i))from e
  if cr is None:
   cr=copy.deepcopy(r);cr.pop('options',None);cr['answer']='9';
  else:solve(cr,i,check_figure=False)
  try:pass
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
  if INDICES[i]==28:
   tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};m=json.loads(ids['geometry'].text);m['cells']=[[x,y]for x,y in itertools.product(range(6),range(5))];ids['geometry'].text=json.dumps(m);changedRaw=ET.tostring(tree);cr['figureSha256']=hashlib.sha256(changedRaw).hexdigest();originalMeta=meta
   def changedMeta(rr,raw=None):return originalMeta(rr,changedRaw)if rr.get('figureSha256')==cr['figureSha256'] and raw is None else originalMeta(rr,raw)
   globals()['meta']=changedMeta;out,_=compute(cr,i);cr['answer']=fmt(out,i);solve(cr,i,check_figure=False);
   try:solve({**cr,'answer':r['answer']},i,check_figure=False)
   except AssertionError:pass
   else:raise AssertionError('Stale triomino count accepted')
   globals()['meta']=originalMeta;assert cr['answer']=='10'
  for bad in[{**r,'answer':'999999999'}]+([{**cr,'answer':r['answer']}]if INDICES[i]!=28 else[]):
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('staleKeyAccepted',i))
  for kind in['input','geometry']:
   tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')}
   if kind=='input':
    if 'value-0'in ids:ids['value-0'].text='999'
    else:ids['vertex-0'].text='X'
   else:
    target=next(e for e in tree.iter()if e.tag.split('}')[-1]in['rect','polygon']and e.get('id'))
    if target.tag.split('}')[-1]=='rect':target.set('width','999')
    else:target.set('points','0,0 1,0 1,1')
   wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
   try:geometry(bad,i,wrong)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('rehashedCorruptionAccepted',i,kind))
  for expr in H.math_parts(q['solution'],True):
   if '='not in expr:continue
   try:vals=[N.exact_power_arithmetic(s)for s in expr.split('=')]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(vals))==1,('sourceArithmetic',i,expr);exact+=len(vals)-1
  if INDICES[i]==12:src['missingSourceImage']='Unavailable saved image;22cm strip,4cm height,3cm width explicitly reconstructed from complete official solution; new givens self contained.'
  else:
   mf=json.loads((ROOT/'problems/sources/zerek/courses/image-manifest.json').read_text())['files'];im=one(x for x in mf if x['src'].split('/questions/')[-1]==q['images'][0]['src'].split('/questions/')[-1]);src['inspectedSourceImageSha256']=hashlib.sha256((ROOT/'problems/sources/zerek/courses'/im['file']).read_bytes()).hexdigest()
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'26 own SVGs rendered343px inspected;25 available source pictures inspected. Actual polygon vertices, cuboid-net rectangles, grid cells, cutouts and frame dimensions verified;12 missing source raster disclosed. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==36
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':26,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':25,'nativeSVGs':26,'actualInputMutationsChecked':26,'updatedHashWrongVisibleInputsRejected':26,'rehashedIncorrectDiagramsRejected':26,'sourceExactArithmeticEqualities':exact,'sourceRemainderQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':26,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
