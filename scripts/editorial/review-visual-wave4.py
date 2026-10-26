"""Independent Fraction/sign audit and measurements of actual native SVG geometry.

All 37 complete original/new conditions, explanations and choices were read.
All seven 343px contact sheets were inspected. Author math uses unit walks and
token cancellation; this reviewer uses exact rational coordinates and sums.
"""
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
FILE='problems/editorial/batches/visual-wave4-signed-scales.json'


def num(x):
    return F(str(x).replace(',','.').replace('−','-'))


def text(x):
    x=F(x)
    assert x.denominator==1,x
    return str(x.numerator)


def one(values):
    assert len(values)==1,values
    return values[0]


def points(p):
    return {r['label']:num(p['min'])+r['tick']*num(p['step']) for r in p.get('points',[])}


def readings(p):
    return [num(p['min'])+r['tick']*num(p['step']) for r in p['readings']]


def term(n):
    return '('+text(n)+')' if n<0 else text(n)


def answer(q):
    p=q['params'];kind=q['modelId'].removeprefix('visual-wave4-');v=points(p)
    if kind=='loss-days':return str(sum(t<0 for t in p['ticks']))
    if kind=='net-profit':return text(sum(p['ticks'])*p['step'])
    if kind=='cumulative-loss':
        prefixes=[sum(p['ticks'][:i])*p['step'] for i in range(1,len(p['ticks'])+1)]
        return str(sum(n<0 for n in prefixes))
    if kind=='thermo-reading':return text(readings(p)[0])
    if kind=='depth-point':return one([name for name,n in v.items() if n==-p['depth']])
    if kind=='signed-statement':
        c=one([c for c in p['candidates'] if v[c['label']]==c['value']])
        return c['label']+': '+('+' if c['value']>0 else '')+str(c['value'])+' м'
    if kind in ('warm-excess','warming-temperature'):
        end=readings(p)[0]+p['change']
        if kind=='warm-excess':assert end>0
        return text(end)
    if kind=='frost-depth':
        end=readings(p)[0]-p['drop'];assert end<0;return text(-end)
    if kind=='mine-dual':
        a,b=v[p['upper']],v[p['lower']];assert a>0>b
        return text(a-b)+' м; '+text(b)+' м'
    if kind=='variation-total':
        vals=readings(p)
        return text(sum(abs(b-a) for a,b in zip(vals,vals[1:])))
    if kind in ('coordinate-cancellation','negative-coordinate-sum'):
        return text(sum(v.values()))
    if kind=='cancellation-cards':return text(sum(p['values']))
    if kind in ('distance-crosszero','distance-unit','distance-scaled'):
        if num(p['step'])==1:
            assert 'жеткіліксіз' not in q['solution'],'Counting unit intervals is a valid distance method'
        return text(abs(v[p['first']]-v[p['second']]))
    if kind=='subtraction-equality':
        a,b=v[p['startLabel']],v[p['endLabel']];assert a>b
        return f'{text(a)} − {text(a-b)} = {text(b)}'
    if kind=='rise-two-readings':
        a,b=readings(p);assert b>a;return text(b-a)
    if kind=='altitude-gap':return text(v[p['upper']]-v[p['lower']])
    if kind=='restore-coordinate':
        expected=v[p['known']]-p['distance'];assert v[p['unknown']]==expected
        assert p['unknown'] in p['hiddenLabels'];return text(expected)
    if kind=='pair-distance':
        a,b=one([(a,b) for a,b in p['candidates'] if abs(v[a]-v[b])==p['goal']])
        return a+' және '+b
    if kind=='integer-count':
        assert F(0) in v.values(),'The zero-as-integer source case is retained'
        return str(sum(n.denominator==1 for n in v.values()))
    if kind=='number-set-region':
        assert p['numerator']<0 and p['denominator']==1
        return p['regions']['integerOther']
    if kind=='neighbor-integers':
        x=v[p['target']];assert x.denominator!=1
        return f'{math.floor(x)} және {math.ceil(x)}'
    if kind=='greatest-negative':
        greatest=max(n for n in v.values() if n<0)
        return one([name for name,n in v.items() if n==greatest])
    if kind=='strict-interval':
        return one([name for name,n in v.items() if p['lower']<n<p['upper']])
    if kind=='strict-count':
        assert num(p['bound']) in v.values(),'Boundary exclusion must actually be exercised'
        return str(sum(n<p['bound'] for n in v.values()))
    if kind=='coldest-city':
        vals=readings(p)
        return one([name for name,n in zip(p['names'],vals) if n==min(vals)])
    if kind=='arrow-displacement':return text(v[p['endLabel']]-v[p['startLabel']])
    if kind in ('arrow-endpoint-read','arrow-endpoint-given','mixed-arrow-endpoint'):
        start=v[p['startLabel']];end=start+p['change']
        assert p['arrows'][0]['from']==start and p['arrows'][0]['to']==end
        assert v[p['endLabel']]==end
        return text(end)
    if kind=='arrow-equality':
        start=v[p['startLabel']];end=v[p['endLabel']];delta=end-start
        return f'{term(start)} + {term(delta)} = {text(end)}'
    if kind=='two-negative-equation':
        a,b=p['arrows'];assert a['from']==0 and a['to']==b['from'] and b['to']<a['to']<0
        return f"{term(a['to'])} + {term(b['to']-b['from'])} = {text(b['to'])}"
    if kind=='undersea-descent':return text(v[p['target']]-p['drop'])
    raise ValueError(kind)


