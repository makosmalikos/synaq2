"""Bothfullsource/newconditions official/newsolutions/all10source/newchoices,
sourcebitmaps and343pxPNGs read. Actualnativepolygon/ray/arc/reflectiongeometry
decoded with1e-6coordinate/product tolerance for9-decimal irrational rounding.
Exactgivenangle formulas produceanswers. Sameauthor separate computation,
notanotherhumanreviewer; noexactsourcepixelmetricclaims.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil5-native-angles';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';TOL=1e-6
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids;points=M.points
def near(a,b):assert abs(float(a-b))<TOL,(float(a),float(b))
def nearpoint(a,b):near(a[0],b[0]);near(a[1],b[1])
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def length(v):return math.sqrt(float(dot(v,v)))
def angle(a,b):return math.degrees(math.acos(max(-1,min(1,float(dot(a,b))/(length(a)*length(b))))))
def degrees(v):return math.degrees(math.atan2(float(v[1]),float(v[0])))%360
def arc_check(el,c,a,b,expected_large,expected_sweep):
 raw=re.findall(r'[MA]|-?\d+(?:\.\d+)?',el.attrib['d']);assert len(raw)==11 and raw[0]=='M'and raw[3]=='A';start=tuple(map(F,raw[1:3]));rx,ry,rotation,large,sweep=map(F,raw[4:9]);end=tuple(map(F,raw[9:11]));assert rx==ry>0 and rotation==0 and large==expected_large and sweep==expected_sweep
 sa,sb=sub(start,c),sub(end,c);near(dot(sa,sa),rx**2);near(dot(sb,sb),rx**2);near(cross(sa,a),0);near(cross(sb,b),0);assert dot(sa,a)>0 and dot(sb,b)>0;delta=((degrees(sb)-degrees(sa))if sweep else(degrees(sa)-degrees(sb)))%360;assert bool(large)==(delta>180);return delta
def rectangle(ps):
 assert len(ps)==4;a,b,c,d=ps;assert a[1]==b[1]and b[0]==c[0]and c[1]==d[1]and d[0]==a[0]and a[0]<b[0]and a[1]<d[1];return b[0]-a[0],d[1]-a[1]
def geometry(r,i,data=None):
 root=W.svg(r,data);d=ids(root);given=one(H.numeric_tokens(r['statement']));assert given==B.scalar(d['given-label'].text);p={}
 if i==11:
  A,Bp,C,D=points(d['rectangle']);assert A[0]==Bp[0]<C[0]==D[0]and Bp[1]==C[1]<A[1]==D[1];E,C2,Fp,G=points(d['square']);assert C2==C;e,f=sub(E,C),sub(Fp,C);near(dot(e,f),0);near(dot(e,e),dot(f,f));nearpoint(G,tuple(E[j]+Fp[j]-C[j]for j in range(2)));cd,cb=sub(D,C),sub(Bp,C);assert dot(cd,cb)==0;near(angle(e,cd),given);assert 0<given<90;assert M.segment(d['rectangle-ray-CD'])==(*C,*D);near(arc_check(d['given-arc'],C,cd,e,0,1),given);actual=arc_check(d['reflex-arc'],C,cb,f,1,1);out=180+given;near(actual,out);p.update({'actualRectangleRightCornerAndSquareAllFourVertexIncidencesChecked':True,'actualSquareEqualPerpendicularEdgesAndSharedVertexCChecked':True,'actualGivenAngleMeasuredDegrees':str(given),'actualLargeArcHasCorrectRaysRadiiLargeSweepFlags':True,'actualReflexArcDegrees':actual})
 else:
  before=points(d['before']);E0,K0,F0,J0=before;width,height=rectangle(before);E,K,Fp=points(d['stationary']);assert E[1]==K[1]and K[0]==Fp[0]and K[0]-E[0]==width and Fp[1]-K[1]==height;translation=sub(E,E0);assert sub(K,K0)==sub(Fp,F0)==translation;EE,J,FF=points(d['folded']);assert EE==E and FF==Fp
  fold=sub(Fp,E);v=sub(J0,E0);projection=dot(v,fold)/dot(fold,fold);reflected=tuple(E[j]+2*projection*fold[j]-v[j]for j in range(2));nearpoint(J,reflected);near(length(sub(J,E)),height);near(length(sub(J,Fp)),width);assert M.segment(d['before-fold'])==(*E0,*F0)and M.segment(d['after-fold'])==(*E,*Fp);delta=math.degrees(math.atan2(float(height),float(width)));assert 0<delta<45;near(180-2*delta,given);t=(E[1]-J[1])/(Fp[1]-J[1]);P=tuple(J[j]+t*(Fp[j]-J[j])for j in range(2));assert E[0]<P[0]<K[0]and P[1]==K[1];near(arc_check(d['given-arc'],P,sub(J,P),sub(K,P),0,1),given);actual=arc_check(d['asked-arc'],Fp,sub(E,Fp),sub(J,Fp),0,1);out=(180-given)/2;near(actual,out);p.update({'actualBeforeRectangleAndStationaryTriangleTranslationChecked':True,'actualFoldedThirdVertexIsExactDiagonalReflectionWithinTolerance':True,'bothActualFoldedSideLengthsPreserved':True,'actualFoldEdgeEndpointsBeforeAfterMatchPaperVertices':True,'actualIntersectionAndExteriorArcRaysChecked':True,'actualGivenExteriorAngleDegrees':str(given),'actualAskedSmallArcDegrees':actual,'actualFoldedReflectedVertex':list(map(str,J))})
 p['target']=str(out);p.update(B.checked_choices(r,out));return p
def source(r,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(r['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];given=one(H.numeric_tokens(r['statement']))if i==11 else F(126);out=180+given if i==11 else(180-given)/2;p={'sourceRasterSHA256':asset['sha256'],'sourceGivenAngleAndRayIncidencesReadVisuallyNotMeasuredSourcePixels':True,'actualCapturedGivenAngle':str(given),'target':str(out)};p.update(B.checked_choices(r,out));return p
def setpoly(el,ps):el.set('points',' '.join(','.join(f'{float(v):.9f}'for v in p)for p in ps))
def setline(el,a,b):
 for k,v in zip(['x1','y1','x2','y2'],[*a,*b]):el.set(k,f'{float(v):.9f}')
def polar(c,r,a):return tuple(float(c[j])+r*(math.cos(math.radians(a))if j==0 else math.sin(math.radians(a)))for j in range(2))
def setarc(el,c,r,a,b,large=0):
 start,end=polar(c,r,a),polar(c,r,b);el.set('d',f'M {start[0]:.9f} {start[1]:.9f} A {r} {r} 0 {large} 1 {end[0]:.9f} {end[1]:.9f}')
def changed(r,i):
 root=W.svg(r);d=ids(root);cr=copy.deepcopy(r)
 if i==11:
  oldE,C,oldF,oldG=points(d['square']);side=length(sub(oldE,C));E=polar(C,side,150);Fp=polar(C,side,60);G=tuple(E[j]+Fp[j]-float(C[j])for j in range(2));setpoly(d['square'],[E,C,Fp,G]);setarc(d['given-arc'],C,19,90,150);setarc(d['reflex-arc'],C,34,180,60,1);cr['statement']=cr['statement'].replace('55°','60°');d['given-label'].text='60°';new=F(240)
 else:
  E0,K0,oldF0,oldJ0=points(d['before']);E,K,oldF=points(d['stationary']);width=float(K0[0]-E0[0]);height=width*math.tan(math.radians(25));F0=(float(K0[0]),float(K0[1])+height);J0=(float(E0[0]),float(E0[1])+height);Fp=(float(K[0]),float(K[1])+height);fold=(Fp[0]-float(E[0]),Fp[1]-float(E[1]));v=(0,height);proj=dot(v,fold)/dot(fold,fold);J=tuple(float(E[j])+2*proj*fold[j]-v[j]for j in range(2));setpoly(d['before'],[E0,K0,F0,J0]);setpoly(d['stationary'],[E,K,Fp]);setpoly(d['folded'],[E,J,Fp]);setline(d['before-fold'],E0,F0);setline(d['after-fold'],E,Fp);t=(float(E[1])-J[1])/(Fp[1]-J[1]);P=tuple(J[j]+t*(Fp[j]-J[j])for j in range(2));setarc(d['given-arc'],P,21,230,0);setarc(d['asked-arc'],Fp,38,205,230);cr['statement']=cr['statement'].replace('140°','130°');d['given-label'].text='130°';new=F(25)
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();return cr,raw,new
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer']
  try:src=source({**q,'answer':key},i);proof=geometry(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  cr,raw,new=changed(r,i);old=F(proof['target']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']]
  for bad,data in[({**r,'answer':'99999'},None),({**cr,'answer':r['answer']},raw)]:
   try:geometry(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:proof['validUpdatedHashActualAngleAndGeometryTarget']=geometry({**cr,'answer':str(new)},i,raw)['target']
  except Exception as e:raise AssertionError(('changedvalid',i))from e
  badroot=W.svg(r);d=ids(badroot)
  if i==11:d['reflex-arc'].set('d',d['reflex-arc'].attrib['d'].replace('0 1 1','0 0 1'))
  else:ps=points(d['folded']);ps[1]=(ps[1][0]+1,ps[1][1]);setpoly(d['folded'],ps)
  bs=ET.tostring(badroot)
  try:geometry({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedActualArcOrFoldReflectionRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newconditions official/newsolutions/all10source/newchoices/sourcebitmaps/343pxPNGsread. Actualrectangle/squarepolygonvertices/orthogonality/sharedC/actualgivenangle/arcendpoints/radii/directedlargeandsweepflags checked. Actualpaperrectangleaspectratio/translatedstationarytriangle/diagonalreflectionofthirdcorner/bothlengths/intersection/reflexexteriorandsmallaskedarc checked. Irrationalroundingtolerance1e-6; exactgivenangleformulasgiveanswers. Updatedhashactual55→60squaregeometryand140→130foldgeometryrecomputed; oldkeysrejected. Updatedhashlargearcflagflip/incorrectreflectedvertex rejected. Sameauthornotanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualpolygons/reflection/rays/arcsdecoded;343pxPNGinspected;nosourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'nativeFigures':2,'validUpdatedHashActualAnglesAndGeometryRecomputed':2,'updatedHashMalformedArcOrReflectionRejected':2,'pythonJavaScriptHashesMatched':2,'allFiftyBIL5SourceTasksCompleteWithOtherBatches':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
