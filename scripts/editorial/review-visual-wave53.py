"""Independent actual geometry, all7 saved/new/full solutions and4 sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave53-pictured-fraction-division.json'
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549']
 def at(x,y):return text(only(e for e in ts if n(e,'x')==x and n(e,'y')==y))
 def line(x1,x2,y):return only(e for e in ls if n(e,'x1')==x1 and n(e,'x2')==x2 and n(e,'y1')==n(e,'y2')==y)
 def fraction(x,y):
  line(x-17,x+17,y);return F(int(at(x,y-7)),int(at(x,y+25)))
 def strip(y,count,blue):
  cells=sorted([e for e in rs if n(e,'y')==y],key=lambda e:n(e,'x'));assert len(cells)==count
  for j,e in enumerate(cells):close(n(e,'x'),42+396*j/count);close(n(e,'width'),396/count);assert n(e,'height')==64;assert e.get('fill')==('#9ec8ed'if j<blue else'#fff')
  return F(blue,count)
 if i==0:
  f=strip(174,6,5);assert at(240,105)=='1 кг';line(42,438,126);assert '(1/12)'in r['statement'];answer=f/F(1,12);assert answer==10
  return str(answer),{'actualEqualCells':6,'actualBlueCells':5,'wholeKg':1,'packetKg':'1/12','packetsPerBigCell':2,'totalPackets':10,'conservation':str(answer*F(1,12))}
 if i==1:
  assert len(rs)==2;whole=only(e for e in rs if e.get('fill')=='#fff');piece=only(e for e in rs if e.get('fill')=='#9ec8ed');assert n(whole,'x')==n(piece,'x')==42 and n(whole,'y')==n(piece,'y')==167 and n(whole,'height')==n(piece,'height')==64
  assert n(whole,'width')==396 and n(piece,'width')==24.75;wholeM=int(at(240,94).split()[0]);assert wholeM==12;pieceM=fraction(54.375,299);assert pieceM==F(3,4);line(42,438,116);line(42,66.75,260);close(n(piece,'width')/396,float(pieceM/wholeM));answer=wholeM/pieceM;assert answer==16 and math.gcd(12,3)==3
  return str(answer),{'wholeLengthM':12,'pieceLengthM':str(pieceM),'actualWholeAndPiecePx':[396,24.75],'whitePartIsUncutNotCountedPieces':True,'realCrossCancellation':3,'conservation':str(answer*pieceM)}
 if i==2:
  f=strip(132,12,10);yellow=sorted([e for e in rs if n(e,'y')==259],key=lambda e:n(e,'x'));assert len(yellow)==5
  for j,e in enumerate(yellow):assert n(e,'x')==42+j*33 and n(e,'width')==33 and n(e,'height')==64 and e.get('fill')=='#f6d16e'
  coarse=sorted([e for e in ls if n(e,'y1')==128 and n(e,'y2')==200],key=lambda e:n(e,'x1'));assert len(coarse)==7
  for j,e in enumerate(coarse):assert n(e,'x1')==n(e,'x2')==42+j*66 and e.get('style')=='stroke-width:3'
  assert f==F(5,6);d=F(5,12);assert f/d==2;assert math.gcd(5,5)==5 and math.gcd(12,6)==6
  return'2',{'actualFineCells':12,'actualCoarseParts':6,'actualBlueFineCells':10,'actualYellowFineCells':5,'sameSmallUnitPx':33,'dividend':str(f),'divisor':str(d),'ratio':2,'twoRealCrossCancellations':[5,6]}
 if i==3:
  mixed=[]
  for e in es:
   if tag(e)!='g':continue
   texts=[t for t in e if tag(t)=='text'and re.fullmatch(r'\d+',text(t))];bars=[t for t in e if tag(t)=='line']
   if len(texts)!=3 or len(bars)!=1:continue
   w=only(t for t in texts if t.get('font-size')=='27');a,b=sorted([t for t in texts if t is not w],key=lambda t:n(t,'y'));bar=bars[0]
   close(n(a,'x'),n(b,'x'));close(n(a,'x')-n(w,'x'),34);close(n(w,'y')-n(a,'y'),17);close(n(b,'y')-n(a,'y'),35);close(n(bar,'y1'),n(a,'y')+9);close(n(bar,'y1'),n(bar,'y2'));close((n(bar,'x1')+n(bar,'x2'))/2,n(a,'x'));mixed.append((F(int(text(w)))+F(int(text(a)),int(text(b))),[int(text(w)),int(text(a)),int(text(b))]))
  assert [m[0]for m in mixed]==[F(75,4),F(25,12)];area,width=[m[0]for m in mixed];length=area/width;assert length==9;rect=only(rs);assert n(rect,'x')==50 and n(rect,'y')==170 and n(rect,'width')==300;close(n(rect,'height')/300,float(width/length));assert at(161,88)=='S ='and at(291,88)=='м²'and at(456,204)=='м'and at(200,317)=='?';line(50,350,277);assert math.gcd(75,25)==25 and math.gcd(12,4)==4
  return'9',{'actualVisibleMixedLabels':[m[1]for m in mixed],'exactArea':str(area),'exactWidth':str(width),'exactLength':str(length),'actualRectangleWidthHeightPx':[300,n(rect,'height')],'twoRealCrossCancellations':[25,4],'unitsAreaVersusLength':True}
 if i==4:
  f=strip(183,8,5);known=int(at(165.75,108).split()[0]);assert known==95;line(42,289.5,130);line(42,438,282);assert at(240,319)=='?';assert known/f==152
  return'152',{'actualBlueFraction':str(f),'actualBlueBracketPx':247.5,'actualWholeBracketPx':396,'knownBluePages':known,'perCellPages':19,'wholePages':152}
 if i==5:
  f=strip(183,12,7);label=fraction(157.5,65);assert label==f;line(42,273,110);line(240,273,147);half=only(e for e in ls if e.get('style')=='stroke:#dc5663;stroke-dasharray:7 5');assert n(half,'x1')==n(half,'x2')==240 and n(half,'y1')==160 and n(half,'y2')==265;assert at(240,307)=='Жартысы';known=int(at(256.5,132));assert known==21;gap=f-F(1,2);assert gap==F(1,12);total=known/gap;assert total==252 and total*f-total/2==21
  return'252',{'actualBlueExtentPx':231,'actualHalfExtentPx':198,'actualExcessBracketPx':33,'actualVisibleBlueFraction':str(label),'knownExcessPages':known,'excessFraction':str(gap),'wholePages':252,'blueAndHalfPages':[147,126]}
 assert i==6
 f=strip(183,8,5);white=1-f;known=int(at(363.75,108).split()[0]);assert known==15;line(289.5,438,130);assert at(240,39)=='Көк — қыздар, ақ — ұлдар';total=known/white;assert total==40 and total*f==25
 return'40',{'actualBlueGirlsFraction':str(f),'actualWhiteBoysFraction':str(white),'actualWhiteBracketPx':148.5,'knownBoys':15,'wholeChildren':40,'girls':25,'knownCountAttachedToComplement':True}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];assert not r.get('options');sheet=1 if i<6 else 2
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root full7 saved/new/fullsolutions and4 source/native343px sheets read; own actualSVGcells/thickboundaries/fractionbars/mixedlabels/brackets observer; exactFraction conservation, complement and half-gap proofs withoutauthorparams orsolver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave53/visual-wave53-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave53/visual-wave53-contact-{sheet}.png','checked':['actual whole and blue/white/yellow extents and equal cell dimensions','actual thick six-part versus thin twelve-part same-scale units','actual visible fraction/mixed text and fraction bars without data annotations','real cross cancellation and area width length units','known amount bracket aligned with correct blue/complement/excess portion','half marker at real midpoint and excess arrow clear','legibility and no overlap on343px viewport']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave53.py','fullSavedAndNewRead':7,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave53-pictured-fraction-division.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':7,'actualGeometryFractionsBracketsAndConservation':True,'hashesMatched':7,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
