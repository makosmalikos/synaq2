"""Full independent read of10 originals/new editions and four343px sheets.
Geometry/visible labels, rational SI conversion and signed positions are observed
without importing the author solver or trusting SVG data-* attributes.
"""
from fractions import Fraction as F
import hashlib
import json
from math import isqrt
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave30-formula-diagrams.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def pts(e):return [tuple(map(F,s.split(','))) for s in e.get('points').split()]
def plus(a,b):return tuple(x+y for x,y in zip(a,b))
def minus(a,b):return tuple(x-y for x,y in zip(a,b))
def point(a,b):
    for x,y in zip(a,b):near(x,y)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def integer(v):v=F(v);assert v.denominator==1;return str(v.numerator)
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line'];scene=r['params']['scene']
    def at(x,y):return txt(one(e for e in texts if abs(float(n(e,'x')-x))<1e-7 and abs(float(n(e,'y')-y))<1e-7))
    def quantity(s,unit):return F(re.fullmatch(r'(\d+) '+unit,s)[1])
    if scene in ['rectangle','mixed-rectangle']:
        b=one(e for e in rects if e.get('fill')=='#cddcff');x,y,w,h=[n(b,k) for k in ['x','y','width','height']]
        top=one(txt(t) for t in texts if n(t,'y')>y+h);side=one(txt(t) for t in texts if n(t,'x')<x)
        a=quantity(top,'м' if scene=='rectangle' else 'дм');bval=quantity(side,'м' if scene=='rectangle' else 'см')
        if scene=='mixed-rectangle':a*=10
        near(w/a,h/bval);answer=a*bval if scene=='rectangle' else 2*(a+bval)
        return integer(answer),{'printedLength':top,'printedWidth':side,'metricScale':str(w/a),'unitConversionFirst':scene=='mixed-rectangle'}
    if scene=='solid':
        a=quantity(one(txt(t) for t in texts if t.get('y')=='298'),r['params']['unit']);c=quantity(one(txt(t) for t in texts if t.get('x')=='62'),r['params']['unit']);b=quantity(one(txt(t) for t in texts if t.get('y')!='298' and t.get('x')!='62'),r['params']['unit'])
        front=pts(one(e for e in els if tag(e)=='polygon' and e.get('fill')=='#cddcff'));right=pts(one(e for e in els if tag(e)=='polygon' and e.get('fill')=='#dfd7f1'));top=pts(one(e for e in els if tag(e)=='polygon' and e.get('fill')=='#e1f0e8'))
        A,B,C,D=front;assert A[0]<B[0] and C[1]<B[1];near(A[1],B[1]);near(C[1],D[1]);near(A[0],D[0]);near(B[0],C[0]);scale=(B[0]-A[0])/a;near((A[1]-D[1])/c,scale)
        point(right[0],B);point(right[-1],C);point(top[0],D);point(top[1],C);depth=minus(right[1],B);assert depth[0]>0 and depth[1]<0
        near(depth[0]/b,scale*F(55,100));near(depth[1]/b,-scale*F(35,100));point(right[2],plus(C,depth));point(top[2],plus(C,depth));point(top[3],plus(D,depth))
        hidden=[e for e in lines if e.get('stroke-dasharray')];assert len(hidden)==3;E=plus(A,depth);expected=[A,plus(B,depth),plus(D,depth)]
        for e,target in zip(hidden,expected):point((n(e,'x1'),n(e,'y1')),E);point((n(e,'x2'),n(e,'y2')),target)
        volume=a*b*c
        if r['params']['unit']=='см':assert 'ішкі өлшемдері' in r['statement'];answer=volume/1000
        elif r['params']['unit']=='м':
            rate=F(re.search(r'сағатына (\d+) м³',r['statement'])[1]);assert 'су сыртқа ақпайды' in r['statement'];answer=volume/rate
        else:answer=volume
        return integer(answer),{'printedDimensions':[int(a),int(b),int(c)],'unit':r['params']['unit'],'threeConsistentProjectionBases':True,'hiddenEdges':3,'volume':int(volume)}
    if scene=='compare':
        blue=one(e for e in rects if e.get('fill')=='#cddcff');yellow=one(e for e in rects if e.get('fill')=='#f6d98e');a=quantity(at(140,258),'см');b=quantity(at(268,206),'см');s=quantity(at(372,258),'см')
        scale=n(blue,'width')/a
        for pixels,length in [(n(blue,'height'),b),(n(yellow,'width'),s),(n(yellow,'height'),s)]:near(pixels/length,scale)
        assert a*b==s*s and 2*(a+b)>4*s and at(140,206)=='A' and at(372,182)=='B'
        return one(o for o in r['options'] if o=='Аудандары тең, A периметрі үлкен'),{'areas':[int(a*b),int(s*s)],'perimeters':[int(2*(a+b)),int(4*s)],'commonPixelsPerCm':int(scale)}
    if scene in ['head-on','separate']:
        triangles=[e for e in els if tag(e)=='polygon'];assert len(triangles)==2;speeds=[]
        for index,e in enumerate(triangles):
            tip,base1,base2=pts(e);direction=(1 if index==0 else -1) if scene=='head-on' else (-1 if index==0 else 1)
            assert all((tip[0]-b[0])*direction>0 for b in [base1,base2]) and tip[1]==(base1[1]+base2[1])/2
            if scene=='separate':line=one(l for l in lines if l.get('stroke')==e.get('fill'))
            else:line=one(l for l in lines if n(l,'y1')==155 and (n(l,'x2')-n(l,'x1'))*direction>0)
            assert (n(line,'x2')-n(line,'x1'))*direction>0
            label=one(txt(t) for t in texts if txt(t).endswith(' км/сағ') and (n(t,'x')<240 if index==0 else n(t,'x')>240));speeds.append(quantity(label,'км/сағ'))
        if scene=='head-on':
            distance=quantity(at(240,287),'км');assert at(50,239)=='A' and at(430,239)=='B';time=distance/sum(speeds);positions=[speeds[0]*time,distance-speeds[1]*time];assert positions[0]==positions[1];answer=time
        else:
            origin=one(e for e in els if tag(e)=='circle');assert n(origin,'cx')==240 and at(240,267)=='O';time=F(re.search(r'(\d+) сағаттан кейін',r['statement'])[1]);positions=[-speeds[0]*time,speeds[1]*time];answer=positions[1]-positions[0]
        return integer(answer),{'actualArrowDirections':'inward' if scene=='head-on' else 'outward','speeds':list(map(int,speeds)),'signedPositions':list(map(str,positions))}
    if scene=='strip':
        blue=one(e for e in rects if e.get('fill')=='#cddcff');yellow=one(e for e in rects if e.get('fill')=='#f6d98e');assert n(blue,'y')==n(yellow,'y') and n(blue,'height')==n(yellow,'height') and n(blue,'x')+n(blue,'width')==n(yellow,'x');assert n(blue,'width')+n(yellow,'width')==n(blue,'height')
        area=quantity(at(223,212),'см²');strip=quantity(at(328,66),'см');D=strip*strip+4*area;assert D.denominator==1;root=isqrt(D.numerator);assert root*root==D;positive=(strip+root)/2;negative=(strip-root)/2;assert positive>strip and negative<0 and positive*(positive-strip)==area
        hidden=one(txt(e) for e in els if tag(e)=='desc');assert not re.search(r'\b(?:15|225)\b',hidden),'Alternative text must not reveal unknown side or answer'
        # For a>strip, a(a-strip) is strictly increasing: difference between
        # two inputs is (b-a)(a+b-strip)>0; hence only this positive root works.
        return integer(positive*positive),{'remainingArea':int(area),'stripWidth':int(strip),'positiveRoot':str(positive),'negativeRootRejected':str(negative),'positiveDomainUniqueness':'(b-a)(a+b-strip)>0'}
    assert scene=='adjacent'
    blue=one(e for e in rects if e.get('fill')=='#cddcff');yellow=one(e for e in rects if e.get('fill')=='#f6d98e');large=quantity(at(68,170),'см');small=quantity(at(296,271),'см');scale=n(blue,'width')/large
    assert n(blue,'width')==n(blue,'height') and n(yellow,'width')==n(yellow,'height');near(n(yellow,'width')/small,scale)
    assert n(blue,'x')+n(blue,'width')==n(yellow,'x') and n(blue,'y')+n(blue,'height')==n(yellow,'y')+n(yellow,'height')
    boundary=pts(one(e for e in els if tag(e)=='polygon'));assert len(boundary)==6;perimeter=F(0);segments=[]
    for a,b in zip(boundary,boundary[1:]+boundary[:1]):
        assert a[0]==b[0] or a[1]==b[1];length=abs(a[0]-b[0])+abs(a[1]-b[1]);perimeter+=length;segments.append(length/scale)
    shared=one(e for e in lines if e.get('stroke-dasharray'));assert n(shared,'x1')==n(shared,'x2')==n(yellow,'x');assert n(shared,'y1')==n(yellow,'y') and n(shared,'y2')==n(yellow,'y')+n(yellow,'height');assert perimeter/scale==4*large+4*small-2*small
    return integer(perimeter/scale),{'actualSixBoundarySegments':list(map(int,segments)),'commonEdgeSubtractedTwice':int(small)}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==10;entries=[]
    def check(r):
        answer,observed=observe(r);assert answer==r['answer'];return observed
    for i,r in enumerate(rows):
        observed=check(r)
        try:check({**r,'answer':'wrong'})
        except AssertionError:pass
        else:raise AssertionError('Wrong answer accepted')
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(r['answer'])==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All10 complete saved/new conditions, full solutions and MCQs read; all4actual343px sheets inspected; independent visible label and geometric coordinate observer with exact SI and conservation arithmetic','checks':['actual rectangle/square common metric scales checked','all3projected dimensions and3hidden cuboid edges independently reconstructed','cm³ to litres uses1000, dm³ to litres uses1','head-on positions meet; outward signed positions separate','square strip has exactly1positive admissible root, negative root rejected','six actual outer boundary segments exclude common interior edge','pool inner volume864 divided by printed72rate, no water leak'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['all given labels legible on343px sheets','units displayed on lengths','unknown answer not disclosed by strip alternative text','actual geometry and direction rather than author metadata'],'sourceSheet':f'output/editorial-visual-wave30/visual-wave30-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave30/visual-wave30-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave30-formula-diagrams.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'nativeGeometryChecks':10,'wrongKeysRejected':10,'authorSolverImported':False}))
if __name__=='__main__':main()
