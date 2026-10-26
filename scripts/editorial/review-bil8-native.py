"""Final seven BIL8 visual tasks: full source/new conditions official/new
solutions all35 source/new choices, source rasters and 343px native PNGs read.
Actual SVG geometry decoded; source visual evidence not traced or reused.
Same author separate computational review, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil8-native';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,path):
 s=importlib.util.spec_from_file_location(n,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-bil7-native-plane.py');S=module('s','scripts/editorial/review-bil1-native-solids.py');U=module('u','scripts/editorial/review-bil5-native-plane.py');M=A.M;B=A.B;H=A.H;E=A.E;one=A.one;W=A.W;ids=A.ids;points=A.points;segment=A.segment;P=A.P;sub=A.sub;dot=A.dot;near=A.near

def square(ps):
 assert len(ps)==4;es=[sub(b,a)for a,b in zip(ps,ps[1:]+ps[:1])];norm=dot(es[0],es[0]);assert norm>0 and all(dot(v,v)==norm for v in es)and all(dot(a,b)==0 for a,b in zip(es,es[1:]+es[:1]));return norm

def voxels(root):
 d=ids(root);raw={kind:[points(v)for k,v in d.items()if k.startswith('frame-'+kind+'-')]for kind in['front','right','top']};assert all(raw.values());f,t=raw['front'][0],raw['top'][0];U,Z=sub(f[1],f[0]),sub(f[3],f[0]);assert sub(t[1],t[0])==U;V=sub(t[3],t[0]);assert U[0]>0 and U[1]==0 and Z[0]==0 and Z[1]<0 and V[0]>0 and V[1]<0;O=(min(x for p in raw['front']for x,y in p),max(y for p in raw['front']for x,y in p));proj=lambda c:tuple(O[j]+sum(c[k]*[U,V,Z][k][j]for k in range(3))for j in range(2));inv={}
 for c in itertools.product(range(8),repeat=3):q=proj(c);assert q not in inv;inv[q]=c
 actual={kind:set()for kind in raw}
 for kind,polys in raw.items():
  for p in polys:assert len(p)==4 and all(v in inv for v in p);world=tuple(inv[v]for v in p);assert world not in actual[kind];actual[kind].add(world)
 heights={}
 for p in actual['top']:
  x,y,z=p[0];assert z>0 and p==((x,y,z),(x+1,y,z),(x+1,y+1,z),(x,y+1,z))and(x,y)not in heights;heights[x,y]=z
 cells={(x,y,z)for(x,y),h in heights.items()for z in range(h)};assert S.visible(cells)==actual;return cells,{'allActualVoxelFacesDecoded':sum(map(len,raw.values())),'completeVisibleFaceInventoryMatchesSupportedColumns':True,'projectionInjectiveOnAll512CandidateVertices':True},(O,U,V,Z)

def figure(r,i,data=None):
 root=W.svg(r,data);d=ids(root);p={};s=r['statement']
 if i==7:
  tuples=[]
  for j in range(3):
   ps=points(d['triangle-'+str(j)]);assert len(ps)==3 and P.area(ps)>0;top,left,right=ps;assert top[1]<left[1]==right[1]and left[0]<top[0]<right[0];vals=[]
   for k,point in zip(['top','left','right'],ps):
    el=d[f'{k}-{j}'];assert abs(F(el.attrib['x'])-point[0])<20 and abs(F(el.attrib['y'])-point[1])<20;vals.append(F(el.text))
   center=d[f'result-{j}'];assert left[0]<F(center.attrib['x'])<right[0]and top[1]<F(center.attrib['y'])<left[1];tuples.append(vals+[center.text])
  candidates=[k for k in range(3)if all(v[k]+math.prod(v[z]for z in range(3)if z!=k)==F(v[3])for v in tuples[:2])];k=one(candidates);assert tuples[-1][3]=='?';out=tuples[-1][k]+math.prod(tuples[-1][z]for z in range(3)if z!=k);p.update(allActualVertexNumberTuples=[[str(v)for v in row]for row in tuples],uniqueAddedVertexIndex=k)
 elif i==10:
  x,y,w,h=M.rect(d['whole']);assert w==h>0;radius=w/2;expected={'sector-left':[x,y+h,x,y+radius,radius,radius,F(0),F(0),F(1),x+radius,y+h],'sector-right':[x+w,y+h,x+radius,y+h,radius,radius,F(0),F(0),F(1),x+w,y+radius]}
  for k,nums in expected.items():
   path=d[k].attrib['d'];assert re.findall(r'[A-Za-z]',path)==['M','L','A','Z'];actual=list(map(F,re.findall(r'-?\d+(?:\.\d+)?',path)));assert actual==nums
  side=B.scalar(d['side-label'].text);pi=E.calc(one(H.math_parts(s,False)).split('=')[1]);assert side>0 and 3<pi<4;out=2*side+pi*side/2;p.update(actualTwoQuarterCircleArcPathsAndSweepFlagsChecked=True,physicalSide=str(side),actualWhiteStraightBoundaryLength=str(2*side),actualTwoQuarterCircleArcLength=str(pi*side/2))
 elif i==17:
  q=[points(d[f'square-{j}'])for j in range(2)];norm=one({square(ps)for ps in q});a,b,c,e=q[0];aa,bb,cc,ee=q[1];assert e==aa and c==bb;ts=[points(d[f'triangle-{j}'])for j in range(2)]
  for ps,triangle in zip(q,ts):
   assert triangle[0]==ps[1]and triangle[1]==ps[2]and triangle[2][0]>ps[1][0];edges=[sub(v,u)for u,v in zip(triangle,triangle[1:]+triangle[:1])]
   for v in edges:near(dot(v,v),norm)
  assert all(P.disjoint(v,z)for v,z in itertools.combinations(q+ts,2));side=B.scalar(d['side-label'].text);unit=math.sqrt(float(norm))/float(side);perim,z=U.union_perimeter(q+ts);p.update(z);out=F(8)*side;near(perim/unit,out);p.update(actualDisjointSquareAndEquilateralTriangleUnionChecked=True,actualEightOuterEdgesPerimeter=str(out),physicalCommonSide=str(side))
 elif i==22:
  cells,z,frame=voxels(root);p.update(z);width,depth,length=H.numeric_tokens(one(H.math_parts(s,False)));assert width==1 and length>width and depth>0 and depth.denominator==1;outer=int(length+width);inner=outer-2*int(width);assert int(one(re.findall(r'сыртқы қабырғасы (\d+)',s)))==outer and int(one(re.findall(r'ішкі тесігі (\d+)',s)))==inner;assert B.scalar(one(re.findall(r'қалыңдығы ([\d.]+) см',s)))==depth;assert H.numeric_tokens(d['bar-dimensions'].text)==[width,depth,length];expected={(x,y,z)for x,y,z in itertools.product(range(outer),range(outer),range(int(depth)))if x in[0,outer-1]or y in[0,outer-1]};assert cells==expected;out,z=S.surfaces(cells);p.update(z);formula=2*(outer**2-inner**2)+4*(outer+inner)*depth;individual=4*2*(length*width+length*depth+width*depth)-8*width*depth;assert out==formula==individual;p.update(allActualRingCellsAndConditionDimensionsMatch=True,surfaceAreaAgreesWithOuterInnerFaceFormulaAndBarContactSubtraction=True)
 elif i==23:
  squares=[points(d[f'square-{j}'])for j in range(3)];sides=[B.scalar(d[f'side-{j}'].text)for j in range(3)];units=[];origin=squares[0][0];left=origin[0];baseline=origin[1]
  for ps,side in zip(squares,sides):
   square(ps);a,b,c,e=ps;assert a[1]==b[1]==baseline and c[1]==e[1]<baseline and a[0]==e[0]==left and b[0]==c[0]>left;units.append((b[0]-a[0])/side);left=b[0]
  unit=one(set(units));assert unit>0;a,b,c=sides;actual=points(d['shaded']);expected=[squares[0][3],squares[0][2],squares[1][3],squares[2][1],squares[1][1]];assert actual==expected;out=P.area(actual)/unit**2;formula=a*a+b*(b+c)/2-a*(a+b)/2;assert out==formula>0;p.update(actualPhysicalSquareSides=list(map(str,sides)),allActualShadeVerticesAreRequiredSquareCorners=True,shoelaceAreaEqualsIndependentUpperMinusLowerIntegrals=True)
 elif i==26:
  ps=points(d['square']);rs=points(d['rectangle']);norm=square(ps);assert len(rs)==4;es=[sub(b,a)for a,b in zip(rs,rs[1:]+rs[:1])];assert all(dot(a,b)==0 for a,b in zip(es,es[1:]+es[:1]));assert es[0]==tuple(-v for v in es[2])and es[1]==tuple(-v for v in es[3]);w=B.scalar(d['width-label'].text);h=B.scalar(d['height-label'].text);assert w>h>0;unit2=dot(es[0],es[0])/w**2;assert unit2==dot(es[1],es[1])/h**2;assert P.area(rs)==P.area(ps);area=w*h;out=F(math.isqrt(int(area)));assert out*out==area and norm==out*out*unit2;assert d['label-A'].text=='A'and d['label-D'].text=='D';p.update(actualEqualShapeAreasAndCommonPhysicalScaleChecked=True,actualRectangleDimensions=list(map(str,[w,h])))
 else:
  lines=[]
  for j in range(7):lines.append(segment(d[f'vertical-{j}']));lines.append(segment(d[f'horizontal-{j}']))
  x,y,xx,yy=segment(d['horizontal-0']);unit=(xx-x)/6;assert unit>0 and y==yy
  for j in range(7):assert segment(d[f'vertical-{j}'])==(x+j*unit,y,x+j*unit,y+6*unit)and segment(d[f'horizontal-{j}'])==(x,y+j*unit,x+6*unit,y+j*unit)
  cell,total,asked=H.numeric_tokens(re.sub(r'²','',s));assert cell>0 and total==36;k=math.isqrt(int(asked/cell));assert k*k*cell==asked and 1<=k<=6;placements=[(a,b)for a in range(7-k)for b in range(7-k)];out=F(len(placements));assert out==(6-k+1)**2;p.update(allFourteenNativeGridLinesChecked=True,actualRequestedSquareSideCells=k,allRequestedSizeSquareTopLeftWitnesses=[list(v)for v in placements])
 p['target']=str(out);p.update(B.checked_choices(r,out));return p

def source(q,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'visuallyReadSourceGivensAndTopologyNotPixelMetricTracing':True}
 if i==7:
  tuples=[[6,9,4,42],[5,7,3,26],[4,4,7,None]];assert all(t+l*r==answer for t,l,r,answer in tuples[:2]);out=F(4*7+4);p['allSourceTopLeftRightCenterValues']=tuples
 elif i==10:side=F(14);pi=F(22,7);out=2*side+pi*side/2;p['sourceSideAndTwoQuarterCircleRadii']=['14','7','7']
 elif i==17:out=F(8*9);p['sourceExternalEqualEdgeCountAndLength']=[8,9]
 elif i==22:
  width,depth,length=1,1,4;out=F(2*(5**2-3**2)+4*(5+3));assert out==4*2*(4+4+1)-8;p['sourceFrameOuterInnerDepth']=[5,3,1]
 elif i==23:
  a,b,c=F(13),F(22),F(9);out=a*a+b*(b+c)/2-a*(a+b)/2;assert out==F(565,2);p['sourceThreeSquareSides']=[13,22,9]
 elif i==26:out=F(math.isqrt(18*8));assert out*out==18*8;p['sourceRectangleDimensions']=[18,8]
 else:out=F(sum(1 for a,b in itertools.product(range(3),repeat=2)));assert out==(4-2+1)**2;p['sourceFullGridSideAndAskedSquareSideCells']=[4,2]
 p['target']=str(out);p.update(B.checked_choices(q,out));return p

def changed(r,i):
 root=W.svg(r);d=ids(root);cr=copy.deepcopy(r)
 if i==7:d['right-2'].text='4';new=F(42)
 elif i==10:d['side-label'].text='24 см';new=F('85.68')
 elif i==17:d['side-label'].text='12 см';new=F(96)
 elif i==22:
  cells,p,frame=voxels(root);cells|={(x,y,2)for x,y,z in cells};S.redraw(root,'frame',cells,frame);cr['statement']=cr['statement'].replace('1 × 2 × 6','1 × 3 × 6').replace('қалыңдығы 2 см','қалыңдығы 3 см');d=ids(root);d['bar-dimensions'].text='1 × 3 × 6 см';new=F(192)
 elif i==23:
  for j in range(3):d[f'side-{j}'].text=str(2*B.scalar(d[f'side-{j}'].text))+' см'
  new=F(776)
 elif i==26:d['width-label'].text='40 см';d['height-label'].text='10 см';new=F(20)
 else:cr['statement']=cr['statement'].replace('ауданы 9 см²','ауданы 4 см²');new=F(25)
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();old=B.scalar(r['answer']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']];return cr,raw,new

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==7;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=figure(r,i);cr,raw,new=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/change',i))from e
  for bad,data in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:figure(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  try:proof['validChangedActualGeometryOrGivenTarget']=figure({**cr,'answer':str(new)},i,raw)['target']
  except Exception as e:raise AssertionError(('validchange',i))from e
  root=W.svg(r);d=ids(root)
  if i==7:d['top-0'].set('x','1')
  elif i==10:d['sector-left'].set('d',d['sector-left'].attrib['d'].replace('0 0 1','0 1 1'))
  elif i==17:ps=points(d['triangle-0']);ps[2]=(ps[2][0]+1,ps[2][1]);d['triangle-0'].set('points',' '.join(f'{x},{y}'for x,y in ps))
  elif i==22:el=next(iter(d['frame']));ps=points(el);ps[0]=(ps[0][0]+1,ps[0][1]);el.set('points',' '.join(f'{x},{y}'for x,y in ps))
  elif i==23:ps=points(d['shaded']);ps[1]=(ps[1][0]+1,ps[1][1]);d['shaded'].set('points',' '.join(f'{x},{y}'for x,y in ps))
  elif i==26:ps=points(d['square']);ps[0]=(ps[0][0]+1,ps[0][1]);d['square'].set('points',' '.join(f'{x},{y}'for x,y in ps))
  else:d['vertical-6'].set('x2','301')
  bs=ET.tostring(root)
  try:figure({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedNativeGeometryRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All frozen/new full conditions official/new solutions options source rasters read. Own actual SVG vertex values, quarter-arc path commands, disjoint equal-side polygon union, full projected voxel face inventory and six-neighbor surfaces, equal-shape dimensions, shaded polygon shoelace and all fixed-size grid placements independently checked. Valid changed actual givens/geometry targets and malformed updated-hash figures tested. Same author computation.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG decoded and checked; 343px PNG inspected. No source imagery reused.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':7,'sourceOptionsRead':35,'rewrittenOptionsRead':35,'nativeFigures':7,'validChangedActualGeometryOrGivensRecomputed':7,'malformedActualGeometryRejected':7,'pythonJavaScriptHashesMatched':7,'allFiftyBIL8TasksCompleteWithOtherBatch':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
