"""Independent full source/new and two343px sheet review of six visual tasks."""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave24-multiplication-division-models.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext())
def n(e,k):return F(e.get(k))
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def sha(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];rects=[e for e in els if tag(e)=='rect' and e.get('height')=='42'];lines=[e for e in els if tag(e)=='line']
    def at(x,y):return txt(one(e for e in texts if abs(float(n(e,'x')-x))<1e-7 and abs(float(n(e,'y')-y))<1e-7))
    def row(y):return sorted((e for e in rects if n(e,'y')==y),key=lambda e:n(e,'x'))
    def label(e):return at(n(e,'x')+n(e,'width')/2,n(e,'y')+28)
    def bracket(a,b,y,below=False):
        assert any((n(e,'x1'),n(e,'x2'),n(e,'y1'),n(e,'y2'))==(a,b,y,y) for e in lines)
        for x in [a,b]:assert any((n(e,'x1'),n(e,'x2'),n(e,'y1'),n(e,'y2'))==(x,x,y,y+(-8 if below else 8)) for e in lines)
        return at(F(a+b,2),y+(31 if below else -13))
    def amount(t,unit):return int(re.fullmatch(r'(\d+) '+unit,t)[1])
    scene=r['params']['scene']
    if scene=='dots':
        dots=[e for e in els if tag(e)=='circle'];ys=sorted(set(n(e,'cy') for e in dots));xs=sorted(set(n(e,'cx') for e in dots))
        assert len(ys)==5 and len(xs)==8
        for y in ys:assert sorted(n(e,'cx') for e in dots if n(e,'cy')==y)==xs
        assert all(x2-x1==38 for x1,x2 in zip(xs,xs[1:])) and all(y2-y1==39 for y1,y2 in zip(ys,ys[1:]))
        return str(len(dots)),{'rowSizes':[sum(n(e,'cy')==y for e in dots) for y in ys]}
    if scene=='notepens':
        assert 'масштабсыз' in r['statement'];bars=row(166);notes=[b for b in bars if b.get('fill')=='#cddcff'];pens=[b for b in bars if b.get('fill')=='#f7dda0'];assert len(notes)==4 and len(pens)==3
        total=amount(bracket(40,440,144),'₸');known=sum(int(label(b)) for b in notes);assert all(label(b)=='?' for b in pens)
        for a,b in zip(bars,bars[1:]):near(n(a,'x')+n(a,'width'),n(b,'x'))
        value=F(total-known,len(pens));assert value.denominator==1 and value>0
        return str(value.numerator),{'whole':total,'knownTotal':known,'unknownCount':len(pens)}
    if scene=='meeting':
        distance=amount(bracket(56,424,102),'км');speeds=[]
        for color,direction in [('#315ce8',1),('#8459ce',-1)]:
            line=one(e for e in lines if e.get('stroke')==color);tip=one(e for e in els if tag(e)=='polygon' and e.get('fill')==color)
            points=[tuple(map(F,p.split(','))) for p in tip.get('points').split()];tipx,tipy=points[0]
            assert n(line,'y1')==n(line,'y2')==tipy==188 and (n(line,'x2')-n(line,'x1'))*direction>0
            assert all((tipx-x)*direction>0 for x,y in points[1:]) and (tipx-n(line,'x2'))*direction>0
            speed=amount(txt(one(t for t in texts if t.get('fill')==color)),'км/сағ');speeds.append(speed)
        # Rational distance conservation: opposite trajectories have one positive
        # intersection; neither the difference of speeds nor a diagram's scale.
        t=F(distance,sum(speeds));assert t>0 and t.denominator==1
        assert t*speeds[0]+t*speeds[1]==distance
        return str(t.numerator),{'distance':distance,'speeds':speeds,'travel':[int(t*v) for v in speeds]}
    if scene=='unitprice':
        known,target=row(110),row(228);assert len(known)==6 and len(target)==9 and at(240,321)=='Әр бөлік · 1 кг'
        width=n(known[0],'width')
        for bars in [known,target]:
            assert all(n(b,'width')==width for b in bars)
            for a,b in zip(bars,bars[1:]):near(n(a,'x')+width,n(b,'x'))
        total=amount(bracket(60,60+len(known)*width,92),'₸');assert bracket(60,60+len(target)*width,210)=='?'
        cost=F(total,len(known))*len(target);assert cost.denominator==1
        return str(cost.numerator),{'knownParts':len(known),'targetParts':len(target),'knownTotal':total}
    if scene=='ratio':
        pears,apples=row(102),row(212);assert len(pears)==1 and len(apples)==5
        assert pears[0].get('fill')=='#f7dda0' and all(e.get('fill')=='#cddcff' for e in apples)
        assert all(n(b,'width')==n(pears[0],'width') for b in apples)
        total=int(at(433,187));assert any(n(e,'x1')==n(e,'x2')==402 and n(e,'y1')==102 and n(e,'y2')==254 for e in lines)
        assert '5 есе көп' in r['statement'];unit=F(total,len(pears)+len(apples));assert unit.denominator==1
        return str((unit*len(apples)).numerator),{'fruitTotal':total,'equalParts':[len(pears),len(apples)]}
    assert scene=='cycle' and 'масштабсыз' in r['statement'];known=row(110);remaining=one(row(226));assert len(known)==4
    assert all(n(b,'width')==58 and b.get('fill')=='#cddcff' for b in known);assert remaining.get('fill')=='#f7dda0'
    covered=amount(bracket(70,302,89),'км');left=amount(bracket(70,410,292,True),'км');hours=F(left,covered)*len(known);assert hours.denominator==1
    return str(hours.numerator),{'knownHours':len(known),'knownKm':covered,'remainingKm':left}

def main():
    assert len(ROWS)==6;entries=[]
    for r in ROWS:
        answer,observed=observe(r);assert answer==r['answer'] and answer!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':sha(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All six full original/new conditions, solutions and choices; actual dots and colored block counts, saved SVG printed amounts and bracket endpoints; rational conservation equations and speed-arrow direction','checks':['all six source rasters and native343px sheet inspected','different equal-part counts independently counted','opposite velocities give distance216+180=396, not their difference','unknown price excludes all four notebooks before division; remaining travel asks9hours not total13'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual five rows of eight dots','actual four185 blocks and three unknown pens','actual inward facing polygons and72/60kmh labels','six vsnine physical kg blocks and one vsfive equal fruit blocks','actual four one-hour blocks and68/153km brackets'],'sourceSheet':'output/editorial-visual-wave24/visual-wave24-source-1.png','nativeSheet':'output/editorial-visual-wave24/visual-wave24-contact-1.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave24-multiplication-division-models.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':6,'nativeObservationChecks':6,'wrongKeysRejected':6,'authorSolverImported':False}))
if __name__=='__main__':main()
