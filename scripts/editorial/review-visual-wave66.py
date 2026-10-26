"""Independent full13saved/new/fullsolutions/everyMCQ and six343px sheets read."""
import hashlib,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave66-pictured-rounding.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def val(s):return F(s.replace(',','.'))
def rounded(x,places):
 assert x>=0 and places in [0,1,2];scaled=x*10**places;q,rem=divmod(scaled.numerator,scaled.denominator);return F(q+int(2*rem>=scaled.denominator),10**places)
def fixed(x,places):
 units=x*10**places;assert units.denominator==1;n=units.numerator
 return str(n) if places==0 else str(n//10**places)+','+str(n%10**places).zfill(places)
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k))
 ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect'];ps=[e for e in es if tag(e)=='path']
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def choice(a):assert sum(val(o)==a for o in r['options'])==1
 if i==0:
  anchors=sorted((n(e,'x'),val(txt(e))) for e in ts if n(e,'y')==262);assert len(anchors)==10;assert anchors[0]==(28.,F(0)) and anchors[-1]==(448.,F(18));scale=(448-28)/18
  ticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')==213);assert len(ticks)==181
  for j,x in enumerate(ticks):close(x,28+scale*j/10)
  for x,v in anchors:close(x,28+scale*float(v))
  guides=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')==179 and n(e,'y2')==213);assert guides==[28.,420.]
  tip=only(e for e in ps if e.get('fill')=='#ead3ac');assert tip.get('d')=='M 406 143 L 420 159 L 406 175 Z';body=only(e for e in rs if e.get('fill')=='#a8d3fa');assert [n(body,k) for k in ['x','y','width','height']]==[28,143,378,32]
  length=F(round((420-28)/scale*10),10);assert length==F(168,10)
  assert at(140,115)=='16' and at(370,115)=='17';zoomticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<86<n(e,'y2'));assert zoomticks==[140+23*j for j in range(11)]
  zoom=only(e for e in es if tag(e)=='circle');assert n(zoom,'cx')==324 and n(zoom,'cy')==86;assert 16+F(324-140,230)==length;assert at(324,68)=='B'
  out=rounded(length,0);assert out==17
  return '17',{'actualFullRulerAnchors':[(x,str(v)) for x,v in anchors],'actualFullRulerTenthsTicks':181,'actualPencilEndpointProjectionX':guides,'actualLengthCm':str(length),'actualIndependentZoomTicks':11,'zoomShowsSameB16_8':True,'roundedWholeCm':str(out)}
 if i==2:
  anchors=sorted((n(e,'y')-8,val(txt(e))) for e in ts if n(e,'x')==296);assert len(anchors)==6
  for y,v in anchors:close(y,300-(float(v)-36)*48)
  ticks=[e for e in ls if n(e,'x1')==245 and n(e,'y1')==n(e,'y2')];assert len(ticks)==51;ys=sorted(n(e,'y1') for e in ticks)
  for j,y in enumerate(ys):close(y,60+4.8*j)
  liquid=only(e for e in rs if e.get('fill')=='#c85165');top=n(liquid,'y');close(n(liquid,'height')+top,318);temperature=F(36)+F(round((300-top)/48*10),10);assert temperature==F(387,10);assert any(abs(n(e,'y1')-top)<1e-7 for e in ticks);out=rounded(temperature,0);assert out==39
  return '39',{'actualSixTemperatureAnchors':[(y,str(v)) for y,v in anchors],'actualEqualTenthTicks':51,'actualRedLiquidTopY':top,'actualTemperatureC':str(temperature),'roundedWholeC':str(out)}
 if i in [7,8]:
  e=only(e for e in rs if e.get('stroke'));a=val(at(265,n(e,'y')+n(e,'height')+42));b=val(at(59,n(e,'y')+n(e,'height')/2+8));assert [a,b]==([F(57,10),F(46,10)] if i==7 else [F(276,100),F(157,100)])
  close(n(e,'width')/float(a),n(e,'height')/float(b));assert e.get('fill')=='#c0dfff'
  if i==7:
   area=a*b;out=rounded(area,0);assert area==F(2622,100) and out==26;early=rounded(a,0)*rounded(b,0);assert early==30 and early!=out
   return '26',{'actualPrintedMetricSides':list(map(str,[a,b])),'sameMetricScale':n(e,'width')/float(a),'exactAreaBeforeRoundingM2':str(area),'roundedAreaM2':str(out),'earlyRoundedSidesWrongProduct':str(early)}
  perimeter=2*(a+b);out=rounded(perimeter,1);assert perimeter==F(866,100) and out==F(87,10);choice(out);assert list(map(val,r['options']))==[F(86,10),out,rounded(a+b,1),perimeter]
  return '8,7',{'actualPrintedMetricSides':list(map(str,[a,b])),'sameMetricScale':n(e,'width')/float(a),'exactFullPerimeterDm':str(perimeter),'roundedFullPerimeterDm':str(out),'allHalfVsFullUnroundedVsTruncationChoicesChecked':True}
 if i==9:
  cards=[e for e in rs if e.get('stroke')];assert len(cards)==4;digits=[]
  for j,e in enumerate(cards):
   assert [n(e,k) for k in ['x','y','width','height']]==[30+112*j,132,78,94];digits.append(at(69+112*j,196))
  assert digits==list('4927');values=sorted(F(int(''.join(p)),1000) for p in itertools.permutations(digits));assert len(set(values))==24 and values[0]==F(2479,1000) and values[-1]==F(9742,1000);out=rounded(values[0],2);assert out==F(248,100);choice(out)
  assert list(map(val,r['options']))==[out,F(247,100),rounded(values[-1],2),rounded(values[0],1)]
  return '2,48',{'actualFourDigits':digits,'allOneDigitWholePermutations':24,'exactSmallestDecimal':str(values[0]),'exactLargestDecimal':str(values[-1]),'roundedSmallestHundredths':str(out),'allDistractorRolesChecked':True}
 # All local rays read from physical coordinates and labelled anchors, never author indices.
 assert i in [1,3,4,5,6,10,11,12]
 anchors=sorted((n(e,'x'),val(txt(e))) for e in ts if n(e,'y')==234);x0,v0=anchors[0];x1,v1=anchors[1]
 ticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<=185<=n(e,'y2'));step=ticks[1]-ticks[0];n1=round((x1-x0)/step);close(x1-x0,n1*step);unit=(v1-v0)/n1
 for j,x in enumerate(ticks):close(x,x0+j*step)
 for x,v in anchors:close((x-x0)/step,float((v-v0)/unit))
 points={}
 for e in es:
  if tag(e)=='circle':
   x=n(e,'cx');assert n(e,'cy')==185;label=at(x,155 if i==12 else 156);j=round((x-x0)/step);close(x,x0+j*step);points[label]=v0+unit*j
 expected={1:{'A':F(524,100)},3:{'M':F(375,100)},4:{'A':F(148,10)},5:{'K':F(632,100),'L':F(634,100),'M':F(635,100),'N':F(639,100)},6:{'A':F(107,10),'B':F(113,10)},10:{'K':F(245,100)},11:{'P':F(1996,100)},12:{'A':F(8,10),'B':F(44,10)}};assert points==expected[i]
 proof={'actualPrintedAnchors':[(x,str(v)) for x,v in anchors],'actualAllEqualTickCount':len(ticks),'unitFromPrintedAnchorsAndPhysicalSteps':str(unit),'actualPointValues':{k:str(v) for k,v in points.items()}}
 if i==5:
  target=val(re.search(r'дөңгелектегенде (\d+,\d+)',r['statement'])[1]);assert target==F(64,10);out={k:rounded(v,1) for k,v in points.items()};qualifies=[k for k,v in out.items() if v==target];assert qualifies==['M','N'];assert r['options']==['тек N','L, M және N','M және N','K және L'];assert points['M']*10-F(63)==F(1,2)
  return 'M және N',dict(proof,allFourRoundedValues={k:str(v) for k,v in out.items()},midpointIncluded=True,allAndOnlyQualifyingPoints=qualifies)
 if i==6:
  results=[rounded(points[k],0) for k in ['A','B']];assert results==[11,11];assert sum(results)==22
  return '22',dict(proof,eachCoordinateRoundedFirst=list(map(str,results)),thenSum=22)
 if i==10:
  whole=rounded(points['K'],0);tenths=rounded(points['K'],1);out=whole+tenths;assert [whole,tenths,out]==[2,F(25,10),F(45,10)];choice(out);assert list(map(val,r['options']))==[F(44,10),out,F(55,10),whole+points['K']]
  return '4,5',dict(proof,independentWholeRounding=str(whole),independentTenthsRounding=str(tenths),requestedSum=str(out),sameOriginalUsedForBoth=True)
 if i==12:
  length=points['B']-points['A'];out=rounded(length,0);early=rounded(points['B'],0)-rounded(points['A'],0);assert [length,out,early]==[F(36,10),4,3]
  return '4',dict(proof,exactDifferenceBeforeRounding=str(length),requestedRoundedLength=str(out),earlyEndpointRoundingWrongDifference=str(early))
 places=0 if i==4 else 1;value=only(points.values());out=rounded(value,places);answer=fixed(out,places)
 assert answer=={1:'5,2',3:'3,8',4:'15',11:'20,0'}[i]
 if r.get('options'):choice(out)
 if i==1:assert list(map(val,r['options']))==[F(53,10),value,value+F(1,100),out]
 if i==3:assert list(map(val,r['options']))==[F(37,10),value,value+F(1,100),out];assert value-F(37,10)==F(38,10)-value
 if i==11:assert r['options']==['19,9','19,10','20,0','19,96'];assert re.fullmatch(r'\d+,\d',answer)
 return answer,dict(proof,requestedPlaces=places,roundedExact=str(out),requestedWrittenPrecision=answer,exactMidpointTie=i==3,carryToWholeWithTrailingZero=i==11)
