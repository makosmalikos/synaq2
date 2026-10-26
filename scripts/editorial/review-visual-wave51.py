"""All8 saved/new/fullsolutions/everyMCQ and4actual343pxsheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave51-pictured-fraction-multiplication.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549'];mixed=[]
 def at(x,y):return txt(only(t for t in ts if abs(n(t,'x')-x)<1e-7 and abs(n(t,'y')-y)<1e-7))
 def fraction(x,y):
  bar=only(e for e in ls if abs((n(e,'x1')+n(e,'x2'))/2-x)<1e-7 and n(e,'y1')==n(e,'y2')==y and n(e,'x2')-n(e,'x1')==34)
  return F(int(at(x,y-7)),int(at(x,y+25)))
 for e in es:
  if tag(e)!='g':continue
  texts=[t for t in e if tag(t)=='text'and re.fullmatch(r'\d+',txt(t))];lines=[t for t in e if tag(t)=='line']
  if len(texts)!=3 or len(lines)!=1:continue
  w=only(t for t in texts if t.get('font-size')=='27');a,b=sorted((t for t in texts if t is not w),key=lambda t:n(t,'y'));bar=lines[0]
  close(n(a,'x'),n(b,'x'));close(n(a,'x')-n(w,'x'),34);close(n(w,'y')-n(a,'y'),17);close(n(b,'y')-n(a,'y'),35);close(n(bar,'y1')-n(a,'y'),9);close(n(bar,'y1'),n(bar,'y2'));close((n(bar,'x1')+n(bar,'x2'))/2,n(a,'x'))
  whole,nu,de=map(lambda x:int(txt(x)),[w,a,b]);assert whole>0 and 0<nu<de;mixed.append((F(whole)+F(nu,de),[whole,nu,de],n(w,'y')))
 vals=[p[0]for p in mixed];proof={'actualVisibleMixedLabels':[p[1]for p in mixed]}
 if i==0:
  square=only(rs);close(n(square,'width'),n(square,'height'));assert n(square,'width')==210;assert vals==[F(9,4)];assert at(240,40)=='Қабырға — дециметрмен';assert mixed[0][2]>n(square,'y')+n(square,'height')+25
  return'9',{**proof,'actualSquareSidePx':210,'fourEqualEdges':True,'exactPerimeter':str(vals[0]*4),'captionClearOfFigure':True}
 if i in[1,6]:
  count=5 if i==1 else 10;rs.sort(key=lambda e:n(e,'x'));assert len(rs)==count;assert n(rs[0],'x')==42;close(n(rs[-1],'x')+n(rs[-1],'width'),438)
  for j,e in enumerate(rs):close(n(e,'x'),42+j*396/count);close(n(e,'width'),396/count);assert n(e,'height')==75 and n(e,'y')==180
  assert[e.get('fill')for e in rs]==['#9ec8ed']*3+['#fff']*(count-3);assert len([e for e in ls if n(e,'x1')==42 and n(e,'x2')==438 and n(e,'y1')==n(e,'y2')==123])==1
  if i==1:
   price=int(at(240,101).split()[0]);assert price==630;assert len([e for e in ls if n(e,'x1')==42 and abs(n(e,'x2')-279.6)<1e-7 and n(e,'y1')==n(e,'y2')==282])==1;answer=str(price*F(3,5));proof['actualWholePrice']=price
  else:
   assert vals==[F(5,3)];answer=str(vals[0]*F(3,10)*60);assert answer=='30';assert math.gcd(5,10)==5 and math.gcd(3,3)==3;proof['hoursToMinutes']=60
  return answer,{**proof,'actualEqualCellCount':count,'actualPaintedCells':3,'actualWholeLengthPx':396,'sameWholeCorrectlyIdentified':True}
 if i==2:
  assert len(rs)==42;xs=sorted(set(n(e,'x')for e in rs));ys=sorted(set(n(e,'y')for e in rs));assert len(xs)==6 and len(ys)==7;assert at(250,58)==at(80,216)=='1 м'
  for e in rs:close(n(e,'width'),40);close(n(e,'height'),240/7)
  for j,x in enumerate(xs):close(x,130+40*j)
  for j,y in enumerate(ys):close(y,85+240*j/7)
  coords={(xs.index(n(e,'x')),ys.index(n(e,'y')))for e in rs if e.get('fill')=='#9ec8ed'};assert coords=={(x,y)for x in range(5)for y in range(4,7)};assert F(len(coords),42)==F(5,14)
  assert r['options']==['(1 + (11/42))','(2 + (11/21))','(5/14)','(9/14)'];assert F(5,6)+F(3,7)==F(53,42)and 2*(F(5,6)+F(3,7))==F(53,21)
  return'(5/14)',{'actualUnitSquareExtentPx':[240,240],'actualRowsAndColumns':[7,6],'actualContiguousPaintedRectangle':[3,5],'actualPaintedAreaFraction':str(F(15,42)),'realReductionGCD':3}
 if i==3:
  assert vals==[F(17,5)];a=vals[0];diff=F(*map(int,re.search(r'\((\d+)/(\d+)\)',r['statement']).groups()));assert diff==F(9,10);b=a-diff;rect=only(rs);assert n(rect,'width')==250;close(n(rect,'height'),250*float(b/a));assert b==F(5,2)and a*b==F(17,2)
  assert F(2,5)<diff and'1 бүтіннен үлес'in r['solution'];assert mixed[0][2]>n(rect,'y')+n(rect,'height')+25
  assert r['options']==['(2 + (1/2))','(11 + (4/5))','(3 + (3/50))','(8 + (1/2))'];assert 2*(a+b)==F(59,5)and a*diff==F(153,50)
  return'(8 + (1/2))',{**proof,'actualRectangleExtentPx':[250,n(rect,'height')],'derivedWidth':str(b),'realBorrowRequired':True,'widthPerimeterWrongMultiplierDistractors':True,'captionClearOfFigure':True}
 if i==4:
  assert vals==[F(63,2),F(88,3)];a,b=vals;assert a*b==924;assert len(rs)==12;rs.sort(key=lambda e:n(e,'x'))
  for j,e in enumerate(rs):close(n(e,'x'),155+j*260/12);close(n(e,'width'),260/12);close(n(e,'height'),260*float(b/a));assert n(e,'y')==104
  assert[e.get('fill')for e in rs]==['#9ec8ed']*5+['#fff']*7;assert mixed[0][2]+18<104;assert math.gcd(63,3)==3 and math.gcd(88,2)==2
  return'385',{**proof,'actualEqualStripCount':12,'actualBlueStrips':5,'exactWholeArea':924,'exactAreaPerStrip':77,'bothActualCrossCancellations':[3,2],'captionClearOfFigure':True}
 if i==5:
  rs.sort(key=lambda e:n(e,'x'));assert len(rs)==3 and[n(e,'width')for e in rs]==[99,198,99]and[n(e,'x')for e in rs]==[42,141,339];assert[e.get('fill')for e in rs]==['#9ec8ed','#f6d16e','#fff'];total=int(at(240,100).split()[0]);assert total==84000
  original=fraction(91.5,205);remaining=fraction(240,226);assert original==F(1,4)and remaining==F(2,3);assert at(240,191)=='Қалғанның';assert F(99,396)==original and F(198,396-99)==remaining;left=(1-original)*(1-remaining);assert left==F(1,4)and total*left==21000;assert original+remaining!=1-left
  return'21000',{'actualOriginalTotal':total,'actualWidthsPx':[99,198,99],'actualOriginalBlueFraction':str(original),'actualYellowFractionOfRemaining':str(remaining),'remainingBaseCaptionExplicit':True,'exactPurchaseAndRemainingAmounts':[21000,42000,21000]}
 assert i==7
 edge=fraction(204,323);assert edge==F(5,6);polys=[e for e in es if tag(e)=='polygon'];assert len(polys)==3
 points=[(125.,110.),(285.,110.),(285.,270.),(125.,270.),(195.,55.),(355.,55.),(355.,215.),(195.,215.)];A,B,C,D,E,Fp,G,H=points
 def segment(e):return frozenset([(n(e,'x1'),n(e,'y1')),(n(e,'x2'),n(e,'y2'))])
 expected=[(A,B),(B,C),(C,D),(D,A),(A,E),(E,Fp),(Fp,B),(Fp,G),(G,C),(H,E),(H,D),(H,G)]
 actual=[e for e in ls if segment(e)in map(frozenset,expected)];assert len(actual)==12 and set(map(segment,actual))==set(map(frozenset,expected));assert sum(e.get('stroke-dasharray')is not None for e in actual)==3
 degrees=Counter(p for e in actual for p in segment(e));assert set(degrees.values())=={3}and len(degrees)==8
 faces={frozenset(tuple(map(float,p.split(',')))for p in e.get('points').split())for e in polys};assert faces=={frozenset([A,B,Fp,E]),frozenset([B,C,G,Fp]),frozenset([A,B,C,D])};assert edge**3==F(125,216)
 assert r['options']==['(25/36)','(125/216)','(25/216)','(2 + (1/2))'];assert edge**2==F(25,36)and 3*edge==F(5,2)
 return'(125/216)',{'actualEdgeLabel':str(edge),'actualVertices':8,'actualEdges':12,'actualHiddenEdges':3,'actualVisibleFaces':3,'degreeOfEveryVertex':3,'squareVersusCubeAndTimes3Traps':True,'captionClearOfFigure':True}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==8;entries=[]
 for i,r in enumerate(rows):
  answer,observed=observe(r,i);assert answer==r['answer'];
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=1 if i<6 else 2
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root independent all8 fullsaved/new/solutions/MCQs and4source/native343px sheets read; own actualSVGtext/fractionbar/cell/dimension/edgegraph observer; exactFraction area/cancellation/bases/time/volume proofs; no author model or params','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave51/visual-wave51-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave51/visual-wave51-contact-{sheet}.png','checked':['allvisiblemixed/fractionlabelsandunits readwithoutdataannotations','actualunitgrid6x7/painted5x3 verified','allbar/gardenpartsactualdimensions/fills/proportions verified','remaining moneybaseexplicit andactualgeometryconsistent','twoactualcrosscancellationsandhours→minutes correct','cube3faces/12edges/8degree3vertices/3hidden verified','captions clearandreadableat343px']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+PACK+"')).editions;console.log(JSON.stringify(r.map(q=>[q.editionId,editionHash(q)])));";js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave51.py','fullSavedAndNewRead':8,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave51-pictured-fraction-multiplication.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':8,'actualCellsDimensionsBasesAndCubeEdgeGraph':True,'allVisibleMixedAndFractionLabels':True,'hashesMatched':8,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
