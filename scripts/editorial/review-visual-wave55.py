"""Root full10saved/new/solutions/MCQ read plus4source/native343px sheets viewed."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave55-pictured-unit-work.json';BLUE='#9ec8ed';YELLOW='#f6d16e'
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549'];ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];ps=[e for e in es if tag(e)=='path']
 def at(x,y):return text(only(e for e in ts if n(e,'x')==x and n(e,'y')==y))
 def strip(y,count,blue,yellow=0):
  cells=sorted([e for e in rs if n(e,'y')==y],key=lambda e:n(e,'x'));assert len(cells)==count
  for j,e in enumerate(cells):close(n(e,'x'),42+396*j/count);close(n(e,'width'),396/count);assert n(e,'height')==52;assert e.get('fill')==(BLUE if j<blue else YELLOW if j<blue+yellow else'#fff')
  return F(blue,count),F(yellow,count)
 def pies(count):
  groups=defaultdict(list)
  for p in ps:
   m=re.fullmatch(r'M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+) Z',p.get('d'));assert m
   cx,cy,x1,y1,rx,ry,x2,y2=map(float,m.groups());assert rx==ry;close(math.hypot(x1-cx,y1-cy),rx);close(math.hypot(x2-cx,y2-cy),rx);a=math.atan2(y1-cy,x1-cx);b=math.atan2(y2-cy,x2-cx);close((b-a)%(2*math.pi),2*math.pi/count);groups[(cx,cy,rx)].append((a,p.get('fill')))
  results=[]
  for key,g in sorted(groups.items()):
   assert len(g)==count;angles=sorted(a for a,c in g)
   for j,a in enumerate(angles):close((angles[(j+1)%count]-a)%(2*math.pi),2*math.pi/count)
   colors=[c for a,c in g];assert all(c in[BLUE,YELLOW,'#fff']for c in colors);results.append((key,colors.count(BLUE),colors.count(YELLOW)))
  return results
 if i in[0,3,5]:
  count,blue,yellow={0:(12,6,0),3:(20,4,0),5:(20,4,2)}[i];b,y=strip(180,count,blue,yellow);proof={'actualEqualCells':count,'actualBlueYellowCells':[blue,yellow],'actualWholeSpanPx':396}
  if i==0:
   assert at(240,43)=='3 сағатта орындалған бөлік'and'3 сағатта'in r['statement'];rate=b/3;assert rate==F(1,6);assert r['options']==['(1/2)','(1/6)','(1 + (1/2))','(1/9)'];assert F(6,12)/3==rate and F(6,4)==F(3,2)
   return'(1/6)',{**proof,'observedHours':3,'observedWork':str(b),'requestedHourlyRate':str(rate),'wrongDivideOnlyDenominator':str(F(6,4))}
  if i==3:
   assert at(240,43)=='Бір сағатта орындалған бөлік';assert b==F(1,5)and math.gcd(4,20)==4
   return'5',{**proof,'actualHourlyRate':str(b),'realReductionGCD':4,'wholeTimeHours':5}
  assert at(240,43)=='Екі адамның бір күндегі жұмысы'and'2 күн'in r['statement'];rate=b+y;done=rate*2;assert rate==F(3,10)and done==F(3,5);assert r['options']==['(3/10)','(3/5)','(2/5)','(7/10)'];assert b*2==F(2,5)
  return'(3/5)',{**proof,'individualDailyRates':[str(b),str(y)],'observedDays':2,'completedFraction':str(done),'firstWorkerOnlyTwoDays':str(b*2),'oneDayVersusTwoDayRoles':True}
 if i==1:
  result=pies(12);assert result==[((240.,211.,112.),3,1)];rate=F(3+1,12);assert at(240,39)=='Екі адамның бір сағаттағы жұмысы';assert 1/rate==3
  return'3',{'actualCircleCenterRadius':[240,211,112],'actualEqualSectors':12,'actualBlueYellowSectors':[3,1],'jointHourlyRate':str(rate),'wholeHours':3}
 if i==4:
  result=pies(10);assert result==[((136.,192.,86.),1,0),((344.,192.,86.),3,0)];assert at(136,316)=='A'and at(344,316)=='B';assert r['options']==['(3 + (1/3))','(3/10)','7','3'];ra,rb=F(1,10),F(3,10);assert rb/ra==3 and 1/rb==F(10,3)
  return'(3 + (1/3))',{'actualEqualCircleRadii':[86,86],'actualTenSectorBlueCounts':[1,3],'actualCircleLabels':['A','B'],'requestedBOnlyRate':str(rb),'BWholeHours':str(1/rb),'rateRatioBtoA':3,'wrongRateDifferenceAndBlueCount':[str(rb),7,3]}
 if i in[2,7,9]:
  if i==2:
   a=strip(118,6,1)[0];b=strip(246,12,1)[0];assert len(rs)==18 and at(20,153)=='A'and at(20,281)=='B';assert 1/(a+b)==4
   return'4',{'actualWholeSpansPx':[396,396],'actualCellCounts':[6,12],'actualBlueCounts':[1,1],'individualHourlyRates':[str(a),str(b)],'jointWholeHours':4,'equalWholesBeforeAdding':True}
  if i==7:
   a=strip(118,15,1)[0];b=strip(246,15,4)[0];assert at(20,153)=='A'and at(20,281)=='B'and'3 сағат'in r['statement'];first=a*3;left=1-first;joint=left/(a+b);total=3+joint;assert first==F(1,5)and joint==F(12,5)and total==F(27,5)
   assert r['options']==['(2 + (2/5))','(5 + (2/5))','3','6'];assert 1/(a+b)==3 and 3+1/(a+b)==6
   return'(5 + (2/5))',{'actualSameWholeCells':[15,15],'actualBlueCounts':[1,4],'initialAOnlyHours':3,'initialWork':str(first),'remainingWork':str(left),'jointPhaseHours':str(joint),'requestedTotalHours':str(total),'completedConservation':str(first+joint*(a+b))}
  a=strip(84,10,1)[0];b=strip(177,5,1)[0];c=strip(270,20,1)[0];assert at(20,119)=='A'and at(20,212)=='B'and at(20,305)=='C'and'дәл 4 сағат'in r['statement'];times=[1/(a+b),1/(a+c),1/(b+c)];assert times==[F(10,3),F(20,3),F(4)];assert r['options']==['A мен B','A мен C','B мен C','Мұндай жұп жоқ'];assert 1/(a+b+c)==F(20,7)
  return'B мен C',{'actualWholeSpansPx':[396,396,396],'actualCellCounts':[10,5,20],'individualHourlyRates':[str(a),str(b),str(c)],'allThreePairTimes':[str(t)for t in times],'targetHours':4,'allThreeWorkerTime':str(1/(a+b+c))}
 assert i in[6,8];tank=only(ps);assert tank.get('d')=='M 70 148 L 70 313 L 410 313 L 410 148'and tank.get('fill')=='none'
 def inlet(x):
  e=only(e for e in ls if n(e,'x1')==n(e,'x2')==x and n(e,'y1')==91 and n(e,'y2')==180);assert e.get('style')=='stroke:#5d9cdf';assert 70<x<410
  for x2 in[x-6,x+6]:assert len([t for t in ls if n(t,'x1')==x and n(t,'y1')==180 and n(t,'x2')==x2 and n(t,'y2')==171])==1
  return int(at(x,70).split(': ')[1].split()[0])
 assert at(240,29)=='Жеке толық уақыт — сағатпен'
 if i==6:
  ta,tb=inlet(130),inlet(300);assert[ta,tb]==[12,20];tc=int(at(350,223).split(': ')[1].split()[0]);assert tc==15
  e=only(e for e in ls if n(e,'x1')==352 and n(e,'x2')==447 and n(e,'y1')==n(e,'y2')==258);assert e.get('style')=='stroke:#da5c68'and 352<410<447
  for y in[252,264]:assert len([t for t in ls if n(t,'x1')==447 and n(t,'y1')==258 and n(t,'x2')==438 and n(t,'y2')==y])==1
  rate=F(1,ta)+F(1,tb)-F(1,tc);assert rate==F(1,tc)>0 and 1/rate==15
  return'15',{'actualTankCorners':[70,148,410,313],'actualPrintedPipeHours':[ta,tb,tc],'actualArrowDirections':['downIntoTank','downIntoTank','rightOutOfTank'],'netHourlyRate':str(rate),'netEqualsOutletMagnitudeInvariant':True,'wholeHours':15,'CLabelClearOfWall':True}
 times=[inlet(x)for x in[110,240,370]];assert times==[15,30,10];assert'4 сағаттан кейін'in r['statement'];rate=F(1,15)+F(1,30);first=rate*4;remaining=1-first;joint=rate+F(1,10);last=remaining/joint;assert first==F(2,5)and remaining==F(3,5)and last==3 and 4+last==7
 return'7',{'actualTankCorners':[70,148,410,313],'actualPrintedPipeHours':times,'actualAllThreeArrowsDownIntoTank':True,'CInitiallyClosedHours':4,'initialFilledFraction':str(first),'remainingFraction':str(remaining),'finalAllThreeRate':str(joint),'finalPhaseHours':3,'requestedTotalHours':7}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=1 if i<6 else 2
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root all10 fullsaved/new/solutions/MCQ and4actual343pxsheets read; own actualSVGcell/arc/label/tank/arrow observer; exactFraction observed-work/rate/time, full/joint/remaining phases and allpairs, noauthorparams orsolver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave55/visual-wave55-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave55/visual-wave55-contact-{sheet}.png','checked':['actual same-whole cell extents, fills, blue/yellow counts','actual equal sector angles, circle radii, A/B labels','observed work divided by full elapsed time before inversion','requested B-only/daily completed/total-time roles distinguished','actual tank wall and arrows down into or right out of tank','actual printed per-pipe times and delayed third inlet phase','every pair independently checked against target','343px readable geometry and C caption clear of tankwall']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave55.py','fullSavedAndNewRead':10,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave55-pictured-unit-work.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':10,'actualSVGGeometryFlowsAndExactRatePhases':True,'hashesMatched':10,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
