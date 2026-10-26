"""Independent interval bound algebra and parsing of actual written choices.

All24 full source/new conditions, worked solutions and choices read; all four
new343px contact sheets inspected. Author uses membership-atoms; reviewer uses
closed-form bound intersection/union and exact linear/absolute transformations.
"""
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
FILE='problems/editorial/batches/visual-wave7-inequalities.json'
NEG=-math.inf;POS=math.inf


def one(items):
    assert len(items)==1,items
    return items[0]


def interval(r):return (NEG if r['lo'] is None else F(r['lo']),POS if r['hi'] is None else F(r['hi']),r['lc'],r['hc'])
def contains(r,x):return (x>r[0] or x==r[0] and r[2]) and (x<r[1] or x==r[1] and r[3])


def intersect(rows):
    lo=max(r[0] for r in rows);hi=min(r[1] for r in rows)
    lc=math.isfinite(lo) and all(contains(r,lo) for r in rows)
    hc=math.isfinite(hi) and all(contains(r,hi) for r in rows)
    return [] if lo>hi or lo==hi and not(lc and hc) else [(lo,hi,lc,hc)]


def union(rows):
    out=[]
    for r in sorted(rows,key=lambda r:(r[0],not r[2])):
        if not out or out[-1][1]<r[0] or out[-1][1]==r[0] and not(out[-1][3] or r[2]):out.append(r);continue
        a=out[-1];hi=max(a[1],r[1]);out[-1]=(a[0],hi,a[2] or a[0]==r[0] and r[2],(a[3] if a[1]>r[1] else r[3] if r[1]>a[1] else a[3] or r[3]))
    return out


def fmt(n):
    if n==NEG:return '-∞'
    if n==POS:return '+∞'
    assert F(n).denominator==1
    return str(int(n))


def notation(rows):
    return ' ∪ '.join(('{'+fmt(lo)+'}') if lo==hi else ('[' if lc else '(')+fmt(lo)+'; '+fmt(hi)+(']' if hc else ')') for lo,hi,lc,hc in rows) if rows else '∅'


def parse_interval(s):
    if s=='∅':return []
    rows=[]
    for part in s.split(' ∪ '):
        m=re.fullmatch(r'([\[(])(-?\d+|-∞); ([+]?∞|-?\d+)([\])])',part);assert m,s
        a,lo,hi,b=m.groups();rows.append((NEG if lo=='-∞' else F(lo),POS if hi in ('∞','+∞') else F(hi),a=='[',b==']'))
    return union(rows)


def integer_count(rows):
    total=0
    for lo,hi,lc,hc in rows:
        assert math.isfinite(lo) and math.isfinite(hi)
        a=math.ceil(lo)+(not lc and F(lo).denominator==1);b=math.floor(hi)-(not hc and F(hi).denominator==1)
        total+=max(0,b-a+1)
    return total


def linear_expr(s,var='x'):
    s=s.replace(' ','').replace('−','-')
    m=re.fullmatch(r'([+-]?\d*)'+re.escape(var)+r'([+-]\d+)?',s);assert m,s
    a,b=m.groups();return F(-1 if a=='-' else 1 if a in ('','+') else int(a)),F(b or 0)


def linear_set(s):
    m=re.fullmatch(r'(.+?)\s*([<>≤≥])\s*(-?\d+)',s);assert m,s
    lhs,op,rhs=m.groups();a,b=linear_expr(lhs);assert a
    bound=(F(rhs)-b)/a
    if a<0:op={'<':'>','>':'<','≤':'≥','≥':'≤'}[op]
    return [(NEG,bound,False,op=='≤')] if op in ('<','≤') else [(bound,POS,op=='≥',False)]


def absolute_set(s):
    m=re.fullmatch(r'\|x(?: ([+-]) (\d+))?\| ([<>≤≥]) (\d+)',s);assert m,s
    sign,shift,op,radius=m.groups();center=F(0) if shift is None else F(shift)*(-1 if sign=='+' else 1);radius=F(radius)
    closed=op in ('≤','≥')
    return [(center-radius,center+radius,closed,closed)] if op in ('<','≤') else [(NEG,center-radius,False,closed),(center+radius,POS,closed,False)]


