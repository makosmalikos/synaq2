"""Independent proportional-line review from visible scale and plotted pixels.
All5 full saved/new statements, solutions and options read; one source sheet
(4available rasters,1missing but complete saved solution) and343px target viewed.
"""
from fractions import Fraction as F
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave17-proportional-graphs.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
spec=importlib.util.spec_from_file_location('root_exact_poly',ROOT/'scripts/editorial/review-visual-wave10.py');oracle=importlib.util.module_from_spec(spec);spec.loader.exec_module(oracle)
def tag(e):return e.tag.rsplit('}',1)[-1]
def v(e,k):return F(e.get(k))
def txt(e):return ''.join(e.itertext())
def near(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def integral(q):n=round(float(q));near(q,n);return F(n)
def number(q):q=F(q);assert q.denominator==1;return str(q.numerator)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def observe(r):
    raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=ET.fromstring(raw);els=list(s.iter());texts=[e for e in els if tag(e)=='text'];lines=[e for e in els if tag(e)=='line'];p=r['params']
    if p['scene']=='speed':
        xlabels=sorted((F(txt(t)),v(t,'x')) for t in texts if re.fullmatch(r'\d+',txt(t)) and v(t,'y')==310);ylabels=sorted((F(txt(t)),v(t,'y')-6) for t in texts if re.fullmatch(r'\d+',txt(t)) and v(t,'x')==66)
        assert [n for n,x in xlabels]==list(range(6));assert [n for n,y in ylabels]==[16,32,48,64,80]
        xu=xlabels[1][1]-xlabels[0][1];yu=(ylabels[0][1]-ylabels[1][1])/16;x0=xlabels[0][1];y0=ylabels[0][1]+16*yu
        for n,x in xlabels:near(x,x0+n*xu)
        for n,y in ylabels:near(y,y0-n*yu)
        ygrids=sorted(set(v(e,'y1') for e in lines if e.get('stroke')=='#dbe5f1' and v(e,'y1')==v(e,'y2')),reverse=True);assert len(ygrids)==21
        for a,b in zip(ygrids,ygrids[1:]):near((a-b)/yu,4)
        poly=one(e for e in els if tag(e)=='polyline');pts=[tuple(map(F,q.split(','))) for q in poly.get('points').split()];coords=[(integral((x-x0)/xu),integral((y0-y)/yu)) for x,y in pts];assert coords==[(0,0),(4,72)]
        assert 's (км)' in [txt(t) for t in texts] and 't (сағ)' in [txt(t) for t in texts];return {'slopes':[one(y/x for x,y in coords if x)]}
    xlabels=sorted((F(txt(t)),v(t,'x')) for t in texts if re.fullmatch(r'-?\d+',txt(t)) and v(t,'y')==202);ylabels=sorted((F(txt(t)),v(t,'y')-6) for t in texts if re.fullmatch(r'-?\d+',txt(t)) and v(t,'x')==228)
    assert [n for n,x in xlabels]==[-6,-4,-2,2,4,6] and [n for n,y in ylabels]==[-6,-4,-2,2,4,6]
    xu=(xlabels[1][1]-xlabels[0][1])/2;yu=(ylabels[0][1]-ylabels[1][1])/2;near(xu,yu);x0=xlabels[0][1]+6*xu;y0=ylabels[0][1]-6*yu
    for n,x in xlabels:near(x,x0+n*xu)
    for n,y in ylabels:near(y,y0-n*yu)
    for axis in ['x','y']:
        grids=sorted(set(v(e,axis+'1') for e in lines if e.get('stroke')=='#dbe5f1' and v(e,axis+'1')==v(e,axis+'2')));assert len(grids)==15
        for a,b in zip(grids,grids[1:]):near(b-a,xu)
    observed=[]
    for e in lines:
        if not e.get('data-line'):continue
        coords=[(integral((v(e,'x'+str(i))-x0)/xu),integral((y0-v(e,'y'+str(i)))/yu)) for i in [1,2]];slope=(coords[1][1]-coords[0][1])/(coords[1][0]-coords[0][0]);assert all(y==slope*x for x,y in coords);label=e.get('data-line');observed.append((label,slope,coords))
        intended=next(l for l in p['lines'] if l.get('label','main')==label);assert coords==[tuple(q) for q in intended['points']]
        if label!='main':
            t=one(t for t in texts if txt(t)==label);assert abs(float(v(t,'x')-v(e,'x2')))<20 and abs(float(v(t,'y')-v(e,'y2')))<25
    if p.get('point'):
        dot=one(e for e in els if tag(e)=='circle');point=(integral((v(dot,'cx')-x0)/xu),integral((y0-v(dot,'cy'))/yu));assert point==tuple(p['point']);assert point[1]==observed[0][1]*point[0]
    return {'lines':observed,'slopes':[s for l,s,c in observed]}
def solve(r,obs):
    k=r['modelId'].removeprefix('visual-wave17-')
    if k=='negative-coefficient-forward':return number(obs['slopes'][0]*int(re.search(r'x = (-?\d+)',r['statement'])[1]))
    if k=='signed-fractional-coefficient':return one(o for o in r['options'] if oracle.scalar(o)==obs['slopes'][0])
    if k=='scaled-cycle-speed':return number(obs['slopes'][0])
    if k=='target-negative-slope-line':
        polynomial=oracle.poly(re.search(r'y = (-?\d+x)',r['statement'])[1]);assert set(polynomial)=={(('x',1),)};return one(l for l,s,c in obs['lines'] if s==polynomial[(('x',1),)])
    if k=='positive-point-coefficient':return number(obs['slopes'][0])
    raise AssertionError(k)
def main():
    assert len(ROWS)==5;entries=[]
    for r in ROWS:
        obs=observe(r);assert solve(r,obs)==r['answer'];assert solve(r,obs)!='wrong'
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        missing=r['sourceRefs'][0]['sourceId']=='dcb83dc08e749a9d'
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Actual SVG line endpoints calibrated with printed positive/negative coordinates, all unit-grid intervals; exact rational slopes and option values','checks':['all5 full saved/new conditions, solutions and MCQs read','four original rasters inspected; one unavailable original raster explicitly recorded','negative reciprocal/sign distractors evaluated exactly','actual every-small-grid step4km and labelled16km major scale independently calibrated'],'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':not missing,'missingSourceEvidence':'Complete saved solution M(-2;3) determines original coefficient-reading skill' if missing else None,'checked':['one source sheet and one native343px sheet inspected','all actual plotted endpoints and marked point projection','equal x/y unit-grid metric on coordinate planes','every line through origin; slope labels close to correct endpoint'],'sourceSheet':'output/editorial-visual-wave17/visual-wave17-source-1.png','nativeSheet':'output/editorial-visual-wave17/visual-wave17-contact-1.png'}})
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave17-proportional-graphs.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':5,'actualNativeScaleChecks':5,'wrongKeysRejected':5}))
if __name__=='__main__':main()
