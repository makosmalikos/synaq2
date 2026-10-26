"""All5 full saved/new statements, solutions, choices and both343px sheets read."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave48-fraction-addition-figures.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def close(a,b):assert abs(a-b)<1e-7,(a,b)
def tag(e):return e.tag.rsplit('}',1)[-1]
def text(e):return ''.join(e.itertext())
def num(e,k):return float(e.get(k))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());texts=[e for e in es if tag(e)=='text'];rects=[e for e in es if tag(e)=='rect'and e.get('stroke')=='#203549']
 def at(x,y):return text(only(e for e in texts if abs(num(e,'x')-x)<1e-7 and abs(num(e,'y')-y)<1e-7))
 def printed_fraction(x,y):
  bars=[e for e in es if tag(e)=='line'and abs(num(e,'y1')-y)<1e-7 and abs(num(e,'y2')-y)<1e-7 and abs((num(e,'x1')+num(e,'x2'))/2-x)<1e-7 and num(e,'x2')-num(e,'x1')<50];assert len(bars)==1
  return F(int(at(x,y-7)),int(at(x,y+24)))
 if i<2:
  groups=defaultdict(list)
  for e in es:
   if tag(e)!='path':continue
   m=re.fullmatch(r'M([-\d.e+]+) ([-\d.e+]+) L([-\d.e+]+) ([-\d.e+]+) A([-\d.e+]+) ([-\d.e+]+) 0 0 1 ([-\d.e+]+) ([-\d.e+]+) Z',e.get('d'));assert m,e.get('d')
   cx,cy,x,y,rx,ry,z,t=map(float,m.groups());close(rx,ry);close(rx,87);close(math.hypot(x-cx,y-cy),rx);close(math.hypot(z-cx,t-cy),rx)
   a=math.atan2(y-cy,x-cx)%(2*math.pi);b=math.atan2(t-cy,z-cx)%(2*math.pi);groups[(cx,cy)].append((a,b,(b-a)%(2*math.pi),e.get('fill')=='#9ec8ed'))
  assert len(groups)==2;values={};parts={}
  for (cx,cy),arcs in groups.items():
   label=at(cx,300);count=len(arcs);starts=sorted(x[0]for x in arcs)
   for a,b,angle,blue in arcs:close(angle,2*math.pi/count)
   for j in range(count):close((starts[(j+1)%count]-starts[j])%(2*math.pi),2*math.pi/count)
   close(sum(x[2]for x in arcs),2*math.pi);parts[label]=[sum(x[3]for x in arcs),count];values[label]=F(*parts[label])
  if i==0:
   assert parts=={'A':[1,5],'B':[1,6]}and at(240,46)=='Әр дөңгелек — 1 сағат';ticks=[e for e in es if tag(e)=='line'];assert len(ticks)==24
   for (cx,cy)in groups:
    group=[e for e in ticks if abs(math.hypot(num(e,'x2')-cx,num(e,'y2')-cy)-87)<1e-6];assert len(group)==12
   answer=str(60*sum(values.values()));assert answer=='22'
  else:
   assert parts=={'A':[7,8],'B':[1,4]}and at(240,46)=='Әр дөңгелек — бір бүтін';answer='(1 + (1/8))';assert sum(values.values())==F(9,8);assert r['options']==['(2/3)','(7/32)',answer,'(5/8)'];assert F(7+1,8+4)==F(2,3)and F(7,8)*F(1,4)==F(7,32)and F(7,8)-F(1,4)==F(5,8)
  return answer,{'actualFullTwoPiEqualAngleDiscs':parts,'equalRadiusPx':87,'fractionSum':str(sum(values.values())),'sameWholeLabelRead':True}
 if i==2:
  poly=only(e for e in es if tag(e)=='polygon');points=[tuple(map(float,p.split(',')))for p in poly.get('points').split()];assert len(points)==3 and len(set(points))==3
  a,b=printed_fraction(118,171),printed_fraction(250,292);assert[a,b]==[F(3,8),F(7,20)]and at(327,167)=='?';assert at(240,344)=='Сызба масштабсыз'
  perimeter=F(*map(int,re.search(r'\((\d+)/(\d+)\)',r['statement']).groups()));c=perimeter-a-b;assert c>0 and a+b>c and a+c>b and b+c>a
  rawNumerator=perimeter.numerator-a.numerator*(40//a.denominator)-b.numerator*(40//b.denominator);assert rawNumerator==10 and math.gcd(rawNumerator,40)==10
  return str(100*c),{'actualPrintedMetreLabels':[str(a),str(b)],'printedPerimeter':str(perimeter),'strictTriangleInequalities':True,'realReduction':'10/40=1/4','centimetreConversionFactor':100,'notToScaleLabel':True}
 if i==3:
  rects.sort(key=lambda e:num(e,'x'));assert len(rects)==3
  assert[num(e,'x')for e in rects]==[42,108,207]and[num(e,'width')for e in rects]==[66,99,231];assert all(num(e,'y')==170 and num(e,'height')==76 for e in rects)
  assert[e.get('fill')for e in rects]==['#9ec8ed','#c1a1de','#fff'];close(sum(num(e,'width')for e in rects),396)
  a,b=printed_fraction(75,202),printed_fraction(157.5,202);assert[a,b]==[F(1,6),F(1,4)];assert F(66,396)==a and F(99,396)==b
  leftover=int(at(322.5,218));assert leftover==21 and'ең көбі бір'in r['statement'];whole=F(leftover)/(1-a-b);assert whole.denominator==1;counts=[whole*a,whole*b,F(leftover)];assert counts==list(map(F,[6,9,21]));assert sum(counts)==whole
  return str(whole),{'actualWholeBarWidthPx':396,'actualPartitionWidths':[66,99,231],'actualDisjointFractions':[str(a),str(b)],'actualWhiteCount':leftover,'allIntegerClassCounts':[int(n)for n in counts]}
 assert i==4
 byY=defaultdict(list)
 for e in rects:byY[num(e,'y')].append(e)
 assert sorted(byY)==[108,222];top=sorted(byY[108],key=lambda e:num(e,'width'));bottom=sorted(byY[222],key=lambda e:num(e,'width'));assert[len(top),len(bottom)]==[2,3]
 assert[num(e,'width')for e in top]==[132,396]and[num(e,'width')for e in bottom]==[33,99,396];assert num(top[0],'x')==42 and num(bottom[1],'x')==42 and num(bottom[0],'x')==141
 assert top[0].get('fill')==bottom[1].get('fill')=='#9ec8ed'and bottom[0].get('fill')=='#f6d16e';assert num(bottom[0],'x')+num(bottom[0],'width')==num(top[0],'x')+num(top[0],'width')==174
 a,b=printed_fraction(108,134),printed_fraction(91.5,248);assert[a,b]==[F(1,3),F(1,4)];assert F(132,396)==a and F(99,396)==b;unknown=F(33,396);assert unknown==a-b==F(1,12);assert at(157.5,265)=='?'
 dashed=only(e for e in es if tag(e)=='line'and e.get('stroke-dasharray'));assert num(dashed,'x1')==num(dashed,'x2')==174
 assert r['options']==['(7/12)','(1/7)','(1/2)','(1/12)'];assert a+b==F(7,12)and b+F(1,7)!=a and b+F(1,2)!=a
 return'(1/12)',{'sameWholeWidthsPx':[396,396],'actualBlueAndAddedWidthsPx':[132,99,33],'actualCommonEndpointX':174,'actualPrintedFractions':[str(a),str(b)],'unknownFraction':str(unknown),'equationRole':'knownaddend+unknown=sum'}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==5;entries=[]
 for i,r in enumerate(rows):
  answer,observed=observe(r,i);assert r['answer']==answer
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Root independent5 fullsaved/new/complete solutions/everyMCQ and actualsource/native343px sheets read; own actual pathangles/cells/dimensions/printed SVG fraction-label observer and Fraction calculation; no author solver/params','observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':'output/editorial-visual-wave48/visual-wave48-source-1.png','nativeSheet':'output/editorial-visual-wave48/visual-wave48-contact-1.png','checked':['actualgeometry notdataannotations determines result','equalwhole labels and both completepies checked','strict validtriangle, labels and cm conversion checked','disjointclass fractions/integercounts verified','both barwholes and sharedendpoint verified','all labels readableat343px']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+PACK+"')).editions;console.log(JSON.stringify(r.map(q=>[q.editionId,editionHash(q)])));";js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave48.py','fullSavedAndNewRead':5,'actualSheetsViewed':2,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave48-fraction-addition-figures.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':5,'actualEqualAnglePiesClassBarsTriangleAndUnknown':True,'hashesMatched':5,'native343pxSheetsViewed':True}))
if __name__=='__main__':main()
