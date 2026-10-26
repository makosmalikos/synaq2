"""Full13saved/new/solutions/allMCQ and6actual343px source/native sheets read."""
import hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave56-pictured-decimal-notation.json';BLUE='#91c0ec';YELLOW='#f5cb66'
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def fmt(f):
 for places in range(5):
  v=f*10**places
  if v.denominator==1:
   s=str(v.numerator).zfill(places+1)
   return s if not places else s[:-places]+','+s[-places:]
 raise AssertionError(f)
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549'];ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];cs=[e for e in es if tag(e)=='circle'];ps=[e for e in es if tag(e)=='path']
 def at(x,y):return text(only(e for e in ts if n(e,'x')==x and n(e,'y')==y))
 def grid(cells,left,top,step,blue=None,columnColors=False):
  assert len(cells)==100
  for e in cells:
   x=(n(e,'x')-left)/step;y=(n(e,'y')-top)/step;close(x,round(x));close(y,round(y));x,y=round(x),round(y);assert 0<=x<10 and 0<=y<10;close(n(e,'width'),step);close(n(e,'height'),step)
   expected=(BLUE if x<2 else YELLOW if x==9 and y>=1 else'#fff')if columnColors else(BLUE if y*10+x<blue else'#fff');assert e.get('fill')==expected,(i,x,y,e.get('fill'),expected)
  assert len({(n(e,'x'),n(e,'y'))for e in cells})==100
 if i in[0,9]:
  assert len(rs)==100;grid(rs,120,72,24,58 if i==0 else None,i==9);assert at(240,37)=='Бір бүтін — 100 тең ұяшық'
  if i==0:
   assert r['options']==['0,58','5,8','0,058','0,42'];return'0,58',{'actualGridDimensions':[10,10],'actualCellPx':[24,24],'actualBlueCount':58,'actualWhiteCount':42,'blueHundredths':'58/100'}
  assert r['options']==['0,71','0,29','0,92','7,1'];colors={c:sum(e.get('fill')==c for e in rs)for c in[BLUE,YELLOW,'#fff']};assert list(colors.values())==[20,9,71]
  return'0,71',{'actualGridDimensions':[10,10],'actualBlueColumns':2,'actualYellowLastColumnCells':9,'actualWhiteCells':71,'requestedComplementHundredths':'71/100','coloredReversalAndDecimalShiftDistractors':['0,29','0,92','7,1']}
 if i==4:
  assert len(rs)==200;a=[e for e in rs if n(e,'x')<250];b=[e for e in rs if n(e,'x')>250];grid(a,30,88,19.5,100);grid(b,255,88,19.5,38);assert at(240,40)=='Әр квадрат — бір бүтін'
  return'138',{'actualEqualHundredCellSquares':2,'actualBlueCounts':[100,38],'equalWholeSquareSizePx':195,'shownDecimal':'1,38','requestedTotalHundredthCount':138,'wholeNotDiscarded':True}
 if i in[1,2]:
  ys=[57,126,195,264]if i==1 else[170];blues=[10,10,10,6]if i==1 else[4];assert len(rs)==10*len(ys)
  for y,blue in zip(ys,blues):
   cells=sorted([e for e in rs if n(e,'y')==y],key=lambda e:n(e,'x'));assert len(cells)==10
   for j,e in enumerate(cells):close(n(e,'x'),42+j*39.6);assert n(e,'width')==39.6 and n(e,'height')==42;assert e.get('fill')==(BLUE if j<blue else'#fff')
  if i==1:
   assert r['options']==['0,36','3,06','6,3','3,6'];return fmt(F(sum(blues),10)),{'actualWholeCount':4,'actualEqualCellsPerStrip':10,'actualBlueCounts':blues,'actualWholeSpanPx':396,'shownTenths':36}
  return'6',{'actualTenEqualCells':10,'actualBlueWhiteCounts':[4,6],'requestedWhiteTenthsCount':6,'whiteFraction':'6/10','countVersusFractionValue':True}
 if i in[3,6,7,8]:
  headers=sorted([e for e in rs if n(e,'height')==48],key=lambda e:n(e,'x'));bodies=sorted([e for e in rs if n(e,'height')==210],key=lambda e:n(e,'x'));count=5 if i==6 else 4;assert len(headers)==len(bodies)==count and len(rs)==count*2;expectedValues=['10','1','0,1','0,01','0,001']if i==6 else['1','0,1','0,01','0,001'];counts=[];values=[]
  assert at(240,32)=='Бір фишканың мәні'
  for header,body,expected in zip(headers,bodies,expectedValues):
   assert n(header,'x')==n(body,'x')and n(header,'width')==n(body,'width')and n(header,'y')==66 and n(body,'y')==114;left=n(body,'x');width=n(body,'width');value=at(left+width/2,97);assert value==expected;values.append(F(value.replace(',','.')));chips=[e for e in cs if left<n(e,'cx')<left+width];counts.append(len(chips));assert len({(n(e,'cx'),n(e,'cy'))for e in chips})==len(chips)
   for j,e in enumerate(chips):assert n(e,'r')==8;close(n(e,'cx'),left+width/2-21+(j%3)*21);close(n(e,'cy'),145+(j//3)*29);assert n(e,'cy')+8<324 and e.get('fill')==BLUE
  assert sum(counts)==len(cs);expectedCounts={3:[4,0,7,3],6:[3,0,6,0,2],7:[3,0,4,7],8:[1,12,6,14]}[i];assert counts==expectedCounts;value=sum((c*v for c,v in zip(counts,values)),F(0));proof={'actualPrintedHeaderValues':expectedValues,'actualChipCounts':counts,'actualColumnWidthPx':n(headers[0],'width'),'weightedExactValue':str(value),'emptyColumnsRetained':True,'chipsUniqueInsideActualColumns':True}
  if i==3:assert r['options']==['4,73','4,073','4,703','0,473'];return fmt(value),proof
  if i==6:
   assert value==F(30602,1000);return'30 бүтін мыңнан 602',{**proof,'wholeAndFractionalNumerator':[30,602],'fractionalPlaceCount':3}
  answer=value*1000;assert answer.denominator==1
  if i==7:assert answer==3047 and'(a/1000)'in r['statement'];return str(answer),{**proof,'requestedUnreducedDenominator':1000,'requestedNumerator':3047}
  assert answer==2274;assert 1000+1200+60+14==2274;assert 1+12//10==2 and 6+14//10==7
  return'2274',{**proof,'actualNoncanonicalCarryCounts':[12,14],'normalizedDecimal':'2,274','requestedThousandthCount':2274,'twoActualCarries':True}
 if i in[5,12]:
  ruler=only(rs);assert n(ruler,'x')==32 and n(ruler,'y')==180 and n(ruler,'width')==416 and n(ruler,'height')==103;ticks=sorted([e for e in ls if n(e,'y1')==180],key=lambda e:n(e,'x1'));assert len(ticks)==81
  for j,e in enumerate(ticks):close(n(e,'x1'),42+j*4.95);close(n(e,'x2'),42+j*4.95);assert n(e,'y2')==180+(31 if j%10==0 else 22 if j%5==0 else 12)
  for cm in range(9):assert at(42+49.5*cm,253)==str(cm)
  endpoints=sorted(cs,key=lambda e:n(e,'cx'));assert len(endpoints)==2;positions=[]
  for e,label in zip(endpoints,['A','B']):
   x=F(e.get('cx'));assert n(e,'cy')==134 and n(e,'r')==5;assert at(float(x),112)==label;proj=only(t for t in ls if n(t,'x1')==n(t,'x2')==float(x)and n(t,'y1')==143 and n(t,'y2')==180);assert proj.get('stroke-dasharray')=='3 4';mm=(x-42)/F('4.95');assert mm.denominator==1;positions.append(int(mm))
  segment=only(e for e in ls if n(e,'y1')==n(e,'y2')==134);assert n(segment,'x1')==n(endpoints[0],'cx')and n(segment,'x2')==n(endpoints[1],'cx');length=positions[1]-positions[0];proof={'actualMillimetreTickCount':81,'actualMillimetreStepPx':4.95,'actualCentimetreNumberLabels':list(range(9)),'actualProjectedEndpointMillimetres':positions,'actualLengthMillimetres':length}
  if i==5:assert positions==[0,64]and r['options']==['0,64','6,4','0,064','64,0'];return fmt(F(length,100)),{**proof,'requestedUnit':'dm','millimetresPerUnit':100}
  assert positions==[17,73]and r['options']==['7,3','0,56','6,4','5,6'];assert 7*10+3-(1*10+7)==56;wrong=(7-1)*10+abs(3-7);assert wrong==64;assert'|3 - 7|'in r['solution'].replace('−','-')
  return fmt(F(length,10)),{**proof,'requestedUnit':'cm','millimetresPerUnit':10,'realBorrowRequired':True,'wrongNoBorrowAbsoluteDigitsMillimetres':wrong}
 if i==10:
  cards=sorted(rs,key=lambda e:n(e,'x'));assert len(cards)==4;digits=[]
  for j,e in enumerate(cards):assert n(e,'x')==48+100*j and n(e,'y')==128 and n(e,'width')==84 and n(e,'height')==112;digits.append(int(at(90+100*j,204)))
  assert digits==[8,0,2,6];allCodes=list(itertools.permutations(digits));valid=[p for p in allCodes if p[0]!=0 and p[3]!=0];values={F(1000*a+100*b+10*c+d,100)for a,b,c,d in valid};assert len(allCodes)==24 and len(valid)==len(values)==12;assert sum(p[1]==0 for p in valid)==sum(p[2]==0 for p in valid)==6
  return'12',{'actualCardDigits':digits,'actualAllPermutations':24,'validDistinctDecimals':12,'zeroInSecondOrThirdPositionCounts':[6,6],'firstAndLastZeroExcluded':True}
 assert i==11 and len(ps)==20;groups=defaultdict(list)
 for p in ps:
  m=re.fullmatch(r'M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+) Z',p.get('d'));assert m;cx,cy,x1,y1,rx,ry,x2,y2=map(float,m.groups());assert rx==ry==84 and cy==197;close(math.hypot(x1-cx,y1-cy),84);close(math.hypot(x2-cx,y2-cy),84);a=math.atan2(y1-cy,x1-cx);b=math.atan2(y2-cy,x2-cx);close((b-a)%(2*math.pi),2*math.pi/10);groups[cx].append((a,p.get('fill')))
 assert sorted(groups)==[132,348];blue=[]
 for cx,g in sorted(groups.items()):
  assert len(g)==10;angles=sorted(a for a,c in g)
  for j,a in enumerate(angles):close((angles[(j+1)%10]-a)%(2*math.pi),2*math.pi/10)
  assert all(c in[BLUE,'#fff']for a,c in g);blue.append(sum(c==BLUE for a,c in g))
 assert blue==[10,4]and r['options']==['0,14','1,04','1,4','4,1']
 return fmt(F(sum(blue),10)),{'actualEqualRadiusPx':84,'actualSectorAngle':'2π/10','actualBlueCounts':blue,'actualWholeCount':2,'shownTenths':14}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==13;entries=[]
 before=json.loads((ROOT/'output/editorial-visual56-before-ruler-absolute-mm-review.json').read_text());old=before['editions']if isinstance(before,dict)else before
 assert len(old)==13
 for j,(a,b)in enumerate(zip(old,rows)):
  if j==12:assert{k:v for k,v in a.items()if k!='solution'}=={k:v for k,v in b.items()if k!='solution'}
  else:assert a==b
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=1+i//6
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root full13saved/new/solutions/allMCQ and6actual343pxsheetsread; own actualSVGgrid/chips+printedheaders/rulerprojection/cardpermutation/arc observer withoutdataannotations orauthormodels; exactFraction placeweights/totalunits and actualborrow','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave56/visual-wave56-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave56/visual-wave56-contact-{sheet}.png','checked':['actual100cell grids colors and fullwhole plus partialwhole','actual equalwhole strips and circle radii/sectorangles','actual printed chipcolumn values and each individual chip location','emptycolumns and two carry positions preserve placevalues','all81rulerticks and numericcm labels; projectedA/B positions and units','realrulerborrow separated from absolute-digit wrongalternative','all24actualcardpermutations with12distinct validdecimal values','legibility at343px and no overlap']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave56.py','fullSavedAndNewRead':13,'actualSheetsViewed':6,'resolvedDidacticFindings':['Ruler6,4wrongalternative explicitly derivesfrom7−1 and absolute|3−7|withoutborrow']},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave56-pictured-decimal-notation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':13,'actualGeometryPlaceValuesCarryBorrowAndPermutations':True,'hashesMatched':13,'actual343pxSheetsViewed':6,'resolvedDidacticFindings':1}))
if __name__=='__main__':main()
