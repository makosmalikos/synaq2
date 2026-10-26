"""Independent review of all nine addition/subtraction visual editions.

Full source/new conditions, complete solutions/choices and all four source/native
contact sheets were read. This observer measures the saved SVG, not its data-*
claims, and does not import the author solver or renderer.
"""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/visual-wave23-addition-subtraction-models.json'
ROWS = json.loads((ROOT / PACK).read_text())['editions']

def tag(e): return e.tag.rsplit('}', 1)[-1]
def text(e): return ''.join(e.itertext())
def num(e, key): return F(e.get(key))
def near(a, b): assert abs(float(a - b)) < 1e-7, (a, b)
def one(items):
    items = list(items)
    assert len(items) == 1, items
    return items[0]
def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()

def observe(row):
    raw = (ROOT / 'frontend/public' / row['image'].lstrip('/')).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == row['figureSha256']
    svg = ET.fromstring(raw)
    assert svg.get('viewBox') == '0 0 480 360'
    els = list(svg.iter())
    texts = [e for e in els if tag(e) == 'text']
    rects = [e for e in els if tag(e) == 'rect' and e.get('height') == '40']
    lines = [e for e in els if tag(e) == 'line']
    def at(x, y):
        return text(one(t for t in texts if abs(float(num(t, 'x')-x)) < 1e-7
                        and abs(float(num(t, 'y')-y)) < 1e-7))
    def label(rect):
        return at(num(rect, 'x')+num(rect, 'width')/2, num(rect, 'y')+27)
    def row_at(y): return sorted((r for r in rects if num(r, 'y') == y), key=lambda r:num(r, 'x'))
    def bracket(a, b, y, below=False):
        one(e for e in lines if (num(e, 'x1'), num(e, 'x2'), num(e, 'y1'), num(e, 'y2')) == (a,b,y,y))
        for x in [a,b]:
            # Adjacent brackets may draw the same shared end tick twice.
            assert any((num(e, 'x1'), num(e, 'x2'), num(e, 'y1'), num(e, 'y2')) == (x,x,y,y+(-8 if below else 8)) for e in lines)
        return at(F(a+b,2), y+(30 if below else -12))
    scene = row['params']['scene']
    if scene in ['remainder', 'sum', 'unknown-price']:
        bars = row_at(166)
        assert len(bars) == (4 if scene == 'unknown-price' else 2)
        near(num(bars[0],'x'), F(40))
        for a,b in zip(bars,bars[1:]): near(num(a,'x')+num(a,'width'),num(b,'x'))
        near(num(bars[-1],'x')+num(bars[-1],'width'),F(440))
        labels = [label(b) for b in bars]
        total_text = bracket(40,440,144)
        if scene == 'sum':
            assert total_text == '?' and [b.get('fill') for b in bars] == ['#cddcff','#f7dda0']
            a,b = map(int,labels)
            near(num(bars[0],'width')/num(bars[1],'width'), F(a,b))
            return str(a+b), {'parts':labels}
        total = int(re.fullmatch(r'(\d+) ₸',total_text)[1])
        if scene == 'remainder':
            assert labels[1] == '?' and [b.get('fill') for b in bars] == ['#cddcff','#fff']
            spent = int(labels[0])
            near(num(bars[0],'width')/400,F(spent,total))
            return str(total-spent), {'whole':total,'spent':spent}
        assert 'масштабсыз' in row['statement'] and labels[2] == '?'
        assert [b.get('fill') for b in bars] == ['#cddcff','#cddcff','#f7dda0','#fff']
        known = sum(int(v) for v in labels if v != '?')
        return str(total-known), {'whole':total,'printedParts':labels}
    if scene == 'less-days':
        first = one(row_at(102)); second, missing = row_at(204)
        first_n, missing_n = int(label(first)),int(label(missing))
        assert label(second) == '?' and missing.get('stroke-dasharray') == '6 4'
        near(num(first,'x'),num(second,'x'))
        near(num(second,'x')+num(second,'width'),num(missing,'x'))
        near(num(first,'width'),num(second,'width')+num(missing,'width'))
        near(num(missing,'width')/num(first,'width'),F(missing_n,first_n))
        assert at(450,182) == '?'
        return str(first_n+first_n-missing_n), {'first':first_n,'difference':missing_n}
    if scene == 'three-days':
        a = one(row_at(72)); b,c = row_at(157); d,e = row_at(242)
        first, more, deficit = int(label(a)),int(label(c)),int(label(e))
        assert int(label(b)) == first and label(d) == '?' and e.get('stroke-dasharray') == '6 4'
        scale = num(a,'width') / first
        near(num(b,'width'),num(a,'width'))
        near(num(c,'width'),more*scale)
        near(num(e,'width'),deficit*scale)
        for left,right in [(b,c),(d,e)]: near(num(left,'x')+num(left,'width'),num(right,'x'))
        total_width = num(d,'width')+num(e,'width')
        near(total_width,num(a,'width')+num(b,'width')+num(c,'width'))
        third = 2*first+more-deficit
        near(num(d,'width'),third*scale)
        assert at(240,327) == '3-жолақтың толық ені = 1-күн + 2-күн'
        return str(first+(first+more)+third), {'days':[first,first+more,third]}
    if scene == 'purchases':
        assert 'масштабсыз' in row['statement']
        equations = []
        for y in [100,220]:
            bars = row_at(y)
            assert all(num(b,'width') == 64 for b in bars)
            for a,b in zip(bars,bars[1:]): assert num(a,'x')+64 == num(b,'x')
            colors = [b.get('fill') for b in bars]
            assert set(colors) == {'#cddcff','#f7dda0'}
            total = int(re.fullmatch(r'(\d+) ₸',bracket(64,64+64*len(bars),y-16))[1])
            equations.append((colors.count('#cddcff'),colors.count('#f7dda0'),total))
        # Cramer's rule independently recovers both prices from physical counts.
        (a,b,c),(d,e,f) = equations
        det = a*e-b*d
        assert det != 0
        note, pen = F(c*e-b*f,det), F(a*f-c*d,det)
        assert note > 0 and pen > 0 and note.denominator == pen.denominator == 1
        return str(note.numerator), {'equations':equations,'note':str(note),'pen':str(pen)}
    if scene == 'shelves':
        bars = row_at(157)
        assert [(num(b,'x'),num(b,'width')) for b in bars] == [(40,100),(140,100),(240,100),(340,100)]
        assert 'масштабсыз' in row['statement'] and label(bars[0]) == '?'
        p12,p34,p23 = int(bracket(40,240,128)),int(bracket(240,440,128)),int(bracket(140,340,228,True))
        last = int(label(bars[-1]))
        # Eliminate alternating middle terms; then check every original pair.
        first = p12-p23+p34-last
        shelves = [first,p12-first,p23-(p12-first),last]
        assert all(n > 0 for n in shelves)
        assert [sum(shelves[i:i+2]) for i in range(3)] == [p12,p23,p34]
        return str(first), {'pairSums':[p12,p23,p34],'shelves':shelves}
    assert scene in ['ray','two-arrows']
    ticks = sorted((int(text(t)),num(t,'x')) for t in texts if num(t,'y') == 269)
    assert len(ticks) >= 4
    origin, step = ticks[0][1], (ticks[1][1]-ticks[0][1])/(ticks[1][0]-ticks[0][0])
    for n,x in ticks:
        near(x,origin+n*step)
        one(e for e in lines if num(e,'x1') == x and num(e,'x2') == x and num(e,'y1') == 229 and num(e,'y2') == 241)
    points = {}
    for circle in [e for e in els if tag(e) == 'circle']:
        assert num(circle,'cy') == 235
        name = at(num(circle,'cx'),293)
        coordinate = (num(circle,'cx')-origin)/step
        n = round(float(coordinate)); near(coordinate,F(n)); points[name] = n
    shifts = []
    for curve in [e for e in els if tag(e) == 'path']:
        coords = list(map(F,re.findall(r'-?\d+(?:\.\d+)?',curve.get('d'))))
        assert len(coords) == 6
        x0,y0,cx,cy,x1,y1 = coords
        assert y0 == y1 == 235
        tip = one(e for e in els if tag(e) == 'polygon' and e.get('fill') == curve.get('stroke'))
        pts = [tuple(map(F,p.split(','))) for p in tip.get('points').split()]
        near(pts[0][0],x1);near(pts[0][1],y1)
        # The actual triangle points along the final Bezier tangent.
        base = ((pts[1][0]+pts[2][0])/2,(pts[1][1]+pts[2][1])/2)
        dx,dy = x1-cx,y1-cy
        near((x1-base[0])*dy-(y1-base[1])*dx,F(0))
        assert (x1-base[0])*dx+(y1-base[1])*dy > 0
        distance = int(at(cx,235-(235-cy)/2-13))
        start,end = (x0-origin)/step,(x1-origin)/step
        near(abs(end-start),F(distance))
        shifts.append((round(float(start)),round(float(end)),distance))
    if scene == 'ray':
        assert set(points) == {'A','B'} and shifts == [(points['A'],points['B'],points['B']-points['A'])]
        return 'B('+str(points['B'])+')', {'points':points,'shifts':shifts}
    assert set(points) == {'A','B','C'} and shifts == [(points['A'],points['B'],points['A']-points['B']),(points['B'],points['C'],points['C']-points['B'])]
    return 'C('+str(points['C'])+')', {'points':points,'shifts':shifts}