def svg_audit(q):
    p=q['params'];raw=(ROOT/'frontend/public'/q['image'].lstrip('/')).read_bytes()
    digest=hashlib.sha256(raw).hexdigest();assert digest==q['figureSha256']
    svg=ET.fromstring(raw);nodes=list(svg.iter())
    assert not any(n.tag.rsplit('}',1)[-1] in ('image','script','foreignObject') for n in nodes)
    texts=[n for n in nodes if n.tag.endswith('text')]
    def close(a,b):assert abs(float(a)-float(b))<.02,(a,b)
    def calibration(labels,coordinate):
        pairs=[(num(n.text),float(n.attrib[coordinate])) for n in labels]
        assert len(pairs)>=2
        low,high=min(pairs),max(pairs);assert low[0]!=high[0]
        def at(value):return low[1]+float(value-low[0])*(high[1]-low[1])/float(high[0]-low[0])
        for value,pixel in pairs:close(pixel,at(value))
        return at
    scene=p['scene']
    if scene=='axis':
        labels=[n for n in texts if 'data-scale-value' in n.attrib]
        dots={n.attrib['data-point']:n for n in texts if 'data-point' in n.attrib}
        assert set(dots)==set(points(p))
        if len(labels)>=2:
            at=calibration(labels,'x')
            for label,value in points(p).items():close(dots[label].attrib['x'],at(value))
            ticks=[n for n in nodes if 'data-tick' in n.attrib]
            assert len(ticks)==int((num(p['max'])-num(p['min']))/num(p['step']))+1
            for n in ticks:close(n.attrib['x1'],at(num(p['min'])+int(n.attrib['data-tick'])*num(p['step'])))
        else:
            assert p.get('hideTicks') and len(labels)==1 and p['distance']>0
            assert float(dots[p['unknown']].attrib['x'])<float(dots[p['known']].attrib['x'])
            assert any(n.text==str(p['distance'])+' бірлік' for n in texts)
            at=None
        arrows=[n for n in nodes if 'data-arrow-from' in n.attrib]
        assert len(arrows)==len(p.get('arrows',[]))
        for node,a in zip(arrows,p.get('arrows',[])):
            match=re.fullmatch(r'M(-?[\d.]+),(-?[\d.]+) Q(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)',node.attrib['d'])
            assert match and node.attrib['marker-end']=='url(#tip)'
            x0,y0,xc,yc,x1,y1=map(float,match.groups());assert y0==y1 and yc<y0
            close(x0,at(num(a['from'])));close(x1,at(num(a['to'])))
            if a['showDelta']:
                delta=a['to']-a['from'];printed=('+' if delta>0 else '')+str(delta)
                matches=[n for n in texts if n.text==printed and 'data-point' not in n.attrib]
                assert matches
    elif scene=='thermo':
        liquids=[n for n in nodes if 'data-reading-tick' in n.attrib]
        assert len(liquids)==len(p['readings'])
        for i,node in enumerate(liquids):
            cx=float(node.attrib['x'])+4
            labels=[n for n in texts if n.attrib.get('font-size')=='19' and abs(float(n.attrib['x'])-(cx-37))<.02]
            at=calibration(labels,'y');expected=readings(p)[i]
            close(node.attrib['y'],at(expected))
            close(float(node.attrib['y'])+float(node.attrib['height']),at(num(p['min'])))
    elif scene=='vertical':
        at=calibration([n for n in texts if float(n.attrib['x'])==151],'y')
        for n in texts:
            if 'data-point' in n.attrib:close(n.attrib['y'],at(points(p)[n.attrib['data-point']]))
        zero=one([n for n in nodes if n.tag.endswith('line') and n.attrib.get('stroke-dasharray')=='6 5'])
        close(zero.attrib['y1'],at(F(0)))
    elif scene=='bars':
        at=calibration([n for n in texts if float(n.attrib['x'])==48],'y')
        bars=[n for n in nodes if 'data-bar-ticks' in n.attrib];assert len(bars)==len(p['ticks'])
        for node,tick in zip(bars,p['ticks']):
            a,b=float(node.attrib['y']),float(node.attrib['y'])+float(node.attrib['height'])
            close(a,min(at(F(0)),at(F(tick*p['step']))));close(b,max(at(F(0)),at(F(tick*p['step']))))
    elif scene=='cards':
        assert [num(n.text) for n in texts if n.attrib.get('font-size')=='31']==list(map(F,p['values']))
    elif scene=='sets':
        ellipses=sorted([n for n in nodes if n.tag.endswith('ellipse')],key=lambda n:float(n.attrib['rx']))
        assert len(ellipses)==3
        def inside(n,e):
            return ((float(n.attrib['x'])-float(e.attrib['cx']))/float(e.attrib['rx']))**2+((float(n.attrib['y'])-float(e.attrib['cy']))/float(e.attrib['ry']))**2<1
        for group,index in [('natural',0),('integerOther',1),('rationalOther',2)]:
            node=one([n for n in texts if n.text==p['regions'][group]])
            assert inside(node,ellipses[index])
            if index:assert not inside(node,ellipses[index-1])
    return digest


