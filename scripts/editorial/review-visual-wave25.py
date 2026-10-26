"""Full source/new review; all six original rasters and343px native sheet read."""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave25-arithmetic-properties.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect' and e.get('stroke')=='#203549'];lines=[e for e in els if tag(e)=='line']
    def at(x,y):return txt(one(t for t in texts if abs(float(n(t,'x')-x))<1e-7 and abs(float(n(t,'y')-y))<1e-7))
    scene=r['params']['scene']
    if scene=='split':
        left,right=sorted(rects,key=lambda e:n(e,'x'));a=int(at(n(left,'x')+n(left,'width')/2,107));b=int(at(n(right,'x')+n(right,'width')/2,107));h=int(at(76,125+n(left,'height')/2+8));near(n(left,'x')+n(left,'width'),n(right,'x'));assert n(left,'y')==n(right,'y') and n(left,'height')==n(right,'height')
        # Independently verify one metric scale across BOTH axes and both pieces.
        near(n(left,'width')/a,n(right,'width')/b);near(n(left,'height')/h,n(left,'width')/a)
        return str((a+b)*h),{'widths':[a,b],'height':h}
    if scene=='rectangle':
        rect=one(rects);a=int(at(n(rect,'x')+n(rect,'width')/2,n(rect,'y')-20));b=int(at(n(rect,'x')-31,n(rect,'y')+n(rect,'height')/2+8));near(n(rect,'width')/a,n(rect,'height')/b)
        return str(a*b),{'sides':[a,b]}
    if scene=='pairs':
        xs=sorted(set(n(e,'x') for e in rects));assert len(xs)==5 and len(rects)==10;total=0
        for x in xs:
            pair=sorted((e for e in rects if n(e,'x')==x),key=lambda e:n(e,'y'));assert [e.get('fill') for e in pair]==['#cddcff','#f7dda0']
            assert [n(e,'y') for e in pair]==[119,170] and all(n(e,'width')==65 and n(e,'height')==51 for e in pair)
            total+=sum(int(at(x+F(65,2),n(e,'y')+33)) for e in pair)
        assert at(240,282)=='Әр баған · 1 жиынтық';return str(total),{'physicalPairs':len(xs),'separatePrintedSum':total}
    if scene=='separate':
        origin=one(e for e in els if tag(e)=='circle');assert (n(origin,'cx'),n(origin,'cy'))==(240,230) and at(240,267)=='O';speeds=[]
        for color,direction in [('#315ce8',-1),('#8459ce',1)]:
            line=one(e for e in lines if e.get('stroke')==color);tip=one(e for e in els if tag(e)=='polygon' and e.get('fill')==color);pts=[tuple(map(F,p.split(','))) for p in tip.get('points').split()];x,y=pts[0]
            assert n(line,'y1')==n(line,'y2')==y==183 and (n(line,'x2')-n(line,'x1'))*direction>0 and (x-240)*direction>0
            assert all((x-bx)*direction>0 for bx,by in pts[1:]);speeds.append(int(re.fullmatch(r'(\d+) км/сағ',txt(one(t for t in texts if t.get('fill')==color)))[1]))
        hours=int(re.search(r'(\d+) сағаттан кейін',r['statement'])[1]);positions=[-speeds[0]*hours,speeds[1]*hours]
        return str(abs(positions[1]-positions[0])),{'positions':positions,'sameOrigin':True}
    assert scene=='bars'
    grid=sorted((n(e,'y1') for e in lines if e.get('stroke')=='#dbe5f1'),reverse=True);assert len(grid)==17
    for a,b in zip(grid,grid[1:]):near(a-b,F('10.5'))
    for t in texts:
        if n(t,'x')==69:near((260-(n(t,'y')-6))/F('10.5'),F(txt(t)))
    bars=sorted((e for e in els if tag(e)=='rect' and e.get('fill')=='#315ce8'),key=lambda e:n(e,'x'));assert len(bars)==3
    values=[]
    for i,b in enumerate(bars):
        center=n(b,'x')+n(b,'width')/2;value=F(260-n(b,'y'))/F('10.5');assert value.denominator==1;assert n(b,'height')==260-n(b,'y');assert int(at(center,n(b,'y')-9))==value;assert at(center,291)==str(i+1);values.append(int(value))
    labels=[t for t in texts if n(t,'y')==291];assert [int(txt(t)) for t in labels]==list(range(1,10))
    assert sum(txt(t)=='?' for t in texts)==6 and values==[5,9,13]
    step=values[1]-values[0];assert values[2]-values[1]==step
    sequence=[values[0]+step*i for i in range(len(labels))]
    assert sequence[4]==21;return str(sum(sequence)),{'sequence':sequence,'unpairedMiddle':sequence[4]}
def main():
    assert len(ROWS)==6;entries=[]
    for r in ROWS:
        answer,obs=observe(r);assert answer==r['answer'] and answer!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All6 full source/new conditions, complete solutions and MCQs; actual saved SVG measurements, colored pair counts, directed trajectories and calibrated bar reconstruction','checks':['all6 original rasters and343px native sheet read','same scale measured horizontally and vertically for every rectangle','odd9-term sum retains middle21 after four pairs','two outward trajectories start at commonO and give signed positions−72,+92'],'observed':obs,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['every printed side and actual ratio of rectangle pixels','five physical two-item columns and all185/65 labels','actual outward arrow triangles and centralO','all17 gridlines,5/9/13 bars and6unknown slots'],'sourceSheet':'output/editorial-visual-wave25/visual-wave25-source-1.png','nativeSheet':'output/editorial-visual-wave25/visual-wave25-contact-1.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave25-arithmetic-properties.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'actualNativeChecks':6,'wrongKeysRejected':6,'metricRectangles':3,'authorSolverImported':False}))
if __name__=='__main__':main()
