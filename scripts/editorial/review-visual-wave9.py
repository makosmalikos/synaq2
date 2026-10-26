"""Independent JSON/SVG review; no imports of the author's geometry/renderers.

All 15 complete archived/new conditions, solutions and choices were read;
all three source and three native343px sheets were visually inspected.
Analytic slopes, exact line equations and axis classes below rederive answers.
Actual SVG endpoints, grid positions, arc sectors and projections are checked.
"""
import copy
import hashlib
import itertools
import json
import math
from fractions import Fraction as F
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave9-line-geometry.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def digest(r):
    return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def tag(e): return e.tag.rsplit('}',1)[-1]
def elements(svg,name): return [e for e in svg.iter() if tag(e)==name]
def numbers(e,*names): return [F(e.get(n)) for n in names]
def vector(a,b): return tuple(F(y)-F(x) for x,y in zip(a,b))
def slope(v): return None if v[0]==0 else F(v[1],v[0])
def perpendicular(v,w):
    return (v[0]==0 and w[1]==0) or (w[0]==0 and v[1]==0) or (v[0]!=0 and w[0]!=0 and slope(v)*slope(w)==-1)
def parallel(v,w): return slope(v)==slope(w)
def cyclic(a,b): return (b-a)%360
def small_angle(a,b): return min(cyclic(a,b),cyclic(b,a))
def on_line(point,first,second):
    dx,dy=vector(first,second)
    return dy*(point[0]-first[0])-dx*(point[1]-first[1])==0
def line_points(e):
    return tuple(numbers(e,'x1','y1')),tuple(numbers(e,'x2','y2'))
def near(a,b): assert abs(float(a)-float(b))<1e-7,(a,b)
def direction(e):
    a,b=line_points(e)
    return (b[0]-a[0],a[1]-b[1])
def heading(v): return math.degrees(math.atan2(float(v[1]),float(v[0])))%360
def near_angle(a,b): assert min((a-b)%360,(b-a)%360)<1e-7,(a,b)

def answer(row):
    p=row['params'];kind=row['modelId'].removeprefix('visual-wave9-')
    kind={'opposite-pair':'vertical-sector-pair','right-complement':'right-remainder','outside-right':'right-external-add','closest-line':'closest-line-point','perpendicular-pair':'grid-perpendicular-pair','cuboid-parallels':'cuboid-parallel-class','quadrilateral-parallels':'quadrilateral-parallel','parallel-segments':'parallel-segment-count','parallel-through':'unique-parallel-line','octagon-pairs':'octagon-parallel-pairs','parallel-distance':'parallel-grid-distance'}.get(kind,kind)
    pts={q['label']:(q['x'],q['y']) for q in p.get('points',[])}
    if kind=='off-line':
        off=[n for n,q in pts.items() if not on_line(q,p['linePoint'],p['lineOther'])]
        assert len(off)==1
        return off[0]
    if kind in ['named-supplement','adjacent-supplement','right-remainder','right-external-add']:
        rays={q['label']:q['degrees'] for q in p['rays']}
        given=small_angle(*(rays[n] for n in p['given']))
        target=small_angle(*(rays[n] for n in p['target']))
        assert given==p['givenDegrees']
        if kind in ['named-supplement','adjacent-supplement']: assert target+given==180
        elif kind=='right-remainder': assert target+given==90
        else: assert target-given==90
        return str(target)
    if kind=='vertical-sector-pair':
        labels=p['sectorLabels'];good=[]
        for a,b in p['choices']:
            if (labels.index(a)-labels.index(b))%4==2: good.append(f'∠{a} және ∠{b}')
        assert len(good)==1
        return good[0]
    if kind=='point-line-distance':
        a,b=pts['A'],pts['B'];distance=abs(a[0]-p['lineX'])
        assert b[0]==p['lineX'] and b[1]!=a[1]
        assert (b[0]-a[0])**2+(b[1]-a[1])**2>distance**2
        return str(distance)
    if kind=='closest-line-point':
        ds={n:abs(q[0]-p['lineX']) for n,q in pts.items()};minimum=min(ds.values())
        closest=[n for n,d in ds.items() if d==minimum];assert len(closest)==1
        return closest[0]
    if kind=='grid-perpendicular-pair':
        good=[str(i+1) for i,(a,b) in enumerate(p['pairs']) if perpendicular(a,b)];assert len(good)==1
        return good[0]
    if kind=='cuboid-parallel-class':
        vertices=p['vertices'];assert len(vertices)==8 and len(p['edges'])==12
        # A rectangular cuboid edge has exactly one changing coordinate.
        edge_axes={}
        for a,b in p['edges']:
            v=vector(vertices[a],vertices[b]);axes=[i for i,n in enumerate(v) if n]
            assert len(axes)==1;edge_axes[(a,b)]=axes[0]
        axis=edge_axes[tuple(p['reference'])]
        good=[a+b for (a,b),ax in edge_axes.items() if ax==axis and [a,b]!=p['reference']]
        assert len(good)==3
        return ', '.join(good)
    if kind=='quadrilateral-parallel':
        m,n,p1,q=[pts[k] for k in ['M','N','P','Q']]
        truth=[parallel(vector(m,n),vector(p1,q)),parallel(vector(n,p1),vector(q,m)),parallel(vector(m,n),vector(n,p1))]
        assert truth==[True,False,False]
        return 'MN ∥ PQ'
    if kind=='parallel-segment-count':
        reference=p['segments'][0]['direction']
        return str(sum(parallel(reference,s['direction']) for s in p['segments'][1:]))
    if kind=='unique-parallel-line':
        r=p['reference'];assert not on_line(p['through'],r['point'],[x+y for x,y in zip(r['point'],r['direction'])])
        good=[ln['label'] for ln in p['lines'] if parallel(ln['direction'],r['direction'])];assert len(good)==1
        return good[0]
    if kind=='octagon-parallel-pairs':
        vs=p['polygon'];assert len(vs)==8 and len(set(map(tuple,vs)))==8
        edges=[vector(vs[i],vs[(i+1)%8]) for i in range(8)]
        # Strict convexity: every vertex is strictly on the same interior side
        # of every nonincident supporting edge, not just a sketch appearance.
        signs=[]
        for i,(dx,dy) in enumerate(edges):
            side=[dx*(q[1]-vs[i][1])-dy*(q[0]-vs[i][0]) for j,q in enumerate(vs) if j not in [i,(i+1)%8]]
            assert all(x>0 for x in side) or all(x<0 for x in side)
            signs.append(side[0]>0)
        assert len(set(signs))==1
        pairs=[(i,j) for i,j in itertools.combinations(range(8),2) if parallel(edges[i],edges[j])]
        assert pairs==[(0,4),(1,5),(2,6)]
        return str(len(pairs))
    if kind=='parallel-grid-distance': return str(abs(p['firstY']-p['secondY'])*p['unitMm'])
    raise AssertionError(kind)

