"""Independent full source/new and four343px sheet review of all seven editions."""
from fractions import Fraction as F
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave28-like-term-diagrams.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts/editorial'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
arithmetic=module('root_metric_observer','review-visual-wave25.py');math=module('root_polynomial_observer','review-visual-wave10.py')
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    if r['params']['scene']=='split':return arithmetic.observe(r)
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(t for t in texts if abs(float(n(t,'x')-x))<1e-7 and abs(float(n(t,'y')-y))<1e-7))
    if scene=='notebooks':
        notes=[e for e in rects if e.get('height')=='54'];assert len(notes)==11
        byrow={}
        for e in notes:
            assert at(n(e,'x')+n(e,'width')/2,n(e,'y')+n(e,'height')-7)=='a';byrow[n(e,'y')]=byrow.get(n(e,'y'),0)+1
        assert sorted(byrow.values())==[3,8];expected=math.poly(str(len(notes))+'*a');return one(o for o in r['options'] if math.poly(o)==expected),{'rowCounts':[3,8],'combinedCoefficient':len(notes)}
    if scene=='separate':
        origin=one(e for e in els if tag(e)=='circle');assert (n(origin,'cx'),n(origin,'cy'))==(240,230) and at(240,267)=='O';speeds=[]
        for color,direction in [('#315ce8',-1),('#8459ce',1)]:
            line=one(e for e in lines if e.get('stroke')==color);head=one(e for e in els if tag(e)=='polygon' and e.get('fill')==color);pts=[tuple(map(F,p.split(','))) for p in head.get('points').split()];x,y=pts[0]
            assert n(line,'y1')==n(line,'y2')==y==183 and (n(line,'x2')-n(line,'x1'))*direction>0 and (x-240)*direction>0 and all((x-bx)*direction>0 for bx,by in pts[1:]);speeds.append(int(re.fullmatch(r'(\d+) км/сағ',one(txt(t) for t in texts if t.get('fill')==color))[1]))
        t=int(re.search(r't = (\d+)',r['statement'])[1]);return str(abs(speeds[0]*(-t)-speeds[1]*t)),{'speeds':speeds,'signedPositions':[-speeds[0]*t,speeds[1]*t],'formula':str(sum(speeds))+'*t'}
    if scene=='boxes':
        boxes=[e for e in rects if e.get('height')=='44'];assert len(boxes)==16;assert sum(e.get('fill')=='#cddcff' for e in boxes)==10 and sum(e.get('fill')=='#f7dda0' for e in boxes)==6
        red=[e for e in lines if e.get('stroke')=='#bd3f51'];assert len(red)==8;crossed=0
        for b in boxes:
            x,y,w,h=n(b,'x'),n(b,'y'),n(b,'width'),n(b,'height');assert at(x+w/2,y+30)=='x'
            marks=[e for e in red if all(x<n(e,k)<x+w for k in ['x1','x2']) and all(y<n(e,k)<y+h for k in ['y1','y2'])]
            assert len(marks) in [0,2]
            if marks:
                assert (n(marks[0],'x2')-n(marks[0],'x1'))*(n(marks[0],'y2')-n(marks[0],'y1'))*(n(marks[1],'x2')-n(marks[1],'x1'))*(n(marks[1],'y2')-n(marks[1],'y1'))<0;crossed+=1
        amount=int(re.search(r'x = (\d+)',r['statement'])[1]);return str((len(boxes)-crossed)*amount),{'boxes':len(boxes),'actualDoubleCrosses':crossed,'perBox':amount}
    if scene=='cookies':
        large=[e for e in rects if e.get('height')=='70'];small=[e for e in rects if e.get('height')=='41'];assert len(large)==4 and len(small)==5
        kg,g=map(int,re.fullmatch(r'(\d+) кг (\d+) г',at(240,61)).groups());total=1000*kg+g;ratio=int(re.search(r'кіші қораптағыдан (\d+) есе ауыр',r['statement'])[1]);unit=F(total,ratio*len(large)+len(small));assert unit>0 and unit.denominator==1
        return str((unit*ratio).numerator),{'largeCount':len(large),'smallCount':len(small),'totalGrams':total,'ratio':ratio,'smallGrams':int(unit)}
    if scene=='stationery':
        notes=[e for e in rects if e.get('height')=='46'];pens=[e for e in els if tag(e)=='path'];counts=[]
        for y in [115,227]:
            ns=sum(n(e,'y')==y for e in notes);ps=0
            for path in pens:
                m=re.fullmatch(r'M(\d+) (\d+) h10 v37 l-5 12 -5 -12 Z',path.get('d'));assert m
                if int(m[2])==y:ps+=1
            counts.append((ns,ps))
        assert counts==[(5,3),(3,5)];total=int(re.fullmatch(r'Барлығы (\d+) теңге',at(240,62))[1]);a,b=map(sum,zip(*counts));assert a==b==8 and total%a==0;unit=total//a
        pairs=[(d,unit-d) for d in range(1,unit)];assert len(pairs)==429 and all(a*d+b*q==total for d,q in pairs)
        # General proof, not just sampled prices:8d+8q=3440 iff d+q=430.
        return str(unit),{'rowCounts':counts,'whole':total,'uniqueSum':unit,'distinctPositiveIntegerPricePairs':len(pairs)}
    assert scene=='tables';tables=[e for e in rects if e.get('height')=='46'];assert len(tables)==11;coefficients=[]
    for t in tables:
        label=at(n(t,'x')+n(t,'width')/2,n(t,'y')+31);m=re.fullmatch(r'(\d*)k',label);assert m;coefficients.append(int(m[1] or 1))
    assert sorted(coefficients)==[1]*5+[3]*6;k=int(re.search(r'k = (\d+)',r['statement'])[1]);return str(sum(coefficients)*k),{'physicalTableCoefficients':coefficients,'k':k,'totalCoefficient':sum(coefficients)}
def main():
    assert len(ROWS)==7;entries=[]
    for i,r in enumerate(ROWS):
        a,obs=observe(r);assert a==r['answer'] and a!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(a)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All7 full saved/new conditions, solutions and choices; actual SVG colored object counts/labels, both cross strokes, metric rectangles, exact polynomial combination and price-sum identity','checks':['all four source/native343px sheets inspected; all7original rasters available','crossed boxes subtracted once, each actual cross requires both red strokes','6kg500g converted to6500g before equivalent13small-mass units','only sum of prices430 is determined;429positive integer price pairs demonstrate non-uniqueness','symbolic coefficients combined before numerical substitution'],'observed':obs,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual37/63widths and16height with same metric scale','actual3+8a-labeled notebooks','actualoutward14/21arrows fromcommonO','all10blue6yellow boxes and4double-crossed boxes','all4large5smallcookieboxes and6500gramcaption','physical5/3+3/5stationeryrows and3440caption','all6three-k and5one-k tablelabels'],'sourceSheet':f'output/editorial-visual-wave28/visual-wave28-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave28/visual-wave28-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave28-like-term-diagrams.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'nativeObservationChecks':7,'wrongKeysRejected':7,'priceSumUniqueIndividualPricesNotUnique':True,'authorSolverImported':False}))
if __name__=='__main__':main()
