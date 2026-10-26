"""All6fullsource/newconditions official/newsolutions/all30choices/sourcebitmaps
and343pxPNGs read. Actualnativecoordinates/physicalgivens/arcflags/primitive
inventory checked. Sameauthor separate computation, notanotherhumanreviewer;
sourcevisualaudit notautomatedrastergeometryextraction.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil6-native-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('a','scripts/editorial/review-bil5-native-angles.py');A=importlib.util.module_from_spec(sp);sp.loader.exec_module(A);M=A.M;B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;ids=M.ids;near=A.near;nearpoint=A.nearpoint;sub=A.sub;dot=A.dot;cross=A.cross;length=A.length;arc_check=A.arc_check;polar=A.polar;setarc=A.setarc;setline=A.setline
pp=importlib.util.spec_from_file_location('p','scripts/editorial/review-bil2-native-plane.py');P=importlib.util.module_from_spec(pp);pp.loader.exec_module(P)
def shape_inventory(root):
 result={'шеңбер':False,'үшбұрыш':False,'шаршы':False,'тіктөртбұрыш':False};counts={'circles':0,'squares':0,'nonsquareRectangles':0,'triangles':0}
 for el in root.iter():
  if 'id'not in el.attrib:continue
  tag=el.tag.split('}')[-1]
  if tag=='circle':assert F(el.attrib['r'])>0;result['шеңбер']=True;counts['circles']+=1
  elif tag=='rect':
   x,y,w,h=M.rect(el);assert w>0 and h>0
   if F(el.attrib.get('rx','0')):continue
   result['шаршы'if w==h else'тіктөртбұрыш']=True;counts['squares'if w==h else'nonsquareRectangles']+=1
  elif tag=='line':
   x,y,xx,yy=M.segment(el);assert(x==xx)!=(y==yy)
  elif tag=='polygon':
   ps=M.points(el);assert len(ps)==3 and P.area(ps)>0;result['үшбұрыш']=True;counts['triangles']+=1
  else:assert tag in['svg','title','g']
 missing=[k for k,v in result.items()if not v];answer=one(missing)if missing else'Барлығы бар';return answer,{'actualPrimitiveInventory':counts,'allActualStraightEdgesAxisAlignedUnlessExplicitTriangle':True,'noImplicitTriangleCanBeFormedFromOnlyAxisAlignedSegmentsAndCircleArcs':not counts['triangles'],'allFourClosedShapePresenceFlags':result}
def geometry(r,i,data=None):
 root=W.svg(r,data);d=ids(root);p={}
 if i==5:
  O=tuple(F(d['intersection'].attrib[k])for k in['cx','cy']);aa,ab,dc,dd=M.segment(d['line-AD']);ba,bb,cc,cd=M.segment(d['line-BC']);av,dv=sub((aa,ab),O),sub((dc,dd),O);bv,cv=sub((ba,bb),O),sub((cc,cd),O);near(cross(av,dv),0);near(cross(bv,cv),0);assert dot(av,dv)<0 and dot(bv,cv)<0;alpha=B.scalar(d['given-label'].text);assert 90<alpha<180;near(arc_check(d['given-arc'],O,av,cv,0,1),alpha);near(arc_check(d['x-arc'],O,cv,dv,0,1),180-alpha);near(arc_check(d['y-arc'],O,dv,bv,0,1),alpha);asked=one(H.math_parts(r['statement'],False));out=E.expr(asked).value({'x':180-alpha,'y':alpha});p['actualGivenAdjacentVerticalAnglesDegrees']=list(map(str,[alpha,180-alpha,alpha]));p['allActualLineOppositeRaysAndThreeArcFlagsChecked']=True
 elif i==6:
  Ap,Bp,Dp=M.points(d['whole-triangle']);Aa,Cp,Dd=M.points(d['asked-triangle']);assert Ap==Aa and Dp==Dd and Bp[1]==Cp[1]==Dp[1]and Bp[0]<Cp[0]<Dp[0]and Ap[0]==Bp[0]and Ap[1]<Bp[1];height=B.scalar(d['height-label'].text);nearbase=B.scalar(d['near-base-label'].text);base=B.scalar(d['asked-base-label'].text);unit=(Bp[1]-Ap[1])/height;assert unit==(Cp[0]-Bp[0])/nearbase==(Dp[0]-Cp[0])/base>0;assert M.segment(d['height'])==(*Ap,*Bp);marker=re.findall(r'[ML]|-?\d+(?:\.\d+)?',d['right-angle'].attrib['d']);assert len(marker)==9 and marker[::3]==['M','L','L'];q=[tuple(map(F,marker[j:j+2]))for j in[1,4,7]];assert q[0][0]==Bp[0]and q[2][1]==Bp[1]and q[0][1]==q[1][1]<Bp[1]and q[1][0]==q[2][0]>Bp[0];out=P.area([Ap,Cp,Dp])/unit**2;assert out==height*base/2;p['allActualCollinearBasePointsExteriorHeightAndRightMarkerChecked']=True;p['actualPhysicalHeightNearBaseTargetBase']=list(map(str,[height,nearbase,base]));p['shoelaceAreaAgreesWithIndependentBaseHeightFormula']=True
 elif i==8:
  axis=M.segment(d['axis']);assert axis[1]==axis[3]and axis[0]<axis[2];ticks=[]
  for k,v in d.items():
   if k.startswith('tick-'):
    label=d['value-'+k.removeprefix('tick-')];value=F(label.text);x,y,xx,yy=M.segment(v);assert x==xx and y<axis[1]<yy and F(label.attrib['x'])==x;ticks.append((value,x))
  assert len(ticks)==7;origin=one(x for value,x in ticks if value==0);unit=one({(x-origin)/value for value,x in ticks if value});assert unit>0 and all(x==origin+value*unit for value,x in ticks);coords={}
  for key in['L','K']:
   circle=d['point-'+key];x,y=[F(circle.attrib[k])for k in['cx','cy']];assert y==axis[1]and axis[0]<x<axis[2];label=d['label-'+key];assert label.text==key and F(label.attrib['x'])==x;coords[key]=(x-origin)/unit
  out=abs(coords['K']-coords['L']);p['allSevenActualCalibratedTicksAndCommonScaleChecked']=True;p['actualPointCoordinates']={k:str(v)for k,v in coords.items()}
 elif i==9:
  circle=d['outer-circle'];cx,cy,radius=[F(circle.attrib[k])for k in['cx','cy','r']];x,y,w,h=M.rect(d['white-square']);physicalRadius=B.scalar(d['radius-label'].text);side=B.scalar(d['square-label'].text);assert radius>0 and w==h>0 and physicalRadius>0 and side>0;unit=radius/physicalRadius;assert unit==w/side;corners=P.polygon((x,y,w,h));assert all(dot(sub(v,(cx,cy)),sub(v,(cx,cy)))<radius**2 for v in corners);a,b,c,e=M.segment(d['radius']);assert(a,b)==(cx,cy)and dot((c-cx,e-cy),(c-cx,e-cy))==radius**2;pi=E.calc(one(H.math_parts(r['statement'],False)).split('=')[1]);assert 3<=pi<4;out=pi*physicalRadius**2-side**2;p['actualCircleSquareDimensionLabelsAndCommonScaleChecked']=True;p['allActualWhiteSquareCornersStrictlyInsideCircle']=True;p['actualRadiusSegmentCenterAndCircleEndpointChecked']=True;p['physicalRadiusAndSquareSide']=list(map(str,[physicalRadius,side]))
 elif i==36:out,q=shape_inventory(root);p.update(q)
 elif i==50:
  O=tuple(F(d['angle-center'].attrib[k])for k in['cx','cy']);kx,ky,ax,ay=M.segment(d['straight-KA']);k,a=sub((kx,ky),O),sub((ax,ay),O);assert cross(k,a)==0 and dot(k,a)<0;ob=M.segment(d['ray-OB']);od=M.segment(d['ray-OD']);assert ob[:2]==od[:2]==O;b,v=sub(ob[2:],O),sub(od[2:],O);boa=B.scalar(d['label-BOA'].text);dob=B.scalar(d['label-DOB'].text);assert min(boa,dob)>0 and boa+dob<180;near(arc_check(d['given-BOA'],O,a,b,0,0),boa);near(arc_check(d['given-DOB'],O,b,v,0,0),dob);out=180-boa-dob;near(arc_check(d['asked-KOD'],O,v,k,0,0),out);p['allActualStraightOppositeRaysAndTwoInternalRaysChecked']=True;p['allThreeActualArcRaysRadiiAndSweepFlagsChecked']=True;p['actualTwoAdjacentGivenAngles']=list(map(str,[boa,dob]))
 else:raise AssertionError(i)
 p['target']=str(out)
 if i==36:assert B.options(r)==['шеңбер','үшбұрыш','шаршы','тіктөртбұрыш','Барлығы бар']and r['answer']==out
 else:p.update(B.checked_choices(r,out))
 return p
def source(r,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(r['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'sourceVisualGivensReviewedNotExactRasterPixelMeasurements':True};s=r['statement']
 if i==5:alpha=F(132);asked=one(H.math_parts(s,True));out=E.expr(asked).value({'x':180-alpha,'y':alpha});p['sourceVisuallyReadTopAngle']='132'
 elif i==6:height,unused,base=H.numeric_tokens(s);out=height*base/2
 elif i==8:out=F(6)-F(-10);p['sourceVisuallyReadLminus10K6']=True
 elif i==9:radius,side,pi=H.numeric_tokens(s);out=pi*radius**2-side**2
 elif i==36:out='шеңбер';p['sourceFaceBoundaryArcIsOpenUnderHatNotFullCircle']=True;assert B.options(r)==['шеңбер','үшбұрыш','шаршы','тік төртбұрыш','аталған барлық фигуралар бар']and r['answer']==out
 elif i==50:out=F(180-65-55);p['sourceVisuallyReadAdjacentAngles']=[65,55]
 else:raise AssertionError(i)
 p['target']=str(out)
 if i!=36:p.update(B.checked_choices(r,out))
 return p
def changed(r,i):
 root=W.svg(r);d=ids(root);cr=copy.deepcopy(r)
 if i==5:
  O=tuple(F(d['intersection'].attrib[k])for k in['cx','cy']);a,c,b,v=[polar(O,130,angle)for angle in[207,333,153,27]];setline(d['line-AD'],a,v);setline(d['line-BC'],b,c);setarc(d['given-arc'],O,28,207,333);setarc(d['x-arc'],O,38,333,27);setarc(d['y-arc'],O,28,27,153);d['given-label'].text='126°';new=F(234)
 elif i==6:
  for k in['height-label','near-base-label','asked-base-label']:d[k].text=str(2*B.scalar(d[k].text))+' см'
  new=F(176)
 elif i==8:
  d['point-L'].set('cx',str(F(d['point-L'].attrib['cx'])+40));d['label-L'].set('x',str(F(d['label-L'].attrib['x'])+40));new=F(16)
 elif i==9:d['radius-label'].text='12 см';d['square-label'].text='10 см';new=F(332)
 elif i==36:
  el=ET.SubElement(root,'{http://www.w3.org/2000/svg}polygon',{'id':'added-triangle','points':'160,190 200,190 180,225','fill':'#fff','stroke':'#7294c5'});new='Барлығы бар'
 else:
  O=tuple(F(d['angle-center'].attrib[k])for k in['cx','cy']);b=polar(O,140,-45);v=polar(O,140,-120);setline(d['ray-OB'],O,b);setline(d['ray-OD'],O,v);setarc(d['given-BOA'],O,36,0,-45);setarc(d['given-DOB'],O,50,-45,-120);setarc(d['asked-KOD'],O,28,-120,-180)
  for k in['given-BOA','given-DOB','asked-KOD']:d[k].set('d',d[k].attrib['d'].replace(' 0 0 1 ',' 0 0 0 '))
  d['label-BOA'].text='45°';new=F(60)
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();return cr,raw,new
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==6;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=geometry(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  cr,raw,new=changed(r,i)
  if i!=36:old=F(proof['target']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']]
  for bad,bs in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:geometry(bad,i,bs)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:proof['validUpdatedHashActualGivensOrGeometryTarget']=geometry({**cr,'answer':str(new)},i,raw)['target']
  except Exception as e:raise AssertionError(('changedvalid',i))from e
  root=W.svg(r);d=ids(root)
  if i==5:d['y-arc'].set('d',d['y-arc'].attrib['d'].replace(' 0 0 1 ',' 0 1 1 '))
  elif i==6:
   ps=M.points(d['asked-triangle']);ps[0]=(ps[0][0]+1,ps[0][1]);A.setpoly(d['asked-triangle'],ps)
  elif i==8:d['value-4'].text='5'
  elif i==9:d['white-square'].set('width','91')
  elif i==36:d['robot-circle-eye'].set('r','0')
  else:d['given-BOA'].set('d',d['given-BOA'].attrib['d'].replace(' 0 0 0 ',' 0 0 1 '))
  bs=ET.tostring(root)
  try:geometry({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newconditions official/newsolutions/all30source/newchoices/sourcebitmaps/343pxPNGsread. Actualcrossingoppositerays/3arcs/linearcombination; alltrianglevertices/collinearity/exteriorperpendicularheight/commonphysicalscale/openrightmarker/shoelacearea; all7coordinatetickscalibration/actualpointpositions; actualcircle/squarecommonphysicalscale/strictcontainment/radiussegment; actualrobotclosedprimitiveinventory/allaxisalignedstraightsegmentsnotriangles; actualstraightangle/internalrayarcs/flags checked. Validupdatedhashactualgivens/geometrychangesrecomputed; malformedgeometryrejected. Sourcevisualauditnotexactrastermetrics. Sameauthornotanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OwnnativeSVG allactualgeometry/givens decoded;343pxPNGinspected;nosourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':6,'sourceOptionsRead':30,'rewrittenOptionsRead':30,'nativeFigures':6,'validUpdatedHashActualGivensOrGeometryTargetsRecomputed':6,'updatedHashMalformedGeometryRejected':6,'pythonJavaScriptHashesMatched':6,'allFiftyBIL6SourceTasksCompleteWithOtherBatches':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
