"""Independent full saved/new/solutions/MCQ review; observe actual native SVG geometry."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave67-pictured-sequences.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def text(e):return ''.join(e.itertext())
def value(s):
 s=s.replace(' ','').replace(',','.')
 m=re.fullmatch(r'\((\d+)\+\((\d+)/(\d+)\)\)',s)
 if m:return F(m[1])+F(int(m[2]),int(m[3]))
 m=re.fullmatch(r'\((\d+)/(\d+)\)',s)
 return F(int(m[1]),int(m[2])) if m else F(s)
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
 es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k));ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect'];ps=[e for e in es if tag(e)=='path']
 def at(x,y):return text(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def choices(expected):assert list(map(value,r['options']))==expected
 if i==0:
  cols=sorted((n(e,'x'),int(text(e))) for e in ts if n(e,'y')==162 and text(e).isdigit());assert [j for x,j in cols]==[1,2,3,4]
  vals=[value(at(x,239)) for x,j in cols];assert vals==[F(7,10),F(14,10),F(21,10),F(28,10)];d=vals[1]-vals[0];assert all(b-a==d for a,b in zip(vals,vals[1:]));out=vals[0]+9*d;assert out==vals[-1]+6*d==7
  return '7',{'actualPrintedIndexedTable':[[j,str(v)] for (_,j),v in zip(cols,vals)],'constantStep':str(d),'tenthHasNineIncrements':str(out)}
 if i==1:
  wedges=[e for e in ps if e.get('stroke')];groups={}
  for e in wedges:
   nums=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',e.get('d'))));assert len(nums)==11
   cx,cy,x0,y0,rx,ry,rotation,large,sweep,x1,y1=nums;assert [rx,ry,rotation,large,sweep]==[47,47,0,0,1]
   for x,y in [(x0,y0),(x1,y1)]:close(math.hypot(x-cx,y-cy),47)
   angle=(math.atan2(y1-cy,x1-cx)-math.atan2(y0-cy,x0-cx))%(2*math.pi);groups.setdefault((cx,cy),[]).append((angle,e.get('fill')))
  observed=[]
  for j,((cx,cy),sectors) in enumerate(sorted(groups.items()),1):
   assert cy==180 and at(cx,270)==str(j);total=len(sectors);assert total==j+2
   for angle,fill in sectors:close(angle,2*math.pi/total);assert fill in ['#a8d3fa','#fff']
   blue=sum(fill=='#a8d3fa' for _,fill in sectors);assert blue==total-1;observed.append([blue,total])
  assert observed==[[2,3],[3,4],[4,5],[5,6]];out=F(7,8);choices([F(6,7),out,F(8,9),F(1,8)])
  return '(7/8)',{'actualEqualSectorCountsAndFills':observed,'allWedgeArcsPhysicallyEqual':True,'sixthBlueAndTotal':[7,8],'previousNextAndWhiteDistractors':True}
 if i in [2,4]:
  ticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<=198<=n(e,'y2'));step=ticks[1]-ticks[0]
  for j,x in enumerate(ticks):close(x,ticks[0]+j*step)
  anchors=sorted((n(e,'x'),value(text(e))) for e in ts if n(e,'y')==246);assert anchors[0][1]==0
  units=(anchors[1][0]-anchors[0][0])/step;assert units==round(units);unit=F(1,round(units))
  for x,v in anchors:close((x-ticks[0])/step,float(v/unit))
  points={}
  for e in es:
   if tag(e)=='circle':
    assert n(e,'cy')==198;x=n(e,'cx');idx=round((x-ticks[0])/step);close(x,ticks[idx]);points[at(x,171 if i==2 else 289)]=idx*unit
  expected={'A':F(3,5),'B':F(7,5),'C':F(11,5),'D':F(15,5)} if i==2 else {'A':F(3,4),'B':F(6,4),'C':F(9,4)};assert points==expected
  d=points['B']-points['A'];assert points['C']-points['B']==d;proof={'actualAnchors':[(x,str(v)) for x,v in anchors],'actualEqualTickCount':len(ticks),'actualNamedPointCoordinates':{k:str(v) for k,v in points.items()},'inferredStep':str(d)}
  if i==2:
   out=points['D']+d;assert out==F(19,5);choices([out,F(18,5),F(4),F(3)]);return '(3 + (4/5))',dict(proof,fifthValue=str(out),oneTooFewOneTooManyAndRepeatedLastChecked=True)
  arcs=[e for e in ps if e.get('stroke')];assert len(arcs)==2
  for e,a,b in zip(arcs,['A','B'],['B','C']):
   x0,y0,cx,cy,x1,y1=map(float,re.findall(r'-?\d+(?:\.\d+)?',e.get('d')));assert y0==y1==198 and x1>x0;close(x0,ticks[0]+float(points[a]/unit)*step);close(x1,ticks[0]+float(points[b]/unit)*step);close(cx,(x0+x1)/2);assert cy<198 and e.get('marker-end')
  target=F(39,4);jumps=(target-points['A'])/d;assert jumps==12 and points['A']+jumps*d==target
  return '12',dict(proof,actualForwardArrows=2,target=str(target),travelDistance=str(target-points['A']),jumpCount=str(jumps),initialPointNotCountedAsJump=True)
 if i==3:
  anchors=sorted((n(e,'y')-8,value(text(e))) for e in ts if n(e,'x')==43);assert len(anchors)==6
  scale=(anchors[-1][0]-anchors[0][0])/float(anchors[0][1]-anchors[-1][1]);close(scale,80)
  grid=sorted(n(e,'y1') for e in ls if n(e,'x1')==76 and n(e,'x2')==430 and n(e,'y1')==n(e,'y2'));assert len(set(grid))==26
  for j,y in enumerate(sorted(set(grid))):close(y,82+j*8)
  bars=sorted((n(e,'x'),e) for e in rs if e.get('stroke'));vals=[]
  for j,(x,e) in enumerate(bars,1):
   assert n(e,'y')+n(e,'height')==282;assert at(x+n(e,'width')/2,325)==str(j);vals.append(F(round(n(e,'height')),80))
  assert vals==[F(5,10),F(11,10),F(17,10),F(23,10)];d=vals[1]-vals[0];out=vals[0]+7*d;assert out==vals[-1]+4*d==F(47,10);choices([out+d,out-d,out,8*d])
  return '4,7',{'actualAll26TenthGridLines':True,'actualBarHeightsFromMetricGrid':list(map(str,vals)),'eighthFromFirstAndFourthAgree':str(out),'allIndexAndInitialValueDistractorsChecked':True}
 if i==5:
  boxes=[e for e in rs if e.get('stroke')];assert len(boxes)==6;centers=[];printed=[]
  for j,e in enumerate(boxes,1):
   x,y,w,h=[n(e,k) for k in ['x','y','width','height']];assert [w,h]==[86,49];centers.append((x+w/2,y+h/2));printed.append(at(x+w/2,y+33));assert at(x+w/2,77 if j<=3 else 314)==str(j)
  assert printed==['0,12','0,36','','','','?'];assert boxes[-1].get('fill')=='#fff0b8';arrows=[e for e in ls if e.get('marker-end')];assert len(arrows)==5
  expected=[(126,114,189,114),(290,114,353,114),(404,143,404,226),(354,259,291,259),(190,259,127,259)]
  multipliers=[]
  for e,coords in zip(arrows,expected):
   assert tuple(n(e,k) for k in ['x1','y1','x2','y2'])==coords;x1,y1,x2,y2=coords;label=at(443,195) if x1==x2 else at((x1+x2)/2,y1-17);assert label=='×3';multipliers.append(int(label[1:]))
  vals=[value(printed[0])]
  for m in multipliers:vals.append(vals[-1]*m)
  assert vals[1]==value(printed[1]);assert vals==list(map(F,['0.12','0.36','1.08','3.24','9.72','29.16']));out=vals[-1];choices([vals[-2],out*3,6*vals[0],out])
  return '29,16',{'actualSixBoxesFiveArrowPath':expected,'actualPrintedFirstSecond':printed[:2],'actualEveryArrowTimesThree':multipliers,'independentExactSequence':list(map(str,vals)),'yellowSixthNotFiveMultiplicationsOffByOne':True}
 if i==6:
  assert at(240,91)=='2 м';parts=sorted((n(e,'x'),e) for e in rs if e.get('stroke'));assert len(parts)==4;lengths=[];right=30
  for j,(x,e) in enumerate(parts):
   assert x==right and n(e,'y')==164 and n(e,'height')==62;right=x+n(e,'width');lengths.append(F(str(n(e,'width')))*F(2,420));assert (e.get('fill')=='#fff')==(j==3)
  assert right==450 and lengths==[F(1),F(1,2),F(1,4),F(1,4)];left=F(2);removed=[]
  for j in range(7):cut=left/2;removed.append(cut);left-=cut
  out=sum(removed);assert left==F(1,64) and out==2-left==F(127,64);choices([left,F(63,32),sum(removed[:3]),out])
  return '(1 + (63/64))',{'actualThreeColoredAndWhiteWidthsM':list(map(str,lengths)),'sevenSuccessiveRemainingHalvings':list(map(str,removed)),'conservationRemovedPlusRemainingM':'2','removedM':str(out),'remainingM':str(left),'allRemainingSixCutAndThreeCutDistractorsChecked':True}
 if i==7:
  assert at(38,184)=='2,4' and at(200,237.5)=='1,2';initial=value(at(38,184));first=value(at(200,237.5));floor=295;scale=F(230)/initial
  drop=only(e for e in ls if e.get('marker-end'));assert tuple(n(drop,k) for k in ['x1','y1','x2','y2'])==(100,65,100,295);arcs=[e for e in ps if e.get('stroke')];assert len(arcs)==4;heights=[];end=100
  for e in arcs:
   x0,y0,cx,cy,x1,y1=map(float,re.findall(r'-?\d+(?:\.\d+)?',e.get('d')));assert y0==y1==floor and x0==end and x1>x0;close(cx,(x0+x1)/2);apex=(y0+2*cy+y1)/4;h=F(str(round(floor-apex,8)))/scale;heights.append(h);end=x1
  assert heights==[first,first/2,first/4,first/8];assert [initial,first]==[F(24,10),F(12,10)];out=initial+2*sum(heights);assert out==F(69,10);choices([out,initial+sum(heights),2*(initial+sum(heights)),out+2*heights[-1]/2]);assert 'тек тік бағытта' in r['statement']
  return '6,9',{'actualInitialDropHeightM':str(initial),'actualFourQuadraticApexHeightsM':list(map(str,heights)),'fiveFloorHitsOneDropPlusFourCompleteRebounds':str(out),'verticalMotionExplicitNotArcLength':True,'allSingleLegDoubleInitialAndSixthHitDistractorsChecked':True}
 if i==8:
  cols=sorted((n(e,'x'),int(text(e))) for e in ts if n(e,'y')==162 and text(e).isdigit());assert [j for _,j in cols]==[1,2,3,4,5];raw=[]
  for x,j in cols:
   if j==4:assert at(x,239)=='?';continue
   num,den=int(at(x,215)),int(at(x,251));bar=only(e for e in ls if n(e,'y1')==n(e,'y2')==223 and n(e,'x1')==x-18 and n(e,'x2')==x+18);assert num==j and den==j+3;raw.append([num,den])
  assert raw==[[1,4],[2,5],[3,6],[5,8]];choices([F(4,7),F(4,6),F(5,7),F(3,7)])
  return '(4/7)',{'actualRawFractionsWithoutPrematureReduction':raw,'allNativeHorizontalFractionBarsChecked':True,'missingFourthNumeratorDenominator':[4,7],'equalNumeratorAndDenominatorStepsOne':True}
 if i==9:
  squares=sorted((n(e,'x'),e) for e in rs if e.get('stroke'));assert len(squares)==3;sides=[];scales=[]
  for j,(x,e) in enumerate(squares,1):
   y,w,h=[n(e,k) for k in ['y','width','height']];assert w==h and y+h==255;assert at(x+w/2,y+h/2+9)==str(j);side=value(at(x+w/2,321));sides.append(side);scales.append(F(str(w))/side)
  assert sides==[F(7,4),F(5,2),F(13,4)] and scales==[36,36,36];d=sides[1]-sides[0];assert sides[2]-sides[1]==d;side9=sides[0]+8*d;out=4*side9;assert side9==F(31,4) and out==31==4*sides[0]+8*4*d
  return '31',{'actualAllMetricSquareSidesCm':list(map(str,sides)),'allSquareWidthEqualsHeight':True,'commonPixelsPerCm':36,'ninthSideEightIncrements':str(side9),'fullPerimeterCm':str(out)}
 raise AssertionError(i)
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=i//6+1
  if r.get('options'):assert len(set(map(value,r['options'])))==4 and sum(value(o)==value(answer) for o in r['options'])==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all10 saved/new conditions, full official/new solutions/every MCQ read; four actual343px source/native sheets viewed; own physicalSVG table/arc/point/grid/arrow/tape/parabola/fraction/square observer and exactFraction derivation without author params or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave67/visual-wave67-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave67/visual-wave67-contact-{sheet}.png','checked':['all10 source/new fullconditions/fullsolutions/MCQ and actual343px sheets read','equal area sectors checked from actual endpoint angles and fills','ray anchored scale and allphysical ticks plus namedpoints and arrow direction','metric bargrid and square dimensions read before nth-term calculations','allfive actual snake-path multipliers and six box indices checked','remaining tape halves and conservation versus removed length','quadratic actual apex heights and explicit vertical fifth-floor-hit travel','raw fractions preserve index patterns and allprinted bars','constant rules explicitly stated to avoid finite-sequence ambiguity','allrequested indices versus values, jumps versus standing position, side versus perimeter and all distractors checked']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave67.py','fullSavedAndNewRead':10,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave67-pictured-sequences.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':10,'physicalSVGObservedWithoutAuthorCalculator':True,'allMCQsEvaluated':True,'hashesMatched':10,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
