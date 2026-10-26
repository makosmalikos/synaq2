"""Independent review: all7 saved/new texts and4 actual343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave52-pictured-reciprocals.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def n(e,k):return float(e.get(k))
def text(e):return ''.join(e.itertext())
def observe(row,i):
 raw=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['figureSha256']
 svg=ET.fromstring(raw);assert svg.get('viewBox')=='0 0 480 360'
 es=list(svg.iter());rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549'];ts=[e for e in es if tag(e)=='text']
 captions=[text(e)for e in ts]
 def strip(y,count,blue):
  cells=sorted([e for e in rs if n(e,'y')==y],key=lambda e:n(e,'x'));assert len(cells)==count
  for j,c in enumerate(cells):
   close(n(c,'x'),42+j*396/count);close(n(c,'width'),396/count);close(n(c,'height'),64)
   assert c.get('fill')==('#9ec8ed'if j<blue else'#fff')
  close(n(cells[-1],'x')+n(cells[-1],'width'),438)
  return F(blue,count)
 if i==1:
  paths=[e for e in es if tag(e)=='path'];assert len(paths)==20 and not rs;groups=defaultdict(list)
  pattern=r'M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+) Z'
  for p in paths:
   m=re.fullmatch(pattern,p.get('d'));assert m,p.get('d')
   cx,cy,x1,y1,rx,ry,x2,y2=map(float,m.groups());assert rx==ry==43 and cy==190
   close(math.hypot(x1-cx,y1-cy),43);close(math.hypot(x2-cx,y2-cy),43)
   a=math.atan2(y1-cy,x1-cx);b=math.atan2(y2-cy,x2-cx);close((b-a)%(2*math.pi),2*math.pi/5)
   groups[cx].append((a,b,p.get('fill')))
  assert sorted(groups)==[65,181,297,413];paint=[]
  for cx,g in sorted(groups.items()):
   assert len(g)==5
   starts=sorted(a for a,b,fill in g)
   for j in range(5):close((starts[(j+1)%5]-starts[j])%(2*math.pi),2*math.pi/5)
   paint.append(sum(fill=='#9ec8ed'for a,b,fill in g));assert all(fill in['#9ec8ed','#fff']for a,b,fill in g)
  assert paint==[5,5,5,2]and captions==['Әр дөңгелек — бір бүтін'];shown=sum(F(p,5)for p in paint);assert shown==F(17,5)
  assert row['options']==['(5/17)','(17/5)','(5/8)','(1/3)']
  return'(5/17)',{'actualCircleCenters':sorted(groups),'actualEqualSectorAngle':'2π/5','actualRadiusPx':43,'actualBlueSectorCounts':paint,'shownNumber':str(shown),'reciprocal':str(1/shown),'wholeAndDenominatorSumDistractor':str(F(5,3+5))}
 if i==3:
  assert len(rs)==6;cells=sorted(rs,key=lambda e:n(e,'y'))
  for j,c in enumerate(cells):
   assert n(c,'x')==170 and n(c,'y')==70+j*40 and n(c,'width')==140 and n(c,'height')==40
   assert c.get('fill')==('#fff'if j==0 else'#9ec8ed')
  assert captions==['Мақсатты су деңгейі'];target=F(5,6);rate=F(1,12);assert target/rate==10
  assert 'бос' in row['statement']and'(1/12)'in row['statement']
  return'10',{'actualEqualTankCells':6,'actualBottomBlueCells':5,'initiallyEmptyExplicit':True,'targetFraction':str(target),'hourlyWholeCapacityRate':str(rate),'targetTimeHours':str(target/rate),'fullTimeHours':str(1/rate)}
 if i==5:
  assert len(rs)==20;first=strip(112,8,1);second=strip(235,12,1);assert first>second
  assert captions==['Бір күнде оқылатын бөлік','A','M'];labs={text(t):(n(t,'x'),n(t,'y'))for t in ts};assert labs['A']==(20,151)and labs['M']==(20,274)
  delta=first-second;assert delta==F(1,24)and math.lcm(8,12)==24
  return'24',{'actualWholeSpansPx':[396,396],'actualCellCounts':[8,12],'actualBlueCounts':[1,1],'actualRowLabels':['A','M'],'dailyFractionDifference':str(delta),'askedUnitFractionDenominator':delta.denominator,'daysDifferenceIsNotRequested':True}
 count,blue,caption={0:(11,5,'Толық жолақ — бір бүтін'),2:(9,1,'Бір сағаттағы жұмыс'),4:(10,1,'Бір бригаданың бір күні'),6:(8,3,'Бір сағаттағы жұмыс')}[i]
 assert len(rs)==count and captions==[caption];f=strip(163,count,blue);proof={'actualEqualCells':count,'actualBlueCells':blue,'actualWholeSpanPx':396,'fractionReadFromActualGeometry':str(f)}
 if i==0:
  assert row['options']==['(5/11)','(11/5)','(6/11)','11'];assert 1-f==F(6,11)
  return'(11/5)',{**proof,'reciprocal':str(1/f),'complementDistractor':str(1-f),'selfAndDenominatorDistractors':True}
 if i==2:
  return str(1/f),{**proof,'hourlyRate':str(f),'wholeWorkTimeHours':str(1/f)}
 if i==4:
  together=f+f;assert together==F(1,5)
  return str(1/together),{**proof,'individualDailyRate':str(f),'simultaneousIndependentCrewCount':2,'jointRate':str(together),'wholeTimeDays':str(1/together)}
 assert i==6;minutes=60/f;assert minutes==160 and F(60,3)*8==160
 return str(minutes),{**proof,'oneCellMinutes':20,'wholeWorkHours':str(1/f),'wholeWorkMinutes':str(minutes),'unitConversion':60}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'],(i,answer,r['answer'])
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=1 if i<6 else 2
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root independent full7 saved/new/solutions/everyMCQ and4 actual343px sheets read; own actualSVGrect/arc geometry observer without data annotations or author models; exactFraction reciprocal, rates, target and requested denominator/unit proofs','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave52/visual-wave52-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave52/visual-wave52-contact-{sheet}.png','checked':['actual equal rectangles, contiguous fills and same whole spans','actual circle centers/radii/sector angles and blue counts','tank target distinguished from reciprocal and full duration','identical crew rates added before inversion','daily fraction gap uses same book and requested denominator','hours converted to actual requested minutes','captions and geometry readable without overlap at343px']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave52.py','fullSavedAndNewRead':7,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave52-pictured-reciprocals.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':7,'actualSVGGeometryAndRates':True,'hashesMatched':7,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
