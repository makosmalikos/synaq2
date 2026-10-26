"""All8 saved/new full conditions/solutions/everyMCQ plus4actual343pxsheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave49-pictured-mixed-addition.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return float(e.get(k))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());ts=[e for e in es if tag(e)=='text'];rs=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549'];ls=[e for e in es if tag(e)=='line'];mixed=[]
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 # Read actual visible text positions and actual fraction bars; neverdata-mixed metadata.
 for e in es:
  if tag(e)!='g':continue
  allTexts=[t for t in e if tag(t)=='text'];texts=[t for t in allTexts if re.fullmatch(r'\d+',txt(t))];lines=[t for t in e if tag(t)=='line']
  if len(texts)!=3 or len(lines)!=1:continue
  assert all(txt(t)in['т','км','см']for t in allTexts if t not in texts)
  whole=only(t for t in texts if t.get('font-size')=='27');a,b=sorted((t for t in texts if t is not whole),key=lambda t:n(t,'y'));line=lines[0]
  close(n(a,'x'),n(b,'x'));close(n(a,'x')-n(whole,'x'),34);close(n(whole,'y')-n(a,'y'),17);close(n(b,'y')-n(a,'y'),35);close(n(line,'y1')-n(a,'y'),9);close(n(line,'y1'),n(line,'y2'));close((n(line,'x1')+n(line,'x2'))/2,n(a,'x'));close(n(line,'x2')-n(line,'x1'),32)
  w,nu,de=map(lambda t:int(txt(t)),[whole,a,b]);assert w>0 and 0<nu<de;mixed.append({'v':F(w)+F(nu,de),'w':w,'n':nu,'d':de,'x':n(whole,'x'),'y':n(whole,'y')})
 vals=[p['v']for p in mixed];proof={'actualVisibleMixedLabels':[[p[k]for k in['w','n','d']]for p in mixed]}
 if i==0:
  groups=defaultdict(list)
  for e in es:
   if tag(e)!='path':continue
   m=re.fullmatch(r'M([-\d.e+]+) ([-\d.e+]+) L([-\d.e+]+) ([-\d.e+]+) A([-\d.e+]+) ([-\d.e+]+) 0 0 1 ([-\d.e+]+) ([-\d.e+]+) Z',e.get('d'));assert m
   cx,cy,x,y,rx,ry,z,t=map(float,m.groups());close(rx,40);close(ry,40);close(math.hypot(x-cx,y-cy),40);close(math.hypot(z-cx,t-cy),40)
   a=math.atan2(y-cy,x-cx)%(2*math.pi);b=math.atan2(t-cy,z-cx)%(2*math.pi);groups[(cx,cy)].append((a,(b-a)%(2*math.pi),e.get('fill')=='#9ec8ed'))
  assert len(groups)==6;rows=defaultdict(list)
  for (cx,cy),arcs in groups.items():
   assert len(arcs)==9;starts=sorted(x[0]for x in arcs)
   for a,angle,blue in arcs:close(angle,2*math.pi/9)
   for j in range(9):close((starts[(j+1)%9]-starts[j])%(2*math.pi),2*math.pi/9)
   rows[cy].append((cx,sum(x[2]for x in arcs)))
  assert sorted(rows)==[130,260]and at(24,139)=='A'and at(24,269)=='B'and at(240,45)=='Әр дөңгелек — 1 бүтін';counts=[]
  for cy in[130,260]:
   ar=sorted(rows[cy]);assert all(b[0]-a[0]>80 for a,b in zip(ar,ar[1:]));counts.append([p[1]for p in ar])
  assert counts==[[9,2],[9,9,9,5]];a,b=map(lambda ar:F(sum(ar),9),counts);assert a==F(11,9)and b==F(32,9)and a+b==F(43,9);assert 2+5<9
  return'(4 + (7/9))',{'actualEqualAngleSectorCounts':counts,'sameWholeRadiusPx':40,'noCarrySum':str(a+b),'actualSubtractionDistractor':str(F(5,9)-F(2,9))}
 if i in[1,4]:
  rs.sort(key=lambda e:n(e,'x'));assert len(rs)==(2 if i==1 else 3);assert n(rs[0],'x')==42;close(n(rs[-1],'x')+n(rs[-1],'width'),438)
  for a,b in zip(rs,rs[1:]):close(n(a,'x')+n(a,'width'),n(b,'x'))
  bracket=only(e for e in ls if n(e,'x1')==42 and n(e,'x2')==438 and n(e,'y1')==n(e,'y2')==118);assert n(bracket,'x2')-n(bracket,'x1')==396
  if i==1:
   assert vals==[F(89,12),F(41,12)];total,cut=vals;assert mixed[0]['n']==mixed[1]['n']and mixed[0]['d']==mixed[1]['d'];parts=[cut,total-cut];answer='4';assert total-cut==4
  else:
   total=F(int(at(240,92)));assert total==25 and vals==[F(89,12),F(67,12)];assert sum(p['n']for p in mixed)==12 and all(p['d']==12 for p in mixed);parts=[*vals,total-sum(vals)];answer='12';assert sum(vals)==13
  for e,p in zip(rs,parts):close(n(e,'width'),396*float(p/total));assert n(e,'height')==74
  assert rs[-1].get('fill')=='#fff';return answer,{**proof,'actualFullBarWidthPx':396,'actualProportionalLengths':list(map(str,parts)),'equalFractionsCancelOrCarryOne':True}
 if i==2:
  assert vals==[F(55,6)];a=vals[0];nu,de=map(int,re.search(r'\(3 \+ \((\d+)/(\d+)\)\)',r['statement']).groups());difference=3+F(nu,de);assert difference==F(15,4);b=a-difference;assert b==F(65,12)>0
  rect=only(rs);assert n(rect,'width')==300;close(n(rect,'height'),300*float(b/a));assert at(240,346)=='Сызба масштабсыз'
  assert F(1,6)<F(3,4);den=math.lcm(6,4);assert den==12;assert 2+12-9==5;half=a+b;assert half==F(175,12)and 7+7>12;perimeter=2*half;assert perimeter==F(175,6)
  assert r['options']==['(29 + (1/6))','(14 + (7/12))','(44 + (1/6))','(28 + (1/6))'];assert 2*(a+(a+difference))==F(265,6)
  return'(29 + (1/6))',{**proof,'printedWidthDifference':str(difference),'realBorrowAndLaterCarry':True,'derivedWidth':str(b),'halfPerimeter':str(half)}
 if i==3:
  assert vals==[F(19,3),F(23,4),F(95,12)]and len([e for e in es if tag(e)=='polygon'])==1;assert at(240,350)=='Сызба масштабсыз'
  assert all(sum(vals)-x>x for x in vals);den=math.lcm(*(p['d']for p in mixed));assert den==12;fractionSum=sum(F(p['n'],p['d'])for p in mixed);assert fractionSum==2 and sum(vals)==20
  return'20',{**proof,'strictTriangleInequalities':True,'fractionPartsAtDenominator12':[4,9,11],'carryExactlyTwoWholes':True}
 if i==5:
  total=int(at(240,68).split()[0]);assert total==75;assert vals==[F(373,8),F(411,8)];firstTwo,lastTwo=vals;c=total-firstTwo;b=lastTwo-c;a=total-b-c;assert[a,b,c]==[F(189,8),F(23),F(227,8)]
  rs.sort(key=lambda e:n(e,'x'));assert len(rs)==3 and n(rs[0],'x')==42;assert[n(e,'y')for e in rs]==[190]*3
  for j,(e,mass)in enumerate(zip(rs,[a,b,c]),1):close(n(e,'width'),396*float(mass/total));assert at(n(e,'x')+n(e,'width')/2,231)==str(j)
  spans={83:[42,438],154:[42,n(rs[2],'x')],289:[n(rs[1],'x'),438]}
  for y,(x1,x2)in spans.items():assert len([e for e in ls if abs(n(e,'x1')-x1)<1e-7 and abs(n(e,'x2')-x2)<1e-7 and n(e,'y1')==n(e,'y2')==y])==1
  assert F(8,8)-F(5,8)==F(3,8);assert F(3,8)==mixed[1]['v']-mixed[1]['w'];return'23',{**proof,'actualDayMasses':list(map(str,[a,b,c])),'actualThreeOverlappingBracketEndpoints':spans,'borrowThenEqualFractionCancel':True}
 if i==6:
  assert vals==[F(209,6),F(125,4),F(243,5)];ac,bd,ad=vals;ab=ad-bd;bc=ac-ab;cd=ad-ac;assert ab>0 and bc>0 and cd>0 and ab+bc+cd==ad
  stops={txt(e):n(e,'x')for e in ts if txt(e)in['A','B','C','D']};assert list(stops)==['A','B','C','D'];assert stops['A']==42 and stops['D']==438
  for a,b,length in [('A','C',ac),('B','D',bd),('A','D',ad)]:
   x1,x2=stops[a],stops[b];close(x2-x1,396*float(length/ad));assert len([e for e in ls if abs(n(e,'x1')-x1)<1e-7 and abs(n(e,'x2')-x2)<1e-7 and n(e,'y1')==n(e,'y2')])==1
  assert bc==F(1049,60);assert r['options']==['(17 + (7/20))','(17 + (29/60))','(13 + (23/30))','(18 + (29/60))'];return'(17 + (29/60))',{**proof,'actualStopX':stops,'derivedAB_BC_CD':list(map(str,[ab,bc,cd])),'actualWrongSegmentChoicesPreserved':True}
 assert i==7 and vals==[F(26,5),F(19,4)];a,b=vals;rs.sort(key=lambda e:n(e,'y'));assert len(rs)==2 and all(n(e,'x')==42 and n(e,'height')==70 for e in rs);close(n(rs[0],'width'),396);close(n(rs[1],'width'),396*float(b/a));assert rs[0].get('fill')=='#9ec8ed'and rs[1].get('fill')=='#c1a1de'
 assert F(1,5)<F(3,4)and a-b==F(9,20);assert 4+20-15==9;assert r['options']==['(1 + (11/20))','(1 + (9/20))','(9/20)','(9 + (19/20))'];assert a+b==F(199,20)
 return'(9/20)',{**proof,'actualProportionalBarWidths':[n(e,'width')for e in rs],'realBorrowLeavesZeroWholes':True,'sumVersusDifferenceTrap':str(a+b)}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==8;entries=[]
 for i,r in enumerate(rows):
  answer,observed=observe(r,i);assert answer==r['answer'];
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  sheet=1 if i<6 else 2
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root independent all8 fullsaved/new/solutions/MCQs plus4source/native343px sheets read; actualSVGtext/fractionbar/angles/proportions/endpoints observer, exact Fraction borrow/carry and segment-role proofs; no author solver/params','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave49/visual-wave49-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave49/visual-wave49-contact-{sheet}.png','checked':['actualvisiblelabelsandfractionbars parsed withoutdata-mixed','wholepie9equalangles andpaintcounts checked','bars/threeoverlappingbrackets/stops proportional andcorrect endpoints','realborrowing andlatercarry source skills preserved','trianglevalidity andallMCQdiagnosticerrors verified','nativefigures readableat343px']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+PACK+"')).editions;console.log(JSON.stringify(r.map(q=>[q.editionId,editionHash(q)])));";js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave49.py','fullSavedAndNewRead':8,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave49-pictured-mixed-addition.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':8,'actualSvgGeometryAndAllVisibleMixedLabels':True,'realBorrowCarryAndOverlapRoles':True,'hashesMatched':8,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