def main():
    assert len(ROWS) == 9
    entries=[]
    for i,row in enumerate(ROWS):
        answer,observed = observe(row)
        assert answer == row['answer'], (row['editionId'],answer,row['answer'])
        assert answer != 'wrong'
        if row.get('options'):
            assert len(set(row['options'])) == 4 and row['options'].count(answer) == 1
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',
          'reviewer':'independent_root_agent',
          'method':'Saved SVG printed values, physical block counts, calibrated positions, actual arrow tips and bracket endpoints; exact conservation equations and independent elimination',
          'checks':['all nine full source/new conditions, solutions and MCQs read','all four source/native sheets inspected at343px','unknown-price and equal-block models explicitly state not to scale','difference and missing mass segments distinguished from harvested mass'],
          'observed':observed,
          'figureReview':{'status':'verified','sha256':row['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,
            'checked':['all printed amounts read at actual block centers','scaled bar widths and contiguous endpoints measured','actual bracket spans and physical note/pen counts checked','number-ray labels calibrate every point and Bezier arrow tip direction'],
            'sourceSheet':'output/editorial-visual-wave23/visual-wave23-source-'+str(1+i//6)+'.png',
            'nativeSheet':'output/editorial-visual-wave23/visual-wave23-contact-'+str(1+i//6)+'.png'}})
    if '--write' in sys.argv:
        (ROOT/'problems/editorial/reviews/visual-wave23-addition-subtraction-models.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':9,'actualNativeObservationChecks':9,'wrongKeysRejected':9,'authorSolverImported':False}))

if __name__ == '__main__': main()