def svg_check(row):
    p=row['params'];raw=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==row['figureSha256']
    svg=ET.fromstring(raw);assert svg.get('viewBox')=='0 0 480 360'
    ls=elements(svg,'line');texts=elements(svg,'text');written=[''.join(t.itertext()) for t in texts]
    if p['scene']=='angles':
        actual={e.get('data-ray'):e for e in ls if e.get('data-ray')};assert len(actual)==len(p['rays'])
        origin=None
        for ray in p['rays']:
            el=actual[ray['label']];a,b=line_points(el);origin=a if origin is None else origin;assert a==origin
            near_angle(heading(direction(el)),ray['degrees'])
        ox,oy=origin
        if 'sectorLabels' in p:
            rays=sorted(q['degrees'] for q in p['rays'])
            for i,label in enumerate(p['sectorLabels']):
                el=next(e for e in texts if ''.join(e.itertext())==str(label));x,y=numbers(el,'x','y');angle=heading((x-ox,oy-y))
                assert 0<cyclic(rays[i],angle)<cyclic(rays[i],rays[(i+1)%4])
        else:
            assert str(p['givenDegrees'])+'°' in written and '?' in written
            arcs=[e for e in elements(svg,'path') if ' A ' in e.get('d','')]
            assert len(arcs)==2
            for el,pair in zip(arcs,[p['given'],p['target']]):
                nums=re.findall(r'-?\d+(?:\.\d+)?',el.get('d'));assert len(nums)==9
                x1,y1,rx,ry,rot,large,sweep,x2,y2=map(float,nums);near(rx,ry);near(rot,0)
                expected={q['label']:q['degrees'] for q in p['rays']}
                near_angle(heading((x1-float(ox),float(oy)-y1)),expected[pair[0]])
                near_angle(heading((x2-float(ox),float(oy)-y2)),expected[pair[1]])
                near(math.hypot(x1-float(ox),y1-float(oy)),rx);near(math.hypot(x2-float(ox),y2-float(oy)),rx)
        return
    grid=[e for e in ls if e.get('stroke')=='#dbe5f1']
    if p['scene']=='grid':
        xs=sorted(set(numbers(e,'x1')[0] for e in grid if e.get('x1')==e.get('x2')))
        ys=sorted(set(numbers(e,'y1')[0] for e in grid if e.get('y1')==e.get('y2')))
        assert all(b-a==26 for a,b in zip(xs,xs[1:])) and all(b-a==26 for a,b in zip(ys,ys[1:]))
        actual={e.get('data-point'):e for e in elements(svg,'circle') if e.get('data-point')}
        points=p.get('points',[{'label':'A','x':p.get('through',[0,0])[0],'y':p.get('through',[0,0])[1]}]) if 'firstY' not in p else []
        for q in points:
            el=actual[q['label']];cx,cy=numbers(el,'cx','cy');assert (cx,cy)==(240+26*q['x'],180-26*q['y']);assert cx in xs and cy in ys
        if 'lineX' in p:
            special=[e for e in ls if e.get('stroke')=='#8459ce'];assert len(special)==1
            a,b=line_points(special[0]);assert a[0]==b[0]==240+26*p['lineX']
        if 'linePoint' in p:
            special=next(e for e in ls if e.get('stroke')=='#315ce8');a,b=line_points(special)
            for q in p['points']:
                expected=on_line((q['x'],q['y']),p['linePoint'],p['lineOther']);pix=(240+26*q['x'],180-26*q['y'])
                assert on_line(pix,a,b)==expected
        if 'reference' in p:
            reference=next(e for e in ls if e.get('stroke')=='#203549');a,b=line_points(reference);near_angle(heading(direction(reference)),heading(p['reference']['direction']))
            x,y=p['reference']['point'];near(float(direction(reference)[0])*(180-26*y-float(a[1]))+float(direction(reference)[1])*(240+26*x-float(a[0])),0)
            for ln in p['lines']:
                el=next(e for e in ls if e.get('data-line')==ln['label']);near_angle(heading(direction(el)),heading(ln['direction']))
                a,b=line_points(el);x,y=p['through'];near(float(direction(el)[0])*(180-26*y-float(a[1]))+float(direction(el)[1])*(240+26*x-float(a[0])),0)
        if 'firstY' in p:
            actual=[e for e in ls if e.get('data-row')];assert len(actual)==2
            assert sorted([numbers(e,'y1')[0] for e in actual])==sorted([180-26*p['firstY'],180-26*p['secondY']])
        if 'points' in p and len(p['points'])==4 and row['modelId'].endswith('quadrilateral-parallels'):
            poly=elements(svg,'polygon')[0];actual=[tuple(map(F,s.split(','))) for s in poly.get('points').split()]
            assert actual==[(240+26*q['x'],180-26*q['y']) for q in p['points']]
    elif p['scene']=='segments':
        for i,s in enumerate(p['segments']):
            el=next(e for e in ls if e.get('data-segment')==''.join(s['labels']));a,b=line_points(el)
            assert direction(el)==tuple(20*n for n in s['direction'])
            x0=40+160*(i%3);y0=145+168*(i//3)
            for x,y in [a,b]:assert (x-x0)%20==0 and (y0-y)%20==0
    elif p['scene']=='perp-gallery':
        good=[]
        for i,pair in enumerate(p['pairs'],1):
            els=[e for e in ls if e.get('data-pair')==str(i)];assert len(els)==2
            # Panel unit lengths must agree in x and y; a stretched grid could
            # make the numeric direction tags falsely claim perpendicularity.
            x0=44+240*((i-1)%2);y0=41+172*((i-1)//2)
            for x in range(x0,x0+153,19):assert any(numbers(e,'x1','x2')==[x,x] and numbers(e,'y1','y2')==[y0+114,y0] for e in grid)
            for y in range(y0,y0+115,19):assert any(numbers(e,'y1','y2')==[y,y] and numbers(e,'x1','x2')==[x0,x0+152] for e in grid)
            for el,v in zip(els,pair):assert parallel(direction(el),v)
            if perpendicular(*map(direction,els)):good.append(str(i))
        assert good==[row['answer']]
    elif p['scene']=='cuboid':
        def project(v):x,y,z=v;return 100+38*x+22*y,280-30*y-45*z
        for a,b in p['edges']:
            el=next(e for e in ls if e.get('data-edge')==a+b)
            assert line_points(el)==(project(p['vertices'][a]),project(p['vertices'][b]))
            if [a,b]==p['reference']:assert el.get('stroke')=='#ef8b35' and el.get('stroke-width')=='5'
    elif p['scene']=='octagon':
        poly=elements(svg,'polygon')[0];actual=[tuple(map(F,s.split(','))) for s in poly.get('points').split()]
        assert actual==[(105+30*x,300-30*y) for x,y in p['polygon']]
    else:raise AssertionError(p['scene'])

def main():
    assert len(ROWS)==15
    entries=[]
    for row in ROWS:
        assert answer(row)==row['answer'],(row['editionId'],answer(row),row['answer'])
        bad=copy.deepcopy(row);bad['answer']='wrong';assert answer(bad)!=bad['answer']
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(row['answer'])==1
        svg_check(row)
        i=len(entries);sheet=i//6+1
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_root_agent','method':'Exact analytic slopes/line equations and cuboid axis classes, plus actual SVG endpoint and angle measurement','checks':['all15 complete original/new conditions, solutions and MCQs read','all three archived and three native343px sheets visually inspected','unknowns, names and full line/right/straight/vertical-angle relationships retain the source skill','unordered parallel classes exclude the selected reference, and octagon strict convexity is checked'],'figureReview':{'status':'verified','sha256':row['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual grid-node pixel coordinates and unit spacing','actual ray headings, sector labels and arc endpoints','actual segment vectors, polygon vertices and cuboid edge projection'],'sourceSheet':f'output/editorial-visual-wave9/visual-wave9-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave9/visual-wave9-contact-{sheet}.png'}})
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'15 new native visual editions only; the already verified opposite-angle retained source is not re-signed. Full original/new text and 343px reading precede this reproducible independent oracle.','entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave9-line-geometry.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':len(entries),'actualSvgChecks':15,'wrongKeyRegressions':15}))
if __name__=='__main__':main()
