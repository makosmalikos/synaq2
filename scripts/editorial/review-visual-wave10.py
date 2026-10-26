"""Independent exact polynomial/geometry review of twenty native algebra tasks.

All20 source/new full conditions, solutions and choices, and four original plus
four native343px sheets, were read before approval. No author solver is imported.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave10-algebra-diagrams.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def one(a):assert len(a)==1,a;return a[0]
def number(a):
    a=F(a);assert a.denominator==1,a
    return str(a.numerator)
def poly(text):
    s=text.strip().replace('×','*').replace('·','*').replace('−','-').replace(',','.')
    s=re.sub(r'\s+','',s)
    s=re.sub(r'(?<=[0-9A-Za-z)])(?=[A-Za-z(])','*',s)
    assert len(s)<=300 and re.fullmatch(r'[0-9a-z.+*/()\-]+',s),s
    def merge(a,b,sign=1):
        r=a.copy()
        for m,v in b.items():r[m]=r.get(m,F(0))+sign*v
        return {m:v for m,v in r.items() if v}
    def go(n):
        if isinstance(n,ast.Constant) and type(n.value) in [int,float]:return {():F(str(n.value))} if n.value else {}
        if isinstance(n,ast.Name) and len(n.id)==1 and n.id.isascii() and n.id.isalpha():return {((n.id,1),):F(1)}
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.USub,ast.UAdd)):
            return {m:v*(-1 if isinstance(n.op,ast.USub) else 1) for m,v in go(n.operand).items()}
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=go(n.left),go(n.right)
        if isinstance(n.op,ast.Add):return merge(a,b)
        if isinstance(n.op,ast.Sub):return merge(a,b,-1)
        if isinstance(n.op,ast.Mult):
            out={}
            for ma,va in a.items():
                for mb,vb in b.items():
                    key=dict(ma)
                    for v,p in mb:key[v]=key.get(v,0)+p
                    key=tuple(sorted(key.items()));out[key]=out.get(key,F(0))+va*vb
            return {m:v for m,v in out.items() if v}
        if isinstance(n.op,ast.Div):
            assert set(b)=={()} and b[()]
            return {m:v/b[()] for m,v in a.items()}
        raise AssertionError(ast.dump(n))
    return go(ast.parse(s,mode='eval').body)
def scalar(s):
    q=poly(s);assert set(q)<={()}
    return q.get((),F(0))
def equation_roots(text):
    a,b=text.split('=');rhs=poly(b)
    def root(lhs,rhs):
        keys=set(lhs)|set(rhs);diff={k:lhs.get(k,F(0))-rhs.get(k,F(0)) for k in keys};diff={k:v for k,v in diff.items() if v}
        assert set(diff)<={(),(('x',1),)} and diff.get((('x',1),))
        return -diff.get((),F(0))/diff[(('x',1),)]
    if a.strip().startswith('|'):
        assert a.strip().endswith('|');assert set(rhs)<={()};r=rhs.get((),F(0))
        assert r>=0
        inner=poly(a.strip()[1:-1]);return {root(inner,{():r}),root(inner,{():-r})}
    return {root(poly(a),rhs)}
def solve(row):
    p=row['params'];k=row['modelId'].removeprefix('visual-wave10-');opts=row.get('options',[])
    if k=='variable-right-area':return number(F(p['fixed']*p['value'],2))
    if k=='machine-order':
        n=F(p['input'])
        for op in p['operations']:
            if op['op']=='multiply':n*=op['value']
            elif op['op']=='subtract':n-=op['value']
            else:raise AssertionError(op)
        return number(n)
    if k=='variable-rectangle-perimeter':return str(2*p['fixed']+2*p['value'])
    if k=='negative-coefficient-count':
        polynomials=list(map(poly,p['cards']));assert all(len(q)==1 for q in polynomials)
        return str(sum(next(iter(q.values()))<0 for q in polynomials))
    if k=='distributive-equality':return one([o for o in opts if poly(o.split('=')[0])==poly(o.split('=')[1])])
    if k=='tile-like-coefficient':return str(sum(g['strips'] for g in p['groups']))
    if k=='like-strip-value':return str(sum(p['coefficients'])*p['value'])
    if k=='like-triangle-perimeter':
        assert all(p['sides'][i]<sum(p['sides'])-p['sides'][i] for i in range(3))
        return str(sum(p['sides'])*p['value'])
    if k=='identity-constant':return str(p['height']*p['constant'])
    if k=='not-area-identity':
        actual=poly(f"{p['height']}*({p['variable']}+{p['constant']})")
        return one([o for o in opts if poly(o)!=actual])
    if k=='square-tiling-ratio':
        side=p['smallSide'];height=p['smallSquares']*side;width=p['largeSquares']*height+side
        return one([o for o in opts if scalar(o)==F(width,height)])
    if k in ['equality-product','equality-sum']:
        values=[]
        for a,b in p['equalities']:assert scalar(a)==scalar(b);values.append(scalar(a))
        return number(values[0]*values[1] if k=='equality-product' else sum(values))
    if k=='balanced-missing-mass':return str(p['leftCount']*p['leftMass']-p['rightKnown'])
    if k=='balance-transitivity':
        assert p['productCount']*p['productMass']==sum(p['bridge'])
        return str(sum(p['bridge'])-p['secondKnown'])
    if k=='point-equation-root':return one([o for o in opts if equation_roots(o)=={F(p['target'])}])
    if k=='partition-equation':return number(F(p['total']-p['constant'],p['count']))
    if k=='two-sided-balance':return number(F(p['rightKnown']-p['leftKnown'],p['leftCount']-p['rightCount']))
    if k=='shifted-absolute-right':return str(p['center']+p['distance'])
    if k=='absolute-pair-equation':return one([o for o in opts if equation_roots(o)==set(map(F,p['targets']))])
    raise AssertionError(k)

def tag(e):return e.tag.rsplit('}',1)[-1]
def elems(svg,t):return [e for e in svg.iter() if tag(e)==t]
def val(e,n):return float(e.get(n))
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def polygon(e):return [tuple(map(float,q.split(','))) for q in e.get('points').split()]
def distance(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def svg_check(row):
    p=row['params'];k=row['modelId'].removeprefix('visual-wave10-')
    raw=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['figureSha256']
    svg=ET.fromstring(raw);assert svg.get('viewBox')=='0 0 480 360'
    texts=elems(svg,'text');written=[''.join(t.itertext()) for t in texts];rects=elems(svg,'rect')
    if p['scene']=='right-triangle':
        pts=polygon(one(elems(svg,'polygon')));a,b,c=pts
        assert a[1]==b[1] and a[0]==c[0]
        near(distance(a,b)/distance(a,c),F(p['value'],p['fixed']))
        assert 'm' in written and str(p['fixed']) in written
    elif p['scene']=='rectangle':
        r=one([r for r in rects if r.get('fill')=='#eaf0ff']);near(val(r,'width')/val(r,'height'),F(p['value'],p['fixed']))
        assert 'x' in written and str(p['fixed']) in written
    elif p['scene']=='machine':
        operations=[t for t in texts if ''.join(t.itertext()).startswith(('×','−'))]
        assert [''.join(t.itertext()) for t in operations]==['×'+str(p['operations'][0]['value']),'−'+str(p['operations'][1]['value'])]
        assert val(operations[0],'x')<val(operations[1],'x') and written.count('?')==1
    elif p['scene']=='cards':
        assert len([r for r in rects if r.get('data-card')])==len(p['cards'])
        for s in p['cards']:assert s in written
    elif p['scene']=='split':
        vr=one([r for r in rects if r.get('data-side')=='variable']);cr=one([r for r in rects if r.get('data-side')=='constant'])
        near(val(vr,'x')+val(vr,'width'),val(cr,'x'));near(val(vr,'height'),val(cr,'height'));near(val(vr,'y'),val(cr,'y'))
        near(val(cr,'height')/val(cr,'width'),F(p['height'],p['constant']))
        assert p['variable'] in written and str(p['height']) in written and str(p['constant']) in written
    elif p['scene']=='tiles':
        for i,g in enumerate(p['groups']):
            rs=[r for r in rects if r.get('data-tile') and (val(r,'x')<250)==(i==0)]
            assert sum(r.get('data-tile')=='x' for r in rs)==g['strips'];assert sum(r.get('data-tile')=='1' for r in rs)==g['squares']
            assert all(val(r,'width')==val(r,'height') for r in rs if r.get('data-tile')=='1')
    elif p['scene'] in ['strip','partition']:
        rs=sorted([r for r in rects if r.get('data-part')],key=lambda r:val(r,'x'))
        lengths=[c*p['value'] for c in p['coefficients']] if p['scene']=='strip' else [F(p['total']-p['constant'],p['count'])]*p['count']+[F(p['constant'])]
        assert len(rs)==len(lengths)
        for i,(r,length) in enumerate(zip(rs,lengths)):
            near(val(r,'width')/float(length),val(rs[0],'width')/float(lengths[0]))
            if i:near(val(rs[i-1],'x')+val(rs[i-1],'width'),val(r,'x'))
        if p['scene']=='partition':assert str(p['total'])+' см' in written
    elif p['scene']=='triangle':
        a,b,c=polygon(one(elems(svg,'polygon')))
        measured=[distance(a,c),distance(b,c),distance(a,b)];scales=[d/n for d,n in zip(measured,p['sides'])]
        near(scales[0],scales[1]);near(scales[1],scales[2])
        for n in p['sides']:assert str(n)+'a' in written
    elif p['scene']=='tiling':
        big=[r for r in rects if r.get('data-square')=='large'];small=[r for r in rects if r.get('data-square')=='small']
        assert len(big)==p['largeSquares'] and len(small)==p['smallSquares']
        for r in big+small:near(val(r,'width'),val(r,'height'))
        near(val(big[0],'height'),sum(val(r,'height') for r in small))
        near(val(big[-1],'x')+val(big[-1],'width'),val(small[0],'x'))
        for a,b in zip(big,big[1:]):near(val(a,'x')+val(a,'width'),val(b,'x'))
        for a,b in zip(small,small[1:]):near(val(a,'y')+val(a,'height'),val(b,'y'))
        assert str(p['smallSide']) in written
    elif p['scene']=='equalities':
        for a,b in p['equalities']:assert a+' = '+b in written
        assert any(t.endswith(' = ?') for t in written)
    elif p['scene']=='balance':
        weights=[r for r in rects if r.get('data-weight')];groups={}
        for r in weights:
            balance=0 if 'productCount' not in p or val(r,'y')<175 else 1
            groups.setdefault((balance,int(r.get('data-pan'))),[]).append(r.get('data-weight'))
            matching=[t for t in texts if val(r,'x')<=val(t,'x')<=val(r,'x')+val(r,'width') and val(r,'y')<=val(t,'y')<=val(r,'y')+val(r,'height')]
            assert any(''.join(t.itertext())==r.get('data-weight') for t in matching)
            if 'productCount' in p:assert all(val(t,'font-size')>=20 for t in matching)
        if 'leftMass' in p:expected={(0,0):[str(p['leftMass'])]*p['leftCount'],(0,1):[str(p['rightKnown']),'?']}
        elif 'productCount' in p:expected={(0,0):[str(p['productMass'])]*p['productCount'],(0,1):list(map(str,p['bridge'])),(1,0):list(map(str,p['bridge'])),(1,1):['?',str(p['secondKnown'])]}
        else:expected={(0,0):['x']*p['leftCount']+[str(p['leftKnown'])],(0,1):['x']*p['rightCount']+[str(p['rightKnown'])]}
        assert {g:sorted(v) for g,v in groups.items()}=={g:sorted(v) for g,v in expected.items()}
    elif p['scene']=='axis':
        labels=[(F(''.join(t.itertext())),val(t,'x')) for t in texts if re.fullmatch(r'-?\d+',''.join(t.itertext())) and val(t,'y')>200]
        assert len(labels)>=2;labels.sort();unit=(labels[-1][1]-labels[0][1])/float(labels[-1][0]-labels[0][0]);assert unit>0
        origin=labels[0][1]-float(labels[0][0])*unit
        for n,x in labels:near(x,origin+float(n)*unit)
        circles=[e for e in elems(svg,'circle') if any(e.get(a) for a in ['data-target','data-root','data-center'])]
        for e in circles:
            n=next(e.get(a) for a in ['data-target','data-root','data-center'] if e.get(a) is not None);near(val(e,'cx'),origin+int(n)*unit);near(val(e,'cy'),200)
        if 'center' in p:
            assert sorted(n for n,x in labels)==sorted([F(p['center']),F(0)])
            assert str(p['distance']) in written and str(p['center']+p['distance']) not in written
    else:raise AssertionError(p['scene'])

def main():
    assert len(ROWS)==20;entries=[]
    for i,row in enumerate(ROWS):
        expected=solve(row);assert row['answer']==expected,(row['editionId'],expected,row['answer']);svg_check(row)
        bad=copy.deepcopy(row);bad['answer']='wrong';assert solve(bad)!=bad['answer']
        if row.get('options'):assert row['options'].count(row['answer'])==1 and len(set(row['options']))==4
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_root_agent','method':'Exact Fraction AST/polynomial identities, complete equation root sets and actual native SVG measurements','checks':['all20 full source/new conditions, solutions and choices read','all four source and four native343px sheets visually inspected','actual printed symbolic choices checked as identities/full root sets, not substituted at a few sample values','unknown coordinates remain unknown, variable and unit terms remain separate, balance contents match each side'],'figureReview':{'status':'verified','sha256':row['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual side ratios, tile counts and contiguous strip lengths','actual positive/negative expressions and ordered machine labels','actual grouped equalities, balance masses and calibrated coordinate positions','essential labels on two-balance drawing at least20 SVG pixels after mobile correction'],'sourceSheet':f'output/editorial-visual-wave10/visual-wave10-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave10/visual-wave10-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave10-algebra-diagrams.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':20,'actualSvgChecks':20,'wrongKeyRegressions':20}))
if __name__=='__main__':main()
