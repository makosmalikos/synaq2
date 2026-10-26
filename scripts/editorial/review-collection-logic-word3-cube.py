"""Full saved/new cube condition, full official/new solution, all4options and
archived raster inspected. Same root author separate computational and343px
visual review, not separate human reviewer. All24proper rotations checked.
Source observations record orientation read from raster, not traced output.
New folding and exact whole marker shapes decoded from actual nativeSVG.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-logic-word3-cube';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);one=E.H.one
X=(1,0,0);Y=(0,1,0);Z=(0,0,1)
def neg(a):return tuple(-v for v in a)
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def times(a,n):return tuple(v*n for v in a)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def rotations():
 out=[];axes=[X,Y,Z,neg(X),neg(Y),neg(Z)]
 for x,y in itertools.product(axes,repeat=2):
  if dot(x,y)==0:out.append((x,y,cross(x,y)))
 assert len(out)==24 and all(dot(cross(r[0],r[1]),r[2])==1 for r in out);return out
def rotate(r,v):return tuple(sum(r[j][i]*v[j]for j in range(3))for i in range(3))
def fold(cells):
 frames={(0,0):(X,Y,Z)}
 while len(frames)<len(cells):
  before=len(frames)
  for(x,y),(u,v,n)in list(frames.items()):
   for p,f in[((x+1,y),(neg(n),v,u)),((x-1,y),(n,v,neg(u))),((x,y+1),(u,neg(n),v)),((x,y-1),(u,n,neg(v)))]:
    if p in cells:
     if p in frames:assert frames[p]==f
     else:frames[p]=f
  assert len(frames)>before
 assert len(frames)==6 and len({f[2]for f in frames.values()})==6
 assert all(cross(u,v)==n for u,v,n in frames.values());return frames
def parallel(a,b):return a==b or a==neg(b)
def source_review(q):
 entry=one(x for x in json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files']if x['file']=='images/2e338a14aa44bdc01215e101.png');assert entry['sourceUrl']==one(q['images'])['src'];assert hashlib.sha256((ROOT/'problems/sources/zerek'/entry['file']).read_bytes()).hexdigest()==entry['sha256'];assert q['sourceAnswer']=='B'and len(q['options'])==4 and q['solution']
 # Actual source net local axes (u right,v down); pair pips horizontal,
 # triple pips descending right, side diagonals join the specified corners.
 cells={(0,0):('pair',(1,0)),(0,-1):('one',None),(0,1):('triple',(1,1)),(0,2):('cross',None),(-1,0):('line',(1,-1)),(1,0):('line',(1,1))};frames=fold(cells);faces=[]
 for cell,(kind,axis)in cells.items():
  u,v,n=frames[cell];direction=add(times(u,axis[0]),times(v,axis[1]))if axis else None;faces.append((n,kind,direction))
 # Source candidate axes read from the raster in the visible topZ/leftY/rightX
 # cube frame. They are observations only, never reused as new drawing paths.
 views={'A':[(Z,'one',None),(Y,'cross',None),(X,'line',(0,1,1))],'B':[(Z,'pair',Y),(X,'one',None),(Y,'line',(1,0,1))],'C':[(Z,'triple',(1,-1,0)),(Y,'cross',None),(X,'line',(0,1,1))],'D':[(Z,'pair',Y),(Y,'triple',(1,0,-1)),(X,'line',(0,1,1))]};matches={}
 for label,view in views.items():
  matches[label]=[r for r in rotations()if all(any(rotate(r,n)==N and kind==K and((d is None and D is None)or(d is not None and D is not None and parallel(rotate(r,d),D)))for n,kind,d in faces)for N,K,D in view)]
 answer=one(k for k,v in matches.items()if v);assert answer==q['sourceAnswer'];assert[j for j,o in enumerate(q['options'])if o['correct']]==[['A','B','C','D'].index(answer)];return{'archivedRasterSHA256':entry['sha256'],'all24ProperRotationsCheckedForEveryOption':True,'sourceCandidateRotationCounts':{k:len(v)for k,v in matches.items()},'sourceMarkerAxesDirectlyReadFromRaster':True,'answer':answer}
def xy_points(e):return[tuple(F(x)for x in v.split(','))for v in e.attrib['points'].split()]
def line(e):return tuple(F(e.attrib[a])for a in['x1','y1']),tuple(F(e.attrib[a])for a in['x2','y2'])
def mean(ps):return tuple(sum(p[j]for p in ps)/len(ps)for j in range(len(ps[0])))
def tag(e):return e.tag.rsplit('}',1)[-1]
def canon_points(ps):return tuple(sorted(tuple(v for v in p)for p in ps))
def canon_shapes(shapes):return tuple(sorted(canon_points(s)for s in shapes))
def net(root):
 groups=[e for e in root.iter()if e.attrib.get('id','').startswith('net-')];assert len(groups)==6;observed=[]
 for g in groups:
  rect=one(e for e in g if tag(e)=='rect');x,y,w,h=[F(rect.attrib[k])for k in['x','y','width','height']];assert w==h>0;center=(x+w/2,y+h/2);polys=[xy_points(e)for e in g if tag(e)=='polygon'];circles=[e for e in g if tag(e)=='circle'];lines=[line(e)for e in g if tag(e)=='line'];local=lambda p:((p[0]-center[0])/w,(p[1]-center[1])/h)
  if len(polys)==2:
   assert not circles and not lines;kind='pair';shapes=[[local(p)for p in poly]for poly in polys]
   for poly in shapes:
    assert len(poly)==4;c=mean(poly);assert canon_points(sub(p,c)for p in poly)==canon_points([(-F(1,10),0),(F(1,10),0),(0,-F(1,10)),(0,F(1,10))])
   assert mean([mean(p)for p in shapes])==(0,0);data={'polys':shapes}
  elif len(circles)==1:
   assert not polys and not lines;kind='one';e=one(circles);c=local((F(e.attrib['cx']),F(e.attrib['cy'])));assert c==(0,0);data={'circleCenter':c,'radius':F(e.attrib['r'])/w}
  elif len(circles)==3:
   assert not polys and not lines;kind='triple';cs=[local((F(e.attrib['cx']),F(e.attrib['cy'])))for e in circles];assert mean(cs)==(0,0)and(0,0)in cs;assert all(F(e.attrib['r'])/w==F(13,200)for e in circles);data={'points':cs}
  elif len(lines)==2:
   assert not circles and not polys;kind='cross';ls=[[local(p)for p in l]for l in lines];assert all(mean(l)==(0,0)for l in ls);vectors=[sub(l[1],l[0])for l in ls];assert dot(*vectors)==0 and all(dot(v,v)==F(1,4)for v in vectors);data={}
  else:
   assert len(lines)==1 and not circles and not polys;kind='line';ends=[local(p)for p in one(lines)];assert all(all(abs(v)==F(1,2)for v in p)for p in ends)and mean(ends)==(0,0);data={'ends':ends}
  observed.append({'center':center,'side':w,'kind':kind,**data})
 assert sorted(f['kind']for f in observed)==['cross','line','line','one','pair','triple'];origin=one(f for f in observed if f['kind']=='pair');side=origin['side'];cells={}
 for f in observed:
  assert f['side']==side;cell=tuple(v/side for v in sub(f['center'],origin['center']));assert all(v.denominator==1 for v in cell);cell=tuple(map(int,cell));assert cell not in cells;cells[cell]=f
 frames=fold(cells);faces=[]
 for cell,f in cells.items():
  u,v,n=frames[cell];world=lambda p:add(times(n,F(1,2)),add(times(u,p[0]),times(v,p[1])));face={'n':n,'kind':f['kind']}
  if f['kind']=='pair':face['polys']=[[world(p)for p in poly]for poly in f['polys']]
  elif f['kind']=='one':face.update({'center':world(f['circleCenter']),'radius':f['radius']})
  elif f['kind']=='line':face['ends']=[world(p)for p in f['ends']]
  elif f['kind']=='triple':face['points']=[world(p)for p in f['points']]
  faces.append(face)
 return faces,{'actualNetSquareCount':6,'allNormalsDistinctAfterFold':True,'netCellPatternKinds':{str(k):v['kind']for k,v in cells.items()},'allActualMarkerCoordinatesDecoded':True}
def invert2(a,b,p):
 det=a[0]*b[1]-a[1]*b[0];assert det;return((p[0]*b[1]-p[1]*b[0])/det,(a[0]*p[1]-a[1]*p[0])/det)
def view(group,label):
 els={e.attrib['id']:e for e in group if'id'in e.attrib};t=xy_points(els[label+'-face-top']);l=xy_points(els[label+'-face-left']);r=xy_points(els[label+'-face-right']);assert len(t)==len(l)==len(r)==4
 sx=sub(t[1],t[0]);sy=sub(t[3],t[0]);sz=sub(t[2],l[2]);origin=sub(t[0],sz);assert invert2(sx,sy,sx)==(1,0)
 project=lambda p:add(origin,add(times(sx,p[0]),add(times(sy,p[1]),times(sz,p[2]))))
 assert t==[project(p)for p in[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]]
 assert l==[project(p)for p in[(0,1,1),(1,1,1),(1,1,0),(0,1,0)]]
 assert r==[project(p)for p in[(1,0,1),(1,1,1),(1,1,0),(1,0,0)]]
 top_world=lambda p:(*invert2(sx,sy,sub(sub(p,origin),sz)),F(1))
 def left_world(p):x,z=invert2(sx,sz,sub(sub(p,origin),sy));return(x,F(1),z)
 def right_world(p):y,z=invert2(sy,sz,sub(sub(p,origin),sx));return(F(1),y,z)
 centered=lambda p:sub(p,(F(1,2),)*3)
 marks=[e for e in group if e.attrib.get('class')=='pair-mark'];assert len(marks)==2;polys=[[centered(top_world(p))for p in xy_points(e)]for e in marks];assert all(len(p)==4 for p in polys)
 single=one(e for e in group if e.attrib.get('class')=='single-mark');assert tag(single)=='circle';matrix=list(map(F,re.findall(r'-?\d+(?:\.\d+)?',single.attrib['transform'])));assert len(matrix)==6;a,b,c,d,e,f=matrix;cx,cy=F(single.attrib['cx']),F(single.attrib['cy']);center=(a*cx+c*cy+e,b*cx+d*cy+f);center3=centered(right_world(center));u=invert2(sy,sz,(a,b));v=invert2(sy,sz,(c,d));assert dot(u,u)==dot(v,v)==1 and dot(u,v)==0
 diagonal=one(e for e in group if e.attrib.get('class')=='diagonal-mark');ends=[centered(left_world(p))for p in line(diagonal)];assert all(all(abs(v)==F(1,2)for v in p)for p in ends)
 return[{'n':Z,'kind':'pair','polys':polys},{'n':X,'kind':'one','center':center3,'radius':F(single.attrib['r'])},{'n':Y,'kind':'line','ends':ends}]
def matches(face,obs,rotation):
 if face['kind']!=obs['kind']or rotate(rotation,face['n'])!=obs['n']:return False
 if face['kind']=='pair':return canon_shapes([[rotate(rotation,p)for p in poly]for poly in face['polys']])==canon_shapes(obs['polys'])
 if face['kind']=='one':return rotate(rotation,face['center'])==obs['center']and face['radius']==obs['radius']
 assert face['kind']=='line';return canon_points(rotate(rotation,p)for p in face['ends'])==canon_points(obs['ends'])
def solve(r,raw=None,check_answer=True):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];assert not re.search(rb'<image|<script|href=|foreignObject|data:image',raw);root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 360 540';faces,proof=net(root);groups={e.attrib['id']:e for e in root.iter()if e.attrib.get('id','').startswith('option-')};assert set(groups)=={'option-'+x for x in'ABCD'};valid={}
 for label in'ABCD':
  observed=view(groups['option-'+label],label);valid[label]=[rotation for rotation in rotations()if all(any(matches(face,obs,rotation)for face in faces)for obs in observed)]
 answer=one(k for k,v in valid.items()if v);assert r['options']==list('ABCD')
 if check_answer:assert answer==r['answer'],(answer,r['answer'])
 normals={k:[f['n']for f in faces if f['kind']==k]for k in['pair','one','triple','cross','line']};assert neg(one(normals['pair']))==one(normals['cross'])and neg(one(normals['one']))==one(normals['triple'])and normals['line'][0]==neg(normals['line'][1]);proof.update({'properRotationsEnumerated':24,'determinantOfEveryRotation':1,'candidateMatchingRotationCounts':{k:len(v)for k,v in valid.items()},'wholeMarkShapesMatchedNotJustNormals':True,'oppositePatternsVerified':True,'answer':answer});return proof
def mutations(r):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes();root=ET.fromstring(raw);lower=one(e for e in root.iter()if e.attrib.get('id')=='net-lower');lineEl=one(e for e in lower if tag(e)=='line');lineEl.attrib['x1'],lineEl.attrib['x2']=lineEl.attrib['x2'],lineEl.attrib['x1'];raw1=ET.tostring(root);a=copy.deepcopy(r);a['figureSha256']=hashlib.sha256(raw1).hexdigest()
 root=ET.fromstring(raw)
 for label in'AC':
  group=one(e for e in root.iter()if e.attrib.get('id')=='option-'+label);top=one(e for e in group if e.attrib.get('id')==label+'-face-top');center=mean(xy_points(top));cx=center[0]
  for e in group:
   if e.attrib.get('class')=='pair-mark':e.attrib['points']=' '.join(str(2*cx-x)+','+str(y)for x,y in xy_points(e))
 raw2=ET.tostring(root);b=copy.deepcopy(r);b['figureSha256']=hashlib.sha256(raw2).hexdigest();return[(a,raw1,'B'),(b,raw2,'A')]
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];r=one(rows);q=one(q for q in json.loads((ROOT/r['sourceRefs'][0]['sourceFile']).read_text())['questions']if q['number']==19);src=source_review(q);proof=solve(r);assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
 try:solve({**r,'answer':'B'})
 except AssertionError:pass
 else:raise AssertionError('wrong key accepted')
 altered=[]
 for bad,raw,expected in mutations(r):
  recomputed=solve(bad,raw,False);assert recomputed['answer']==expected
  try:solve(bad,raw)
  except AssertionError:pass
  else:raise AssertionError('changed actual net/option shape accepted')
  altered.append(expected)
 sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(editionHash(JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0]));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==sha
 entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new condition, full official/new solution, every4MCQ and archived raster read. Source face/marker axes independently matched under all24proper rotations. Actual native6square net folded from primitives; complete projected marker polygons, circular mark radius and diagonal endpoints matched under all24proper rotations. Same author, not separate human reviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'All actual net polygons/circles/segments and4projected cube views decoded, full24proper3Drotations verified and343px PNG inspected.'},'notes':[json.dumps(proof,ensure_ascii=False)]};summary={'verified':1,'sourceRasterRead':1,'allSourceAndNewOptionsChecked':8,'properRotationsPerCandidate':24,'sourceCorrect':'B','newCorrect':'C','actualFigureSemanticMutationsRejected':2,'changedFiguresRecomputedKeys':altered,'wrongKeyRejected':1,'wholeNativeMarkerShapesMatched':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
