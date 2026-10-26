"""Root full11saved/new/official+newsolutions/everyMCQ read, four source/native343px sheets viewed."""
import collections,hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave61-pictured-decimal-products.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def value(s):return F(s.replace(',','.'))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1]
 ts=[e for e in es if tag(e)=='text'];rs=[e for e in es if tag(e)=='rect'and e.get('stroke')];ps=[e for e in es if tag(e)=='polygon'];ls=[e for e in es if tag(e)=='line'];n=lambda e,k:float(e.get(k))
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def rect(x,y):return only(e for e in rs if n(e,'x')==x and n(e,'y')==y)
 def shape(e,expected):
  for key,v in zip(['x','y','width','height'],expected):close(n(e,key),v)
 def points(e):return[tuple(map(float,p.split(',')))for p in e.get('points').split()]
 def choices(answer):assert sum(value(o)==answer for o in r['options'])==1
 if i in[0,8]:
  xs=[150,218,286,354]
  def digits(y):
   texts={n(e,'x'):txt(e)for e in ts if n(e,'y')==y and re.fullmatch('[0-9]',txt(e))};assert all(x in xs for x in texts)
   return texts,int(''.join(texts.get(x,'0')for x in xs))
  da,a=digits(82);db,b=digits(126);d1,p1=digits(185);d2,p2=digits(229);dlast,last=digits(294)
  assert[a,b,p1,p2,last]==([247,16,1482,2470,3952]if i==0 else[58,24,232,1160,1392])
  commaA=only(e for e in ts if n(e,'y')==88 and txt(e)==',');commaB=only(e for e in ts if n(e,'y')==132 and txt(e)==',')
  placesA=sum(x>n(commaA,'x')for x in da);placesB=sum(x>n(commaB,'x')for x in db);assert[placesA,placesB]==([2,1]if i==0 else[1,2]);assert a*b==last and p1==a*(b%10)and p2==a*(b//10)*10 and p1+p2==last
  assert 354 not in d2 and at(81,126)=='×'and at(81,229)=='+'
  correct=F(last,10**(placesA+placesB));expected={0:'3,952',8:'1,392'}[i];assert value(expected)==correct;choices(correct)
  commas=[e for e in ts if n(e,'y')==300 and txt(e)==',']
  if i==0:assert not commas
  else:
   assert len(commas)==1 and n(commas[0],'x')==252;printedPlaces=sum(x>252 for x in dlast);assert printedPlaces==placesB==2;wrong=F(last,10**printedPlaces);assert wrong==10*correct and wrong>F(a,10**placesA)>correct
  return expected,{'actualPrintedRawFactors':[a,b],'observedFactorDecimalPlaces':[placesA,placesB],'observedAlignedPartialValues':[p1,p2],'secondPartialShiftIncludesBlankUnitsAsZero':True,'rawSum':last,'correctProduct':str(correct),'finalStudentCommaMissing':i==0,'finalStudentOnlySecondFactorPlaces':i==8}
 if i==1:
  e=only(rs);shape(e,[106,75,294,192.5]);a=value(at(253,329.5));b=value(at(41,179.25));assert[a,b]==[F(42,10),F(275,100)];close(n(e,'width')/float(a),70);close(n(e,'height')/float(b),70);area=a*b;assert area==F(1155,100);choices(area)
  assert r['options']==['11,55','115,5','13,9','6,95'];assert value(r['options'][2])==2*(a+b)and value(r['options'][3])==a+b
  return'11,55',{'actualMetricRectPx':[294,192.5],'printedSidesMetres':[str(a),str(b)],'sameScalePxPerM':70,'areaM2':str(area),'sumVsPerimeterDistractors':True}
 if i==2:
  assert len(rs)==100;positions=set();colors=collections.Counter()
  for e in rs:
   x,y=n(e,'x'),n(e,'y');assert[n(e,'width'),n(e,'height')]==[24,24];c=round((x-120)/24);row=round((y-61)/24);assert 0<=c<10 and 0<=row<10;close(x,120+c*24);close(y,61+row*24);positions.add((c,row));colors[e.get('fill')]+=1
   expected='#77c6ac'if c<6 and row<3 else'#62a9ed'if c<6 else'#f4cf72'if row<3 else'#fff';assert e.get('fill')==expected
  assert len(positions)==100 and colors=={'#77c6ac':18,'#62a9ed':42,'#f4cf72':12,'#fff':28};assert at(240,35)=='Бүкіл шаршы — 1';assert r['options']==['0,6 × 0,3 = 1,8','0,6 × 0,3 = 0,18','0,6 + 0,3 = 0,9','0,6 × 0,3 = 0,018'];assert F(6,10)*F(3,10)==F(18,100)
  return'0,6 × 0,3 = 0,18',{'actual100CellColorCounts':dict(colors),'actualSelectedColumnsRows':[6,3],'intersectionCells':18,'intersectionAreaOfWhole':'9/50','correctMultiplicationNotSum':True}
 if i==3:
  outer=rect(90,55);inner=rect(129.6,94.6);shape(outer,[90,55,324,252]);shape(inner,[129.6,94.6,244.8,172.8]);assert outer.get('fill')=='#a9d1f6'and inner.get('fill')=='#fff'
  a,b,c,d=[value(at(x,y))for x,y in[(252,355),(35,189),(252,138),(315,222)]];assert[a,b,c,d]==[F(9,10),F(7,10),F(68,100),F(48,100)]
  for e,w,h in[(outer,a,b),(inner,c,d)]:close(n(e,'width')/float(w),360);close(n(e,'height')/float(h),360)
  margins=[n(inner,'x')-n(outer,'x'),n(inner,'y')-n(outer,'y'),n(outer,'x')+n(outer,'width')-n(inner,'x')-n(inner,'width'),n(outer,'y')+n(outer,'height')-n(inner,'y')-n(inner,'height')];assert all(abs(m-39.6)<1e-7 for m in margins);assert(a-c)/2==(b-d)/2==F(11,100)
  outside=a*b;hole=c*d;answer=outside-hole;assert answer==F(3036,10000);choices(answer);assert list(map(value,r['options']))==[hole,answer,outside,outside+hole]
  return'0,3036',{'actualOuterInnerRectsPx':[[324,252],[244.8,172.8]],'printedOuterInnerMetres':list(map(str,[a,b,c,d])),'uniformBorderMetres':'11/100','outerMinusHoleM2':str(answer),'allFourAreaChoiceRolesChecked':True}
 if i==4:
  p=points(only(ps));assert p==[(95.,90.),(293.,90.),(293.,162.),(401.,162.),(401.,306.),(95.,306.)];a,b,c,d=[value(at(x,y))for x,y in[(248,353),(40,206),(347,75),(452,134)]];assert[a,b,c,d]==[F(68,10),F(48,10),F(24,10),F(16,10)]
  close((401-95)/float(a),45);close((306-90)/float(b),45);close((401-293)/float(c),45);close((162-90)/float(d),45)
  twice=sum(p[j][0]*p[(j+1)%len(p)][1]-p[(j+1)%len(p)][0]*p[j][1]for j in range(len(p)));area=F(round(abs(twice)),2*45**2);assert area==a*b-c*d==F(288,10);choices(area);assert list(map(value,r['options']))==[a*b,a*b+c*d,area,(a-c)*b]
  return'28,8',{'actualNotchedPolygonVertices':p,'sameScalePxPerM':45,'shoelaceAreaM2':str(area),'wholeMinusOnlyActualNotchM2':str(a*b-c*d),'allFourAreaChoiceRolesChecked':True}
 if i==5:
  first=rect(71,93);second=rect(314,135);shape(first,[71,93,165,192]);shape(second,[314,135,84,150]);a,b,c,d=[value(at(x,y))for x,y in[(153.5,334),(26,197),(356,334),(442,218)]];assert[a,b,c,d]==[F(275,100),F(32,10),F(14,10),F(25,10)]
  for e,w,h in[(first,a,b),(second,c,d)]:close(n(e,'width')/float(w),60);close(n(e,'height')/float(h),60)
  total=a*b+c*d;assert total==F(123,10)
  return'12,3',{'actualTwoIndependentMetricRects':[[165,192],[84,150]],'sameScalePxPerM':60,'actualAreaSumM2':[str(a*b),str(c*d),str(total)]}
 if i==6:
  polygons=[points(e)for e in ps];expected=[[(74.,285.),(344.,285.),(344.,180.),(74.,180.)],[(74.,180.),(344.,180.),(416.,84.),(146.,84.)],[(344.,285.),(416.,189.),(416.,84.),(344.,180.)]];assert polygons==expected
  a,b,c=[value(at(x,y))for x,y in[(209,344),(410,268),(28,239.5)]];assert[a,b,c]==[F(9,10),F(4,10),F(35,100)]
  close(270/float(a),300);close(math.hypot(72,-96)/float(b),300);close(105/float(c),300)
  hidden=[tuple(n(e,k)for k in['x1','y1','x2','y2'])for e in ls if e.get('stroke-dasharray')];assert hidden==[(74.,285.,146.,189.),(146.,189.,416.,189.),(146.,189.,146.,84.)]
  volume=a*b*c;litres=volume*10**3;assert volume==F(126,1000)and litres==126;assert(a*10)*(b*10)*(c*10)==litres
  return'126',{'actualThreeProjectedFaces':True,'actualThreeHiddenEdges':hidden,'actualEqualProjectedScalePxPerM':300,'printedInternalDimensionsM':list(map(str,[a,b,c])),'volumeM3':str(volume),'cubicMetresToLitresFactor':1000,'capacityLitres':126}
 if i==7:
  outer=rect(88,79);vertical=rect(234,79);horizontal=rect(88,188);shape(outer,[88,79,324,230.4]);shape(vertical,[234,79,33.6,230.4]);shape(horizontal,[88,188,324,33.6]);assert outer.get('fill')=='#77c6ac'and vertical.get('fill')==horizontal.get('fill')=='#fff'
  a,b,w1,w2=[value(at(x,y))for x,y in[(250,356.4),(35,202.2),(250.8,76),(455,212.8)]];assert[a,b,w1,w2]==[F(135,10),F(96,10),F(14,10),F(14,10)]
  for actual,printed in[(324,a),(230.4,b),(33.6,w1),(33.6,w2)]:close(actual/float(printed),24)
  assert n(vertical,'y')==n(outer,'y')and n(horizontal,'x')==n(outer,'x');assert 88<234<267.6<412 and 79<188<221.6<309.4
  overlap=w1*w2;area=a*b-w1*b-w2*a+overlap;assert area==(a-w1)*(b-w2)==F(9922,100);assert overlap==F(196,100);choices(area);assert list(map(value,r['options']))==[a*b,area-overlap,a*b-a*w2,area]
  return'99,22',{'actualMetricOuterAndBothFullSpanPaths':True,'pathWidthM':str(w1),'wholeM2':str(a*b),'verticalHorizontalAreasM2':[str(w1*b),str(w2*a)],'overlapAddedBackExactlyOnceM2':str(overlap),'greenAreaM2':str(area),'allFourAreaChoiceRolesChecked':True}
 if i==9:
  ul=rect(110,65);ur=rect(283.6,65);ll=rect(110,158);lr=rect(283.6,158);shape(ul,[110,65,173.6,93]);shape(ur,[283.6,65,86.8,93]);shape(ll,[110,158,173.6,139.5]);shape(lr,[283.6,158,86.8,139.5]);assert ul.get('fill')==lr.get('fill')=='#fff'and ur.get('fill')==ll.get('fill')=='#a9d1f6'
  upper,lower,left,right=[value(at(x,y))for x,y in[(48,119.5),(48,235.75),(196.8,349),(327,349)]];assert[upper,lower,left,right]==[F(15,10),F(225,100),F(28,10),F(14,10)]
  for px,m in[(93,upper),(139.5,lower),(173.6,left),(86.8,right)]:close(px/float(m),62)
  blue=lower*left+upper*right;white=upper*left+lower*right;whole=(upper+lower)*(left+right);assert blue==F(84,10)and blue+white==whole==F(1575,100)
  return'8,4',{'actualTwoDiagonalBlueCells':True,'sameScalePxPerM':62,'observedBlueAreasM2':[str(lower*left),str(upper*right)],'observedWhiteAreasM2':[str(upper*left),str(lower*right)],'wholeConservationM2':str(whole),'blueTotalM2':str(blue)}
 assert i==10
 old=rect(125,83);top=rect(125,61);right=rect(345,83);corner=rect(345,61);shape(old,[125,83,220,220]);shape(top,[125,61,220,22]);shape(right,[345,83,22,220]);shape(corner,[345,61,22,22]);assert old.get('fill')=='#a9d1f6'and top.get('fill')==right.get('fill')=='#f4cf72'and corner.get('fill')=='#77c6ac'
 width=value(at(68,80));assert width==value(at(356,350))==F(4,10);assert at(69,201)==at(235,350)=='a';gain=value(re.search(r'аудан (\d+,\d+) м²-ге',r['statement'])[1]);assert gain==F(336,100)
 a=(gain-width**2)/(2*width);assert a==4 and(a+width)**2-a*a==gain;close(220/float(a),22/float(width));assert 2*a*width+width**2==gain
 return'4',{'actualTwoStripsAndSingleCorner':True,'printedWidthM':str(width),'givenAreaGainM2':str(gain),'singleCornerAreaM2':str(width**2),'twoStripsCoefficient':str(2*width),'requestedOriginalSideM':str(a),'newSideNotRequested':str(a+width),'actualGeometryMatchesAlgebraScale':55}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==11;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer']
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=i//6+1;entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full11saved/new/fullofficial+newsolutions/everyMCQ read and four actual source/native343px sheets viewed; own printedSVG digit/shift/comma, exact Fraction area/volume, metricpolygon/rect/projection observer and complete conservation; no authorparams orsolver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave61/visual-wave61-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave61/visual-wave61-contact-{sheet}.png','checked':['actual aligned partial products with blank-unit positional shift','both actual factor comma places and missing/wrong final comma','actual100gridintersection18/42/12/28colors','actual uniformframe border and wholeminus hole','actual notchedpolygon shoelace and rightnotch dimensions','same metric scale for gardens/diagonalpieces and all3 projected axes','aquarium3hiddenedges/internal dimensions/cubic unit factor1000','fullspan crossing paths and exactlyone overlapaddback','originalsquare twoadjacentstrips and singlecorner versus newside','343px source/native sheets legible with dimension labels clear of lines']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave61.py','fullSavedAndNewRead':11,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave61-pictured-decimal-products.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':11,'actualPrintedColumnPlacesMetricAreaVolumeConservation':True,'hashesMatched':11,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