def answer(q):
    p=q['params'];kind=q['modelId'].removeprefix('visual-wave7-');v={r['label']:F(r['value']) for r in p.get('points',[])}
    ranges=[interval(r) for r in p.get('ranges',[])];options=q.get('options',[])
    if kind=='grid-area-difference':
        a,b=p['shapes'];assert b['rows']==b['cols'] and a['cols']>b['cols']
        assert b['rows']*b['cols']>a['rows']*a['cols'];return str(b['rows']*b['cols']-a['rows']*a['cols'])
    if kind=='numeric-order':
        a,b=v[p['first']],v[p['second']];assert a<b<0;return fmt(a)+' < '+fmt(b)
    if kind=='strict-integer-count':return str(math.ceil(v[p['second']])-math.floor(v[p['first']])-1)
    if kind=='possible-mass':return str(one([n for n in p['massCandidates'] if F(str(n))>sum(p['weights'])])).replace('.',',')+' кг'
    if kind=='negative-scale-order':
        matches=[]
        for o in options:
            lhs,op,rhs=re.fullmatch(r'(.+?) ([<>]) (.+)',o).groups();a,b=linear_expr(lhs,p['first']);c,d=linear_expr(rhs,p['second'])
            assert a==c and b==d
            # lhs-rhs=a*(u-v); u-v<0 for every ordered pair, not samples.
            if op==('>' if a<0 else '<'):matches.append(o)
        return one(matches)
    if kind=='translated-order':
        a,b=v[p['first']],v[p['second']];delta=p['translation'];assert delta<0 and a<b
        assert v[p['shiftedFirst']]-a==v[p['shiftedSecond']]-b==delta
        return fmt(a)+' − '+str(-delta)+' < '+fmt(b)+' − '+str(-delta)
    if kind=='sum-left-sides':
        assert all(F(n,2)>r for n,r in zip(p['leftHalfUnits'],p['right']))
        return fmt(sum(F(n,2) for n in p['leftHalfUnits']))
    if kind=='transitive-order':
        assert v[p['upper']]>v[p['middle']]>v[p['lower']]
        return p['upper']+' > '+p['lower']
    if kind=='interval-integer-count':return str(integer_count(union(ranges)))
    if kind=='ray-inequality':return one([o for o in options if linear_set(o)==union(ranges)])
    if kind=='marked-members-count':return str(sum(any(contains(r,n) for r in ranges) for n in v.values()))
    if kind=='interval-notation':return one([o for o in options if parse_interval(o)==union(ranges)])
    if kind=='disjoint-statement':
        assert not intersect(ranges) and len(union(ranges))==2
        return ' ∩ '.join(p['names'])+' = ∅'
    if kind in ('intersection-notation','system-interval'):return one([o for o in options if parse_interval(o)==intersect(ranges)])
    if kind=='union-notation':return one([o for o in options if parse_interval(o)==union(ranges)])
    if kind=='intersection-length':
        lo,hi,lc,hc=one(intersect(ranges));assert lc and hc;return fmt(hi-lo)
    if kind=='linear-inequality-choice':return one([o for o in options if linear_set(o)==union(ranges)])
    if kind=='linear-parameter':
        a=int(re.search(r'(-?\d+)x ≤ b',q['statement'])[1]);assert a>0
        lo,hi,lc,hc=one(ranges);assert lo==NEG and hc;return fmt(a*hi)
    if kind=='system-integer-count':return str(integer_count(intersect(ranges)))
    if kind=='system-choice':return one([o for o in options if intersect([one(linear_set(s)) for s in o.split(' және ')])==union(ranges)])
    if kind in ('absolute-outside','absolute-inside'):return one([o for o in options if absolute_set(o)==union(ranges)])
    if kind=='absolute-parameter':
        lo,hi,lc,hc=one(ranges);assert hi>0 and lo==-hi and lc and hc;return fmt(hi)
    raise ValueError(kind)


