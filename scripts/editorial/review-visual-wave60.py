"""Independent full10saved/new/solutions/choices read, 4actual343px sheets viewed; source raster7 unavailable."""
import collections,hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave60-pictured-decimal-natural-products.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def value(s):return F(s.replace(',','.'))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1]
 ts=[e for e in es if tag(e)=='text'];rs=[e for e in es if tag(e)=='rect'and e.get('stroke')];ls=[e for e in es if tag(e)=='line'];polys=[e for e in es if tag(e)=='polygon'];cs=[e for e in es if tag(e)=='circle'];n=lambda e,k:float(e.get(k))
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def unitoptions(expected,unit):
  assert all(o.endswith(' '+unit)for o in r['options']);assert sum(value(o.split()[0])==expected for o in r['options'])==1
 if i==0:
  cells=sorted(rs,key=lambda e:n(e,'x'));assert len(cells)==6
  for j,e in enumerate(cells):assert[n(e,k)for k in['x','y','width','height']]==[48+64*j,177,64,64]
  one=value(at(80,219));assert one==F(145,100);total=one*len(cells);assert total==F(87,10);unitoptions(total,'м');assert value(r['options'][0].split()[0])==one+6
  return'8,7 м',{'actualEqualParts':6,'actualPartWidthPx':64,'printedMetresPerPart':str(one),'totalMetres':str(total),'wrongAdditionValue':str(one+6)}
 if i==1:
  square=only(rs);assert[n(square,k)for k in['x','y','width','height']]==[130,70,220,220];ticks=ls;assert len(ticks)==4
  expected=[(240,62,240,78),(240,282,240,298),(122,180,138,180),(342,180,358,180)]
  assert sorted(tuple(n(e,k)for k in['x1','y1','x2','y2'])for e in ticks)==sorted(expected)
  side=value(at(240,329));assert side==F(265,100);perimeter=4*side;assert perimeter==F(106,10);unitoptions(perimeter,'см');assert value(r['options'][0].split()[0])==2*side
  return'10,6 см',{'actualSquareSidePx':220,'actualAllFourEqualityMarks':True,'printedCmPerSide':str(side),'perimeterCm':str(perimeter),'halfPerimeterTrap':str(2*side)}
 if i==2:
  assert len(rs)==100;positions=set()
  for e in rs:
   x,y=n(e,'x'),n(e,'y');assert[n(e,'width'),n(e,'height')]==[24,24];assert x in[120+24*j for j in range(10)]and y in[63+24*j for j in range(10)];positions.add((x,y))
  assert len(positions)==100;colors=collections.Counter(e.get('fill')for e in rs);assert colors=={'#fff':30,'#5da8ef':14,'#f2bb43':14,'#6bc4ab':14,'#b99ce6':14,'#ee937d':14};assert at(240,37)=='Бүкіл шаршы — 1'
  assert r['options']==['0,14 × 5 = 0,7','0,14 × 5 = 7','0,5 × 14 = 7','0,14 × 5 = 0,07'];assert F(14,100)*5==F(7,10)
  return'0,14 × 5 = 0,7',{'actualEqualCells':100,'actualFiveDistinctColoredGroups':[14]*5,'actualWhiteCells':30,'requestedFactorOrderOneGroupTimesGroups':True,'exactWholeColoredShare':'7/10'}
 if i==3:
  ticks=sorted(n(e,'x1')for e in ls if n(e,'x1')==n(e,'x2')and n(e,'y1')<187<n(e,'y2'));assert len(ticks)==26
  for j,x in enumerate(ticks):close(x,40+15.5*j)
  assert[at(40,235),at(195,235),at(350,235)]==['0','1','2'];point=only(cs);assert[n(point,k)for k in['cx','cy','r']]==[164,187,5]and at(164,152)=='A';coordinate=F(164-40,155);assert coordinate==F(8,10)
  factor=int(re.search(r'координатасынан (\d+) есе',r['statement'])[1]);assert factor==4;answer=coordinate*factor;assert answer==F(32,10);assert r['options']==['0,32','3,2','32','4,8'];assert sum(value(o)==answer for o in r['options'])==1
  return'3,2',{'actualRayTicks':26,'printedUnitAnchorStep':'1/10','observedA':'4/5','requestedCoordinateMultiplier':4,'Bcoordinate':str(answer),'wrongAddition':str(coordinate+factor)}
 if i==4:
  polygon=only(polys);points=[tuple(map(float,p.split(',')))for p in polygon.get('points').split()];assert len(points)==6
  edges=[(points[j],points[(j+1)%6])for j in range(6)];lengths=[math.dist(a,b)for a,b in edges];assert all(abs(x-123)<1e-7 for x in lengths)and len(ls)==6
  for a,b in edges:
   midpoint=((a[0]+b[0])/2,(a[1]+b[1])/2);tick=only(e for e in ls if abs((n(e,'x1')+n(e,'x2'))/2-midpoint[0])<1e-7 and abs((n(e,'y1')+n(e,'y2'))/2-midpoint[1])<1e-7)
   close(math.hypot(n(tick,'x2')-n(tick,'x1'),n(tick,'y2')-n(tick,'y1')),14);close((b[0]-a[0])*(n(tick,'x2')-n(tick,'x1'))+(b[1]-a[1])*(n(tick,'y2')-n(tick,'y1')),0)
  side=value(at(352,296));assert side==F(145,100);perimeter=side*6;unitoptions(perimeter,'см');assert value(r['options'][3].split()[0])==4*side
  return'8,7 см',{'actualEqualHexagonEdges':6,'actualEachEdgePx':123,'allSixPerpendicularEqualMarks':True,'printedSideCm':str(side),'perimeterCm':str(perimeter),'fourSidesTrap':str(4*side)}
 if i==5:
  rect=only(rs);assert[n(rect,k)for k in['x','y','width','height']]==[87,85,306,182.75];a=value(at(240,305.75));b=value(at(43,184.375));assert[a,b]==[F(36,10),F(215,100)]
  close(n(rect,'width')/float(a),n(rect,'height')/float(b));perimeter=2*(a+b);assert perimeter==F(115,10);unitoptions(perimeter,'дм');assert value(r['options'][0].split()[0])==a+b and value(r['options'][1].split()[0])==2*a+b
  return'11,5 дм',{'actualRectangleAspect':[306,182.75],'printedAdjacentDm':[str(a),str(b)],'fullPerimeterDm':str(perimeter),'halfAndOneSideOmissionTraps':True}
 if i==6:
  groups=[sorted([e for e in rs if n(e,'y')==y],key=lambda e:n(e,'x'))for y in[104,232]];assert list(map(len,groups))==[4,3];printed=[value(at(116.75,145)),value(at(131.6,273))];assert printed==[F(95,100),F(128,100)];totals=[]
  for cells,part in zip(groups,printed):
   for j,e in enumerate(cells):close(n(e,'x'),74+j*float(part)*90);close(n(e,'width'),float(part)*90);assert n(e,'height')==63
   totals.append(part*len(cells))
  assert totals==[F(380,100),F(384,100)]and totals[1]-totals[0]==F(4,100);assert at(37,143)=='a'and at(37,271)=='b';assert r['options']==['a жолағы 0,04 дм ұзын','a жолағы 0,4 дм ұзын','жолақтардың ұзындығы тең','b жолағы 0,04 дм ұзын']
  return'b жолағы 0,04 дм ұзын',{'actualPartCounts':[4,3],'printedPerPartDm':list(map(str,printed)),'sameScalePxPerDm':90,'observedFullLengthsDm':list(map(str,totals)),'fewerPartsLongerStrip':'b','differenceDm':'1/25'}
 if i==7:
  assert[at(x,112)for x in[126,202,278,354]]==[' ','□','5','□'];assert[at(x,290)for x in[126,202,278,354]]==['4','□','□','3'];assert at(240,118)==at(240,296)==','and at(354,195)=='9'and at(64,195)=='×'
  valid=[]
  for a,b,c,d in itertools.product(range(10),repeat=4):
   top=100*a+50+b;bottom=4000+100*c+10*d+3
   if top*9==bottom:valid.append(((a,b,c,d),top,bottom))
  assert valid==[((4,7,1,1),457,4113)];assert 7*9==63 and 5*9+6==51 and 4*9+5==41
  return'13',{'actualPrintedPattern':'□,5□ × 9 = 4□,□3','completeDigitQuadruples':10000,'uniqueQuadruple':[4,7,1,1],'rawProduct':[457,9,4113],'actualDecimalPlaces':2,'requestedHiddenDigitSum':13,'sourceRasterUnavailable':True,'savedOfficialPatternReadInsteadOfRaster':True}
 if i==8:
  cells=[e for e in rs if e.get('stroke')=='#9cb0c2'];assert len(cells)==6;locations=set()
  for e in cells:
   assert[n(e,'width'),n(e,'height')]==[76,76];locations.add((round((n(e,'x')-122)/76),round((n(e,'y')-47)/76)))
  assert locations=={(0,0),(0,1),(1,1),(0,2),(1,2),(2,2)}
  edgecount=collections.Counter()
  for x,y in locations:
   for a,b in[((x,y),(x+1,y)),((x+1,y),(x+1,y+1)),((x+1,y+1),(x,y+1)),((x,y+1),(x,y))]:edgecount[tuple(sorted([a,b]))]+=1
  outer={edge for edge,c in edgecount.items()if c==1};assert len(outer)==12 and sum(c==2 for c in edgecount.values())==6
  actual=set()
  for e in ls:
   if max(n(e,'y1'),n(e,'y2'))>275:continue
   a=((n(e,'x1')-122)/76,(n(e,'y1')-47)/76);b=((n(e,'x2')-122)/76,(n(e,'y2')-47)/76);assert all(float(v).is_integer()for v in[*a,*b]);actual.add(tuple(sorted([tuple(map(int,a)),tuple(map(int,b))])))
  assert actual==outer;side=value(at(160,338).split()[0]);assert side==F(145,100);total=side*len(outer);assert total==F(174,10)
  return'17,4',{'actualNativeSquareCells':sorted(locations),'actualOuterEdges':12,'actualInternalSharedEdges':6,'printedUnitSideCm':str(side),'fullPerimeterCm':str(total),'wrongAll24EdgesCm':str(24*side)}
 assert i==9
 assert[at(x,112)for x in[150,240,330]]==['7','0','5']and[at(x,290)for x in[150,240,330]]==['4','2','3'];assert at(195,118)==at(195,296)==','and at(330,195)=='6'and at(81,195)=='×'
 raw=705*6;assert raw==4230;correct=F(raw,100);wrong=F(423,100);assert correct==10*wrong and correct==F(423,10)
 assert r['options']==['үтір қате қойылған, дұрысы 42,3','үтір қате қойылған, дұрысы 0,423','цифрлар қате, дұрысы 42,03','қате жоқ, 4,23 дұрыс'];assert'42,30 = 42,3'in r['solution']and'705 × 6 = 4230'in r['solution']
 return r['options'][0],{'actualStudentPrintedPattern':'7,05 × 6 = 4,23','independentRawIntegerProduct':4230,'originalDecimalPlaceCount':2,'correctBeforeTrimming':'42,30','correctAfterTrimming':'42,3','wrongPrematureTrimFactor':10}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer']
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=i//6+1;available=i!=7
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full10saved/new/fullsolutions/everyMCQ read, four actual source/native343px sheets viewed (9source rasters; source7 unavailable explicitly recorded); own actualSVGcells/colors/labels/ticks/equaledges/columnpatterns/boundary observer and exactFraction products/full10000digit tuples; no authorparams orsolver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':available,'sourceRasterLimitation':None if available else 'Archived raster a0c667c3e27b9bb6 missing; complete saved condition and official explicit multiplication pattern/solution individually read; original visual not claimed reviewed. New diagram independently checked.', 'sourceSheet':f'output/editorial-visual-wave60/visual-wave60-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave60/visual-wave60-contact-{sheet}.png','checked':['actual equal lengths and four/six equal edge marks','actual100cells five distinct equal14cell color groups','printed rayunit anchor and multiply versus add','same physicalscale of fewerlonger strip','complete10000hidden digit domains and allcarryplaces','actual staircase outerboundary via sharededge cancellation','rawproduct before decimal placement before trailingzero trim','alloriginalunit and distractorroles','343px native sheets legible without clipping']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave60.py','fullSavedAndNewRead':10,'actualSheetsViewed':4,'actualSourceRastersReviewed':9,'missingSourceRasterIds':['a0c667c3e27b9bb6'],'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave60-pictured-decimal-natural-products.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':10,'actualSVGGeometryProductsAndFullDigitDomains':True,'hashesMatched':10,'actual343pxSheetsViewed':4,'sourceRastersReviewed':9,'oneMissingSourceRasterExplicitlyRecorded':True}))
if __name__=='__main__':main()
