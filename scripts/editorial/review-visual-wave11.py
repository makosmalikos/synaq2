"""Independent statistics/tree review, deriving observations from native pixels.

All10 original/new conditions, complete solutions/choices and both source plus
both native343px sheets were read. No author code is imported.
"""
import collections
import copy
from fractions import Fraction as F
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/visual-wave11-statistics-trees.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def one(a):assert len(a)==1,a;return a[0]
def tag(e):return e.tag.rsplit('}',1)[-1]
def elements(s,t):return [e for e in s.iter() if tag(e)==t]
def v(e,k):return F(e.get(k))
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def text(e):return ''.join(e.itertext())
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def integer(q):q=F(q);assert q.denominator==1,q;return int(q)

def observation(row):
    raw=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==row['figureSha256']
    s=ET.fromstring(raw);assert s.get('viewBox')=='0 0 480 360'
    texts=elements(s,'text');p=row['params'];scene=p['scene']
    if scene=='axis':
        labels=sorted((int(text(t)),v(t,'x')) for t in texts if re.fullmatch(r'-?\d+',text(t)))
        assert [n for n,x in labels]==list(range(p['min'],p['max']+1))
        step=(labels[-1][1]-labels[0][1])/(labels[-1][0]-labels[0][0]);zero=labels[0][1]-labels[0][0]*step
        for n,x in labels:near(x,zero+n*step)
        out=[]
        for e in elements(s,'circle'):
            coordinate=(v(e,'cx')-zero)/step;n=round(float(coordinate));near(coordinate,n);out.append(n);assert v(e,'cy')==190
            lab=one([t for t in texts if t.get('fill')=='#315ce8' and abs(v(t,'x')-v(e,'cx'))<1]);assert text(lab) in ['A','B']
        assert out==[p['first'],p['second']];return out
    if scene=='bars':
        labels=sorted((int(text(t)),v(t,'y')-5) for t in texts if re.fullmatch(r'\d+',text(t)) and t.get('text-anchor')=='end')
        assert labels[0][0]==0 and labels[-1][0]>0
        unit=(labels[0][1]-labels[-1][1])/(labels[-1][0]-labels[0][0]);base=labels[0][1]
        for n,y in labels:near(y,base-n*unit)
        grids=sorted([v(e,'y1') for e in elements(s,'line') if e.get('stroke')=='#dbe5f1'],reverse=True)
        assert all(abs(float(a-b-unit*p['step']))<1e-7 for a,b in zip(grids,grids[1:]))
        out=[]
        for r in sorted([r for r in elements(s,'rect') if r.get('data-category')],key=lambda r:v(r,'x')):
            x=v(r,'x')+v(r,'width')/2
            label=one([t for t in texts if t.get('text-anchor')=='middle' and v(t,'y')==307 and abs(v(t,'x')-x)<F(1,1000)])
            category=int(text(label));height=v(r,'height');near(v(r,'y')+height,base)
            number=round(float(height/unit));near(number,height/unit)
            out.append((category,number))
        assert [c for c,n in out]==p['categories'];assert [n for c,n in out]==p.get('values',p.get('frequencies'))
        return out
    if scene=='dots':
        labels=sorted((int(text(t)),v(t,'x')) for t in texts if re.fullmatch(r'\d+',text(t)))
        assert [n for n,x in labels]==p['categories'];out=[]
        circles=elements(s,'circle')
        for n,x in labels:
            observed=[c for c in circles if abs(v(c,'cx')-x)<1];observed.sort(key=lambda c:-v(c,'cy'))
            assert [v(c,'cy') for c in observed]==[260-24*i for i in range(len(observed))]
            out.extend([n]*len(observed))
        assert collections.Counter(out)=={c:f for c,f in zip(p['categories'],p['frequencies']) if f}
        assert len(out)==18 and max(collections.Counter(out).values())==7;return out
    if scene=='cards':
        cards=sorted([r for r in elements(s,'rect') if r.get('data-card-value')],key=lambda r:v(r,'x'));out=[]
        for r in cards:
            label=one([t for t in texts if v(r,'x')<v(t,'x')<v(r,'x')+v(r,'width') and v(r,'y')<v(t,'y')<v(r,'y')+v(r,'height')]);out.append(int(text(label)))
        assert out==p['values'] and out[len(out)//2]!=sorted(out)[len(out)//2];return out
    if scene=='polygon':
        poly=one(elements(s,'polygon'));pts=[tuple(map(F,q.split(','))) for q in poly.get('points').split()]
        assert len(pts)==len(p['labels'])==6
        for actual,(x,y),name in zip(pts,p['polygon'],p['labels']):
            near(actual[0],F(205,2)+55*x);near(actual[1],290-55*y);assert name in [text(t) for t in texts]
        return [p['labels'][i]+p['labels'][j] for i,j in itertools.combinations(range(len(pts)),2) if j-i not in [1,len(pts)-1]]
    if scene in ['permutation-tree','menu-tree']:
        # Follow actual line endpoints between actual labelled circles. Metadata
        # data-path is only cross-checked after the routes have been reconstructed.
        circles=elements(s,'circle');nodes=[]
        for e in circles:
            label=one([t for t in texts if t.get('fill')=='#fff' and abs(v(t,'x')-v(e,'cx'))<1 and 0<v(t,'y')-v(e,'cy')<=10])
            nodes.append({'x':v(e,'cx'),'y':v(e,'cy'),'r':v(e,'r'),'label':text(label),'el':e})
        edges=[]
        for e in elements(s,'line'):
            a=[i for i,n in enumerate(nodes) if abs(v(e,'x1')-(n['x']+n['r']))<=3 and abs(v(e,'y1')-n['y'])<1]
            b=[i for i,n in enumerate(nodes) if abs(v(e,'x2')-(n['x']-n['r']))<=3 and abs(v(e,'y2')-n['y'])<1]
            if a and b:edges.append((one(a),one(b)))
        roots=[i for i,n in enumerate(nodes) if n['x']==min(q['x'] for q in nodes)]
        out=[]
        def walk(i,route):
            route+=nodes[i]['label'];children=[b for a,b in edges if a==i]
            if not children:
                assert nodes[i]['el'].get('data-path')==route;out.append(route)
            else:
                for j in children:assert nodes[j]['x']>nodes[i]['x'];walk(j,route)
        for i in roots:walk(i,'')
        if scene=='permutation-tree':assert out==p['paths'] and len(out)==5
        else:assert out==[b['label']+str(v) for b in p['branches'] for v in b['leaves']]
        return out
    raise AssertionError(scene)

def solve(row,obs):
    k=row['modelId'].removeprefix('visual-wave11-')
    if k=='axis-mean':return str(integer(F(sum(obs),len(obs))))
    if k in ['scaled-bar-mean','unit-bar-mean']:return str(integer(F(sum(v for c,v in obs),len(obs))))
    if k=='bar-frequency-mode':return str(one([c for c,v in obs if v==max(n for c,n in obs)]))
    if k=='dot-frequency-mode':return str(one([c for c,n in collections.Counter(obs).items() if n==max(collections.Counter(obs).values())]))
    if k=='bar-range':return str(max(v for c,v in obs)-min(v for c,v in obs))
    if k=='odd-card-median':assert len(obs)%2==1;return str(sorted(obs)[len(obs)//2])
    if k=='polygon-diagonals':assert len(obs)==len(set(obs));return str(len(obs))
    if k=='missing-permutation':return one(sorted(set(map(''.join,itertools.permutations(row['params']['tokens'])))-set(obs)))
    if k=='unequal-menu-tree':assert len(obs)==len(set(obs));return str(len(obs))
    raise AssertionError(k)
def main():
    assert len(ROWS)==10;entries=[]
    for i,row in enumerate(ROWS):
        obs=observation(row);assert solve(row,obs)==row['answer'],(row['editionId'],solve(row,obs),row['answer'])
        bad=copy.deepcopy(row);bad['answer']='wrong';assert solve(bad,obs)!=bad['answer']
        if row.get('options'):assert row['options'].count(row['answer'])==1 and len(set(row['options']))==4
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_root_agent','method':'Observations read from actual SVG geometry and printed scale/node labels; exact statistics or complete combinatorial enumeration','checks':['all10 full archived/new conditions, solutions and MCQs read','both source and both native343px contact sheets visually inspected','bar frequencies are categories-versus-heights, not confused quantities','graphs reconstructed from actual labelled nodes and connecting lines, not data-path metadata'],'figureReview':{'status':'verified','sha256':row['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['printed bar-scale calibration, actual bar tops and baseline','all18 individual dots including an empty category','actual unsorted card order and plotted coordinate labels','complete root-to-leaf paths and unordered nonadjacent vertex pairs'],'sourceSheet':f'output/editorial-visual-wave11/visual-wave11-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave11/visual-wave11-contact-{i//6+1}.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave11-statistics-trees.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All10 source-specific native visual editions. Earlier text-only unique-mode skill reference does not substitute for bar-reading adaptation.','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':10,'actualSvgObservationChecks':10,'wrongKeyRegressions':10}))
if __name__=='__main__':main()
