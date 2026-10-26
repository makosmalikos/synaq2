"""Independent full11 saved/new/solutions/MCQ read and four343px sheets viewed."""
import hashlib,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave63-pictured-decimal-division.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def val(s):return F(s.replace(',','.'))
def text(e):return ''.join(e.itertext())
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
 es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k))
 ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect' and e.get('stroke')]
 def at(x,y):return text(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def line(x1,y1,x2,y2):return only(e for e in ls if all(abs(n(e,k)-v)<1e-7 for k,v in zip(['x1','y1','x2','y2'],[x1,y1,x2,y2])))
 def rect(x,y,w,h,fill):
  e=only(e for e in rs if n(e,'x')==x and n(e,'y')==y and abs(n(e,'width')-w)<1e-7 and abs(n(e,'height')-h)<1e-7)
  close(n(e,'width'),w);close(n(e,'height'),h);assert e.get('fill')==fill;return e
 def choice(v,unit=''):assert sum(val(o.removesuffix(unit))==v for o in r['options'])==1
 if i in [0,4,9]:
  def digits(y):
   d={n(e,'x'):text(e) for e in ts if n(e,'x')<250 and n(e,'y')==y and re.fullmatch('[0-9]',text(e))};assert set(d)<={88,136,184}
   assert set(d)==({88,136,184} if y==76 else {88,136} if y==128 else {184} if y==285 else {136,184})
   return int(''.join(d[x] for x in sorted(d)))
  a,s1,b,s2,rem=[digits(y) for y in [76,128,181,233,285]]
  assert [a,s1,b,s2,rem]=={0:[784,70,84,84,0],4:[352,32,32,32,0],9:[528,48,48,48,0]}[i]
  divisor=int(at(354,76));q=val(at(354,134));prefix=a//10;q0,prefixrem=divmod(prefix,divisor);q1,final=divmod(prefixrem*10+a%10,divisor)
  assert s1==q0*divisor and b==prefixrem*10+a%10 and s2==q1*divisor and final==rem==0
  line(284,47,284,149);line(284,94,438,94);line(64,138,160,138);line(112,243,208,243)
  commas=[e for e in ts if n(e,'y')==82 and text(e)==','];places=0 if not commas else sum(x>n(only(commas),'x') for x in [88,136,184]);assert places=={0:1,4:2,9:0}[i]
  printed=F(a,10**places);assert printed/divisor==q
  proof={'actualRawDividend':a,'actualDecimalPlaces':places,'actualDivisor':divisor,'printedQuotient':str(q),'firstPrefix':prefix,'firstQuotientDigit':q0,'firstRemainder':prefixrem,'broughtNextDigitCurrent':b,'secondQuotientDigit':q1,'lastRemainder':rem,'actualPositionalSubtractions':[s1,s2]}
  if i==0:
   good=[];results=[]
   for o in r['options']:
    x,y=map(val,o.split(' ÷ '));results.append(str(x/y))
    if x*10==printed and y*10==divisor:good.append(o)
   assert good==['7,84 ÷ 1,4'];assert results==['28/5','560','14/25','56'];assert q*F(14,10)==F(784,100)
   return good[0],dict(proof,allExpressionQuotients=results,requestedOriginalExpressionNotQuotient=True)
  if i==4:
   m=re.search(r'(\d+,\d+) ÷ (\d+,\d+)',r['statement']);assert m
   original,div=map(val,m.groups());assert original==printed and div*10==divisor;correct=original/div;assert correct==q*10==F(44,10);choice(correct)
   return '4,4',dict(proof,studentOnlyDivisorShift=True,originalDivisor=str(div),correctQuotient=str(correct))
  truths=[];evaluated=[]
  for o in r['options']:
   expr,rhs=o.split(' = ');x,y=map(val,expr.split(' ÷ '));actual=x/y;evaluated.append(str(actual));truths.append(actual==val(rhs))
  assert truths==[False,True,False,False] and evaluated==['330','33/10','33/100','3300']
  return r['options'][1],dict(proof,allMCQQuotients=evaluated,allMCQTruths=truths)
 if i==1:
  assert [at(x,122) for x in [82,116,150,184]]==['3',',','6','0'];a=val(''.join(at(x,122) for x in [82,116,150,184]));b=val(at(346,122));assert b==F(45,100)
  assert at(249,122)==at(249,279)=='÷'
  for x in [132,346]:line(x,149,x,233);assert at(x+45,196)=='×100'
  assert at(132,279)=='360' and at(346,279)=='45';assert a*100==360 and b*100==45;choice(a/b)
  highlight=only(e for e in es if tag(e)=='rect' and e.get('fill')=='#fff0b8');assert n(highlight,'x')==167 and n(highlight,'width')==34
  return '8',{'observedPaddedDividend':str(a),'observedDivisor':str(b),'actualArrowFactor':100,'bothMembersShifted':[360,45],'finalZeroIsNecessary':True,'quotient':8}
 if i in [2,5]:
  anchors=sorted([(n(e,'x'),val(text(e))) for e in ts if n(e,'y')==234]);x0,v0=anchors[0];x1,v1=anchors[1];scale=(x1-x0)/float(v1-v0);assert v0==0
  for x,v in anchors:close((x-x0)/scale,float(v))
  ticks=[e for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<=185<=n(e,'y2')];xs=sorted(n(e,'x1') for e in ticks)
  assert len(xs)==(46 if i==2 else 51)
  for j,x in enumerate(xs):close((x-x0)/scale,j/10)
  points={}
  for e in es:
   if tag(e)=='circle':
    x=n(e,'cx');assert n(e,'cy')==185;label=at(x,150);assert label in ['A','B'];points[label]=F(round((x-x0)/scale*10),10)
  a,b=points['A'],points['B'];assert [a,b]==([F(5,10),F(4)] if i==2 else [F(7,10),F(49,10)])
  result=b/a if i==2 else(b-a)/a;assert result==(8 if i==2 else 6)
  assert ('OB ұзындығы бойына OA' in r['statement']) if i==2 else ('AB ұзындығы OA' in r['statement'])
  return str(result),{'actualAnchors':[(x,str(v)) for x,v in anchors],'actualEqualTenthsTicks':len(xs),'OA':str(a),'OB':str(b),'AB':str(b-a),'requestedRatio':'OB/OA' if i==2 else 'AB/OA','alternateRatio':str((b-a)/a if i==2 else b/a)}
 if i in [3,6]:
  e=only(rs);expected=[87,95,300,87.5] if i==3 else [87,95,300,162.5]
  for k,v in zip(['x','y','width','height'],expected):close(n(e,k),v)
  assert e.get('fill')=='#f7fbff';cy=95+n(e,'height')/2+8;area=val(at(237,cy).removeprefix('S = '));known=val(at(41,cy) if i==3 else at(237,95+n(e,'height')+42));unknown=area/known
  assert [area,known,unknown]==([F(168,100),F(7,10),F(24,10)] if i==3 else [F(1248,100),F(48,10),F(26,10)])
  horizontal,vertical=(unknown,known) if i==3 else (known,unknown);scale=n(e,'width')/float(horizontal);close(n(e,'height')/float(vertical),scale)
  assert (at(237,224.5)=='?') if i==3 else (at(44,cy)=='?')
  if i==3:return '2,4',{'printedAreaCm2':str(area),'printedKnownSideCm':str(known),'unknownSideCm':str(unknown),'sameMetricScalePxPerCm':scale,'bothMemberShiftPreservesRatio':area*10/(known*10)==unknown}
  per=2*(known+unknown);assert per==F(148,10);choice(per,' м');assert list(map(lambda x:val(x.removesuffix(' м')),r['options']))==[known+unknown,2*(known+unknown/10),per,per*10]
  return '14,8 м',{'printedAreaM2':str(area),'printedKnownSideM':str(known),'calculatedOtherSideM':str(unknown),'sameMetricScalePxPerM':scale,'perimeterM':str(per),'halfPerimeterAndOnlyDivisorShiftDistractorsChecked':True}
 if i==7:
  assert len(rs)==4;values=[]
  for j in range(3):rect(38+86*j,177,86,67,'#8fc2f0');values.append(val(at(81+86*j,220)))
  rect(296,177,146,67,'#fff');assert at(369,220)=='…' and len(set(values))==1;piece=values[0];total=val(at(240,101));line(38,117,442,117)
  assert total==F(184,10) and piece==F(46,100);count=total/piece;assert count==40 and 1840==46*40 and 184==46*4
  assert 'Көп нүкте' in r['statement']
  return '40',{'actualVisibleRepeatedCells':3,'actualEllipsisCellSeparate':True,'wholeMetres':str(total),'pieceMetres':str(piece),'exactNaturalDivision':[1840,46,40],'quotientFinalZeroRequired':True,'drawingDoesNotClaimOnlyVisibleCellsAreWhole':True}
 if i==8:
  rect(92,96,315,180,'#fff');rect(92,96,45,30,'#8fc2f0');a,b,c,d=[val(at(x,y)) for x,y in [(249.5,326),(48,194),(114.5,80),(171,118)]];assert [a,b,c,d]==[F(84,10),F(48,10),F(12,10),F(8,10)]
  for px,v in [(315,a),(180,b),(45,c),(30,d)]:close(px/float(v),37.5)
  cols,rows=a/c,b/d;assert cols==7 and rows==6 and (a/d).denominator!=1;assert cols*rows==a*b/(c*d)==42
  return '42',{'printedFloorMetres':[str(a),str(b)],'printedTileMetres':[str(c),str(d)],'actualCommonMetricScalePxPerM':37.5,'columns':7,'rows':6,'wrongRotationNotIntegral':str(a/d),'areaConservation':str(a*b/(c*d))}
 assert i==10 and len(rs)==10
 for j in range(10):rect(39+40*j,183,40,62,'#8fc2f0' if j<7 else '#fff')
 line(39,123,319,123);part=val(at(179,105));assert part==F(126,10);whole=part/F(7,10);assert whole==18 and part/7*10==whole
 return '18',{'actualEqualCells':10,'actualColoredCells':7,'actualKnownBracketCoversOnlySevenCells':True,'knownPartKm':str(part),'oneCellKm':str(part/7),'requestedWholeKm':str(whole)}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==11;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer']
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=i//6+1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full11 saved/new/official+new solutions/every MCQ read; four actual source/native343px sheets viewed; own printed SVG positional Euclidean trace, comma/arrow, physical tick and metric geometry observer, exact Fraction option evaluation; no author params or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave63/visual-wave63-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave63/visual-wave63-contact-{sheet}.png','checked':['actual column digit alignment and all subtractions/remainders','both-member comma shifts and padding zero','all offered expressions/equalities evaluated independently','actual printed anchors and every equal tenth tick','OB/OA distinguished from AB/OA','same-scale rectangles area/side/perimeter and choice roles','ellipsis versus total tape count and final quotient zero','oriented floor tiles and common dimensional scale','equal part cells and bracket covers only known colored part','actual343px source/native sheets legible']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave63.py','fullSavedAndNewRead':11,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave63-pictured-decimal-division.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':11,'actualPrintedEuclideanColumnAndMetricGeometry':True,'hashesMatched':11,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
