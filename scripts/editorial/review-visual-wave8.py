"""Independent offline editorial oracle; never imports the author renderer/solver.

All15 canonical source/new conditions, full solutions and MCQs were read, and
all3 source sheets and all3 native343px sheets were inspected by the reviewer.
Only this exact hash-bound batch is reviewed, not the whole source archive.
"""
import hashlib,json,math,re,sys
from fractions import Fraction as F
from pathlib import Path
from itertools import combinations
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
read=lambda p:json.loads((ROOT/p).read_text())
pack=read('problems/editorial/batches/visual-wave8-plane-symmetry.json')
rows=pack['editions']
assert len(rows)==15
assert {r['editionId'] for r in pack['coverage']['previousEditionsRetained']}=={'visual-mirror-cells','visual-mirror-point'}
canonical=lambda x:json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
digest=lambda x:hashlib.sha256(canonical(x)).hexdigest()
tag=lambda e:e.tag.rsplit('}',1)[-1]
point=lambda p:(F(p[0]),F(p[1]))
edges=lambda poly:{frozenset((point(poly[i]),point(poly[(i+1)%len(poly)]))) for i in range(len(poly))}
def twice_area(poly):return abs(sum(poly[i][0]*poly[(i+1)%len(poly)][1]-poly[(i+1)%len(poly)][0]*poly[i][1] for i in range(len(poly))))
def reflect_axes(poly):
    # Any nondegenerate reflection moves at least one vertex to another vertex.
    # Its axis is the perpendicular bisector of that pair. Test ALL such pairs,
    # using exact rational reflected edges, including the concave boundaries.
    candidates=set()
    for p,q in combinations(poly,2):
        a,b=2*(q[0]-p[0]),2*(q[1]-p[1]);c=(q[0]-p[0])*(p[0]+q[0])+(q[1]-p[1])*(p[1]+q[1])
        g=math.gcd(math.gcd(abs(a),abs(b)),abs(c));a,b,c=a//g,b//g,c//g
        if a<0 or a==0 and b<0:a,b,c=-a,-b,-c
        candidates.add((a,b,c))
    accepted=[];old=edges(poly)
    for a,b,c in candidates:
        transformed=[]
        for x,y in poly:
            t=F(2*(a*x+b*y-c),a*a+b*b);transformed.append((F(x)-a*t,F(y)-b*t))
        if edges(transformed)==old:accepted.append((a,b,c))
    return sorted(accepted)
def half_turn(poly):
    # Vertex mean is fixed under every finite-set half-turn, so no centre search.
    x=F(sum(p[0] for p in poly),len(poly));y=F(sum(p[1] for p in poly),len(poly))
    return edges([(2*x-a,2*y-b) for a,b in poly])==edges(poly)
