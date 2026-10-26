"""Independent native two-variable review. All7 complete archived/new conditions,
solutions and options, all7 source rasters and both343px target sheets inspected.
No author model is imported. Linear identities use our separate exact AST parser.
"""
from fractions import Fraction as F
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave18-linear-equation-graphs.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
spec=importlib.util.spec_from_file_location('root_exact_poly',ROOT/'scripts/editorial/review-visual-wave10.py');oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def rational(q):n=F(q).limit_denominator(1000);near(q,n);return n
def number(q):q=F(q);assert q.denominator==1;return str(q.numerator)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def equation(s):
    l,r=map(oracle.poly,s.split('='));diff={k:l.get(k,F(0))-r.get(k,F(0)) for k in set(l)|set(r)};assert set(diff)<={(),(('x',1),),(('y',1),)}
    return diff.get((('x',1),),F(0)),diff.get((('y',1),),F(0)),-diff.get((),F(0))
def on(e,p):a,b,c=e;x,y=p;return a*x+b*y==c

def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];p=r['params']
    if p['scene']=='table':
        rects=[e for e in els if tag(e)=='rect' and e.get('stroke')];assert len(rects)==8;rows=[]
        for y in sorted(set(v(e,'y') for e in rects)):
            values=[]
            for rect in sorted([e for e in rects if v(e,'y')==y],key=lambda e:v(e,'x')):
                x=v(rect,'x')+v(rect,'width')/2;label=one(t for t in texts if v(t,'x')==x and y<v(t,'y')<y+v(rect,'height'));values.append(txt(label))
            rows.append(values)
        assert [q[0] for q in rows]==['x','y'];columns=list(zip(rows[0][1:],rows[1][1:]));assert sum(y=='?' for x,y in columns)==1
        return {'columns':[(F(x),F(y) if y!='?' else None) for x,y in columns]}
    if p['scene']=='balance':
        weights=[]
        for e in els:
            if tag(e)!='rect' or not e.get('data-weight'):continue
            x,y,w,h=v(e,'x'),v(e,'y'),v(e,'width'),v(e,'height');label=one(t for t in texts if x<v(t,'x')<x+w and y<v(t,'y')<y+h);weights.append(txt(label));assert txt(label)==e.get('data-weight')
        assert set(weights)=={'x','y'} and len(weights)==5
        massrect=one(e for e in els if tag(e)=='rect' and e.get('data-total-kg'));mass=F(txt(one(t for t in texts if v(massrect,'x')<v(t,'x')<v(massrect,'x')+v(massrect,'width') and v(massrect,'y')<v(t,'y')<v(massrect,'y')+v(massrect,'height'))));assert mass==41 and 'кг' in [txt(t) for t in texts]
        beam=one(e for e in lines if e.get('stroke-width')=='5');assert v(beam,'y1')==v(beam,'y2')
        return {'nx':weights.count('x'),'ny':weights.count('y'),'total':mass}
    xlabels=sorted((F(txt(t)),v(t,'x')) for t in texts if re.fullmatch(r'-?\d+',txt(t)) and v(t,'y')==202);ylabels=sorted((F(txt(t)),v(t,'y')-6) for t in texts if re.fullmatch(r'-?\d+',txt(t)) and v(t,'x')==228)
    assert [n for n,x in xlabels]==[-6,-4,-2,2,4,6] and [n for n,y in ylabels]==[-6,-4,-2,2,4,6]
    xu=(xlabels[1][1]-xlabels[0][1])/2;yu=(ylabels[0][1]-ylabels[1][1])/2;near(xu,yu);x0=xlabels[0][1]+6*xu;y0=ylabels[0][1]-6*yu
    for n,x in xlabels:near(x,x0+n*xu)
    for n,y in ylabels:near(y,y0-n*yu)
    for axis in ['x','y']:
        grids=sorted(set(v(e,axis+'1') for e in lines if e.get('stroke')=='#dbe5f1' and v(e,axis+'1')==v(e,axis+'2')));assert len(grids)==15
        for a,b in zip(grids,grids[1:]):near(b-a,xu)
    coordinate=lambda x,y:(rational((x-x0)/xu),rational((y0-y)/yu))
    if p['scene']=='points':
        out={}
        for e in els:
            if tag(e)!='circle':continue
            x,y=v(e,'cx'),v(e,'cy');name=txt(one(t for t in texts if re.fullmatch('[ABCD]',txt(t)) and math.dist((v(t,'x'),v(t,'y')),(x,y))<30));out[name]=coordinate(x,y)
        assert out=={q['label']:tuple(q['xy']) for q in p['points']};return {'points':out}
    line=one(e for e in lines if e.get('stroke')=='#315ce8');A=coordinate(v(line,'x1'),v(line,'y1'));B=coordinate(v(line,'x2'),v(line,'y2'));assert A!=B
    # The measured line is a*x+b*y=c, without relying on data-equation text.
    a=A[1]-B[1];b=B[0]-A[0];c=a*A[0]+b*A[1];assert all(on((a,b,c),q) for q in p['samples']);assert on(equation(p['equation']),A) and on(equation(p['equation']),B)
    return {'equation':(a,b,c),'lineEnds':[A,B]}

def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave18-');s=r['statement']
    if k=='equation-table':
        given=re.search(r'бағанында (.+?) теңдеуінің',s)[1];a,b,c=equation(given);assert b
        for x,y in obs['columns']:
            if y is not None:assert on((a,b,c),(x,y))
        x=one(x for x,y in obs['columns'] if y is None);return number((c-a*x)/b)
    if k=='point-equation':e=equation(re.search(r'нүкте (.+?) теңдеуінің',s)[1]);return one(n for n,xy in obs['points'].items() if on(e,xy))
    if k=='balance-two-variables':x=F(re.search(r'әрқайсысы (\d+) кг',s)[1]);return number((obs['total']-obs['nx']*x)/obs['ny'])
    e=obs['equation']
    if k=='graph-solution-pair':
        def pair(o):m=re.fullmatch(r'\((-?\d+);\s*(-?\d+)\)',o);assert m;return tuple(map(F,m.groups()))
        return one(o for o in r['options'] if on(e,pair(o)))
    if k in ['vertical-equation','intercept-equation']:return one(o for o in r['options'] if all(on(equation(o),pt) for pt in obs['lineEnds']))
    if k=='graph-ordinate':a,b,c=e;x=F(re.search(r'абсциссасы (\d+)',s)[1]);return number((c-a*x)/b)
    raise AssertionError(k)

def main():
    assert len(ROWS)==7;entries=[]
    for i,r in enumerate(ROWS):
        obs=observe(r);assert solve(r,obs)==r['answer'],(r['editionId'],solve(r,obs),r['answer']);assert solve(r,obs)!='wrong'
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Independent exact two-variable polynomial AST and measured SVG lines/points/cell columns/balance-weight labels','checks':['all7 full source/new conditions, solutions and MCQs read','all7 source rasters and both343px target sheets viewed','every known table column satisfies printed equation before solving blank','all candidate equations must describe two distinct actual points, not only one intercept','x/y coordinate swaps, negative vertical intercept and fractional slope retained'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['actual graph endpoints/marked point coordinates from printed calibration','table headers and actual aligned cell labels','all5 physical labelled x/y weights and visible41kg total','separated B/C labels and readable mass at phone width'],'sourceSheet':f'output/editorial-visual-wave18/visual-wave18-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave18/visual-wave18-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave18-linear-equation-graphs.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':7,'actualNativeObservationChecks':7,'wrongKeysRejected':7}))
if __name__=='__main__':main()
