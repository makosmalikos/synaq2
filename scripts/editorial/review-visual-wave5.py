"""Independent rational/number-theoretic review of 25 newly drawn tasks.

Read all 25 saved complete conditions, official solutions/choices, and the new
conditions/solutions/choices. Inspected all five 343px new contact sheets.
Five old rasters are unavailable: comparison uses their full saved solutions.
No claim of visual comparison to those missing original rasters is made.
"""
from fractions import Fraction as F
import ast
import hashlib
from itertools import combinations
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
FILE='problems/editorial/batches/visual-wave5-rational-visuals.json'
MISSING_RASTERS=['0a90c6314708c851','5abaf7a10362bfe3','bfc92b20978bc535','9edafd5e160e3424','deb929b3b35930b2']


def one(values):
    assert len(values)==1,values
    return values[0]


def numeric(s):return F(str(s).replace(',','.').replace('−','-'))


def fmt(n):
    n=F(n)
    if n.denominator==1:return str(n.numerator)
    if n.denominator==2:return ('-' if n<0 else '')+str(abs(n.numerator)//2)+',5'
    return str(n.numerator)+'/'+str(n.denominator)


def points(p):return {r['label']:F(r['tick'],p['denominator']) for r in p.get('points',[])}


def period(p):
    value=F(p['numerator'],p['denominator']);n,d=value.numerator,value.denominator
    assert 0<n<d and math.gcd(d,10)==1
    length=min(k for k in range(1,d+1) if pow(10,k,d)==1)
    block=F(n*(10**length-1),d);assert block.denominator==1
    digits=str(block.numerator).zfill(length)
    assert F(int(digits),10**length-1)==value
    trace=p['trace'];assert len(trace)==length and trace[0][0]==p['numerator'] and trace[-1][2]==p['numerator']
    assert len(set(r[0] for r in trace))==length
    for i,(before,digit,after) in enumerate(trace):
        assert 0<=digit<=9 and 0<=after<p['denominator']
        assert 10*before==digit*p['denominator']+after
        if i:assert trace[i-1][2]==before
    assert ''.join(str(r[1]) for r in trace)==digits
    return length,digits


def decimal_value(s):
    m=re.fullmatch(r'0,(\d*)\((\d+)\)',s);assert m,s
    lead,block=m.groups();base=10**len(lead)
    return F(int(lead or '0'),base)+F(int(block),base*(10**len(block)-1))


def arithmetic(s):
    def calc(n):
        if isinstance(n,ast.Constant) and type(n.value) is int:return F(n.value)
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -calc(n.operand)
        if isinstance(n,ast.BinOp):
            a,b=calc(n.left),calc(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            if isinstance(n.op,ast.Div):return a/b
        raise ValueError(ast.dump(n))
    return calc(ast.parse(s,mode='eval').body)


def answer(q):
    p=q['params'];kind=q['modelId'].removeprefix('visual-wave5-');v=points(p)
    if kind=='jump-product':return f"({p['delta']}) · {p['jumpCount']} = {p['delta']*p['jumpCount']}"
    if kind=='coordinate-product':return fmt(v[p['first']]*v[p['second']])
    if kind=='commutation-grid':return f"{p['rows']} · {p['cols']} = {p['cols']} · {p['rows']}"
    if kind=='round-pair':return ' және '.join(map(str,one([pair for pair in combinations(p['values'],2) if math.prod(pair)==p['roundTarget']])))
    if kind=='card-product':return str(math.prod(p['values']))
    if kind=='cooling-rate':return fmt(F(-p['reading'],p['hours']))
    if kind=='equal-parts-coordinate':
        unit=v[p['finalLabel']]/p['jumpCount'];assert unit==v[p['target']]
        return fmt(unit)
    if kind=='coordinate-quotient':return fmt(v[p['first']]/v[p['second']])
    if kind=='period-length':return str(period(p)[0])
    if kind=='period-notation':return '0,('+period(p)[1]+')'
    if kind=='repeat-axis':return one([name for name,n in v.items() if n==F(p['repeatDigit'],9)])
    if kind=='repeat-sector':return fmt(F(p['repeatDigit']*p['parts'],9)-p['colored'])
    if kind in ('integer-coordinate','half-coordinate'):return fmt(v[p['target']])
    if kind=='opposite-number':return fmt(-v[p['target']])
    if kind=='unit-length':return fmt(abs(v[p['second']]-v[p['first']]))
    if kind=='opposite-pair':return ' және '.join(one([(a,b) for a,b in combinations(v,2) if v[a]==-v[b]]))
    if kind=='minor-gap-count':return fmt(abs(v[p['second']]-v[p['first']])*p['denominator'])
    if kind=='two-label-calibration':
        a,b=p['calibration'];ticks={r['label']:r['tick'] for r in p['points']}
        slope=F(b['value']-a['value'],ticks[b['label']]-ticks[a['label']])
        return fmt(a['value']+(ticks[p['target']]-ticks[a['label']])*slope)
    if kind=='thermo-absolute':return str(abs(p['reading']))
    if kind=='mixed-absolute':
        n=F(p['whole'])+F(p['numerator'],p['denominator'])
        return one([o for o in q['options'] if arithmetic(o)==n])
    if kind=='bracket-negative':
        assert v[p['target']]<0 and abs(v[p['target']])==p['bracket'];return fmt(-p['bracket'])
    if kind=='coordinate-absolute':return fmt(abs(v[p['target']]))
    if kind=='opposite-absolutes-sum':return fmt(abs(v[p['first']])+abs(v[p['second']]))
    if kind=='greatest-absolute':
        largest=max(map(abs,v.values()));name=one([name for name,n in v.items() if abs(n)==largest])
        assert name!=max(v,key=v.get),'Signed order and magnitude must exercise different choices'
        return name
    raise ValueError(kind)


def svg_audit(q):
    p=q['params'];raw=(ROOT/'frontend/public'/q['image'].lstrip('/')).read_bytes()
    digest=hashlib.sha256(raw).hexdigest();assert digest==q['figureSha256']
    nodes=list(ET.fromstring(raw).iter());texts=[n for n in nodes if n.tag.endswith('text')]
    assert not any(n.tag.rsplit('}',1)[-1] in ('image','script','foreignObject') for n in nodes)
    def close(a,b):assert abs(float(a)-float(b))<.02,(a,b)
    def calibration(labels,coordinate):
        a,b=min(labels),max(labels);assert a[0]!=b[0]
        def at(v):return a[1]+float(v-a[0])*(b[1]-a[1])/float(b[0]-a[0])
        for v,pos in labels:close(pos,at(v))
        return at
    scene=p['scene']
    if scene=='axis':
        labels=[n for n in texts if n.attrib.get('font-size')=='20' and 'бірлік' not in n.text]
        dots={n.attrib['data-point']:n for n in nodes if 'data-point' in n.attrib}
        assert set(dots)==set(points(p))
        if len(labels)>=2:
            at=calibration([(numeric(n.text),float(n.attrib['x'])) for n in labels],'x')
            for name,n in points(p).items():close(dots[name].attrib['cx'],at(n))
            ticks=[n for n in nodes if 'data-scale-tick' in n.attrib]
            expected=[i for i in range(p['minTick'],p['maxTick']+1) if i%p['tickEvery']==0]
            assert [int(n.attrib['data-scale-tick']) for n in ticks]==expected
            for n in ticks:close(n.attrib['x1'],at(F(int(n.attrib['data-scale-tick']),p['denominator'])))
            jumps=[n for n in nodes if 'data-jump-from' in n.attrib]
            assert len(jumps)==p.get('jumpCount',0)
            for i,n in enumerate(jumps):
                m=re.fullmatch(r'M(-?[\d.]+),(-?[\d.]+) Q(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)',n.attrib['d']);assert m
                x0,y0,xc,yc,x1,y1=map(float,m.groups());assert y0==y1 and yc<y0 and n.attrib['marker-end']=='url(#tip)'
                close(x0,at(F(p['jumpStart']+i*p['delta'],p['denominator'])))
                close(x1,at(F(p['jumpStart']+(i+1)*p['delta'],p['denominator'])))
        else:
            assert p.get('bracket') and p.get('hideTicks') and len(labels)==1 and numeric(labels[0].text)==0
            assert float(dots[p['target']].attrib['cx'])<float(labels[0].attrib['x'])
            assert any(n.text==str(p['bracket'])+' бірлік' for n in texts)
    elif scene=='thermo':
        labels=[(numeric(n.text),float(n.attrib['y'])) for n in texts if float(n.attrib['x'])==216]
        at=calibration(labels,'y');liquid=one([n for n in nodes if 'data-reading' in n.attrib])
        close(liquid.attrib['y'],at(F(p['reading'])))
        close(float(liquid.attrib['y'])+float(liquid.attrib['height']),at(F(p['min'])))
    elif scene=='grid':
        cells=[n for n in nodes if 'data-cell' in n.attrib]
        assert len(cells)==p['rows']*p['cols']
        assert len({n.attrib['x'] for n in cells})==p['cols'] and len({n.attrib['y'] for n in cells})==p['rows']
        assert len({(n.attrib['x'],n.attrib['y']) for n in cells})==len(cells)
    elif scene=='cards':assert [numeric(n.text) for n in texts if n.attrib.get('font-size')=='32']==list(map(F,p['values']))
    elif scene=='division':
        actual=[n for n in texts if n.attrib.get('font-size')=='23']
        assert [int(n.text) for n in actual]==[v for row in p['trace'] for v in row]
        assert any(n.text==str(p['numerator'])+' : '+str(p['denominator']) for n in texts)
        period(p)
    elif scene=='sectors':
        sectors=[n for n in nodes if 'data-sector' in n.attrib];assert len(sectors)==p['parts']
        colored=[n for n in sectors if n.attrib['data-colored']=='true'];assert len(colored)==p['colored']
        angles=[]
        for node in sectors:
            m=re.fullmatch(r'M([\d.]+),([\d.]+) L([\d.]+),([\d.]+) A([\d.]+),([\d.]+) 0 0,1 ([\d.]+),([\d.]+) Z',node.attrib['d']);assert m
            cx,cy,ax,ay,rx,ry,bx,by=map(float,m.groups());close(rx,ry)
            close(math.hypot(ax-cx,ay-cy),rx);close(math.hypot(bx-cx,by-cy),rx)
            delta=(math.atan2(by-cy,bx-cx)-math.atan2(ay-cy,ax-cx))%(2*math.pi)
            close(delta,2*math.pi/p['parts']);angles.append(delta)
            assert node.attrib['fill']==('#779ee7' if node in colored else '#fff2db')
        close(sum(angles),2*math.pi)
    elif scene=='mixed':
        assert one([n for n in texts if n.attrib.get('font-size')=='47']).text==str(p['whole'])
        assert [int(n.text) for n in texts if n.attrib.get('font-size')=='31']==[p['numerator'],p['denominator']]
        minus=one([n for n in texts if n.text=='−']);assert float(minus.attrib['x'])<210
        bars=[n for n in nodes if n.tag.endswith('line') and n.attrib['x1']==n.attrib['x2']]
        assert len(bars)==2 and min(float(n.attrib['x1']) for n in bars)<float(minus.attrib['x']) and max(float(n.attrib['x1']) for n in bars)>280
    return digest


def check(write=False):
    rows=json.loads((ROOT/FILE).read_text())['editions'];assert len(rows)==25 and len({q['modelId'] for q in rows})==25
    entries=[]
    for q in rows:
        expected=answer(q);assert q['answer']==expected,(q['editionId'],expected)
        if q.get('options'):
            assert len(set(q['options']))==len(q['options']) and q['options'].count(expected)==1
            if q['params']['scene']=='division':assert sum(decimal_value(o)==F(q['params']['numerator'],q['params']['denominator']) for o in q['options'])==1
        else:assert 'Жауапқа тек санды жазыңыз.' in q['statement']
        digest=svg_audit(q)
        entries.append({'editionId':q['editionId'],'sha256':hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
            'verdict':'verified','reviewer':'independent_root_agent','method':'independent_fraction_and_multiplicative_order_oracle_with_actual_svg_measurement',
            'expectedAnswer':expected,'checks':['all 25 full source and new conditions, complete solutions and choices read',
                'rational coordinates, products, operand order, interval counts and absolute values independently calculated',
                'repeating blocks verified by multiplicative order and exact block/(10^length-1) identity',
                'original missing rasters are not claimed visually compared; full source solutions determine their skills'],
            'figureReview':{'status':'verified','sha256':digest,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,
                'checked':['all five native contact sheets inspected at 343px',
                    'actual point locations and liquid levels calibrated from printed labels',
                    'jump directions/counts, grid cells, long-division rows and equal sector arcs measured',
                    'minus applies to the entire mixed numeral inside both modulus bars']}})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':25,'sourceRastersUnavailable':MISSING_RASTERS,'entries':entries}
    if write:(ROOT/'problems/editorial/reviews/visual-wave5-rational-visuals.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__=='__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