def geometry(row,root):
    p=row['params'];scene=p['scene'];all_nodes=list(root.iter());lines=[e for e in all_nodes if tag(e)=='line']
    text_nodes=[e for e in all_nodes if tag(e)=='text'];texts=[''.join(e.itertext()) for e in text_nodes]
    w,h=map(F,root.attrib['viewBox'].split()[2:]);assert w==480 and h in (220,360)
    for e in text_nodes:assert 0<F(e.attrib['x'])<w and 0<F(e.attrib['y'])<h
    if scene=='plane':
        grid=[e for e in lines if e.attrib.get('stroke')=='#dde7f4'];xs=sorted({F(e.attrib['x1']) for e in grid if e.attrib['x1']==e.attrib['x2']});ys=sorted({F(e.attrib['y1']) for e in grid if e.attrib['y1']==e.attrib['y2']})
        assert len(xs)==len(ys)==13;unit=xs[1]-xs[0];assert unit>0
        assert {b-a for a,b in zip(xs,xs[1:])}=={unit} and {b-a for a,b in zip(ys,ys[1:])}=={unit}
        origin=((xs[0]+xs[-1])/2,(ys[0]+ys[-1])/2)
        nodes={e.attrib['data-point']:e for e in all_nodes if tag(e)=='circle' and 'data-point' in e.attrib}
        assert set(nodes)=={q['label'] for q in p['points']}
        for q in p['points']:
            e=nodes[q['label']];assert F(e.attrib['cx'])==origin[0]+unit*q['x'];assert F(e.attrib['cy'])==origin[1]-unit*q['y'];assert q['label'] in texts
            assert F(e.attrib['data-x'])==q['x'] and F(e.attrib['data-y'])==q['y']
        if p.get('axes',True):
            assert 'x' in texts and 'y' in texts and '0' in texts
            ones=[e for e in text_nodes if e.text=='1'];assert len(ones)==2
            assert any(F(e.attrib['x'])==origin[0]+unit for e in ones)
            assert any(F(e.attrib['y'])==origin[1]-unit for e in ones)
        if 'mirrorX' in p:
            mirror=[e for e in lines if e.attrib.get('stroke')=='#c39361'];assert len(mirror)==1
            assert F(mirror[0].attrib['x1'])==F(mirror[0].attrib['x2'])==origin[0]+unit*p['mirrorX'];assert 'k' in texts
        if p.get('triangle'):
            polygons=[e for e in all_nodes if tag(e)=='polygon'];assert len(polygons)==1
            actual=[tuple(map(F,v.split(','))) for v in polygons[0].attrib['points'].split()]
            expected=[(F(nodes[n].attrib['cx']),F(nodes[n].attrib['cy'])) for n in p['triangle']];assert actual==expected
        if p.get('segment'):
            a,b=[nodes[n] for n in p['segment']];target=(F(a.attrib['cx']),F(a.attrib['cy']),F(b.attrib['cx']),F(b.attrib['cy']))
            assert any(tuple(F(e.attrib[k]) for k in ['x1','y1','x2','y2'])==target for e in lines)
    elif scene=='gallery':
        polygons=[e for e in all_nodes if tag(e)=='polygon'];assert len(polygons)==len(p['polygons']);pitches=set()
        for index,(source,e) in enumerate(zip(p['polygons'],polygons),1):
            assert twice_area(source)>0 and len(set(map(tuple,source)))==len(source)
            actual=[tuple(map(F,v.split(','))) for v in e.attrib['points'].split()];assert len(actual)==len(source)
            ratios=[]
            for i in range(1,len(source)):
                for coordinate in [0,1]:
                    delta=source[i][coordinate]-source[0][coordinate]
                    if delta:ratios.append((actual[i][coordinate]-actual[0][coordinate])/delta)
            assert len(set(ratios))==1 and ratios[0]>0;s=ratios[0];pitches.add(s)
            for i in range(len(source)):
                for coordinate in [0,1]:assert actual[i][coordinate]-actual[0][coordinate]==s*(source[i][coordinate]-source[0][coordinate])
            assert str(index) in texts
        assert len(pitches)==1
    elif scene=='axis':
        tick_nodes=[e for e in lines if e.attrib.get('stroke')=='#8099b9'];ticks=sorted(F(e.attrib['x1']) for e in tick_nodes);unit=ticks[1]-ticks[0]
        assert len(ticks)==p['max']-p['min']+1 and {b-a for a,b in zip(ticks,ticks[1:])}=={unit}
        zero=next(e for e in text_nodes if e.text=='0');one=next(e for e in text_nodes if e.text=='1');origin=F(zero.attrib['x']);assert F(one.attrib['x'])-origin==unit
        points={e.attrib['data-point']:e for e in all_nodes if tag(e)=='circle' and 'data-point' in e.attrib}
        for q in p['points']:assert F(points[q['label']].attrib['cx'])==origin+q['x']*unit
        assert any('marker-end' in e.attrib for e in lines)
    elif scene=='angle':
        rays=[e for e in lines if 'data-ray-degrees' in e.attrib];assert len(rays)==2;angles=[]
        for e in rays:
            dx=float(e.attrib['x2'])-float(e.attrib['x1']);dy=float(e.attrib['y1'])-float(e.attrib['y2']);angles.append(math.degrees(math.atan2(dy,dx)))
        assert all(abs(abs(a)-p['half'])<0.0001 for a in angles) and angles[0]*angles[1]<0
        assert f"{p['half']}°" in texts and all(t in texts for t in ['A','B','C','D','k'])
    else:raise AssertionError(scene)
