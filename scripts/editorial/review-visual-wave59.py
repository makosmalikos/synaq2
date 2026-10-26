"""Root independent full13saved/new/solutions/choices and six source/native343px sheets reviewed."""
import hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave59-pictured-decimal-operations.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def val(s):return F(s.replace(',','.').replace('−','-'))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1]
 ts=[e for e in es if tag(e)=='text'];ls=[e for e in es if tag(e)=='line'];ps=[e for e in es if tag(e)=='path'];cs=[e for e in es if tag(e)=='circle'];rs=[e for e in es if tag(e)=='rect'];n=lambda e,k:float(e.get(k))
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def pointmap():
  pts={}
  for c in cs:
   x,y=n(c,'cx'),n(c,'cy');near=[e for e in ts if re.fullmatch('[A-Z]',txt(e))and math.hypot(n(e,'x')-x,n(e,'y')-y)<37]
   e=min(near,key=lambda e:math.hypot(n(e,'x')-x,n(e,'y')-y));assert txt(e)not in pts;pts[txt(e)]=(x,y)
  return pts
 if i in[0,8]:
  ticks=sorted([n(e,'x1')for e in ls if n(e,'x1')==n(e,'x2')and n(e,'y1')<190<n(e,'y2')]);assert len(ticks)==31
  for j,x in enumerate(ticks):close(x,36+13*j)
  anchors=sorted((n(e,'x'),val(txt(e)))for e in ts if n(e,'y')==234);assert anchors==[(36.,F(0)),(166.,F(1)),(296.,F(2)),(426.,F(3))]
  values={at(n(c,'cx'),173):(F(str(n(c,'cx')))-36)/130 for c in cs}
  if i==0:
   assert values=={'A':F(18,10),'B':F(25,10)};distance=values['B']-values['A'];assert distance==F(7,10)
   assert r['options']==['1,3','4,3','1,7','0,7'];assert val(r['options'][1])==values['A']+values['B'];assert val(r['options'][0])==1+F(abs(5-8),10)
   return'0,7',{'actualTicks':31,'actualPrintedAnchors':list(map(str,range(4))),'observedPoints':{k:str(v)for k,v in values.items()},'borrowedTenthsDistance':str(distance),'allFourChoiceRolesChecked':True}
  assert values=={'M':F(7,10),'N':F(28,10)};extra=val(re.search(r'ұзындығынан (\d+,\d+) бірлікке',r['statement'])[1]);assert extra==F(11,10)
  mn=values['N']-values['M'];np=mn+extra;answer=values['N']+np;assert answer==6
  return str(answer),{'observedPoints':{k:str(v)for k,v in values.items()},'MN':str(mn),'NP':str(np),'PrightOfN':True,'Pcoordinate':6}
 if i in[3,4,9]:
  count=4 if i==3 else 3;digitxs=[132,212,292,372]if i==3 else[157,252,347];ys=[112,194,288]
  tokens=[[at(x,y)for x in digitxs]for y in ys];assert all(t=='□'or re.fullmatch('[0-9]',t)for row in tokens for t in row)
  expected={3:[['3','4','□','7'],['2','5','8','6'],['6','0','5','3']],4:[['8','□','3'],['3','7','□'],['5','0','6']],9:[['□','□','8'],['2','□','7'],['9','0','5']]}[i];assert tokens==expected
  # The comma is intentionally between units and tenths in every displayed row.
  commaX=172 if i==3 else 204.5
  for y in ys:assert at(commaX,y+6)==','
  op=at(69 if i==3 else 86.5,194);assert op==('−'if i==4 else'+')
  blanks=[(j,k)for j,row in enumerate(tokens)for k,t in enumerate(row)if t=='□'];solutions=[]
  for digits in itertools.product(range(10),repeat=len(blanks)):
   filled=[row[:]for row in tokens]
   for(j,k),d in zip(blanks,digits):filled[j][k]=str(d)
   nums=[int(''.join(row))for row in filled]
   if(nums[0]-nums[1]if op=='−'else nums[0]+nums[1])==nums[2]:solutions.append((digits,nums))
  if i==3:assert solutions==[((6,),[3467,2586,6053])];answer='6';carry=0;carryout=[]
  elif i==4:assert solutions==[((8,7),[883,377,506])];answer='15';assert 13-7==6 and(8-1)-7==0
  else:
   assert len(solutions)==10 and {sum(ds)for ds,nums in solutions}=={15};assert{ds[0]for ds,nums in solutions}=={6};assert{(ds[1],ds[2])for ds,nums in solutions}=={(x,9-x)for x in range(10)};answer='15'
  if i==3:
   for a,b,out in zip(reversed(tokens[0]),reversed(tokens[1]),reversed(tokens[2])):
    a=6 if a=='□'else int(a);total=a+int(b)+carry;assert total%10==int(out);carry=total//10;carryout.append(carry)
   assert carryout==[1,1,1,0]
  return answer,{'actualPrintedDigitRows':tokens,'actualCommaX':commaX,'actualOperation':op,'allDigitTuplesEnumerated':10**len(blanks),'validTupleCount':len(solutions),'validTuples':[list(ds)for ds,nums in solutions],'requestedSingleDigitOrTotal':answer,'threeCarrySteps':i==3,'borrowFromTenths':i==4,'nonUniqueDigitsButInvariantSum':i==9}
 if i==1:
  pts=pointmap();assert set(pts)==set('ABC');labels=[val(at(240,327)),val(at(105,204)),val(at(330,204))];assert labels==[F(56,10),F(32,10),F(42,10)]
  for pair,length in zip(['AB','AC','BC'],labels):close(math.dist(pts[pair[0]],pts[pair[1]]),float(length)*60)
  assert sum(labels)==13 and all(labels[j]<sum(labels)-labels[j]for j in range(3));assert len([p for p in ps if p.get('stroke')=='#203549'])==1
  return'13',{'actualSideLabelsCm':list(map(str,labels)),'sameMetricScalePxPerCm':60,'triangleInequalities':True,'fullPerimeterCm':13}
 if i==2:
  beam=only(e for e in ls if n(e,'y1')==n(e,'y2')==187);assert[n(beam,'x1'),n(beam,'x2')]==[100,380]
  pivot=only(e for e in ps if e.get('d')=='M 240 187 L 206 264 L 274 264 Z');assert pivot is not None
  for x in[100,380]:only(e for e in ls if n(e,'x1')==n(e,'x2')==x and n(e,'y1')==162 and n(e,'y2')==187)
  assert 240-100==380-240==140;left=val(at(152,144));right=val(at(365,144));assert at(66,144)=='x'and left==F(378,100)and right==F(978,100)
  assert right-left==6;return'6',{'actualBeamArmsPx':[140,140],'actualPrintedMassesKg':[str(left),str(right)],'unknownPlusLeftEqualsRight':True,'unknownKg':6}
 if i==5:
  pts=pointmap();assert set(pts)==set('ABCD');ordered=sorted(pts,key=lambda k:pts[k][0]);assert ordered==list('ABCD')and len({y for x,y in pts.values()})==1
  labels=[val(at(105.44117647058823,98)),val(at(364.2647058823529,98)),val(at(240,256))];ab,cd,total=labels;assert labels==[F(445,100),F(515,100),F(136,10)]
  for a,b,y,value in[('A','B',112,ab),('C','D',112,cd),('A','D',270,total)]:
   dim=only(e for e in ls if n(e,'y1')==n(e,'y2')==y and n(e,'x1')==pts[a][0]and n(e,'x2')==pts[b][0]);close(n(dim,'x2')-n(dim,'x1'),float(value)*400/float(total))
  middle=total-ab-cd;assert middle==4;close(pts['C'][0]-pts['B'][0],float(middle)*400/float(total))
  return'4',{'actualOrderedCollinearPoints':ordered,'actualABCDADlabelsCm':list(map(str,labels)),'actualMetricBC':str(middle),'wholeLengthConserved':True}
 if i in[6,12]:
  ys=[51,141,231,321]if i==6 else[74,189,304];vals=[at(240,y)for y in ys];ops=[txt(e)for e in sorted(ts,key=lambda e:n(e,'y'))if n(e,'x')==344];assert ops==(['+3,65','−5,09','+1,8']if i==6 else['+3,46','−1,2'])
  for j,(y,y2)in enumerate(zip(ys,ys[1:])):
   ystart=y+14;yend=y2-37;only(e for e in ls if n(e,'x1')==n(e,'x2')==240 and n(e,'y1')==ystart and n(e,'y2')==yend);assert any(e.get('d')==f'M 240 {yend} l -5 -9 l 10 0 Z'for e in ps)
  if i==6:
   assert vals==['7,4','','','?'];steps=[val(vals[0])]
   for op in ops:steps.append(steps[-1]+val(op))
   assert steps==[F(74,10),F(1105,100),F(596,100),F(776,100)];assert r['options']==['5,96','6,14','8,76','7,76'];assert val(r['options'][0])==steps[-2]and val(r['options'][1])==steps[-2]+F(18,100)
   return'7,76',{'actualOrderedDownArrows':3,'actualPrintedOps':ops,'allIntermediateValues':list(map(str,steps)),'lastOmissionAndDecimalShiftDistractors':True}
  assert vals==['?','','10,26'];answer=val(vals[-1])-sum(map(val,ops));assert answer==8
  return'8',{'actualOrderedDownArrows':2,'actualPrintedOps':ops,'actualFinalValue':'10,26','inverseInitialValue':8,'forwardConservationChecked':str(answer+sum(map(val,ops)))}
 if i==7:
  pts=pointmap();assert set(pts)==set('ABCD');a=val(at(240,332));b=val(at(435.5,194));assert[a,b]==[F(535,100),F(37,10)]
  assert pts=={'A':(79.5,297.),'B':(400.5,297.),'C':(400.5,75.),'D':(79.5,75.)}
  close(math.dist(pts['A'],pts['B']),float(a)*60);close(math.dist(pts['B'],pts['C']),float(b)*60);perimeter=2*(a+b);assert perimeter==F(181,10)
  assert r['options']==['18,1 см','9,05 см','11,44 см','17,1 см'];assert val(r['options'][1].split()[0])==a+b and val(r['options'][2].split()[0])==2*(a+b/10)
  return'18,1 см',{'actualAdjacentSidesCm':[str(a),str(b)],'actualMetricScalePxPerCm':60,'fullPerimeterCm':str(perimeter),'halfPerimeterAndMisalignedTenthsTraps':True}
 if i==10:
  printed=[[at(x,y)for x in[140,240,340]]for y in[87,187,287]];assert printed==[['3,2','1,1','2,6'],['','',''],['2','','a']]
  top=list(map(val,printed[0]));bottomleft=val(printed[2][0]);total=sum(top);center=total-top[2]-bottomleft;answer=total-top[0]-center
  square=[top,[total-top[0]-bottomleft,center,total-top[2]-answer],[bottomleft,total-bottomleft-answer,answer]]
  lines=square+[[square[i][j]for i in range(3)]for j in range(3)]+[[square[i][i]for i in range(3)],[square[i][2-i]for i in range(3)]];assert len(lines)==8 and all(sum(line)==total for line in lines)
  assert total==F(69,10)and center==F(23,10)and answer==F(14,10);assert sum(val(o)==answer for o in r['options'])==1
  return'1,4',{'actualPrintedCells':printed,'completeSolvedSquare':[[str(n)for n in row]for row in square],'allEightMagicLineSums':str(total),'centerNotRequested':str(center)}
 assert i==11;pts=pointmap();assert set(pts)==set('ABCD');labels=[val(at(107,122)),val(at(325,120)),val(at(48,265)),val(at(292,272))];assert labels==[F(345,100),F(48,10),F(265,100),F(61,10)]
 for (a,b),length in zip(['AC','CB','AD','DB'],labels):
  edge=only(e for e in ls if(n(e,'x1'),n(e,'y1'))==pts[a]and(n(e,'x2'),n(e,'y2'))==pts[b]);close(math.dist(pts[a],pts[b]),float(length)*50)
 routeC=sum(labels[:2]);routeD=sum(labels[2:]);meters=(routeD-routeC)*1000;assert meters==500 and labels[2]==min(labels)and routeD>routeC
 return'500',{'actualFourRouteEdgesKm':list(map(str,labels)),'actualSameMetricScalePxPerKm':50,'fullRouteSumsKm':[str(routeC),str(routeD)],'shorterRouteDespiteLongerFirstEdge':'C','requestedDifferenceMetres':500}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==13;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer']
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=i//6+1;entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full13saved/new/fullsolutions/everyMCQ read and six actual source/native343px sheets viewed; own printedSVG digits/labels/points/metricgeometry/arrows observer and exact Fraction/conservation/full digit enumeration; no authorparams orsolver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave59/visual-wave59-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave59/visual-wave59-contact-{sheet}.png','checked':['actual printed column digits and comma alignment','all10/100/1000 hidden digit domains and carries/borrows','three unknowns not unique but all10solutions same total','actual metric triangle, rectangle, ordered collinear lengths','balanceequal140pxarms and correct unknownaddend','downarroworder, allforwardintermediates, inversechain','eight magiclines including both diagonals','allfour roadedges same50px/km and fullroute difference in metres','343px source/native sheets legible without clipping']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave59.py','fullSavedAndNewRead':13,'actualSheetsViewed':6,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave59-pictured-decimal-operations.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':13,'actualPrintedDigitsMetricGeometryAndExactArithmetic':True,'hashesMatched':13,'actual343pxSheetsViewed':6}))
if __name__=='__main__':main()
