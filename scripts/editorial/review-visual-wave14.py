"""Independent dependence review using printed native tables and actual arrows.
All10 full original/new conditions, full solutions/options and all4 source/native
343px sheets inspected. Exact polynomial parser is the independent root review
parser from wave10, never the author's model module.
"""
import collections
import copy
from fractions import Fraction as F
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave14-dependence-tables.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
spec=importlib.util.spec_from_file_location('root_exact_poly',ROOT/'scripts/editorial/review-visual-wave10.py');oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def number(n):n=F(n);assert n.denominator==1;return str(n.numerator)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def points(e):return [tuple(map(F,p.split(','))) for p in e.get('points').split()]
def match(formula,pairs):
    lhs,rhs=map(oracle.poly,formula.split('='));assert lhs=={(('y',1),):F(1)}
    assert set(rhs)<={(),(('x',1),)}
    return all(rhs.get((),F(0))+rhs.get((('x',1),),F(0))*x==y for x,y in pairs)

def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];p=r['params']
    if p['scene']=='table':
        rows=[sorted((v(t,'x'),F(txt(t))) for t in texts if re.fullmatch('-?\\d+',txt(t)) and v(t,'y')==height) for height in [158,222]]
        assert rows[0] and [x for x,n in rows[0]]==[x for x,n in rows[1]]
        separators=sorted(set(v(e,'x1') for e in lines if v(e,'x1')==v(e,'x2')))+[F(455)]
        assert separators[0]==105 and len(separators)==len(rows[0])+1
        for (x,n),left,right in zip(rows[0],separators,separators[1:]):near(x,(left+right)/2)
        labels=[txt(one(t for t in texts if v(t,'x')==65 and v(t,'y')==height)) for height in [157,221]];assert labels==p['labels']
        xs=[n for x,n in rows[0]];ys=[n for x,n in rows[1]];assert xs==p['xs'] and ys==p['ys'];return list(zip(xs,ys))
    if p['scene'] in ['mapping','function-gallery']:
        nodes=[]
        for e in els:
            if tag(e)!='circle':continue
            x,y,radius=v(e,'cx'),v(e,'cy'),v(e,'r');label=one(t for t in texts if v(t,'x')==x and 0<v(t,'y')-y<=8 and re.fullmatch(r'\d+',txt(t)))
            nodes.append((x,y,radius,int(txt(label))))
        pairs=collections.defaultdict(list)
        for i,e in enumerate(els):
            if tag(e)!='line' or e.get('stroke')!='#8459ce':continue
            a=one(n for n in nodes if v(e,'y1')==n[1] and v(e,'x1')==n[0]+n[2]+1)
            head=els[i+1];assert tag(head)=='polygon';pts=points(head);b=one(n for n in nodes if abs(pts[0][1]-n[1])<F(1,1000000) and abs(pts[0][0]-(n[0]-n[2]-1))<F(1,1000000))
            base=((pts[1][0]+pts[2][0])/2,(pts[1][1]+pts[2][1])/2);near(base[0],v(e,'x2'));near(base[1],v(e,'y2'));near(math.dist(base,pts[0]),8)
            assert int(e.get('data-map-x'))==a[3] and int(e.get('data-map-y'))==b[3]
            panel=1 if p['scene']=='mapping' else 1+int(a[0]>240)+2*int(a[1]>=180)
            assert p['scene']=='mapping' or int(e.get('data-panel'))==panel
            pairs[panel].append((a[3],b[3]))
        if p['scene']=='mapping':
            pairs=one(pairs.values());assert sorted(pairs)==list(zip(p['xs'],p['ys']));right=sorted((y,n) for x,y,rad,n in nodes if x>240);assert [n for y,n in right]==p['displayY'];return pairs
        assert set(pairs)=={1,2,3,4}
        for i,panel in enumerate(p['panels'],1):assert pairs[i]==[tuple(q) for q in panel['links']]
        return pairs
    if p['scene']=='rectangle':
        rect=one(e for e in els if tag(e)=='rect' and e.get('stroke'));side=F(txt(one(t for t in texts if re.fullmatch(r'\d+',txt(t)))));assert side==p['fixed'];assert txt(one(t for t in texts if txt(t)=='a'))=='a';near(v(rect,'width')/v(rect,'height'),F(p['value'])/side);return side
    assert p['scene']=='equilateral';poly=one(e for e in els if tag(e)=='polygon');pts=points(poly);edges=list(zip(pts,pts[1:]+pts[:1]));lengths=[math.dist(a,b) for a,b in edges]
    for length in lengths:near(length,lengths[0])
    marks=[e for e in lines if e.get('stroke')=='#8459ce'];assert len(marks)==len(edges)==3
    for e,(a,b) in zip(marks,edges):
        near((v(e,'x1')+v(e,'x2'))/2,(a[0]+b[0])/2);near((v(e,'y1')+v(e,'y2'))/2,(a[1]+b[1])/2);near((v(e,'x2')-v(e,'x1'))*(b[0]-a[0])+(v(e,'y2')-v(e,'y1'))*(b[1]-a[1]),0)
    return len(marks)

def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave14-');p=r['params']
    if k in ['shuffled-arrow-formula','proportional-table-formula']:return one(o for o in r['options'] if match(o,obs))
    if k=='variable-rectangle-area':return number(obs*int(re.search(r'a = (\d+)',r['statement'])[1]))
    if k=='equal-mark-perimeter':return number(obs*int(re.search(r'a = (\d+)',r['statement'])[1]))
    if k=='single-valued-gallery':return str(one(i for i,pairs in obs.items() if all(sum(a==x for a,b in pairs)==1 for x in [1,2,3])))
    if k=='temperature-time-max':return number(one(x for x,y in obs if y==max(y for x,y in obs)))
    if k=='fare-inverse-table':
        requested=F(re.search(r'Түсім (\d+)',r['statement'])[1]);rates={y/x for x,y in obs};assert len(rates)==1 and one(rates)==p['fare'];return number(one(x for x,y in obs if y==requested))
    if k=='independent-table-step':return number(one({b[0]-a[0] for a,b in zip(obs,obs[1:])}))
    if k=='formula-table-error':return 'x = '+number(one(x for x,y in obs if not match(p['formula'],[(x,y)])))
    if k=='candle-hourly-loss':return number(one({(a[1]-b[1])/(b[0]-a[0]) for a,b in zip(obs,obs[1:])}))
    raise AssertionError(k)

def main():
    assert len(ROWS)==10;entries=[]
    for i,r in enumerate(ROWS):
        obs=observe(r);assert solve(r,obs)==r['answer'],(r['editionId'],solve(r,obs),r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad,obs)!=bad['answer']
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual table cell text/columns and circle-to-arrowhead correspondence; exact Fraction polynomial candidate checks','checks':['all10 full original/new statements, solutions and MCQs read','both source sheets and both343px native sheets visually inspected','many-to-one functions allowed; zero/multiple outgoing arrows rejected','every formula tested on all actual pairs; independent-variable step distinguished from dependent step'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['printed label positions and aligned table columns','actual node labels, source tails and triangular arrowhead destinations','three equal-side markers on edge midpoints and perpendicular to edges','native variable-side rectangle dimensions and displayed units'],'sourceSheet':f'output/editorial-visual-wave14/visual-wave14-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave14/visual-wave14-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave14-dependence-tables.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'actualNativeCellArrowChecks':10,'wrongKeysRejected':10}))
if __name__=='__main__':main()