def svg_audit(q):
    p=q['params'];raw=(ROOT/'frontend/public'/q['image'].lstrip('/')).read_bytes()
    digest=hashlib.sha256(raw).hexdigest();assert digest==q['figureSha256']
    nodes=list(ET.fromstring(raw).iter());texts=[n for n in nodes if n.tag.endswith('text')]
    assert not any(n.tag.rsplit('}',1)[-1] in ('image','script','foreignObject') for n in nodes)
    def close(a,b):assert abs(float(a)-float(b))<.03,(a,b)
    scene=p['scene']
    if scene in ('axis','interval'):
        labels=[n for n in texts if n.attrib.get('font-size')=='20' and re.fullmatch(r'-?\d+',n.text or '')]
        values={F(n.text):float(n.attrib['x']) for n in labels}
        if len(values)>=2:
            a,b=min(values),max(values)
            def at(v):return values[a]+float(F(v)-a)*(values[b]-values[a])/float(b-a)
            for n in labels:close(n.attrib['x'],at(F(n.text)))
        else:at=None
        dots={n.attrib['data-point']:n for n in nodes if 'data-point' in n.attrib}
        if p.get('points'):
            assert set(dots)=={r['label'] for r in p['points']}
            if at:
                for r in p['points']:close(dots[r['label']].attrib['cx'],at(r['value']))
            else:
                assert [r['label'] for r in sorted(p['points'],key=lambda r:r['value'])]==[label for label,n in sorted(dots.items(),key=lambda item:float(item[1].attrib['cx']))]
        for i,r in enumerate(p.get('ranges',[])):
            segment=one([n for n in nodes if n.attrib.get('data-interval')==str(i)])
            y=float(segment.attrib['y1']);close(segment.attrib['y2'],y)
            for name,closed in [('lo','lc'),('hi','hc')]:
                endpoint=r[name]
                if endpoint is None:
                    triangles=[]
                    for n in nodes:
                        if not n.tag.endswith('path'):continue
                        match=re.fullmatch(r'M([\d.]+),([\d.]+) L([\d.]+),([\d.]+) L([\d.]+),([\d.]+) Z',n.attrib['d'])
                        if match:
                            tx,ty,x1,y1,x2,y2=map(float,match.groups())
                            if abs(ty-y)<.01 and (tx<x1 and name=='lo' or tx>x1 and name=='hi'):triangles.append(n)
                    assert triangles,'The unbounded side needs an actual outward arrowhead'
                else:
                    dot=one([n for n in nodes if n.attrib.get('data-endpoint')==str(endpoint) and abs(float(n.attrib['cy'])-y)<.01])
                    assert (dot.attrib['fill']!='white')==r[closed]
                    close(segment.attrib['x1' if name=='lo' else 'x2'],dot.attrib['cx'])
                    label=one([n for n in texts if n.text==str(endpoint) and abs(float(n.attrib['y'])-y-27)<.01])
                    close(label.attrib['x'],dot.attrib['cx'])
                    if at:close(dot.attrib['cx'],at(endpoint))
        if p.get('translation'):
            paths=[n for n in nodes if 'data-from' in n.attrib];assert len(paths)==2
            for n in paths:
                match=re.fullmatch(r'M(-?[\d.]+),(-?[\d.]+) Q(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)',n.attrib['d']);assert match
                x0,y0,xc,yc,x1,y1=map(float,match.groups());close(x0,at(int(n.attrib['data-from'])));close(x1,at(int(n.attrib['data-to'])))
                assert n.attrib['marker-end']=='url(#tip)' and x1<x0 and y0==y1 and yc<y0
                assert int(n.attrib['data-to'])-int(n.attrib['data-from'])==p['translation']
    elif scene=='grid-pair':
        cells=[n for n in nodes if 'data-cell' in n.attrib]
        for shape in p['shapes']:
            group=[n for n in cells if n.attrib['data-cell'].startswith(shape['label']+':')]
            assert len(group)==shape['rows']*shape['cols']
            assert len({n.attrib['x'] for n in group})==shape['cols'] and len({n.attrib['y'] for n in group})==shape['rows']
        assert len({n.attrib['width'] for n in cells})==len({n.attrib['height'] for n in cells})==1
    elif scene=='balance':
        beam=one([n for n in nodes if n.tag.endswith('line') and n.attrib.get('stroke-width')=='8'])
        assert float(beam.attrib['x1'])<float(beam.attrib['x2']) and float(beam.attrib['y1'])>float(beam.attrib['y2'])
        assert [int(n.text) for n in texts if n.attrib.get('font-size')=='21']==p['weights']
        assert any(n.text=='x кг' for n in texts)
    elif scene=='sum':
        left=[F(n.text.replace(',','.')) for n in texts if float(n.attrib['x'])==155 and n.text!='?']
        right=[F(n.text.replace(',','.')) for n in texts if float(n.attrib['x'])==335]
        assert left==[F(n,2) for n in p['leftHalfUnits']] and right==[F(n) for n in p['right']]+[F(sum(p['right']))]
        assert any(n.text=='?' and float(n.attrib['x'])==155 for n in texts)
    return digest


def check(write=False):
    # Endpoint-only contact is neither an open overlap nor a discarded singleton.
    assert intersect([(F(0),F(1),True,True),(F(1),F(2),True,True)])==[(F(1),F(1),True,True)]
    assert not intersect([(F(0),F(1),True,False),(F(1),F(2),True,True)])
    assert len(union([(F(0),F(1),False,False),(F(1),F(2),False,False)]))==2
    rows=json.loads((ROOT/FILE).read_text())['editions'];assert len(rows)==24
    entries=[]
    for q in rows:
        expected=answer(q);assert q['answer']==expected,(q['editionId'],expected)
        if q.get('options'):assert q['options'].count(expected)==1 and len(set(q['options']))==4
        else:assert q['statement'].endswith('Жауапқа тек санды жазыңыз.') and expected.isdigit()
        digest=svg_audit(q)
        entries.append({'editionId':q['editionId'],'sha256':hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
            'verdict':'verified','reviewer':'independent_root_agent','method':'independent_exact_bound_algebra_with_actual_linear_absolute_MCQ_parsing_and_svg_measurement',
            'expectedAnswer':expected,'checks':['all24 full original/new conditions, solutions and choices read',
                'intersection/union derived by exact extremal bounds rather than author membership-atoms',
                'written linear/absolute/system choices parsed and compared as complete sets, including endpoints',
                'negative multiplier reversal proved by sign of a(u-v), independently of sample coordinates',
                'translated inequalities retain both actual shifts, not merely arithmetic truth',
                'integer counts, lengths, mass strictness and area comparisons are different requested quantities'],
            'figureReview':{'status':'verified','sha256':digest,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,
                'checked':['all four native contact sheets inspected at343px',
                    'actual endpoint fills/positions, printed labels and outward ray arrowheads checked',
                    'point and interval rows use the same calibrated scale',
                    'left pan is lower and all right-side weights are included',
                    'grid cell dimensions and translated arrow endpoints match givens']}})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':24,'entries':entries}
    if write:(ROOT/'problems/editorial/reviews/visual-wave7-inequalities.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__=='__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
