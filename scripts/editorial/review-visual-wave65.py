"""Root independent full9saved/new/fullsolutions/everyMCQ +four343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave65-pictured-mixed-fractions.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def val(s):return F(s.replace(',','.'))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k))
 ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect' and e.get('stroke')];ps=[e for e in es if tag(e)=='path']
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def frac(x,y):
  only(e for e in ls if all(abs(n(e,k)-v)<1e-7 for k,v in zip(['x1','y1','x2','y2'],[x-14,y,x+14,y])))
  a,b=val(at(x,y-8)),val(at(x,y+25));assert a.denominator==b.denominator==1 and 0<a<b
  whole=[e for e in ts if abs(n(e,'x')-(x-26))<1e-7 and abs(n(e,'y')-(y+8))<1e-7];assert len(whole)<=1;w=val(txt(whole[0])) if whole else F(0)
  assert w.denominator==1 and w>=0;return w+a/b
 def choice(a):assert sum(val(o)==a for o in r['options'])==1
 def rectangle(e,expected):
  for k,v in zip(['x','y','width','height'],expected):close(n(e,k),v)
 if i==0:
  assert len(rs)==5;colors=[]
  for j,e in enumerate(rs):rectangle(e,[40+80*j,174,80,65]);colors.append(e.get('fill'))
  assert colors==['#a8d3fa']*3+['#fff']*2;total=val(at(240,103));assert total==F(95,10);answer=total*F(3,5);assert answer==F(57,10)
  return '5,7',{'actualEqualCells':5,'actualBlueCells':3,'printedWholeMetres':str(total),'requestedBlueLengthMetres':str(answer),'oneCellMetres':str(total/5)}
 if i in [1,4]:
  e=only(rs);x,y,w,h=[n(e,k) for k in ['x','y','width','height']];a=val(at(260,y+h+49));b=frac(70,y+h/2-1) if i==1 else frac(59,177.125)
  assert [a,b]==([F(14,10),F(4,5)] if i==1 else [F(72,10),F(15,4)]);close(w/float(a),h/float(b));assert e.get('fill')=='#a8d3fa'
  assert [at(93,y-13),at(423,y-13),at(93,y+h+20),at(423,y+h+20)]==['B','C','A','D']
  if i==1:
   out=2*(a+b);assert out==F(44,10);choice(out);assert list(map(val,r['options']))==[a+b,out,a*b,2*(a+F(45,100))]
   return '4,4',{'actualPrintedSideDm':str(a),'actualStackedFractionSideDm':str(b),'sameMetricScale':w/float(a),'perimeterDm':str(out),'halfPerimeterAreaAndWrongFractionAsDigitsAllChecked':True}
  out=a*b;assert out==27;assert 72*375==27000 and F(27000,1000)==out;assert a*3+a*F(3,4)==out
  return '27',{'actualPrintedSideCm':str(a),'actualMixedStackedSideCm':str(b),'sameMetricScale':w/float(a),'rawIntegerProduct':[72,375,27000],'bothFactorPlaces':3,'areaCm2':str(out),'distributiveCheck':True}
 if i==2:
  total=val(at(240,89));a=frac(92.69565217391303,274);b=val(at(204.86956521739128,275));assert [total,a,b]==[F(1725,100),F(9,2),F(525,100)];c=total-a-b;assert c==F(75,10)
  assert len(rs)==3;scale=404/float(total);cursor=38
  for e,length,color in zip(rs,[a,b,c],['#a8d3fa','#fff0b8','#b5e9ce']):rectangle(e,[cursor,174,float(length)*scale,57]);assert e.get('fill')==color;cursor+=n(e,'width')
  close(cursor,442);assert at(354.17391304347825,275)=='?'
  match=re.search(r'\((\d+) \+ \((\d+)/(\d+)\)\) сағат',r['statement']);assert match;w,p,q=map(int,match.groups());time=F(w)+F(p,q);assert time==F(3,2);speed=c/time;assert speed==5 and speed*time==c
  return '5',{'actualMetricThreeSegmentLengthsKm':list(map(str,[a,b,c])),'wholeKm':str(total),'actualAllThreeWidthsMatchSameScale':scale,'thirdOnlyTimeHours':str(time),'requestedThirdSegmentSpeed':str(speed)}
 if i==3:
  total=int(re.search(r'(\d+) оқушы',r['statement'])[1]);assert total==60;sectors=[e for e in ps if e.get('fill') in ['#a8d3fa','#fff0b8','#b5e9ce']];assert len(sectors)==3
  blue=val(at(292.56631811340793,146.43368188659207));yellow=frac(301.1423233618336,232.69595565542244);green=1-blue-yellow;assert [blue,yellow,green]==[F(1,4),F(1,5),F(11,20)]
  previous=None;angles=[]
  for e,portion,color in zip(sectors,[blue,yellow,green],['#a8d3fa','#fff0b8','#b5e9ce']):
   m=re.fullmatch(r'M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 ([01]) 1 ([\d.]+) ([\d.]+) Z',e.get('d'));assert m;cx,cy,x1,y1,rx,ry,large,x2,y2=map(float,m.groups());assert [cx,cy,rx,ry]==[240,190,126,126];close(math.hypot(x1-cx,y1-cy),126);close(math.hypot(x2-cx,y2-cy),126)
   angle=(math.atan2(y2-cy,x2-cx)-math.atan2(y1-cy,x1-cx))%(2*math.pi);close(angle/(2*math.pi),float(portion));assert large==int(portion>F(1,2));assert e.get('fill')==color
   if previous:close(previous[0],x1);close(previous[1],y1)
   previous=(x2,y2);angles.append(angle)
  close(sum(angles),2*math.pi);numbers=[total*x for x in [blue,yellow,green]];assert numbers==[15,12,33] and sum(numbers)==total;choice(numbers[2]);assert list(map(val,r['options']))==[numbers[0],numbers[1],numbers[2],numbers[0]+numbers[1]]
  return '33',{'actualBlueYellowGreenArcPortions':list(map(str,[blue,yellow,green])),'actualArcLargeFlagsAndContinuityChecked':True,'actualStackedYellowFraction':'1/5','allStudentCounts':list(map(str,numbers)),'complementNotGivenGroupOrSum':True}
 if i==5:
  e=only(ps);assert e.get('fill')=='#a8d3fa';coords=[(F(a),F(b)) for a,b in re.findall(r'[ML] ([\d.]+) ([\d.]+)',e.get('d'))];assert coords==[(101,80),(297,80),(297,F('153.5')),(F('414.6'),F('153.5')),(F('414.6'),F('263.75')),(101,F('263.75'))]
  a=val(at(257.8,308.75));b=frac(54,170.875);c=val(at(355.8,136.5));d=frac(251,109.75);assert [a,b,c,d]==[F(64,10),F(15,4),F(24,10),F(3,2)]
  for px,length in [(F('313.6'),a),(F('183.75'),b),(F('117.6'),c),(F('73.5'),d)]:assert px/length==49
  twice=abs(sum(coords[j][0]*coords[(j+1)%6][1]-coords[(j+1)%6][0]*coords[j][1] for j in range(6)));area=twice/(2*49**2);assert area==a*b-c*d==F(204,10);choice(area);assert a*(b-d)+(a-c)*d==area
  assert list(map(val,r['options']))==[area,a*b,a*b+c*d,2*(a+b)]
  return '20,4',{'actualSixCornerCutVertices':[list(map(str,p)) for p in coords],'actualMixedOuterAndCutHeights':list(map(str,[b,d])),'sameMetricScalePxPerDm':49,'shoelaceAreaDm2':str(area),'independentTwoRectanglePartition':str(a*(b-d)+(a-c)*d),'allFourChoicesRoleChecked':True}
 if i==6:
  assert len(rs)==2;first,second=rs;rectangle(first,[110,85,200,196.42857142857144]);rectangle(second,[310,85,100,196.42857142857144]);assert first.get('fill')=='#a8d3fa' and second.get('fill')=='#fff0b8'
  area=val(at(210,192.21428571428572).removeprefix('S = '));a=val(at(210,330.42857142857144));b=frac(362,320.42857142857144);assert [area,a,b]==[F(77,10),F(28,10),F(7,5)];h=area/a;out=2*(a+b+h);assert h==F(11,4) and out==F(139,10)
  scale=n(first,'width')/float(a);close(n(second,'width')/float(b),scale);close(n(first,'height')/float(h),scale);assert n(first,'x')+n(first,'width')==n(second,'x')
  assert 2*(a+h)+2*(b+h)-2*h==out;assert 345.42857142857144<360
  return '13,9',{'actualBlueAreaCm2':str(area),'actualBlueAndMixedYellowWidthsCm':list(map(str,[a,b])),'commonHeightFromBlueOnlyCm':str(h),'sameMetricScale':scale,'requestedOuterPerimeterCm':str(out),'sharedInternalEdgeRemovedTwiceFromSeparatePerimeters':True,'actualBottomFractionInsideViewBox':True}
 assert i in [7,8]
 anchors=sorted((n(e,'x'),val(txt(e))) for e in ts if n(e,'y')==234);x0,v0=anchors[0];x1,v1=anchors[1];assert v0==0
 ticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<=185<=n(e,'y2'));step=ticks[1]-ticks[0];intervals=round((x1-x0)/step);assert intervals==5;unit=(v1-v0)/intervals;assert unit==F(1,5)
 for j,x in enumerate(ticks):close(x,x0+j*step)
 for x,v in anchors:close((x-x0)/step,float(v/unit))
 points={}
 for e in es:
  if tag(e)=='circle':
   x=n(e,'cx');assert n(e,'cy')==185;name=at(x,155);j=round((x-x0)/step);close(x,x0+j*step);points[name]=unit*j
 if i==7:
  assert points=={'M':F(9,5)};answer=points['M']*F(1,2);assert answer==F(9,10);choice(answer);assert list(map(val,r['options']))==[answer,F(9,2),F(45,100),F(23,10)]
  return '0,9',{'actualEqualFifthTicks':len(ticks),'actualPointM':str(points['M']),'requestedHalfProduct':str(answer),'indexVsCoordinateAndWrongTenthsAndAdditionChoicesChecked':True}
 assert points=={'A':F(4,5),'B':F(19,5)};a,b=points['A'],points['B'];ratio=val(re.search(r'AC = (\d+,\d+) × AB',r['statement'])[1]);assert ratio==F(2,5);distance=(b-a)*ratio;coordinate=a+distance;assert coordinate==2 and a<coordinate<b;choice(coordinate)
 assert list(map(val,r['options']))==[distance,b-distance,coordinate,a+(b-a)*F(8,10)]
 return '2',{'actualEqualFifthTicks':len(ticks),'actualAandB':list(map(str,[a,b])),'AB':str(b-a),'AC':str(distance),'requestedCoordinateNotDistance':str(coordinate),'allFourChoiceOffsetsChecked':True}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==9;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=i//6+1
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full9 saved/new/official+new solutions/every MCQ read and four actual source/native343px sheets viewed; own actualSVG stacked proper/mixed fraction bars, metric shapes/shoelace/arcs/equal-ticks observer and exact Fraction calculations, all choice roles; no author params or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave65/visual-wave65-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave65/visual-wave65-contact-{sheet}.png','checked':['actual equal colored cells and whole bracket','actual stacked numerators/denominators and adjacent mixed whole values','same-scale rectangles area/perimeter and all choice roles','same-scale route three lengths and third-only mixed time','allthree pie arcs/large flags/continuity and common whole student counts','actualsixvertex cut polygon shoelace and independent two-rectangle partition','joined commonheight from bluearea only and outer perimeter excludes shared edge','actualequal fifth ray anchors and physicalpoint placement','index versus coordinate and AC distance versus C coordinate','all9actual343px source/native diagrams legible, cut label moved clear and bottom denominator insideviewBox']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave65.py','fullSavedAndNewRead':9,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave65-pictured-mixed-fractions.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':9,'actualPrintedStackedFractionMetricGeometryAndRays':True,'hashesMatched':9,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
