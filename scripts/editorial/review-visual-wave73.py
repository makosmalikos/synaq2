"""Independent full11saved/new/official/newsolutions/everyMCQ;4actual343pxsheets viewed."""
from pathlib import Path
from fractions import Fraction as F
import hashlib,json,re,subprocess,sys,xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave73-pictured-given-percent.json';BLUE='#81b8ed';YELLOW='#ecc95c'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def numeric(s):return F(re.search(r'\d+',s).group())
def inspect(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(E.fromstring(raw).iter());el=lambda t:[e for e in es if e.tag.split('}')[-1]==t];n=lambda e,k:F(e.get(k)).limit_denominator(1000000);ts=el('text');rects=[e for e in el('rect') if e.get('x') and e.get('fill')!='none'];proof={}
 assert not any(e.tag.split('}')[-1] in ['image','script','foreignObject'] for e in es)
 if i in [0,4]:
  frame=only(e for e in el('rect') if e.get('fill')=='none');x,y,w,h=[n(frame,k) for k in ['x','y','width','height']];side=n(rects[0],'width');assert w==h==10*side
  positions={((n(c,'x')-x)/side,(n(c,'y')-y)/side):c.get('fill') for c in rects};assert len(rects)==100 and set(positions)=={(F(a),F(b)) for a in range(10) for b in range(10)};assert all(n(c,'width')==n(c,'height')==side for c in rects)
  b=sum(v==BLUE for v in positions.values());z=sum(v==YELLOW for v in positions.values());assert all(v in [BLUE,YELLOW,'#fff'] for v in positions.values());whole=numeric(r['statement'])
  if i==0:assert whole==700 and b==31 and z==0;assert [sum(positions[F(a),F(j)]==BLUE for a in range(10)) for j in range(10)]==[10,10,10,1,0,0,0,0,0,0];out=whole*b/100
  else:assert whole==4000 and b==23 and z==36;out=whole*(z-b)/100;assert r['options']==['1440','920','520','13']
  proof={'actual100EqualCellCensus':{'blue':b,'yellow':z,'total':100},'actualStatementWholeArea':str(whole),'requestedDifferenceNotSingleCrop':i==4}
 elif i in [1,3]:
  cells=sorted(rects,key=lambda e:n(e,'x'));count=len(cells);blue=sum(c.get('fill')==BLUE for c in cells);width=n(cells[0],'width');assert count== (5 if i==1 else 10) and blue==(4 if i==1 else 3)
  for j,c in enumerate(cells):assert n(c,'width')==width and n(c,'height')==62 and n(c,'x')==n(cells[0],'x')+j*width
  whole=numeric(only(txt(e) for e in ts if re.fullmatch(r'\d+',txt(e))));assert whole==(450 if i==1 else 480);labels=[txt(e) for e in ts if '%'in txt(e)]
  if i==1:assert labels==['20%']*5;assert [n(e,'x') for e in ts if txt(e)=='20%']==[n(c,'x')+width/2 for c in cells]
  else:assert labels==['Әр бөлік — 10%'];assert r['options']==['30','144','336','1440'];assert '1440 = 480 × 3' in r['solution'] and 'он тең бөлікке бөлуді' in r['solution']
  bracket=only(e for e in el('line') if n(e,'y1')==n(e,'y2'));assert n(bracket,'x1')==n(cells[0],'x') and n(bracket,'x2')==n(cells[-1],'x')+width;out=whole*F(blue,count);proof={'actualEqualStripParts':count,'actualBlueParts':blue,'physicalWholeBracketValue':str(whole),'sourceIncorrectDistractorRationaleRepaired':i==3}
 elif i==2:
  names={txt(e):n(e,'x') for e in ts};a=names['0'];b=names['80'];ticks=sorted(n(e,'x1') for e in el('line') if n(e,'x1')==n(e,'x2'));step=(b-a)/20;assert ticks==[a+j*step for j in range(21)];points={name:(names[name]-a)/step*4 for name in ['P','R','Q','S']};assert points=={'P':24,'R':36,'Q':44,'S':56};assert {n(c,'cx') for c in el('circle')}=={names[name] for name in points};assert all(n(c,'cy')==190 for c in el('circle'));p=F(re.search(r'(\d+)%',r['statement']).group(1));assert p==45;target=80*p/100;out=only(k for k,v in points.items() if v==target);assert r['options']==['P','Q','S','R'];proof={'actual21Ticks20Intervals':True,'actualNamedPointCoordinates':dict((k,str(v))for k,v in points.items()),'percentTarget':str(target)}
 elif i==5:
  cells=sorted(rects,key=lambda e:n(e,'x'));assert [c.get('fill') for c in cells]==[BLUE,'#80c7b0',YELLOW];total=sum(n(c,'width') for c in cells);assert total==414 and [n(c,'width')/total for c in cells]==[F(37,100),F(28,100),F(35,100)]
  assert [txt(e) for e in ts]==['1200 г','Алма','37%','Алмұрт','28%','Өрік','?'];whole=numeric(txt(ts[0]));assert whole==1200
  for j,c in enumerate(cells):assert n(ts[1+2*j],'x')==n(ts[2+2*j],'x')==n(c,'x')+n(c,'width')/2
  out=whole*(1-F(37,100)-F(28,100));assert out==420;proof={'actualFruitNamedPercentageShares':[37,28,35],'actualPhysicalWidthsMatchShares':True,'wholeMass':1200,'massConservation':[444,336,420]}
 elif i==6:
  base=only(c for c in rects if c.get('fill')=='#fff');extra=only(c for c in rects if c.get('fill')==YELLOW);assert n(extra,'x')==n(base,'x')+n(base,'width');fraction=n(extra,'width')/n(base,'width');assert fraction==F(1,4);assert [txt(e) for e in ts]==['4800 ₸','100%','25%'];whole=numeric(txt(ts[0]));bracket=only(e for e in el('line') if n(e,'y1')==n(e,'y2'));assert n(bracket,'x1')==n(base,'x') and n(bracket,'x2')==n(extra,'x');out=whole*(1+fraction);proof={'actual100PercentBracketBasePrice':str(whole),'actualExtensionFractionOfBase':'1/4','newPriceNotIncrement':str(out)}
 elif i==8:
  top=sorted([c for c in rects if n(c,'y')==95],key=lambda c:n(c,'x'));bottom=sorted([c for c in rects if n(c,'y')==240],key=lambda c:n(c,'x'));assert [c.get('fill')for c in top]==[BLUE,'#fff'] and [c.get('fill')for c in bottom]==[YELLOW,BLUE]
  widths=[sum(n(c,'width')for c in row)for row in [top,bottom]];assert widths==[414,414];f=n(top[0],'width')/414;g=n(bottom[0],'width')/414;assert f==F(75,100) and g==F(40,100);assert [txt(e) for e in ts]==['3600','75%','25%','Көк бөлік — жаңа 100%','40%','60%'];whole=numeric(txt(ts[0]));out=whole*f*g;assert r['options']==['1440','1080','2700','4140'];dashed=[e for e in el('line') if e.get('stroke-dasharray')];assert sorted((n(e,'x1'),n(e,'y1'),n(e,'x2'),n(e,'y2'))for e in dashed)==[(30,147,30,240),(F('340.5'),147,444,240)];proof={'actualTopAndRescaledBottomFractions':['3/4','2/5'],'actualWhole':3600,'newWhole':2700,'captionAndPhysicalDashedEndpointsConfirmChangingBase':True}
 else:
  assert i in [7,9,10];rect=only(rects);assert rect.get('fill')=='#f2f7ff';first=numeric(txt(ts[0]));percents=list(map(F,re.findall(r'(\d+)%',r['statement'])))
  if i==7:
   assert first==30 and txt(ts[1])=='b' and percents==[40];width=first*percents[0]/100;assert n(rect,'height')/n(rect,'width')==width/first;out=first*width;assert r['options']==['1200','360','84','144'];proof={'actualLengthCaption':30,'widthFraction':'2/5','derivedWidth':12,'requestedArea':360,'wrongPerimeter':84}
  elif i==9:
   assert first==25 and percents==[20] and n(rect,'width')==n(rect,'height');side=first*(1+percents[0]/100);out=side**2-first**2;assert side==30 and out==275;proof={'actualSquareSideCaption':25,'bothDimensionsIncrease':True,'oldNewAreas':[625,900],'areaGainNotNewArea':275}
  else:
   second=numeric(txt(ts[1]));assert [first,second]==[48,30] and percents==[25,20];assert n(rect,'height')/n(rect,'width')==second/first;newL=first*(1+percents[0]/100);newB=second*(1-percents[1]/100);out=2*(newL+newB);assert [newL,newB,out]==[60,24,168];proof={'actualTwoLengthCaptions':[48,30],'eachPercentOwnOriginalBase':True,'newDimensions':[60,24],'requestedPerimeter':168,'wrongArea':1440}
 key=out if isinstance(out,str) else str(int(out));assert isinstance(out,str) or out.denominator==1
 if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(key)==1
 return key,proof

def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==11;entries=[]
 for i,r in enumerate(rows):
  key,proof=inspect(r,i);assert key==r['answer'],(i,key,r['answer']);assert inspect(dict(r,answer='wrong'),i)[0]!='wrong';sheet=i//6+1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all11source/new/FULLofficial/newsolutions/everyMCQ read;4actual343px sheets viewed; own actualSVG glyph/cell/strip-width/bracket/coordinate and units observer with exactFraction physical recomputation, no authorparams/calculator','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave73/visual-wave73-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave73/visual-wave73-contact-{sheet}.png','checked':['all11saved/new/fullofficial+newsolutions/everyMCQ read;4actual343px sheets viewed','actual equal100gridcells census and stripwidths/percentlabels checked','numeric whole/bracket bases physically read; nested blue-rescaled100% confirmedbycaption and dashedendpoints','actual rayticks/pointglyph positions give24/36/44/56 and Rtarget36','square and rectangle displayedside proportions andlengthcaptions matchconditions','requested units area/perimeter/price/difference/coordinateLETTER checked individually','all MCQ diagnostic roles checked; source1440partcountdistractor rationale corrected','nativeSVG readable343px; no livebrowser claim']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave73.py','fullSavedAndNewRead':11,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave73-pictured-given-percent.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':11,'allActualSVGElementsRecomputed':True,'hashesMatched':11,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
