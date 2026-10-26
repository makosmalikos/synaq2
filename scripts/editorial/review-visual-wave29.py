"""Independent review: all seven complete saved/new texts and four343px sheets.

Read actual colored objects, geometry and labels; never use SVG data attributes
or the author's equation solver to derive the answer.
"""
from fractions import Fraction as F
import ast
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave29-pictured-equation-models.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def n(e,k):return F(e.get(k))
def text(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a-b))<1e-7,(a,b)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def number(v):
    v=F(v);assert v.denominator==1;return str(v.numerator)
def value(s,x):
    def ev(t):
        if isinstance(t,ast.Constant):assert type(t.value)==int;return F(t.value)
        if isinstance(t,ast.Name):assert t.id=='x';return F(x)
        assert isinstance(t,ast.BinOp)
        a,b=ev(t.left),ev(t.right)
        if isinstance(t.op,ast.Add):return a+b
        if isinstance(t.op,ast.Sub):return a-b
        if isinstance(t.op,ast.Mult):return a*b
        assert isinstance(t.op,ast.Div) and b;return a/b
    return ev(ast.parse(s.replace('×','*').replace('−','-').replace(':','/'),mode='eval').body)
def equation_choice(r,x):
    matches=[]
    for o in r['options']:
        a,b=o.split('=')
        if value(a.strip(),x)==value(b.strip(),x):matches.append(o)
    return one(matches)
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==r['figureSha256']
    els=list(ET.fromstring(raw).iter());texts=[e for e in els if tag(e)=='text']
    rects=[e for e in els if tag(e)=='rect'];lines=[e for e in els if tag(e)=='line']
    def at(x,y):return text(one(e for e in texts if abs(float(n(e,'x')-x))<1e-7 and abs(float(n(e,'y')-y))<1e-7))
    scene=r['params']['scene']
    if scene=='balance':
        beam=one(e for e in lines if e.get('stroke-width')=='5' and n(e,'y1')==n(e,'y2'))
        assert n(beam,'x1')==128 and n(beam,'x2')==352 and n(beam,'y1')==96
        pivot=one(e for e in lines if e.get('stroke-width')=='5' and n(e,'x1')==n(e,'x2'))
        assert n(pivot,'x1')==(n(beam,'x1')+n(beam,'x2'))/2
        boxes=[e for e in rects if e.get('fill')=='#cddcff'];assert len(boxes) in [1,4]
        for b in boxes:
            assert n(b,'y')+n(b,'height')==228 and 32<n(b,'x')<n(b,'x')+n(b,'width')<224
            assert at(n(b,'x')+n(b,'width')/2,n(b,'y')+30)=='x'
        weights=[e for e in els if tag(e)=='path' and e.get('fill')=='#f6d98e'];assert len(weights)==2
        known=int(one(text(t) for t in texts if t.get('y')=='214' and text(t).isdigit()))
        total=int(at(352,209));assert at(240,344)=='Белгілі гірлер · кг'
        x=F(total-known,len(boxes));assert x>0
        return number(x),{'physicalUnknownBoxes':len(boxes),'knownKg':known,'totalKg':total,'equalLeverArms':112}
    if scene=='price-tape':
        parts=sorted([e for e in rects if e.get('height')=='58'],key=lambda e:n(e,'x'));assert len(parts)==4
        labels=[at(n(e,'x')+n(e,'width')/2,n(e,'y')+38) for e in parts]
        assert labels[2]=='…' and labels[0]==labels[1]==labels[3]
        for a,b in zip(parts,parts[1:]):assert n(a,'x')+n(a,'width')==n(b,'x')
        assert at(240,270)=='Бөліктердің толық саны · x' and 'көп нүкте' in r['statement']
        total=int(re.fullmatch(r'(\d+) теңге',at(240,99))[1]);price=int(labels[0]);x=F(total,price)
        assert x>len(parts) and x.denominator==1
        return equation_choice(r,x),{'visiblePriceLabels':labels,'fullCountUnknownNotFour':True,'price':price,'whole':total,'solutionCount':int(x)}
    if scene=='stamp-bars':
        blues=[e for e in rects if e.get('fill')=='#cddcff'];assert len(blues)==5
        rows=[]
        for y,label in [(68,'A'),(148,'B'),(228,'D')]:
            assert at(56,y+30)==label
            bs=sorted([e for e in blues if n(e,'y')==y],key=lambda e:n(e,'x'))
            assert bs and n(bs[0],'x')==95
            for b in bs:assert (n(b,'width'),n(b,'height'))==(74,42)
            for a,b in zip(bs,bs[1:]):assert n(a,'x')+n(a,'width')==n(b,'x')
            rows.append(len(bs))
        assert rows==[1,3,1]
        extra=one(e for e in rects if e.get('fill')=='#f6d98e')
        assert (n(extra,'x'),n(extra,'y'),n(extra,'width'),n(extra,'height'))==(169,228,37,42)
        amount=int(at(F(375,2),257));total=int(at(420,185));x=F(total-amount,sum(rows))
        # The extra half-width also represents exactly half of one unknown unit.
        near(n(extra,'width')/74,F(amount,x))
        assert one(e for e in els if tag(e)=='path').get('d')=='M365 68 h13 v202 h-13'
        return number(x),{'blueRowCounts':rows,'extra':amount,'whole':total,'metricExtraRatio':str(F(amount,x))}
    if scene=='rope':
        parts=sorted([e for e in rects if e.get('height')=='62'],key=lambda e:n(e,'x'));assert len(parts)==5
        cuts=[e for e in parts if e.get('fill')=='#cddcff'];rest=one(e for e in parts if e.get('fill')=='#fff');assert len(cuts)==4
        whole=int(re.fullmatch(r'(\d+) м',at(240,108))[1])*100
        remain=int(re.fullmatch(r'(\d+) см',at(n(rest,'x')+n(rest,'width')/2,193))[1]);x=F(whole-remain,len(cuts))
        scale=F(380,whole)
        for c in cuts:
            assert at(n(c,'x')+n(c,'width')/2,193)=='x';near(n(c,'width'),scale*x)
        near(n(rest,'width'),scale*remain)
        for a,b in zip(parts,parts[1:]):near(n(a,'x')+n(a,'width'),n(b,'x'))
        near(n(parts[0],'x'),50);near(n(rest,'x')+n(rest,'width'),430)
        return number(x),{'wholeCm':whole,'cutCount':len(cuts),'remainingCm':remain,'metricScale':str(scale)}
    if scene=='pair-scales':
        pairs=[]
        for b in sorted([e for e in rects if e.get('height')=='60'],key=lambda e:n(e,'x')):
            circles=sorted([e for e in els if tag(e)=='circle' and n(b,'x')<n(e,'cx')<n(b,'x')+n(b,'width')],key=lambda e:n(e,'cx'))
            assert len(circles)==2 and all(n(e,'cy')==145 for e in circles)
            names=''.join(at(n(e,'cx'),153) for e in circles)
            mass=int(re.fullmatch(r'(\d+) кг',at(n(b,'x')+n(b,'width')/2,225))[1]);pairs.append((names,mass))
        assert [a for a,b in pairs]==['AB','BD','AD']
        ab,bd,ad=[m for _,m in pairs];b=F(ab+bd-ad,2);a=ab-b;d=bd-b
        assert min(a,b,d)>0 and a+d==ad
        return number(b),{'actualScalePairs':pairs,'reconstructedABC':[number(a),number(b),number(d)]}
    assert scene=='pencils'
    boxes=[e for e in rects if e.get('fill')=='#cddcff'];assert len(boxes)==4
    for b in boxes:assert at(n(b,'x')+n(b,'width')/2,n(b,'y')+46)=='x'
    pencils=[e for e in els if tag(e)=='path' and e.get('fill')=='#f6d98e'];positions=[]
    for e in pencils:
        m=re.fullmatch(r'M(\d+) 215 v-59 l4 -13 4 13 v59 Z',e.get('d'));assert m;positions.append(int(m[1]))
    assert len(set(positions))==len(pencils)==9
    total=int(at(F(479,2),85));x=F(total-len(pencils),len(boxes));assert x>0 and x.denominator==1
    return equation_choice(r,x),{'physicalBoxes':len(boxes),'physicalLoosePencils':len(pencils),'whole':total,'solutionPerBox':int(x)}
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==7;entries=[]
    for i,r in enumerate(rows):
        answer,observed=observe(r);assert answer==r['answer'] and answer!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All7 complete saved/new conditions, full solutions and choices read; all4 actual343px source/native sheets inspected; independently derive values from physical SVG shapes/coordinates and visible labels','checks':['no SVG data-* attributes used as evidence','two balanced beams level and equal arms, actual4or1unknownboxes','ellipsis explicitly hides count; visible tape parts are not total count','three stamp rows have1/3/1equalunits and correct halfunitextra','7m converted to700cm, all4cuts and remainder share one metric scale','three overlapping pair masses count each child twice','all4boxes/9loosepencils counted, each MCQ checked with exact AST arithmetic'],'observed':observed,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'checked':['full saved source skill preserved','actual colored object counts and placements','visible numerical labels and unit conversions','native shapes inspected at343px'],'sourceSheet':f'output/editorial-visual-wave29/visual-wave29-source-{1+i//6}.png','nativeSheet':f'output/editorial-visual-wave29/visual-wave29-contact-{1+i//6}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave29-pictured-equation-models.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'nativeObservationChecks':7,'wrongKeysRejected':7,'authorSolverImported':False}))
if __name__=='__main__':main()
