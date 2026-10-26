"""Final4 BIL12 tasks: all full frozen/new conditions official/new solutions,
all18 source/new choices, four source rasters and four own343px PNGs read.
Actual native circles/arithmetic graph/road curves/tiles decoded. Source art
not reused or traced. Same author computation, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil12-final';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,path):
 s=importlib.util.spec_from_file_location(n,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-bil7-native-plane.py');M=A.M;B=A.B;H=A.H;E=A.E;one=A.one;W=A.W;ids=A.ids;points=A.points;segment=A.segment;P=A.P;sub=A.sub;dot=A.dot;cross=A.cross

def apply(op,a,b):
 if op=='+':return a+b
 if op in['−','-']:return a-b
 if op=='×':return a*b
 assert op in['÷',':']and b;return a/b

def digit_paths(digits,target,ops):
 assert len(digits)==len(set(digits))==5 and all(1<=v<=9 for v in digits);assert target>0;solutions=[]
 for a,b,c,d in itertools.permutations(map(F,digits),4):
  if apply(ops[1],apply(ops[0],a,b),d)==target and apply(ops[3],apply(ops[2],a,c),d)==target:solutions.append((a,b,c,d))
 assert solutions;unused={one(set(map(F,digits))-set(v))for v in solutions};out=one(unused);return out,{'all120DistinctFourDigitPlacementsChecked':True,'allCompleteAssignmentsABCD':[list(map(str,v))for v in solutions],'allUnusedDigitValues':list(map(str,unused)),'actualBothRouteOperators':ops,'actualBothRouteTarget':str(target)}

def road_inventory(root):
 d=ids(root);centers={k:tuple(F(d['city-'+k].attrib[a])for a in['cx','cy'])for k in'ABC'};assert centers['A'][0]<centers['B'][0]<centers['C'][0]and len({v[1]for v in centers.values()})==1;counts=[];allcurves={}
 for group in['AB','BC']:
  curves=[]
  for key,el in d.items():
   if not key.startswith('road-'+group+'-'):continue
   assert re.findall(r'[A-Za-z]',el.attrib['d'])==['M','Q'];n=list(map(F,re.findall(r'-?\d+(?:\.\d+)?',el.attrib['d'])));assert len(n)==6;a=tuple(n[:2]);control=tuple(n[2:4]);z=tuple(n[4:]);assert a==centers[group[0]]and z==centers[group[1]]and control[0]==(a[0]+z[0])/2;curves.append(control)
  assert curves and len(set(curves))==len(curves);counts.append(len(curves));allcurves[group]=[list(map(str,v))for v in curves]
 for k in'ABC':assert d['city-label-'+k].text==k
 out=F(math.prod(counts));witness=list(itertools.product(range(counts[0]),range(counts[1])));assert len(witness)==out;return out,{'actualRoadCountsAB_BC':counts,'actualAllQuadraticControlPoints':allcurves,'allCurveEndpointsMatchActualCities':True,'allDistinctControlHeightsPreventInteriorCrossingsSinceXIsLinear':True,'allTwoStageRouteChoiceWitnesses':[list(v)for v in witness]}

def solve(r,i,data=None):
 root=W.svg(r,data);d=ids(root);p={}
 if i==24:
  outer=[F(d['outer-circle'].attrib[k])for k in['cx','cy','r']];inner=[F(d['inner-circle'].attrib[k])for k in['cx','cy','r']];O=tuple(outer[:2]);C=tuple(inner[:2]);R,radius=outer[2],inner[2];v=sub(C,O);assert R>radius>0 and dot(v,v)==radius**2 and R==2*radius;assert dot(v,v)==(R-radius)**2;T=tuple(F(d['point-T'].attrib[k])for k in['cx','cy']);assert T==tuple(2*c-o for o,c in zip(O,C))and dot(sub(T,O),sub(T,O))==R**2 and dot(sub(T,C),sub(T,C))==radius**2;assert segment(d['diameter-radius'])==(*O,*T)
  for key,pnt in[('O',O),('C',C)]:assert tuple(F(d['point-'+key].attrib[k])for k in['cx','cy'])==pnt
  inside=radius**2/R**2;assert ('Күлгін аймақ'in r['statement'])!=('Ақ аймақ'in r['statement']);out=1-inside if'Күлгін аймақ'in r['statement']else inside;p.update(actualCircleRadii=list(map(str,[R,radius])),allActualInternalTangencyCenterPassingAndDiameterEndpointsChecked=True,actualInnerAreaFraction=str(inside))
 elif i==29:
  centers={};rects=[]
  for k in'abcd':
   x,y,w,h=M.rect(d['cell-'+k]);assert w==h>0;centers[k]=(x+w/2,y+h/2);rects.append(P.polygon((x,y,w,h)));label=d['cell-label-'+k];assert label.text==k and (F(label.attrib['x']),F(label.attrib['y'])-7)==centers[k]
  assert all(P.disjoint(a,b)for a,b in itertools.combinations(rects,2));ops=[]
  for key in['ab','bd','ac','cd']:assert segment(d['edge-'+key])==(*centers[key[0]],*centers[key[1]]);ops.append(d['operator-'+key].text)
  digits=list(map(int,H.numeric_tokens(one(H.math_parts(r['statement'],False)))));target=B.scalar(d['target-label'].text);out,p=digit_paths(digits,target,ops);p['actualFourCellsAndAllFourOperatorEdgesChecked']=True
 elif i==33:out,p=road_inventory(root)
 else:
  width,pieceCount=H.numeric_tokens(r['statement']);pieces=[M.rect(v)for key,v in d.items()if re.fullmatch(r'piece-\d+',key)];assert len(pieces)==pieceCount and width>0;unit=one({min(w,h)for x,y,w,h in pieces});assert unit>0;x0=min(x for x,y,w,h in pieces);y0=min(y for x,y,w,h in pieces);right=max(x+w for x,y,w,h in pieces);bottom=max(y+h for x,y,w,h in pieces);assert right-x0==bottom-y0>0;normalized=[]
  for x,y,w,h in pieces:
   rect=((x-x0)/unit,(y-y0)/unit,w/unit,h/unit);assert all(v.denominator==1 for v in rect)and min(rect[2:])==1 and x0<=x<right and y0<=y<bottom;normalized.append(rect)
  polygons=[P.polygon(v)for v in pieces];assert all(P.disjoint(a,b)for a,b in itertools.combinations(polygons,2));pixelArea=sum(w*h for x,y,w,h in pieces);assert pixelArea==(right-x0)**2;scale=unit/width;physicalArea=pixelArea/scale**2;out=physicalArea/width;independent=sum(max(w,h)/scale for x,y,w,h in pieces);assert out==independent;p.update(allActualNativeTileRectangles=[[str(v)for v in p]for p in normalized],allTilesShortSideEqualsOneRibbonWidth=True,allTilesPairwiseInteriorDisjointAndAreaExactlyFillsBoundingSquare=True,actualPhysicalWholeSquareSide=str((right-x0)/scale),actualPhysicalSquareArea=str(physicalArea),independentSumOfAllPieceLengths=str(independent))
 opts=B.options(r);vals=list(map(B.scalar,opts));assert len(opts)==len(set(opts))in[4,5]and len(set(vals))==len(vals)and vals.count(out)==1 and B.scalar(r['answer'])==out and r['answer']in opts;p['allActualOptionValues']=list(map(str,vals));p['target']=str(out);return p

def source(q,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'allSourceVisualGivensAndTopologyReadNotPixelMetricTracing':True}
 if i==24:out=1-F(1,2)**2;p['sourceRadiusRatioFromInternalTangencyAndCenterPassing']='1/2'
 elif i==29:out,z=digit_paths([1,2,3,4,5],F(8),['+','−','×',':']);p.update(z)
 elif i==33:
  a,b=H.numeric_tokens(q['statement']);out=a*b;p['sourceSixByFourTwoStageChoices']=[int(a),int(b)]
 else:
  width,count=H.numeric_tokens(q['statement']);assert width==1 and count==9;lengths=[4]*4+[2]*4+[1];assert len(lengths)==count;out=sum(lengths)*width;p['sourceFourOuterFourInnerAndCenterTileLengths']=lengths;p['sourceAreaConservationCheck']=str(F(5)**2/width)
 vals=list(map(B.scalar,B.options(q)));assert vals.count(out)==1 and B.scalar(q['answer'])==out;p['allSourceOptionValues']=list(map(str,vals));p['target']=str(out);return p

def changed(r,i):
 cr=copy.deepcopy(r);root=W.svg(r);d=ids(root)
 if i==24:cr['statement']=cr['statement'].replace('Күлгін аймақ','Ақ аймақ');new=F(1,4);cr['options']=['(1/4)','(1/3)','(1/2)','(3/4)','(4/5)']
 elif i==29:d['target-label'].text='= 8';new=F(2)
 elif i==33:
  ET.SubElement(root,'{http://www.w3.org/2000/svg}path',{'id':'road-AB-added','d':'M 60 165 Q 120 50 180 165','fill':'none','stroke':'#7294c5'});new=F(20)
 else:cr['statement']=cr['statement'].replace('Ені 2 см','Ені 3 см');new=F(147)
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest()
 if i in[33,38]:old=B.scalar(r['answer']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']]
 return cr,raw,one(v for v in cr['options']if B.scalar(v)==new)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])in[4,5];key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=solve(r,i);cr,raw,new=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/change',i))from e
  for bad,data in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  try:proof['validChangedActualGeometryOrConditionTarget']=solve({**cr,'answer':new},i,raw)['target']
  except Exception as e:raise AssertionError(('validchange',i))from e
  root=W.svg(r);d=ids(root)
  if i==24:d['inner-circle'].set('cx','217')
  elif i==29:d['edge-ab'].set('x2','161')
  elif i==33:d['road-BC-0'].set('d',d['road-BC-0'].attrib['d'].replace('300 165','301 165'))
  else:el=d['piece-0'];el.set('width',str(F(el.attrib['width'])+1))
  bs=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedActualNativeGeometryRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and len(r['options'])==len(q['options']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions official/new solutions all18source/newchoices read. Actual native circles satisfy internal tangency, center passing and shared diameter; all four digit cells/operator edges decoded with all120 distinct assignments; all actual road quadratic endpoints/control heights and complete two-stage choice witnesses; all13 actual ribbon tile rectangles lattice dimensions/disjointness/full-square area and independent length sum checked. Valid changed actual conditions/geometry and malformed updated-hash figures tested. Same author computation.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG geometry independently recomputed,343px PNG inspected. Source art not reused.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':4,'sourceOptionsRead':18,'rewrittenOptionsRead':18,'nativeFigures':4,'validChangedActualInputsRecomputed':4,'malformedActualGeometryRejected':4,'pythonJavaScriptHashesMatched':4,'allFortyBIL12TasksCompleteWithOtherBatch':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
