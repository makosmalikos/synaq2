"""All3fullsource/newconditions solutions/all15source/newchoices/sourcebitmaps
andall343pxnativePNGs inspected. Same root author separate computation,
notanotherhumanreviewer. Sourceperp falsepairs useconservative±2pixel endpoint
observationintervals; exactrightangle follows sharedsquaregrid horizontalvertical.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-plane';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('p','scripts/editorial/review-bil2-native-plane.py');P=importlib.util.module_from_spec(sp);sp.loader.exec_module(P);M=P.M;B=P.B;H=P.H;E=P.E;one=P.one;W=P.W;ids=P.ids;rect=P.rect;points=P.points;segment=P.segment
ASSETS={38:('09424cd769bd1e7d78438213','d77ed1861515b2db371dcb586083e45a864790655da7ed1c87b855f8465cc315'),39:('824d2fae8600d20ecb7847c6','30062e968ded235e4d00d222a3db5a3ccd5f19f7a5955e10392ad5387756cf38'),47:('47c4509c04599971244029b5','a7c2ffd54be65a454de17fc3c833f79bd8eba87f63ee6faf8e0b82d1ca869f5e')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def xy(e):return tuple(F(e.attrib[k])for k in['cx','cy'])
def vector(p,key):return tuple(b-a for a,b in zip(p[key[0]],p[key[1]]))
def perpendicular_option(value):return one(re.findall(r'([A-E]{2})\s*⊥\s*([A-E]{2})',H.tex(value).replace('\\perp','⊥')))
def dot_bounds(p,k,l):
 u=vector(p,k);v=vector(p,l);parts=[]
 for a,b in zip(u,v):products=[(a+aa)*(b+bb)for aa,bb in itertools.product([-4,4],repeat=2)];parts.append((min(products),max(products)))
 return tuple(sum(v[j]for v in parts)for j in range(2))
def perpendicular(root,opts):
 d=ids(root);gx=[segment(d['grid-x-'+str(k)])for k in range(13)];gy=[segment(d['grid-y-'+str(k)])for k in range(9)];ox,oy=gx[0][0],gy[0][1];scales=[]
 for k,(a,b,c,e)in enumerate(gx):assert a==c and e==oy and b==gy[-1][1];scales.extend([(a-ox)/k]if k else[])
 for k,(a,b,c,e)in enumerate(gy):assert b==e and a==ox and c==gx[-1][0];scales.extend([(oy-b)/k]if k else[])
 u=one(set(scales));assert u>0;ps={key:xy(d['point-'+key])for key in'ABCDE'}
 for key,p in ps.items():
  label=d['label-'+key];assert label.text==key and(F(label.attrib['x'])-p[0])**2+(F(label.attrib['y'])-p[1])**2<22**2
  assert 0<=(p[0]-ox)/u<=12 and 0<=(oy-p[1])/u<=8
 for key in['AC','CD','DE','EA','BE']:
  a,b,c,e=segment(d['edge-'+key]);assert(a,b)==ps[key[0]]and(c,e)==ps[key[1]]
 local={key:((x-ox)/u,(oy-y)/u)for key,(x,y)in ps.items()};values={val:sum(a*b for a,b in zip(vector(local,k),vector(local,l)))for val in opts for k,l in[perpendicular_option(val)]};answer=one(key for key,v in values.items()if v==0);return answer,{'all22ActualSquareGridLinesCalibrated':True,'allActualPointCoordinates':{k:list(map(str,v))for k,v in local.items()},'allFiveActualPointLabelsAndFiveEdgeEndpointPairsChecked':True,'allFiveActualCandidateVectorDotProducts':{k:str(v)for k,v in values.items()}}
def boxes(rects,whole,unit,short,long):
 x,y,w,h=whole;assert min(w,h,unit,short,long)>0;assert len(rects)>=3;assert all(sorted([a/unit,b/unit])==sorted([short,long])and x<=px and y<=py and px+a<=x+w and py+b<=y+h for px,py,a,b in rects)
 for a,b in itertools.combinations(rects,2):assert a[0]+a[2]<=b[0]or b[0]+b[2]<=a[0]or a[1]+a[3]<=b[1]or b[1]+b[3]<=a[1]
 assert sum(a*b for px,py,a,b in rects)==w*h;out=2*(w+h)/unit;return out,{'allActualCongruentRectangleCount':len(rects),'allActualPiecesContainedPairwiseDisjointAndCoverWhole':True,'wholePhysicalWidthAndHeight':list(map(str,[w/unit,h/unit])),'allPhysicalShortLongSides':list(map(str,[short,long]))}
def tiling(root,short,long):
 d=ids(root);rs=[rect(v)for key,v in d.items()if key.startswith('piece-')];whole=rect(d['whole']);a,b,c,e=segment(d['short-dimension']);assert a==c and b==whole[1]and e>b;u=(e-b)/short;a,b,c,e=segment(d['long-dimension']);assert b==e and a==whole[0]and(c-a)/long==u;assert B.scalar(d['short-label'].text)==short and B.scalar(d['long-label'].text)==long;out,p=boxes(rs,whole,u,short,long);p['actualPhysicalLabelsBothDimensionBracketsAndStatementAgree']=True;return out,p
def equation(value):
 lhs,rhs=value.split('=');co,c=E.affine('('+lhs+')-('+rhs+')',('x','y'));assert any(co);scale=next(v for v in co if v);return tuple(v/scale for v in co+[c])
def line_geometry(root):
 d=ids(root);a=segment(d['axis-x']);b=segment(d['axis-y']);assert a[1]==a[3]and b[0]==b[2];ox,oy=b[0],a[1];scales=[]
 for axis,vals in[('x',range(-5,8)),('y',range(-5,4))]:
  for k in vals:
   x1,y1,x2,y2=segment(d[f'grid-{axis}-{k}']);pos=x1-ox if axis=='x'else oy-y1
   assert(x1==x2 if axis=='x'else y1==y2)
   if k:
    scales.append(pos/k);label=d[f'tick-{axis}-{k}'];assert F(label.text)==k
    if axis=='x':assert F(label.attrib['x'])==x1
    else:assert abs(F(label.attrib['y'])-y1)<8
   else:assert pos==0
 unit=one(set(scales));assert unit>0;raw={key:xy(d['point-'+key])for key in'AB'};ps={key:((x-ox)/unit,(oy-y)/unit)for key,(x,y)in raw.items()};a,b,c,e=segment(d['line-AB']);assert(a,b)!=(c,e)
 for key,(x,y)in raw.items():
  assert(c-a)*(y-b)==(e-b)*(x-a)and min(a,c)<=x<=max(a,c)and min(b,e)<=y<=max(b,e);label=d['point-label-'+key];assert label.text==key and(F(label.attrib['x'])-x)**2+(F(label.attrib['y'])-y)**2<22**2
 return ps,{'all22ActualGridLinesAnd20NumberedTicksCalibrated':True,'actualBothAxisPointCoordinates':{k:list(map(str,v))for k,v in ps.items()},'actualLinePassesThroughBothMarkersWithExactCollinearity':True}
def solve(r,i,src=False,data=None,check=True):
 p={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data);opts=B.options(r)
 if i==38:
  if src:
   observed={'A':(F(44),F(278)),'B':(F(94),F(122)),'C':(F(124),F(44)),'D':(F(433),F(185)),'E':(F(433),F(278))};target=one(v for v in opts if perpendicular_option(v)==('AE','ED'));intervals={}
   for val in opts:
    if val==target:continue
    k,l=perpendicular_option(val);lo,hi=dot_bounds(observed,k,l);assert lo>0 or hi<0;intervals[val]=list(map(str,[lo,hi]))
   p.update({'sourceHorizontalAEAndVerticalEDOnSameSquareGridProveExactRightAngle':True,'sourceOtherCandidateDotProductConservativePlusMinus2PixelObservationBounds':intervals,'sourceRasterPointObservationsNotClaimedExactMathematicalCoordinates':True})
  else:target,p2=perpendicular(root,opts);p.update(p2)
  out=target
  if check:assert perpendicular_option(r['answer'])==perpendicular_option(target)
 elif i==39:
  short,long=H.numeric_tokens(r['statement'])
  if src:
   rs=[(F(k*5),F(y),F(5),F(2))for y in[0,7]for k in range(4)]+[(F(k*2),F(2),F(2),F(5))for k in range(10)];out,p2=boxes(rs,(F(0),F(0),F(20),F(9)),F(1),short,long)
  else:out,p2=tiling(root,short,long)
  p.update(p2)
  if check:p.update(B.checked_choices(r,out))
 else:
  if src:ps={'A':(F(4),F(0)),'B':(F(0),F(-3))};p['sourceActualPrintedAxisIntercepts']={k:list(map(str,v))for k,v in ps.items()}
  else:ps,p2=line_geometry(root);p.update(p2)
  coeffs=list(map(equation,opts));assert len(set(coeffs))==5;residuals=[[a*x+b*y+c for x,y in ps.values()]for a,b,c in coeffs];correct=one(j for j,v in enumerate(residuals)if v==[0,0]);out=opts[correct];p['allFiveActualAffineOptionResidualsAtBothPoints']=[[str(v)for v in row]for row in residuals];p['allFiveWholeLineEquationsDistinctUpToNonzeroScale']=True
  if check:assert equation(r['answer'])==coeffs[correct]
 p['target']=str(out);return out,p

def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root)
 if i==38:
  target=(F(169),F(116));v['point-D'].set('cx',str(target[0]));v['point-D'].set('cy',str(target[1]));v['label-D'].set('x','179');v['label-D'].set('y','110')
  for key in['CD','DE']:
   el=v['edge-'+key];suffix='2'if key[1]=='D'else'1';el.set('x'+suffix,str(target[0]));el.set('y'+suffix,str(target[1]))
  answer='AC ⊥ DC'
 elif i==39:
  x,y,_,_=rect(v['whole']);unit=F(6);v['whole'].set('height','78')
  for node in list(root):
   if node.attrib.get('id','').startswith('piece-'):root.remove(node)
  j=0
  for yy,count,w,h in[(0,6,7,3),(3,14,3,7),(10,6,7,3)]:
   for k in range(count):ET.SubElement(root,'{http://www.w3.org/2000/svg}rect',{'id':'piece-'+str(j),'x':str(x+k*w*unit),'y':str(y+yy*unit),'width':str(w*unit),'height':str(h*unit),'fill':'#ded8f4'});j+=1
  v['short-dimension'].set('y2','70');v['long-dimension'].set('x2','96');v['long-label'].set('x','75');d['options']=['100','104','106','110','148'];answer='110'
 else:
  v['point-A'].set('cx','222');v['point-label-A'].set('x','233');v['line-AB'].set('x1','132');v['line-AB'].set('y1','230');v['line-AB'].set('x2','258');v['line-AB'].set('y2','62');d['options']=['−4 × x + 3 × y − 12 = 0','4 × x + 3 × y + 12 = 0','−4 × x + 3 × y + 12 = 0','−3 × x − 8 × y + 8 = 0','3 × x − y + 4 = 0'];answer=d['options'][2]
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,answer

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:_,src=solve({**q,'answer':key},i,True);_,proof=solve(r,i);bad,raw,target=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for cr,cb in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(cr,i,False,cb)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashActualGeometryTarget']=target;root=W.svg(r);v=ids(root)
  if i==38:v['label-D'].text='A'
  elif i==39:v['piece-0'].set('width','85')
  else:v['tick-x-2'].text='3'
  rawbad=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(rawbad).hexdigest()},i,False,rawbad)
  except(AssertionError,ValueError,SyntaxError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformednativegeometryaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All3fullsource/newconditions solutions/all15source/newchoices/sourcebitmaps/all343pxPNGs read. Sourceperp rightanglefromsquaregridhorizontalvertical; allfalsepairsconservative±2pixelendpointintervaldotbounds excludezero, rastercoordsnotclaimedexact. Actualallnativegrids/pointlabels/segmentendpoints andfiveexactvectorproducts, all13congruentrectangles/containment/disjointness/fullcoverage/physicaldimensionbrackets, fullcalibratedline/20ticks/bothpoints/allfiveaffineoptionresiduals checked. TruechangedD/26rectanglecover/Acoordinate geometry canaries recomputed; updatedhashmalformedgeometry rejected. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'ThreeoriginalnativeSVG actualallgrid/point/tiling/linegeometry decoded;all343pxPNGs inspected. No sourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'nativeFigures':3,'wrongKeysRejected':3,'validUpdatedHashActualGeometryCanariesRecomputed':3,'updatedHashMalformedActualGeometryRejected':3,'remainingBIL4SourceTasks':5,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
