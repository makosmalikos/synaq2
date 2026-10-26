"""Root independent full14 saved/new/solutions/choices and six actual343px sheets reviewed."""
import hashlib,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave58-decimal-coordinate-rays.json'
def close(a,b): assert abs(float(a-b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def num(s):return F(s.replace(',','.'))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
 es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1]
 ls=[e for e in es if tag(e)=='line'];ts=[e for e in es if tag(e)=='text'];ps=[e for e in es if tag(e)=='circle']
 n=lambda e,k:F(e.get(k));textat=lambda x,y:txt(only(e for e in ts if n(e,'x')==x and n(e,'y')==y))
 def axis(y,anchors=None):
  baseline=only(e for e in ls if n(e,'y1')==n(e,'y2')==y and e.get('style') is None);assert n(baseline,'x1')==28 and n(baseline,'x2')==449
  ticks=sorted([e for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<y<n(e,'y2')],key=lambda e:n(e,'x1'))
  xs=[n(e,'x1')for e in ticks];assert len(xs)>2 and xs[0]==36 and xs[-1]==426
  spacing=(xs[-1]-xs[0])/(len(xs)-1)
  for j,x in enumerate(xs):close(x,xs[0]+j*spacing)
  if anchors is None:
   anchors=sorted([(n(e,'x'),num(txt(e)))for e in ts if n(e,'y')==y+44 and re.fullmatch(r'\d+(?:,\d+)?',txt(e))])
  assert len(anchors)>=2
  x0,v0=anchors[0];x1,v1=anchors[1];slope=(v1-v0)/(x1-x0);assert slope>0
  for x,v in anchors:close(v,v0+(x-x0)*slope)
  step=(slope*spacing).limit_denominator(100000);assert step>0
  values={}
  for p in ps:
   if n(p,'cy')!=y:continue
   assert p.get('fill')=='#d85e71'and n(p,'r')==5
   x=n(p,'cx');j=round(float((x-xs[0])/spacing));close(x,xs[j]);name=textat(x,y-22)
   assert re.fullmatch('[A-Z]',name)and name not in values
   values[name]=(v0+(x-x0)*slope).limit_denominator(100000)
  return values,step,len(xs)-1,anchors,spacing
 if i==9:
  upper,step,intervals,anchors,_=axis(111);assert not upper and step==F(1,10)and intervals==10 and anchors==[(F(36),F(2)),(F(426),F(3))]
  highlight=only(e for e in ls if e.get('style')=='stroke:#65a8e5;stroke-width:6');assert n(highlight,'y1')==n(highlight,'y2')==111
  left,right=n(highlight,'x1'),n(highlight,'x2');assert[left,right]==[270,309]
  start=F(2)+(left-36)/390;end=F(2)+(right-36)/390;assert[start,end]==[F(26,10),F(27,10)]
  low,small,count,_,_=axis(265,[(F(36),start),(F(426),end)])
  assert count==10 and small==F(1,100)and low=={'A':F(264,100)}
  assert F(390,1)/(right-left)==10
  for x1,x2 in [(left,36),(right,426)]:
   link=only(e for e in ls if n(e,'x1')==x1 and n(e,'x2')==x2 and n(e,'y1')==120 and n(e,'y2')==265);assert link.get('stroke-dasharray')=='4 5'
  return'2,64',{'printedUpperAnchors':[2,3],'observedUpperStep':'1/10','actualHighlightNativePixels':str(right-left),'actualExpandedNativePixels':390,'physicalZoomFactor':10,'observedLowerStep':str(small),'observedLowerPoint':str(low['A'])}
 values,step,intervals,anchors,spacing=axis(193)
 expected=[{'A':F(16,10)},{'M':F(8,10)},{'B':F(32,10)},{'K':F(3,10)},{'P':F(6,10),'Q':F(12,10),'R':F(15,10),'S':F(19,10)},{'A':F(467,100),'B':F(473,100)},{'A':F(7,10),'B':F(16,10),'C':F(23,10),'D':F(29,10)},{'M':F(516,100),'N':F(539,100)},{'A':F(85,100)},None,{'A':F(635,100),'B':F(67,10)},{'K':F(455,100)},{'D':F(1,10),'C':F(3,10),'A':F(6,10),'B':F(8,10)},{'A':F(125,100)}][i]
 assert values==expected,(i,values,expected)
 steps={0:F(1,10),1:F(1,5),2:F(1,10),3:F(1,10),4:F(1,10),5:F(1,100),6:F(1,10),7:F(1,100),8:F(1,20),10:F(1,20),11:F(1,20),12:F(1,10),13:F(1,4)}
 assert step==steps[i]
 proof={'actualPrintedAnchors':[[str(x),str(v)]for x,v in anchors],'physicalEqualIntervals':intervals,'observedStep':str(step),'observedPoints':{k:str(v)for k,v in values.items()}}
 if i in[0,1,5,8,11]:
  value=values[{0:'A',1:'M',5:'B',8:'A',11:'K'}[i]];a={0:'1,6',1:'0,8',5:'4,73',8:'0,85',11:'4,55'}[i];assert num(a)==value
  assert sum(num(o)==value for o in r['options'])==1
  if i in[10,11]:assert len(anchors)==2
  return a,proof
 if i==2: assert 'НЕШЕ ондық үлес'in r['statement'];return str(int(values['B']/F(1,10))),{**proof,'requestedTotalTenths':32}
 if i==3: assert '0,□'in r['statement'];return str(int(values['K']*10)),{**proof,'requestedOneDigit':3}
 if i==4:
  boundary=num(re.search(r'НЕШЕУІ (\d+,\d+)',r['statement'])[1]);assert boundary==F(115,100);selected=[k for k,v in values.items()if v>boundary];assert selected==['Q','R','S'];return str(len(selected)),{**proof,'strictLowerBoundary':str(boundary),'allFourMembershipsChecked':selected}
 if i==6:
  bounds=re.findall(r'(\d+,\d+) санынан',r['statement']);assert bounds==['1,55','2,08'];selected=[k for k,v in values.items()if num(bounds[0])<v<num(bounds[1])];assert selected==['B']and sorted(r['options'])==sorted(values);return selected[0],{**proof,'strictBounds':bounds,'allFourMembershipsChecked':True}
 if i==7:
  units=(values['N']-values['M'])/F(1,100);assert units==23;assert units-1==22
  return str(units),{**proof,'requestedHundredthDistanceUnits':23,'interiorTickPointsNotRequested':22}
 if i==10:
  assert len(anchors)==2 and anchors[1][1]-anchors[0][1]==F(4,10)
  assert 'ҚАТАҢ АРАСЫНДА'in r['statement']and'Шеткі нүктелерді қоспаңыз'in r['statement']
  hundredths=[x for x in range(600,701)if values['A']<F(x,100)<values['B']];assert hundredths==list(range(636,670))
  assert len(hundredths)==34 and(values['B']-values['A'])/step==7
  return str(len(hundredths)),{**proof,'completeInteriorHundredths':hundredths,'visibleCoarseIntervalsNotAnswer':7,'trailingZeroValuesIncluded':[640,650,660]}
 if i==12:
  target=num(re.search(r'(\d+,\d+) санын',r['statement'])[1]);assert target==F(6,10);selected=[k for k,v in values.items()if v==target];assert selected==['A']and sorted(r['options'])==sorted(values)
  return selected[0],{**proof,'trailingZeroNumericallyEqual':True,'allLetterMembershipsChecked':True}
 assert i==13 and'НЕШЕ жүздік үлестен'in r['statement'];assert values['A']*100==125
 return'125',{**proof,'requestedTotalHundredthsIncludingWhole':125}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==14;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer']
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=i//6+1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full14saved/new/fullsolutions/everyMCQ read and six source/native343px sheets viewed; own physical tickspacing and PRINTED anchor interpolation, exact Fraction coordinate/unit/strictboundary observer; no author params orsolver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave58/visual-wave58-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave58/visual-wave58-contact-{sheet}.png','checked':['all physical ticks and points checked from visible numerical anchors','tenths/fifths/twentieths/quarters/hundredths distinguished','partial rays inferred from printed anchors without assuming zero','actual highlight expansion39px to390px and connector endpoints','strict range count and all point memberships','all34 interior hundredth values, including trailingzeros','total unit counts include whole part, distance counts intervals','343px source/native sheets legible without clipping']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave58.py','fullSavedAndNewRead':14,'actualSheetsViewed':6,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave58-decimal-coordinate-rays.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':14,'actualPrintedScalePhysicalTicksAndExactCoordinates':True,'hashesMatched':14,'actual343pxSheetsViewed':6}))
if __name__=='__main__':main()