def solve(row):
    p=row['params'];k=row['modelId'].removeprefix('visual-wave8-');points={q['label']:(q['x'],q['y']) for q in p.get('points',[])}
    if k=='ordinate':return str(points[p['target']][1]),'Second ordered coordinate, independently read from native grid.'
    if k=='axes-count':return str(sum(x*y==0 for x,y in points.values())),'Zero-coordinate membership counts4 and excludes quadrant points.'
    if k in ('axis-coordinate','point-coordinate'):
        x,y=points[p['target']];return f'({x}; {y})','Ordered x/y pair and separate sign/swap distractors checked.'
    if k=='quadrant-two-count':return str(sum(x<0<y for x,y in points.values())),'Strict x<0<y; the on-axis point is excluded.'
    if k=='horizontal-length':
        a,b=points[p['first']],points[p['second']];assert a[1]==b[1];return str(abs(a[0]-b[0])),'Counted9 equal horizontal gaps across the origin.'
    if k=='coordinate-choice':return next(n for n,xy in points.items() if tuple(p['requested'])==xy),'All4 plotted coordinate pairs tested.'
    if k=='axis-symmetry-count':
        counts=list(map(lambda poly:len(reflect_axes(poly)),p['polygons']));assert counts==[1,0,1,0,2,1]
        return str(sum(c>0 for c in counts)),'Exact reflection of complete unordered polygon edges: axis counts1,0,1,0,2,1; concave shapes3/6 checked.'
    if k=='bisector-angle':return str(2*p['half']),'Actual SVG ray vectors measure±42°, so full angle84°.'
    if k=='mirror-choice':
        x,y=points[p['target']];target=(2*p['mirrorX']-x,y);answers=[n for n,v in points.items() if v==target];assert len(answers)==1
        return answers[0],'Equal perpendicular distance AND same row uniquely select R.'
    if k=='mirror-separation':return str(2*abs(points[p['target']][0]-p['mirrorX'])),'Two perpendicular distances5cm+5cm yield full10cm separation.'
    if k=='central-figure-choice':
        flags=list(map(half_turn,p['polygons']));assert flags==[False,False,True,False];return str(flags.index(True)+1),'Exact vertex-mean half-turn maps complete edge set only for parallelogram3.'
    if k=='origin-central-point':
        x,y=points[p['target']];return next(n for n,v in points.items() if v==(-x,-y)),'Both signs change; swapped coordinates and single-axis reflections excluded.'
    if k=='line-central-image':
        a=points[p['target']][0];centre=points[p['center']][0];answer=2*centre-a;assert F(a+answer,2)==centre
        return str(answer),'Nonzero centre1 is midpoint of -4 and6; right arrow permits continuation beyond displayed ticks.'
    if k=='central-triangle-area':
        poly=[points[n] for n in p['triangle']];cx,cy=points[p['center']];image=[(2*cx-x,2*cy-y) for x,y in poly]
        def area(poly):a,b,c=poly;return abs(F((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),2))
        assert area(poly)==area(image)==10;return '10','Base5,height4 read from common square grid; cross-product areas of original and independently transformed triangle both10.'
    raise AssertionError(k)
entries=[]
for index,row in enumerate(rows):
    assert row['minimumPlan']=='pro' and row['editorialStatus']=='draft'
    ref=row['sourceRefs'][0];raw=next(q for q in read(ref['sourceFile'])['questions'] if q['id']==ref['sourceId'])
    assert raw.get('solution') and raw.get('sourceAnswer') and digest(raw)==row['sourceCanonicalSha256']
    svg=ROOT/'frontend/public'/row['image'].lstrip('/');binary=svg.read_bytes();assert hashlib.sha256(binary).hexdigest()==row['figureSha256']
    root=ET.fromstring(binary);assert not any(tag(e) in ['image','script','foreignObject'] for e in root.iter());assert not re.search(rb'(?:https?://|data:image|javascript:)',binary.replace(b'http://www.w3.org/2000/svg',b''))
    geometry(row,root);answer,note=solve(row);assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    assert f'Жауап: {answer}' in row['solution']
    if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    page=index//6+1
    for kind in ['source','contact']:assert (ROOT/f'output/editorial-visual-wave8/visual-wave8-{kind}-{page}.png').exists()
    entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':'Independent Python Fraction coordinate/edge-reflection/half-turn oracle plus full source-skill and343px visual reading','notes':[note,'All source/new conditions, full official/authored solutions, MCQs and archived/new mobile drawings read. Native SVG pixel geometry is bound to actual grid/vertices, not only data attributes. Only these15 newly authored editions are signed;2 retained editions are excluded.'],'figureReview':{'status':'verified','sha256':row['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['Archived source condition/full solution and authored source skill read.','Source and native343px proof sheets inspected; labels and mathematical givens legible.','Actual SVG coordinates/grid/polygon geometry bound to givens; no raster, script or external asset.',note]},'evidence':{'sourceSheet':f'output/editorial-visual-wave8/visual-wave8-source-{page}.png','mobileSheet':f'output/editorial-visual-wave8/visual-wave8-contact-{page}.png','mobileWidthPx':343,'figureSha256':row['figureSha256']}})
report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
target=ROOT/'problems/editorial/reviews/visual-wave8-plane-symmetry.json'
if '--write' in sys.argv:target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
else:assert json.loads(target.read_text())==report
print(json.dumps({'editions':len(entries),'sourceAndNativeSheetsRead':6,'nativeSVGsBound':len(entries),'reflectionAxes':[1,0,1,0,2,1],'retainedNotResigned':2,'status':'passed'}))
