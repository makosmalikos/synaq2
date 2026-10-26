"""Last7 BIL10 tasks: full source/new conditions solutions all35choices read;
five source bitmaps and five own343px native PNGs inspected. Actual SVG decoded,
source art not traced. Universal-order proofs include explicit algebraic signs,
prism visibility checks every angular sector. Same author computation, not human2.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil10-final';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,path):
 s=importlib.util.spec_from_file_location(n,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-bil7-native-plane.py');J=module('j','scripts/editorial/review-bil8-nonvisual.py');M=A.M;B=A.B;H=A.H;E=A.E;one=A.one;W=A.W;ids=A.ids;points=A.points;segment=A.segment;P=A.P;sub=A.sub;dot=A.dot;cross=A.cross;near=A.near

def universal_order(r,src=False):
 cond=one(H.math_parts(r['statement'],src));x,y,lower=[v.strip()for v in H.tex(cond).split('>')];assert x=='x'and y=='y';bound=E.calc(lower);assert bound>0;truth=[];proof=[]
 for original in B.options(r):
  v=re.sub(r'\\+',lambda m:'\\',original);v=re.sub(r'\\sqrt\{([xy])\}',r'√\1',v);v=H.tex(v);left,op,right=re.split(r'([<>])',v)
  if left.strip()=='√x'and right.strip()=='√y':
   good=op=='>';why='Positive square roots preserve strict order: if root(x)<=root(y), squaring nonnegative sides contradicts x>y.'
  else:
   diff=E.expr('('+left+')-('+right+')');positive=[E.expr('x-y'),E.expr('x^2-y^2')];negative=E.expr('1/x-1/y')
   if any(diff.equals(z)for z in positive):good=op=='>';why='x-y>0; x+y>0, so (x-y)*(x+y)>0.'
   elif diff.equals(negative):good=op=='<';why='1/x-1/y=-(x-y)/(x*y)<0 because x*y>0.'
   else:
    assert diff.equals(E.expr('x-2*y+('+str(bound)+')'));good=False;yy=bound+1;xx=2*yy-bound+1;assert xx>yy>bound and diff.value({'x':xx,'y':yy})>0 and op=='<';why={'actualCounterexample':{'x':str(xx),'y':str(yy)},'difference':str(diff.value({'x':xx,'y':yy}))}
  truth.append(good);proof.append({'actualOption':original,'universallyTrue':good,'proof':why})
 out=one(v for v,t in zip(B.options(r),truth)if t);assert r['answer']==out;return out,{'allFiveActualUniversalOptionProofs':proof,'positiveOrderDomainLowerBound':str(bound)}

def prism_visibility(r,src=False):
 s=r['statement'];sides=3 if'үшбұрыш'in s else 6 if'алтыбұрыш'in s else 0;assert sides in[3,6];normals=[F(360*j,sides)for j in range(sides)];critical=sorted({(v+90)%360 for v in normals}|{(v+270)%360 for v in normals});counts=[];witness=[]
 for a,b in zip(critical,critical[1:]+[critical[0]+360]):
  theta=(a+b)/2;visible=[j for j,v in enumerate(normals)if math.cos(math.radians(float(theta-v)))>1e-9];counts.append(len(visible));witness.append({'viewAzimuthDegrees':str(theta%360),'visibleLateralFaceIndices':visible})
 maximum=max(counts);assert maximum==math.ceil(sides/2);out=F(maximum+1);return out,{'allActualBaseNormalAzimuthsDegrees':list(map(str,normals)),'allCriticalOpenVisibilitySectorsChecked':witness,'maximumVisibleLateralFaces':maximum,'oppositeCapsCannotBothBeVisibleAndUpperCapAchievableWithEveryAzimuth':True}

def geometry(r,i,data=None):
 s=r['statement'];p={}
 if i==9:out,p=universal_order(r);p['target']=out;return p
 if i==35:out,p=prism_visibility(r)
 else:
  root=W.svg(r,data);d=ids(root)
  if i==2:
   ps=points(d['square']);O=tuple(F(d['incircle'].attrib[k])for k in['cx','cy']);rad=F(d['incircle'].attrib['r']);assert rad>0;es=[sub(b,a)for a,b in zip(ps,ps[1:]+ps[:1])];norms=[dot(v,v)for v in es]
   for v in norms:near(v,4*rad**2)
   for a,b in zip(es,es[1:]+es[:1]):near(dot(a,b),0)
   center=tuple(sum(v[k]for v in ps)/4 for k in range(2));assert center==O
   for a,b in zip(ps,ps[1:]+ps[:1]):edge=sub(b,a);vec=sub(O,a);near(cross(edge,vec)**2/dot(edge,edge),rad**2)
   x,y,z,w=segment(d['radius']);assert (x,y)==O;near((z-x)**2+(w-y)**2,rad**2);radius=B.scalar(d['radius-label'].text);pi=E.calc(one(H.math_parts(s,False)).split('=')[1]);assert radius>0 and 3<=pi<4;unit=rad/radius;out=(4-pi)*radius**2;near(P.area(ps)/unit**2-pi*radius**2,out);p.update(allFourSquareEdgesRightAnglesAndIncircleTangenciesChecked=True,actualPhysicalRadius=str(radius),exactComplementArea=str(out))
  elif i==6:
   tuples=[]
   for j in range(3):
    x,y,w,h=M.rect(d[f'card-{j}']);assert w>0 and h>0;vals=[]
    for k in range(4):el=d[f'corner-{j}-{k}'];assert F(el.attrib['x'])==x+(w-20 if k%2 else 20)and F(el.attrib['y'])==y+(24 if k<2 else 86);vals.append(F(el.text))
    circle=d[f'middle-{j}'];assert F(circle.attrib['cx'])==x+w/2 and F(circle.attrib['cy'])==y+52;center=d[f'result-{j}'];assert F(center.attrib['x'])==x+w/2 and F(center.attrib['y'])==y+59
    if j<2:assert sum(vals)/4==F(center.text)
    else:assert center.text=='?'
    tuples.append(vals)
   out=sum(tuples[-1])/4;p['allActualCornerNumberTuples']=[list(map(str,v))for v in tuples];p['bothMeanExamplesReplayed']=True
  elif i==21:
   ps=points(d['front']);assert len(ps)==6;a,b,c,e,f,g=ps;width,height,lower,narrow,depth=[B.scalar(d[k].text)for k in['width-label','height-label','lower-height-label','upper-width-label','depth-label']];assert width>narrow>0 and height>lower>0 and depth>0;ux=(b[0]-a[0])/width;uz=(a[1]-g[1])/height;assert ux>0 and uz>0;physical=[((x-a[0])/ux,(a[1]-y)/uz)for x,y in ps];assert physical==[(0,0),(width,0),(width,lower),(narrow,lower),(narrow,height),(0,height)];right=points(d['right-lower']);assert right[0]==b and right[3]==c;shift=sub(right[1],b);assert shift[0]>0 and shift[1]<0
   for key,j,k in[('right-lower',1,2),('right-upper',3,4),('top-lower',2,3),('top-upper',4,5)]:assert points(d[key])==[ps[j],tuple(x+y for x,y in zip(ps[j],shift)),tuple(x+y for x,y in zip(ps[k],shift)),ps[k]]
   assert segment(d['lower-height-guide'])==(F(303),F(153),F(303),F(229)) and segment(d['depth-guide'])==(F(241),F(279),F(286),F(243));facearea=P.area(physical);assert facearea==width*lower+narrow*(height-lower);out=facearea*depth;p.update(allActualSteppedFrontAndFourExtrudedFacesChecked=True,physicalFrontPolygon=[[str(x),str(y)]for x,y in physical],actualProfileArea=str(facearea),actualDepth=str(depth),twoCuboidVolumeEqualsExtrudedShoelaceArea=True)
  elif i==37:
   x,y,xend,yend=segment(d['horizontal-0']);assert y==yend;unit=(xend-x)/7;assert unit>0
   for j in range(8):assert segment(d[f'vertical-{j}'])==(x+j*unit,y,x+j*unit,y+7*unit)and segment(d[f'horizontal-{j}'])==(x,y+j*unit,x+7*unit,y+j*unit)
   ps=points(d['shaded']);grid=[((a-x)/unit,7-(b-y)/unit)for a,b in ps];assert len(grid)==4 and len(set(grid))==4 and all(a.denominator==b.denominator==1 and 0<=a<=7 and 0<=b<=7 for a,b in grid);turns=[cross(sub(b,a),sub(c,b))for a,b,c in zip(grid,grid[1:]+grid[:1],grid[2:]+grid[:2])];assert all(v>0 for v in turns)or all(v<0 for v in turns);side=one(H.numeric_tokens(s));assert side>0;out=P.area(grid)*side**2;p.update(allSixteenActualGridLinesAndLatticePolygonVerticesChecked=True,actualGridPolygonVertices=[[str(x),str(y)]for x,y in grid],physicalCellSide=str(side))
  else:
   O=tuple(F(d['center'].attrib[k])for k in['cx','cy']);clock=d['clock'];assert tuple(F(clock.attrib[k])for k in['cx','cy'])==O;radius=F(clock.attrib['r']);rays=[]
   for key in['hour-hand','minute-hand']:
    a,b,c,e=segment(d[key]);assert(a,b)==O;v=sub((c,e),O);length=math.hypot(*map(float,v));assert 0<length<float(radius);rays.append(tuple(float(z)/length for z in v))
   assert math.hypot(*map(float,sub(segment(d['hour-hand'])[2:],O)))<math.hypot(*map(float,sub(segment(d['minute-hand'])[2:],O)));valid=[]
   for h,m in itertools.product(range(12),range(60)):
    angles=[30*h+F(m,2),6*m];expected=[(math.sin(math.radians(float(a))),-math.cos(math.radians(float(a))))for a in angles]
    if all(abs(x-u)<1e-8 and abs(y-v)<1e-8 for(x,y),(u,v)in zip(rays,expected)):valid.append((h,m))
   h,m=one(valid);assert h>0 and'түске дейінгі'in s;duration=one(H.numeric_tokens(s));out=J.clock_string(F(60*h+m)-duration)
   for j in range(60):
    aa,bb,cc,ee=segment(d[f'tick-{j}']);theta=math.radians(6*j);inner=F(109 if j%5==0 else 117);outer=F(123);assert radius==125;near(aa,O[0]+float(inner)*math.sin(theta));near(bb,O[1]-float(inner)*math.cos(theta));near(cc,O[0]+float(outer)*math.sin(theta));near(ee,O[1]-float(outer)*math.cos(theta))
   p.update(all720AnalogMinuteDisplaysChecked=True,actualClockHourMinute=[h,m],hourHandContinuousMinuteOffsetChecked=True,allSixtyActualTickPositionsChecked=True)
 p['target']=str(out)
 if i==41:assert r['answer']==out and r['answer']in B.options(r)and len(set(B.options(r)))==5
 else:p.update(B.checked_choices(r,out))
 return p

def source(q,i):
 if i==9:out,p=universal_order(q,True);p['target']=out;return p
 if i==35:out,p=prism_visibility(q,True);p['target']=str(out);p.update(B.checked_choices(q,out));return p
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'sourceGivensVisuallyReadNotPixelMetricTracing':True}
 if i==2:radius=H.numeric_tokens(q['statement'])[0];out=(4-3)*radius**2;p['sourceInscribedCircleRadius']='8'
 elif i==6:
  rows=[[11,13,16,12],[8,18,19,11],[14,19,20,11]];assert sum(rows[0])/4==13 and sum(rows[1])/4==14;out=F(sum(rows[-1]),4);p['sourceAllCornerTuples']=rows
 elif i==21:out=F((10*3+2*(6-3))*12);p['sourceWholeWidthHeightLowerHeightUpperWidthDepth']=[10,6,3,2,12]
 elif i==37:ps=[(F(1),F(1)),(F(6),F(1)),(F(5),F(4)),(F(2),F(5))];out=P.area(ps);assert out==20-2-F(3,2)-1-F(3,2);p['sourceLatticeCoordinatesReadWithOfficialExplanation']=[[str(x),str(y)]for x,y in ps]
 else:out=J.clock_string(F(10*60+25)-one(H.numeric_tokens(q['statement'])));p['sourceClockHourMinute']=[10,25]
 p['target']=str(out)
 if i==41:assert J.N.clock(q['answer'])==J.N.clock(out)
 else:p.update(B.checked_choices(q,out))
 return p

def changed(r,i):
 cr=copy.deepcopy(r)
 if i==9:cr['options'][0]='1/x < 1/y';cr['options'][3]='√x < √y';return cr,None,cr['options'][0]
 if i==35:cr['statement']=cr['statement'].replace('үшбұрыш','алтыбұрыш');cr['options']=[str(B.scalar(v)+1)for v in r['options']];return cr,None,'4'
 root=W.svg(r);d=ids(root)
 if i==2:d['radius-label'].text='8 см';new=F(64)
 elif i==6:d['corner-2-3'].text='18';new=F(20)
 elif i==21:
  for key in['width-label','height-label','lower-height-label','upper-width-label','depth-label']:d[key].text=str(2*B.scalar(d[key].text))+' см'
  new=F(4104)
 elif i==37:cr['statement']=cr['statement'].replace('қабырғасы 1 см','қабырғасы 2 см');new=F(72)
 else:cr['statement']=cr['statement'].replace('50 минут','55 минут');new='10:40'
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest()
 if i==41:cr['options']=[J.clock_string(J.N.clock(v)-5)for v in r['options']]
 else:old=B.scalar(r['answer']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']]
 return cr,raw,str(new)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==7;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=geometry(r,i);cr,raw,new=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/change',i))from e
  for bad,data in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:geometry(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  try:proof['validChangedActualConditionOptionsOrGeometryTarget']=geometry({**cr,'answer':new},i,raw)['target']
  except Exception as e:raise AssertionError(('validchange',i))from e
  if r.get('image'):
   root=W.svg(r);d=ids(root)
   if i==2:d['incircle'].set('r','99')
   elif i==6:d['corner-0-0'].set('x','1')
   elif i==21:ps=points(d['right-upper']);ps[1]=(ps[1][0]+1,ps[1][1]);d['right-upper'].set('points',' '.join(f'{x},{y}'for x,y in ps))
   elif i==37:ps=points(d['shaded']);ps[1]=(ps[1][0]+1,ps[1][1]);d['shaded'].set('points',' '.join(f'{x},{y}'for x,y in ps))
   else:d['hour-hand'].set('x2',str(F(d['hour-hand'].attrib['x2'])+1))
   bs=ET.tostring(root)
   try:geometry({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
   except(AssertionError,ValueError):proof['updatedHashMalformedActualGeometryRejected']=True
   else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions official/new solutions all35choices read. Actual SVG circumscribed square/incircle tangencies, every corner value/mean, stepped front polygon/extruded faces/physical dimensions, all grid vertices and clock tick/hand angles independently checked. Universal-order option algebraic sign proofs and all prism normal visibility sectors checked. Valid changed actual conditions/options/geometry and malformed figures tested. Same author computation.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG decoded; 343px PNG inspected. Source raster not reused.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':7,'sourceOptionsRead':35,'rewrittenOptionsRead':35,'nativeFigures':5,'validChangedActualInputsRecomputed':7,'malformedActualGeometryRejected':5,'pythonJavaScriptHashesMatched':7,'allFiftyBIL10TasksCompleteWithOtherBatch':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
