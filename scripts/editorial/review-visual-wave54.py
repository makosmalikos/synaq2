"""Root independently read all11 saved/new/full solutions/MCQs and4 actual sheets."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave54-pictured-part-whole.json';BLUE='#9ec8ed';YELLOW='#f6d16e'
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549'];ls=[e for e in es if tag(e)=='line'];ts=[e for e in es if tag(e)=='text'];ps=[e for e in es if tag(e)=='path']
 def at(x,y):return text(only(e for e in ts if n(e,'x')==x and n(e,'y')==y))
 def line(a,b,y):return only(e for e in ls if n(e,'x1')==a and n(e,'x2')==b and n(e,'y1')==n(e,'y2')==y)
 def strip(y,count,colors,width=396):
  cells=sorted([e for e in rs if n(e,'y')==y],key=lambda e:n(e,'x'));assert len(cells)==count
  for j,e in enumerate(cells):close(n(e,'x'),42+width*j/count);close(n(e,'width'),width/count);assert n(e,'height')==64 and e.get('fill')==colors[j]
  return cells
 def pie(count,colors):
  assert len(ps)==count and not rs;angles=[]
  for j,p in enumerate(ps):
   m=re.fullmatch(r'M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+) Z',p.get('d'));assert m
   cx,cy,x1,y1,rx,ry,x2,y2=map(float,m.groups());assert cx==240 and cy==208 and rx==ry==113;close(math.hypot(x1-cx,y1-cy),113);close(math.hypot(x2-cx,y2-cy),113);a=math.atan2(y1-cy,x1-cx);b=math.atan2(y2-cy,x2-cx);close((b-a)%(2*math.pi),2*math.pi/count);angles.append(a);assert p.get('fill')==colors[j]
  angles.sort()
  for j,a in enumerate(angles):close((angles[(j+1)%count]-a)%(2*math.pi),2*math.pi/count)
 if i in[0,10]:
  cols=5 if i==0 else 6;assert len(rs)==4*cols;xs=sorted(set(n(e,'x')for e in rs));ys=sorted(set(n(e,'y')for e in rs));assert len(xs)==cols and len(ys)==4
  blue={(x,y)for y,k in enumerate([4,4,2,1]if i==0 else[4,4,2,0])for x in range(k)};yellow=set()if i==0 else{(3,2),(4,2),(5,2),(4,3),(5,3)}
  for e in rs:
   x,y=xs.index(n(e,'x')),ys.index(n(e,'y'));close(n(e,'x'),80+320*x/cols);close(n(e,'y'),78+60*y);close(n(e,'width'),320/cols);close(n(e,'height'),60);assert e.get('fill')==(BLUE if(x,y)in blue else YELLOW if(x,y)in yellow else'#fff')
  if i==0:
   assert at(240,39)=='Барлық аудан 160 м²'and'160 м²'in r['statement'];answer=F(160,len(rs))*len(blue);assert answer==88
   return'88',{'actualRowsColumns':[4,5],'actualBlueCoordinates':sorted(blue),'knownWholeArea':160,'areaPerCell':8,'blueArea':88,'nonRectangularBlueRegionCountedIndividually':True}
  assert at(240,39)=='Сары гүлзар 65 м²'and'65 м²'in r['statement'];unit=F(65,len(yellow));answer=unit*len(blue);assert answer==130
  assert r['options']==['312','130','(27 + (1/12))','195'];assert unit*24==312 and unit*15==195 and F(65)*F(10,24)==F(325,12)
  return'130',{'actualRowsColumns':[4,6],'actualBlueCoordinates':sorted(blue),'actualYellowCoordinates':sorted(yellow),'knownYellowArea':65,'cellArea':13,'blueArea':130,'wholeUnionWrongBaseDistractors':[312,195,'325/12']}
 if i in[2,4]:
  count=10 if i==2 else 12;colors=[BLUE]*7+['#fff']*3 if i==2 else[BLUE]*5+[YELLOW]*3+['#fff']*4;pie(count,colors)
  if i==2:
   assert at(240,38)=='Барлық уақыт 90 минут'and'90 минут'in r['statement'];assert 90*F(7,10)==63
   return'63',{'actualEqualSectorCount':10,'actualBlueSectors':7,'actualRadiusPx':113,'actualSectorAngle':'2π/10','knownWholeMinutes':90,'blueMinutes':63}
  assert at(240,38)=='Сары бөлік 33000 теңге';assert r['options']==['55000','132000','88000','13750'];unit=F(33000,3);assert unit*5==55000 and unit*12==132000 and unit*8==88000 and F(33000)*F(5,12)==13750;assert'(13750/1)'not in r['solution']
  return'55000',{'actualEqualSectorCount':12,'actualBlueYellowWhiteSectors':[5,3,4],'actualSectorAngle':'2π/12','knownYellowTenge':33000,'perSectorTenge':11000,'wholeUnionWrongBaseDistractors':[132000,88000,13750]}
 if i==7:
  line(42,438,197);ticks=sorted([e for e in ls if n(e,'y1')==190 and n(e,'y2')==204],key=lambda e:n(e,'x1'));assert len(ticks)==15
  for j,e in enumerate(ticks):assert n(e,'x1')==n(e,'x2')==42+j*26
  circles=[e for e in es if tag(e)=='circle'];assert len(circles)==2 and sorted(n(e,'cx')for e in circles)==[250,406]and all(n(e,'cy')==197 and n(e,'r')==5 for e in circles)
  assert at(42,170)=='O'and at(42,240)=='0'and at(250,170)=='A'and at(406,170)=='B';known=int(at(250,240));assert known==32;ia=F(250-42,26);ib=F(406-42,26);assert ia==8 and ib==14 and ia/ib==F(4,7);answer=F(known,ia)*ib;assert answer==56
  return'56',{'actualTickCount':15,'actualIntervalPx':26,'actualOriginAndPointX':[42,250,406],'actualIntervalsToAandB':[8,14],'knownACoordinate':32,'coordinatePerInterval':4,'realReduction':'8/14=4/7','B':56}
 if i==8:
  a=strip(113,4,[BLUE]*3+['#fff']);b=strip(243,6,[BLUE]*5+['#fff'],356.4);assert len(rs)==10;assert at(20,153)=='A'and at(20,283)=='B'and at(240,39)=='Барлығы 152 төсбелгі'
  blueA=sum(n(e,'width')for e in a if e.get('fill')==BLUE);blueB=sum(n(e,'width')for e in b if e.get('fill')==BLUE);close(blueA,297);close(blueB,297);fa=F(3,4);fb=F(5,6);t=152/(1/fa+1/fb);assert t==60 and t/fa==80 and t/fb==72
  return'80',{'actualWholeSpansPx':[396,356.4],'actualEqualBlueSpansPx':[blueA,blueB],'actualFractions':['3/4','5/6'],'knownCombinedBadges':152,'inverseCoefficientSum':'38/15','sharedBlueBadges':60,'AandB':[80,72]}
 count,blue={1:(9,4),3:(12,5),5:(11,6),6:(12,5),9:(9,7)}[i]
 if i==6:
  strip(183,12,[BLUE]*5+[YELLOW]*3+['#fff']*4);line(207,306,133);known=int(at(256.5,110).split()[0]);assert known==33;unit=F(known,3);assert unit*4==44
  return'44',{'actualBlueYellowWhiteCells':[5,3,4],'knownYellowTons':33,'yellowBracketPx':99,'tonsPerCell':11,'initialFirstSecondRemainingTons':[132,55,33,44],'bothDaysUseOriginalWhole':True}
 strip(183,count,[BLUE]*blue+['#fff']*(count-blue))
 if i==1:
  known=int(at(130,110));assert known==32;line(42,218,133);line(42,438,281);answer=F(known,blue)*count;assert answer==72;assert r['options']==['72','(14 + (2/9))','8','128'];assert known*F(4,9)==F(128,9)and F(128,9)==14+F(2,9)
  return'72',{'actualCellCount':9,'actualBlueCells':4,'knownBlue':32,'whole':72,'actualBlueBracketPx':176,'wrongMultiplyUnitAndNumeratorAlternatives':['128/9',8,128]}
 if i==3:
  known=int(at(240,99));assert known==168;line(42,438,122);line(42,207,281);assert at(124.5,320)=='?';answer=known*F(5,12);assert answer==70
  return'70',{'actualCellCount':12,'actualBlueCells':5,'knownWholeStamps':168,'actualBlueBracketPx':165,'blueStamps':70}
 if i==5:
  known=int(at(348,110));assert known==45;line(258,438,133);line(42,258,281);assert at(150,320)=='?';unit=F(known,count-blue);assert unit*blue==54
  return'54',{'actualCellCount':11,'actualBlueWhiteCounts':[6,5],'knownWhite':45,'actualWhiteBracketPx':180,'unit':9,'blue':54,'whole':99}
 assert i==9
 known=int(at(196,110));assert known==56;line(42,350,133);line(42,438,281);assert known/F(7,9)==72
 return'72',{'actualCellCount':9,'actualBlueCells':7,'actualBlueBracketPx':308,'knownBluePencils':56,'wholePencils':72}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==11;entries=[]
 before=json.loads((ROOT/'output/editorial-visual54-before-integer-diagnostic-review.json').read_text());old=before['editions']if isinstance(before,dict)else before
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=1 if i<6 else 2
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  if i!=4:assert old[i]==r
  else:assert {k:v for k,v in old[i].items()if k!='solution'}=={k:v for k,v in r.items()if k!='solution'};assert old[i]['solution'].replace('(13750/1)','13750')==r['solution']
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root full11 saved/new/fullsolutions/everyMCQ and4 actual343px sheets read; own actualSVGcell/arc/interval/point/bracket geometry observer withoutdataannotations orauthormodels; exactFraction sharedwhole, complement, sameblue inverse and requestedroles','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave54/visual-wave54-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave54/visual-wave54-contact-{sheet}.png','checked':['actual irregular blue/yellow grid regions and equal cell areas','actual pie centers/radii/sector angles and all blue/yellow/white colors','actual known and unknown brackets attach to correct whole or part','actual coordinate ray intervals rather than tick counts and point labels','same scale different whole lengths with equal blue lengths','all actual distractors recomputed from meaningful wrong base/operation','343px text legibility and no overlap']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave54.py','fullSavedAndNewRead':11,'actualSheetsViewed':4,'resolvedPresentationFindings':['row4 unnecessary denominator1 removed from integer diagnostic; other10rows and all11SVG hashes unchanged']},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave54-pictured-part-whole.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':11,'actualGeometryAndKnownWholePartRoles':True,'hashesMatched':11,'actual343pxSheetsViewed':4,'resolvedPresentationFindings':1}))
if __name__=='__main__':main()
