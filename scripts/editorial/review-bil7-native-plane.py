"""Four BIL7 area tasks: full frozen/new text, solutions and all options read.
Source raster givens visually reviewed, not traced. Own geometry decoded below.
Same author separate computational review; no separate human reviewer.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil7-native-plane';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,path):
 s=importlib.util.spec_from_file_location(n,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
S=module('s','scripts/editorial/review-bil6-native-symbolic.py');P=module('p','scripts/editorial/review-bil2-native-plane.py');M=S.M;B=S.B;H=S.H;E=S.E;one=S.one;W=S.W;ids=S.ids;points=S.points;segment=S.segment;sub=S.sub;dot=S.dot;cross=S.cross;near=S.near

def pi_value(t):
 t=t.replace('\\pi','π').replace('$','').replace(' ','').replace('×','').replace('\\cdot','');assert re.fullmatch(r'\d+(?:[.,]\d+)?π',t),t;return F(t[:-1].replace(',','.'))
def choices(r,out,i):
 vals=[pi_value(v)if i==18 else B.scalar(v)for v in B.options(r)];assert len(vals)==5 and len(set(vals))==5;assert sum(v==out for v in vals)==1;assert (pi_value(r['answer'])if i==18 else B.scalar(r['answer']))==out;assert r['answer'] in B.options(r);return {'allFiveActualOptionValues':list(map(str,vals))}
def geometry(r,i,data=None):
 root=W.svg(r,data);d=ids(root);proof={}
 if i in[11,20]:
  ps=points(d['outline']);S.simple_orthogonal_polygon(ps);edges=list(zip(ps,ps[1:]+ps[:1]));labels={int(k[5:]):B.scalar(v.text)for k,v in d.items()if re.fullmatch(r'edge-\d+',k)};assert len(ps)==(8 if i==11 else 12)and len(labels)==(6 if i==11 else 10);units=[]
  for j,v in labels.items():
   assert v>0;a,b=edges[j];units.append((abs(b[0]-a[0])+abs(b[1]-a[1]))/v)
  unit=one(set(units));assert unit>0;ox=min(x for x,y in ps);oy=min(y for x,y in ps);physical=[((x-ox)/unit,(y-oy)/unit)for x,y in ps];out=P.area(physical)
  if i==11:
   (x0,y0),(x1,y1),(x2,y2),(x3,y3),(x4,y4),(x5,y5),(x6,y6),(x7,y7)=physical
   assert x0==x7==0 and y0==y1==0 and x1==x2 and y2==y3 and x3==x4 and y4==y5 and x5==x6 and y6==y7 and 0<x5<x1<x3 and 0<y2<y6<y4
   independent=x3*y4-(x3-x1)*y2-x5*(y4-y6)
  else:
   (a,b,c,e,f,g,h,j,k,l,m,n)=physical
   assert a[1]==b[1]==0 and a[0]==n[0]==g[0]==h[0]and b[0]==c[0]and c[1]==e[1]==k[1]==l[1]and e[0]==f[0]and f[1]==g[1]and h[1]==j[1]and j[0]==k[0]and l[0]==m[0]==0 and m[1]==n[1]
   assert 0<j[0]<a[0]<b[0]<e[0]and 0<m[1]<c[1]<f[1]<h[1]
   independent=(b[0]-a[0])*c[1]+a[0]*(l[1]-m[1])+(e[0]-b[0])*(f[1]-c[1])+(b[0]-a[0])*(g[1]-c[1])+(h[0]-j[0])*(j[1]-k[1])
  assert out==independent;proof.update(actualPhysicalVertices=[[str(x),str(y)]for x,y in physical],allPrintedDimensionsShareOnePhysicalScale=True,independentDecompositionEqualsShoelace=True,allEdgesOrthogonalAndNonadjacentEdgesDisjoint=True)
 elif i==18:
  outer=[F(d['outer'].attrib[k])for k in['cx','cy','r']];inner=[F(d['inner'].attrib[k])for k in['cx','cy','r']];assert outer[:2]==inner[:2]and outer[2]>inner[2]>0;O=tuple(outer[:2]);R=outer[2];rr=inner[2];a,b,c,e=segment(d['diameter']);A=(a,b);D=(c,e);assert tuple((x+y)/2 for x,y in zip(A,D))==O;assert dot(sub(A,O),sub(A,O))==R**2 and dot(sub(D,O),sub(D,O))==R**2
  ix,iy,cx,cy=segment(d['inner-radius']);wx,wy,dx,dy=segment(d['ring-width']);assert (ix,iy)==O and (wx,wy)==(cx,cy);C=(cx,cy);V=(dx,dy);near(dot(sub(C,O),sub(C,O)),rr**2);near(dot(sub(V,O),sub(V,O)),R**2);near(cross(sub(C,O),sub(V,O)),0);assert dot(sub(C,O),sub(V,O))>0
  diam=B.scalar(d['diameter-label'].text);width=B.scalar(d['width-label'].text);assert diam>2*width>0;unit=2*R/diam;assert (R-rr)/width==unit;near(math.hypot(float(dx-cx),float(dy-cy))/float(width),unit);pr=diam/2;ir=pr-width;out=pr**2-ir**2;proof.update(physicalOuterInnerRadii=list(map(str,[pr,ir])),actualConcentricCirclesDiameterAndCommonRadialSegmentChecked=True,exactPiCoefficientOnly=True)
 else:
  A,Bp,C,D=points(d['square']);Aa,L,Cc,K=points(d['target']);assert A==Aa and C==Cc;edges=[sub(b,a)for a,b in zip([A,Bp,C,D],[Bp,C,D,A])];norm=dot(edges[0],edges[0]);assert norm>0 and all(dot(e,e)==norm for e in edges)and all(dot(e,f)==0 for e,f in zip(edges,edges[1:]+edges[:1]));assert K==tuple((x+y)/2 for x,y in zip(Bp,C))and L==tuple((x+y)/2 for x,y in zip(D,C));side=B.scalar(d['side-label'].text);assert side>0;unit2=norm/side**2;out=P.area([A,L,C,K])/unit2;assert out==side**2-P.area([A,Bp,K])/unit2-P.area([A,D,L])/unit2==side**2/2;proof.update(physicalSquareSide=str(side),allSquareVerticesEdgesRightAnglesAndBothMidpointsChecked=True,shoelaceEqualsSquareMinusTwoTriangles=True)
 proof['target']=str(out);proof.update(choices(r,out,i));return proof

def source(q,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'visualGivensReadNotRasterPixelMetricOracle':True}
 if i==11:out=F(8*7)-F('4.5')-2*3;p['independentSourceTwoCornerCutArea']=str(out)
 elif i==18:out=F(20,2)**2-(F(20,2)-3)**2;p['sourceOuterInnerRadii']=['10','7']
 elif i==19:out=F(8**2)-2*F(8*4,2);p['sourceMidpointTriangleSubtraction']=True
 else:out=F(4*4+4*2+4*2+4*2+2*4);assert out==4*2+8*2+10*2+2*2;p['sourceFiveRectanglesAgreeWithFourHorizontalStrips']=True
 p['target']=str(out);p.update(choices(q,out,i));return p

def mutate(r,i):
 root=W.svg(r);d=ids(root);cr=copy.deepcopy(r)
 if i in[11,20]:
  for k,v in d.items():
   if re.fullmatch(r'edge-\d+',k):v.text=str(2*B.scalar(v.text))
 elif i==18:d['diameter-label'].text='48 см';d['width-label'].text='8 см'
 else:d['side-label'].text='12 см'
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();old=pi_value(r['answer'])if i==18 else B.scalar(r['answer']);new=old*4 if i!=19 else F(72);cr['options']=[str((pi_value(v)if i==18 else B.scalar(v))+new-old)+(' × π'if i==18 else'')for v in r['options']];return cr,raw,new

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=source({**q,'answer':key},i);proof=geometry(r,i)
  cr,raw,new=mutate(r,i)
  for bad,data in[({**r,'answer':'999999'},None),({**cr,'answer':r['answer']},raw)]:
   try:geometry(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  proof['validChangedActualDimensionTarget']=geometry({**cr,'answer':str(new)+(' × π'if i==18 else'')},i,raw)['target'];root=W.svg(r);d=ids(root)
  if i in[11,20]:ps=points(d['outline']);ps[1]=(ps[1][0]+1,ps[1][1]);d['outline'].set('points',' '.join(f'{x},{y}'for x,y in ps))
  elif i==18:d['inner'].set('cx','181')
  else:ps=points(d['target']);ps[-1]=(ps[-1][0]+1,ps[-1][1]);d['target'].set('points',' '.join(f'{x},{y}'for x,y in ps))
  bs=ET.tostring(root)
  try:geometry({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedGeometryRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full frozen/new conditions, official/new solutions and all options read. Own actual geometry and every printed dimension decoded, common physical scale checked, exact areas recomputed two ways. Valid changed actual dimension canaries and malformed geometry checked. Source visual review, not tracing. Same author computational review.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG geometry checked; 343px PNG inspected.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':4,'sourceOptionsRead':20,'rewrittenOptionsRead':20,'nativeFigures':4,'validChangedActualDimensionsRecomputed':4,'malformedActualGeometryRejected':4,'pythonJavaScriptHashesMatched':4,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