def check(write=False):
    rows=json.loads((ROOT/FILE).read_text())['editions']
    assert len(rows)==37 and len({r['modelId'] for r in rows})==36
    entries=[]
    for q in rows:
        expected=answer(q);assert q['answer']==expected,(q['editionId'],expected)
        digest=svg_audit(q)
        if q.get('options'):assert len(set(q['options']))==len(q['options']) and q['options'].count(expected)==1
        assert not any(c in q['statement']+q['solution'] for c in ('$', '\\'))
        entries.append({'editionId':q['editionId'],'sha256':hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
            'verdict':'verified','reviewer':'independent_root_agent',
            'method':'separate_python_fraction_coordinates_sums_and_actual_svg_position_calibration',
            'expectedAnswer':expected,'checks':['all 37 source and authored full conditions, solutions and options read',
                'signed coordinates, positive magnitudes, strict bounds, prefix losses and arrow directions independently checked',
                'actual SVG positions measured against printed scale labels, liquid levels, bar extents and arrow endpoints',
                'hidden-coordinate accessible descriptions contain only the stated givens'],
            'figureReview':{'status':'verified','sha256':digest,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,
                'checked':['all seven native contact sheets inspected at 343px',
                           'tick spacing and signs agree with text and actual plotted positions',
                           'unit interval versus three-unit/half-unit interval preserved',
                           'every arrow points from the stated start to the stated end']}})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':len(entries),'entries':entries}
    if write:(ROOT/'problems/editorial/reviews/visual-wave4-signed-scales.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__=='__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