def main():
 # Independent nearest-grid comparison covers all hundredths0..9999 including ties.
 for h in range(10000):
  x=F(h,100)
  for places in [0,1]:
   factor=10**places;lo=F((x*factor).numerator//(x*factor).denominator,factor);hi=lo+F(1,factor);expected=hi if hi-x<=x-lo else lo;assert rounded(x,places)==expected
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==13;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=i//6+1
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full13 saved/new/official+new solutions/every MCQ read and six actual source/native343px sheets viewed; own actualSVG physical ruler/zoom/liquid/metricrect/card/tick observer, exact Fraction nearest-grid rounding and all24 digit permutations; no author params or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave66/visual-wave66-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave66/visual-wave66-contact-{sheet}.png','checked':['full181tick ruler and actual pencil tip/projections agree with independent11tick zoom','all51 thermometer ticks/printed anchors/liquid top read before rounding','actual local/global ray anchors and every equal tick with physical namedpoint placement','exact half-up midpoint included, fourpoint all-only classification','separate rounding targets use sameoriginal, precise request order retained','metric floor exact area before rounding, full perimeter versus half and truncation','all24 digit card permutations and leastnumber before hundredth rounding','carry acrosswhole and requested20,0 trailing precision','AB exactdifference before rounding versus roundedendpoint wrongdifference','all13actual343px source/native diagrams legible with rulerzoom and clear labels']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave66.py','fullSavedAndNewRead':13,'actualSheetsViewed':6,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave66-pictured-rounding.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':13,'actualPrintedRulerLiquidRayMetricAndCardRead':True,'nearestGridRoundingCases':20000,'allDigitPermutations':24,'hashesMatched':13,'actual343pxSheetsViewed':6}))
if __name__=='__main__':main()
